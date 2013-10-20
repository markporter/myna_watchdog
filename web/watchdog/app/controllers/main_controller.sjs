/* ========== Internal Functions ============================================ */
/* ---------- _recreateTables ----------------------------------------------- */
	function _recreateTables(service){
		var db = new Myna.Database($FP.defaultDs);
		var table;
		/* Settings */
			/*table = db.getTable("SETTINGS");
			
			table.create({
				recreate:true,
				columns:[{
					name:"ID",
					maxLength:"255",
					allowNull:false,
					type:"VARCHAR"
				},{
					name:"NOTIFICATION_EMAIL",
					maxLength:"255",
					allowNull:true,
					type:"VARCHAR"
				},{
					name:"HOSTNAME",
					maxLength:"255",
					allowNull:true,
					type:"VARCHAR"
				}]
			});*/
			
			
			// Keys:
			/*table.addPrimaryKey({
				id:"PK_SETTINGS",
				column:"id"
			});*/
		/* Services */
			table = db.getTable("SERVICES");

			table.create({
				recreate:true,
				columns:[{
					name:"ID",
					type:"VARCHAR",
					maxLength:255,
					allowNull:false
				},{
					name:"NAME",
					type:"VARCHAR",
					maxLength:255,
					allowNull:true
				},{
					name:"ENABLED",
					type:"INTEGER",
					allowNull:true,
					defaultValue:"0"
				},{
					name:"TEST_STATUS",
					type:"VARCHAR",
					maxLength:255,
					allowNull:true,
					defaultValue:"'pending'"
				},{
					name:"STATUS",
					type:"VARCHAR",
					maxLength:255,
					allowNull:true,
					defaultValue:"'unknown'"
				},{
					name:"RESTARTED",
					type:"TIMESTAMP",
					allowNull:true
				},{
					name:"SERVICE_MANAGER",
					type:"VARCHAR",
					maxLength:255
				}]
			})

			

			table.addPrimaryKey({
				id:"PK_SERVICES",
				column:"id"
			})

			Myna.printConsole(Myna.dumpText(table));

			

			
		/* Tests */
			table = db.getTable("TESTS");
			
			table.create({
				recreate:true,
				columns:[{
					name:"ID",
					maxLength:"255",
					allowNull:false,
					type:"VARCHAR"
				},{
					name:"SERVICE_ID",
					maxLength:"255",
					allowNull:true,
					type:"VARCHAR"
				},{
					name:"SCRIPT_NAME",
					maxLength:"255",
					allowNull:true,
					type:"VARCHAR"
				},{
					name:"STATUS",
					maxLength:"255",
					defaultValue:"'unknown'",
					allowNull:true,
					type:"VARCHAR"
				},{
					name:"LAST_CHECK",
					allowNull:true,
					type:"TIMESTAMP"
				},{
					name:"FAIL_AFTER",
					defaultValue:"1",
					allowNull:true,
					type:"INTEGER"
				},{
					name:"FAIL_COUNT",
					defaultValue:"0",
					allowNull:true,
					type:"INTEGER"
				},{
					name:"FAIL_MESSAGES",
					maxLength:"2147483647",
					allowNull:true,
					type:"VARCHAR"
				},{
					name:"ENABLED",
					defaultValue:"0",
					allowNull:true,
					type:"INTEGER"
				},{
					name:"RESTART_GRACE",
					defaultValue:"0",
					allowNull:true,
					type:"INTEGER"
				
				
				}]
			});
			
			
			// Keys:
			table.addPrimaryKey({
				id:"PK_TESTS",
				column:"id"
			});
			
			table.addForeignKey({
				localColumn:"SERVICE_ID",
				foreignTable:"SERVICES",
				foreignColumn:"ID",
				onDelete:"CASCADE", 
				onUpdate:"CASCADE" 
			});
		/* TestParameters */	
			table = db.getTable("TEST_PARAMETERS");
			
			table.create({
				recreate:true,
				columns:[{
					name:"ID",
					maxLength:"255",
					allowNull:false,
					type:"VARCHAR"
				},{
					name:"TEST_ID",
					maxLength:"255",
					allowNull:true,
					type:"VARCHAR"
				},{
					name:"NAME",
					maxLength:"255",
					allowNull:true,
					type:"VARCHAR"
				},{
					name:"SCRIPT_NAME",
					maxLength:"255",
					allowNull:true,
					type:"VARCHAR"
				},{
					name:"VALUE",
					maxLength:"4000",
					allowNull:true,
					type:"VARCHAR"
				
				
				}]
			});
			
			
			// Keys:
			table.addPrimaryKey({
				id:"PK_TEST_PARAMETERS",
				column:"id"
			});
			
			table.addForeignKey({
				localColumn:"TEST_ID",
				foreignTable:"TESTS",
				foreignColumn:"ID",
				onDelete:"CASCADE", 
				onUpdate:"CASCADE" 
			});
		/* Handlers */
			table = db.getTable("HANDLERS");
			
			table.create({
				recreate:true,
				columns:[{
					name:"ID",
					maxLength:"255",
					allowNull:false,
					type:"VARCHAR"
				},{
					name:"HANDLER_NAME",
					maxLength:"255",
					allowNull:true,
					type:"VARCHAR"
				},{
					name:"SCRIPT_NAME",
					maxLength:"255",
					allowNull:true,
					type:"VARCHAR"
				},{
					name:"SERVICE_ID",
					maxLength:"255",
					allowNull:true,
					type:"VARCHAR"
				
				
				}]
			});
			
			
			// Keys:
			table.addPrimaryKey({
				id:"PK_HANDLERS",
				column:"id"
			});
			
			table.addForeignKey({
				localColumn:"SERVICE_ID",
				foreignTable:"SERVICES",
				foreignColumn:"ID",
				onDelete:"CASCADE", 
				onUpdate:"CASCADE" 
			});
		/* HandlerParameters */
			table = db.getTable("HANDLER_PARAMETERS");
			
			table.create({
				recreate:true,
				columns:[{
					name:"ID",
					maxLength:"255",
					allowNull:false,
					type:"VARCHAR"
				},{
					name:"HANDLER_ID",
					maxLength:"255",
					allowNull:true,
					type:"VARCHAR"
				},{
					name:"NAME",
					maxLength:"255",
					allowNull:true,
					type:"VARCHAR"
				},{
					name:"SCRIPT_NAME",
					maxLength:"255",
					allowNull:true,
					type:"VARCHAR"
				},{
					name:"VALUE",
					maxLength:"4000",
					allowNull:true,
					type:"VARCHAR"
				}]
			});
			
			
			// Keys:
			table.addPrimaryKey({
				id:"PK_HANDLER_PARAMETERS",
				column:"id"
			});
			
			table.addForeignKey({
				localColumn:"HANDLER_ID",
				foreignTable:"HANDLERS",
				foreignColumn:"ID",
				onDelete:"CASCADE", 
				onUpdate:"CASCADE" 
			});
		
		Myna.printConsole("done recreate tables")
		//$res.redirect($FP.url)
		//Myna.abort()
	}
