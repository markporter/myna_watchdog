var cronProperties = Myna.loadProperties("/WEB-INF/myna/cron.properties");
cronProperties.forEach(function(propJson,name){
	try{
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
				var task = new java.util.TimerTask({
					rootDir:$server.rootDir,
					rootUrl:$server.rootUrl,
					scriptPath:new Myna.File(cron.script).toString(),
					run:function(){
						$server_gateway.includeOnce("/shared/js/libOO/standard_objects.sjs")
						Myna.include(this.scriptPath);
						$application._onRequestEnd();
						//Myna.log("debug","running cron " + this.scriptPath);
					},
					cancel:function(){return true},
					scheduledExecutionTime:function(){return 100}
				})
				if (!cron.type) cron.type="simple";
		
			switch(cron.type){
				case "simple":
					if (!cron.startDate) cron.start_date = new Date();
					if (!cron.scale) cron.scale = "seconds";
					var factor = {
						"milliseconds":1,
						"seconds":1000,
						"minutes":1000*60,
						"hours":1000*60*60,
						"days":1000*60*60*24,
						"weeks":1000*60*60*24*7
					}				
					var i = parseInt(parseFloat(cron.interval)*factor[cron.scale]);
					timer.schedule(task,cron.start_date,i);
					task=null;
				break;
			} 
		}
	} catch(e){java.lang.System.out.println("Loading cron: " + e)}
})
