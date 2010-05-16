//throw new Error(Myna.dump(this))
try{
	//standard objects
	$server_gateway.includeOnce("/shared/js/libOO/standard_objects.sjs")
	
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
			if (new Myna.File($server.requestDir + $server.requestScriptName).exists()){
				Myna.includeOnce($server.requestDir + $server.requestScriptName)
			} else {
				$application._onError404();
				/* $res.setStatusCode(404, "The file you requested is not available at that location.");
				$res.clear();
				Myna.abort(); */
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
	Myna.log("ERROR","Thread Error: " +e.message,Myna.formatError(e));
	$application.onError(e);
} finally{
	//on end
	$application._onRequestEnd();
	
}
