/* Class: ObjectLib 
	Additional object related functions    
	
	 
*/
var ObjectLib = {}

/* Function: before
	Prepends supplied function to the event chain of an object.
	
	Parameters:
		obj				- object to apply to 
		functionName 	- name of the function on an object to modify
		functionObj		- function object to append
	
	
	
	Detail:
		Existing functions are preserved and executed after the supplied function.
		This is a shortcut for creating chain functions and is the equivalent of
		(code)
		obj[functionName] = obj[functionName].before(functionObj) 
		(end)
		See <Function.createChainFunction> for how chain functions work.
		
	Examples:
	(code)
		var obj={
			stuff:function (text){
				Myna.println("in orig")
				return text + " " + this.myVal; 	
			},
			myVal:"firstObj"
		}
		
		var obj2={
			myVal:"secondObj"
		}
		
		
		ObjectLib.before(obj,"stuff",function(text){
			var chain = arguments.callee.chain; 
			Myna.println("in before")
			chain.args[0] = "before " + text
			if (text == "dude!"){
				// exit now with this return value, nothing after will be executed
				chain.exit("sweet!")  
			}
			
		})
		
		ObjectLib.after(obj,"stuff",function(text){
			var chain = arguments.callee.chain; 
			Myna.println("in after")
			return chain.lastReturn + " after "
		})
		
		Myna.println(obj.stuff("woot!") +"<hr>");
		Myna.println(obj.stuff("dude!") +"<hr>");
		
		obj2.stuff = obj.stuff;
		Myna.println(obj2.stuff("woot!") +"<hr>");
		
	(end)
	*/
	ObjectLib.before=function( obj, functionName, functionObj){
		var $this = obj
		//does the function exist?
		if (functionName in $this) {
			//is the function a chain header?
			if (!("chainArray" in $this[functionName])){
				$this[functionName]=Function.createChainFunction([$this[functionName]]);
			}
		} else {
			$this[functionName]=Function.createChainFunction();	
		}
		if("chainArray" in functionObj){
			$this[functionName].chainArray=
				functionObj.chainArray.concat($this[functionName].chainArray)
		} else {
			$this[functionName].chainArray.unshift(functionObj)
		}
	}	
/* Function: after
	Appends supplied function to the event chain of an object.
	
	Parameters:
		obj				- object to apply to 
		functionName 	- name of the function on an object to modify
		functionObj		- function object to append
	
	
	
		Detail:
		Existing functions are preserved and executed after the supplied function.
		This is a shortcut for creating chain functions and is the equivalent of
		(code)
		obj[functionName] = obj[functionName].before(functionObj) 
		(end)
		See <Function.createChainFunction> for how chain functions work.
		
	Examples:
	*	see <before>
		
	(end)
	*/
	ObjectLib.after=function( obj, functionName, functionObj){
		var $this = obj
		
		//does the function exist?
		if (functionName in $this) {
			//is the function a chain header?
			if (!("chainArray" in $this[functionName])){
				$this[functionName]=Function.createChainFunction([$this[functionName]]);
			}
		} else {
			$this[functionName]=Function.createChainFunction();	
		}
		if("chainArray" in functionObj){
			$this[functionName].chainArray=
				$this[functionName].chainArray.concat(functionObj.chainArray)
		} else {
			$this[functionName].chainArray.push(functionObj)
		}
	}	
	
/* Function: appendFunction
	alias for <after>
	*/
	ObjectLib.appendFunction=ObjectLib.after;
/* Function: applyTo 
	Copies all properties (including Function properties and "hidden") of an object to another
	 
	Parameters: 
		obj					-	object to copy from
		target				-	object to copy to
		shouldOverwrite 	- 	*Optional, default false* Should existing properties in 
								_target_ be replaced by the properties in _source_?
 
	Returns: 
		_target_
		
	Detail:
		This can be used for copying the properties of an object to a local 
		scope by applying to 'this', or simulating inheritance (even multiple 
		inheritance) on instantiated objects by copying the properties of 
		another object
		
	Examples:
		(code)
			// Make Myna's functions such as abort() and dump() available 
			// without the Myna prefix
			ObjectLib.applyTo(Myna,this); 
									
		(end)
	*/
	ObjectLib.applyTo=function(obj,target,shouldOverwrite){
		
		if (shouldOverwrite == undefined) shouldOverwrite=false;
		for (var x in obj) {
			if (shouldOverwrite || target[x] === undefined){
				try {//sometimes this fails, for instance if "key" is readonly
					target[x] = obj[x];
				} catch(e){}
			}
		}
		return target;
	}

