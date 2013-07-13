/* Topic:  MynaAuth
	Applies action.controller based authentication and rights checking to controllers
	
	Usage:
	(code)
		// used in a single contoller
		//main_controller.sjs
		function init(){
			this.applyBehavior("MynaAuth",{
				whitelist:[
					"logout",
					"dashbord",
					/^rpt/
				],
				providers:Myna.Permissions.getAuthTypes(),//this is default
				redirectParams:{}//this is default
			})
		}
		
		// used in the global controller
		//app/controllers/global.sjs
		function init(){
			this.applyBehavior("MynaAuth",{
				whitelist:[
					"Main.logout",
					"Main.dashbord",
					/^Public\./
				],
				providers:Myna.Permissions.getAuthTypes(),
				redirectParams:{}
			})
		}
	(end)
*/

function init(options){
	this.addFilter(this._mynaAuth)
	this._mynaAuth.options = (options||{}).setDefaultProperties({
		whitelist:[],
		providers:Myna.Permissions.getAuthTypes(),
		redirectParams:{}
	})
}

function _mynaAuth(action, params){
	
	var my = arguments.callee;
	var right = this.name + "." + action;
	var isWhitelisted = my.options.whitelist.some(function(item){
		if (!(item instanceof RegExp)){
			item = new RegExp(String(item).replace(/\./,"\\."))
		}
		return item.test() 	
	})
	
	if (!isWhitelisted){
		var user = $cookie.getAuthUser();
		if (!user){
			var redirectParams = ({
				callbackUrl:$FP.helpers.Html.url({
					controller:this.name,
					action:action,
					id:params.id,
					params:params
				})
				
			}).setDefaultProperties(my.options.redirectParams)
			$res.redirectLogin(redirectParams)
			//unnecessary, but good practice
			return false; //cancels action
		} else {
			
			var appname= $application.appname;
				
			var all_rights=Myna.Permissions.getRightsByAppname(appname)
					
			if (!all_rights.containsByCol("name",right)){
				Myna.Permissions.addRight({
					name:right,
					appname:appname
				})
			}
			if (user.hasRight(appname,right)) return;
			if (user.hasRight(appname,"full_admin_access")) return;
		
			
			//if we got here shouldn't have
			Myna.log(
				"auth",
				<ejs>
					User '<%=user.first_name%> <%=user.last_name%>' does not have access to <%=right%>
				</ejs>
			);
			throw new Error("You do not have access to that feature")
		}
	}
}