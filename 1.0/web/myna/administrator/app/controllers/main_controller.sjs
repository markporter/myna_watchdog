/*jshint unused:false*/
/*global
	$FP:false
	Myna:false
	$application:false
*/
/* Function: init
	*/
	function init(){
		this.addFilter(
			function(){
				var props=Myna.getGeneralProperties();
				if (!props.admin_password){
					$FP.redirectTo({
						action:"changeAdminPassword"
					});
					//unnecessary, because redirectTo halts processing, but good practice
					return false; //cancels action
				}
			},
			{
				except:["changeAdminPassword","saveAdminPassword"]
			}
		);
		
		
		
		
	}

/* Function: index
	ExtJs main page for administrator
	*/
	function index(params){
		if (params.redirect){
			$FP.redirectTo({})
		}
		this.$page.css =this.$page.css.concat([
			"extjs/resources/css/ext-all.css",
			"default.css"
		]);
		this.$page.scripts =this.$page.scripts.concat([
			"extjs/ext-all.js",
			"app/SupaGrid.js",
			"app/quickdrop.js",
			"app/Notification.js",
			$FP.helpers.Html.url({
				controller:"Direct",
				action:"api",
				params:{
					callback:"Ext.Direct.addProvider",
					namespace:"$FP"
				}
			}),
			$FP.helpers.Html.url({
				action:"loadModels"
			})
		]);
		var latestVersion = new Myna.Cache({
			name:"myna_downloads_atom_feed",
			refreshInterval:Date.getInterval(Date.HOUR,1),
			code:function getLatestVersion(){
				var con = new Myna.HttpConnection({
					url:"http://code.google.com/feeds/p/myna/downloads/basic",
					method:"GET"
				});
				con.connect();
				var xml=con.getResponseXml();
				default xml namespace = xml.namespace();
				var node = Array.parse(xml.entry).first();
				return node.id.toString().listLast("/").listBefore(".");
			}
		}).call();
		
		var props=Myna.getGeneralProperties();
		this.set("globalProperties",{
			title:this.$page.title=String(props.instance_id + "/" + props.instance_purpose + " on " + $server.hostName),
			dbProperties:$application.get("db_properties"),
			instance_id:props.instance_id,
			instance_purpose:props.instance_purpose,
			hostName:$server.hostName,
			appUrl:$FP.url,
			rootUrl:$server.rootUrl,
			version:$server.version,
			latestVersion:latestVersion||""
		})
		
	}
/* Function: logout
	Clears session and current user, then redirects to index (which should 
	redirect to login)
	*/
	function logout(params){
		$session.clear()
		$cookie.clearAuthUserId()
	}
	
/* Function:  */
function extLoad(params){
	this.setLayout(false)
	switch(params.type){
		case "model":
			
			var modelName =this.set("modelName", params.src.listFirst("."))
			this.set("model",$FP.getModel(modelName));
			
			this.render("main/model_template")
		break;
	}
}

/* Function: loadModels
	Returns the ExtJS models as application/javascript. Called from the browser.
	loaded in action "index"
	*/
	function loadModels(params){
		var c = this;
		var content =[
			"Ds",
			"Cron",
			"Log",
			"Request",
			"User"
		].map(function(modelName){
			return c.getElement("model_template",{
				modelName:modelName,
				model:$FP.getModel(modelName),
				controller:$FP.getController(modelName)
			}) 
				
		})
		this.renderContent(content.join('\n'),"application/javascript")
	}
/* Function: manageDb
	Redirects to the db_manager app
	*/
	function manageDb(params){
		$res.redirectWithToken($server.rootUrl+"myna/db_manager/index.sjs?fuseaction=main&ds=" + params.id)
	}
/* Function: managePerms
	Redirects to the permissions app
	*/
	function managePerms(params){
		$res.redirectWithToken($server.rootUrl+"myna/permissions/index.ejs")
	}
/* Function: changeAdminPassword
	Changes the admin password

	This action is used for both displaying the dialog page, and for handling 
	the save of a new password
	*/
	function changeAdminPassword(params){
		var props=Myna.getGeneralProperties();
		
		this.set("authCodeRequired",true)
		/*
		Password does not exist, generate auth code, and require auth code to 
		reset
		*/
		if (!props.admin_password){
			
			var authFile =new Myna.File("/WEB-INF/myna/admin_auth_code")
			if (
				!authFile.exists() 
				|| authFile.lastModified.add(Date.MINUTE,4) < new Date()
			) {
				authFile.writeString(
					Myna.createUuid().hashCode().toString().replace(/\-/,"1")
				);
			}
			
		}

		this.set("authCodeRequired",!props.admin_password)
		this.$page.title="Change Myna Admin Password"
	}	
