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
	try{
		if ($cookie) $cookie.setAuthUserId($cookie.getAuthUserId());
	}catch(e){
		$req={}
	}
	var source = typeof f == "string"?f:f.toSource()
	source=source.replace(/^\((.*)\)$/,"$1");
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
	/* Property: deleteOnJoin
		should this thread's metadata be deleted when <join> or <joinAll> is 
		called? (Default: false) 
		
		Setting this to true will cause the subThread's metadata to be deleted when <join>
		or <joinAll> is called. This makes any return value or captured output unavailable.
		
		This is a good choice for maximum memory efficiency
	*/
	this.deleteOnJoin=false;
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
			//this.releaseSubThread()
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
							control is returned to the current thread. 
							*A timeout of 0 disables the timeout*
		throwOnTimeout	-	*Optional, default true*
							If the thread has not finished before the timeout, 
							throw an Error.
*/
Myna.Thread.prototype.join=function(timeout,throwOnTimeout){
	var $this = this;
	if (throwOnTimeout === undefined) throwOnTimeout=true;
	if (timeout === undefined) timeout = 30*1000; //30 seconds
	if (this.isRunning()){
		this.javaThread.join(timeout);
		if (this.isRunning()){
			if (throwOnTimeout){
				Myna.log("error","Thread ("+this.javaThread.toString()+") Timeout detail",Myna.dump(this,"thread detail",15));
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
	this.javaThread=null;
}


/* Function: isRunning
	returns true if this thread is still running
*/
Myna.Thread.prototype.isRunning=function(){
	//if (this.mynaThread) return !this.mynaThread.environment.get("threadComplete"); 
	return this.javaThread && this.javaThread.isAlive();
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
	
	Parameters:
		timeout			-	*Optional, default 300000 (30 seconds)*
							time in milliseconds to wait for all threads to finish. 
							If all threads are not finished before the timeout 
							control is returned to the current thread
							*A timeout of 0 disables the timeout*
		throwOnTimeout	-	*Optional, default true*
							If all threads are not finished before the timeout, 
							throw an Error.
		killOnTimeout	-	*Optional, default true*
							If true, threads running past the timeout will be 
							first stopped, then killed.
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
Myna.Thread.joinAll = function(timeout,throwOnTimeout,killOnTimeout){
	return Myna.Thread.joinThreads(Myna.Thread.getThreadArray(),timeout,throwOnTimeout,killOnTimeout);
}

Myna.Thread.joinThreads =function(array,timeout,throwOnTimeout,killOnTimeout){
	var result =[];
	var $this = this;
	if (throwOnTimeout === undefined) throwOnTimeout=true;
	if (killOnTimeout === killOnTimeout) killOnTimeout=true;
	
	if (timeout === undefined) timeout = 30*1000; //30 seconds
	var timeExceeded = false;
	
	var start = new Date().getTime();
	array.forEach(function(t,i){
		var elapsed = new Date().getTime() -start;
		var timeLeft = Math.max(timeout?1:0,(timeout) - elapsed);
		result.push(t.join(timeLeft,false));
		if (!timeLeft){
			if (t.isRunning()){
				timeExceeded =true;
				if (killOnTimeout){
					t.stop();
					new Myna.Thread(function(t){
						Myna.sleep(10000);
						if (t.isRunning()){
							t.kill();
						}
					},[t])
				}
			}
		}
		if (t.deleteOnJoin) {
			delete array[i];
			Myna.Thread.getThreadArray().forEach(function(global,i,array){
				if (global === t) delete array[i]; 
			})
		}
		
	})
	//clean up arrays
	array.compact();
	Myna.Thread.getThreadArray().compact();
	//java.lang.System.gc();//good time to collect released memory

	if (timeExceeded && throwOnTimeout) {
		throw new Error("Threads exceeded timeout of " + Date.formatInterval(timeout))
	}
	return result;
}

/* Function: getThreadArray 
	Static function that returns an array of all the threads spawned in the 
	current thread
*/
Myna.Thread.getThreadArray = function(){
	if (!("__MYNA_THREADS__" in $req)) $req.__MYNA_THREADS__=[];
	return $req.__MYNA_THREADS__
}

/* 
	Class: Myna.ThreadGroup
		manages a collection of threads
		
*/
/* Constructor: ThreadGroup
	Constructor function for ThreadGroup class
	
	Parameters:
		options		-	options object, see below
		
	Options:
		priority			-	*Optional, default 0*
								default priority for each thread 
		args				-	*Optional, default []*
								default array of arguments to pass to the threads 
								created in this group
		releaseOnJoin		-	*Optional, default false*
								default value for <Thread.releaseOnJoin> for 
								each thread in this group
		deleteOnJoin		-	*Optional, default false*
								default value for <Thread.deleteOnJoin> for 
								each thread in this group
		captureOutput		-	*Optional, default true*
								default value for <Thread.captureOutput> for 
								each thread in this group
		fn					-	*Optional, default null*
								default function to be used for each thread in 
								this group
		joinEvery			-	*Optional, default 0*
								if a positive number, this thread group will 
								join all running threads after this many 
								spawns/adds. This allows you you put a limit on 
								the number of threads running at a time.
		
	
	
	Examples:
	
	(code)
	// ----- send several emails in the background with  a very low priority ---------
	var tg= new Myna.ThreadGroup({
		priority:-90,
		releaseOnJoin:true,
		captureOutput:false,
		fn:function(data){
			new Myna.Mail({
				to:data.toAddress,
				from:data.fromAddress,
				...
			}).send()
		}
		
	})
	
	qry.data.forEach(function(row){
		tg.spawn(row);
	})
			
	// ----- run all your queries at once --------------------------------------
	var queries= new Myna.ThreadGroup({
		releaseOnJoin:true
	})
	
	qry.data.forEach(function(row){
		tg.spawn(row);
	})
	tg.add(function(){
		return new Myna.Query({
			ds:"some ds",
			sql:"..."
		}).data
	}])
	
	tg.add(function(){
		return new Myna.Query({
			ds:"some other ds",
			sql:"..."
		}).data
	})
	
	// a destructuring assignment takes each row from the array returned from 
	// joinAll and assigns them to the variables in the assignment array
	var [ qryData1, qryData2] = tg.join();
	
	
	// ----- break up a memory intensive task into  ----------------------------
	// ----- a set number of concurrent threads     ----------------------------
	var workers= new Myna.ThreadGroup({
		releaseOnJoin:true,
		fn:function(row){
			... bunch of work ...
		},
		joinEvery:3
	})
	qry.data.forEach(function(row,index,array){
		workers.spawn(row);
	})
	
	var result = workers.join();
	
	(end)
*/
Myna.ThreadGroup=function(options){
	options.applyTo(this);	 
	this.threadArray = [];
}

/* Function: getThreadArray 
	returns an array of all the threads spawned by this group
*/
Myna.ThreadGroup.prototype.getThreadArray=function(){
	return this.threadArray;	
}


/* Function: getThreadArray 
	join all the threads in this group. 
	
	Takes the same parameters as <Myna.Thread.joinAll>
*/
Myna.ThreadGroup.prototype.join=function(timeout,throwOnTimeout,killOnTimeout){
	return Myna.Thread.joinThreads(this.threadArray,timeout,throwOnTimeout,killOnTimeout);	
}

/* Function: spawn 
	calls <ThreadGroup.add> using this this group's defaults and returns the generated thread.
	
	
	
	<ThreadGroup.fn> must be defined. Any arguments passed to this function 
	will be passed to the generated thread  
*/
Myna.ThreadGroup.prototype.spawn=function(){
	var args = Array.parse(arguments);
	if ((!args || !args.length) && this.args && this.args.length){
		args = this.args;
	}
	if (!args) args=[]
	if (!this.fn || typeof this.fn !== "function"){
		throw new Error("the 'fn' property must be set to a function before calling spawn");	
	}
	return this.add(this.fn,args)
	
}


/* Function: getRunningThreads() 
	returns an array of the threads in this ThreadGroup that are still running 
	  
*/
Myna.ThreadGroup.prototype.getRunningThreads=function(){
	return this.getThreadArray().filter(function(t){
		return t.isRunning();
	})
	
}

/* Function: add 
	creates a thread, adds it to this group, and returns the generated thread
	
	Parameters:
		func		-	*Optional, default <ThreadGroup.fn>*
						Function to execute in the the thread. If null or not defined
						<ThreadGroup.fn> will be used
		args		-	*Optional, default <ThreadGroup.args>*
						Array of arguments to pass to the function. If null or not
						defined, <ThreadGroup.args> will be used
		priority	-	*Optional, default <ThreadGroup.priority>*
						This integer represents how often this thread should be 
						scheduled as a percentage of normal priority. For 
						example, priority 20 would be 20% more likely to run 
						than normal requests  during a given time slice. 
						Priority -10 would be 10% LESS likely than normal 
						requests to run during a given time slice
	
*/
Myna.ThreadGroup.prototype.add=function(func,args,priority){
	if (!func) func = this.fn;
	if (!args) args = this.args||[];
	if (!priority) priority = 0;
	
	var t= new Myna.Thread(
		func,
		args,
		priority
	)
	if ("releaseOnJoin" in this) t.releaseOnJoin = this.releaseOnJoin;
	if ("deleteOnJoin" in this) t.deleteOnJoin = this.deleteOnJoin;
	if ("captureOutput" in this) t.captureOutput = this.captureOutput;
	
	while (this.getRunningThreads().length >= this.joinEvery){
		Myna.sleep(100);	
	}
	this.getThreadArray().forEach(function(t){
		if (!t.isRunning()) t.join()
	})
	
	this.getThreadArray().push(t)
	
	
	/* if (this.joinEvery && this.getRunningThreads().length >= this.joinEvery) {
		this.join(0);
	} */
	return t;
		
}
