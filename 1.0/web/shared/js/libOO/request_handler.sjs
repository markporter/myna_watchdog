//throw new Error(Myna.dump(this))
try{
	//standard objects
	$server_gateway.includeOnce("/shared/js/libOO/standard_objects.sjs")
	
	
	//server start scripts, if necessary
	if ($server_gateway.isInitThread){
		/* This is now handled in the JSServlet init */
	}
	if ($server_gateway.environment.get("threadFunction")){
		try { 
			var f=$server_gateway.environment.get("threadFunction");
			var args = $server_gateway.environment.get("threadFunctionArguments");
			args = Array.prototype.slice.call(args,0);
			
			f.apply($server.globalScope,args||[]);
		} catch(e){
			$server_gateway.log("ERROR","ThreadError: " + String(e.message),Myna.formatError(__exception__));
		} 
	} else {
		//request script
		var rs = new Myna.File($server.requestDir + $server.requestScriptName); 
		if (rs.exists()){
			Myna.includeOnce($server.requestDir + $server.requestScriptName)
		} else {
			$res.setStatusCode(404, "The file you requested is not available at that location.");
			$res.clear();
			Myna.abort();
		}
	}
} finally{
	//on end
	$application._onRequestEnd();
}