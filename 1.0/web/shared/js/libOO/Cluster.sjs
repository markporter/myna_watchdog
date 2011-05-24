/* Class: Myna.Cluster 
	Static functions for interacting with cluster objects

	Myna uses Hazelcast <http://www.hazelcast.com> for clustering. These 
	functions grant access to the underlying Hazelcast structures. 
	
	Myna automatically clusters based on a shared "myna_permissions: datasource. 
	However, you often want to limit messages/structures to instances that share 
	the same purpose, so these functions limit scope by purpose and 
	instance id by default. This is done by appending "|purpose=,instance_id=" to 
	resource names.
	
	Hazelcast "Topics" are implemented in Myna.Event and work a little 
	differently 
	
	See Also
		*	<Myna.Event>
*/
if (!Myna) var Myna={}
Myna.Cluster ={
	hc:com.hazelcast.core.Hazelcast
}

/* Function: getMap
	returns a Hazelcast map object
	
	Parameters:
		name 		-	name of the map
		instance	-	*Optional, default $server.instanceId*
						This map will be limited to the specified instance id. This is 
						useful when you have identical instances running on multiple 
						servers and want to share data. Set to "ANY" to enable all 
						instances
		purpose	-	*Optional, default $server.purpose*
						This map will be limited to the specified purpose. Set to 
						"ANY" to enable all purposes
						
	Note: 
		The returned object is an implementation of java.util.concurrent.ConcurrentMap
		
	See:
		* Hazelcast Map <http://www.hazelcast.com/documentation.jsp#Map>
		* Java ConcurrentMap <http://java.sun.com/j2se/1.5.0/docs/api/java/util/concurrent/ConcurrentMap.html>
*/
Myna.Cluster.getMap = function(name,instance,purpose){
	if (!name) throw new Error("name is required");
	if (!purpose) purpose = $server.purpose;
	if (!instance) instance = $server.instanceId;
	return this.hc.getMap(name+"|purpose="+purpose.toLowerCase()+",instance_id="+instance.toLowerCase())
}

/* Function: getList
	returns a Hazelcast list object
	
	Parameters:
		name 		-	name of the list
		instance	-	*Optional, default $server.instanceId*
						This list will be limited to the specified instance id. This is 
						useful when you have identical instances running on multiple 
						servers and want to share data. Set to "ANY" to enable all 
						instances
		purpose	-	*Optional, default $server.purpose*
						This list will be limited to the specified purpose. Set to 
						"ANY" to enable all purposes
		
	Note: 
		The returned object is an implementation of java.util.List
		
	See:
		* Hazelcast List <http://www.hazelcast.com/documentation.jsp#List>
		* Java List <http://java.sun.com/j2se/1.5.0/docs/api/java/util/List.html>
*/
Myna.Cluster.getList = function(name,instance,purpose){
	if (!name) throw new Error("name is required");
	if (!purpose) purpose = $server.purpose;
	if (!instance) instance = $server.instanceId;
	return this.hc.getList(name+"|purpose="+purpose.toLowerCase()+",instance_id="+instance.toLowerCase())
}

/* Function: getQueue
	returns a Hazelcast queue object
	
	Parameters:
		name 		-	name of the queue
		instance	-	*Optional, default $server.instanceId*
						This queue will be limited to the specified instance id. This is 
						useful when you have identical instances running on multiple 
						servers and want to share data. Set to "ANY" to enable all 
						instances
		purpose	-	*Optional, default $server.purpose*
						This queue will be limited to the specified purpose. Set to 
						"ANY" to enable all purposes
		
	Note: 
		The returned object is an implementation of java.util.concurrent.BlockingQueue
		
	See:
		* Hazelcast Queue <http://www.hazelcast.com/documentation.jsp#Queue>
		* Java ConcurrentQueue <http://java.sun.com/j2se/1.5.0/docs/api/java/util/concurrent/BlockingQueue.html>
*/
Myna.Cluster.getQueue = function(name,instance,purpose){
	if (!name) throw new Error("name is required");
	if (!purpose) purpose = $server.purpose;
	if (!instance) instance = $server.instanceId;
	return this.hc.getQueue(name+"|purpose="+purpose.toLowerCase()+",instance_id="+instance.toLowerCase())
}