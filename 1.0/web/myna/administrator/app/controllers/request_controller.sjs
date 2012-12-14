/*jshint undef:false unused:false*/
/* ---------- list ---------------------------------------------------------- */
	function list(params){
		
		var threads = $server_gateway.runningThreads.toArray();
		var running=0;
		var queued=0;
		threads.forEach(function(t){
			if (t.isWaiting){
				queued++;
			} else {
				running++;
			}
		});
		return {
			memUsed:$server.memToScale($server.memUsed,"m") +"MB",
			memFree:(($server.memAvailable/$server.memMax)*100).toFixed(2) +"%",
			uptime:Date.formatInterval(new Date().getTime() - $server_gateway.serverStarted.getTime()).split(",").slice(0,2).join(),
			runningThreads:--running,
			waitingThreads:queued,
			threads:threads
			.filter(function(thread){
				return thread.hashCode() != $server_gateway.hashCode(); 
			})
			.map(function(thread,i){
				var scope = thread.threadScope;
				var current_task="";
				var url;
				var req = thread.environment.get("request");
				var runtime=new Date().getTime() - thread.started.getTime();
				var current_runtime=runtime;
				if (req){
					url=req.getRequestURI();
				} else {
					if (thread.environment.get("threadParent") && thread.environment.get("threadParent").environment.get("request")){
						req = thread.environment.get("threadParent").environment.get("request");
						url="Thread in " +req.getRequestURI();
					} else {
						url="Thread in :"+thread.requestDir +thread.requestScriptName;
						if (thread.requestScriptName =="run_cron.sjs"){
							url = "Cron: " + thread.environment.get("commandlineArguments")[1].parseJson().name;
						}
					}
					if (thread.environment.get("threadName")){
						url=thread.environment.get("threadName");
					} 
				} 
				
				if (thread.isWaiting){
					current_task="Queued";
				} else if (scope && scope.$profiler){
					current_runtime=0;
					try {
						var times = scope.$profiler.getSummaryArray();
						var time = times[times.length-1];
						current_task=time.label||"";
						current_runtime=new Date().getTime() - time.begin;
					} catch(e){}
					
				} 
				return {
					rownum:i,
					thread_id:thread.hashCode(),
					url:url,
					started:new Date(thread.started.getTime()).format("H:i:s"),
					current_task:current_task, 
					is_white_listed:thread.isWhiteListedThread,
					current_runtime:current_runtime,
					runtime:runtime
				};
			})
		};
		
	}
/* ---------- explore ---------------------------------------------------------- */
	function explore(params) {
		params.checkRequired(["code","thread_id"]);
		var t = $server_gateway.runningThreads.toArray()
		.filter(function(thread){
			return thread.hashCode() == params.thread_id
		})[0];
		
		if (t){
			$server_gateway.executeJsString(t.threadScope,params.code,"Myna Administrator");
			this.renderContent($res.clear());
		}else{
			this.renderContent("Thread id " + params.thread_id + " no longer exists");
		}
		
	}
/* ---------- gc ---------------------------------------------------------- */
	function gc(params){
		java.lang.System.gc();
		return {success:true};
	}
/* ---------- run ---------------------------------------------------------- */
	function run(params){
		Myna.log(
			"info",
			"Starting task {0} from Myna Administrator".format(params.name),
			null,
			Myna.Admin.task.nameToID(params.name)
		);
		Myna.Admin.task.run(params.name);
		return {success:true};
	}