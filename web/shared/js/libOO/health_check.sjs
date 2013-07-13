java.lang.System.gc();
var memFree = $server.memAvailable/$server.memMax;
//var runningThreads = $server_gateway.runningThreads.toArray().length;
if (memFree < 0.15) {
	java.lang.System.gc();
	memFree = $server.memAvailable/$server.memMax;
}
Myna.print([
	(memFree*100).toFixed(2),
	//runningThreads
	
])
