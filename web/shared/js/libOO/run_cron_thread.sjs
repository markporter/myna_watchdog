function run() {
	try{
		$server_gateway.environment.put("threadName","Scheduled Task Thread");
		//Myna.printConsole("----------- Cron Thread Wakeup ---------","");
		var now = new Date().getTime();
		var mt = $server_gateway;
		
		var cron = mt.waitingCronTasks.peek();
		if (!cron){
			return;
		}
		
		if (cron.nextRun > now){
			//Myna.printConsole("Waiting for " + cron.name);
			return;
		}
		
		cron = mt.waitingCronTasks.poll();
		if (!cron) return;

		
		Myna.Admin.task.scheduleNextRun(cron.name);

		new Myna.Thread(function (name) {
			$server_gateway.environment.put("threadName","Task: {0}".format(name));
			Myna.Admin.task.run(name);
		},[cron.name]);
		//Myna.printConsole("Fired Task " + cron.name);
		
		//run();
		
	} catch(e){
		Myna.logSync(
			"error",
			"Task Scheduler Error" +(e.message||""),
			Myna.formatError(e)
		);
	}
}
run();
