{
	//--------- properties -----------------------------------------------
	appname:"db_manager",
	display_name:"Myna Database Manager",
	description:"",
	//--------- local properties -----------------------------------------
	prettyName:"Myna Database Manager",
	noAuthFuses:["login","auth","main","logout"],
	defaultFuseAction:"main",
	mainFuseAction:"main",

	//--------- init method ----------------------------------------------
	init:function(){		// this is run before any workflow methods to setup the application.

	},

	//--------- workflow methods -----------------------------------------
	// Each workflow method is appended to the same named method in the
	// parent application. If you need to override the parent functions
	// or prepend instead of append, use init()
	//
	onApplicationStart:function(){ // run if application cache has expired
		Myna.applyTo($server.globalScope);
		var propFiles = new File("/shared/js/libOO/db_properties").listFiles("sjs");
		var props={}
		
		propFiles.forEach(function(propFile){
			if (!/[\w]+.sjs$/.test(propFile.getFileName())) return;
			var vendor = propFile.getFileName().split(/\./)[0];
			var obj={};
			include(propFile,obj);
			if (obj.templates){
				props[vendor] = {
					templates:obj.templates,
					types:obj.types,
				}
			}
		});
		$application.set("db_properties",props);	
	},
	onRequestStart:function(){ // run directly before requested file
		Myna.applyTo($server.globalScope);
	},
	onRequestEnd:function(){ // run directly after requested file

	},
	onSessionStart:function(){ // run before a call to $session.get/set when session is expired

	},
	onError:function(exception){
		Myna.applyTo($server.globalScope);
		var detail = "";
		
		if (exception.message) detail += "<b>Error:</b> " +exception.message;
		if (exception.getMessage) detail += "<b>Error:</b> " +exception.getMessage();
		
		if (exception.fileName) detail += "<br><b>File:</b> " +exception.fileName;
		if (exception.lineNumber) detail += "<br><b>Line:</b> " +exception.lineNumber;
		
		print({
			success:false,
			errorMsg:"An error occured on the server:",
			errorDetail:Myna.formatError(exception)
		}.toJson());	
		return true; //cancel standard onError handler
	},
	onError404:function(){ //run when	a call to a non-existent file is made

	},
	rights:[], // an array of Myna.Permissions.Right definitions to be created
}



