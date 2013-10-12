/* Function: log 
	logs a string to the general log table 
	 
	Parameters: 
		type		- 	Any short text value representing the type of log, such 
						as DEBUG, INFO, ERROR, WARN, PROFILE, etc. This value is 
						forced upper case
		label		-	As short single-line text description of the log
		detail		-	*Optional, default null* an HTML description of the log 
		app_name	-	*Optional, default $application.appName* A short text 
						value representing the application that generated the 
						log.  This value is forced lower case
						
	Detail:
		This function logs to the myna_log_general table in the myna_log 
		datasource. If you run multiple instances of Myna, it may be helpful to 
		point the myna_log datasource of each instance to the same database. You
		Can view the logs through the Myna Adminstrator
		
		Normally <Myna.log> attempts to perform logging in a low priority 
		asynchronous thread. If <Myna.log> is called from within a <Myna.Thread>
		instance, however, it will not spawn a separate thread for logging. This 
		prevents recursive thread spawning for logging. For example if you need 
		to call <Myna.dump> on a large object, you may get better performance by
		dumping in a separate thread:
		
		(code)
			//slow way: 
			Myna.log("debug","Dump of myHugeQuery",Myna.dump(myHugeQuery));
			
			//faster way (releases the current thread immediately)
			new Myna.Thread(function(myHugeQuery){
				Myna.log("debug","Dump of myHugeQuery",Myna.dump(myHugeQuery));
			},[myHugeQuery],-90)
		(end)
		
	 
	*/
	Myna.log2=function Myna_log(type,label,detail,app_name){
		Myna.logSync(type,label,detail,app_name)
			
				
	}
/* Function: logSync
	A single threaded synchronous version of Myna.log
	
	See <Myna.log> for parameters and detail
 */	
	Myna.logSync2=function Myna_logSync(type,label,detail,app_name){
		var params ={
			type:type||"info",
			label:label||"",
			detail:detail||"",
			appname:app_name||$application.appname||"system"
		}
		var title="[{appname}] [{type}]: {label}".replace(/\s+/g," ").format(params)
		var msg = detail
		Myna.printConsole(title,msg)		
	}
Myna.dump2 = Myna.dumpText