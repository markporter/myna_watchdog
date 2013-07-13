{
	//--------- properties -----------------------------------------------
	appName:"myna_permissions",
	prettyName:"Permissions",
	
	//--------- local properties -----------------------------------------
	noAuthFuses:["login","logout","auth"],
	defaultFuseAction:"main",
	mainFuseAction:"main",
	appDir:$server.requestDir,
	ds:"myna_permissions",

	//--------- init method ----------------------------------------------
	init:function(){		// this is run before any workflow methods to setup the application.

	},

	//--------- workflow methods -----------------------------------------
	onApplicationStart:function(){ // run if application cache has expired

	},
	onRequestStart:function(){ // run directly before requested file
		$server.globalScope.ds = $application.ds;
		$server.globalScope.db = new Myna.Database(ds);
		$application.dm = new Myna.DataManager($application.ds);
		$server.globalScope.dm = $application.dm;
		dm.managerTemplate.genKey= function(){
			return Myna.createUuid();
		}
	},
	onRequestEnd:function(){ // run directly after requested file

	},
	onSessionStart:function(){ // run before a call to $session.get/set when session is expired

	},
	onError:function(){ //run when an error occurs. Return true to cancel default.

	},
	onError404:function(){ //run when a call to a non-existent file is made. Return true to cancel default.

	},
	rights:[], // an array of Myna.Permissions.Right definitions to be created
}







