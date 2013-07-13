//append request start function
$application.appendFunction("onRequestStart",function(){
	if ($server.requestDir.left($server.currentDir.length) == $server.currentDir){
		Myna.log(
			"warning",
			"Attempted remote access of " + $server.requestScriptName +" in commonjs folder"
		);
		Myna.abort("Scripts in this directory cannot be accessed via the web.")
	} 
});
