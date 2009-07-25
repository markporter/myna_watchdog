Myna.applyTo(this);


$application.appName = "db_manager";
$application.prettyName = "Myna Database Manager";
$application.noAuthFuses=["login","auth","main","logout"];
$application.defaultFuseAction="main";
$application.mainFuseAction="main";
$application.extUrl =$server.rootUrl +"shared/js/ext_latest/"

/* Load datasource driver properties */
	if (!$application.get("db_properties")){
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
}

/* onerror */
	$application.onError=function(exception){
		
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
	}




