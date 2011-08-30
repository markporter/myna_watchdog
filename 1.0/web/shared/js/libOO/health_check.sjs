var memFree = $server.memAvailable/$server.memMax;
//var runningThreads = $server_gateway.runningThreads.toArray().length;
Myna.print([
	(memFree*100).toFixed(2),
	//runningThreads
])
