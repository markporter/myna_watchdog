/* Class: Function 
	Additional functions on the JS Function object    
	 
*/
/* Function: repeat
	executes this function repeatedly, returning results as array
	
	Parameters:
		count		-	number of times to execute this function
		
	Detail:
		When this this function is executed, it will be passed 2 parameters: 
		_index_ and _count_. _index_ is the current iteration number, starting 
		with 0. _count_ is the original _count_ passed to repeat.
		
	Examples:
	(code)
	//pre-defined function
	var f = function(index,count){
		$res.print("loop #" + index + " of " +count+"<br>");	
	}
	f.repeat(10);
	
	//anonymous function 
	//The Object keyword is only necessary when not assigning the result
	Object(function(index,count){
		$res.print("loop #" + index + " of " +count+"<br>");	
	}).repeat(10);
	
	//building results
	var array = ((function(index,count){
		return(index +","+count)
	}).repeat(10))
	
	(end)
	
	See also: <Array.forEach>
*/
Function.prototype.repeat = function(count){
	var f = this;
	var result =[];
	for (var x=0; x < count; ++ x){
		result.push(f(x,count));
	}
	return result
}
/* Function: bind
	returns a version of this function bound to a specific scope object
	
	Parameters:
		scope			-	object to bind as "this"
		n1+				-	any arguments after _scope_ will be bound tothe function 
							as well. Any arguments passed to the returned function will
							appended to these 		
	
	Detail:
		The purpose of this function is to bind a function to a specific scope. If
		this function is later assigned to another object, it will still apply to 
		it's bound scope. 
		
	Note:
		This function is API compatible with the EcmaScript5 "bind" function 
		
	
	Example:
	(code)
	var obj={
		name"bob"
	}
	var f = function(){
		Myna.println(this.name)
	}
	
	var bound =f.bind(obj);
	
	bound(); //prints bob
	f();//throws an error
	
	//example using bound arguments
	
	var logError = Myna.log.bind({},"ERROR");
	logError("something bad happend")
	
	(end)
	
*/
Function.prototype.bind = Function.prototype.bind ||function(o) {
    // Save the this and arguments values
    var self = this, boundArgs = arguments;
    return function() {
        // Build up an argument list
        var args = [], i;
        for(i = 1; i < boundArgs.length; i++)
            args.push(boundArgs[i]);
        for(i = 0; i < arguments.length; i++)
            args.push(arguments[i]);
        // Now invoke self as a method of o
        return self.apply(o, args);
    };
};

/* Function: createCallback
	returns a callback function that will execute this function with the 
	supplied arguments 
	
	Detail:
		The purpose of this function is to simplify calling a function with a 
		defined set of paramters.
		
	Note:
		This function was adapted from Ext 2.0.1 (http://extjs.com)
		
	Example:
	(code)
	//old way:
	var f= function(){
		myFunc("woot!",false);
	}
	
	//new way:
	var f = myFunc.createCallback("woot!",false);
	(end)
	
*/
    Function.prototype.createCallback = function(/*args...*/){
        // make args available, in function below
        var args = arguments;
        var method = this;
        return function() {
            return method.apply(window || $server.globalScope, args);
        };
    }

