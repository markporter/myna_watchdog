/* Topic: Loggers/myna_log/logger.sjs 

*/

/* Function: log
	Logs to myna_log data source
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
		
		new Myna.Query({
			ds:"myna_log",
			sql:<ejs>
				insert into myna_log_general(
					app_name,
					detail,
					event_ts,
					hostname,
					instance_id,
					label,
					log_elapsed,
					log_id,
					purpose,
					request_elapsed,
					request_id,
					type
				) values (
					{app_name},
					{detail},
					{event_ts:timestamp},
					{hostname},
					{instance_id},
					{label},
					{log_elapsed:bigint},
					{log_id},
					{purpose},
					{request_elapsed:bigint},
					{request_id},
					{type}
				)
			</ejs>,
			values:data
		})
		//new Myna.DataManager("myna_log").getManager("myna_log_general").create(data)
		
	}