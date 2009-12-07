/* 	Class:  $server
	Global object that stores information about the server environment.
*/
var $server={
	
/* property: isThread
	true if this is an independent thread with no access to session or servlet 
	*/
	get isThread(){return !!$server_gateway.environment.get("threadFunctionSource") },

/* property: threadFunctionSource
	the source of the function that the current subthread is executing, or null 
	if this is not a subthread 
	*/
	get threadFunctionSource(){return $server_gateway.environment.get("threadFunctionSource") },
	
	
/* property: instance_id 
	an identifier for this server instance 
	*/
	get instance_id(){return String($server_gateway.generalProperties.getProperty("instance_id"))},
/* property: purpose 
	A short name that describes the purpose of this instance. Set in General 
	Settings of Myna Administrator
	*/
	get purpose(){return String($server_gateway.generalProperties.getProperty("instance_purpose"))},	
/* 	property: response
		A reference to servlet response object
	*/	
	get response(){return $server_gateway.environment.get("response")},
/* 	property: request
		A reference the servlet request object.  
	*/
	get request(){return $server_gateway.environment.get("request")},
/* 	property: requestScriptName
		The name of the originally requested script.
		
		Example:
		> index.sjs
	*/	
	get requestScriptName(){ return String($server_gateway.requestScriptName)},
/* 	property: serverUrl
		The the server name and protocol of the request
		
		Example:
		> http://localhost:8080
		
		Note:
			If Myna is behind a proxy you will want to make sure that the 
			X-Forwarded-Host and optionally X-Forwarded-Proto request headers 
			are set by the proxy so that a valid result is generated 
		
		See:
			* <$server.rootUrl>
			* <$server.currentUrl>
			* <$server.scriptName>
			* <$server.requestScriptName>
	*/
	get serverUrl(){
		if (!$server.request) return "";
		if ($req.headers.getKeys().join().listContains("X-Forwarded-Host")){
				
			var proto = "http";
			if ("X-Forwarded-Proto" in $req.headers){
				proto = $req.headers["X-Forwarded-Proto"][0];
			}
			return proto+"://"+$req.headers["X-Forwarded-Host"][0]		
		} else {
			var URL = String($server_gateway.environment.get("requestURL"));
			var URI = String($server_gateway.environment.get("requestURI"));
			//return URL + ":" +URI;
			return URL.left(URL.length-URI.length);
		}
	},
/* 	property: remoteAddr
		The IP address of the requestor
		
		Example:
		> 123.345.678.910
		
		Detail:
			This is normally the IP address of the request. If the X-Forwarded-For
			header is set, then that IP address is returned instead
	*/
	get remoteAddr(){
		if ($server.isThread) return "localhost/Thread";
		if (!("request" in $server) || !$server.request) return "unknown";		
		var ip =String($server.request.getRemoteAddr());
		if ("X-Forwarded-For" in $req.headers){
			ip = String($req.headers["X-Forwarded-For"][0])
		}
		return ip;
	},
/* 	property: requestServerUrl
		*DEPRECATED* see  <$server.serverUrl>
	*/	
	get requestServerUrl(){
		//Myna.log("WARNING","Deprecated property 'requestServerUrl' called.",Myna.dump($req.data));
		return $server.serverUrl
	},
/* 	property: requestDir
		<MynaPath> representing the directory of the originally requested script.
		
		Example:
		> file:/usr/share/tomcat/webapps/myna/myna/administrator/
	*/
	get requestDir(){ return String($server_gateway.requestDir)},
	
/* property: requestUrl
			URL Path representing the directory of the originally requested script.
		  
			Example:
			> /myna/myna/administrator/
	  */
	  get requestUrl(){
			if (!$server.request) return "";
			var cPath = String($server_gateway.environment.get("requestURI"));
			if (cPath.charAt(cPath.length-1) == "/") return cPath;
			return String(cPath.substring(0, cPath.length - $server.requestScriptName.length))
	  },
/* property: resolveUrl
			takes a url path relative to the request directory and returns an 
			absolute URL, including the server part.
		  
			Partameters:
				path					-	a url path relative to the request directory
				 
			Example:
			> //return full URL to this page
			> var linkUrl = $server.resolveUrl($server.requestScriptName);
	  */
	  resolveUrl:function(path){
			if (!path) throw new Error("'path' is required");
			if (/^\//.test(path)) path = $server.serverUrl +path;
			//echo back if URL is absolute
			if (/^http/.test(path)) return path;
			return new java.net.URI(
				$server.serverUrl +
				$server.requestUrl +
				path
			).normalize().toString();
	  },
/* 	property: rootDir
	<MynaPath> representing the Myna root directory.
	
	Example:
	> file:/usr/share/tomcat/webapps/myna/
	*/
	get rootDir(){return String($server_gateway.rootDir)},
/* 	property: rootUrl
	URL Path representing the Myna root directory.
	
	Example:
	> /myna/
	*/	
	get rootUrl(){return String($server_gateway.rootUrl)},

/* 	property: currentDir
	<MynaPath> representing the directory of the currently executing script.
	
	Example:
	> file:/usr/share/tomcat/webapps/myna/myna/administrator/views/
	*/
	get currentDir(){ return String($server_gateway.currentDir)},
/* 	property: currentUrl
	URL Path representing the directory of the currently executing script
	
	Example:
	> /<context root>/myna/administrator/views/
	*/
	get currentUrl(){ 
		var cPath = $server.currentDir;
		
		return String($server.rootUrl + cPath.substring($server.rootDir.length));
	},
/* 	property: globalScope
	A reference to the Top Level Javascript scope in the current script  
	
	Detail:
		A reference to the Top Level Javascript scope in the current script. 
		This analogous to "window" in a browser environment.  
	
	*/
	get globalScope(){return $server_gateway.threadScope},

/* 	property: servlet
	Reference to the servlet object. 
	*/		
	get servlet(){return $server_gateway.environment.get("servlet")},
/* 	property: version
	String representing the running version of Myna.
	
	Example:
	> 	1.0_alpha_9
	*/		
	get version(){return String($server_gateway.version)},
/* 	property: scriptName
	The name of the currently running script.
	
	Example:
	> index.sjs
	*/	
	get scriptName(){ return String($server_gateway.scriptName)},
/* 	property: tempDir
	<MynaPath> of the JVM temp directory
	
	Example:
	> file:/usr/share/tomcat/temp
	*/	
	get tempDir(){
		var file = new java.io.File(java.lang.System.getProperty("java.io.tmpdir"));
		return String(file.toURI());
	},
/* 	property: hostName
	the hostname of the server running myna
	
	
	*/	
	get hostName(){
		return String(java.net.InetAddress.getLocalHost().getHostName());	
	},
/* 	property: osName
	String representing the host operating system type.
	
	Example:
	> Linux
	*/		
	get osName(){return String(java.lang.System.getProperty("os.name"))},
/* 	property: osArch
	String representing the host cpu architecture.
	
	Example:
	> i386
	*/	
	get osArch(){return String(java.lang.System.getProperty("os.arch"))},
/* 	property: osVersion
	String representing the host operating system version.
	
	Example:
	> 	2.6.20-16-386
	*/		
	get osVersion(){return String(java.lang.System.getProperty("os.version"))},
/* 	property: memCurrent
	The current heap size in bytes.
	
	for the maximum memory that could be allocated
	
	See:
		<$server.memMax>, 
		<$server.memAvailable>, 
		<$server.memFree>,
		<$server.memUsed>,
		<Myna.freeMemory()>
		 
	*/		
	get memCurrent(){
		var rt = java.lang.Runtime.getRuntime();
		return rt.totalMemory();
	},
/* 	property: memMax
	The maximum heap size
	
	See:
		<$server.memCurrent>, 
		<$server.memAvailable>, 
		<$server.memFree>,
		<$server.memUsed>,
		<Myna.freeMemory()>
	*/
	get memMax(){
		var rt = java.lang.Runtime.getRuntime();
		return rt.maxMemory();
	},
/* 	property: memFree
	The current number of free bytes on the heap. 
	
	For the total memory available for new objects, see <memAvailable>
	
	See:
		<$server.memMax>, 
		<$server.memCurrent>, 
		<$server.memAvailable>,
		<$server.memUsed>,
		<Myna.freeMemory()> 
	*/		
	get memFree(){
		var rt = java.lang.Runtime.getRuntime();
		return rt.freeMemory();
	},
/* 	property: memAvailable
	The number of free bytes on the heap + unallocaed heap space.
	
	See:
		<$server.memMax>, 
		<$server.memCurrent>, 
		<$server.memFree>,
		<$server.memUsed>,
		<Myna.freeMemory()>
	*/		
	get memAvailable(){
		return $server.memMax - $server.memUsed
	},
/* 	property: memUsed
	The number of used bytes on the heap
	
	See:
		<$server.memMax>, 
		<$server.memCurrent>, 
		<$server.memAvailable>, 
		<$server.memFree>,
		<$server.memUsed>,
		<Myna.freeMemory()>
	*/		
	get memUsed(){
		return $server.memCurrent - $server.memFree;
	},
	
/* 	property: get
	retrieves a server variable
	
	Parameters:
		key		-		a variable name
	
	See:
		<$server.set>, 
	*/	
	get:function(key,value){
		return $server_gateway.serverVarMap.get(key)
	},
/* 	property: set
	Sets a variable that is available across all requests. Server varaiables are 
	not preserved across Myna restarts
	
	Parameters:
		key		-		a variable name
		value	-		The value to set
	
	See:
		<$server.get>, 
	*/	
	set:function(key,value){
		$server_gateway.serverVarMap.put(key,value)
	},
}
	
	