/* Function: getKeys 
	returns an alphabetized list of non-function properties in an object
	
	Parameters: 
		obj 	-	 object to examine
	
	Returns: 
		An alphabetized array of properties in an object
		
	*/
	ObjectLib.getKeys = function(obj){
		var result=[];
		var isXml = typeof obj ==="xml";
      
		try {
		for (var x in obj){
         if (isXml && x != parseFloat(x)) continue;
			if (typeof x === "string"){
				try{ //ie doesn't like you looking at certain things (like in window)
					if (obj[x] instanceof Function || typeof obj[x] == "function") continue;
				} catch (e) {continue} 
				result.push(x);
			}
		}
		} catch (e) {return []}
		return result.sort(function(left,right) {
			try { //ie also freaks out over the sort for some reason
				left=left.toLowerCase();
				right=right.toLowerCase();
				if (left > right) return 1;
				if (left < right) return -1;
				return 0;
			} catch(e){return 0}
		});
	}
/* Function: getProperties
	returns an alphabetized list of all properties in an object
	
	Parameters: 
		obj 	-	 object to examine
	
	Returns: 
		An alphabetized array of properties in an object
		
	*/
	ObjectLib.getProperties = function(obj){
		var result=[];
		try {
		for (var x in obj){
			if (typeof x === "string"){
				result.push(x);
			}
		}
		} catch (e) {return []}
		return result.sort(function(left,right) {
			try { //ie also freaks out over the sort for some reason
				left=left.toLowerCase();
				right=right.toLowerCase();
				if (left > right) return 1;
				if (left < right) return -1;
				return 0;
			} catch(e){return 0}
		});
	}
/* Function: hideProperty
	*Server-Only* set the "DONTENUM" attribute of the supplied property
	
	Parameters: 
		obj 	      -  object to examine
      property    -  propery to modify
	
	Detail:
      Set the the "DONTENUM" attribute on the defined property. This means that 
      this property will not appear in <getProperties> or <Myna.Dump> or 
      <forEach> or any other function that loops over enumerable properties. Use 
      this to "hide" functions and properties that you do not want to be 
      considered "data" 
		
	*/
	ObjectLib.hideProperty = function(obj, property){
		Object.defineProperty(obj,property,{
			enumerable:false
		})
      /* java.lang.Class.forName("org.mozilla.javascript.ScriptableObject")
         .getMethod("setAttributes", java.lang.String, java.lang.Integer.TYPE)
         .invoke(obj, property, new java.lang.Integer(
            org.mozilla.javascript.ScriptableObject.DONTENUM)
          ); */
	}   
/* Function: checkRequired 
	Ensures that certain properties defined.
	 
	Parameters: 
		obj			-	object to examine
		required 	- 	Array of property name strings to look for
 
	Returns: 
	 	void
		
	Detail: 
		This function is intended for Javascript Objects being used as data containers. 
		Particularly JS objects passed as function parameters. 
		
		This function simply checks to see if every string in the _required_ array has
		a corresponding property in an object. The first time a property is not found, an
		exception is raised.
	 
	*/
	ObjectLib.checkRequired=function (obj,required){
		required.forEach(function(key){
			if (obj[key] === undefined) {
				var msg = "Required property '" + key +"' undefined";
					msg+= " in " + ObjectLib.toJson(obj);
				throw new Error (msg);
			}
		});
	}
	
