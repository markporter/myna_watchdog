/* 	Class: $session
	Global object for managing the servlet session
*/
var $session={
	isInitialized:false,
	init:function(){
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
	},
/* Function: clear
		deletes a session.
	
	*/
	clear:function(){
		if (!this.created) return;
		if (!$server.request) return;
		$server.request.getSession().invalidate();
		
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
		return $server.request.getSession().getAttribute(key);
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
		if (!$server.request) return ;
		$server.request.getSession().setAttribute(key,value);
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