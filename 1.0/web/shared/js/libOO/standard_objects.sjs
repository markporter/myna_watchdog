Myna.includeOnce("standard_objects/profiler.sjs");
Myna.includeOnce("standard_objects/server.sjs");
Myna.includeOnce("standard_objects/req.sjs");
Myna.includeOnce("standard_objects/cookie.sjs");
Myna.includeOnce("standard_objects/session.sjs");
Myna.includeOnce("standard_objects/res.sjs");
Myna.includeOnce("standard_objects/app.sjs");


$application._mergeApplications();
$application._initScopes();
$application._onRequestStart();

