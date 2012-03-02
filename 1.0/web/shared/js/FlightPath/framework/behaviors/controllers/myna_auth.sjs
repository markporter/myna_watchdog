/* Class:  Behavior: MynaAuth
	Applies action.controller based authentication and rights checking to controllers.
	
	This behavior uses Myna's centralized authentication and permissions system 
	to authenticate this controller's actions. Each action is treated as a right 
	in the form of "<controllerName>.<actionName>". If the current user is not 
	authenticated, they are sent to Myna's centralized login page and 
	authenticated against one of the defined AuthTypes (see: <AuthAdapters>) 
	
	Parameters:
		whiteList		-	*Optional, default []*
							Array of action names that do not require authentication
		providers		-	*Optional, default <Myna.Permissions.getAuthTypes>*
							Array of provider names (AuthTypes) to make available from authentication,
		redirectParams	-	*Optional, default {}*
							Any extra parameters to <$res.redirectLogin>. 
							This behavior will automatically set the callbackUrl 
							to the originally requested action 
		userFunction	-	*Optional, default $cookie.getAuthUser*
							Function to call to acquire the user to test against 
							permissions. This function will be passed a 
							reference to the controller, and this options object
							
							
	Usage:
	(code)
		// used in a single controller
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
				redirectParams:{},
				userFunction:function(controller,options){
					return controller._getUser()
				}
			})
		}
	(end)
*/

function init(options){
	this.addFilter(this._mynaAuth)
	this._mynaAuth.options = (options||{}).setDefaultProperties({
		whitelist:[],
		anyUserList:[],
		providers:Myna.Permissions.getAuthTypes(),
		redirectParams:{}
	})
	this._mynaAuth.options.redirectParams.setDefaultProperties({
		providers:this._mynaAuth.options.providers,
	})
	
}

function _mynaAuth(action, params){
	var my = arguments.callee;
	if (!my.options.userFunction) my.options.userFunction = $cookie.getAuthUser;
	var right = this.name + "." + action;
	var isWhitelisted = my.options.whitelist.some(function(item){
		if (!(item instanceof RegExp)){
			item = new RegExp("^" +String(item).replace(/\./,"\\.") +"$")
		}
		return item.test(right) 	
	})
	
	if (!isWhitelisted){
		var user = my.options.userFunction(this,my.options);
		//Myna.log("debug","User = " + user.first_name + " " + user.last_name);
		if (!user){
			if ($FP.config.debug){
				Myna.log(
					"debug",
					"Action " + right + " not whitelisted, redirecting to login",
					Myna.dump(my.options.whitelist, "MynaAuth whitelist")
				);	
			}
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
			var isAnyUser = my.options.anyUserList.some(function(item){
				if (!(item instanceof RegExp)){
					item = new RegExp("^" +String(item).replace(/\./,"\\.") +"$")
				}
				return item.test(right) 	
			})
			
			if (!isAnyUser){
				var appname= $application.appname;
					
				var all_rights=Myna.Permissions.getRightsByAppname(appname)
						
				if (!all_rights.containsByCol("name",right)){
					Myna.Permissions.addRight({
						name:right,
						appname:appname
					})
				}
				
				if (user.hasRight(appname,right)) return;
				if ($FP.config.debug){
					Myna.log(
						"debug",
						"Auth fail for Action " + right + ", User " + user.first_name +" "+ user.last_name,
						Myna.dump(my.options.whitelist, "MynaAuth whitelist")
					);	
				}
				if (user.hasRight(appname,"full_admin_access")) return;
				if (user.hasRight("myna_admin","full_admin_access")) return;
			
				
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
}