/* ---------- _sendRecoveryEmail -------------------------------------------- */
	function _sendRecoveryEmail(service){
		var settings =$FP.getModel("Setting").getById("global");
		var $this=this;
		if (settings.notification_email){
			try {
				new Myna.Mail({
					to:settings.notification_email,
					from:settings.notification_email.listFirst(),
					subject:<ejs>
						WatchDog: *RECOVERY* <%=$server.hostName%>, <%=service.name%>, <%=new Date().format("m/d H:i")%>
					</ejs>,
					isHtml:true,
					body:<ejs>
						WatchDog: *RECOVERY* <%=$server.hostName%>, <%=service.name%>, <%=new Date().format("m/d H:i")%>
					</ejs>,
				}).send()
			} catch(e){
				Myna.log("debug","email error: "+ e.message,Myna.formatError(e));	
			}
		}
	}
/* ---------- _sendFailEmail ------------------------------------------------ */
	function _sendFailEmail(service){
		var settings =$FP.getModel("Setting").getById("global");
		var $this=this;
		if (settings.notification_email){
			try {
				new Myna.Mail({
					to:settings.notification_email,
					from:settings.notification_email.listFirst(),
					subject:<ejs>
					WatchDog: *FAILURE* <%=$server.hostName%>, <%=service.name%>, <%=new Date().format("m/d H:i")%>
					</ejs>,
					isHtml:true,
					body:<ejs>
						WatchDog: *FAILURE* <%=$server.hostName%>, <%=service.name%>, <%=new Date().format("m/d H:i")%>
						<table  width="100%" height="" cellspacing="0" celpadding="0" border="1">
							<tr class="header">
								<td>Test</td><td>Status</td><td>Fail Count</td><td>Retries</td><td>Last Check</td>
								<td>Parameters</td>
							</tr>
							<@loop array="service.Tests()" element="test" >
								<tr>
									<td>
										<%=test.script_name%>
									</td>
									<td><%=test.status%></td>
									<td><%=test.fail_count%></td>
									<td><%=test.fail_after%></td>
									<td><%=(test.last_check?test.last_check.format("m/d H:i:s"):"")%></td>
									<td>
										<@loop array="test.TestParameters()" element="p" index="i">
											<%=p.name%> = <%=p.value%><br>
										</@loop>
									</td>
								</tr>
								<@if test.status=="fail" >
								<tr>
									<td colspan="4"><%=Myna.dump(test.fail_messages)%></td>
								</tr>	
								</@if>				
							</@loop>
						</table>
						
					</ejs>,
				}).send()
			} catch(e){
				Myna.log("debug","email error: "+ e.message,Myna.formatError(e));	
			}
		}
	}
	
