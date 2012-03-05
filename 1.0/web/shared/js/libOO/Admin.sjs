/* 
	Class: Myna.Admin
		API for Administrative functions 
		
		This library contains the functions used by the Myna Administrator for 
		tasks such as DataSource and Scheduled Task management 
		
*/
if (!Myna) var Myna={}
Myna.Admin ={
/* Data Sources */
	
	/* Property: dsValidation
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
					message:"Invalid name format. Must start with a letter, and only contain letters, numbers or the _ character",
				},
				
			},
			desc:{
				type:"string", 
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
							v.addError("Driver '{0}' is not available in the classpath.".format(params.value),"driver")
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
						return params.obj.location == "file"
					},
					message:"File is required when location is 'file'"
				}
			},
			server:{
				type:"string",
				required:{
					when:function(params){
						return params.obj.location == "network"
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
						return params.obj.location == "network"
					},
					message:"Port is required when location is 'network'"
				},
				value:{
					min:1024, 
					max:65535,
					when:function(params){
						return params.obj.location == "network"
					},
					
				},
			},
			db:{
				type:"string", 
			},
			username:{
				type:"string", 
			},
			password:{
				type:"string", 
			},
			url:{
				type:"string", 
				required:true,
			},
			
			
		}),
	/* Function: createLocalDatabase
		create a local H2 databsae with the given name
		
		Parameters:
			name	-	name of datasource. Should only contain letters, number and (_)
			
		Returns <Myna.ValidationResult>
		
		See:
		* <saveDataSource>
		*/
		createLocalDatabase:function(name){
			return this.saveDataSource({
				name:name,
				file:"/WEB-INF/myna/local_databases/" + name,
				type:"h2",
				location:"file",
				driver:"org.h2.Driver"
			},true)
		},
	/* Function: dsExists 
		returns true if a datasource with the supplied name exists.
		
		Parameters:
			name		-	name of a data source
		*/
		dsExists:function(name){
			return this.getDataSources().contains(function(ds){
				return ds.name == name
			})
		},
	/* Function: getDataSources
		returns an array of DS structures currently configured
			
			
		*/
		getDataSources:function getDataSources(){
			var dataSources =Myna.JavaUtils.mapToObject($server_gateway.dataSources);
			return dataSources.getKeys().map(function(key){
				return Myna.JavaUtils.mapToObject(dataSources[key])
					.map(function(v,k,o){
						return parseInt(v) == v?parseInt(v):v  
					});
			})
		},
		
	/* Function: saveDataSource 
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
			var result = Myna.Admin.saveDataSource({
				name:"myna_log",
				type:"postgresql",
				url="jdbc:postgresql://localhost:5432/myna",
				driver="org.postgresql.Driver",
				username:"myna",
				password:"nunyabidness"
			})
			
			//more verbose, but also more readable for GUI
			//URL and driver are comuted from Myna.Database.dbProperties
			var result = Myna.Admin.saveDataSource({
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
		saveDataSource:function(config,isNew){
			var dprops = Myna.Database.dbProperties[config.type]
			config.setDefaultProperties({
				driver:(function(){
					if (dprops){
						return dprops.dsInfo.driver	
					}
				})(),
				location:"network",
				case_sensitive:0,
			})
			
			config.isNew = true;
			var v = this.validateDataSource(config,isNew);
			
			if (v.success){
				Myna.saveProperties(config, $server.rootDir + "WEB-INF/myna/ds/" + config.name.toLowerCase()+ ".ds");
				$server_gateway.loadDataSource(new Myna.File($server.rootDir + "WEB-INF/myna/ds/" + config.name + ".ds").javaFile,true);
			}
			
			return v
		},
	/* Function: validateDataSource 
		validates a data source config 	
	
		Parameters:
			config		-	JS Object representing the data for a data source, see <saveDataSource>
			isNew			-	Boolean. If true, Ds name will also be checked for uniqueness
			
		Returns:
		<Myna.ValidationResult>
				
		*/
		validateDataSource:function(config,isNew){
			var v= new Myna.ValidationResult()
			if (!config) {
				v.addError("No Datasource configuration provided.")
				return v
			}
			var dprops = Myna.Database.dbProperties[config.type]
			
			if (!("url" in config) || !config.url){
				config.setDefaultProperties(dprops.dsInfo)
				if (config.location == "file"){
					config.url=dprops.dsInfo.file_url.format(config)	
				} else {
					config.url=dprops.dsInfo.url.format(config)
				}
			}
			config.isNew = isNew
			v.merge(this.dsValidation.validate(config))
			delete config.isNew
			return v
		},
/* Scheduled Tasks */
	/* Property: taskValidation
		a <Myna.Validation> object for validating Scheduled task
		
		*/
		taskValidation:new Myna.Validation().setLabels({
			script:"Script Path or Url",
		}).addValidators({
			name:{ 
				type:"string",
				required:true, 
				/* regex:{
					pattern:/^[A-Za-z]\w*$/,
					message:"Invalid name format. Must start with a letter, and only contain letters, numbers or the _ character",
				}, */
				custom:function(o){
					var v = new Myna.ValiationResult();
					var tasks = Myna.Admin.getTasks();
					var exists = (o.obj.name in tasks);
					if (exists) v.addError("A task '" + o.obj.name +"' already exists","name");
					return v;
				}
				
			},
			description:{
				type:"string", 
			},
			type:{
				type:"string", 
				required:true,
				list:{
					oneOf:"Simple,Hourly,Daily,Weekly,MonthlyByDate,MonthlyByWeekday,Yearly".split(",")
				}
			},
			
		})/* .setDefaults({
			type:"Simple",
			start_date:function(){ return new Date()}
		}) */,
	/* Function: getTasks
		returns a JS object where the keys are task names and the values are task configs
			
		*/
		getTasks:function getTasks(){
			var cronProperties = Myna.loadProperties("/WEB-INF/classes/cron.properties");
			
			return cronProperties.map(function(v,k){
					return v.parseJson()
			})
			/* return new Myna.DataSet({
				columns:[
					"name",
					"description",
					"type",
					"interval",
					"scale",
					"hourly_repeat",
					"hourly_minutes",
					"daily_repeat",
					"daily_time",
					"weekly_repeat",
					"weekly_days",
					"weekly_time",
					"monthly_by_date_repeat",
					"monthly_by_date_time",
					"monthly_by_weekday_repeat",
					"monthly_by_weekday_daycount",
					"monthly_by_weekday_day",
					"monthly_by_weekday_time",
					"yearly_repeat",
					"yearly_date",
					"yearly_time",
				],
				data:rows
			}) */
			
		},
	/* Function: saveTask 
		creates/updates a task,
		
		Parameters:
			config	-	Config Object, see *Config* below
			isNew		-	set to true for new tasks. This checks for the 
							existence if a same-named data source and prevents 
							overwrites 
			
		Returns:
		<Myna.ValidationResult>
				
		*/
		saveTask:function(config,isNew){
			
			
			config.isNew = isNew;
			var v = this.validateDataSource(config,isNew);
			
			if (v.success){
				var cronProperties = Myna.loadProperties("/WEB-INF/classes/cron.properties");
				cronProperties[config.name] = config.toJson();
				Myna.saveProperties(config, "/WEB-INF/classes/cron.properties");
				include("/shared/js/libOO/reload_cron.sjs",{name:config.name})
			}
			
			return v
		},
	/* Function: removeTask 
		removes a task,
		
		Parameters:
			name		-	name of task to remove
			 
		*/
		saveTask:function(name){
			if (v.success){
				var cronProperties = Myna.loadProperties("/WEB-INF/classes/cron.properties");
				delete cronProperties[name];
				Myna.saveProperties(config, "/WEB-INF/classes/cron.properties");
				include("/shared/js/libOO/reload_cron.sjs",{name:name})
			}
			
			return v
		},
	
}

	
