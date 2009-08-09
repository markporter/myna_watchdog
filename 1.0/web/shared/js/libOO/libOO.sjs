[
	"Number.js",
	"Array.js",
	"ObjectLib.js",
	"Object.js",
	"String.js",
	"Date.js",
	"Function.js",
	"Template.sjs",
	"Myna.sjs",
	"DataSet.sjs",
	"JavaUtils.sjs",
	"Profiler.js",
	"Query.sjs",
	"File.sjs",
	"Ldap.sjs",
	"ValidationResult.js",
	"DataManager.sjs",
	"Database.sjs",
	"Table.sjs",
	"Thread.sjs",
	"Mail.sjs",
	"HttpConnection.sjs",
	"WebService.sjs",
	"Permissions.sjs"
	
].forEach(function(element){
	try {
		var path = $server_gateway.getNormalizedPath(element);
	
		$server_gateway.includeOnce(path);
	} catch(e){
		java.lang.System.out.println(e)
		$server_gateway.log("ERROR",String(e).left(100),Myna?Myna.formatError(e):String(e))
	}
});

