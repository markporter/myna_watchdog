var fusebox={
/* ========== login/auth/main =============================================== */
	auth:function(data,rawData){
		$req.returningJson = true;
		data.checkRequired(["username","password"]);
		var success,reason;
		//bypass perms for admin user in case perms DB isn't available
		if (rawData.username.toLowerCase() == "admin"){
			var props=getGeneralProperties();
			if (rawData.password.hashEquals(props.admin_password)){
				$cookie.setAuthUserId("myna_admin");
				success = true; 
			} else {
				success=false;
				reason="Admin Login invalid. Please try again.";
			}
		} else {
			var user = Myna.Permissions.getUserByAuth(rawData.username,rawData.password)
			if (user){
				$cookie.setAuthUserId(user.get_user_id());
					if (user.hasRight("myna_admin","full_admin_access")){
						 success = true;
					} else {
						success=false;
						reason="You do not have access to this application.";
					}
			} else {
				$session.clear();
				$cookie.clearAuthUserId();
				success=false;
				reason="Login invalid. Please try again.";
			}
		}
		
		if (success){
			print({success:true,url:"?fuseaction="+$application.mainFuseAction}.toJson());
		} else {
			print({success:false,errorMsg:reason}.toJson());
		}
	},
	login:function(data){
		var props=getGeneralProperties();
		if (!props.admin_password || !props.admin_password.length){
			// should only get here if a password is not set
			$cookie.setAuthUserId("myna_admin");
			this.new_password_form({});
		} else {
			$res.redirectLogin({
				callbackUrl:$server.requestScriptName +"?fuseaction=" +$application.mainFuseAction,
				title:"Myna Administrator Login",
				message:data.message||""
			})
			
		}
	},
	logout:function(data){
			$session.clear();
			$cookie.clearAuthUserId();
			this.login({error_message:"You have been logged out of Myna Administrator"});
	},
	main:function(data){
		var props=Myna.getGeneralProperties();
		
		includeTemplate("views/dsp_main.html",{
			version:$server.version,
			extUrl:$application.extUrl,
			title:props.instance_id + "/" + props.instance_purpose + " on " + $server.hostName,
			rootUrl:$server.rootUrl,
			rootDir:$server.rootDir,
			dbProperties:$application.get("db_properties").toJson()
		});
	},
/* ========== Data Sources ================================================== */
	get_data_sources:function(data){
		var dataSources =mapToObject($server_gateway.dataSources);
		dataSources.getKeys().forEach(function(x){
			dataSources[x] = mapToObject(dataSources[x]); 	
		});
		return {
			rows:dataSources.getKeys().map(function(key){
				return dataSources[key];
			})
		}
	},
	get_ds:function(data){
		data.checkRequired(["name"]);
		var ds =MynaAdmin.getDataSource(data.name);
		ds.setDefaultProperties({
			case_sensitive:0
		}) 
		if (!ds.file || !ds.file.length){
			//ds.file=new Myna.File("/WEB-INF/myna/local_databases").toString().listAfter(":");
			ds.file="/WEB-INF/myna/local_databases/"
		}
		return {
			success:true,
			data:ds
		};
	},
	is_unique_ds_name:function(data){
		data.checkRequired(["name"]);
	},
	ds_create:function(data){
		$req.returningJson=true;
		data.checkRequired(["name"]);
		data.setDefaultProperties({type:"other"});
		MynaAdmin.createDs(data.name,data.type);
		return {success:true}
	},
	ds_delete:function(data){
		$req.returningJson = true;
		data.checkRequired(["name"]);
		MynaAdmin.deleteDs(data.name);
	
		return {success:true,message:data.name +" deleted.",url:"?fuseaction=ds_main"};
	},
	ds_save:function(data){
		$req.returningJson = true;
		data.checkRequired(["name"]);
		
		var ds = MynaAdmin.getDataSource(data.name);
		/* check for name change */
			if (data.new_name && data.new_name.length && data.new_name != data.name){
				if (MynaAdmin.isUniqueDsName(data.new_name)){
					MynaAdmin.createDs(data.new_name,ds.type);
					ds = MynaAdmin.getDataSource(data.new_name);
					MynaAdmin.deleteDs(data.name);
					data.name = data.new_name;
				} else {
					return {success:false,errors:{new_name:"This name is already in use. Please choose another."}}	
				}
			}
		/* check for copy */
			if (data.copy_name && data.copy_name.length){
				if (MynaAdmin.isUniqueDsName(data.copy_name)){
					MynaAdmin.createDs(data.copy_name,ds.type);
					var copyDs = MynaAdmin.getDataSource(data.name);
					copyDs.name = data.copy_name;
					MynaAdmin.saveDataSource(copyDs);
					return {success:true,copied:true,message:"Datasource copied to "+ data.copy_name,name:data.name}
				} else {
					return {success:false,errors:{copy_name:"This name is already in use. Please choose another."}}	
				}
			}
		var keys = [
			"desc",
			"type",
			"driver",
			"location",
			"file",
			"server",
			"case_sensitive",
			"port",
			"db",
			"username",
			"password",
			"url"
		];
		var message="<span style='color:green'>Datasource '" + data.name +"' connected successfully</span>";
		keys.forEach(function(key){
			if (data.hasOwnProperty(key)){
				ds[key] = data[key].unEscapeHtml();	
			}
		})
	
		MynaAdmin.saveDataSource(ds);
		try {
			MynaAdmin.loadDataSource(data.name);
			new Myna.Database(data.name);
			return {success:true,message:message,name:data.name}
			
		} catch (e if (e.javaException instanceof java.lang.ClassNotFoundException)){
			message="<span style='color:red'>connection failed for datasource '" + data.name +"' : The database driver '" + ds.driver + "' cannot be found in the classpath.</span>";
			/* throw {message:message} */
		} catch (e){
			if (e.javaException){
				message="<span style='color:red'>" + e.javaException.getMessage() + "</span>";
			} else if (e.message){
				message="<span style='color:red'>" + e.message + "</span>";
			} else {
				message=e;
			}
		}
		
		return {success:false,errorMsg:message,name:data.name}
	},
/* ========== Threads ======================================================= */
	exec_in_thread:function(data){
		data.checkRequired(["code","thread_id"]);
		var t = $server_gateway.runningThreads.toArray()
		.filter(function(thread){
			return thread.hashCode() == data.thread_id
		})[0];
		
		if (!t){
			return {success:false,errorMsg:"Thread id " + data.thread_id + " no longer exists"}	
		}
		$server_gateway.executeJsString(t.threadScope,data.code.unEscapeHtml(),"Myna Adminstrator");
		return {success:true,output:$res.clear()}
	},
	get_running_requests:function(data){
		var runningThreads = $server_gateway.runningThreads.toArray()
		.map(function(thread){
			var scope = thread.threadScope
			var current_task="";
			var url;
			var req = thread.environment.get("request");
			var runtime=new Date().getTime() - thread.started.getTime();
			var current_runtime=runtime;
			if (req){
				url=req.getRequestURI();
			} else {
				url=thread.getNormalizedPath(thread.requestDir);
			} 
			
			if (thread.isWaiting){
				current_task="Queued";
			} else if (scope.$profiler){
				var times = scope.$profiler.times;
				var time = times[times.length-1];
				current_task=time.label;
				current_runtime=new Date().getTime() - time.begin;
			} 
			return {
				thread_id:thread.hashCode(),
				url:url,
				started:thread.started.toString(),
				current_task:current_task, 
				is_white_listed:thread.isWhiteListedThread,
				current_runtime:current_runtime,
				runtime:runtime
			}
		})
		/* var recentThreads = $server_gateway.recentThreads.toArray()
		.map(function(thread){
			var scope = thread.threadScope
			var current_task="";
			var url;
			var req = thread.environment.get("request");
			var runtime=new Date().getTime() - thread.started.getTime();
			var current_runtime=runtime;
			if (req){
				url=req.getRequestURI();
			} else {
				url=thread.getNormalizedPath(thread.requestDir);
			} 
			
			if (thread.isWaiting){
				current_task="Queued";
			} else if (scope.$profiler){
				var times = scope.$profiler.times;
				var time = times[times.length-1];
				current_task=time.label;
				current_runtime=new Date().getTime() - time.begin;
			} 
			return {
				thread_id:thread.hashCode(),
				url:url,
				started:thread.started.toString(),
				current_task:"Completed", 
				is_white_listed:thread.isWhiteListedThread,
				current_runtime:"",
				runtime:runtime
			}
		}).reverse();
		return runningThreads.concat(recentThreads); */
		return runningThreads
	},
	kill_thread:function(data){
		data.checkRequired(["thread_id","type"])
		var threadArray = $server_gateway.runningThreads.toArray();
		threadArray.forEach(function(thread){
			if (thread.hashCode() == data.thread_id){
				if (data.type=="kill"){
					thread.javaThread.interrupt();
					// lets give interrupt some time to work
					Myna.sleep(2000);
					if (thread.javaThread.isAlive()) thread.javaThread.stop();
				} else {
					thread.shouldDie=true;
				}
			}
		})
	},
/* ========== Tasks (cron) ================================================== */
	get_all_cron_jobs:function(data){
		$req.returningJson=true;
		var cronProperties = Myna.loadProperties("/WEB-INF/classes/cron.properties");
		var array = cronProperties.getKeys().map(function(key){
			return fusebox.get_cron_job({name:key});
		})
		return array;
	},
	get_cron_job:function(data){
		$req.returningJson=true;
		data.checkRequired(["name"])
		data.name = data.name.unEscapeHtml();
		var cronProperties = Myna.loadProperties("/WEB-INF/classes/cron.properties");
		if (!cronProperties[data.name]) return null;
		var cron ={
			name:data.name
		}
		cron = cronProperties[data.name].parseJson()
		
		return cron;
	},
	save_cron_job:function(data,rawData){
		$req.returningJson=true;
		data.checkRequired([
			"name",
			"interval",
			"script"
		])
		data.name = data.name.unEscapeHtml();
		
		var cronProperties = Myna.loadProperties("/WEB-INF/classes/cron.properties");
		var cron = 	fusebox.get_cron_job(data) || {};
		try{
			cron.start_date = Date.parseDate(data.start_date_date + " " + data.start_date_time,"m/d/Y H:i")
		} catch(e){
			cron.start_date =new Date()
		}
		
		try{
			cron.end_date = Date.parseDate(data.end_date_date,"m/d/Y");
		} catch(e){
			cron.end_date =""
		}
		
		/* [
			'name',
			'description',
			'is_active',
			'start_date',
			'interval',
			'scale',
			'script'
		] */
		data.getKeys()
		.filter(function(key){
			if (
				key == "fuseaction"
				|| /\$/.test(key)
			) return false
			else return true
			
		})
		.forEach(function(key){
			if (data[key]){
				if (data[key+"$array"] &&data[key+"$array"].length >1){
					cron[key] = rawData[key+"$array"].map(function(val){
						if (!isNaN(parseInt(val)) && isFinite(val)){
							return parseInt(val);
						} else {
							return val
						}
					});
				} else {
					if (!isNaN(parseInt(rawData[key])) && isFinite(rawData[key])){
						cron[key] = parseInt(rawData[key]);
					} else {
						cron[key] = rawData[key];
					}
				}
			}
		})
		
		/* cronProperties[data.name] = cron.getKeys().map(function(key){
			return key + "=" + cron[key] 
		}).join(); */
		cronProperties[data.name] = cron.toJson()
		/* Myna.log("debug","cronProperties",Myna.dump(cronProperties));
		Myna.log("debug","cron",Myna.dump(cron)); */
		Myna.saveProperties(cronProperties,"/WEB-INF/classes/cron.properties");
		new Packages.info.emptybrain.myna.CronThread();
		//include("/shared/js/libOO/reload_cron.sjs")
		return {success:true}
	},
	delete_cron_job:function(data){
		$req.returningJson=true;
		data.checkRequired([
			"name",
		])
		data.name = data.name.unEscapeHtml();
		
		var cronProperties = Myna.loadProperties("/WEB-INF/classes/cron.properties");
		delete cronProperties[data.name];
		Myna.saveProperties(cronProperties,"/WEB-INF/classes/cron.properties");
		new Packages.info.emptybrain.myna.CronThread();
		return {success:true}
	},
	
	
/* ========== Change Password =============================================== */
	new_password_form:function(data){
		data.extUrl=$application.extUrl;
		data.rootUrl=$server.rootUrl;
		
		Myna.include('views/dsp_new_password_form.ejs',data);		
	},
	new_password_save:function(data){
		$req.returningJson = true;
		if (!data.password$array 
			|| data.password$array.length != 2
			|| data.password$array[0] != data.password$array[1]
			)
		{
			return {success:false,msg:"Passwords do not match, please try again."};
		} else if (data.password$array[0].length < 6){
			//this.new_password_form({message:"Passwords must be at least 6 characters long. Please try again."})
			return {success:false,msg:"Passwords must be at least 6 characters long. Please try again."};
		}
		var props = getGeneralProperties();
		$server_gateway.generalProperties.setProperty("admin_password",data.password$array[0].toHash());
		$server_gateway.saveGeneralProperties();
		
		return{success:true,msg:"Password saved.",url:"?fuseaction=main"};
		//this.main({});
	},
/* ========== search_general_log ============================================ */
	search_general_log:function(data,rawData){
		data.setDefaultProperties({
			start:0,
			limit:25,
			sort:'event_ts',
			dir:'desc',
			event_ts_start:'',
			event_ts_end:'',
			type:'',
			log_id:'',
			request_id:'',
			instance_id:'',
			hostname:'',
			app_name:'',
			purpose:'',
			label_contains:'',
			label_not_contains:''
		})
		data.type = data.type.toUpperCase();
		data.purpose = data.purpose.toUpperCase();
		data.app_name = data.app_name.toLowerCase();
		data.label_contains = "%" + data.label_contains.toLowerCase().unEscapeHtml() + "%";
		if (data.label_not_contains.length){
			data.not_contains_array = data.label_not_contains.split(/,/).map(function(string){
				return "%" + string.unEscapeHtml().toLowerCase() + "%";
			}) 	
		}
		var p = new Myna.QueryParams();
		var qry= new Myna.Query({
			dataSource:"myna_log",
			sql:<ejs>
				select 
					log_id,
					request_id,
					instance_id,
					hostname,
					app_name,
					purpose,
					type,
					label,
					event_ts,
					request_elapsed,
					log_elapsed
				from myna_log_general
				where 1=1
				<@if data.event_ts_start.length  >
					and event_ts >= <%=p.addValue(data.event_ts_start,"date")%>
				</@if>
				<@if data.event_ts_end.length>
					and event_ts <= <%=p.addValue(data.event_ts_end,"date")%>
				</@if>
				<@if data.type.length>
					and upper(type) = <%=p.addValue(data.type)%>
				</@if>
				<@if data.log_id.length>
					<% 
					var ts = new Myna.Query({
						ds:"myna_log",
						sql:"select event_ts from myna_log_general where log_id={log_id}",
						values:rawData
					}).data
					%>
					<@if ts.length>
						and event_ts > <%=p.addValue(ts[0].event_ts,"timestamp")%>
					</@if>
				</@if>
				<@if data.request_id.length>
					and request_id = <%=p.addValue(rawData.request_id)%>
				</@if>
				<@if data.instance_id.length>
					and lower(instance_id) = <%=p.addValue(rawData.instance_id.toLowerCase())%>
				</@if>
				<@if data.hostname.length>
					and lower(hostname) like <%=p.addValue(rawData.hostname.toLowerCase())%>
				</@if>
				<@if data.app_name.length>
					and lower(app_name) = <%=p.addValue(data.app_name.toLowerCase())%>
				</@if>
				<@if data.purpose.length>
					and upper(purpose) = <%=p.addValue(data.purpose.toUpperCase())%>
				</@if>
				<@if data.label_contains.length gt 2 >
					and lower(label) like <%=p.addValue(data.label_contains.toLowerCase())%>
				</@if>
				<@if data.label_not_contains.length>
					<@loop array="data.label_not_contains.split(/,/)" element="string" index="index">
						and lower(label) not like <%=p.addValue(data.not_contains_array[index])%>
					</@loop>
				</@if>
				order by <%=data.sort%> <%=data.dir%> 
			</ejs>,
			parameters:p,
			startRow:parseInt(data.start)+1,
			maxRows:data.limit,
			rowHandler:function(row){
				var obj = row.getRow();
				obj.getKeys().forEach(function(key){
					if (obj[key] instanceof Date){
						obj[key] = obj[key].format("m/d/Y H:i:s");
					}
				})
				return obj;
			}
		})
		//Myna.log("debug","sql",dump(qry))
		return qry
	},
/* ========== General Log =================================================== */
	get_general_log_detail:function(data){
		data.checkRequired(["log_id"]);
		
		var row = new Myna.Query({
			dataSource:"myna_log",
			sql:<ejs>
				select *
				from myna_log_general
				where log_id={log_id} 
			</ejs>,
			values:{
				log_id:data.log_id.unEscapeHtml()
			}
		}).data[0]
		//print(dump(row))
		includeTemplate("views/dsp_log_detail.html",row);
	},
	get_general_log_types:function(data){
		return  new Myna.Query({
			dataSource:"myna_log",
			sql:<ejs>
				select distinct upper(type) as type
				from myna_log_general
			</ejs>
		}).data
		
	},
/* ========== General Settings ============================================== */
	get_settings:function(data){
		var result ={}
		getGeneralProperties().forEach(function(element,key){
			result[key.replace(/\./,"_dot_")] = element;
		})
		delete result.admin_password;
		return [result];
	},
	settings_save:function(data){
		$req.returningJson = true;
		var props = getGeneralProperties();
		data.forEach(function(value,key){
			var cleanedKey = key.replace(/_dot_/,".");
			if (cleanedKey in props ){
				$server_gateway.generalProperties.setProperty(cleanedKey,value.unEscapeHtml());
			}
		});
		$server_gateway.saveGeneralProperties();
		return {success:true}
	},
/* ========== Applications ================================================== */
	get_installed_apps:function(){
		return new Myna.Query({
			ds:"myna_instance",
			sql:<ejs>
				select 
					*
				from installed_applications
				where 1=1
				order by appname
			</ejs>,
			values:{}
		}).result
	},
	import_app:function(data,rawData){
		var path = new Myna.File(
				"/" +
				rawData.folder.replace(/^\[\/]?(\.\.\/)*[\/]?/,"") +
				"/application.sjs"
			);
		if (!path.exists()){
			return {
				success:false,
				errorMsg:"Unable to find application in " + path
			}	
		}
		
		try{
			var app = Myna.loadAppProperties(path)
			
			var man = new Myna.DataManager("myna_instance").getManager("installed_applications");
			var props ={
				appname:app.appname,
				displayname:app.displayName,
				description:app.description,
				author:app.author,
				authoremail:app.authorEmail,
				website:app.website,
				version:app.version,
				minmynaversion:app.minMynaVersion,
				postinstallurl:app.postInstallUrl,
				installdate:new Date(),
				installpath:path.toString()
			}
			man.create(props);
			return {
				success:true
			}
		} catch(e){
			return {
				success:false,
				errorMsg:"Unable to find valid application.sjs at " + path
			}	
		}
	},
	
	install_egg:function(data,rawData){
		var progress={}
		var filePath = data.eggfile.stats.diskLocation;
		
		if (rawData.checksum){
			var checksum = Myna.JavaUtils.base64ToByteArray(rawData.checksum);
			if (!new File(filePath).isValidChecksum(checksum,"SHA-512")){
				Myna.log("debug","hash",Myna.dump($req.rawData));
				progress.percentComplete=0
				progress.message = "Egg does not match checksum, installation aborted";
				progress.hasError = true;
				$session.set("install_egg_progress",progress);
				return;
			}
		}
		
		var fileName = data.eggfile.stats.fileName.match(/[\\\/]*(.*)$/)[1];
		var upgradeDir = new Myna.File("/WEB-INF/install_temp/" + fileName);
		if (upgradeDir.exists()) upgradeDir.forceDelete();
		upgradeDir.createDirectory();
		//create directory for backups. Try to avoid a collision with previous backups
			var backupBase = "/WEB-INF/upgrade_backups/"+fileName+"/backup_" + (new Date().format("m-d-Y_H.i.s")) ;
			var backupDir = new File(backupBase);
			var dupeCounter=0;
			while (backupDir.exists()) {
				backupDir = new File(backupBase +"_" + (++dupeCounter));
			}
			backupDir.createDirectory();
		
		var FileUtils = Packages.org.apache.commons.io.FileUtils;
		var IOUtils = Packages.org.apache.commons.io.IOUtils;
		var zipFile = new java.util.zip.ZipFile(new File(filePath).javaFile);
		var entries =Myna.enumToArray(zipFile.entries());
		
		
		//find and export application.sjs
			try{
				entries.forEach(function(entry,index,array){
					//Myna.printConsole(entry.getName());
					if (entry.getName() == "application.sjs"){
						var is = zipFile.getInputStream(entry);
						var upgradeFile = new Myna.File (upgradeDir.toString()+"/"+entry.getName());
						var os = FileUtils.openOutputStream(upgradeFile.javaFile);
						IOUtils.copyLarge(is,os);
						is.close();
						os.close();
						throw "done";
					}
				})
			} catch (e if e =="done"){}
		var appProps = Myna.loadAppProperties(upgradeDir +"application.sjs");
		var destDir = new Myna.File("/" + appProps.appname);			
		entries.forEach(function(entry,index,array){
			var outputFile = new Myna.File (destDir.toString()+entry.getName());
			var backupFile = new Myna.File (backupDir.toString()+"/"+entry.getName());
			var upgradeFile = new Myna.File (upgradeDir.toString()+"/"+entry.getName());
			
			progress.percentComplete=index/array.length;
			progress.message = "Examining file " +index +" of " + array.length;
			$session.set("install_egg_progress",progress);
			
			
			if(entry.isDirectory()) {
				outputFile.createDirectory();
				backupFile.createDirectory();
				upgradeFile.createDirectory();
			} else{
				var isSame=false;
				
				if (outputFile.exists()){
					//make a backup is the zip file does not match the contents of the target file
					var targetIS = FileUtils.openInputStream(outputFile.javaFile);
					var sourceIS = zipFile.getInputStream(entry);
					if (IOUtils.contentEquals(sourceIS,targetIS)){
						isSame=true;
					} else { 
						outputFile.copyTo(backupFile);
						fusebox.upgradeLog("Backup: " + backupFile);
					}
					targetIS.close();
					sourceIS.close();
				}
				//skip same files and others we don't want to change
				if (isSame) return;
				//copy to upgrade directory
				var is = zipFile.getInputStream(entry);
				var os = FileUtils.openOutputStream(upgradeFile.javaFile);
				IOUtils.copyLarge(is,os);
				is.close();
				os.close();
				
			}
			return;
		});
		zipFile.close();
		progress.percentComplete=.9;
		progress.message = "Copying files...";
		$session.set("install_egg_progress",progress);
		upgradeDir.copyTo(destDir);
		this.import_app(null,{
			folder:destDir.toString()
		})
		progress.percentComplete=1;
		progress.isComplete=1;
		progress.message = "Installation complete.";
		$session.set("install_egg_progress",progress);
		return {
			url:appProps.postInstallUrl || false
		}
		
	},
	install_egg_progress:function(data){
		var uploadProgress=$session.get("$uploadProgress");
		var installProgress=$session.get("install_egg_progress");
		if (installProgress){
			return installProgress;
		} else {
			return uploadProgress;
		}
	},
	export_app:function(data,rawData){
		var path = new Myna.File(rawData.folder);
		path.createDirectory()
		if (!path.exists()){
			return {
				success:false,
				errorMsg:"Unable to create output folder " + path
			}	
		}
		
		
		var app = new Myna.DataManager("myna_instance")
			.getManager("installed_applications").getById(rawData.appname)
		
		var appDir = new Myna.File(app.installpath).getDirectory();
		if (!appDir.exists()){
			return {
				success:false,
				errorMsg:"Unable to find application at " + appDir
			}
		}
		var FileUtils = org.apache.commons.io.FileUtils;
		var IOUtils = org.apache.commons.io.IOUtils;
		var zipName = app.appname +"_" + app.version.replace(/\W+/g,"_") + ".egg"; 
		var zipFileStream = new java.util.zip.ZipOutputStream(
			new java.io.BufferedOutputStream(
				FileUtils.openOutputStream(
					new java.io.File(
						new java.net.URI(path.toString()).resolve(zipName)
					)
				)
			)
		);
		var parentDir = appDir.getDirectoryPath().length
		appDir.listFiles(function(f){return f.type=="file"},true)
		.filter(function(file){
			return /^[\w\.\-]+$/.test(file.fileName);
		})
		.forEach(function(file){
			var relativePath = new java.io.File(file.toString().after(appDir.toString().length));
			zipFileStream.putNextEntry(new java.util.zip.ZipEntry(relativePath));
			var is =FileUtils.openInputStream(file.javaFile);
			IOUtils.copy(is,zipFileStream);
			is.close();
		})
		zipFileStream.close();
		var zipFile = new Myna.File(path.toString() + zipName);
		new Myna.File(path.toString()+zipName+".checksum").writeString(
			Myna.JavaUtils.byteArrayToBase64(
				zipFile.getChecksum("SHA-512"),
				true
			)
		);
		return {
			success:true	,
			message:"Created Myna Egg and checksum in <br>("+path+")"
		}
			
	},
/* ========== Upgrade ======================================================= */
	upgradeLog:function(message){
		var log =$session.get("upgrade_log");
		if (!log) log=[];
		log.push(message);
		$session.set("upgrade_log",log);
	},
	upgrade_start:function(data){
		var numSteps=4
		$req.returningJson = true;
		
		
		
		this.upgradeLog("uploaded file " + data.warfile.stats.fileName);
		var progress ={
			total_message:"Total Upgrade Process: Examining Files (Step 2 of " + numSteps +")",
			total_percentage:2/(numSteps+1),
			current_message:"",
			current_percentage:0,
			isComplete:false
		}
		//create directory for backups. Try to avoid a collision with previous backups
			var backupBase = "/WEB-INF/upgrade_backups/backup_" + (new Date().format("m-d-Y_H.i.s")) ;
			var backupDir = new File(backupBase);
			var dupeCounter=0;
			while (backupDir.exists()) {
				backupDir = new File(backupBase +"_" + (++dupeCounter));
			}
			backupDir.createDirectory();
			this.upgradeLog("Backups will be stored in  " + backupDir);
		var destDir = new Myna.File("/");
		var upgradeDir = new Myna.File("/WEB-INF/upgrade_files");
		if (upgradeDir.exists()) upgradeDir.forceDelete();
		upgradeDir.createDirectory();
		
		var FileUtils = Packages.org.apache.commons.io.FileUtils;
		var IOUtils = Packages.org.apache.commons.io.IOUtils;
		try{
			//var filePath ="file:/mnt/shared/temp/myna-1.0_alpha_6-1.war";
			var filePath = data.warfile.stats.diskLocation;
			var zipFile = new java.util.zip.ZipFile(new File(filePath).javaFile);
		} catch(e){
			return {
				success:false,
				errors:{
					warfile:e.message +": " + filePath
				}
			}
		}
		var entries =Myna.enumToArray(zipFile.entries());
		
		var result= entries.forEach(function(entry,index,array){
			var outputFile = new Myna.File (destDir.toString()+entry.getName());
			var backupFile = new Myna.File (backupDir.toString()+"/"+entry.getName());
			var upgradeFile = new Myna.File (upgradeDir.toString()+"/"+entry.getName());
			
			progress.current_percentage=index/array.length;
			progress.current_message = "Examining file " +index +" of " + array.length;
			$session.set("upgrade_progress",progress);
			
			if(entry.isDirectory()) {
				outputFile.createDirectory();
				backupFile.createDirectory();
				upgradeFile.createDirectory();
			} else{
				var isSame=false;
				
				if (outputFile.exists()){
					//make a backup is the zip file does not match the contents of the target file
					var targetIS = FileUtils.openInputStream(outputFile.javaFile);
					var sourceIS = zipFile.getInputStream(entry);
					if (IOUtils.contentEquals(sourceIS,targetIS)){
						isSame=true;
					} else { 
						outputFile.copyTo(backupFile);
						fusebox.upgradeLog("Backup: " + backupFile);
					}
					targetIS.close();
					sourceIS.close();
				}
				//skip same files and others we don't want to change
				if (isSame 
					|| outputFile.toString() == new File("/index.html").toString()
					|| outputFile.toString() == new File("/application.sjs").toString()
					|| outputFile.toString() == new File("/WEB-INF/classes/general.properties").toString()
					|| outputFile.getDirectory().toString() == new File("/WEB-INF/myna/ds/").toString()
				) return {};
				//copy to upgrade directory
				var is = zipFile.getInputStream(entry);
				var os = FileUtils.openOutputStream(upgradeFile.javaFile);
				IOUtils.copyLarge(is,os);
				is.close();
				os.close();
				
			}
			return {};
		});
		zipFile.close();
		
		
		
		progress.total_message="Total Upgrade Process: Executing upgrade script (Step 3 of " + numSteps + ")";
		progress.total_percentage =3/(numSteps+1) 
		progress.current_percentage=.5;
		progress.current_message = "Executing post install script";
		$session.set("upgrade_progress",progress);

		if (new File("/WEB-INF/upgrade.sjs").exists()){
			includeOnce("/WEB-INF/upgrade.sjs");
		}
		
		progress.total_message="Total Upgrade Process: Copy files (Step 4 of " + numSteps + ")";
		progress.total_percentage =4/(numSteps+1) 
		progress.current_percentage=.5;
		progress.current_message = "Copying files";
		$session.set("upgrade_progress",progress);
		
		upgradeDir.copyTo("/");
		
		progress.total_message="All Tasks Complete";
		progress.total_percentage =1 
		progress.current_percentage=1;
		progress.current_message = " ";
		progress.isComplete = true;
		$session.set("upgrade_progress",progress);
		return {
			success:true,
			backupDir:backupDir.toString()
		};
	},
	
	upgrade_progress:function(data){
		var uploadProgress = $session.get("$uploadProgress");
		var log =$session.get("upgrade_log");
		var progress = $session.get("upgrade_progress");
		if (!log){
			log=[];
			//log.push("uploading upgrade file.");	
		}
			
		
		$session.set("upgrade_log",[]);
		if (uploadProgress && uploadProgress.percentComplete != 1){
			return {
				total_message:"Total Upgrade Process: Uploading",
				total_percentage:0,
				//current_message:"Uploading war file: " + Math.floor(uploadProgress.percentComplete*100) + "% complete.",
				current_message:uploadProgress.message,
				current_percentage:uploadProgress.percentComplete,
				entries:log,
				isComplete:false
			}
		} else if (progress){
			progress = $session.get("upgrade_progress");
			//progress.entries = log;
			return progress;
		}
		return "";
	},
/* ========== Misc ========================================================== */
	no_access:function(){
		return {
			success:false,
			message:"You do not have access to this feature"
		}
	},
	create_uuid:function(){
		return {success:true,value:Myna.createUuid()}
	},
	get_auth_token:function(){
		return {
				success:true,
				token:Myna.Permissions.getAuthToken($cookie.getAuthUserId())
		}
	}
}