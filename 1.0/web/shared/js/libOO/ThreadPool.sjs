/*global Myna:true java:false $application:true $server_gateway:false Packages:false $req:true*/
/*	Class: Myna.ThreadPool
	Creates a ThreadPool that can execute a function multiple times in separate 
	threads, with a maximum concurrency
*/

/* Function: ThreadPool
	Constructor for ThreadPool objects	

	Parameters:
		fn		-	function to execute within the pool. The params for each 
					thread will be passed to <run>. This function will be 
					stripped of any closures or member properties. This means
					this function should only reference parameters and standard 
					JS and Myna globals

		options	-	*Optional*
					*JS Object*
					See *Options* below

	Options:
		poolSize	-	Maximum number of concurrent threads. Defaults to 1
		background	-	If true, threads will be run in the global background 
						ThreadPool. Otherwise a local ThreadPool is used and 
						will be terminated at request end. Default false.
	*/
	Myna.ThreadPool = function (fn,options) {

		if (arguments.length) {
			var $this = this;
			this._fnParent = fn.__parent__;
			this._fn = fn.toSource();
			this._futures=[];

			if (!options) options={};

			this.poolSize=options.poolSize||1;
			this.isBackgroundPool =!!options.background;

			if (!this.isBackgroundPool) {
				$application.addOpenObject({
					close:function () {
						$this //().shutdown();
					}
				});
			}
		}
	};

/* _getThreadPool INTERNAL returns underlying executor service*/
	Myna.ThreadPool.prototype._getThreadPool = function(){
		var Executors = java.util.concurrent.Executors;	
		if (this.isBackgroundPool) return $server_gateway.backgroundThreadPool;
		if (!this.threadPool){
			this._futures=[];
			this.threadPool = Executors.newFixedThreadPool(this.poolSize);
		}
		return this.threadPool;
	};

/* Function: run
	Adds a thread to the ThreadPool with  the supplied arguments

	Parameters:
		any		-	parameters are passed to the thread function defined in the 
					constructor

	Returns <Myna.ThreadPool.Future>
		
	*/
	Myna.ThreadPool.prototype.run = function() {
		var Executors = java.util.concurrent.Executors;	
		
		var func =[
			"function () {",
				"var fn = {0}",
				"$server_gateway.isWaiting=false;",
				"fn.__parent__ =$server_gateway.environment.get(\"parentScope\");",
				"$server.globalScope.result = fn.apply(this,Array.parse(arguments));",
			"}"
		].join("\n").format(
			this._fn
		);
		var mt = $server_gateway.buildBackgroundThread(func,Array.parse(arguments));
		mt.isWaiting=true;
		Packages.info.emptybrain.myna.MynaThread.runningThreads.add(mt);
		mt.environment.put("parentScope",this._fnParent);
		var future =this._getThreadPool().submit(Executors.callable(mt,mt));
		this._futures.push(future);
		return future;
	};



/*Myna.ThreadPool.prototype.join = function (timeout) {
		var unit = java.util.concurrent.TimeUnit.MILLISECONDS;
		if (!this.isBackgroundPool) {
			this._getThreadPool().shutdown();
			if (seconds){
				this._getThreadPool().awaitTermination(
					timeout,
					unit
				);
			}
		}
		return this.getResults(timeout);
	};*/

/* Function: getResults
	waits until all threads are complete, and returns an array of their results 
	in the order requested

	Parameters:
		timeout	-	*Optional, default wait until done*
					time to wait in milliseconds (see <Date.getInterval>)

	If a timeout occurs, all remaining results will be undefined
	*/
	Myna.ThreadPool.prototype.getResults = function (timeout) {

		function get(f){
			try {
				return new Myna.ThreadPool.Future(f).get(timeout)
			} catch (e){
				return undefined;
			}
		}
		var result =[]
		
		if (timeout){
			if (this.isBackgroundPool) {
				var globalTimeout = timeout;
				var isDone = function (f) {return f.isDone();}
				var now = java.lang.System.currentTimeMillis;
				var done=this._futures.every(isDone);
				var start = now();
				
				while (!done && now() - start < timeout){
					Myna.sleep(10);
					done = this._futures.every(isDone);
				}
				result= this._futures.filter(isDone).map(get);	
			} else {
				var unit = java.util.concurrent.TimeUnit.MILLISECONDS;
				this._getThreadPool().shutdown();
				this._getThreadPool().awaitTermination(
					timeout,
					unit
				);
				result= this._futures.map(get);	
			}
				
		} else {
			result= this._futures.map(get);	
		}

		return result;
		
	};

/* Class: Myna.ThreadPool.Future
	wrapper for Java Future. Returned by <Myna.ThreadPool.run>

	Parameters:
		future	-	Java Future instance
	*/
	Myna.ThreadPool.Future = function (future) {
		this.future = future
	}

/* Function: cancel
	attempts to cancel this thread

	Parameters:
		terminate	-	*Optional, default false*
						Attempts to terminate this thread if already running. 
	
	Note:					
		Terminating threads will only work if the thread is listening to 
		interrupt signals, e.g. Thread.sleep(). You can check for this in 
		Myna code by checking java.lang.Thread.interrupted() during loops
	*/	
	Myna.ThreadPool.Future.prototype.cancel = function (terminate) {
		return this.future.cancel(terminate);
	};

/* Function: get
	waits for a result for this thread and returns the result

	Parameters:
		timeout			-	*Optional, default null (wait forever)*
							If a positive integer, this should be the number of 
							milliseconds to wait for a response from the thread. 
							see <Date.getInterval>. If no response within the 
							timeout, an exception is thrown

		
	Returns thread result or throws exception

	Note: 
		Even if you don't set _timeout_, the request timeout <$req.timeout> 
		still applies
	*/	
	Myna.ThreadPool.Future.prototype.get = function (timeout) {
		var t;
		if (timeout){
			t = this.future.get(
				timeout,
				java.util.concurrent.TimeUnit.MILLISECONDS
			)
		} else {
			t = this.future.get();
		}
		return t.threadScope.result;
	};

/* Function: isDone
	returns true if the thread has completed
	*/	
	Myna.ThreadPool.Future.prototype.isDone = function () {
		return this.future.isDone();
	};

/* Function: isCancelled
	returns true if the thread has been cancelled
	*/	
	Myna.ThreadPool.Future.prototype.isCancelled = function () {
		return this.future.isDone();
	};