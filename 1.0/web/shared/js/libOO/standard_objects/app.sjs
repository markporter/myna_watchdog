/* Class: $application
	Global object for defining and managing a Myna application. See <Application Overview>
	
	Topic: Application Overview
		General Description of application configuration
	
		What is an application?:
			A Myna application is any collection of content whose top
			level folder contains an application.sjs file. This file defines 
			$application variables and workflow event handlers. It is possible for 
			applications to overlap and override each other. 
			In the case of web 
			applications that are intended to be complete and stand-alone, the 
			application.sjs will define properties such as appname and version. 
			However, application.sjs file can also be used to set defaults and/or 
			alter the behavior of applications in subfolders. This is considered an 
			anonymous application and does not declare an appname. An example might be 
			if you wanted to set a global error handler. You could place an anonymous 
			application.sjs file in the webroot with an onError function defined that 
			returns true to override the default error handler. Any nested 
			applications that also define an onError handler can optionally override 
			this global handler  
			
		
		$application and application.sjs:
			The $application object is initialized via an application.sjs file in the 
			current directory or any parent directory. When a Myna file is 
			requested, Myna examines every directory between the web root and the 
			requested file, and includes any application.sjs file it finds, in the 
			order found. Each of these files has an opportunity to:
			
			* declare application specific variables
			* execute functions
			* append or prepend $application.onXXX() event functions. 
			  See <Object.before> and <Object.after> and examples below
			
			Once all the application.sjs files have been included, 
			<$application.onRequestStart> is called. <$application.onApplicationStart> 
			and <$application.onSessionStart> may be called as well.
			
			Next, the originally requested Myna file is executed.
			
			Finally <$application.onRequestEnd> is called.
			
		Named or Anonymous?:
			Applications can be named or anonymous. Named applications are registered 
			in the permissions system and also have a variable cache accessed through
			$application.set/get. Named applications can be imported/exported/installed 
			as Myna Eggs via the "Manage Applications" section of the Myna Adminstrator.
			
			Anonymous applications allow you to define or override variables and alter 
			the workflow of nested applications, i.e. any content in or below the 
			folder that contains the anonymous application.sjs file.   
			
		Nested applications:
			When there are multiple application.sjs file between the webroot and the 
			requested Myna file, they are applied from the webroot inward such that 
			each inner application.sjs overrides its parent. However, the workflow 
			functions are handled a little differently. The workflow functions are 
			actually chains (see <Function.createChainFunction> and <Object.before>/after).
			This means that if onRequestStart is defined in both an inner and outer 
			application.sjs file, both functions will be executed. The onAfterXX and 
			onRequestStart are executed from the outside-in and all other workflow 
			functions are executed from the inside-out. Like so
			(code)
				onRequestStart:outer
					onRequestStart:inner
						somefile.sjs
					onRequestEnd:inner
				onRequestEnd:outer
			(end)
			
			The order is somewhat more complicated if the onBeforeXX and onAfterXX 
			variants are used
			(code)
					onBeforeRequestStart:inner
				onBeforeRequestStart:outer
				onRequestStart:outer
					onRequestStart:inner
						somefile.sjs
					onRequestEnd:inner
				onRequestEnd:outer
				onAfterRequestEnd:outer
					onAfterRequestEnd:inner
			(end)
			
			It is possible to terminate a chain early by calling 
			arguments.callee.chain.exit() See <Function.createChainFunction> for more
			detail on manipulating function chains.
		
		Note:
			To maintain compatibility with older Myna code, an application.sjs file 
			may contain plain JS. In this case it will internally be converted into
			an "init" function and executed.
		
		Examples:
			(code)
			//from the Myna Adminstrator
			{
				appname:"myna_admin",
				displayName:"Myna Adminstrator",
				noAuthFuses:["login","auth", "logout"],
				defaultFuseAction:"login",
				mainFuseAction:"main",
				onRequestStart:function(){
					if (!$req.data.fuseaction) $req.data.fuseaction=this.defaultFuseAction; 
					//is the user authenticated?
					if (this.noAuthFuses.indexOf($req.data.fuseaction.toLowerCase()) != -1) return;	
					if ( !$cookie.getAuthUserId() ){
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
					var props =new Myna.File("/WEB-INF/classes/cron.properties") 
					if (!props.exists()){
						props.writeString("")
					}
				
					//Load datasource driver properties 
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
	
	
	
			// an example of anonymous applications and altered workflow.
			
			// parent folder  
			{
				//$application.directory and $application.url are calcularted automatically
				layoutFile:$application.directory +"layout/outer_template.ejs"
				init:function(){
					// This wraps all content generated in a layout file.
					// By using "before" in this init function, we are reversing the 
					// execution order to "inside-out" instead of the default "outside-in"
					$application.before("onRequestEnd",function(){
						if (Page.includeLayout) {
							Myna.includeOnce(this.layoutFile,{content:$res.clear()})
						}
					})
				},
				onRequestStart:function(){
					//decalres global variable that the request page can access
					Page={
						includeLayout:true,
						title:"Parent content",
						breadCrumbs:[{
							url:$application.url,
							label:"Parent"
						}],
					}
				},
			}
			
			//child folder
			{
				layoutFile:$application.directory +"layout/inner_template.ejs"
				init:function(){
					// This wraps all content generated in a layout file, before the parent wrap.
					// By using "before" in this init function, we are reversing the 
					// execution order to "inside-out" instead of the default "outside-in"
					$application.before("onRequestEnd",function(){
						if (Page.includeLayout) {
							Myna.includeOnce(this.layoutFile,{content:$res.clear()})
						}
					})
				},
				onRequestStart:function(){
					//override page defaults
					Page.title = "Child content"
					Page.breadCrumbs.push({
						url:$application.url,
						label:"Child"
					})
				},
			}
			
			//outer_template layout file
			<html>
				<head><title><%=Page.title%></title></head>
				<body>
					<!-- Breadcrumbs -->
					<div class="header-breadcrumbs">
						<ul>
						<@loop array="Page.breadCrumbs" element="bc">
							<li><a href="<%=bc.url%>"><%=bc.label%></a></li>
						</@loop>
						</ul>
					</div>
					<div id="main_content"><%=this.content%></div>
				</body>
			</html>
			
			//inner_template layout file
			
			<div id="inner_content">
				<h1> Here is the inner layout </h1>
				<%=this.content%>
			</div>
			
			(end)
		
		See:
			*	<Application Template>
			
		See also:
			*	<Myna.loadAppProperties>
*/

