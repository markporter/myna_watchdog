/* Class: Object 
	Additional functions on the JS Object object
	
	Each function here comes from <ObjectLib.js>, so including this file is only 
	necessary to apply these functions to the Object prototype      
	
	 
*/

/* (function(){
   var oldObject = Object;
   
   Object = function(){
      oldObject.apply(this, Array.slice.call(arguments, 0))
      var hiddenProperties =[
         "after",
         "appendFunction",
         "applyTo",
         "before",
         "checkRequired",
         "getKeys",
         "getProperties",
         "hideProperty",
         "setDefaultProperties",
         "toJson"
      ]
      for (var x=0; x < hiddenProperties.length; ++x){
         ObjectLib.hideProperty(this,hiddenProperties[x])
      }
   }
   Object.prototype = new oldObject();
})() */
/* Function: before
	Prepends supplied function to the event chain of this object.
	
	Parameters:
		functionName 	- name of the function on an object to modify
		functionObj		- function object to append
	
	Detail:
		Existing functions are preserved and executed after the supplied function. 
		
		The resulting chain will return:
		
		* The _returnValue_ property of 
		  arguments.callee.chain.returnValue, if defined
		* Or undefined if _functionObj_ returns false  
		* Or the result of the original function
		
		_functionObj_ will have properties added to it that can be accessed via 
		arguments.callee.chain from inside the function
		
	arguments.callee.chain:
		returnValue			-	*default undefined*
								If this is defined after _functionObj_ 
								completes, then this value will be returned 
								instead of executing the original function. 
								
		originalFunction	-	This is a reference to the original function, 
								bound to this object. This is useful in 
								conjunction with _returnValue_ to call the 
								original function with altered parameters and 
								return the result
	
	Examples:
	(code)
		// example of setting calculated values during object creation
		dm = new Myna.DataManager("hr")
		dm.managerTemplate.before("create",function(obj){
			var chain = arguments.callee.chain;
			if (this.table.tableName == "employee"){
				if (!obj.salary){
					obj.salary = calcBaseSalary(obj)
				}
				chain.returnValue=chain.originalFunction(obj);
			}
		})
	(end)
	*/
	Object.prototype.before=function( functionName, functionObj){
		ObjectLib.before(this,functionName, functionObj);
	}
	
/* Function: after
	Appends supplied function to the event chain of this object.
	
	Parameters:
		functionName 	- name of the function on an object to modify
		functionObj		- function object to append
	
	Detail:
		Existing functions are preserved and executed in the order they were 
		declared. If the function _functionName_ does not exist, it will be 
		created.
		
		The resulting chain will return the result of the original function, 
		unless overridden in arguments.callee.chain.returnValue
		
		_functionObj_ will have properties added to it that can be accessed via 
		arguments.callee.chain from inside the function.
		
	arguments.callee.chain:
		returnValue			-	*default return value from original function*
								This is the value that will be returned. This 
								can be overwritten by _functionObj_ 
								
		originalFunction	-	This is a reference to the original function, 
								bound to this object. 
	
	Examples:
	(code)
		// example of adding extra functions to bean objects
		dm = new Myna.DataManager("hr")
		dm.managerTemplate.after("getById",function(id){
			var chain = arguments.callee.chain;
			if (this.table.tableName == "employee"){
				chain.returnValue.getDirectReports = function(){
					return this.manager.findBeans({
						manager_id:this.employee_id
					})
				}
			}
		})
	(end)
	
	*/
	Object.prototype.after=function( functionName, functionObj){
		ObjectLib.after(this,functionName, functionObj);
	}
/* Function: appendFunction
	alias for <after>
	*/
	Object.prototype.appendFunction=Object.prototype.after
	
/* Function: applyTo 
	Copies all properties (including Function properties) of this object to another
	 
	Parameters: 
		target				-	object to copy to
		shouldOverwrite 	- 	*Optional, default false* Should existing properties in 
								_target_ be replaced by the properties in _source_?
 
	Returns: 
		_target_
		
	Detail:
		This can be used for simulating inheritance (even multiple inheritance) on 
		instantiated objects by copying the properties of another object
	
				
	Examples:
		(code)
			// Make Myna's functions such as abort() and dump() available 
			// without the Myna prefix
			Myna.applyTo(this); 
									
		(end)
	*/
	Object.prototype.applyTo=function(target,shouldOverwrite){
		return ObjectLib.applyTo(this,target,shouldOverwrite);
	}

/* Function: getKeys 
	returns an alphabetized list of non-function properties in this object
	
	Parameters: 
		obj 	-	*Optional, default this* object to examine
	
	Returns: 
		An alphabetized array of properties in an object
	
	*/
	Object.prototype.getKeys = function(obj){
		return ObjectLib.getKeys(this);
	}
