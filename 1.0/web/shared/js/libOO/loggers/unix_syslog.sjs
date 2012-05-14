/* Topic: Loggers/unix_syslog/logger.sjs 

*/

/* Function: log
	Logs to unix syslog
	*/
	function log(data){
		
		data.checkRequired(["log_id"]);
		data.setDefaultProperties({
			type:"info",
			label:"",
			detail:"",
			app_name:"",
			event_ts:"",
			hostname:"",
			instance_id:"",
			log_elapsed:"",
			purpose:"",
			request_elapsed:"",
			request_id:""
		})
		
		var types="debug,error,warning,info";
		if (!types.listContainsNoCase(data.type)){
			data.type="info"	
		}
		
		var logger =org.productivity.java.syslog4j.Syslog.getInstance("unix_syslog")
		
		var title ="[Myna/{instance_id}] [{app_name}] [{type}] {label}".format(data); 
		var body = <ejs>
			[Myna/{instance_id}] [{app_name}] [{type}] {label}
			**** Begin log id {log_id} ****
			log_id:             {log_id}
			request_id:         {request_id}
			event_ts:           {event_ts}
			hostname:           {hostname}
			instance_id:        {instance_id}
			purpose:            {purpose}
			log_elapsed:		  {log_elapsed}
			request_elapsed:    {request_elapsed}
			detail:             
			{detail}
			**** End log id {log_id} ****
			
		</ejs>.format(data)
		body.split(/\n/).forEach(function(line){
			logger[data.type.toLowerCase()](line.replace(/^-/,"\\-"))
		})
		/* logger[data.type.toLowerCase()](title)
		logger[data.type.toLowerCase()](body) */
		logger.flush()
		
		
		
		
	}