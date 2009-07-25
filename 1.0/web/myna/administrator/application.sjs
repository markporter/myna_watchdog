Myna.applyTo(this);


$application.appName = "myna_admin";
$application.prettyName = "Myna Adminstrator";
$application.noAuthFuses=["login","auth"];
$application.defaultFuseAction="login";
$application.mainFuseAction="main";
$application.extUrl =$server.rootUrl +"shared/js/ext_latest/"


$application.onError=function(exception){
	if ($req.returningJson){
		var detail = "";
		try {
			if (exception.message) detail += "<b>Error:</b> " +exception.message;
			if (exception.getMessage) detail += "<b>Error:</b> " +exception.getMessage();
			
			if (exception.fileName) detail += "<br><b>File:</b> " +exception.fileName;
			if (exception.lineNumber) detail += "<br><b>Line:</b> " +exception.lineNumber;
		} catch(e){
			detail = Myna.formatError(exception);
		}
		
		print({
			success:false,
			errorMsg:"An error occured on the server:",
			errorDetail:detail
		}.toJson());
		//return true;
	} else {
		$res.print(Myna.formatError(exception))	
	}
	
}


//append request start function
$application.appendFunction("onRequestStart",function(){
	var session_cookie;		// stores encrypted session data
	
	if (!$req.data.fuseaction) $req.data.fuseaction=this.defaultFuseAction; 
	//is the user authenticated?	
	if ( !$cookie.getAuthUserId() ){
		if (this.noAuthFuses.indexOf($req.data.fuseaction.toLowerCase()) != -1){
			return;	
		} else {
			/* 	if the fuseaction requires authentication, 
				but the user is not authenticated, then set
				the fuseaction to the default (login)
			*/
			$req.data.fuseaction=this.defaultFuseAction;
		}
	}
});

/* onApplicationStart */
$application.onApplicationStart=function(){
	var props =new File("/WEB-INF/classes/cron.properties") 
	if (!props.exists()){
		props.writeString("")
	}
}

var sessionSecret = "JZjpakgm1lCYI1x7MHZPGATcH3A06ONM";
/* Load datasource driver properties */
if (!$application.get("db_properties")){
	var propFiles = new File("/shared/js/libOO/db_properties").listFiles("sjs");
	var props={}
	
	propFiles.forEach(function(propFile){
		if (!/[\w]+.sjs$/.test(propFile.getFileName())) return;
		var vendor = propFile.getFileName().split(/\./)[0];
		var obj={};
		include(propFile,obj);
		if (obj.dsInfo){
			props[vendor] = obj.dsInfo;
		}
	});
	$application.set("db_properties",props);
}