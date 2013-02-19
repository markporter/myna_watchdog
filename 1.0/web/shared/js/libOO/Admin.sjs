/*global
	java:false
	$server_gateway:false
	$res:false
	$server:false
	$profiler:false
	
	Packages:false
	$req:true
*/
/* 
	Class: Myna.Admin
		API for Administrative functions 
		
		This library contains the functions used by the Myna Administrator for 
		tasks such as DataSource and Scheduled Task management 
		
*/
if (!Myna) var Myna={};
Myna.Admin ={
/* Data Sources */	
	ds:{
	/* Property: Myna.Admin.ds.dsValidation
		a <Myna.Validation> object for validating data source configs
		
		*/
		dsValidation:new Myna.Validation().setLabels({
			desc:"Description",
			db:"Database"
		}).addValidators({
			name:{ 
				type:"string",
				required:true, 
				regex:{
					pattern:/^[A-Za-z]\w*$/,
					message:"Invalid name format. Must start with a letter, and only contain letters, numbers or the _ character"
				},
				custom:function(params){
					var v = new Myna.ValidationResult();
					if (params.obj.isNew && Myna.Admin.ds.exists(params.valuename)){
						v.addError(
							"A DataSource '{0}' already exists. Please choose another name.".format(params.value),
							"driver"
						);
					}
					return v;
				}
			},
			desc:{
				type:"string"
			},
			type:{
				type:"string", 
				required:true,
				list:{
					oneOf:Myna.Database.dbProperties.getKeys()
				}
			},
			driver:{
				type:"string", 
				required:true,
				custom:function(params){
					var v = new Myna.ValidationResult();
					if (typeof $server_gateway != "undefined"){
						
						try {
							java.lang.Class.forName(params.value);
						} catch(e) {
							v.addError("Driver '{0}' is not available in the classpath.".format(params.value),"driver");
						}
						
					}
					return v;
				}
			},
			location:{ 
				type:"string",
				list:{
					oneOf:["file","network"]	
				}
			},
			file:{ 
				type:"string",
				required:{
					when:function(params){
						return params.obj.location == "file";
					},
					message:"File is required when location is 'file'"
				}
			},
			server:{
				type:"string",
				required:{
					when:function(params){
						return params.obj.location == "network";
					},
					message:"Server is required when location is 'network'"
				}
			},
			case_sensitive:{ 
				type:"numeric", 
				value:{
					min:0, 
					max:1
				}
			},
			port:{
				type:"numeric", 
				required:{
					when:function(params){
						return params.obj.location == "network";
					},
					message:"Port is required when location is 'network'"
				},
				value:{
					min:1024, 
					max:65535,
					when:function(params){
						return params.obj.location == "network";
					}
					
				}
			},
			db:{
				type:"string"
			},
			username:{
				type:"string"
			},
			password:{
				type:"string"
			},
			url:{
				type:"string", 
				required:true
			}
			
			
		}),
	/* Function: Myna.Admin.ds.createLocalDatabase
		create a local H2 databsae with the given name
		
		Parameters:
			name	-	name of datasource. Should only contain letters, number and (_)
			
		Returns <Myna.ValidationResult>
		
		See:
		* <save>
		*/
		createLocalDatabase:function(name,desc){
			var result= this.save({
				name:name,
				file:"/WEB-INF/myna/local_databases/" + name,
				desc:desc||"",
				type:"h2",
				location:"file",
				driver:"org.h2.Driver"
			},true);
			if (result.success){
				$server_gateway.loadDataSources();	
			}
			
			return result;
		},
	/* Function: Myna.Admin.ds.exists 
		returns true if a datasource with the supplied name exists.
		
		Parameters:
			name		-	name of a data source
		*/
		exists:function(name){
			return this.getAll().contains(function(ds){
				return ds.name == name;
			});
		},
	/* Function: Myna.Admin.ds.getAll
		returns an array of DS structures currently configured
			
			
		*/
		getAll:function getDataSources(){
			var dataSources =Myna.JavaUtils.mapToObject($server_gateway.dataSources);
			return dataSources.getKeys().map(function(key){
				return Myna.JavaUtils.mapToObject(dataSources[key])
					.map(function(v){
						return parseInt(v,10) == v?parseInt(v,10):v;  
					});
			});
		},
	/* Function: Myna.Admin.ds.getMap
		returns a map of all DS structures currently configured
			
			
		*/
		getMap:function getDataSources(){
			var dataSources =Myna.JavaUtils.mapToObject($server_gateway.dataSources);
			return dataSources.map(function(value,key){
				return Myna.JavaUtils.mapToObject(value)
					.map(function(v){
						return parseInt(v,10) == v?parseInt(v,10):v;  
					});
			});
		},
	/* Function: test
		tests connecting to the named DS and returns a <Myna.ValidationResult>
	
		Parameters:
			name	-	name of DS to test
		*/
		test:function (name) {
			var ret = new Myna.ValidationResult();
			var db;
			var config = Myna.Admin.ds.getMap()[name]
			try {
				$server_gateway.loadDataSource(new Myna.File($server.rootDir + "WEB-INF/myna/ds/" + name + ".ds").javaFile,true);
				db =new Myna.Database(name);

			} catch (e if (e.javaException instanceof java.lang.ClassNotFoundException)){
				ret.addError(
					"Connection failed for datasource '" + name +"' : The database driver '" + config.driver + "' cannot be found in the classpath.",
					"driver"
				)
			} catch (e){
				ret.addError(
					String(e),
					"name"
				)
			}
			if (ret.success){
				ret.merge(db.testConnection(name))
			}
			return ret

		},
		
	/* Function: Myna.Admin.ds.save 
		updates a data source,
		
		Parameters:
			config	-	Config Object, see *Config* below
			isNew		-	set to true for new datasources. This checks for the 
							existence if a same-named data source and prevents 
							overwrites 
			
		Config:
			name			-	Name of data source. Must start with at least one letter
								and consist of only numbers, letters and the underbar(_)
								Must also be unique in regards to all other datasources
			type			-	Vendor Type name as defined in <Myna.Database.dbProperties>  
			driver		-	*Optional, default from dbProperties*
								A valid driver className, e.g. "org.postgresql.Driver".
			desc			-	*Optional, default null*
								A description of this data source
			location		-	*Optional, default "network"*
								either "file" or "network". This switch determines which 
								url template to use
			
			file			-	*Optional, default null*
								File path to the database file. This should be an OS 
								native path or a relative MynaPath such as 
								"/WEB-INF/myna/local_databases/mydb".
								Only makes sense for location="file"
			server		-	*Optional, default null*
								server name of DB.
								Only makes sense for location="network" 
			port			-	*Optional, default from dbProperties*
			db				-	*Optional, default from dbProperties*
			username		-	*Optional, null*
			password		-	*Optional, null*
			url			-	*Optional, default from dbProperties*
			
								
			
		Note:
			Only name, type, driver, url, username, and password are required for successful operation. The 
			other fields are used to populate the DS UI, in MynaAdaminstrator and 
			as a convenience for autogenerating _url_. See the examples below
			
		Examples:
		(code)
			//bare minimum, but requires knowledge of how the url string works
			var result = Myna.Admin.ds.save({
				name:"myna_log",
				type:"postgresql",
				url="jdbc:postgresql://localhost:5432/myna",
				driver="org.postgresql.Driver",
				username:"myna",
				password:"nunyabidness"
			})
			
			//more verbose, but also more readable for GUI
			//URL and driver are comuted from Myna.Database.dbProperties
			var result = Myna.Admin.ds.save({
				name:"myna_log",
				type:"postgresql",
				server:"localhost",
				port:5432,
				username:"myna",
				password:"nunyabidness"
			})
		(end)
			
		Returns:
		<Myna.ValidationResult>
				
		*/
		save:function(config,isNew){
			var dprops = Myna.Database.dbProperties[config.type];
			config.setDefaultProperties({
				driver:(function(){
					if (dprops){
						return dprops.dsInfo.driver;	
					}
				})(),
				location:"network",
				case_sensitive:0
			});
			
			config.isNew = true;
			var v = this.validate(config,isNew);
			
			if (v.success){
				Myna.saveProperties(config, $server.rootDir + "WEB-INF/myna/ds/" + config.name.toLowerCase()+ ".ds");
				$server_gateway.loadDataSource(new Myna.File($server.rootDir + "WEB-INF/myna/ds/" + config.name + ".ds").javaFile,true);
			}
			
			return v;
		},
	
	/* Function: Myna.Admin.ds.validate 
		validates a data source config	
	
		Parameters:
			config		-	JS Object representing the data for a data source, see <save>
			isNew			-	Boolean. If true, Ds name will also be checked for uniqueness
			
		Returns:
		<Myna.ValidationResult>
				
		*/
		validate:function(config,isNew){
			var v= new Myna.ValidationResult();
			if (!config) {
				v.addError("No Datasource configuration provided.");
				return v;
			}
			var dprops = Myna.Database.dbProperties[config.type];
			
			if (!("url" in config) || !config.url){
				config.setDefaultProperties(dprops.dsInfo);
				if (config.location == "file"){
					config.url=dprops.dsInfo.file_url.format(config);	
				} else {
					config.url=dprops.dsInfo.url.format(config);
				}
			}
			config.isNew = isNew;
			v.merge(this.dsValidation.validate(config));
			delete config.isNew;
			return v;
		}
	},
/* Scheduled Tasks */
	task:{
	/* Property: Myna.Admin.task.taskValidation
		a <Myna.Validation> object for validating Scheduled task
		
		*/
		taskValidation:new Myna.Validation().setLabels({
			script:"Script Path or Url"
		}).addValidators({
			name:{ 
				type:"string",
				required:true, 
				/* regex:{
					pattern:/^[A-Za-z]\w*$/,
					message:"Invalid name format. Must start with a letter, and only contain letters, numbers or the _ character",
				}, */
				custom:function(o){
					var v = new Myna.ValidationResult();
					if (o.obj.isNew){
						var tasks = Myna.Admin.task.getAll();
						var exists = (o.obj.name in tasks);
						if (exists) v.addError("A task '" + o.obj.name +"' already exists","name");
					}
					return v;
				}
				
			},
			description:{
				type:"string"
			},
			type:{
				type:"string", 
				required:true,
				list:{
					oneOf:"Simple,Hourly,Daily,Weekly,MonthlyByDate,MonthlyByWeekday,Yearly".split(",")
				}
			}
			
		}),
	/* Function: Myna.Admin.task.getAll
		returns a JS object where the keys are task names and the values are task configs
			
		*/
		getAll:function getTasks(){
			var cronProperties = Myna.loadProperties("/WEB-INF/classes/cron.properties");
			return cronProperties.map(function(v){
				
				var config =v.parseJson();
				var state =Myna.Admin.task.getState(config.name);
				config.nextRun = state.nextRun;
				config.lastRun = state.lastRun;
				//Myna.printDump(config);
				return config;
			});
		},
	/* Function: Myna.Admin.task.save 
		creates/updates a task,
		
		Parameters:
			config	-	Config Object, see *Config* below
			isNew		-	set to true for new tasks. This checks for the 
							existence if a same-named data source and prevents 
							overwrites 
			
		Returns:
		<Myna.ValidationResult>
				
		*/
		save:function(config,isNew){
			
			config.isNew = isNew;
			var v =this.taskValidation.validate(config);
			delete config.isNew;
			
			
			
			if (v.success){
				
				var cronProperties = Myna.loadProperties("/WEB-INF/classes/cron.properties");
				cronProperties[config.name] = config.toJson();
				Myna.saveProperties(cronProperties, "/WEB-INF/classes/cron.properties");
				Myna.Admin.task.scheduleNextRun(config.name);
				//Myna.include("/shared/js/libOO/reload_cron.sjs",{name:config.name});
			}
			
			return v;
		},
	/* Function: Myna.Admin.task.remove 
		removes a task,
		
		Parameters:
			name		-	name of task to remove
			 
		*/
		remove:function(name){
			var cronProperties = Myna.loadProperties("/WEB-INF/classes/cron.properties");
			delete cronProperties[name];
			Myna.saveProperties(cronProperties, "/WEB-INF/classes/cron.properties");
			Myna.Admin.task.scheduleNextRun(name);
			//Myna.include("/shared/js/libOO/reload_cron.sjs",{name:name});
		},
	/* Function: Myna.Admin.task.nameToID
		returns a task name formated as an identifier
	
		Parameters:
			name	-	name of task to convert

		Task ID is "task_" + task name with all non word characters replaced with 
		single underbars, converted to lower case. Id's are used as the appname 
		for Task logs and for the task state file names
		*/
		nameToID:function (name) {	
			return "task_"+name.replace(/\W+/g,"_").toLowerCase();
		},
	/* Function: Myna.Admin.task.getState
		returns the state of the named task
	
		Parameters:
			name	-	name of task load

		The "state" of a task is an object with nextRun and lastRun properties. 
		These are either Dates or null. These properties are also available in the 
		task configs returned from <Myna.Admin.task.getAll()>
		*/
		getState:function (name) {
			var taskID =this.nameToID(name);
			new Myna.File("/WEB-INF/myna/cron/").createDirectory();
			var stateFile =new Myna.File("/WEB-INF/myna/cron/" + taskID);
			var state = null;
			if (stateFile.exists()){
				try{
					state =stateFile.readString().parseJson();
				} catch(e){
					Myna.logSync(
						"error",
						"task: " + name+": bad state file " +stateFile.toString(),Myna.formatError(e),
						taskID
					);
				}
			}
			return state ||{
				lastRun:null,
				nextRun:null
			}

		},
	/* Function: Myna.Admin.task.saveState
		saves the state of the named task
	
		Parameters:
			name	-	name of task load
			state	-	state object

		The "state" of a task is an object with nextRun and lastRun properties. 
		These are either Dates or null. These properties are also available in the 
		task configs returned from <Myna.Admin.task.getAll()>
		*/
		saveState:function (name,state) {
			var taskID =this.nameToID(name);
			new Myna.File("/WEB-INF/myna/cron/").createDirectory();
			var stateFile =new Myna.File("/WEB-INF/myna/cron/" + taskID);
			stateFile.writeString(state.toJson());
			//Myna.printConsole("saved state for " + name,Myna.dumpText(state));
		},
	/*saveNextRun*/
		saveNextRun:function (name,date) {
			//Myna.printConsole("saveNextRun",date);
			Myna.lock("task_state_" + name,10,function () {
				var state = Myna.Admin.task.getState(name);
				state.nextRun = date;
				Myna.Admin.task.saveState(name,state);
			});
		},
	/*saveLastRun*/
		saveLastRun:function (name,date) {
			//Myna.printConsole("saveLastRun",date);
			Myna.lock("task_state_" + name,10,function () {
				var state = Myna.Admin.task.getState(name);
				state.lastRun = date;
				Myna.Admin.task.saveState(name,state);
			});
		},
	/* Function: getNextRunDate
		returns the Date() a task should next be run, based on current state file
	
		Parameters:
			name	-	name of task to check
		*/
		getNextRunDate:function getNextRunDate(name){
			var config =this.getAll()[name];
			var taskID =this.nameToID(name);
			if (!config) throw new Error("cannot load Task config for '{0}'".format(name));
			var now = new Date();
			
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
			if (config.nextRun && config.nextRun <= now) nextRun = config.nextRun;
			var startHour = config.start_date.getHours();

			switch (config.type.toLowerCase()){
				case "simple":
					var interval= config.interval*times[config.scale.toLowerCase()];
					nextRun =new Date(now.getTime() + interval);
					break;
					
				case "hourly":
					if (nextRun.clone().clearTime() != now.clone().clearTime()){
						nextRun = now.add(Date.DAY,-1);
					}
					nextRun.setHours(startHour);
					var minuteRange = String(config.hourly_minutes).split(/,/)
						.map(function (minutes) {return parseInt(minutes,10)})
						.sort();
					var targetMinute =minuteRange.first(0);
					/*if (curMinute > minuteRange.last()){
						targetMinute = minuteRange.first(0);
					} else if(curMinute < minuteRange.first)*/
					now = now.add(Date.MINUTE,1);
					nextRun.setMinutes(targetMinute);
					var test = function (targetMinute) {
						nextRun.setMinutes(targetMinute);	
						return  nextRun.clone().getTime() >= now.getTime()
					}
					while(true) {
						var matched=minuteRange.some(test);
						if (matched){
							break;
						} else {
							nextRun =nextRun.add(
								Date.HOUR,
								parseInt(config.hourly_repeat,10)
							);	
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
					Myna.logSync("error","Schedule type " + config.type +" is undefined",taskID);
				
			}
			
			return nextRun;
			
		},
	/* Function: scheduleNextRun
		clears and re-schedules the next run of a given task (or all), based on the current state file
	
		Parameters:
			name	-	*Optional, default null*
						name of task to run, or null to reschedule all tasks
		*/
		scheduleNextRun:function scheduleNextRun(taskName) {
			var tasks = $server_gateway.waitingCronTasks;
			var taskID =this.nameToID(taskName||"all");
			var gotlock =Myna.lock("MYNA_ADMIN:reload_cron",20,function(){
				var removedTasks={}

				//clear old schedules
				tasks.toArray().forEach(function (cronTask) {
					if (taskName && taskName != cronTask.name){
						return
					} 
					removedTasks[cronTask.name] = true;
					tasks.remove(cronTask);
				})
				//load new schedules
				if (new Myna.File("/WEB-INF/classes/cron.properties").exists()){
					Myna.Admin.task.getAll()
					.filter(function(cron,name){
						if(!cron.is_active) return false;
						if(taskName){
							return name == taskName;
						} else {
							return true;
						}
					})
					.forEach(function(cron,name){
						$profiler.mark("Scheduling Cron: " + name);
						try{
							var nextRunDate;
							
								nextRunDate= Myna.Admin.task.getNextRunDate(name);
							
							//if a task is rescheduled, it wasn't really removed
							delete removedTasks[cron.name];

							Myna.logSync("info","Task: {0} next scheduled for {1}".format(
								cron.name,
								nextRunDate.format("m/d/Y H:i")
							),null,taskID);
							
							Myna.Admin.task.saveNextRun(cron.name,nextRunDate);
							
							$server_gateway.waitingCronTasks.offer(
								new Packages.info.emptybrain.myna.CronTask(
									cron.name,
									nextRunDate.getTime()
								)
							);
							
						} catch(e){
							Myna.logSync(
								"error",
								"Loading Cron: " + name +":" +e,Myna.formatError(e),
								taskID
							);
						}
					});
					
				}

				//log removed schedules
				removedTasks.getKeys().forEach(function (k) {
					Myna.logSync(
						"info",
						"Task: {0} un-scheduled (deleted or inactivated)".format(k),
						taskID
					);
				})
			});
			if (!gotlock) {
				Myna.printConsole("============================= failed lock ===================================");
				throw new Error("Unable to reload cron due to previous reload in progress");
			}
		},
	/* Function: run
		runs a given task, and updates state
	
		Parameters:
			name	-	name of task to run
		*/
		run:function runTask(name){
			var taskID =this.nameToID(name);
			$profiler.mark("Running task '{0}'".format(name));
			var config = this.getAll()[name];
			Myna.Admin.task.saveLastRun(name,new Date());
			

			$req.timeout=0;
			Myna.logSync("info","Task {0} started.".format(name),null,taskID);
			if (/^https?:\//.test(config.script)){
				$profiler.mark("Calling URL '{0}'".format(config.script));
				//var startMem = $server.memUsed;
				try{
					var h = new Myna.HttpConnection({
						url:config.script
					});
					h.connect();
					var detail =[
						Myna.dump(h.responseHeaders,"Response headers"),
						"<h2>Output</h2>",
						h.getResponseText().left(4000)
					].join("<br>\n");

					if (h.getStatusCode() == 200){
						
						Myna.logSync("info","Task {0} completed.".format(name),detail,taskID);
					} else {
						Myna.logSync("error","Task {0} connection Error, Status: {1}".format(name,h.getStatusCode()),detail,taskID);
						
					}
				} catch(e){
					Myna.logSync("error","Task {0} Error {1} ".format(name,e.message||""),Myna.formatError(e),taskID);
				}
				//var endMem = $server.memUsed;
				//$server_gateway.generatedContent=null;
				//java.lang.System.gc();
				
					
				
			} else { //should be a script file
				$profiler.mark("Calling local script '{0}'".format(config.script));
				var script = new Myna.File(config.script);
				if (script.exists()){
					try{
						
						Myna.include(config.script);
						Myna.logSync(
							"info",
							"Task {0} completed.".format(name),
							$res.getContent().left(4000),
							taskID
						);
					} catch(e){
						Myna.logSync(
							"error",
							"Task {0} Error {1} ".format(name,e.message||""),
							Myna.formatError(e)+$res.getContent().left(4000),
							taskID
						);
					}
				} else {
					throw new Error("Task Script '"+config.script+"' does not represent a valid URL or script file");
				}
			}			


			
		}
	
	}	
};

	
