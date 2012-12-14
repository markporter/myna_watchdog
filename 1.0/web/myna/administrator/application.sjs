{
	//--------- properties -----------------------------------------------
		// you can access these properties from another app via Myna.loadAppProperties()
	appname:"myna_admin",// unique variable name of this application, omit this for anonymous applications
	idleMinutes:60,// Lifetime of Application variable cache
	//--------- app package properties
		displayName:"Myna Administrator",
		description:<ejs>
			Manages Myna server settings.
		</ejs>.trim(),
		author:"Mark Porter",
		authorEmail:"mark@porterpeople.com",
		website:"http://www.mynajs.org",
		version:Myna.getGeneralProperties().version, //always based on current Myna build
		minMynaVersion:null,// Minimum version of Myna the app might run on
		postInstallUrl:null,// URL that should be visited first after deployment, relative to app install dir
	
	//--------- FlightPath config -----------------------------------------
	config:{
		debug:false,
		homeRoute:{
			controller:"Main",
			action:"index"
		},
		ds:{
			log:"myna_log",
			instance:"myna_instance",
			perms:"myna_permissions"
		},
		routes:[{
			name:"pages",
			pattern:"page/$page",
			controller:"page",
			action:"display",
			page:"$page"
		},{
			name:"extload",
			pattern:"main/ext_load/$cls/$type/$src",
			controller:"main",
			action:"ext_load",
			type:"$type",
			cls:"$cls",
			src:"$src"
		},{
			name:"default",
			pattern:"[$method]$controller/$action/$id/$rest*",
			controller:"$controller",
			action:"$action",
			id:"$id",
			method:"$method",
			extraPath:"$rest"
		}],
		frameworkFolder:"/shared/js/FlightPath/framework",
	},
	//--------- init method ----------------------------------------------
	init:function(){	// this is run before any workflow methods to setup the application.
	
	},
	
	//--------- workflow methods -----------------------------------------
	onApplicationStart:function(){
		var props =new Myna.File("/WEB-INF/classes/cron.properties") 
		if (!props.exists()){
			props.writeString("")
		}
	
		/* Load datasource driver properties */
		var propFiles = new Myna.File("/shared/js/libOO/db_properties").listFiles("sjs");
		var db_props={}
		
		propFiles.forEach(function(propFile){
			if (!/[\w]+.sjs$/.test(propFile.getFileName())) return;
			var vendor = propFile.getFileName().split(/\./)[0];
			var obj={};
			Myna.include(propFile,obj);
			if (obj.dsInfo){
				db_props[vendor] = obj.dsInfo;
			}
		});
		$application.set("db_properties",db_props);
		
	},
	onRequestStart:function(){ // run directly before requested file
		/* Example of changing ds based on server purpose */
		/*
		
		if ($server.purpose.toLowerCase() != "prod"){
			this.config.ds["default"] +="_"+$server.purpose.toLowerCase() 	
		}
		
		*/
		var version = $application.version
		var isNewVersion = ($application.get("version") != version)
		
		if ($application.config.debug || isNewVersion) {
			//remove ORM cache file
			new Myna.File("/WEB-INF/myna/ds_class_cache/" + $application.config.ds["default"]).forceDelete()	
			
			// clear cached values
			Myna.Cache.clearByTags($application.appname);
			
			//clear application variables
			$application.reload();
			
			//save curretn version in application cache
			$application.set("version",version)
		}
		
		var path =$server.requestUrl
				.after($server.currentUrl)
					
		//if (path.listFirst("/") != "static"){
			Myna.include($application.config.frameworkFolder+"/FlightPath.sjs",{}).init().handleRequest();
		//}
		
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
