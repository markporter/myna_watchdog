/*global Myna:false $req:true $profiler:false $server_gateway:false java:false Packages:false $res:false*/
$req.timeout=0;

$profiler.mark("Checking config");
var now = new Date();
var config = $req.data["arguments"][0];
config = config.parseJson();
if (//has the end date passed already?
	config.end_date instanceof Date &&
	config.end_date.clearTime(true) > now.clearTime(true)
) {
	if (config.remove_on_expire) Myna.Admin.removeTask(config.name);
	Myna.abort();
}



var appname = "task_"+config.name.replace(/\W+/g,"_").toLowerCase();
var detail;
new Myna.File("/WEB-INF/myna/cron/").createDirectory();
var shouldRun = false;
var stateFile =new Myna.File("/WEB-INF/myna/cron/" + appname);
var state={
	config:config,
	nextRun:false
};
if (stateFile.exists()){
	try{
		var curState=stateFile.readString().parseJson();
		if (curState.config.toJson() == config.toJson()){
			state = curState;
			
			shouldRun =now.add(Date.DAY,-1) < state.nextRun && state.nextRun < now.add(Date.MINUTE,1);
		}
	} catch(e){
		Myna.log("error","task: " + config.name+": bad state file " +stateFile.toString(),Myna.formatError(e));
	}
}

//var elapsed = false;

function log(type, label,detail){
	$profiler.mark("Task '"+config.name+"': " +(label||""));
	Myna.logSync(type,"Task '"+config.name+"': " +(label||""),detail||"",appname);
	
	/*Myna.printConsole("Task " +config.name+": " +label,<ejs>
			<%=$server.memToScale($server.memUsed,"m")%>MB Used <%=(($server.memAvailable/$server.memMax)*100).toFixed(2)%>% free memory
		</ejs>)*/
}

function getNextRunDate(){
	var times ={
		milli:1,
		seconds:1000,
		minutes:1000*60,
		hours:1000*60*60,
		days:1000*60*60*24,
		weeks:1000*60*60*24*7
	};
	
	if (!config.start_date){
		if (config.start_date_date) config.start_date= Date.parse(config.start_date_date,"m/d/Y");
		if (!config.start_date) config.start_date = new Date().add(Date.MINUTE,-1);
	}
	var nextRun = config.start_date;
	if (state.nextRun && state.nextRun <= now) nextRun = state.nextRun;
	var startHour = config.start_date.getHours();
	
	switch (config.type.toLowerCase()){
		case "simple":
			var interval= config.interval*times[config.scale.toLowerCase()];
			nextRun =new Date(now.getTime() + interval);
			break;
			
		case "hourly":
			if (startHour < now.getHours()){
				nextRun =nextRun.add(Date.DAY,-1);
			}
			nextRun.setHours(startHour);
			nextRun.setMinutes(config.hourly_minutes);
			var last=new Date();
			while(nextRun < now ) {
				last=nextRun;
				
				nextRun =new Date(nextRun.getTime() + 1*60*60*1000);
				if (last.getTime() == nextRun.getTime()) {
					Myna.abort();
				}
			}
			
			break;
			
		case "daily":
			nextRun.setHours(config.daily_time.listFirst(":"));
			nextRun.setMinutes(config.daily_time.listLast(":"));
			
			while(nextRun < now) {
				nextRun =nextRun.add(Date.DAY,parseInt(config.daily_repeat,10));
			}
			
			break;
			
		case "weekly":
			
			var weekly_days = config.weekly_days;
			if (!(weekly_days instanceof Array)) weekly_days=[weekly_days];
			weekly_days.sort(String.compareNumeric);
			
			var thisDOW = now.getDay();
			var firstDayThisWeek = now.add(Date.DAY,thisDOW * -1).clearTime();
			var startDOW = nextRun.getDay();
			var firstDayInFirstWeek= nextRun.add(Date.DAY,startDOW * -1).clearTime();
			
			var targetWeek = firstDayInFirstWeek;
			while (targetWeek < firstDayThisWeek) {
				targetWeek =targetWeek.add(Date.DAY,parseInt(config.weekly_repeat,10) * 7);
				
			}
			targetWeek.setHours(config.weekly_time.listFirst(":"));
			targetWeek.setMinutes(config.weekly_time.listLast(":"));
			
			
			var thisWeek = weekly_days.some(function(day){
				
				if (targetWeek.add(Date.DAY,day) > now){
					nextRun = targetWeek.add(Date.DAY,day);
					return true;
				}
				return false;
			});
			if (!thisWeek){
				targetWeek =targetWeek.add(Date.DAY,parseInt(config.weekly_repeat,10) * 7);
				nextRun =targetWeek.add(Date.DAY,weekly_days[0]);
			}
			break;
		case "monthlybydate":
			nextRun.setDate(config.monthly_by_date_day);
			nextRun.setHours(config.monthly_by_date_time.listFirst(":"));
			nextRun.setMinutes(config.monthly_by_date_time.listLast(":"));
			
			while(nextRun < now) {
				nextRun =nextRun.add(Date.MONTH,parseInt(config.monthly_by_weekday_repeat,10));
			}
			
			break;
		case "monthlybyweekday":
			var thisMonth = new Date();
			thisMonth.setDate(1);
			thisMonth.clearTime();
			nextRun.setDate(1);
			nextRun.setHours(config.monthly_by_weekday_time.listFirst(":"));
			nextRun.setMinutes(config.monthly_by_weekday_time.listLast(":"));
			
			$profiler.mark("adding repeated months");
			while(nextRun < thisMonth) nextRun = nextRun.add(Date.MONTH,config.monthly_by_weekday_repeat);
			$profiler.mark("adding up to weekday");
			while(nextRun.getDay() != config.monthly_by_weekday_day) nextRun =nextRun.add(Date.DAY,1);
			$profiler.mark("adding week count");
			//Myna.printConsole(nextRun + ": "  + config.monthly_by_weekday_daycount)
			nextRun = nextRun.add(Date.DAY,(config.monthly_by_weekday_daycount-1)*7);
			//Myna.printConsole(nextRun)
			
			if (nextRun < now){//already ran this month
				$profiler.mark("adding extra months");
				nextRun.setDate(1);
				nextRun = nextRun.add(Date.MONTH,config.monthly_by_weekday_repeat);
				while(nextRun.getDay() != config.monthly_by_weekday_day) nextRun =  nextRun.add(Date.DAY,1);
				nextRun = nextRun.add(Date.DAY,(config.monthly_by_weekday_daycount-1)*7);
			}
			$profiler.mark("done");
			break;
		case "yearly":
			nextRun.setMonth(config.yearly_date.listFirst("/") -1);
			nextRun.setDate(config.yearly_date.listLast("/"));
			nextRun.setHours(config.yearly_time.listFirst(":"));
			nextRun.setMinutes(config.yearly_time.listLast(":"));
			
			while(nextRun < now) {
				nextRun =nextRun.add(Date.YEAR,parseInt(config.yearly_repeat,10));
			}
		break;
		default:
			shouldRun=false;
			log("error","Schedule type " + config.type +" is undefined");
		
	}
	log("info","next scheduled for " + nextRun.format("m/d/Y H:i"));
	return nextRun;
	
}

