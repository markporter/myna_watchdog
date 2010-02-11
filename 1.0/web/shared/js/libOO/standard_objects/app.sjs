/* 	Class: $application
	Global object for managing the current application.
	
	Detail:
		When a .ejs or .sjs file is requested, Myna examines every directory 
		between the web root and the requested file, and includes any 
		application.sjs file it finds. Each of these files has an opportunity to:
		
		* declare application specific variables
		* execute functions
		* append or prepend $application.onXXX() event functions. 
		  See <Object.before> and <Object.after>
		
		Once all the application.sjs files have been included, 
		<$application.onRequestStart> is called. <$application.onApplicationStart> 
		and <$application.onSessionStart> may be called as well.
		
		Next, the originally requested .sjs or .ejs file is executed.
		
		Finally <$application.onRequestEnd> is called 
		
		
		Example:
		(code)
		// this creates a Page object that will be available to every page under 
		// this directory 
		var Page={
			includeLayout:true,
			title:"Myna Application Server",
			keywords:"",
			breadCrumbs:[{
				url:$server.rootUrl+"layout_test/",
				label:"Layout Test"
			}],
			description:"",
			tags:[]
		}
		//this assigns a propery to the $application object
		var layoutDir =$application.directory +"layout";
		
		// this wraps all content generated in a layout file
		$application.before("onRequestEnd",function(){
			if (Page.includeLayout) {
				Myna.includeOnce(layoutDir + "/SiteLayout.ejs",{content:$res.clear()})
			}
		})
		(end)
		
		
*/
var $application={
/* Property: directory
		directory of closest application.sjs
		
		Detail:
			application.sjs files are loaded consecutively from the web root 
			to the requested file. Inside an application.sjs file, this represents
			the directory of the currently executing application.sjs file. Because 
			each consecutive application.sjs file overwrites this property, it will
			always represent the innermost application.
			
	*/
	directory:null,
/* Property: url
		url path of closest application.sjs
		
		Detail:
			application.sjs files are loaded consecutively from the web root 
			to the requested file. This property is the URL path of the last 
			application.sjs file to run and generally represents the  "home" 
			directory of the application.
			
		Example:
			/servlet-context/my_app/
	*/
	url:null,	
	
/* Property: appname
		String application name. 
		
		Detail:
			Should only contain letters, numbers and the underbar (_) character. If set, an
			application cache is created. Varables can be set and retrieved from this scope 
			via <$application.set> and <$application.get>
			
	*/
	appname:null,
	get appName(){return $application.appname},
	set appName(val){$application.appname = val},
/* Property: idleMinutes
		Max time in minutes between application data access before app data is destroyed.
		Any data set in the application scope should be expected to be destroyed at some point.
		
	*/
	idleMinutes:60,

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
			
		Example:
		(code)
			var lastUser = $application.get("lastUser")||$cookie.getAuthUser();
		(end)
		
	*/
	get:function(key){
		this._initAppScope();
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
		this._initAppScope();
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
			
		Example:
		(code)
			$application.set("lastUser",$cookie.getAuthUser());
		(end)
	*/
	set:function(key,value){
		this._initAppScope();
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
				var params = Myna.JavaUtils.mapToObject($server.request.getParameterMap())
									
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
								}catch(e if e instanceof SyntaxError){}
							}
						}
					}
				} )
				//escapeHtml
				$req.rawData={}
				$req.data.applyTo($req.rawData)
				$req.paramNames.forEach(function(name){
					$req.data[name] = $req.data[name].escapeHtml();
					$req.data[name+"$array"] = $req.data[name+"$array"].map(function(value){
						return value.escapeHtml();
					})
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
					$res.clear();
					
					
					$res.metaRedirect($server.requestUrl+$server.requestScriptName + queryVars)
					$req.handled = true;
				}
			
			
		}
	},
	
	_onApplicationStart:function(){
		var originalCurrentDir =$server_gateway.currentDir;
		$server_gateway.currentDir=$application.directory
		try{
			this.onApplicationStart();
		} catch(e){
			$application._onError(e);
		}
		$server_gateway.currentDir=originalCurrentDir;
	},
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
/* Function: onRequestStart
		Called before processing a request. 
		
		Detail:
			This function is called after all the initial request processing, but 
			before executing the requested file.
			
			This function does nothing unless it is appended or replaced in an
			application.sjs file.
			
		Example:
		(code)
			//in application.sjs
			
			// Using Object.after ensures that an existing onRequestStart function
			// loaded by an earlier application.sjs will be executed first
			$application.after("onRequestStart",function(){
				// create a DataManager with a datasource that
				// has the same name as the application directory
				dm = new Myna.DataManager(new Myna.File($application.directory).getFileName);
			})
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
			$res.print(formattedError)
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
		$res.clear();
		var originalCurrentDir =$server_gateway.currentDir;
		$server_gateway.currentDir=$application.directory
		if (!this.onError404 || !this.onError404()){
			Myna.print("The file you requested is not available at that location.")
		}
		$server_gateway.currentDir=originalCurrentDir;
		$res.setStatusCode(404);
		$res.flush();
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
		var appPaths = $server.requestDir.substring($server.rootDir.length).split("/");
		//var appPaths = path.substring($server.rootDir.length).split("/");
		
		appPaths.splice(0,0,""); //prepend rootDir entry
		appPaths.pop(); //remove trailing blank caused by trailing slash in $server.requestDir
		
		var curPath = $server.rootDir;
		for (var x=0; x < appPaths.length;++x){
			if (appPaths[x].length) curPath += appPaths[x] +"/" ;
			var appFile = new Myna.File(curPath + "application.sjs");
			if (appFile.exists()){
				$application.directory = curPath;
				$application.url = $server.rootUrl +$application.directory.right($application.directory.length -$server.rootDir.length)
				var before = $server_gateway.currentDir;
				$server_gateway.currentDir =curPath;
				Myna.includeOnce(curPath + "application.sjs");
				$server_gateway.currentDir = before;
			}
		}
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