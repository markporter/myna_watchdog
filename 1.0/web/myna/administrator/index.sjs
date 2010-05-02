includeOnce("myna_admin.sjs");
includeOnce("fusebox.sjs"); // load functions as properties of the fusebox object

if (fusebox[$req.data.fuseaction]){
	var result = fusebox[$req.data.fuseaction]($req.data,$req.rawData);
	if (result){
		$res.setContentType("application/json")
		print(result.toJson());
	}

} else {
	throw "No Fuseaction \"" + $req.data.fuseaction + "\" defined."
}

