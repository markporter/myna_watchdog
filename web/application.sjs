
if ($server.serverUrl &&!/^https:/.test($server.serverUrl)){
	var newUrl = "{0}{1}{2}".format(
		$server.serverUrl.replace(/http/,"https"),
		$server.requestUrl,
		$server.requestScriptName
			
	)
	$res.redirect(newUrl)
	Myna.abort()
}
	