$application.appName = "myna_permissions";
$application.prettyName = "Permissions";
$application.noAuthFuses=["login","logout","auth"];
$application.defaultFuseAction="main";
$application.mainFuseAction="main";
$application.extUrl =$server.rootUrl+"shared/js/ext_latest/"
$application.appDir =$server.requestDir;
$application.ds ="myna_permissions"


var ds = $application.ds;
var db = new Myna.Database(ds);
$application.dm = new Myna.DataManager($application.ds);
var dm = $application.dm;
dm.managerTemplate.genKey= function(){
	return Myna.createUuid();
}


/* prevent access to any file other than the index */
/* if (!"nagios_config.sjs,index.ejs,autogen.sjs,import_hosts.sjs".listContains($server.requestScriptName)){
	
	$res.setHeader("Location","index.ejs")
	$res.setStatusCode(302);
	Myna.abort();
} */


