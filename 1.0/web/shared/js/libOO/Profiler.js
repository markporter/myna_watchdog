
/* 
	Class: Myna.Profiler
		Stores executiion times between begin() and end() functions
	
	Detail:
		The Profiler class is for tracking execution time. More than one 
		Profiler can be active at a time, but generally it is most convenient 
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
		Runtime scripts included	 											760
		Starting interesting section	 										763
		Create 100 encrypted passwords.							237				1004
		Create encrypted password (Avg of 100 entries)			2	 
		All Done!	 															1004
		(end)
		
*/
if (!Myna) var Myna={}

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
}

Myna.Profiler.prototype.start=0;

/* Function: begin
	Sets begin point for a given label. 
	
	Parameters:
		label		-	string label for this event
		time		- 	*Optional, default new Date().getTime()*
						Time to record for this entry
	
	Detail:
		If an entry with this label was already pending, it is closed 
		and a new entry is started. 
*/
Myna.Profiler.prototype.begin = function(label,time){
	var key=label.replace(/[\W]*/,""),
		entry={
			label:label,
			begin:time || new Date().getTime()
		}
	this.times.push(entry);
	if (this.labels[key] && !this.labels[key].end){
		this.end(key,entry.begin);	
	}
	this.labels[key] = entry;
}

/* Function: calcAverages
	Calculates average time for duplicates. 
	
	Detail:
		Replaces duplicate entries (by label) with a single summary entry
		with the *isAverage* property set. Also appends " (Avg of X entries)" 
		to the label where X is the number of duplicate entries.
		
*/
Myna.Profiler.prototype.calcAverages = function(){
	this.times = this.times.filter(function(element,index,array){
		//first we need someplace to store our times. 
		//A function property is a convenient place
		var my = arguments.callee;
		if (!my["times"]) my.times = {} 
		var curLabel = element.label;
		
		//if we've averaged this element already, then lets skip this repeat
		if (my.times[curLabel]) return false;
		
		my.times[curLabel]=[];
		var curTimes = my.times[curLabel]; 
			
		array.slice(index).forEach(function(element,index,array){
			if (curLabel == element.label
				&& parseInt(element.end) == element.end
				&& parseInt(element.start) == element.start
			){
				curTimes.push(element.end - element.begin);
			}
		});
		
		if (curTimes.length > 1){
			element.sum=0;
			element.numEntries = curTimes.length;
			curTimes = curTimes.filter(function(time){
				return parseInt(time ) == time;
			})
			curTimes.forEach(function(time){element.sum+=parseInt(time)})
			
			element.average = Math.round(parseInt(element.sum)/curTimes.length);
			element.isAverage=true;
		}
		
		return true;
	})
}

/* Function: end
	Sets end point for a given label. 
	
	Parameters:
		label		-	string label for this event
		time		- 	*Optional, default new Date().getTime()*
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
}
/* Function: mark
	Sets a bookmark entry. 
	
	Parameters:
		label		-	string label for this event
		time		- 	*Optional, default new Date().getTime()*
						Time to record for this entry
	
	Detail:
		This is the same behavior as <end> when there is no <begin>. 
		An entry is created with both begin and end set to _time_ and 
		the entry's *isMark* property is set.  
*/
Myna.Profiler.prototype.mark=function(label,time){
	label =String(label);
	var now=time||new Date().getTime(),
		key=label.replace(/[\W]*/,"");
	this.begin(label,now);
	this.labels[key].isMark=true;
	this.labels[key].end=now;
}

/* Function: getSummaryArray
	returns an array of all the entries. 
		
	Detail:
		Each entry is an object with *begin* and *end* proerties, 
		and optionaly *isMark* or *isAverage* properties.
*/
Myna.Profiler.prototype.getSummaryArray = function(){
	return this.times;
}

Myna.Profiler.prototype.getSummaryHtml = function(){
	var msg="";
		msg += "<style>";
		msg += ".profiler_table {";
			msg += "border:1px solid black;	";
		msg += "}";
		msg += ".profiler_table th{";
			msg += "font-weight:bold;	";
		msg += "}";
		msg += ".profiler_table td{";
			msg += "border:1px solid black;";
		msg += "}";
		msg += ".profiler_table .alt_row td{";
			msg += "background-color:silver";
		msg += "}";
		msg += "</style>";
		msg +="<table class='profiler_table'>";
		msg += "<tr>" ;
		msg += "<th>Label</th><th>Elapsed Millis</th><th>Elapsed Total Millis</th>";
		msg += "</tr>" ;
	
	var total=0,entry,elapsed,label;
	for (var x=0; x < this.times.length; ++x){
		entry = this.times[x];
		if (!entry.end) continue;
		elapsed=entry.end - entry.begin;
		total=entry.end - this.start;
		label=entry.label
		
		if (entry.isMark) {
			elapsed="&nbsp;";
		}
		
		if (entry.isAverage){
			elapsed=entry.average +" / " + entry.sum;
			total="&nbsp;";
			label +=" (Avg/Sum  of " + entry.numEntries +" entries)"
		}
		
		var alt_row = (x%2==0) ? "alt_row":"";
		msg += "<tr class='" +alt_row + "'>" ;
		msg += "<td>" + String(label) +"</td>";
		msg += "<td>" + String(elapsed) +"</td>";
		msg += "<td>" + String(total) +"</td>";
		msg += "</tr>" ;
	}
	msg += "</table>" ;
		
	return msg;
}