/* ========== Actions ======================================================= */
/* ---------- index --------------------------------------------------------- */
	function index(params){
		if (params.redirect){
			$FP.redirectTo({})
		}
		this.$page.css =this.$page.css.concat([
			"extjs/resources/css/ext-all.css",
			"default.css"
		]);
		this.$page.scripts =this.$page.scripts.concat([
			"extjs/ext-all-debug.js",
			"SupaGrid.js",
			"quickdrop.js",
			"Notification.js",
			$FP.helpers.Html.url({
				controller:"Direct",
				action:"api",
				params:{
					callback:"Ext.Direct.addProvider",
					namespace:"$FP"
				}
			}),
			$FP.helpers.Html.url({
				action:"loadModels"
			})
		]);
		
			
		
		var props=Myna.getGeneralProperties();
		this.set("globalProperties",{
			title:this.$page.title=String($server.hostName),
			instance_id:props.instance_id,
			instance_purpose:props.instance_purpose,
			hostName:$server.hostName,
			appname:$application.appname,
			displayName:$application.displayName,
			appUrl:$FP.url,
			rootUrl:$server.rootUrl,
			version:$application.version,
			tests:new Myna.File($FP.dir,"tests").listFiles("sjs")
				.map(function(f){
					var name=f.fileName.listBefore(".")
					var func =Myna.include(f,{})[name]
					var meta = {}

					if (func && "meta" in func) meta= func.meta;
					meta.name=name
					return meta
				}),
			handlers:new Myna.File($FP.dir,"handlers").listFiles("sjs")
				.map(function(f){
					var name=f.fileName.listBefore(".")
					var func =Myna.include(f,{})[name]
					var meta = {}

					if (func && "meta" in func) meta= func.meta;
					meta.name=name
					return meta
				})
		})
	}
/* Function: loadModels
	Returns the ExtJS models as application/javascript. Called from the browser.
	loaded in action "index"
	*/
	function loadModels(params){
		var c = this;
		var content =[
			"Setting",
			"Handler",
			"HandlerParameter",
			"Service",
			"Test",
			"TestParameter",
		].map(function(modelName){
			return c.getElement("model_template",{
				modelName:modelName,
				model:$FP.getModel(modelName),
				controller:$FP.getController(modelName)
			}) 
				
		})
		this.renderContent(content.join('\n'),"application/javascript")
	}
