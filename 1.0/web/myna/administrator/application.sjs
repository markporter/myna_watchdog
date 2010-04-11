{
	appname:"myna_admin",
	prettyName:"Myna Adminstrator",
	displayName:"Myna Adminstrator",
	description:"Manages Myna server settings.",
	noAuthFuses:["login","auth", "logout"],
	defaultFuseAction:"login",
	mainFuseAction:"main",
	init:function(){
		//this is moved to the parent folder's application.sjs
		//$application.extUrl =$server.rootUrl +"shared/../myna/ext/"
	},
	onRequestStart:function(){
		Myna.applyTo($server.globalScope);
		var session_cookie;		// stores encrypted session data
		
		if (!$req.data.fuseaction) $req.data.fuseaction=this.defaultFuseAction; 
		//is the user authenticated?
		if (this.noAuthFuses.indexOf($req.data.fuseaction.toLowerCase()) != -1) return;	
		if ( !$cookie.getAuthUserId() ){
				/* 	if the fuseaction requires authentication, 
					but the user is not authenticated, then set
					the fuseaction to the default (login)
				*/
				$req.data.fuseaction=this.defaultFuseAction;
			
		} else { //is the the user authorized for this fuseaction?
			if ($cookie.getAuthUserId() == "myna_admin") return;
			
			var user = $cookie.getAuthUser();
			if (user.hasRight("myna_admin","full_admin_access")) return;
			
			$req.data.fuseaction="no_access";
			throw new Error("You do not have access to that feature")
			
		}
		
		
	},
	onApplicationStart:function(){
		Myna.applyTo($server.globalScope);
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
	rights:[{
		name:"full_admin_access",
		description:"Full access to all Administrator functions"
	}]
}



		