/* 	Global: $profiler
	Global instance of <Myna.Profiler>.
	
	This is used in serveral places to record performance metrics, e.g. 
	page includes, queries, and WebService calls. You can also use this to time 
	your own events.
	
	
*/
	
	var $profiler = new Myna.Profiler($server_gateway.started.getTime());