/* ---------- logout -------------------------------------------------------- */
	function logout(){
		//$cookie.clearAuthUserId();
		$cookie.set("myna_auth_cookie", "",{
			expireSeconds:0,
			path:$application.url
		})
		$session.clear();
		
	}
/* ---------- reload -------------------------------------------------------- */
	function reload(params){
		$server.set("watchdog_config",false)
		$FP.redirectTo({action:"runTests",message:"<h2>Config Reloaded</h2>"})
	}
/* ---------- runTests ------------------------------------------------------ */
	function runTests(params){
		var $params =params
		//return
		var Service = $FP.getModel("Service");
		var services = Service.findBeans({enabled:1})
		var started = new Date().getTime();
		var $this=this;
		
		services
		.filter(function (service) {

			return service.status != "stopped"
		})
		.forEach(function(service){
			service.set_test_status("pending");
			service.Tests().forEach(function(test){
				test.set_last_check(new Date());
				test.set_fail_messages("");
				test.set_status("pending");

				//Myna.printDump(test)
				//test.curThread = new Myna.Thread(function(service_id,test_id){
				//	Myna.include("framework/FlightPath.sjs",{}).init()
					//var dm = $FP.dm
					//var service = dm.getManager("Service").getById(service_id);
					//var test = dm.getManager("Test").getById(test_id);
					var testFunction = Myna.include(test.getTestFile(),{})[test.script_name];
					params ={}
					test.TestParameters().forEach(function(tp){
						params[tp.name] = tp.value;
					})
					//Myna.printConsole(Myna.dumpText(params))
					try{
						var passed = testFunction(test,params);
						//Myna.printConsole("testing result " + test.script_name,passed)
						//see if we already timed out
						if (test.status =="fail") return;
						
					} catch (e) {
						test.fail(Myna.formatError(e));	
					}
					//delete test.curThread;//we are done here
					test.save();
				//},[service.id,test.id]);
				//test.curThread.releaseOnJoin =true;
				//test.curThread.deleteOnJoin =true;
				//test.curThread.captureOutput =false;
			})
			
		})
		Myna.Thread.joinAll(30000,true,true);
		
		var done=true;//unless something is still pending
		services = Service.findBeans({enabled:1}).filter(function (service) {
			
			return service.status != "stopped"
		})
		//Myna.printConsole("result loop")
		// check for timeout
			var now = new Date().getTime();
			var elapsed = now-started;
			
			if (elapsed > 30000){
			Myna.printConsole("Timeout after " + Date.formatInterval(elapsed))
			//fail any pending tests
				services.forEach(function(service){
					var name = service.name;
					service.Tests()
					.filter(function(test){
						return test.status=="pending";
					})
					.forEach(function(test){
						if (service.test_status == "pending"){
							service.fail();
						}
						test.fail("timeout after " + Date.formatInterval(elapsed))
						
						if (test.curThread && test.curThread.javaThread.isAlive()){
							test.curThread.javaThread.interrupt();
							Myna.sleep(1000);
							test.curThread.javaThread.stop();	
						}
						delete test.curThread
					})
				});
			} 
		// check for completed services 	
			services
			.forEach(function(service){
				var name = service.name
				var testsComplete =service.Tests().every(function(test){
					//Myna.printConsole(test.script_name + ":" + test.status)
					return test.status != "pending";
				})
				
				if (testsComplete){
					service.set_test_status("complete");
					var allPassed = service.Tests().every(function(test){
						return test.status=="pass"
					})
					var anyFailed = service.Tests().some(function(test){
						if (test.status=="fail" && test.fail_count >= (test.fail_after||0)){
							return true;
						} else {
							return false;	
						}
					})
					var anyRestarting = service.Tests().some(function(test){
						return test.status=="restarting";
					})
					if (anyRestarting){
						service.set_status("restarting");
					}else if (allPassed){
						if ("fail,restarting".listContains(service.status)){
							$this._sendRecoveryEmail(service)
						}
						service.set_status("pass");
						service.set_restarted(null)
					} else if (anyFailed) {
						service.set_restarted(null)
						service.set_status("fail");
						$this._sendFailEmail(service)
						Myna.printConsole("failed " + name )
						service.Handlers()
						.filter(function (handler) {return handler.script_name})
						.forEach(function(handler){
							//Myna.printConsole(service.name," handler:" +handler.script_name)
							
							//var t = new Myna.Thread(function(service_id,handler_id){
								Myna.include("framework/FlightPath.sjs",{}).init()
								/* var dm = $FP.dm
								var service = dm.getManager("Service").getById(service_id);
								var handler = dm.getManager("Handler").getById(handler_id); */
								var handlerFunction = Myna.include(handler.getHandlerFile(),{})[handler.script_name];
								var params ={}
								handler.HandlerParameters().forEach(function(tp){
									params[tp.name] = tp.value;
								})
								//Myna.printConsole(Myna.dumpText(params))
								try{
									handlerFunction(service,params);
								} catch (e) {
									Myna.log(
										"error",
										<ejs>
										Error in <%=service.name%>:<%=handler.script_name%>
										</ejs>,
										Myna.dump(service,"service")+
										Myna.dump(handler,"handler")+
										Myna.formatError(e)
									);
								}
							/* },[service.id,handler.id]);
							t.releaseOnJoin =true;
							t.deleteOnJoin =true;
							t.captureOutput =false; */
							
						
						}) 
					} else {
						service.set_status("warning");	
					}
					
				}
				//Myna.printDump(service.getData())
				
				
			});
			java.lang.Runtime.getRuntime().gc();
			
		var statusLines =[
			"======== Watchdog status ========="
		]
		services.forEach(function(s){
			statusLines.push(
				"  {0} {1}".format(
					s.name.toFixedWidth(25),
					s.status
				)
			)
		})
		statusLines.push("==================================")
		
		if (!/windows/i.test($server.osName))	{
			Myna.executeShell("bash",<ejs>
				<@loop array="statusLines" element="line" index="i">
					logger "<%=line%>"
				</@loop>
			</ejs>)
		}
		
		new Myna.File("/WEB-INF/watchdog_status").writeString(statusLines.join("\n"))
		//Myna.abort("done!",params)
		if ($params.remote){
			this.renderContent("All Tests Complete")
		}
	}
