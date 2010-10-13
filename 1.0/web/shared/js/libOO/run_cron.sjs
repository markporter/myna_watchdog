var now = new Date();
//now = Date.parseDate("07/01/2011 00:30","m/d/Y H:i")
var config = $req.data.arguments[0]
//check for new style
if (/^\s*\{/.test(config)){
	config = config.parseJson();	
} else {
	Myna.lock("__UPGRADE_CRON_PROPERTIES__",0,function(){
		var cronProperties = Myna.loadProperties("/WEB-INF/classes/cron.properties");
		cronProperties.forEach(function(config,k){
			if (!/^\s*\{/.test(config)){
				var newConfig ={} 
				config.split(/,/).forEach(function(tuple){
					var [key,value] = tuple.split("=");
					if (parseInt(value) == value){
						newConfig[key] =parseInt(value);
					} else {
						newConfig[key] =value;
					}
				})
				newConfig.type="Simple";
				var startDate=now.clearTime(true);
				if (newConfig.start_date){
					startDate = new Date(newConfig.start_date)
				} 
				if (!newConfig.start_date_time){
					newConfig.start_date_date = startDate.format("m/d/Y")
					newConfig.start_date_time = startDate.format("H:i")
				}
				
				cronProperties[k] = newConfig.toJson()
			}
		})
		
			
		Myna.saveProperties(cronProperties,"/WEB-INF/classes/cron.properties");
		new Packages.info.emptybrain.myna.CronThread();
	})
	Myna.abort()
}


var name = config.name;
var appname = "task_"+name.replace(/\W+/g,"_").toLowerCase();
var detail;
function log(type, label,detail){
	Myna.logSync(type,"Task '"+name+"': " +(label||""),detail||"",appname);
}
try{
	var shouldRun = false;
	var times ={
		milli:1,
		seconds:1000,
		minutes:1000*60,
		hours:1000*60*60,
		days:1000*60*60*24,
		weeks:1000*60*60*24*7,
	}
	var targetmonth;
	//Myna.printConsole(config.name,Myna.dumpText(config));
	if (config.is_active){
		if (config.start_date <= now){
			if (
				!(config.end_date instanceof Date) 
				|| config.end_date.clearTime(true) >= now.clearTime(true)
			){
				var lock =new Myna.File("/WEB-INF/myna/cron_lock/" + appname);
				var elapsed = false; 
				if (lock.exists()){
					elapsed = now.getTime() - lock.lastModified.getTime();
				} 
				
				switch (config.type.toLowerCase()){
					case "simple":
						var interval= config.interval*times[config.scale.toLowerCase()];
						if (!elapsed ||elapsed >= interval){
							shouldRun = true;
						}
					break;
					case "hourly":
						if (!elapsed || elapsed >= times.hours*config.hourly_repeat){
							if (parseInt(now.format("i")) == parseInt(config.hourly_minutes)){
								shouldRun = true;
							}
						}
					break;
					case "daily":
						
						if (!elapsed || elapsed >= times.days*config.daily_repeat){
							if (now.format("H:i") == config.daily_time){
								shouldRun = true;
							}
						}
					break;
					case "weekly":
						if (!elapsed || elapsed >= times.weeks*config.weekly_repeat){
							if (now.format("H:i") == config.weekly_time){
								//check time
								if (!(config.weekly_days instanceof Array)){
									config.weekly_days = [config.weekly_days];
								}
								var nowDay = parseInt(now.format("w"));
								//check day of week
								if (config.weekly_days.indexOf(nowDay) !=-1){
									shouldRun = true;
								}
								
								
							}
						}
					break;
					case "monthlybydate":
						if (!elapsed || elapsed >= times.days*28*config.monthly_by_date_repeat){
							
							if (now.format("j H:i") ==parseInt(config.monthly_by_date_day)+" "+config.monthly_by_date_time){
								shouldRun = true;
								
								//one last sanity check if there is lock file
								if (elapsed){
									var elapsedMonths = Date.monthsBetween(config.start_date,now);
									if (elapsedMonths%config.monthly_by_date_repeat != 0){
										shouldRun = false;
									}
								}
							}
						}
					break;
					case "monthlybyweekday":
						if (!elapsed || elapsed >= times.days*28*config.monthly_by_weekday_repeat){
							if (now.format("n w H:i") ==parseInt(config.monthly_by_weekday_day)+" "+config.monthly_by_weekday_time){
								if (Math.ceil(new Date().getDate()/7) == config.monthly_by_weekday_daycount){
									shouldRun = true;
									
									//one last sanity check if there is lock file
									if (elapsed){
										var elapsedMonths = Date.monthsBetween(config.start_date,now);
										if (elapsedMonths%config.monthly_by_weekday_repeat != 0){
											shouldRun = false;
										}
									}
								}
							}
						}
					break;
					case "yearly":
						if (!elapsed || elapsed >= times.days*365*config.yearly_repeat){
							if (
								now.format("m/d") ==config.yearly_date
								&& now.format("H:i") ==config.yearly_time
							){
								shouldRun = true;
							}
						}
					break;
					default:
						shouldRun=false;
						log("error","Schedule type " + config.type +" is undefined");
					
				}
				if (shouldRun){
					lock.writeString(java.lang.Thread.currentThread().getId());
					log("info","started.")
					if (/^https?:\//.test(config.script)){
						var h = new Myna.HttpConnection({
							url:config.script,
						})
						h.connect();
					
						if (h.getStatusCode() == 200){
							log("info","completed.")
						} else {
							detail =[
								Myna.dump(h.responseHeaders,"Response headers"),
								Myna.dump(config,"Task Config"),
								"<h2>Output</h2>",
								h.getResponseText()
							].join("<br>\n")
							log("error","Connection Error, Status: " + h.getStatusCode() ,detail);
						}
					} else { //should be a script file
						var script = new Myna.File(config.script);
						if (script.exists()){
							Myna.include(config.script);
							log("info","completed.")
						} else {
							throw new Error("Task Script '"+config.script+"' does not represent a valid URL or script file");
						}
					}
				}
			}
		}
	}
} catch (e){
	detail =[
		Myna.formatError(e),
		Myna.dump(config,"Task Config"),
		"<h2>Output</h2>",
		$res.getContent()
	].join("<br>\n")
	log("error","Error: " +e.message,detail);	
}

