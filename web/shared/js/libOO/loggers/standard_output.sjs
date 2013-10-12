/* Topic: Loggers/standard_output/logger.sjs 

*/

/* Function: log
	Logs to standard output (Myna.printConsole)
	*/
	function log(data){
		data.checkRequired(["log_id"]);
		data.setDefaultProperties({
			type:"",
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
		data.detail = data.detail
			.replace(/\n/g,"_RET_")
			.replace(/<script.*?>.*?<\/script>/ig,"")
			.replace(/<style.*?>.*?<\/style>/ig,"")
			.replace(/<\/?br\/?>/ig,"\n")
			.replace(/<tr.*?\/?>/ig,"\n")
			.replace(/<li.*?\/?>/ig,"\n")
			.replace(/<div.*?\/?>/ig,"\n")
			.replace(/\n\n/ig,"\n")
			.replace(/<\/?p\/?>/ig,"\n\n")
			.replace(/&nbsp;/ig," ")
			.replace(/<\/?[^>]+>/g," ")
			.replace(/_RET_/g,"\n")

		var title = "[{app_name}] [{type}] {label}".format(data)
		var body = <ejs>
			
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
			--------------------------------------------------------------------------------
		</ejs>.format(data)
		Myna.printConsole(title,body);
		
		
		
	}