/* ---------- status -------------------------------------------------------- */
	function status(params){
		$FP.redirectTo({controller:"Service",action:"status"})
	}
/* ---------- update -------------------------------------------------------- */
	function update(params){
		/*if (!/windows/i.test($server.osName))	{
			this.data.result =Myna.executeShell("bash",<ejs>
				cd <%=new Myna.File($FP.dir,"../").javaFile.toString()%>
				./update_watchdog
			</ejs>)
		}*/
		Myna.include($FP.dir +"app/lib/svn.sjs");
		var svn = new SVN()
		svn.connect("svn://rodent.health.unm.edu/watchdog/trunk/1","mporter","")
		var result = svn.update_module(new Myna.File("/").toString())
		this.renderContent(<ejs>
			<h1>Update complete, restarting watchdog...</h1>
			<br>
			<%=new Myna.DataSet(result).toHtmlTable()%>
			<META HTTP-EQUIV="refresh" content="30; url=<%=$FP.url%>">
		</ejs>)
		$res.metaRedirect($FP.url)
		new Myna.Thread(function (argument) {
			Myna.sleep(1000)
			$server.restart();	
		})
		
	}
/* Function: changeAdminPassword
	Changes the admin password

	This action is used for both displaying the dialog page, and for handling 
	the save of a new password
	*/
	function changeAdminPassword(params){
		var props=Myna.getGeneralProperties();
		
		this.set("authCodeRequired",true)
		/*
		Password does not exist, generate auth code, and require auth code to 
		reset
		*/
		if (!props.admin_password){
			
			var authFile =new Myna.File("/WEB-INF/myna/admin_auth_code")
			if (
				!authFile.exists() 
				|| authFile.lastModified.add(Date.MINUTE,4) < new Date()
			) {
				authFile.writeString(
					Myna.createUuid().hashCode().toString().replace(/\-/,"1")
				);
			}
			
		}

		this.set("authCodeRequired",!props.admin_password)
		this.$page.title="Change Myna Admin Password"
	}	
