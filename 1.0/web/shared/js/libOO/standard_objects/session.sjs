/* 	Class: $session
	Global object for managing the servlet session
*/
var $session={
	isInitialized:false,
	/* init:function(){
		if(!$server.request) return;
		if (!$session.created){
			var local_session = $server.request.getSession(); 
				
			$session.id=local_session.getId();
			$session.created=new Date(local_session.getCreationTime());
			$session.timeoutMinutes=local_session.getMaxInactiveInterval()/60;
			
			
			var isNew = !$session.get("___MYNA_SESSION_IS_RUNNING___");
			if (isNew){
				$session.set("___MYNA_SESSION_IS_RUNNING___",true);
				$application._onSessionStart();
			}
			
		} 
	}, */
	init:function(){
		if(!$server.request) return;
		if (!$session.created){
			this._map = Myna.Cluster.getMap("__MYNA_SESSION__")
			
			$session.id=$cookie.get("MYNA_SESSION")
			
			if (!$session.id){
				$session.id =$cookie.set("MYNA_SESSION",Myna.createUuid());
			}
			var isNew = !this._map.get($session.id);
			if (isNew) this._map.put($session.id,"{}");
			var entry = this._map.getMapEntry($session.id);
			$session.created=new Date(entry.getCreationTime())
			if (this.timeoutMinutes 
				&& new Date().getTime()-entry.getCreationTime() > this.timeoutMinutes*60*1000)
			{
				this._map.evict($session.id)
			}
			
			
			if (isNew){
				$application._onSessionStart();
			}
			
		} 
	},
/* Function: clear
		deletes a session.
	
	*/
	clear:function(){
		if (!this.created) return;
		if (!$server.request) return;
		this._map.evict($session.id)
		
	},
/* Function: get
		gets a value from the session.
		
		Parameters:
			key	-	String variable name to retrieve
	
		Returns:
			value of _key_ in the current session
		
		See:	
			<$session.set>
	*/
	get:function(key){
		if (!this.created) this.init();
		if (!$server.request || $server.isThread) return null;
		return (this._map.get($session.id)||"{}").parseJson()[key] 
	},
	/* Function: set
		Sets a value in the session.
		
		Parameters:
			key		-	String variable name to set
			value	- 	value to set
	
		See:	
			<$session.get>
			
	*/
	set:function(key,value){
		if (!this.created) this.init();
		if (!$server.request) return undefined;
		var gotLock = this._map.lockMap(10,java.util.concurrent.TimeUnit.SECONDS);
		if (gotLock){
			try {
				var data = (this._map.get($session.id)||"{}").parseJson()
				data[key] = value;
				this._map.put($session.id,data.toJson())
			} finally {
				this._map.unlockMap()
			}
			data[key] = value;
		} else throw new Error("Unable to lock session for write")
		return value
	},
/* Property: id
		The session id (readonly) 
	*/
	id:null,
/* Property: created
		Session created time (readonly). 
	*/
	created:null,
	/* Property: timeoutMinutes
		Number of minutes of inactivity before session is deleted.
		
		Detail:
		Set this to a different value to change the session timeout 
	*/
	timeoutMinutes:null
}