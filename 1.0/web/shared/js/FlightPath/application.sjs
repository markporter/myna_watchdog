{
	//--------- properties -----------------------------------------------
		// you can access these properties from another app via Myna.loadAppProperties()
	appname:"flight_path_app",// unique variable name of this application, omit this for anonymous applications
	idleMinutes:60,// Lifetime of Application variable cache
	//--------- app package properties
		displayName:"",// "pretty" name used in labels and titles
		description:<ejs>
		
		</ejs>,//short description of application
		author:"", //name of app author
		authorEmail:"",// email of app author
		website:"",//website associated with this app
		version:"", //app version. This should be a dot notation
		minMynaVersion:null,// Minimum version of Myna the app might run on
		postInstallUrl:null,// URL that should be visited first after deployment, relative to app install dir
	
	//--------- FlightPath config -----------------------------------------
	config:{
		//set this to false in production.
		debug:$server.purpose.toLowerCase() == "dev", 
		ds:{
			/*set this for automatic model generation*/
			
			//"default":"a Myna datasource name",
			
			/*Extra alias to other datasources can be defined, use this alias 
			name in you model to reference*/
			
			//"MyAlias":"some_other_datasource",
			
		},
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
		//frameworkFolder:"/shared/js/FlightPath/framework",
		MyCustomProperty:"woot!"
	},
	//--------- init method ----------------------------------------------
	init:function(){	// this is run before any workflow methods to setup the application.
	
	},
	
	//--------- workflow methods -----------------------------------------
	onApplicationStart:function(){ // run if application cache has expired
		
	},
	onRequestStart:function(){ // run directly before requested file
		/* Example of changing ds based on server purpose */
		/*
		
		if ($server.purpose.toLowerCase() != "prod"){
			this.config.ds["default"] +="_"+$server.purpose.toLowerCase() 	
		}
		
		*/
		Myna.include(this.config.frameworkFolder+"/FlightPath.sjs",{}).init().handleRequest();
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
