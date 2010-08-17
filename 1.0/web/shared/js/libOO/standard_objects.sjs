Myna.includeOnce("standard_objects/profiler.sjs");
Myna.includeOnce("standard_objects/server.sjs");
Myna.includeOnce("standard_objects/req.sjs");
Myna.includeOnce("standard_objects/cookie.sjs");
Myna.includeOnce("standard_objects/session.sjs");
Myna.includeOnce("standard_objects/res.sjs");
Myna.includeOnce("standard_objects/app.sjs");

//calculate path
/* var path = $server.requestDir;
if ($server.requestScriptName == "__ERROR_404__.sjs" && $server.request){
	path =String($server.request.attributes.get('javax.servlet.forward.servlet_path')).listBefore("/")
	path = new Myna.File(path).toString(); 
}  */

