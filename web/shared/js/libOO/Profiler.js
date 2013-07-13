/*global ObjectLib:false*/
/* 
	Class: Myna.Profiler
		Stores execution times between begin() and end() functions
	
	Detail:
		The Profiler class is for tracking execution time. More than one 
		Myna.Profiler can be active at a time, but generally it is most convenient 
		to use the global <$profiler> instance. 
		
	Example:
		(code)
			<%
				$profiler.mark("Starting interesting section");
				var num_loops=100,i=0;
				
				$profiler.begin("Create " + num_loops +" encrypted passwords.");
				for (; i < num_loops;++i){
					$profiler.begin("Create encrypted password");
					$lib.string.encryptPassword("NunyaBidness");
					$profiler.end("Create encrypted password");
				}
				$profiler.end("Create " + num_loops +" encrypted passwords.");
				$profiler.mark("All Done!");
				$profiler.calcAverages();
			%>
			<%=$profiler.getSummaryHtml()%>
		(end)
			
		Displays HTML somewhat like this...
		
		(code)
		Label													Elapsed Millis	Elapsed Total Millis
		$application import										10				758
		Include file:/data/tomcat/webapps/myna/application.sjs	0				751
		Runtime scripts included												760
		Starting interesting section											763
		Create 100 encrypted passwords.							237				1004
		Create encrypted password (Avg of 100 entries)			2	 
		All Done!																1004
		(end)
		
*/
if (!Myna) var Myna={};

/* Constructor: Profiler
	Constructor function for Profiler class
	
	Parameters:
		start		-	*Optional, default new Date().getTime()* 
						Milliseconds since epoch to use as starting point.
		
	Returns:
		Reference to Profiler instance
*/
Myna.Profiler=function (start){
	this.times = [];
	this.labels = {};
	this.start = start || new Date().getTime();	
};

Myna.Profiler.prototype.start=0;
 
/* Function: calcAverages (deprecated)
	(deprecated) see detail 
	
	This function has been replaced by:
	* <getAveragesArray>
	* <getAveragesHtml>
	* <getAveragesText>
		
	*/
	Myna.Profiler.prototype.calcAverages = function(){
		this.times = this.times.filter(function(element,index,array){
			//first we need someplace to store our times. 
			//A function property is a convenient place
			var my = arguments.callee;
			if (!my["times"]) my.times = {}; 
			var curLabel = element.label;
			
			//if we've averaged this element already, then lets skip this repeat
			if (my.times[curLabel]) return false;
			
			my.times[curLabel]=[];
			var curTimes = my.times[curLabel]; 
				
			array.slice(index).forEach(function(element){
				if (curLabel == element.label
					&& parseInt(element.end,10) == element.end
					&& parseInt(element.start,10) == element.start
				){
					curTimes.push(element.end - element.begin);
				}
			});
			
			if (curTimes.length > 1){
				element.sum=0;
				element.numEntries = curTimes.length;
				curTimes = curTimes.filter(function(time){
					return parseInt(time ,10) == time;
				});
				curTimes.forEach(function(time){element.sum+=parseInt(time,10);});
				
				element.average = Math.round(parseInt(element.sum,10)/curTimes.length);
				element.isAverage=true;
			}
			
			return true;
		});
	};

/* Function: begin
	Sets begin point for a given label. 
	
	Parameters:
		label		-	string label for this event
		time		-	*Optional, default new Date().getTime()*
						Time to record for this entry
	
	Returns:
		A function that can be used to set the end time. This functions can 
		be called with no parameters to set the end time to "now" or you can 
		pass a millisecond timestamp to set a specific end time. This can be 
		useful for asynchronous operations to make sure that correct entry 
		is updated
		
	Detail:
		If an entry with this label was already pending, it is closed 
		and a new entry is started.
		
	Example:
	(code)
		$profiler.begin("Doin' Stuff")
		doStuff();
		$profiler.end("Doin' Stuff")
		
		var endFunction =$profiler.begin("Doin' Stuff Asynchronously")
		var doStuffWithCallback(args,callback) {
			callAsyncFunction()
		}
		var doStuffWithCallback(args,function(result){
			// use encosed end function to set end time on the correct begin()
			endFunction()
			... handle result ...
		})
		
	(end)
	
	See:
	* <end>
	*/
	Myna.Profiler.prototype.begin = function(label,time){
		var key=label.replace(/[\W]*/,""),
			entry={
				label:label,
				begin:time || new Date().getTime(),
				depth:this.times.filter(function(e){ return !e.end;}).length
			};
		this.times.push(entry);
		if (this.labels[key] && !this.labels[key].end){
			this.end(key,entry.begin);	
		}
		this.labels[key] = entry;
		return function(time){
			entry.end=time||new Date().getTime();
		};
	};