/* Function: getProperties
	returns an alphabetized list of all properties in an object
	
	Parameters: 
		obj 	-	*Optional, default this* object to examine
	
	Returns: 
		An alphabetized array of properties in an object
		
	*/
	Object.prototype.getProperties = function(obj){
		return ObjectLib.getProperties(this);
	}
/* Function: hideProperty
	*Server-Only* set the "DONTENUM" attribute of the supplied property
	
	Parameters: 
      property    -  propery to modify
	
	Detail:
      Set the the "DONTENUM" attribute on the defined property. This means that 
      this property will not appear in <getProperties> or <Myna.Dump> or 
      <forEach> or any other function that loops over enumerable properties. Use 
      this to "hide" functions and properties that you do not want to be 
      considered "data" 
		
	*/
	Object.prototype.hideProperty = function( property){
      ObjectLib.hideProperty(this,property)
	}   
/* Function: checkRequired 
	Ensures that certain properties defined.
	 
	Parameters: 
		required 	- 	Array of property name strings to look for
 
	Returns: 
	 	void
		
	Detail: 
		This function is intended for Javascript Objects being used as data containers. 
		Particularly JS objects passed as function parameters. 
		
		This function simply checks to see if every string in the _required_ array has
		a corresponding property in this Object. The first time a property is not found, an
		exception is raised.
	 
	*/
	Object.prototype.checkRequired=function (required){
		return ObjectLib.checkRequired(this,required);
	}
	
/* Function: toJson 
	Converts the this object to JSON (http://www.json.org) 
	 
	Returns: 
		JSON string that represents this object
		
	Detail:
		Adapted from http://www.json.org/json.js
		
		Attempts to convert this object to JSON. This is best used on simple 
		Objects and Arrays.
		
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
	Object.prototype.toJson=function() {
		return ObjectLib.toJson(this);
	}	

/* Function: setDefaultProperties
	sets default properties on this object 
	 
	Parameters: 
		defaults 		- 	Object that represents the default properties
		looseMatch	-	If true, consider "null" values and 0 length strings to be 
							the same as undefined. By default, only strictly undefined 
							properties are overwritten by their _defaults_.
 
	Returns: 
		this
		
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
	Object.prototype.setDefaultProperties=function (defaults,looseMatch){
		return ObjectLib.setDefaultProperties(this,defaults,looseMatch);
	}
/* Function: forEach
	loops over each non-function property of this object an executes the 
	supplied function against it.   
	 
	Parameters: 
		callback -	Function to execute. See below for the parameters it will 
					be passed
 
	Callback Parameters:
		element		-	the value of property
		name		-	the name of the property
		object		-	a reference to this object
		
	
		
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
	Object.prototype.forEach=function (func){
		return ObjectLib.forEach(this,func);
	}
/* Function: copy
	returns a new object with the same properties as the supplied object 
	 
	Parameters: 
		obj		- 	object to apply to
		deep		-	*optional, default false*
						If true, a deep copy is made where no property or child of a 
						property in the new object is shared with the original object. 
						
						*Only works with pure JavaScript, and functions will be 
						stripped* 
 
	Detail: 
		by default, this performs a shallow copy by creating a new object and 
		copying the properties of the old object onto it. 
		
		if _deep_ is true, then 
		the object is decompiled to source and the compiled as a new object. Deep 
		copies will fail if the object contains java objects, and all functions 
		are removed, regardless. Deep copies are useful for "sanitizing" a complex 
		data object for storage, transmission, or return from a function.
		
	Example:
		(code)
			
			var dontChangeName =function(obj){
				//make a shallow copy of object so we can alter it's properties
				var myObj = obj.copy();
				myObj.name = "stan";	
			}
			
			var bob ={
				name:"bob"
			}
			dontChangeName(bob);
			//bob is still "bob"
			
			
			var dataChunk={
				_data:[1,2,3,4],
				getData:function(){
					//deep copy, user can't change contents of this._data
					return this._data.copy(true);
				}
			}
			var data = dataChunk.getData();
			data.push(5); //doesn't affect dataChunk._data;
		(end)
	 
	*/
	Object.prototype.copy=function (deep){
		if (deep) {
			return eval( uneval(this) );
		} else {
			return this.applyTo({});
		}
	}
if ("$server_gateway" in this){
	(function(){
		var hide = function (o, p) {
		 java.lang.Class.forName ("org.mozilla.javascript.ScriptableObject")
			.getMethod("setAttributes", java.lang.String, java.lang.Integer.TYPE)
			.invoke(o, p, new java.lang.Integer( 
				org.mozilla.javascript.ScriptableObject.DONTENUM
			)
		 );
		}
		
		for (var p in Object.prototype) hide(Object.prototype, p)
		delete p;
		delete hide;
	})()
}