/* Function: saveAdminPassword
	saves a new admin password

	Parameters:
		password$array	-	array of password inputs. Must match
		authCode		-	Only needed when no existing password  
		existingPwd		-	Only needed when a password exists
	*/
	function saveAdminPassword(params) {
		var props=Myna.getGeneralProperties();
		var resetStatus =$server.get("_MYNA_ADMIN_PWD_RESET_") ||{
			count:-1,
			ts:new Date()
		}
		var authFile =new Myna.File("/WEB-INF/myna/admin_auth_code")

		
		//try to wreck automated attacks
			resetStatus.ts=new Date();
			resetStatus.count++;			

			// check old auth code
			if (
				!props.admin_password 
				&& (
					!authFile.exists() 
					|| authFile.lastModified.add(Date.MINUTE,4) < new Date()
				) 
			){
				$flash.set("error","Auth code is too old. Please try again.");
				$FP.redirectTo({action:"changeAdminPassword"})
			}

			//reset lockout after 1 minute of inactivity
			if (resetStatus.ts.add(Date.MINUTE,1) < new Date()){//reset lockout
				resetStatus.count=0;
			}

			//Myna.printConsole(Myna.dumpText(resetStatus));	
			//progressive timeout
			Myna.sleep(Date.getInterval(Date.SECOND,5) * resetStatus.count);
		
		try{
			if (props.admin_password && ! params.existingPwd.hashEquals(props.admin_password)){
				Myna.log("error","Myna Admin password reset: failed existing pwd",Myna.dump($req.headers,"Request headers"));			
				$flash.set("error","Wrong Admin Password. Please try again.");
				$FP.redirectTo({action:"changeAdminPassword"})
			}

			if (!props.admin_password && params.authCode != authFile.readString()){
				Myna.log("error","Myna Admin password reset: failed authCode",Myna.dump($req.headers,"Request headers"));			
				$flash.set("error","Wrong Auth Code. Please try again.");
				$FP.redirectTo({action:"changeAdminPassword"})
			}

			//reset count on success
			resetStatus.count=0;

			//check lockout
			if (resetStatus.count >= 3){
				$flash.set("error","Too many reset attempts. Please try again in a few minutes");
				$FP.redirectTo({action:"changeAdminPassword"})
			}			

			if (params.password$array && params.password$array.length  == 2){
				if (params.password$array[0] != params.password$array[1])
				{
					$flash.set("error","Passwords do not match, please try again.");
					$FP.redirectTo({action:"changeAdminPassword"})
				} else if (params.password$array[0].length < 12){
					$flash.set("error","Passwords must be at least 12 characters long. Please try again.");
					$FP.redirectTo({action:"changeAdminPassword"})
				} else{
					props = Myna.getGeneralProperties();
					$server_gateway.generalProperties.setProperty("admin_password",params.password$array[0].toHash());
					$server_gateway.saveGeneralProperties();
					$FP.redirectTo({action:"index"})
				}
			}
		} catch(e if !/_ABORT_/.test(e.message)){
			Myna.log("error","Myna_admin password reset error",Myna.formatError(e));
			$flash.set("error","Unknown Error. Please try again.");
			$FP.redirectTo({action:"changeAdminPassword"})
		} finally{

			$server.set("_MYNA_ADMIN_PWD_RESET_",resetStatus)
		}
	}
/* Function: updateFpApp
	Adds or updates a Myna.FlightPath directory

	Parameters:
		
	*/
	function updateFpApp(params) {
		var targetDir = new Myna.File($server.rootDir,params.path)
		
		var fpDir = new Myna.File("/shared/js/FlightPath");
		var frameworkDir = new Myna.File(fpDir,"framework");
		if (targetDir.exists()){
			if (new Myna.File(targetDir,"app").exists()){
				frameworkDir.copyTo(new Myna.File(targetDir,"framework"))
			} else {
				fpDir.copyTo(targetDir)
			}
			return {message:"FlightPath app in {0} Updated.".format(params.path)}
		} else {
			fpDir.copyTo(targetDir)	
			return {message:"FlightPath installed. Be sure to edit " + params.path +"/application.sjs \nto customize this app"}
		}
	}
function test(){
	//$server.set("$FP","")
	if (!$server.get("$FP")) $server.set("$FP",$server.reParent($FP))
	//org.mozilla.javascript.ScriptableObject.putProperty($server_gateway.threadScope,"fp",$server.get("$FP")) ;
	//var fp = $server_gateway.threadContext.newObject($server.get("$FP")) ;
	//Myna.printDump(fp)
	//fp.__parent__ = $server_gateway.threadScope
	var fp = $server.get("$FP")
		 
	Myna.printDump(fp.__parent__.getProperties())
	Myna.printDump($FP.__parent__.getProperties())
	var l=fp.getModel("Log")
	Myna.printDump(l.findBeans({select:"log_id,label"},{
		maxRows:10
	}))
	Myna.abort("")
}