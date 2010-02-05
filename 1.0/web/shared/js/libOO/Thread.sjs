/* 
	Class: Myna.Thread
		Executes code in a separate thread
	
		
*/
if (!Myna) var Myna={}

/* Constructor: Thread
	Constructor function for Thread class
	
	Parameters:
		f			-	function to execute
		args		-	*Optional, default []*
						array of arguments to pass to the function;
		priority	-	*Optional, default 0*
						This integer represents how often this thread should be 
						scheduled as a percentage of normal priority. For 
						example, priority 20 would be 20% more likely to run 
						than normal requests  during a given time slice. 
						Priority -10 would be 10% LESS likely than normal 
						requests to run during a given time slice 
	
	Detail:
		Executes _f_ in a separate thread. This can be used to take advantage of 
		multiple processors be splitting a long running task into multiple 
		functions running in parallel, or to execute non-interactive code in the 
		background.
		
		Each Thread runs in a separate Myna request with it's own global ($) 
		variables. Because the script path is copied from the parent thread, 
		$application will be created the same as the parent thread and 
		$application.onRequestStart() .onError() etc. will be fired at the 
		appropriate times. This means that you should never call Myna.Thread from
		an application.sjs file, or your code will create an infinite thread spawning 
		loop, and will error out after 5 levels.
		
		You can pass variables from the current thread into Myna.Thread and the 
		sub-thread will have access to them even after the parent thread exits
		
		The parent thread can access the return value from _f_ via 
		<Myna.Thread.getReturnValue> or from <Myna.Thread.join>
		
		The parent thread can access the generated output of _f_ via 
		<Myna.Thread.getContent>
		
		
	Warning:
		Threads can themselves call Threads to a maximum depth of 5 levels. This 
		prevents infinite Thread spawning.   
		
	Memory Tip:
		if you do not need access to the subThread's output, you can 
		dramatically decrease memory usage by setting <Thread.mynaThread> 
		to null 
		
	Performance Tip:
		If you are running Myna.Thread in a loop, you can limit the number of 
		concurrent Threads by making periodic calls to <Myna.Thread.joinAll>. 
		See examples below
		
	Returns:
		Reference to Thread instance
		
	Examples:
	
	(code)
	// ----- send an email in the background with  a very low priority ---------
	var t= new Myna.Thread(function(data){
		new Myna.Mail({
			to:data.toAddress,
			from:data.fromAddress,
			...
		}).send()
	},[$req.data],-90)
	
	
	// ----- run all your queries at once --------------------------------------
	new Myna.Thread(function(){
		return new Myna.Query({
			ds:"some ds",
			sql:"..."
		}).data
	}])
	
	new Myna.Thread(function(){
		return new Myna.Query({
			ds:"some other ds",
			sql:"..."
		}).data
	})
	
	// a destructuring assignment takes each row from the array returned from 
	// joinAll and assigns them to the variables in the assignment array
	var [ qryData1, qryData2] = Myna.Thread.joinAll();
	
	
	// ----- break up a memory intensive task into  ----------------------------
	// ----- a set number of concurrent threads     ----------------------------
	qry.data.forEach(function(row,index,array){
		var t=new Myna.Thread(function(){
			... bunch of work ...
		},[])
		
		//this frees each thread's memory when that thread is joined
		t.releaseOnJoin=true;
		
		//this stops after every three spawns or the end of the loop to
		//wait for running threads to finish
		if ((index+1)%3 == 0  || index == array.length-1) Myna.Thread.joinAll();
	})
	
	
	(end)
*/
Myna.Thread=function(f,args,priority){
	
	
	if (!args) args = [];
	
	var parent = this;
	/* this.functionSource = f.toSource();
	$server_gateway.environment.put("threadSource", this.functionSource); */
	
	
	var source = f.toSource().replace(/^\((.*)\)$/,"$1");
	if ($server_gateway.threadChain.size() > 5){
		Myna.logSync("ERROR","thread chains cannot descend more than 5 levels.",Myna.dump($server_gateway.threadChain,"Thread Chain") + Myna.dump($server,"$server")+ Myna.dump($req.data,"$req.data"));
		throw new Error("thread chains cannot descend more than 5 levels.");
	}
	var result = $server_gateway.spawn(source,args)
	result = Myna.JavaUtils.mapToObject(result)
	/* Property: javaThread
		a local instance of java.lang.Thread
	*/
	this.javaThread=result.javaThread;
	/* Property: releaseOnJoin
		should this thread's memory be released when <join> or <joinAll> is 
		called? (Default: false) 
		
		Setting this to true will cause the subThread to be released when <join>
		or <joinAll> is called. If <captureOutput> is also true, then output is 
		cached before releasing the the subThread
	*/
	this.releaseOnJoin=false;
	/* Property: captureOutput
		should this thread capture generated content and return value from the 
		subThread? (Default: true) 
		
		Setting this to false will set <mynaThread> to null. Setting this value 
		to true has no effect
	*/
	var _captureOutput=true
	this.__defineGetter__("captureOutput", function() {
		return _captureOutput;
	});
	this.__defineSetter__("captureOutput", function(val) {
		if (!val){
			_captureOutput=false;
			this.releaseSubThread()
		}
	});
	
	/* Property: mynaThread
		a reference to the running MynaThread instance. 
		
		Setting this to null will prevent access to subThread output 
		(see <Thread.getContent> and <Thread.getReturnValue>) but will also allow the 
		subThread's memory to be garbage collected immediately on completion
	*/
	this.mynaThread=result.mynaThread;
	result=null;
	
	if (this.javaThread){
		var p = java.lang.Thread.NORM_PRIORITY;
		if (priority > 0){
			p += (priority/100) * (java.lang.Thread.MAX_PRIORITY - p);
		} else if (priority < 0){
			p += (priority/100) * (p - java.lang.Thread.MIN_PRIORITY);
		}
		this.javaThread.setPriority(p)
		Myna.Thread.getThreadArray().push(this);
	}
	 
}

