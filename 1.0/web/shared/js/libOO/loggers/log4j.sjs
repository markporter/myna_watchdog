/* Topic: Loggers/log4j/logger.sjs 

*/

/* Function: log
	Logs to log4j data source
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
		data.type= data.type.toLowerCase();
		
		if (data.type == "warning") data.type="warn";
			
		var types="debug,error,warn,info,fatal";
		if (!types.listContainsNoCase(data.type)){
			data.type="info"	
		}
		
		var logger = org.apache.log4j.Logger.getLogger("info.emptybrain.myna.MynaThread")
		var title = "[{app_name}] [{type}] {label}".format(data)
		var body = <ejs>
			[{app_name}] [{type}] {label}
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
		</ejs>.format(data)
		
		logger[data.type](body)
	}