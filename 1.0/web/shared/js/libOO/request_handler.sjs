//throw new Error(Myna.dump(this))
try{
	//standard objects
	$server_gateway.includeOnce("/shared/js/libOO/standard_objects.sjs")
	//if the application.sjs has not already handled this request
	if (!$req.handled){
		//server start scripts, if necessary
		if ($server_gateway.isInitThread){
			/* This is now handled in the JSServlet init */
		}
		if ($server_gateway.environment.get("threadFunctionSource")){
			(function(){
					var src = String($server_gateway.environment.get("threadFunctionSource"))
					.replace(/(function.*?{)(.*)}/,'$1try{$2}catch(e){$server_gateway.log("ERROR","ThreadError: " + String(e.message),Myna.formatError(e));}}' ) 
						//+ ''
				//Myna.log("debug","src",Myna.dump(String($server_gateway.environment.get("threadFunctionSource"))));
				//Myna.log("debug","src",Myna.dump(src));
				var f =eval(src);
				
				var args = $server_gateway.environment.get("threadFunctionArguments");
				args = Array.prototype.slice.call(args,0);
				var result = f.apply($server.globalScope,args||[])
				$server_gateway.environment.put("threadReturn",result);
				$server_gateway.environment.put("threadComplete",true);
			})()
		} else if (/\.ws$/.test($server.requestScriptName)){ //web service calls
			(function(){
				try{
					var file = new Myna.File($server.requestDir + $server.requestScriptName)
					var config =$server_gateway.threadContext.evaluateString(
					  this,
					  "(" +$server_gateway.translateString(file.readString(),file.toString()) +")",
					  file.toString(),
					  1,
					  null
					);
				
					new Myna.WebService(config).handleRequest($req);
				} catch(e){
					Myna.println("An error has occured. See log for details.")
					Myna.logSync("error","Web Service Error in "+$server.requestScriptName,Myna.formatError(e));	
				}
			})()
			
		} else if (/\application.sjs$/.test($server.requestScriptName)){
			Myna.print("application.sjs files cannot be accessed remotely")
			Myna.abort();
		} else {
			//request script
			$req.scriptFile =new Myna.File($server.requestDir + $server.requestScriptName);
			
			// try to resolve mapping
			
			if ($req.scriptFile.exists() && $req.scriptFile.fileName.match(/\.(sjs|ejs|ws)$/)){
				Myna.includeOnce($server.requestDir + $server.requestScriptName)
			} else {
				//process REST params
				if (!$server_gateway.requestScriptName 
					|| !new Myna.File($server_gateway.requestDir+"/"+$server_gateway.requestScriptName).exists()
				){
					var params=[]
					var dirStack = $server.requestDir.after($server.rootDir.length).split("/")
						.filter(function(e){return e.length})
					//Myna.abort("dirstack",$server)
					var curFile;
					var dir,name;
					var found = false;
					if ($server_gateway.requestScriptName) dirStack.push($server_gateway.requestScriptName);
					var rootIndex = !dirStack.length
					while (dirStack.length || rootIndex){
						if (!$server_gateway.requestScriptName){
							curFile=new Myna.File($server.rootDir +dirStack.join("/") + "/index.ejs");
							if (curFile.exists()) {
								dir=dirStack.join("/")
								name= "index.ejs";
								found=true;
								break;
							} else {
								curFile=new Myna.File($server.rootDir +dirStack.join("/") + "/index.sjs");
								if (curFile.exists()) {
									dir=dirStack.join("/")
									name= "index.sjs";
									found=true;
									break;
								} else {
									curFile=new Myna.File($server.rootDir +dirStack.join("/") + "/index.html");
									if (curFile.exists()) {
										$res.serveFile(curFile);
										Myna.abort();
									}	
								}
							}
						}
						curFile=new Myna.File($server.rootDir+dirStack.join("/"));
						if (curFile.exists() && !curFile.isDirectory()) {
							name= dirStack.pop();
							dir=dirStack.join("/")
							
							found=true;
							break;
						}
						params.unshift(dirStack.pop());
					}
					if(found){
						//reset pathing:
						$server_gateway.currentDir = $server.rootDir+dir+"/";
						$server_gateway.requestDir = $server_gateway.currentDir;
						$server_gateway.scriptName = name
						$server_gateway.requestScriptName = $server_gateway.scriptName;
						var serverUrl = $server.serverUrl;
						$server_gateway.environment.put("requestURI",$server.rootUrl + dir+"/"+name);
						$server_gateway.environment.put("requestURL",serverUrl+$server.rootUrl + dir+"/"+name);
						$req.$restParams = params;
						Myna.includeOnce($server.rootDir +dir + "/"+name)
					} else if ($server.scriptName == "" 
							&& parseInt($server.properties.enable_directory_listings)
							){
						Myna.include("/myna/dir_listing.sjs")
					} else {
						$application._onError404();
					}
					
				} else {
					$res.serveFile($req.scriptFile,{headers:$req.headers});
					Myna.abort();
				}
			}
		}
		/* dump translated code to /WEB-INF/parser_debug */
		if (Myna.getGeneralProperties().debug_parser_output == "1"){
			var translated =Myna.JavaUtils.mapToObject($server_gateway.translatedSources);
			translated.forEach(function(source,path,translated){
				var target;
				var sourcePath = new Myna.File(path);
				if (sourcePath.exists()){
					target=new Myna.File(
						"/WEB-INF/myna/parser_debug/" 
						+ sourcePath.toString().after($server.rootDir.length).listBefore(".").replace(/\W+/g,"_")
						+ sourcePath.toString().listLast(".")
					);
				} 
				if (!target){
					var newSourcePath  = new Myna.File("/shared/js/libOO/" + sourcePath.toString().after($server.rootDir.length).listAfter("/"));
					if (newSourcePath.exists()){
						target=new Myna.File(
							"/WEB-INF/myna/parser_debug/" 
							+ newSourcePath.toString().after($server.rootDir.length).listBefore(".").replace(/\W+/g,"_")
							+ newSourcePath.toString().listLast(".")
						);
					} 
				}
				
				if (!target){
					 /* target=new Myna.File(
					 	 $server.currentDir 
					 	 + path.listBefore(".").replace(/\W+/g,"_") 
					 	 + path.listLast(".")
					 ) */
				}
				
				if (target){
					target.getDirectory().createDirectory();
					target.writeString(source)
				}
			})
		}
	}
} catch(e){
	if (e.message != "___MYNA_ABORT___"){
		Myna.log("ERROR","Thread Error: " +e.message,Myna.formatError(e));
		$application.onError(e);
	}
} finally{
	//on end
	$application._onRequestEnd();
	
}
