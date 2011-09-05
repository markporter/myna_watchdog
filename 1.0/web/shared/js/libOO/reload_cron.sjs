var cronProperties = Myna.loadProperties("/WEB-INF/classes/cron.properties");
cronProperties.forEach(function(propJson,name){
	$profiler.mark("Loading Cron: " + name+", waiting for lock")
	try{
		Packages.info.emptybrain.myna.ScriptTimerTask.threadPermit.acquire();
		var cron = propJson.parseJson();
		var timer = $server_gateway.cron.get(name);
		//clear the old timer
		if (timer){   
			timer.cancel();
			timer.purge();
		}
		if (parseInt(cron.is_active)){
			timer = new java.util.Timer();
			$server_gateway.cron.put(name,timer);
			var task = new Packages.info.emptybrain.myna.ScriptTimerTask();
			task.config = propJson;
			timer.schedule(task,new Date());
		}
	} catch(e){
		java.lang.System.out.println("Loading cron: " + e)
		Myna.log("error","Cron: " + name +":" +e,Myna.formatError(e));
	}
})
