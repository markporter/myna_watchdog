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
			try { 
				(function(){
					var f =eval(String($server_gateway.environment.get("threadFunctionSource")));
					var args = $server_gateway.environment.get("threadFunctionArguments");
					args = Array.prototype.slice.call(args,0);
					var result = f.apply($server.globalScope,args||[])
					$server_gateway.environment.put("threadReturn",result);
					$server_gateway.environment.put("threadComplete",true);
				})()
					
			} catch(e){
				$server_gateway.log("ERROR","ThreadError: " + String(e.message),Myna.formatError(__exception__));
			} 
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
	}
} catch(e){
	Myna.log("debug","got here");
	$application.onError(e);
} finally{
	//on end
	$application._onRequestEnd();
	
}