/* Function: join
	Pauses the current thread until this thread exits, and then returns thread function result
	
	Returns:
		return value of thread function
	
	Parameters:
		timeout			-	*Optional, default 300000 (30 seconds)*
								time in milliseconds to wait for the thread to finish. 
								If the thread has not finished before the timeout 
								control is returned to the current thread
		throwOnTimeout	-	*Optional, default true*
								If the thread has not finished before the timeout, 
								throw an Error.
*/
Myna.Thread.prototype.join=function(timeout,throwOnTimeout){
	var $this = this;
	if (throwOnTimeout === undefined) throwOnTimeout=true;
	if (!timeout) timeout = 30*1000; //30 seconds
	if (this.javaThread.isAlive()){
		this.javaThread.join(timeout);
		if (this.javaThread.isAlive()){
			if (throwOnTimeout){
				Myna.log("error","Thread ("+this.javaThread.toString()+") Timeout detail", this.functionSource);
				throw new Error("Thread ("+this.javaThread.toString()+") still running after "+timeout+" miliseconds. See log for thread detail.")	
			} else return undefined 
		} else {
			if (this.releaseOnJoin || !this.captureOutput){
				this.releaseSubThread();	
			} 
			return this.getReturnValue();
		}
	} else {
		if (this.releaseOnJoin || !this.captureOutput){
			this.releaseSubThread();	
		} 
		return this.getReturnValue();	
	}
}

/* Function: releaseSubThread
	releases this Thread's subThread so that its memory can be recovered
	
	Detail:
		This function sets <Thread.mynaThread> to null. If <Thread.captureOutput>
		is true, this function will first cache the subThread's return value and 
		generated content. If you call this function a second time after setting 
		<Thread.captureOutput> to false, then any cached values will be cleared
*/
Myna.Thread.prototype.releaseSubThread=function(){
	if (this.captureOutput && this.mynaThread){
		this._content = String(this.mynaThread.generatedContent)
		this.getContent = function(){
			return this._content	
		}
		this._returnValue = this.mynaThread.environment.get("threadReturn")
		this.getReturnValue = function(){
			return this._returnValue	
		}
	} else {
		this.content=""
		this.returnValue=undefined
	}
	this.mynaThread=null;
}


/* Function: isRunning
	returns true if this thread is still running
*/
Myna.Thread.prototype.isRunning=function(){
	return this.javaThread.isAlive();
}

/* Function: getContent
	returns content generated by this thread
	
	Don't expect to see anything while <isRunning> returns true
*/
Myna.Thread.prototype.getContent=function(){
	return this.mynaThread?String(this.mynaThread.generatedContent):""	
}

/* Function: getReturnValue
	returns the value returned by the thread function.
	
	Don't expect to see anything while <isRunning> returns true
*/
Myna.Thread.prototype.getReturnValue=function(){
	return this.mynaThread?this.mynaThread.environment.get("threadReturn"):"";
}


/* Function: stop
	stops this thread.
*/
Myna.Thread.prototype.stop=function(){
	return this.javaThread.interrupt();
}

/* Function: kill
	kills this thread.
*/
Myna.Thread.prototype.kill=function(){
	return this.javaThread.stop();
}
/* Function: joinAll 
	Static function that calls <join> on all threads spawned from the current 
	thread, and returns an array of their return values
	
	Example:
	(code)
	(10).times(function(i){
		new Myna.Thread(function(i){
			return i;
		},[i])
	})
	Myna.printDump(Myna.Thread.joinAll())
	(end)
*/
Myna.Thread.joinAll = function(){
	return Myna.Thread.getThreadArray().map(function(t){
		return t.join();
	})	
}

/* Function: getThreadArray 
	Static function that returns an array of all the threads spawned in the 
	current thread
*/
Myna.Thread.getThreadArray = function(){
	if (!("__MYNA_THREADS__" in $req)) $req.__MYNA_THREADS__=[];
	return $req.__MYNA_THREADS__
}
