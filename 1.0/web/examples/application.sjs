if (!$req.authPassword.length){
   $res.requestBasicAuth("Enter Admin and the administrator password");
   Myna.abort();
}

$application.after("onRequestStart",function(){
		
	if ("view_source" in $req.data){
		var path = ($server.requestDir+$server.requestScriptName).replace(/\.\./g,"FAIL");
		var content =new Myna.File(path)
			.readString()
			.replace(/\t/g,"    ")
			.escapeHtml();
		Myna.print(<ejs>
		<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
		<html>
			<head>
				<title>Source code for <%=$server.requestScriptName%></title> 
				<script type="text/javascript" src="<%=$server.rootUrl%>shared/js/libOO/client.sjs"></script>
				<script type="text/javascript" src="<%=$server.rootUrl%>shared/js/shjs/sh_main.js"></script>
				<script type="text/javascript" src="<%=$server.rootUrl%>shared/js/shjs/lang/sh_myna.js"></script>
				<link type="text/css" rel="stylesheet" href="<%=$server.rootUrl%>shared/js/shjs/css/sh_mild_white.css">
				<script>
					window.onload = function(){
						sh_highlightDocument();
					}
				</script>
				<style>
				pre.sh_myna{
					background-color:#EEE;
					border-left:3px solid black;
					overflow:auto;
					padding:3px;
				}
				</style>
			</head>
			<body>
			<b>Source code for <%=$server.requestDir+$server.requestScriptName%>:</b><p>
			<pre class="sh_myna"><%=content%></pre>
			</body>
		</html>
		</ejs>)
		Myna.abort()
	} 
})