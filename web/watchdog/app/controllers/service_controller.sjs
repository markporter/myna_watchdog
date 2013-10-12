/* ========== Internal Functions ============================================ */
	
/* ========== Actions ======================================================= */
	/* ---------- edit ------------------------------------------------------ */
		function edit(params){
			var e1=$profiler.begin("edit " + params.id)
			var e3=$profiler.begin("model")
			var model = this.model
			e3()
			var e2=$profiler.begin("model.get")
			var bean=this.model.get({id:params.id})
			e2()
			//var bean=this.model.getById(params.id)
			this.set("bean",bean);
			
			var formData = bean.data
			this.set("formData",formData);
			e1()
		}
	/* ---------- exportJson ------------------------------------------------ */
		function exportJson(params){
			var ret = this.model.findBeans().map(function(s){
				var node =  s.getData(true)
				
				node.Tests = s.Tests().map(function(t){
					var node =t.getData(true)
					node.TestParameters=t.TestParameters().map(function(tp){
						return tp.getData(true)
					})
					return node;
				})
				node.Handlers = s.Handlers().map(function(h){
					var node =h.getData(true)
					node.HandlerParameters=h.HandlerParameters().map(function(hp){
						return hp.getData(true)
					})
					return node;
				})
				return node
			})
			var json = JSON.stringify(ret,function(k,v){
				if (v instanceof Date) {
					return "\\/Date(' +v.getTime() +')\\/"
				}else{
					return v	
				}
			},"   ")
			this.renderContent(json,"application/json",$server.hostName + "_watchdog_export.json")
		}
	/* ---------- importJson ------------------------------------------------ */
		function importJson(params){
			//Myna.printDump(params)
			var file = new Myna.File(params.import_file.stats.diskLocation);
			var $this =this;
			if (file.exists){
				var config = file.readString().parseJson()
				//Myna.printDump(config)
				var v = new Myna.ValidationResult();
				config.forEach(function(sc){
					({
						enabled:0,
						status:"unknown",
						test_status:"unknown"
					}).applyTo(sc,true);
					var s = $this.model.get(sc)
					//Myna.abort("",s.Tests()[0].getData(3))
					v.merge(s.save())
					
					s.Tests().forEach(function(t){
						t.setFields({
							status:"unknown",
							fail_count:0,
							last_check:null
						})
						t.save()
					})
					
				})
				
				$FP.redirectTo({
					action:"list",
					validation:v
				})
			}
			
			//Myna.abort("params")
		}
	/* ---------- uploadJson ------------------------------------------------ */
		function uploadJson(params){
			
		}
	/* ---------- list ------------------------------------------------------ */
		function list(params){
			var searchParams={
				orderBy:"lower(name)"
			}
			this.model.columnNames.forEach(function(name){
				if (name in params 
					&& params[name] 
					&& !"id,controller,action,$inline".listContains(name)
				){
					searchParams[name]=params[name];
				}
			})

			this.set("beans",this.model.findBeans(searchParams).filter(function(bean){
				return bean.id != "global"
			}))
			return this.data.beans
			
		}

	/* ---------- listSystemServices ---------------------------------------- */
		function listSystemServices(params){
			var isWindows = /windows/i.test($server.osName);
			var output,result;
			var scriptPath = "";

			if (isWindows){
				output="";
				try{
					result =Myna.executeWinBatch("net start".format(params.name));
					output = result.output;
				} catch(e){}

			} else {
				var isBSD = /BSD/.test($server.osName);
				scriptPath = isBSD?"/etc/rc.d/":"/etc/init.d/";

				try{
					result =Myna.executeShell("bash","ls -1 {0}".format(scriptPath),true)
					output = result.output
				} catch(e){}

			}
			return output.split("\n").map(function (name) {
				return {
					service_name:name,
					service_path:scriptPath+name
				}
			})
		}
	/* ---------- copyService ----------------------------------------------- */
		function copyService(params){
			var service =this.model.getById(params.id)
			var nsd = {
				enabled:0,
				status:"unknown",
				test_status:"unknown",
				name:"copy of " +service.name,
				
			}
			var newService = this.model.get(nsd)
			newService.save()
			service.Tests().forEach(function(t){
				var test =newService.Tests().getNew(
					t.data.filter(function(v,k){
						return !/_?id$/.test(k)
					})
				)
				test.save()
				
				
				t.TestParameters().forEach(function(tp){
					var tp =test.TestParameters().getNew(
						tp.data.filter(function(v,k){
							return !/_?id$/.test(k)
						})		
					)
					tp.save()
				})
				
			})
			
			service.Handlers().forEach(function(h){
				var handler =newService.Handlers().getNew(
					h.data.filter(function(v,k){
						return !/_?id$/.test(k)
					})
				)
				handler.save()
				
				
				h.HandlerParameters().forEach(function(hp){
					var hp =handler.HandlerParameters().getNew(
						hp.data.filter(function(v,k){
							return !/_?id$/.test(k)
						})		
					)
					hp.save()
				})
				
			})
			
			$FP.redirectTo({action:"list"})
			/* service.Handlers().map(function(h){
				var data =h.data.applyTo({
					HandlerParameters:h.HandlerParameters().map(function(hp){
						return hp.data.filter(function(v,k){
							return !/_?id$/.test(k)
						})		
					})
				})
				return data.filter(function(v,k){
					return !/_?id$/.test(k)
				})
			}) */
			
			
			/* Myna.printDump(nsd)
			Myna.print(<ejs>
				<pre>
					<%=JSON.stringify(nsd,null,"    ")%>
				</pre>
			</ejs>)
			
			Myna.abort() */
		}
	/* ---------- save ------------------------------------------------------ */
		function save(params){
			
			if (params.system_name){
				var scriptPath ="";
				var serviceName =params.system_name;
				if (params.system_name.listLen("/") > 1){
					scriptPath = "/"+params.system_name.listBefore("/") + "/";
					serviceName = params.system_name.listLast("/");
				}

				var testModel = $FP.getModel("Test")
				var testId = testModel.genKey();
				params.Tests=[{
					id:testId,
					script_name:"testService",
					enabled:1,
					TestParameters:[{
						id:"{0}-testService-scriptPath".format(testId),
						name:"scriptPath",
						script_name:"testService",
						value:scriptPath
					},{
						id:"{0}-testService-name".format(testId),
						name:"name",
						script_name:"testService",
						value:serviceName
					},{
						id:"{0}-testService-action".format(testId),
						name:"action",
						script_name:"testService",
						value:"status"
					}]
				}]

				var handlerModel = $FP.getModel("Handler")
				var handlerId = handlerModel.genKey();
				params.Handlers=[{
					id:handlerId,
					script_name:"manageService",
					HandlerParameters:[{
						id:"{0}-manageService-scriptPath".format(handlerId),
						name:"scriptPath",
						script_name:"manageService",
						value:scriptPath
					},{
						id:"{0}-manageService-name".format(handlerId),
						name:"name",
						script_name:"manageService",
						value:serviceName
					},{
						id:"{0}-manageService-action".format(handlerId),
						name:"action",
						script_name:"manageService",
						value:"restart"
					}]
				}]
				params.service_manager = handlerId
			}
			var bean = this.model.get(params);
			var result = bean.save()
			//if (result.success) bean = this.model.getById(bean.id)
			result.data = bean.getData()
			return result
		}
	/* ---------- remove ---------------------------------------------------- */
		function remove(params){
			var bean = this.model.get(params);
			if (bean.exists) {
				
				this.model.remove(bean.id)
				/*$FP.redirectTo({
					action:"list",
					params:{
						service_id:bean.service_id
					},
					success:this.name +" Removed." 
				})*/
			}
		}
	/* ---------- status ---------------------------------------------------- */
		function status(params){
			this.set("services",this.model.findBeans({enabled:1,orderBy:"lower(name)"}))
		}
	/* ---------- manageService --------------------------------------------- */
		function manageService(params){
			var service = this.model.getById(params.service_id)
			
			Myna.include("framework/FlightPath.sjs",{}).init()
			var handler = service.ServiceManager()
			var handlerFunction = Myna.include(handler.getHandlerFile(),{})[handler.script_name];
			var handlerParams ={}
			handler.HandlerParameters().forEach(function(tp){
				handlerParams[tp.name]= tp.value;
			})

			handlerParams.action = params.serviceAction

			//try{
				handlerFunction(service,handlerParams);
			/*} catch (e) {
				Myna.log(
					"error",
					<ejs>
					Error in <%=service.name%>:<%=handler.name%>
					</ejs>,
					Myna.dump(service,"service")+
					Myna.dump(handler,"handler")+
					Myna.formatError(e)
				);
				handler.fail();	
			}*/
			
		}
	/* ---------- restart --------------------------------------------------- */
		function restart(params){
			var service = this.model.getById(params.id)
			
			
			
			
			//service.set_restarted(null)
			
			service.set_status("Manual Restart");
			service.Handlers().forEach(function(handler,index){
				Myna.include("framework/FlightPath.sjs",{}).init()
				var handlerFunction = Myna.include(handler.getHandlerFile(),{})[handler.name];
				var params ={}
				handler.HandlerParameters().forEach(function(tp){
					params[tp.name] = tp.value;
				})
				try{
					$profiler.mark("handler #" +index)
					handlerFunction(service,params);
					$profiler.mark("done handler #" +index)
				} catch (e) {
					Myna.log(
						"error",
						<ejs>
						Error in <%=service.name%>:<%=handler.name%>
						</ejs>,
						Myna.dump(service,"service")+
						Myna.dump(handler,"handler")+
						Myna.formatError(e)
					);
					handler.fail();	
				}
			})
			$profiler.mark("redirecting")
			$FP.redirectTo({action:"status"})
		}