{
	//--------- properties -----------------------------------------------
		// you can access these properties from another app via Myna.loadAppProperties()
	appname:"watchdog",// unique variable name of this application, omit this for anonymous applications
	idleMinutes:60,// Lifetime of Application variable cache
	//--------- app package properties
		displayName:"Myna Watchdog",// "pretty" name used in labels and titles
		description:"",//short description of application
		author:"Mark Porter", //name of app author
		authorEmail:"mark@porterpeople.com",// email of app author
		website:"http://www.mynajs.org",//website associated with this app
		version:"1.1.0", //app version. This should be a dot notation
		minMynaVersion:"1.12.2",// Minimum version of Myna the app might run on
		postInstallUrl:null,// URL that should be visited first after deployment, relative to app install dir
	
	//--------- FlightPath config -----------------------------------------
	config:{
		debug:false,
		//ds:"myna_instance",
		ds:"watchdog",
		homeRoute:{
			controller:"Main",
			action:"index"
		},
		routes:[{
			name:"pages",
			pattern:"page/$page*",
			controller:"page",
			action:"display",
			page:"$page"
		},{
			name:"default",
			pattern:"[$method]$controller/$action/$id/$rest*",
			controller:"$controller",
			action:"$action",
			id:"$id",
			method:"$method",
			extraPath:"$rest"
		}],
		frameworkFolder:$application.directory + "framework",
	},
	//--------- init method ----------------------------------------------
	init:function(){	// this is run before any workflow methods to setup the application.
		var version = $application.version
		var isNewVersion = ($application.get("version") != version)
		if ($application.config.debug || isNewVersion) {
			//remove ORM cache file
			new Myna.File("/WEB-INF/myna/ds_class_cache/" + $application.appname).forceDelete()
			
			// clear cached values
			Myna.Cache.clearByTags($application.appname);
			
			//clear application variables
			$application.reload();
			
			//save curretn version in application cache
			$application.set("version",version)
		}
	},
	
	//--------- workflow methods -----------------------------------------
	onApplicationStart:function(){ // run if application cache has expired
		//$FP =Myna.include(this.config.frameworkFolder+"/FlightPath.sjs",{}).init()
		
		
		
		/*var settings = new Myna.DataManager("myna_instance").getManager("settings").get({
			id:"global",
		}) 
		if (settings.exists){
			if (settings.hostname != $server.hostName) {
			//	Myna.printConsole(settings.hostname)
				$FP.getController("Main")._recreateTables();
			}
		} else {
			settings.setFields({
				hostname:$server.hostName
			})
			settings.save();
		}*/
		/*Myna.Admin.ds.save({
			name:"watchdog",
			url:"jdbc:h2:mem:watchdog;DB_CLOSE_DELAY=-1",
			port:0,
			case_sensitive:0,
			type:"h2",
			driver:"org.h2.Driver"
		})*/
		this.appStart=true;
		new Myna.File("/WEB-INF/classes/cron.properties").appendString("\n")
		Myna.Admin.task.save({
		    "description": "Monitors systems defined in Watchdog",
		    "end_date": null,
		    "interval": 1,
		    "is_active": 1,
		    "name": "Watchdog",
		    "remove_on_expire": 0,
		    "scale": "minutes",
		    "script": $server.serverUrl + $application.url+"main/run_tests?remote=true",
		    "start_date": new Date(),
		    "type": "Simple",
		},true)
		//$FP.getModel("Setting").getSettings()
	},
	onRequestStart:function(){ // run directly before requested file
		
		//new Myna.File("/WEB-INF/myna/ds_class_cache/myna_instance").forceDelete()
		if ($server.requestScriptName == "favicon.ico") {
			$application._onError404()
			Myna.abort()
		}
		var path =$server.requestUrl
			.after($server.currentUrl)
				
		if (path.listFirst("/") == "static"){
			
			var f = new Myna.File(
				$application.directory,
				"app",
				path,
				$server.requestScriptName
			)
			$res.serveFile(f)
			//servFile aborts, this is just a reminder
			Myna.abort();
		}
		//Myna.printConsole("request start")
		$FP =Myna.include(this.config.frameworkFolder+"/FlightPath.sjs",{}).init()
		
		//var db = new Myna.Database("myna_instance")
		if (!Myna.Admin.ds.exists(this.config.ds)){
			Myna.Admin.ds.save({
				name:this.config.ds,
				url:"jdbc:h2:mem:{0};DB_CLOSE_DELAY=-1".format(this.config.ds),
				port:0,
				file:"/WEB-INF/myna/local_databases/",
				server:"",
				case_sensitive:0,
				username:"",
				desc:"Watchdog Memory DB",
				type:"h2",
				location:"file",
				password:"",
				db:"",
				driver:"org.h2.Driver"
			})
		}
		var admins=Myna.Permissions.getUserGroupByName($application.appname,"Administrators")
		if (!admins){
			admins = Myna.Permissions.addUserGroup({
				name:"Administrators",
				appname:$application.appname,
				description:"Admins for Watchdog. Allows login and settings changes"
			})
		}
		if (this.appStart){
			var rightNames = []
			$FP.getControllerNames().forEach(function(name){
				var controller = $FP.getController(name)
			
				controller.getActions().forEach(function(def){
					rightNames.push("{0}.{1}".format(name,def.action))
				})
				
			})
			var rights = rightNames.map(function (name) {
				return Myna.Permissions.addRight({
					name:name,
					appname:$application.appname
				}).id
			})
			admins.addRights(rights)
		}

		var db = new Myna.Database(this.config.ds)
		if (!db.tables.some(function(def){
			return def.table_name.toLowerCase() == "services"
		}) ){
			$FP.getController("Main")._recreateTables();
			try{
				$FP.getController("Service").importJson({
					file:new Myna.File($FP.dir,"services.json")
				});	
			} catch (e){}
		}
		
		
		$FP.handleRequest();
		
	},
	onRequestEnd:function(){ // run directly after requested file
		/* Myna.print(<ejs>
			<hr>
			<%=$profiler.getSummaryHtml()%>
		</ejs>) */
	},
	onSessionStart:function(){ // run before a call to $session.get/set when session is expired 
	
	},
	onError:function(){ //run when an error occurs. Return true to cancel default. 
		
	},
	onError404:function(){ //run when a call to a non-existent file is made. Return true to cancel default.
		
	},
	rights:[], // an array of Myna.Permissions.Right definitions to be created 
}
