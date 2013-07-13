var threadArray = $server_gateway.runningThreads.toArray();
threadArray.forEach(function(thread){
	if (thread.requestTimeout){
		var runTimeSeconds = (new Date().getTime() - thread.started.getTime())/1000
		if (runTimeSeconds > thread.requestTimeout){
			if (thread.threadScope.$profiler){
				thread.threadScope.$profiler.mark(
					"Stopping thread because " +runTimeSeconds + " exceeds "
					+"requestTimeout of " + thread.requestTimeout);
				thread.javaThread.interrupt();
			}
		}
	}
})