/* Function: saveAdminPassword
		saves a new admin password

		Parameters:
			password$array	-	array of password inputs. Must match
			authCode		-	Only needed when no existing password  
			existingPwd		-	Only needed when a password exists
		*/
		function saveAdminPassword(params) {
			var props=Myna.getGeneralProperties();
			var resetStatus =$server.get("_MYNA_ADMIN_PWD_RESET_") ||{
				count:-1,
				ts:new Date()
			}
			var authFile =new Myna.File("/WEB-INF/myna/admin_auth_code")

			
			//try to wreck automated attacks
				resetStatus.ts=new Date();
				resetStatus.count++;			

				// check old auth code
				if (
					!props.admin_password 
					&& (
						!authFile.exists() 
						|| authFile.lastModified.add(Date.MINUTE,4) < new Date()
					) 
				){
					$flash.set("error","Auth code is too old. Please try again.");
					$FP.redirectTo({action:"changeAdminPassword"})
				}

				//reset lockout after 1 minute of inactivity
				if (resetStatus.ts.add(Date.MINUTE,1) < new Date()){//reset lockout
					resetStatus.count=0;
				}

				//Myna.printConsole(Myna.dumpText(resetStatus));	
				//progressive timeout
				Myna.sleep(Date.getInterval(Date.SECOND,5) * resetStatus.count);
			
			try{
				if (props.admin_password && ! params.existingPwd.hashEquals(props.admin_password)){
					Myna.log("error","Myna Admin password reset: failed existing pwd",Myna.dump($req.headers,"Request headers"));			
					$flash.set("error","Wrong Admin Password. Please try again.");
					$FP.redirectTo({action:"changeAdminPassword"})
				}

				if (!props.admin_password && params.authCode != authFile.readString()){
					Myna.log("error","Myna Admin password reset: failed authCode",Myna.dump($req.headers,"Request headers"));			
					$flash.set("error","Wrong Auth Code. Please try again.");
					$FP.redirectTo({action:"changeAdminPassword"})
				}

				//reset count on success
				resetStatus.count=0;

				//check lockout
				if (resetStatus.count >= 3){
					$flash.set("error","Too many reset attempts. Please try again in a few minutes");
					$FP.redirectTo({action:"changeAdminPassword"})
				}			

				if (params.password$array && params.password$array.length  == 2){
					if (params.password$array[0] != params.password$array[1])
					{
						$flash.set("error","Passwords do not match, please try again.");
						$FP.redirectTo({action:"changeAdminPassword"})
					} else if (params.password$array[0].length < 12){
						$flash.set("error","Passwords must be at least 12 characters long. Please try again.");
						$FP.redirectTo({action:"changeAdminPassword"})
					} else{
						props = Myna.getGeneralProperties();
						$server_gateway.generalProperties.setProperty("admin_password",params.password$array[0].toHash());
						$server_gateway.saveGeneralProperties();
						$FP.redirectTo({action:"index"})
					}
				}
			} catch(e if !/_ABORT_/.test(e.message)){
				Myna.log("error","Myna_admin password reset error",Myna.formatError(e));
				$flash.set("error","Unknown Error. Please try again.");
				$FP.redirectTo({action:"changeAdminPassword"})
			} finally{

				$server.set("_MYNA_ADMIN_PWD_RESET_",resetStatus)
			}
		}

			
/* ---------- test ---------------------------------------------------------- */
	function test(params) {
		var json =$FP.getController("Service")._saveJson()
		//this.renderContent(json,"application/json",$server.hostName + "_watchdog_export.json")
		this.renderContent(json)
	}