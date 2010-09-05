//only if not running from commandline
if (!$server_gateway.environment.containsKey("isCommandline")){

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
		if (/windows/i.test($server.osName)){
			
		} else {
			var mynaCmd =new Myna.File("/WEB-INF/myna/commandline/myna");
			
			mynaCmd.writeString(<ejs>
				#!/bin/bash
				
				#this is max memory to use. can be overridden with the -m option 
				MEM=128
				
				JAVA="<%=props["java.home"]%>/bin/java"
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
				
								
				$JAVA -Xmx${MEM}m -cp $WEB_INF/lib/*:$WEB_INF/classes/ info.emptybrain.myna.JsCmd ${1+"$@"}	
			</ejs>)
			var result =Myna.executeShell("/bin/bash",<ejs>
				chmod 777 <%=mynaCmd.javaFile.toString()%>
			</ejs>)
			Myna.log("info","Created Myna Commandline script in " + mynaCmd.javaFile.toString(),Myna.dump(result));
		}
	

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
			
			new Myna.Query({
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
			})
			
			
			tcpConfig.setEnabled(true);
			config.getNetworkConfig().getJoin().setTcpIpConfig(tcpConfig);
		//set encryption password
			var cryptConfig = config.getNetworkConfig().getSymmetricEncryptionConfig();
			cryptConfig.setPassword(password);
		
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
	}
