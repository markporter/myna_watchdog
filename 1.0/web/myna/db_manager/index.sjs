
/* if ("auth_token" in $req.rawData){
	var user_id = Myna.Permissions.consumeAuthToken($req.rawData.auth_token)
	if (user_id){
		$cookie.setAuthUserId(user_id);
		$res.metaRedirect($server.scriptName+'?fuseaction=main&ds='+$req.rawData.ds)
		Myna.abort();
	}
} */

includeOnce("fusebox.sjs"); // load functions as properties of the fusebox object

/* Pre-request */
	var session_cookie;		// stores encrypted session data
	
	
	if (!$req.data.fuseaction) $req.data.fuseaction=$application.defaultFuseAction;
	//is the user authenticated?	
	if (!$cookie.getAuthUserId()){
		if ($application.noAuthFuses.indexOf($req.data.fuseaction.toLowerCase()) == -1){
			/* 	if the fuseaction requires authentication, 
				but the user is not authenticated, then set
				the fuseaction to the default (login)
			*/
			$req.data.fuseaction=$application.defaultFuseAction;
		}
	}
/* Handle request */
	if (!fusebox[$req.data.fuseaction]){
		throw new Error("No Fuseaction \"" + $req.data.fuseaction + "\" defined.");
	}
	var result = fusebox[$req.data.fuseaction]($req.data);
	if (result){
		print(result.toJson());
	}
/* Post-request */
	

