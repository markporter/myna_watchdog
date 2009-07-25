//append request start function
$application.appendFunction("onRequestStart",function(){
	if ($server.requestDir.left($server.currentDir.length) == $server.currentDir){
		$res.print($profiler.getSummaryHtml())
		Myna.abort("Scripts in this directory cannot be accessed via the web.")
		
	} 
});