/* Function: toJson 
	Converts the supplied object to JSON (http://www.json.org) 
	 
	Parameters: 
		obj	-	 object to convert 
 
	Returns: 
		JSON string that represents _obj_
		
	Detail:
		Adapted from http://www.json.org/json.js
		
		Attempts to convert _obj_ to JSON. This is best used on simple Objects and Arrays.
		
	Example:
	(code)
		//this code might be called by an AJAX callback
		var qry=new Query({
			dataSource:":mem:",
			sql:"select * from event"
		});
		$res.print(qry.data.toJson());
	(end)
	*/
	ObjectLib.toJson=function(obj) {
		// m is a table of character substitutions.
		var m = {
			'\b': '\\b',
			'\t': '\\t',
			'\n': '\\n',
			'\f': '\\f',
			'\r': '\\r',
			'"' : '\\"',
			'\\': '\\\\'
		};
		
		var a,i,l,v,k; //common variables in this function
			
		// typeOf is a typeof replacement that knows about Arrays and null objects
		switch (ObjectLib.typeOf(obj)){
			case "array":
				return '[' + obj.map(function(value){
					return ObjectLib.toJson(value)
				}).join(',') + ']';
			break;
		
			case "boolean":
				return String(obj);
			break;
			
			case "date":
				return '"\\/Date(' +obj.getTime() +')\\/"';
			break;
		
			case "number":
				// JSON numbers must be finite. Encode non-finite numbers as null.
				return isFinite(obj) ? String(obj) : 'null';
			break;
		
			case "object":
				/* Iterate through all of the keys in the object, ignoring the 
					 all functions. */
				return '{' +
					
					ObjectLib.getKeys(obj)
					
					/* .filter(function(k){
						return (typeof obj.hasOwnProperty =="function" && obj.hasOwnProperty(k))
					}) */
					.map(function (k) {
						//abort("got here",obj[k])
						return	'"' + k + '"' + ':' + ObjectLib.toJson(obj[k]);
					})
					.join(',')
					
				+ '}';
			break;
			
			case "null":
			return "null";
			break;
			
			case "string":
			if (/[\"\\\x00-\x1f]/.test(obj)) {
				return '"' +  String(obj).replace(/([\x00-\x1f\\\"])/g, function (a, b) {
				
				var c = m[b];
				if (c) {
					return c;
				}
				c = b.charCodeAt();
				return '\\u00' +
					Math.floor(c / 16).toString(16) +
					(c % 16).toString(16);
				}) + '"';
			}
			return '"' + obj + '"';
			break;
			
			case "function":
				if (obj === undefined){
					return 'null'	
				} else {
					return '"[object Function]"';		
				}
			
			break;
			
			case "class":
			//if (obj.toSource) return obj.toSource();
			return ObjectLib.toJson(String(obj)) ;
			break;
			
			default:
			return '"[unknown]"';
		}
		
	}	
/* Function: typeOf 
	an enhanced replacement of the the Javscript builtin typeof function. 
	 
	Parameters: 
		object 	-	object to inspect
 
	Returns: 
		a string representing the type of the object
		
	Detail: 
		The builtin JavaScript typeof function does not identify some stamndard objects, 
		specifically Arrays, Dates, and Nulls. When running in ObjectLib, it is also important to 
		know when the object is a Java object. This function returns the standard typeof 
		strings as well as the following:
		
		* null
		* array
		* class
		* date
	 
	*/
	ObjectLib.typeOf=function(object) {
		var s = typeof object;
		if (s === 'object') {
			if (object) {
				if (typeof object["length"] === 'number' &&
						/* !(object.propertyIsEnumerable('length')) && */
						typeof object.splice === 'function') {
					return 'array';
				} else if (object instanceof Date){
					return 'date';
				} else if (typeof object["getClass"] =="function" && String(object) != "[object Object]") {
					return 'class';
				}
			} else {
				return 'null';
			}
		}
		
		return s;
	}
/* Function: setDefaultProperties
	sets default properties on an object 
	 
	Parameters: 
		obj				- 	object to apply to
		defaults		- 	Object that represents the default properties
		looseMatch	-	If true, consider "null" values and 0 length strings to be 
							the same as undefined. By default, only strictly undefined 
							properties are overwritten by their _defaults_. 
		
 
	Returns: 
		_obj_
		
	Detail: 
		Every property in _defaults_ is checked against this. If the 
		property is undefined in this, it is copied from _defaults_.
		
	Example:
		(code)
		$res.data.setDefaultProperties({
			name:"bob",
			isDeceased:false
		});
		
		(end)
	 
	*/
	ObjectLib.setDefaultProperties=function (obj,defaults,looseMatch){
		for (var key in defaults) {
			if (obj[key] === undefined
				|| looseMatch && (
					obj[key] === null
					|| obj[key] === ""
				)
			) {
				try {//sometimes this fails, for instance if "key" is readonly
					obj[key] = defaults[key];
				} catch(e){}
			}
		}	
		return obj
	}
	
/* Function: forEach
	loops over each non-function property of an object an executes the 
	supplied function against it.   
	 
	Parameters: 
		obj			-	Object to loop over	
		func 		-	Function to execute. See below for the parameters it will 
						be passed
 
	Callback Parameters:
		element		-	the value of property
		name		-	the name of the property
		object		-	a reference to an object
		
	
		
	Detail: 
		This function is modeled after the JS function <Array.forEach>. 
		
	Example:
		(code)
		{
			id:12,
			name:"Bob"
			occupation:"being awsome",
			isDeceased:false
		}.forEach(function(element,name,object){
			ObjectLib.print(name + ": " + element +"<br>");
		})
		(end)
	 
	*/
	ObjectLib.forEach=function (obj,func){
		ObjectLib.getKeys(obj).forEach(function (key){
			func(obj[key],key,obj);	
		})
	}