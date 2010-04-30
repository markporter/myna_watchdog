includeOnce("myna_admin.sjs");
includeOnce("fusebox.sjs"); // load functions as properties of the fusebox object

if (fusebox[$req.data.fuseaction]){
	try{
		var result = fusebox[$req.data.fuseaction]($req.data,$req.rawData);
		if (result){
			$res.setContentType("application/json")
			print(result.toJson());
		}
	} catch(e){
		$application.onError(__exception__);	
	}
} else {
	throw "No Fuseaction \"" + $req.data.fuseaction + "\" defined."
}

