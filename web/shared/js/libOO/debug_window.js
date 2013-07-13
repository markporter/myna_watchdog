/* File: debug_window.js */

/* Function: debug_window
	Creates a new browser window and displays an interactive view of the 
	supplied object
	
	Parameters:
		data	-	String or object to display
		title	-	title of the window
		
		
	Detail:
		if a window exists with _title_ it is reused, otherwise a new window is 
		created. _data_ will be displayed at the top of the window with a hard
		rule <hr> underneath. The window gets a reference to the object to the
		displayed state of the object is its current state, and may not 
		represent the state at the time of the call to debug_window 
*/
function debug_window(data,title){
	if (!data) alert("'data' parameter is required.\n\nStack:\n" + get_stack());
	if (!title) title="debug"
	
	var win;
	var class_vars = arguments.callee;
	if (!arguments.callee.windows) arguments.callee.windows = new Object(); 
	var windows = arguments.callee.windows;
	
	if (windows[title] && !windows[title].closed){
		win = windows[title];
		win.focus();
	} else {
		win = windows[title] = window.open("",title,"width=800,height=600,scrollbars=1,resizable=1");
		win.document.write('<html><body><style>td{background-color:#CCCCFF;font-family:sans-serif;font-size:8pt;overflow:auto;}td.key{background-color:#6666FF;font-weight:bold;width:10%;padding-left:10px;padding-right:10px;cursor:pointer;}.object{background-color:#6666FF;border: 1px solid black;margin:5px;padding:2px;cursor:pointer;}</style><script>var objects = new Array();/* dump_object */function dump_object(o,parent_element){if (typeof o == "object" || typeof o == "array"){objects.push(o);var index = objects.length -1;var tbl = document.createElement("table");tbl.style.width="100%";parent_element.appendChild(tbl);parent_element.appendChild(document.createElement("hr"));var keys = new Array();for (var x in o) {	if (typeof o[x] != "function")	keys.push(x);}if (typeof o == "array"){keys.sort(function (a,b){a-b});} else {keys.sort();}for (x= 0; x < keys.length; ++x){var row =tbl.insertRow(tbl.rows.length);var cell = row.insertCell(row.cells.length);cell.innerHTML = keys[x];cell.className = "key";cell.onclick=function(){if (this.nextSibling.style.display=="none"){this.nextSibling.style.display="block"} else {this.nextSibling.style.display="none";}};var cell = row.insertCell(row.cells.length);try{var type = typeof o[keys[x]];} catch (e){continue;}if (type == "object"){cell.appendChild(document.createElement("div"));cell.firstChild.innerHTML=(o instanceof Array?"ARRAY":"OBJECT") + " (click to expand)";cell.firstChild.className="object";cell.firstChild.style.display = "block";cell.firstChild.setAttribute("index",index);cell.firstChild.setAttribute("key",keys[x]);cell.firstChild.onclick=function(){this.style.display="none";dump_object(objects[this.getAttribute("index")][this.getAttribute("key")], this.parentNode);}} else{cell.appendChild(document.createElement("pre"));cell.firstChild.innerHTML = o[keys[x]];}}} else {var text = document.createElement("pre");text.innerHTML = o.toString();parent_element.appendChild(text);parent_element.appendChild(document.createElement("hr"));}}</script><div id="content" style="width:100%;"></div></body></html>');
	}
	
	var timer = window.setInterval(function(){
		if (win.dump_object){
			win.dump_object(data,win.document.getElementById("content"));
			win.document.title = title;
			window.clearInterval(timer);
		}
	},500)
	
}