/* Function: end
	Sets end point for a given label. 
	
	Parameters:
		label		-	string label for this event
		time		-	*Optional, default new Date().getTime()*
						Time to record for this entry
	
	Detail:
		If no entry is pending for this label, one is created with the same time, 
		and the entries *isMark* property is set to true; 
	*/
	Myna.Profiler.prototype.end = function(label,time){
		var now=time||new Date().getTime(),
			key=label.replace(/[\W]*/,"");
		if (!this.labels[key]){
			this.begin(label,now);
			this.labels[key].isMark=true;
		}
		this.labels[key].end=now;
	};
/* Function: mark
	Sets a bookmark entry. 
	
	Parameters:
		label		-	string label for this event
		time		-	*Optional, default new Date().getTime()*
						Time to record for this entry
	
	Detail:
		This is the same behavior as <end> when there is no <begin>. 
		An entry is created with both begin and end set to _time_ and 
		the entry's *isMark* property is set.  
	*/
	Myna.Profiler.prototype.mark=function(label){
		
		label =String(label);
		this.end(label);
		///var now=time||new Date().getTime(),
		//	key=label.replace(/[\W]*/,"");
		//this.end(label)
		// this.begin(label,now);
		//this.labels[key].isMark=true;
		//this.labels[key].end=now; */
	};
/* Function: getAveragesArray
	returns an array of tasks with average execution time in milliseconds
	
	Note: 
	This will only return entries with a "begin" and "end".
	
	See:
	* <getAveragesHtml>
	*/
	Myna.Profiler.prototype.getAveragesArray = function(){
		var tasks ={};
		
		this.times.filter(function(t){
			return !t.isMark;
		}).forEach(function(t){
			if (!(t.label in tasks)){
				tasks[t.label] = [];
			}
			tasks[t.label].push(t.end - t.begin);
		});
		
		return ObjectLib.getKeys(tasks).sort().map(function(label){
			return {
				label:label,
				averageMs:tasks[label].avg(),
				totalMs:tasks[label].sum(),
				numEntries:tasks[label].length
			};
		});
	};
/* Function: getAveragesHtml
	returns <getTaskAverages> in an HTML table. 
	*/
	Myna.Profiler.prototype.getAveragesHtml = function(){
		var msg=[
			'<style>',
				'.profiler_table {',
					'border:1px solid black;	',
				'}',
				'.profiler_table th, .profiler_table td{',
					'font-family:sans-serif;',
					'font-size:9pt;',
				'}',
				'.profiler_table th{',
					'font-weight:bold;',
				'}',
				'.profiler_table td{',
					'border:1px solid black;',
				'}',
				'.profiler_table .alt_row td{',
					'background-color:#DEDEDE',
				'}',
			'</style>',
			'<table class=profiler_table>',
			'<tr>',
			'<th>Label</th><th>Num Entries</th><th>Average Ms</th><th>Total Ms</th>',
			'</tr>'
		];
		this.getAveragesArray().forEach(function(t,index){
			var alt_row = (index%2===0) ? "alt_row":"";
			msg.push("<tr class='" +alt_row + "'>");
			msg.push("<td>" + String(t.label) +"</td>");
			msg.push("<td>" + String(t.numEntries) +"</td>");
			msg.push("<td>" + String(t.averageMs) +"</td>");
			msg.push("<td>" + String(t.totalMs) +"</td>");
			msg.push("</tr>");
		});
		
		msg.push("</table>") ;
			
		return msg.join("\n");
	};
/* Function: getAveragesText
	returns a text table of average times. 
		
	*/
	Myna.Profiler.prototype.getAveragesText = function(){
		var delim = " | ";
		var msg=[
			"Label".toFixedWidth(50) + delim + "Num Entires".toFixedWidth(15)+ delim + "Average Ms".toFixedWidth(15)+ delim + "Average Ms".toFixedWidth(15), 
			"-".repeat(50) + delim + "-".repeat(15)+ delim + "-".repeat(15)+ delim + "-".repeat(15)
		];
		this.getAveragesArray().forEach(function(t){
			msg.push(String(t.label).replace(/\s+/g," ").toFixedWidth(50," ","...","middle") 
				+ delim + String(t.numEntries).toFixedWidth(15)
				+ delim + String(t.averageMs).toFixedWidth(15)
				+ delim + String(t.totalMs).toFixedWidth(15)
			); 
		});		
			
		return msg.join("\n");
	};
/* Function: getSummaryArray
	returns an array of all the entries. 
		
	Detail:
		Each entry is an object with *begin* and *end* proerties, 
		and optionally *isMark* or *isAverage* properties.
	*/
	Myna.Profiler.prototype.getSummaryArray = function(){
		return this.times;
	};
