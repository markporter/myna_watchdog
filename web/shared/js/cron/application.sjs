if (!$req.arguments || !$req.arguments.length){
	Myna.log("warning","Attempted access of cron script via URL",Myna.dump($req));
	$req.handled=true;
	Myna.print("Scripts in this directory cannot be accessed via the web.")
} 
