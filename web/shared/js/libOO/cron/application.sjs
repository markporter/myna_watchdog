if (!$req.arguments.length){
	Myna.log("warning","Attempted access of cron script via URL",Myna.dump($req));
	Myna.abort("Scripts in this directory cannot be accessed via the web.")
} 
