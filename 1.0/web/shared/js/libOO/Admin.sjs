/* 
	Class: Myna.Admin
		API for Administrative functions 
		
		This library contains the functions used by the Myna Administrator for 
		tasks such as DataSource and Scheduled Task management 
		
*/
if (!Myna) var Myna={}
Myna.Admin ={
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
		config.setDefaultProperties({
			driver:(function(){
				if (dprops){
					return dprops.dsInfo.driver	
				}
			})(),
			location:"network",
			case_sensitive:0,
		})
		
		var v = this.validateDataSource(config,isNew);
		
		if (v.success){
			Myna.saveProperties(config.name.toLowerCase(), $server.rootDir + "WEB-INF/myna/ds/" + config.name + ".ds");
			$server_gateway.loadDataSource(new Myna.File($server.rootDir + "WEB-INF/myna/ds/" + config.name + ".ds").javaFile,true);
		}
		
		return v
	},
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
		
		v.validate(config,{
			name:{ label:"Name", type:"string", notEmpty:true, 
				regex:/^[A-Za-z]\w*$/,
				regexMessage:"Invalid name format. Must start with a letter, and only contain letters, numbers or the _ character",
				custom:function(value,name,obj,v,prefix){
					if (isNew){
						var existing = getDataSources().map(function(ds){
							return ds.name
						}).join()
						if (existing.listContainsNoCase(config.name)){
							v.addError("Datasource '{}' already exists",format(config.name))	
						}
					}
					return true
				}
			},
			desc:{ label:"Description", type:"string", },
			type:{ label:"type", type:"string", notEmpty:true,
				custom:function(value,name,obj,v,prefix){
					if (!Myna.Database.dbProperties.getKeys().join().listContains(value)){
						v.addError("Invalid vendor type.","type")	
					}
					return true;
				}
			},
			driver:{ label:"driver", type:"string", notEmpty:true,
				custom:function(value,name,obj,v,prefix){
					try {
						java.lang.Class.forName(value);
					} catch(e) {
						v.addError("Driver '{0}' is not available in the classpath.","driver")
					}
					return true;
				}
			},
			location:{ label:"location", type:"string",
				regex:/^(file|network)$/i,
				regexMessage:"Location must be either 'network' or 'file'",
			},
			file:{ label:"file", type:"string", },
			server:{ label:"server", type:"string", },
			case_sensitive:{ label:"case_sensitive", type:"numeric", minValue:0, maxValue:1 },
			port:{ label:"port", type:"numeric", minValue:1, maxValue:65535},
			db:{ label:"db", type:"string", },
			username:{ label:"username", type:"string", },
			password:{ label:"password", type:"string", },
			url:{ label:"url", type:"string", notEmpty:true,},
			
			
		})
		
		return v
	}
}


