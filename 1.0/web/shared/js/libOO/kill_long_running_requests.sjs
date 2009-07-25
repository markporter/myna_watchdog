var threadArray = $server_gateway.runningThreads.toArray();

threadArray.forEach(function(thread){
	if (
			thread.requestTimeout 
			&& !thread.isWhiteListedThread
	){
		var runTimeSeconds = (new Date().getTime() - thread.started.getTime())/1000
		if (runTimeSeconds > thread.requestTimeout){
			thread.javaThread.interrupt();
			var msg = "Attempting to stop thread because " +runTimeSeconds + " exceeds "
				+"requestTimeout of " + thread.requestTimeout;
			
			if (thread.threadScope.$profiler){
				thread.threadScope.$profiler.mark(msg);
			}
			if (thread.threadScope.$server){
				var profile=""
				if (thread.threadScope.$profiler){
					profile = thread.threadScope.$profiler.getSummaryHtml();
				}
				Myna.log(
					"Error",
					"Request Timeout: " + thread.threadScope.$server.requestUrl + thread.threadScope.$server.requestScriptName,
					msg + "<hr>" + profile + "<hr>" +Myna.dump(thread.threadScope.$req)
				);
			}
		}
	}
})