var $this = this;
var gotlock =Myna.lock("MYNA_ADMIN:reload_cron",0,function(){
	if (new Myna.File("/WEB-INF/classes/cron.properties").exists()){
		var cronProperties = Myna.loadProperties("/WEB-INF/classes/cron.properties");
		cronProperties
		.filter(function(propJson,name){
			if($this.name){
				return name == $this.name
			} else {
				return true
			}
		})
		.forEach(function(propJson,name){
			$profiler.mark("Loading Cron: " + name+", waiting for lock")
			try{
				var threadPermit = Packages.info.emptybrain.myna.ScriptTimerTask.threadPermit
				var TimeUnit = java.util.concurrent.TimeUnit
				var timeout = 30
				var gotPermit =threadPermit.tryAcquire(timeout,TimeUnit.SECONDS);
				if (!gotPermit) {
					throw new Error("Too Many Threads: Unable reload cron after {0} seconds.".format(timeout));
				}
				//Packages.info.emptybrain.myna.ScriptTimerTask.threadPermit.acquire();
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
	}
})
if (!gotlock) {
	Myna.printConsole("============================= failed lock ===================================")
	throw new Error("Unable to reload cron due to previous reload in progress")
}