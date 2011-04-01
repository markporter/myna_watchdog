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
	"KeyStore.sjs",
	"DataSet.js",
	"Cache.sjs",
	"JavaUtils.sjs",
	"Profiler.js",
	"Query.sjs",
	"File.sjs",
	"CommonJS.sjs",
	"Ldap.sjs",
	"ValidationResult.js",
	"DataManager.sjs",
	"Database.sjs",
	"Table.sjs",
	"Thread.sjs",
	"Mail.sjs",
	"HttpConnection.sjs",
	"WebService.sjs",
	"Permissions.sjs",
	"Event.sjs",
	"Cluster.sjs",
	"Swing.sjs",
	
].forEach(function(element){
	try {
		var path = $server_gateway.getNormalizedPath(element);
	
		$server_gateway.includeOnce(path);
	} catch(e){
		java.lang.System.err.println("libOO.sjs Error: " +e)
		$server_gateway.log("ERROR",String(e).left(100),Myna?Myna.formatError(e):String(e))
	}
});