/* Function: getSummaryHtml
	returns an HTML summary of all the entries. 
		
	*/
	Myna.Profiler.prototype.getSummaryHtml = function(){
		var msg=[
			'<style>',
				'.profiler_table {',
					'border:1px solid black;	',
				'}',
				'.profiler_table th, .profiler_table td{',
					'font-family:sans-serif;',
					'font-size:9pt;',
				'}',
				'.profiler_table th{',
					'font-weight:bold;',
				'}',
				'.profiler_table td{',
					'border:1px solid black;',
				'}',
				'.profiler_table .alt_row td{',
					'background-color:#DEDEDE',
				'}',
			'</style>',
			'<table class=\'profiler_table\'>',
				'<tr>',
					'<th>Label</th>',
					'<th>Task Ms</th>',
					'<th>Started Ms</th>',
					'<th>Ended Ms</th>',
				'</tr>',
		''];
		
		var entry,elapsed,label;
		for (var x=0; x < this.times.length; ++x){
			entry = this.times[x];
			if (!entry.end) continue;
			elapsed=entry.end - entry.begin;
			var started=entry.begin - this.start;
			var ended=entry.end - this.start;
			label=entry.label;
			
			if (entry.isMark) {
				elapsed="&nbsp;";
				label = "MARK: " + label;
				entry.end = entry.start;
			} else {
				label = "TASK: " + label;
			}
			
			var depth = "";
			if (entry.depth){
				depth = "&nbsp;".repeat(entry.depth*4);
				//depth+=" |-";
			}
			
			
			var alt_row = (x%2===0) ? "alt_row":"";
			msg.push("<tr class='" +alt_row + "'>") ;
			msg.push("<td>" + depth+ String(label) +"</td>");
			msg.push("<td>" + String(elapsed) +"</td>");
			msg.push("<td>" + String(started) +"</td>");
			msg.push("<td>" + String(ended) +"</td>");
			msg.push("</tr>") ;
		}
		msg.push("</table>") ;
			
		return msg.join("\n");
	};


/* Function: getSummaryText
	returns a text summary of all the entries. 
		
	*/
	Myna.Profiler.prototype.getSummaryText = function(){
		var delim = " | ";
		var msg="";
			msg += "Label".toFixedWidth(50) + delim + "Elapsed Millis".toFixedWidth(15) + delim + "Elapsed Total".toFixedWidth(15) + "\n"; 
			msg += "-".repeat(50) + delim + "-".repeat(15) + delim + "-".repeat(15) + "\n";
				
		var total=0,entry,elapsed,label;
		for (var x=0; x < this.times.length; ++x){
			entry = this.times[x];
			if (!entry.end) continue;
			elapsed=entry.end - entry.begin;
			total=entry.begin - this.start;
			label=entry.label;
			
			if (entry.isMark) {
				elapsed="";
			}
			
			if (entry.isAverage){
				elapsed=entry.average +" / " + entry.sum;
				total="";
				label +=" (Avg/Sum  of " + entry.numEntries +" entries)";
			}
			
			msg += String(label).replace(/\s+/g," ").toFixedWidth(50," ","...","middle") + delim; 
			msg += String(elapsed).toFixedWidth(15) + delim; 
			msg += String(total).toFixedWidth(15) + "\n";
			
		}
			
		return msg;
	};
/* Function: profile
	attaches profiling hooks to an object 
	
	Parameters:
		obj		-	object to profile
		name	-	String. Name of this object to use in profile logs
		logArgs	-	*Optional, default false*
					If true, log arguments to function in the profiler
					
	Detail:
		This attaches "begin" and "end" profiling to every function in _obj_, 
		and getters
	*/
	Myna.Profiler.prototype.profile = function(obj,name,logArgs){
		var $this = this;
		var p;
		
		
		function applyProfiler(target,prop,propName){
			if (typeof target[prop] == "function"){
				if (target[prop].prototype.getProperties().length) return false;
					
				//Myna.println(prop)
				ObjectLib.before(target,prop,function(){
					var chain = arguments.callee.chain;
					var msg = name +"::" + propName +"(";
					if (logArgs) {
						try{
						msg+=JSON.stringify(chain.args,null,"   ");
						} catch(e){}
					}
					msg+=")";
					chain._profileEnd = $this.begin(msg);
					return chain.lastReturn;
				});
				ObjectLib.after(target,prop,function(){
					var chain = arguments.callee.chain;
					chain._profileEnd();
					return chain.lastReturn;
				});	
				return true;
			}
			return false;
		}
		
		for (p in obj){
				var d = Object.getOwnPropertyDescriptor( obj, p );  
				if (d && d.configurable){
					var changed =false;
					if (d.get) {
						changed =changed||applyProfiler(d,"get",p);
					}
					if (d.set) {
						changed =changed||applyProfiler(d,"set",p);
					}
					if (d.value) {
						changed =changed||applyProfiler(d,"value",p);
					}
					
					if (changed) Object.defineProperty(obj,p,d);
				} else {
					applyProfiler(obj,p,p);
				}
				
			}

	};