$profiler.mark("checking run criteria.");
try{
	
	state.nextRun = getNextRunDate();
	if (shouldRun){
		state.lastRun=new Date();
	}
	stateFile.writeString(state.toJson());
	var timer = $server_gateway.cron.get(config.name);
	//clear the old timer
	if (timer){
		timer.cancel();
		timer.purge();
	}
	timer = new java.util.Timer(true);
	$server_gateway.cron.put(config.name,timer);
	var task = new Packages.info.emptybrain.myna.ScriptTimerTask();
	task.config = state.config.toJson();
	timer.schedule(task,state.nextRun);
	
		
	if (shouldRun){
		$req.timeout=0;
		log("info","started.");
		if (/^https?:\//.test(config.script)){
			//var startMem = $server.memUsed;
			try{
				var h = new Myna.HttpConnection({
					url:config.script
				});
				h.connect();
				var done = new Date();
				detail =[
					Myna.dump(h.responseHeaders,"Response headers"),
					Myna.dump(config,"Task Config"),
					"<h2>Output</h2>",
					h.getResponseText()
				].join("<br>\n");

				if (h.getStatusCode() == 200){
					
					log("info","completed {0}.".format(done.toString()));
					$res.setExitCode(0);
				} else {
					
					log("error","Connection Error, Status: " + h.getStatusCode() ,detail);
					$res.setExitCode(1,"Connection Error, Status: " + h.getStatusCode());
				}
			} catch(e){
				log("error","Error in cron "+config.name,Myna.formatError(e));
			}
			//var endMem = $server.memUsed;
			$server_gateway.generatedContent=null;
			java.lang.System.gc();
			
				
			
		} else { //should be a script file
			var script = new Myna.File(config.script);
			if (script.exists()){
				try{
					
					Myna.include(config.script);
					log("info","completed.");
				} catch(e){
					log("error","Error in cron "+config.name,Myna.formatError(e));
				}
			} else {
				throw new Error("Task Script '"+config.script+"' does not represent a valid URL or script file");
			}
		}
	}
} catch (e){
	detail =[
		Myna.formatError(e),
		Myna.dump(config,"Task Config"),
		"<h2>Output</h2>",
		$res.getContent()
	].join("<br>\n");
	log("error","Error: " +e.message,detail);
}