/*
	Topic: Application Template	
		
		
		The application.sjs file should conform to this template:
			
			(code)
			{
				//--------- properties -----------------------------------------------
					// you can access these properties from another app via Myna.loadAppProperties()
				appname:"",// unique variable name of this application, omit this for anonymous applications
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
				
				//--------- local properties -----------------------------------------
				myProp:"",
				
				//--------- init method ----------------------------------------------
				init:function(){	// this is run before any workflow methods to setup the application.
				
				},
				
				//--------- workflow methods -----------------------------------------
				onApplicationStart:function(){ // run if application cache has expired
				
				},
				onRequestStart:function(){ // run directly before requested file
				
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
			(end)
		
		
*/
var $application={
	/* Property: appname
		String application name. 
		
		Detail:
			Should only contain letters, numbers and the underbar (_) character. 
			If set, an application cache is created. Variables can be set and 
			retrieved from this scope via <$application.set> and 
			<$application.get>. Setting an appname also registers this application
			in the permissions system
			
		Example:
		(code)
			..
			appname:"myna_admin",
			..
		(end)
	*/
	appname:null,
	get appName(){return $application.appname},
	set appName(val){$application.appname = val},
	/* Property: displayName
		String application name for displaying to humans *Default appname*.   
		
		Detail:
			This should be a single line title for the application as you might 
			display in you page title
		
		Example:
		(code)
			..
			displayName:"Myna Administrator",
			..
		(end)
	*/
	_displayName:null,
	get displayName(){return $application._displayName||$application.appname},
	set displayName(val){$application._displayName = val},
	get display_name(){return $application.displayName},
	set display_name(val){$application.displayName = val},
	/* Property: description
		Short description of this application
		
		Example:
		(code)
			..
			description:"Manages Myna server settings",
			..
		(end)
	*/
	description:"",
	/* Property: author
		Name of  the author of this application  
		
		Example:
		(code)
			..
			author:"Mark Porter",
			..
		(end)
	*/
	author:"", 
	/* Property: authorEmail
		email of the author of this application   
		
		Example:
		(code)
			..
			authorEmail:"mark@porterpeople.com",
			..
		(end)
	*/
	authorEmail:"",// email of app author
	/* Property: website
		Website associated with this application   
		
		Example:
		(code)
			..
			website:"http://www.mynajs.org",
			..
		(end)
	*/
	website:"",
	/* Property: version
		Application version
		
		This should be in dot notation such that <String.compareNatural> will sort 
		the version properly. Here is an example for testing a version scheme:
		
		(code)
			var v = [
				"1.0_beta_5-1",
				"1.0_beta_5-2",
				"1.0_beta_6-1",
				"1.0_alpha_5-1",
				"1.0_rc_1-2",
				"1.0_stable",
				"1.1_alpha_1",
				"1.1_beta_2",
				"1.1_stable",
			]
			v.sort(String.compareNatural)
			Myna.printDump(v)
			v.sort(String.compareNaturalReverse)
			Myna.printDump(v)
		(end)
		
		Example:
		(code)
			..
			version:"1.0_beta_5-1",
			..
		(end)
	*/
	version:"", 
	/* Property: minMynaVersion
		Minimum version of Myna this application is likely to work with  
		
		Example:
		(code)
			..
			website:"1.0_beta_5-1",
			..
		(end)
	*/
	minMynaVersion:null,// Minimum version of Myna the app might run on
	/* Property: postInstallUrl
		URL that should be visited first after deployment, relative to the 
		application's install directory
		
		This should be null unless your application requires setup beyond copying 
		files. 
		
		Example:
		(code)
			..
			website:"1.0_beta_5-1",
			..
		(end)
	*/
	postInstallUrl:null,// 
				
/* Property: idleMinutes
		Max time in minutes between application data access before app memory is 
		recovered *Default 60*. 
		
		Detail:
		Any data set in the application scope should be expected to be 
		destroyed at some point. Persistent data should be set in 
		<$application.onApplicationStart> since that function is called before 
		<$application.onRequestStart> when the application cache has timed out. 
		
	*/
	idleMinutes:60,
/* Property: rights
		Array of <Myna.Permissions.Right> definitions
		
		Detail:
			Any rights defined here will be created/updated before 
			<$application.onApplicationStart>. The "appname" property is 
			automatically added  

	*/
	rights:[],
/* Property: directory
		MynaPath of directory of closest application.sjs *CALCULATED*
		
		Detail:
			application.sjs files are loaded consecutively from the web root 
			to the requested file. Inside an application.sjs file, this represents
			the directory of the currently executing application.sjs file. Because 
			each consecutive application.sjs file overwrites this property, it will
			always represent the innermost application.
			
	*/
	directory:null,
/* Property: url
		URL path of closest application.sjs *CALCULATED*
		
		Detail:
			application.sjs files are loaded consecutively from the web root 
			to the requested file. This property is the URL path of the last 
			application.sjs file to run and generally represents the  "home" 
			directory of the application.
			
		Example:
			/servlet-context/my_app/
	*/
	url:null,	
	

	/* Property: closeArray
		Array of resources onwhich we should cal close() on request end.
		
		Detail:
			This is primarily to ensure the release of jdbc connection, 
			statement, and resultSet objects, but anything with a close() 
			function can be pushed onto this array.
			
		See:
			<addOpenObject>
	*/
	closeArray:[],
	
/* Function: addOpenObject 
		Add an object to $application to be closed at the end of the thread. 
		Any object with a close() function can be added. Intended for resource 
		cleanup.  
		
		Parameters:
			obj	-	an object with a close() function
			
		
		Example:
		(code)
			function getFileStream(path){
				var fis = new java.io.FileInputStream(new File(scriptPath).javaFile);
				// we can't be sure the caller will close this stream, so we'll register
				// fis to be closed at the end of the thread 
				$application.addOpenObject(fis);
				return fis;
			}
		(end)
			
	*/
	addOpenObject:function(obj){
		/* if (!this["closeArray" + $server.threadId]) this["closeArray" + $server.threadId] =[];
		this["closeArray" + $server.threadId].push(obj) */	
		this.closeArray.push(obj)
	},
/* Function: get
		Returns the application variable associated with the supplied key
		
		Parameters:
			key	-	String variable name
			
		Returns:
			The application variable associated with the supplied _key_.
			
		Note:
			application variables are deleted after <idleMinutes> of inactivity
		Example:
		(code)
			var lastUser = $application.get("lastUser")||$cookie.getAuthUser();
		(end)
		
	*/
	get:function(key){
		//called in request start
		//this._initAppScope();
		var cache =Packages.org.apache.jcs.JCS.getInstance("application");
		var retval = null;
		Myna.lock($application.appname +"_get",10,function(){
			var data = cache.get($application.appName);
			if (data){
				retval = data[key];
			}		
		})
		return retval;
	},
/* Function: getData
		Returns a read-only object representing all of the application's 
		data set via <set>
		
		Parameters:
			key	-	String variable name
			
		Returns:
			The application variable associated with the supplied _key_.
	*/
	getData:function(key){
		//called in request start
		//this._initAppScope();
		var cache =Packages.org.apache.jcs.JCS.getInstance("application");
		
		var data = cache.get($application.appName);
		if (data){
			return data;
		}else {
			return {};
		}
	},
	
/* Function: set
		Set the application variable associated with the supplied key, returns _value_
		
		Parameters:
			key		-	String variable name
			value	-	value to set
			
		Note:
			application variables are deleted after <idleMinutes> of inactivity
		Example:
		(code)
			$application.set("lastUser",$cookie.getAuthUser());
		(end)
	*/
	set:function(key,value){
		//called in request start
		//this._initAppScope();
		var cache =Packages.org.apache.jcs.JCS.getInstance("application");
		var retval = value;
		Myna.lock($application.appname +"_get",10,function(){
			var data = cache.get($application.appName);
			if (!data){
				data ={};	
			}
			
			data[key] = value;
			cache.put($application.appName,data);		
		})
		return retval;
			
	},
/* Function: clear
		Clears any data in the $application cache
		
		This causes the next load of a page in this application to trigger 
		<onApplicationStart>
		
		Warning: 
			This might causes errors if other threads are currently accessing the
			$application cache. To reduce the chances of this, see <reload>
		
		Example:
		(code)
			$application.clear();
		(end)
	*/
	clear:function(){
		if (this.appName){
			var cache =Packages.org.apache.jcs.JCS.getInstance("application");
			cache.remove(this.appname)
		} 	
	},
/* Function: reload
		Clears any data in the $application cache, and re-runs <onApplicationStart>
				
		Warning: 
			This might causes errors if other threads are currently accessing the
			$application cache, and they try to access a parameter not set in 
			<onApplicationStart>. 
		
		Example:
		(code)
			$application.reload();
		(end)
	*/
	reload:function(){
		$application.clear();
		$application._initAppScope();
	},	
	_initAppScope:function(){
		if (this.appName){
			var cache =Packages.org.apache.jcs.JCS.getInstance("application");
			
			if (!cache.get(this.appName)){
				var attr = new Packages.org.apache.jcs.engine.ElementAttributes();
				attr.setIdleTime(60*this.idleMinutes);
				cache.put(this.appName,{},attr);
				this.onApplicationStart();	
				
			} 
		} 	
	},
	
	
	_initScopes:function(){
		$profiler.mark("Runtime scripts included");
		$profiler.begin("Process Scopes");
		$server_gateway.runtimeStats.put("currentTask","built-in onRequestStart");
		var pThread=$server_gateway.environment.get("threadParent")
		if (pThread){
			//Myna.log("debug","setting id " +pThread.threadScope.$cookie.__AUTH_USER_ID__,Myna.dump(pThread.threadScope.$cookie));
			$cookie.setAuthUserId(pThread.threadScope.$cookie.__AUTH_USER_ID__)	
			//Myna.log("debug","curUser =" + $cookie.getAuthUserId(),Myna.dump($req.data));
		}
		if ($server.request){
			// load request
				$server_gateway.runtimeStats.put("currentTask","buildRequest");
				$req.data={}
				$req.paramNames=[];
				//process URL-MAP
					if ($server_gateway.environment.get("URL-MAP")){
						var url_map = Myna.JavaUtils.mapToObject($server_gateway.environment.get("URL-MAP"))
						url_map.getKeys().forEach(function(param){
							$req.data[param] = url_map[param];
							$req.data[param + "$array"]=[];
							$req.data[param + "$objectArray"]=[];
							$req.paramNames.push(param)	
						})
					}
				
				//get array of merged GET and POST parameters as key, value pairs
				try {//this might blow up in Winstone
					var params = Myna.JavaUtils.mapToObject($server.request.getParameterMap());
				} catch(e){
					params={}	
				}
									
				var val; 		// value of $req.data.<parameter_name>
				var curVal;		// temp val
				var curObj;		// temp JSON object
				var valArray;	// stores the array of values for the current key
				var key;		// current key (parameter name) being examined
				var keyId;		// counter for looping over the list of keys
				var valId;		// counter for looping over the list of values for a specific key
				
				
				//process uploads if necessary
					$server_gateway.runtimeStats.put("currentTask","processUploads");
					
					var fileupload =Packages.org.apache.commons.fileupload; 
					if (fileupload.servlet.ServletFileUpload.isMultipartContent($server.request)){
						$profiler.begin("Process Uploads");
						$session.set("$uploadProgress",{
								fileNumber:"N/A",
								bytesRead:-1,
								totalBytes:0,
								percentComplete:0,
								kps:0,
								message:"Preparing Upload"
						});
						var start = new Date().getTime()
						var oldTimeout = $server_gateway.requestTimeout 
						$server_gateway.requestTimeout = 0; // disable timeout while uploading
						
						
						// Create a factory for disk-based file items
						var diskItemFactory = new fileupload.disk.DiskFileItemFactory(
							1024*1024*500, //limit to no more than 500 megabytes
							new Myna.File($server.tempDir).javaFile
						);
						
						//make sure all files no matter how small are written to disk
						diskItemFactory.setSizeThreshold(0);
						// Create a new file upload handler
						var upload = new fileupload.servlet.ServletFileUpload(diskItemFactory);
						var lastBytesRead=0;
						var lastTick = new Date().getTime();
						var listener =new fileupload.ProgressListener(){
							update:function(pBytesRead, pContentLength, pItems){
								var my = arguments.callee;
								
								var elapsedKbytes = (pBytesRead- lastBytesRead)/1024;
								//if (elapsedKbytes < 2) return;
								var currentTick = new Date().getTime();
								var elapsed_seconds = (currentTick - lastTick)/1000;
								if (elapsed_seconds < 1) return;
								
								
								if (!my.progress || my.progress.bytesRead != pBytesRead){
									
									if (!pItems) pItems=1;
									my.progress={
										fileNumber:pItems,
										bytesRead:pBytesRead,
										totalBytes:pContentLength,
										percentComplete:(pBytesRead/pContentLength),
										kps:elapsedKbytes/elapsed_seconds
									}
									
									
									if (pBytesRead == pContentLength){
										my.progress.message="File upload complete";
									} else {
										my.progress.message="Uploading file #" + pItems+", " 
										+ Math.floor(my.progress.percentComplete*100) 
										+ "% complete (" + my.progress.kps.toFixed() +" KBps)";  	
									}
									//calculate upload rate
									
									
									
									lastBytesRead=pBytesRead;
									lastTick = currentTick;
									$session.set("$uploadProgress",my.progress);
								}
							}
						};
						upload.setProgressListener(listener);
						
						// Parse the request
						var items = upload.parseRequest($server.request);
						$session.set("$uploadProgress",{
								fileNumber:"N/A",
								bytesRead:0,
								totalBytes:0,
								percentComplete:1,
								kps:0,
								message:"File Upload Complete",
								elapsedSeconds: (new Date().getTime() -start)/1000
						});
						items.toArray().forEach(function(item,index){
							if (item.isFormField()){
								params[item.getFieldName()] = [item.getString()];
							}else {
								var f = String(item.getFieldName());
								if (f.charAt(0) == "/"){
									f = f.listLast("/");
								} else {
									f = f.listLast("\\");
								}
								var obj = {
									diskItem:item,
									stats:{
										fieldName:f,
										fileName:String(item.getName()),
										contentType:String(item.getContentType()),
										isInMemory:item.isInMemory(),
										sizeInBytes:item.getSize(),
										diskLocation:String(item.getStoreLocation().toURI())
									}
								}
								$req.data[item.getFieldName()] =obj;
								if (!$req.data[item.getFieldName() +"$array"]){
									$req.data[item.getFieldName() +"$array"]=[];	
								}
								$req.data[item.getFieldName() +"$array"][index] =obj;
							}
						})
						
						$server_gateway.requestTimeout = oldTimeout + parseInt((new Date().getTime() - start)/1000); // reEnable  timeout after uploading
						$profiler.end("Process Uploads");
					}
				params.forEach(function(valArray,key){
					//for (keyId=0; keyId < keyValueArray.length; ++keyId){
					//valArray = keyValueArray[keyId].getValue();
					//key =keyValueArray[keyId].getKey()
					
					$req.paramNames.push(String(key));	
					//check for null value, ie "&somevar="
					if (valArray.length ==0){
						$req.data[key] ="";
					} else {
						// handle non-null
						for (valId=0; valId<valArray.length; ++valId){
							curVal = String(valArray[valId]);
							
							if (!$req.data[key + "$array"] ){
								$req.data[key + "$array"]=[];
							}
							
							$req.data[key + "$array"].push(curVal);
							
							$req.data[key] = curVal;
							if (/[\{|\[]/.test(curVal.trim())){
								try{
									curObj = curVal.parseJson();
									if (!$req.data[key + "$objectArray"] ){
										$req.data[key + "$objectArray"]=[];
									}
									$req.data[key + "$objectArray"].push(curObj);
									$req.data[key + "$object"] = curObj;
								}catch(e){}
							}
						}
					}
				} )
				//escapeHtml
				$req.rawData={}
				$req.data.applyTo($req.rawData)
				$req.paramNames.forEach(function(name){
					$req.data[name] = $req.data[name].escapeHtml();
					if ($req.data[name+"$array"].length==1) {
						$req.data[name+"$array"] = [
							$req.data[name]
						]
					} else {
						$req.data[name+"$array"] = $req.data[name+"$array"].map(function(value){
							return value.escapeHtml();
						})
					}
				});
			//import auth_token
				if ("auth_token" in $req.data){
					var user_id =Myna.Permissions.consumeAuthToken($req.rawData.auth_token)
					if (user_id) $cookie.setAuthUserId(user_id)
					var queryVars = $req.paramNames.filter(function(key){
						return key != "auth_token"
					}).map(function(key){
						return key +"="+$req.rawData[key].escapeUrl()
					}).join("&");
					if (queryVars) queryVars ="?"+queryVars
					//$res.clear();
					
					$res.metaRedirect($server.requestUrl+$server.requestScriptName + queryVars)
					$res.flush();
					Myna.abort();
					$req.handled = true;
				}
			
			
		} else if ($server.isCommandline){
			$req.data ={
				arguments:[]
			}
			var args = $server_gateway.environment.get("commandlineArguments")
			if (args && args.length){
				var inString = false;
				var stringChar ="";
				var curval=[];
				var curvar;
				
				for (var i=1;i< args.length;++i){
					if (!args[i].length) continue;
					if (inString){
						if (new RegExp(stringChar + "$").test(args[i])){
							curval.push(args[i].before(1));
							curval = curval.join(" ");
							if (curvar){
								$req.data[curvar] =curval;
							} else {
								$req.data.arguments.push(curval);
							}
							inString=false;
							curvar=false;
							curval=[];
						} else {
							curval.push(args[i])
						}
					} else {
						if (args[i].charAt(0) == "-"){
							var name = args[i].match(/^-+(.*)$/)[1];
							if (args[i+1].charAt(0) == "-"){
								$req.data[name] = true;
								
							} else {
								if (/^['"]/.test(args[i+1])){
									inString=true;
									stringChar=args[i+1].charAt(0);
									curval =[args[i+1].after(1)];
									curvar=name;
								} else {
									$req.data[name] = args[i+1];
									++i;
								}
							}
						} else {
							if (/^['"]/.test(args[i])){
								inString=true;
								stringChar=args[i].charAt(0)
								curval=[args[i].after(1)];
								curvar=false;
							} else {
								$req.data.arguments.push(args[i]);
							}
						}
					}
				}
			}
			$req.rawData = $req.data
		}
		$profiler.end("Process Scopes");
	},
	
	_onApplicationStart:function(){
		try{
			if ($application.rights){
				$application.rights.forEach(function(r){
					if (!r.appname) r.appname = $application.appname;
					Myna.Permissions.addRight(r)
				})
			}
			var originalCurrentDir =$server_gateway.currentDir;
			$server_gateway.currentDir=$application.directory
		
			this.onApplicationStart();
		
			$server_gateway.currentDir=originalCurrentDir;
			//refresh app entry after start
			$server_gateway.applications.put($application.directory,$application);
			Myna.Permissions.addApp($application);
		} catch(e){
			$application._onError(e);
		}
	},
/* Function: init
		Called before any processing of the request
		
		Detail:
			This function is called after loading the $application.sjs file, but 
			before any nested application.sjs files. This is intended for more 
			complicated configuration of the $application object.
			
			This function does nothing unless it is defined in an
			application.sjs file.
			
		Example:
		(code)
			//in application.sjs
			{
				init:function(){
					// Inits are always executed outside-in. This causes the DS to be  
					// set by the outermost folder
					if (!$application.ds){
						if ($server.properties.instance_purpose.toLowerCase() == "dev"){
							$application.ds="hr_dev"
						} else {
							$application.ds="hr_prod"
						}
					}
				}
			}
		(end)
	*/
/* Function: onApplicationStart
		Called when a new application scope is created, before 
		<$application.onRequestStart>.
		
		Detail:
			A new application scope is typically created on server restart or 
			the first request after a cache timeout. 
			
			This function does nothing unless it is appended or replaced in an
			application.sjs file.
	*/
	onApplicationStart:function(){},
	_onRequestStart:function(){
		this._initAppScope();
		// call overloaded on request 
			var originalCurrentDir =$server_gateway.currentDir;
			$server_gateway.currentDir=$application.directory
			try{
				this.onRequestStart();
			} catch(e){
				$application._onError(e);
				//$res.print(Myna.formatError(e));
			}
			$server_gateway.currentDir=originalCurrentDir;
		
	},
/* Function: onBeforeRequestStart
		Called before any parent request start functions.
		
		Calling arguments.callee.chain.exit() will exit the chain and prevent any
		further request start functions from executing
		
	*/
	onBeforeRequestStart:function(){},
/* Function: onRequestStart
		Called before processing a request, but after and parent onRequestStart 
		functions. 
		
		Detail:
			This function is called after all the initial request processing, but 
			before executing the requested file.
			
			This function does nothing unless it is appended or replaced in an
			application.sjs file.
			
		Example:
		(code)
			//in application.sjs
			{
				onRequestStart:function(){
					// create a DataManager with a datasource that
					// has the same name as the application directory
					dm = new Myna.DataManager(new Myna.File($application.directory).getFileName);
				}
			}
		(end)
	*/
	onRequestStart:function(){},
	_onRequestEnd:function(){
	/* refresh myna_auth_cookie */
		var user_id = $cookie.getAuthUserId();
		/* if (user_id) {
			$cookie.setAuthUserId(user_id)
		} */
	// close any open resources
		$application.closeArray.forEach(function(element){
			try{
				element.close();
				element._closed = true;
			} catch (e){}
		});
		$application.closeArray = [];
		/* if (!this["closeArray" + $server.threadId]) this["closeArray" + $server.threadId] =[];
		$application["closeArray" + $server.threadId].forEach(function(element){
			try{
				element.close();
			} catch (e){}
		}); */
		
	// save session
		if ($server.request){
			Myna.lock("___MYNA_SAVE_SESSION___",10,function(){
				try{
					var local_session = $server.request.getSession();
					
					if ($session.timeoutMinutes != undefined) {
						local_session.setMaxInactiveInterval($session.timeoutMinutes*60)
					}
				} catch(e) {}
			})
				
			
		}
		var originalCurrentDir =$server_gateway.currentDir;
		$server_gateway.currentDir=$application.directory;
		$application.onRequestEnd();
		$server_gateway.currentDir=originalCurrentDir;
		$profiler.mark("Request completed");
		if ($server_gateway.generalProperties.getProperty("append_profiler_output") == "1"){
			try{
				var raw = $profiler.getSummaryHtml()
				$profiler.calcAverages();
				var averaged = $profiler.getSummaryHtml();
				
				Myna.log("profiler",$server.requestUrl+$server.requestScriptName,<ejs>
					<h1>Averaged Profile</h1>
					<%=averaged%>
					<hr>
					<h1>Raw Profile</h1>
					<%=raw%>
				</ejs>);
			} catch(e){}
			
		}
	},
/* Function: onRequestEnd
		Called after processing a request. 
		
		Detail:
			This function is called after executing the requested file, but before 
			sending output to the browser. 
			
			This function does nothing unless it is appended or replaced in an
			application.sjs file.
	*/
	onRequestEnd:function(){},
	_onError:function(exception){
		var line,file,detail;
		var 
			isString=(typeof exception === "string"),
			formattedError,
			message
		;
			
		if (!isString && "message" in exception && exception.message === "___MYNA_ABORT___"){
			return;
		}
		if (isString){
			message = formattedError = "Thrown Error: '" +exception + "' Use throw new Error('"+exception+"') for more detailed error messages.";	
		} else {
			formattedError = Myna.formatError(exception)
			message ="Error"
			try {
				if (exception.sourceName){
					message = e.rhinoException.details() || message; 	
				} else {
					message = exception.message || message;
				}
			} catch(e){
			} finally {
				Myna.log("ERROR",message,formattedError);
			}
		}
		try{
			var shouldEmail = parseInt($server_gateway
				.generalProperties
				.getProperty("administrator_email_on_error")
			)
			var adminEmail = String($server_gateway
				.generalProperties
				.getProperty("administrator_email")
			)
			
			if (adminEmail.length && shouldEmail){
				new Myna.Mail({
					to:adminEmail,
					from:adminEmail.listFirst(),
					subject:new Myna.Template("Myna Error on server {hostName}, instance {instance_id} ({purpose}): " + message).apply($server),
					isHtml:true,
					body:"<h1>" + message + "</h1>" +formattedError
				}).send()
			}
			
		} catch(j){
			Myna.log("ERROR",message,formattedError);
		}
		var originalCurrentDir =$server_gateway.currentDir
		$server_gateway.currentDir=$application.directory
		if ((!this.onError || !this.onError(exception)) && formattedError){
			if ($server_gateway.environment.get("isCommandline")){
				var error = Myna.normalizeError(exception);
				Myna.printConsole("====== ERROR: " + error.message + " =====",<ejs>
					File: <%=error.file%>
					
					Line: <%=error.line%>
					
					Stack:<@loop array="error.jsStack" element="line">
					<%=line%>
					</@loop>
				</ejs>)	
			} else {
				$res.print(formattedError)
			}
		}
		$server_gateway.currentDir=originalCurrentDir;
	},
/* Function: onError
		Called when a an error occurs. 
		
		Parameters:
			exception	-	a caught exception object
		
		Detail:
			This function is executed before the default error handler. 
			Return true to cancel the default error handler.
			
	*/
	onError:function(){
		return false;
	},
	
	_onError404:function(){
		//$res.clear();
		var originalCurrentDir =$server_gateway.currentDir;
		$server_gateway.currentDir=$application.directory
		if (!this.onError404 || !this.onError404()){
			Myna.print("The file you requested is not available at that location.")
			$server_gateway.currentDir=originalCurrentDir;
			$res.setStatusCode(404);
			$res.flush();
			Myna.abort();
		}
		
	},
/* Function: onError404
		Called when a request for a non-existent file occurs. 
		 
		
		Detail:
			This function is executed before the default 404 error handler. You can 
			Use this to provide your own "missing file" error handler.
			
			Return true to cancel the default 404  error handler.
			
	*/
	onError404:function(){
		return false;
	},
	_onSessionStart:function(){
		var originalCurrentDir =$server_gateway.currentDir;
		$server_gateway.currentDir=$application.directory
		if (this.onSessionStart) this.onSessionStart();
		$server_gateway.currentDir=originalCurrentDir;
	},
/* Function: onSessionStart
		Called when a new session is created, before <$application.onRequestStart>. 
		
		Detail:
			This function does nothing unless it is appended or replaced in an
			application.sjs file.
	*/
	onSessionStart:function(){},
	_mergeApplications:function(){
		$profiler.begin("$application import");
		
		
		/* 
		   disabling caching because cached even function enclose the scope that 
		   they were declared in instead of the current scope.
		   
		var appFound=false;
		var cacheApplications =parseInt( Myna.getGeneralProperties().cacheApplications);
		
		if (cacheApplications){
			var closestAppDir =$server.requestDir;
		
			while (closestAppDir.listLen("/") >1 && !new Myna.File(closestAppDir+"application.sjs").exists()){
				closestAppDir =closestAppDir.listBefore("/");
			}
			if ($server_gateway.applications.containsKey(closestAppDir)){
				$server_gateway.applications.get(closestAppDir).applyTo($application,true);
				java.lang.System.err.println("loading from cache " + closestAppDir);
				appFound=true;
			}
		} 
		
		if (!appFound) { */ 
			var plainAppInChain=false
			var appPaths = $server.requestDir.substring($server.rootDir.length).split("/");
			//var appPaths = path.substring($server.rootDir.length).split("/");
			
			appPaths.unshift(""); //prepend rootDir entry
			appPaths.pop(); //remove trailing blank caused by trailing slash in $server.requestDir
			var curPath = $server.rootDir;
			var logs=[]
			for (var x=0; x < appPaths.length;++x){
				try{
					if (appPaths[x].length) curPath += appPaths[x] +"/" ;
					var appFile = new Myna.File(curPath + "application.sjs");
					if (appFile.exists()){
						var before = $server_gateway.currentDir;
						$server_gateway.currentDir =curPath;
						var appText = new Myna.File(curPath + "application.sjs").readString();
						//java.lang.System.err.println("-1" +curPath)
						$application.directory = curPath;
						$application.url = $server.rootUrl +$application.directory.right($application.directory.length -$server.rootDir.length)
						if (/^\s*\{/.test(appText.left(100))){
							appText = $server_gateway.translateString(appText,curPath + "application.sjs")
							$server_gateway.executeJsString(
								$server.globalScope, 
								"var curApp =(" + appText +")", 
								curPath+"application.sjs"
							) 
							//var curApp = eval("(" + appText + ")");
							//var curApp = $server.curApp;
							
							curApp.getProperties().forEach(function(p){
								if (typeof curApp[p] === "function"){
									//$application.after(p,curApp[p]);
									switch(p){
										case "onRequestStart":
										case "onAfterRequestEnd":
										case "onAfterError":
										case "onAfterError404":
											$application.after(p.replace(/After/,""),curApp[p])
										break;
										
										case "onBeforeRequestStart":
										case "onRequestEnd":
										case "onError":
										case "onError404":
											$application.before(p.replace(/Before/,""),curApp[p])
										break;
											
										default:
											//All other functions override
											$application[p] = curApp[p];
									}
									//java.lang.System.err.println(curPath + ": applied " +p)
								} else {
									//java.lang.System.err.println(curPath + ":" +p)
									$application[p] = curApp[p];
								}
							})
							if ($application.init){
								$application.init();
							}
						} else {
							plainAppInChain=true;
							Myna.include(curPath + "application.sjs")
						}
						//curApp.applyTo($application,true);
						//curApp.init.apply($server.globalScope,[]);
						$server_gateway.currentDir = before;
					}
				} catch(e){
					java.lang.System.err.println(e)
					//Myna.log("ERROR","Error in " + curPath + "/application.sjs",Myna.formatError(e));
					$application.onError(e);
				}
			}
			//if (typeof $application.init == "function") $application.init();
			//if (!plainAppInChain){
				
			//}
		//}
		//load application
			if ($application.appname){
				var cache =Packages.org.apache.jcs.JCS.getInstance("application");
				
				if (!cache.get($application.appname)){
					var attr = new Packages.org.apache.jcs.engine.ElementAttributes();
					attr.setIdleTime(60*this.idleMinutes);
					cache.put(this.appName,{},attr);
					this._onApplicationStart();	
					
				}
			} 
		$profiler.end("$application import");
	},
}