/* Function: createDelegate
	returns a function that executes this function with supplied scope and 
	arguments
	
	Parameters:
		obj			-	*Optional, default window or $server.globalScope*
						object to use as the "this" scope when the function is 
						executed
		args		-	*Optional, default[]*
						Array of arguments to call this function with.
		appendArgs	-	*Optional, default false*
						- By default, if _args_ is defined, then when this 
						delegate is called, any passed arguments will be 
						ignored.  
						- If _appendArgs_ is a boolean true (not just a 
						boolean equivalent), then when this function is called, 
						any passed arguments will used, and _args_ will be 
						appended to the passed in arguments.
						- If _appendArgs_ is a number, then _args_ will be 
						inserted into the passed arguments at the indicated 
						position. For example, a value of 0 would cause _args_ 
						to be placed before the passed in arguments instead of
						after them.
						
	
	Detail:
		The purpose of this function is to simplify calling a function with a 
		defined set of parameters, and a defined scope.
		
	Note:
		This function was adapted from Ext 2.0.1 (http://extjs.com)
		
	Example:
	(code)
	
		var a={
		myVal:20,
		myFunc:function(label,otherVal){
			Myna.println("<br>label:" + label + "<br>myVal:" + this.myVal
				+ "<br>otherVal:" + otherVal + "<br>");	
		}
	}
	var b;
	
	// Problem:
	// Can't set default values, and a's function executes against b's properties
	b={
		myVal:10,
		myFunc:a.myFunc
	}
	b.myFunc("Doh!");
	
	// classic solution:
	b={
		myVal:10,
		myFunc:function(label){
			var args = [label,"calling from b"]
			
			a.myFunc.apply(a,args);	
		}
	}
	b.myFunc("woot!");
	
	// with createDelegate:
	// appends "calling form b" to the arguments passed to myFunc
	b={
		myVal:10,
		myFunc:a.myFunc.createDelegate(a,["calling from b"],true)
	}
	b.myFunc("woot! woot!");
	
	(end)
*/
    Function.prototype.createDelegate = function(obj, args, appendArgs){
        var method = this;
        return function() {
            var callArgs = args || arguments;
            if(appendArgs === true){
                callArgs = Array.prototype.slice.call(arguments, 0);
                callArgs = callArgs.concat(args);
            }else if(typeof appendArgs == "number"){
                callArgs = Array.prototype.slice.call(arguments, 0); // copy arguments first
                var applyArgs = [appendArgs, 0].concat(args); // create method call params
                Array.prototype.splice.apply(callArgs, applyArgs); // splice them in
            }
			var scope;
			if (obj){
				scope=obj;
			} else if (typeof window != "undefined"){
				scope=window;
			} else if (typeof $server != "undefined"){
				scope= $server.globalScope;
			}
            return method.apply(scope, callArgs);
        };
    }

/* Function: createSequence
	creates and returns a combined function call sequence of this function 
	followed by the passed function. The resulting function returns the results 
	of the orginal function.
	
	Parameters:
		fcn		-	function to append to this one
		object 	-	*Optional, default window or $server.globalScope* 
					The scope of the passed fcn 

	Note:
		This function was adapted from Ext 2.0.1 (http://extjs.com)
		
	Example:
	(code)
	
	var first = function(){
		print("I am first<br>")	
	}
	var second = function(){
		print("I am second<br>")	
	}
	var seq  = first.createSequence(second)
	seq();

	(end)
    */
	Function.prototype.createSequence = function(fcn, scope){
        if(typeof fcn != "function"){
            return this;
        }
        var method = this;
        return function() {
            var retval = method.apply(this || window, arguments);
			var callScope;
			if (scope){
				callScope=scope;
			} else if (typeof this != "undefined"){
				callScope=this;
			} else if (typeof window != "undefined"){
				callScope=window;
			} else if (typeof $server != "undefined"){
				callScope= $server.globalScope;
			}
            fcn.apply(callScope, arguments);
            return retval;
        };
    }

/* Function: createInterceptor
	returns a function that executes a supplied interceptor function, then this 
	function unless the interceptor returns false. 
	
	Parameters:
		fcn		-	function to execute BEFORE this function
		scope	-	scope to execute _fcn_ within
	
	Detail:
		The passed _fcn_ is called before the this function. If it returns a 
		real boolean false (not null or undefined) then this function will not 
		be executed. This should only be used on functions that don't noramally 
		return a value, such as event functions.
		
	Note:
		This function was adapted from Ext 2.0.1 (http://extjs.com)	
	
	Example:
	(code)
	
	var doEmployeeStuff = function(){
		print("Doing useful stuff<br>")	
	}
	var doManagerStuff = function(){
		print("Intercepted! Doing manager stuff instead!<br>")
		return false;
	}
	var doWork  = doEmployeeStuff.createInterceptor(doManagerStuff)
	doWork();
	
	(end)
     */
    Function.prototype.createInterceptor=function(fcn, scope){
        if(typeof fcn != "function"){
            return this;
        }
        var method = this;
        return function() {
            fcn.target = this;
            fcn.method = method;
			var callScope;
			if (scope){
				callScope=scope;
			} else if (typeof this != "undefined"){
				callScope=this;
			} else if (typeof window != "undefined"){
				callScope=window;
			} else if (typeof $server != "undefined"){
				callScope= $server.globalScope;
			}
            if(fcn.apply(callScope, arguments) === false){
                return undefined;
            } else {
					return method.apply(callScope, arguments);
				}
        };
    }