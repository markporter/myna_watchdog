//only if not running from commandline
if (!$server_gateway.environment.containsKey("isCommandline")){
	/* if (Packages.bootstrap.MynaServer.server){
		new Myna.Thread(function(){
			$req.timeout=0;
			var loopCount=0;
			var lowMemCount=0;
			$profiler.mark("Server health monitor thread")
			Myna.sleep(10000);//lets give the server some time to get going
			while(true){
				Myna.sleep(1000);
				++loopCount;
				java.lang.Runtime.getRuntime().gc();
				var memFree = $server.memAvailable/$server.memMax;
				var runningThreads = $server_gateway.runningThreads.toArray().length;
				if (memFree < .015){
					++lowMemCount;
					
					java.lang.Runtime.getRuntime().gc();
					if (lowMemCount >1){
						Myna.printConsole(" Less than 15% free memory, restarting...");
						Myna.printConsole(
							"Running Threads",
							"Mem Used: " +($server.memUsed/(1024*1024)).toFixed(2) +"MB, "+ (memFree*100).toFixed(2) + "% Free. Running threads: " + runningThreads
						)
						
						$server_gateway.runningThreads.toArray()
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
								url="Thread in " +thread.getNormalizedPath(thread.requestDir);
							} 
							
							if (thread.isWaiting){
								current_task="Queued";
							} else if (scope.$profiler){
								try {
									var times = scope.$profiler.times;
									var time = times[times.length-1];
									current_task=time.label||"";
								} catch(e){}
							}
							Myna.printConsole(<ejs>
								<%=url.toFixedWidth(60)%> <%=current_task.toFixedWidth(60)%> <%=Date.formatInterval(runtime)%>
							</ejs>)
							
						})
						
						
						$server.restart()
					}
				} else {
					lowMemCount=0;	
				}
				if (loopCount==1000) loopCount=0;
			}
		},[],.99)
	} */
	$req.timeout=0;
	Myna.include("/shared/js/libOO/upgrade_tables.sjs",{});
	
	
	/* add connection testing to datasources */
	var keys = Myna.JavaUtils.enumToArray($server_gateway.javaDataSources.keys());
	var dbTypes = {}
	new Myna.File("/shared/js/libOO/db_properties/").listFiles("sjs").forEach(function(file){
		dbTypes[file.fileName.listFirst(".")] = Myna.include(file.toString(),{})
	})
	keys.forEach(function(dsName){
		  var bds = $server_gateway.javaDataSources.get(dsName);
		  var ds = Myna.JavaUtils.mapToObject($server_gateway.dataSources.get(dsName));
		  var file = new Myna.File("/WEB-INF/myna/ds/" + ds.type);
		
		  if (ds.type in dbTypes &&
					 "connectionTestSql" in dbTypes[ds.type]
		  ) {
			 bds.setTestOnBorrow(true);
			 bds.setValidationQuery(dbTypes[ds.type].connectionTestSql);
		  }
	})

	//set up the commandline Script
		var props = Myna.JavaUtils.mapToObject(java.lang.System.properties);
		var mynaCmd
		if (/windows/i.test($server.osName)){
			mynaCmd =new Myna.File("/WEB-INF/myna/commandline/myna.cmd");
			
			mynaCmd.writeString(<ejs>
				@echo off
				REM this is max memory to use. 
				set MEM=128
				
				set JAVA=<%=props["java.home"]%>\bin\java.exe
				set WEB_INF=<%=new Myna.File("/WEB-INF").javaFile.toString()%>
				
				"%JAVA%" -Xmx%MEM%m -cp "%WEB_INF%\lib\*;%WEB_INF%\classes" info.emptybrain.myna.JsCmd "%~1" "%~2"  "%~3"  "%~4"  "%~5"  "%~6"  "%~7" "%~8" "%~9" 	
			</ejs>)
			Myna.log("info","Created Myna Commandline script in " + mynaCmd.javaFile.toString(),Myna.dump(result));
		} else {
			mynaCmd =new Myna.File("/WEB-INF/myna/commandline/myna");
			
			mynaCmd.writeString(<ejs>
				#!/bin/bash
				
				#this is max memory to use. Can be overridden with the -m option 
				MEM=128
				
				JAVA="<%=props["java.home"]%>/bin/java"
				PATH="$PATH;<%=props["java.home"]%>/bin"
				WEB_INF="<%=new Myna.File("/WEB-INF").javaFile.toString()%>"
				
				if [ $# -eq 0  ] || [ $1 == "--help" ]; then
					echo
					echo USAGE:
					echo $0 [-m max_JVM_memory] filename arg1 arg2 argN...
					echo
					exit 1
				fi

				if [ $1 == "-m" ]; then
					shift
					MEM=$1
					shift
				fi
				
								
				java -DINST=MynaCmd -DSCRIPT=$1 -Xmx${MEM}m -cp $WEB_INF/lib/*:$WEB_INF/classes/ info.emptybrain.myna.JsCmd ${1+"$@"}	
			</ejs>)
			var result =Myna.executeShell("/bin/bash",<ejs>
				/bin/chmod 777 <%=mynaCmd.javaFile.toString()%>
			</ejs>)
			Myna.log("info","Created Myna Commandline script in " + mynaCmd.javaFile.toString(),Myna.dump(result));
		}
	

	new Myna.Thread(function(){
		//set up HazelCast
			var Hazelcast = com.hazelcast.core.Hazelcast;
			var config = new com.hazelcast.config.XmlConfigBuilder().build();
			var perms= $server.dataSources.myna_permissions;
			var password=Myna.Permissions.getAuthKey("cluster_key");
			//set groupname and password
				config.setGroupConfig(new com.hazelcast.config.GroupConfig(perms.url,password));
			//add unicast addresses of cluster members
				var tcpConfig = config.getNetworkConfig().getJoin().getTcpIpConfig()//new com.hazelcast.config.TcpIpConfig()
				//add ourself if not already in there
				
				/* new Myna.Query({
					ds:"myna_permissions",
					sql:<ejs>
						select distinct
							ip
						from cluster_members
					</ejs>,
					values:{}
				}).data
				.forEach(function(row){
					tcpConfig.addMember(
						row.ip
					);
				}) */
				
				
				tcpConfig.setEnabled(true);
				config.getNetworkConfig().getJoin().setTcpIpConfig(tcpConfig);
			//set encryption password
				var cryptConfig = config.getNetworkConfig().getSymmetricEncryptionConfig();
				cryptConfig.setPassword(password);
			// setup session map
				var sessionConfig = new com.hazelcast.config.MapConfig()
				sessionConfig.setName("__MYNA_SESSION__")
				sessionConfig.setMaxIdleSeconds(5)
				sessionConfig.setEvictionDelaySeconds(3)
				sessionConfig.setEvictionPolicy('LRU')
				var mapConfigs = config.getMapConfigs()
				mapConfigs.put("__MYNA_SESSION__",sessionConfig);
				config.setMapConfigs(mapConfigs)
			Hazelcast.init(config);
			var ipMan =new Myna.DataManager("myna_permissions").getManager("cluster_members");
			var id = $server.hostName+"/"+$server.instance_id;
			var localMember = com.hazelcast.core.Hazelcast.getCluster().getLocalMember().getInetSocketAddress();
			ipMan.create({
				id:id,
				ip:localMember.getAddress().getHostAddress(),
				port:localMember.getPort()
			})
				
			//create global listeners variable
				$server.set("event_listeners",{})
			//load registered listeners
			if (new Myna.File("/WEB-INF/myna/registered_listeners.sjs").exists()){ 
				Myna.include("/WEB-INF/myna/registered_listeners.sjs");
			}
			/* new Myna.Event("test").listen({
				handler:function(event){
					java.lang.System.out.println(event.toJson())
				}
			})
			
			new Myna.Event("test").listen({
				path:"/event_target.sjs",
				purpose:$server.purpose
			}) 
			new Myna.Event("test").listen({
				url:"http://localhost:8180/dev/event_target.sjs",
				server:$server.hostName
			})  */
	
	})
	//new Packages.info.emptybrain.myna.CronThread();
	
	
	//reload cron
	new Myna.Thread(function(){
		$req.timeout=0
		Myna.sleep(10000)
		
		Myna.include("/shared/js/libOO/reload_cron.sjs")
	})
	
	
}
