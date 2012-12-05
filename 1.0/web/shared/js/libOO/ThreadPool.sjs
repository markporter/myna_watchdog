/*global Myna:true java:false $application:true $server_gateway:false Packages:false $req:true*/
/*	Class: Myna.ThreadPool
	Creates a manager for executing a function in 1 or more threads
*/
Myna.ThreadPool = function (fn,options) {

	if (arguments.length) {
		var $this = this;
		this.fn = fn;
		this.futures=[];

		if (!options) options={};

		this.poolSize=options.poolSize||1;
		this.isBackgroundPool =!!options.background;

		if (!this.isBackgroundPool) {
			$application.addOpenObject({
				close:function () {
					$this.getThreadPool().shutdown();
				}
			});
		}
	}
};


Myna.ThreadPool.prototype.getThreadPool = function(){
	var Executors = java.util.concurrent.Executors;	
	if (this.isBackgroundPool) return $server_gateway.backgroundThreadPool;
	if (!this.threadPool){
		this.futures=[];
		this.threadPool = Executors.newFixedThreadPool(this.poolSize);
	}
	return this.threadPool;
};

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
		this.fn.toSource()
	);
	var mt = $server_gateway.buildBackgroundThread(func,Array.parse(arguments));
	mt.isWaiting=true;
	Packages.info.emptybrain.myna.MynaThread.runningThreads.add(mt);
	mt.environment.put("parentScope",this.fn.__parent__);
	var future =this.getThreadPool().submit(Executors.callable(mt,mt));
	this.futures.push(future);
	return future;
};

Myna.ThreadPool.prototype.join = function (seconds) {
	var SecondsInterval = java.util.concurrent.TimeUnit.SECONDS;
	if (!this.isBackgroundPool) {
		this.getThreadPool().shutdown();
		if (seconds){
			this.getThreadPool().awaitTermination(
				seconds||$req.timeout,
				SecondsInterval
			);
		}
	}
	return this.getResults();
};

Myna.ThreadPool.prototype.getResults = function () {
	return this.futures.map(function (f) {
		return f.get().threadScope.result;
	});
};
