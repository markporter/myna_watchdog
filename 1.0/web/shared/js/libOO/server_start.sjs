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


//set up HazelCast
var Hazelcast = com.hazelcast.core.Hazelcast;
var config = Hazelcast.getConfig();
var perms= $server.dataSources.myna_permissions;
var password=Myna.Permissions.getAuthKey("cluster_key");
//set groupname and password
	config.setGroupConfig(new com.hazelcast.config.GroupConfig(perms.url,password));
//add unicast addresses of cluster members
	var tcpConfig = config.getNetworkConfig().getJoin().getTcpIpConfig()//new com.hazelcast.config.TcpIpConfig()
	//add ourself if not already in there
	var ipMan =new Myna.DataManager("myna_permissions").getManager("cluster_members");
	var id = $server.hostName+"/"+$server.instance_id;
	var localMember = com.hazelcast.core.Hazelcast.getCluster().getLocalMember().getInetSocketAddress();
	ipMan.create({
		id:id,
		ip:localMember.getAddress().getHostAddress(),
		port:localMember.getPort()
	})
	
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


/* $server.set("__MYNA_CLUSTER__",Hazelcast.newHazelcastInstance(config));*/
//init default instance
	Hazelcast.shutdown();
	//config.setGroupConfig(new com.hazelcast.config.GroupConfig(perms.url+":"+$server.purpose,password));
	Hazelcast.init(config);
	Hazelcast.restart();
//init Purpose instance
	/* config.setGroupConfig(new com.hazelcast.config.GroupConfig(perms.url+":"+$server.purpose,password));
	$server.set("__MYNA_CLUSTER_PURPOSE__",Hazelcast.newHazelcastInstance(config)); */
//init host instance
	/* config.setGroupConfig(new com.hazelcast.config.GroupConfig(perms.url+":"+$server.hostName,password));
	$server.set("__MYNA_CLUSTER_HOST__",Hazelcast.newHazelcastInstance(config)); */
	
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
