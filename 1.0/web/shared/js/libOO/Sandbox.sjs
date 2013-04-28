/*global
	$server_gateway:false
	Myna:true
	$server:false
	$profiler:false
	$res:false
	Continuation:false
*/
/*
	Class: Myna.Sandbox
	Creates a sandbox for running JavaScript code with restrictions on access to
	Java and and hosting code. 
*/
/* Topic: Examples

	(code)
		var sandbox = new Myna.Sandbox({
			whitelist:[
				/^java\.net\.URL$/,
				/^java\.net\.URLConnection$/,
				/^java\.io\.InputStream$/
			]

		});
		// Per-class property whitelists
			// see the "options.file" constructor property and "importFromFile" 
			// function for a more compact way to define class and property 
			// whitelists

		sandbox.addWhitelistProperty(
			/^java\.net\.URL$/	
			/openConnection/
		);
		sandbox.addWhitelistProperty(
			/^java\.net\.URLConnection$/	
			/getInputStream/
		);
		sandbox.addWhitelistProperty(
			/^java\.io\.InputStream$/
			/^.*$/
		);
		
		sandbox.addProxyDef(/java.net.Url/,{
			properties:{
				openConnection:{
					beforeFn:function (proxy) {
						if (proxy){
							//disallow proxies
							Myna.Sandbox.throw("URL:openConnection cannot be called with a proxy")
						}
					}
				}
			}
		});

		//This sets what will be visible in the parent scope of the code executed 
		//in the sandbox
		sandbox.addScopeObjects(
			{
				website:new java.net.URL("http://goodsite.com"),
				log:log,
				error:error,
				savePage:savePage
			}
		)

		// good for code that is non-interactive, or places results in it's 
		// global scope
		sandbox.executePath("/scripts/somescript.sjs")
		var result1 = sandbox.scope.someResultValue;

		//good for loading a script library, and the executing a function
		result2 = sandbox.executePath(
			"/scripts/somescript.sjs",
			"doStuff",
			[arg1,arg2]
		);

		//can also execute arbitrary strings. Just pass a "path" for error messages
		result3 = sandbox.executeString(
			mySandboxedCode,
			"dynamic_code_{0}.sjs".format(runId),
			"doStuff",
			[arg1,arg2]
		);
	(end)
*/
if (!Myna) var Myna={};

/* Constructor: Myna.Sandbox
	Constructor function for Sandbox class
	
	Parameters:
		options		-	Object that describes the options for this connection.
						See *Options* below.

	Options:
		whitelist	-	*Optional, default []*
						regex whilelist of classes explicitly allowed in this 
						sandbox. This can also be set 
						via  _file_ option to the constructor, or later via <importFromFile>
						This can be a single string ("^java.net.URL$") 
						a single regex (/^java.net.URL$/)
						or an array of either type 
						["^java.net.URL$", /^java.net.URLConnection$/]

		file		-	*Optional*
						<MynaPath> or <Myna.File> pointing to a proxy ruleset 
						file. This will be merged with whitelist, but is really 
						intended as an alternative way of setting the 
						whitelisted classes and properties.
						See <importFromFile> for file format

		debug		-	*Optional, default false*
						If true, then the server will be placed in a sandbox 
						debug mode while executing code. This will result in the
						<sandboxRules> property being set to an array of rule 
						strings appropriate for adding to a proxy ruleset file 
						that can be included with <importFromFile>

		mynaStandardObjects		-	*Optional, default false*
						Normally, only JavaScript standard objects are included 
						in the sandbox scope. Setting this property to true 
						allows access to the "web-safe" Myna functions as well 
						(see list below).

	Myna Standard Objects:
		* <Number>
		* <Array>
		* <ObjectLib>
		* <Object>
		* <String>
		* <Function>
		* <Date>
		* <Myna.ValidationResult>
		* <Myna.Validation>
		* <Myna.Profiler>
		* <Myna.DataSet>
		* <Myna.Inflector>
		* <$profiler>
		
	Returns:
		a Sandbox instance
	*/
	Myna.Sandbox = function(options){
		this.blacklist=[/.*/]
		//options.blacklist||[];
		this.whitelist=options.whitelist||[];
		this.classPropertyWhitelist ={};
		this.proxyDefs=[];
		this.sandboxRules=[];

		
		Myna.Sandbox._initLists(this);

		if (options.file) this.importFromFile(options.file);
		if ("debug" in options) this.debug = options.debug;

		var scope =this._scope=$server_gateway.threadContext.initStandardObjects(null,false);
		if (options.mynaStandardObjects){
			[
				"Number",
				"Array",
				"ObjectLib",
				"Object",
				"String",
				"Function",
				"Date",
				
				"ValidationResult",
				"Validation",
				"Profiler",
				"$profiler",
				"DataSet",
				"Inflector"
			].forEach(function(obj){
				scope[obj] = $server.globalScope[obj]
				if (scope[obj] && typeof scope[obj] == "function" && scope[obj].prototype){
					//scope[obj].prototype.getLineIterator = Myna.Sandbox.bypassFn(scope[obj].prototype.getLineIterator);
					try{
					scope[obj].prototype = $server.globalScope[obj].prototype.getProperties()
						.filter(function (k) {
							return typeof scope[obj].prototype[k] == "function"
						}).forEach(function (k) {
							try{
								scope[obj].prototype[k] = Myna.Sandbox.bypassFn(scope[obj].prototype[k]);
							} catch(e) {}
						})
					} catch(e){}
				}
				
			});

		}
	};

/* ================== Class Functions ========================================*/
/* Function: throw
	*Class function* Throws a sandbox exception, also known as a sandbox violation. 

	Parameters:
		msg			-	*String* 
						message regarding this error.

		className	-	*Optional*
						*String*
						If this error could have been prevented by whitelisting 
						a class, this should contain the appropriate String 
						class name
	
		property	-	*Optional*
						*String*
						If this error could have been prevented by whitelisting 
						a class and property, this should contain the 
						appropriate String property name

	Detail:
		This will unwind the stack back to the sandbox execution call and 
		cannot be captured from within the sandbox code. However this can be 
		caught outside the sandbox. This is useful for proxyDefs with custom 
		function handler, e.g. throwing errors on certain types of input. These 
		can also be handled globally via <onSandboxException>
	*/
	Myna.Sandbox.throw = function(msg,className,property){
		if (Myna.Sandbox.getCurrent()){
			var e = new Error("Sandbox Violation: " +msg);
			if (className){
				if (property){
					e.rule="property:{0}:{1}".format(
						className.escapeRegex(),
						property.escapeRegex()
					);
				} else {
					e.rule="class:{0}".format(
						className.escapeRegex()
					);
				}
				msg+=" rule({0})".format(e.rule);
			}
			$server_gateway.currentSandbox.exitSandbox(e);
			throw e;
		}

	};
/* Function: Myna.Sandbox.getCurrent
	*Class function* returns the currently executing sandbox or null if no sandboxes are 
	currently executing.
		
	*/
	Myna.Sandbox.getCurrent = function(){
		return $server_gateway.currentSandbox;
	};
/* Function: Myna.Sandbox.bypass
	*Class function* bypasses all sandboxes for the duration of a function.

	Parameters:
		fun		-	function to execute outside the sandbox

	example:
	(code)
		sandbox.globalAfter = function () {
			Myna.Sandbox.bypass(function () {
				new Myna.File("log").appendString(
					"accessed property " + chain.array.propertyName
				);
			})

			return arguments.callee.chain.lastReturn;
		}
	(end)

	See Also:
	* <Myna.Sandbox.bypassFn>
	*/
	Myna.Sandbox.bypass = function(fun){
		return this.bypassFn(fun)();
	};	
/* Function: Myna.Sandbox.bypassFn
	*Class function* wraps a function in a sandbox bypass

	Parameters:
		fun		-	function to wrap

	example:
	(code)
		var newScope={};
		newScope.log =Myna.Sandbox.bypassFn(function (text,type) {
			new Myna.File("log").appendString(
				"[{0}] {1}: {2}".format(
					new Date.format("Y-m-d H:i:s"),
					type||"debug",
					text
				)
			);
		})

		sandbox.addScopeObjects(newScope);
		
	(end)

	See Also:
	* <Myna.Sandbox.bypass>
	*/
	Myna.Sandbox.bypassFn = function(fun){
		return function () {
			var currentSandbox = $server_gateway.currentSandbox;
			$server_gateway.currentSandbox=null;
			try{
				return fun.apply(this,Array.parse(arguments));
			} finally{
				$server_gateway.currentSandbox=currentSandbox;
			}
		};
	};
/* Function: Myna.Sandbox.isDebugMode
	*Class Function* returns true if the current MynThread is in sandbox debug mode.

	See <debug>
		
	*/
	Myna.Sandbox.isDebugMode = function (){
		return $server_gateway.environment.get("SANDBOX_PROPERTY_DEBUG")
			&& $server_gateway.environment.get("SANDBOX_CLASS_DEBUG");
	};


/* internal function Myna.Sandbox._setDebugMode
	sets the debug mode for this MynaThread, should only be called by a sandbox when executing.

	Parameters:
		enabled		-	boolean
	*/
	Myna.Sandbox._setDebugMode = function (enabled){
		if (enabled){
			$server_gateway.environment.put("SANDBOX_PROPERTY_DEBUG",true);
			$server_gateway.environment.put("SANDBOX_CLASS_DEBUG",true);
		} else{
			$server_gateway.environment.remove("SANDBOX_PROPERTY_DEBUG");
			$server_gateway.environment.remove("SANDBOX_CLASS_DEBUG");
		}

	};
/* internal function, _cleanRegex */
	Myna.Sandbox._cleanRegex = function cleanRegex(value){	
		if (value instanceof RegExp){
			return value.toString().replace(/^\//,"").replace(/\/[mig]*$/,"");
		} else return value;
	};
/* internal function, _initLists */	
	Myna.Sandbox._initLists = function(options){
		//if (options.blacklist && !(options.blacklist instanceof Array)) options.blacklist = [options.blacklist];
		if (options.whitelist && !(options.whitelist instanceof Array)) options.whitelist = [options.whitelist];
		
		if (options.blacklist){
			options.blacklist = options.blacklist.map(Myna.Sandbox._cleanRegex);
		}
		if (options.whitelist){
			options.whitelist = options.whitelist.map(Myna.Sandbox._cleanRegex);
		}
		
		if (options.propertyBlacklist && !(options.propertyBlacklist instanceof Array)) {
			options.propertyBlacklist = [options.propertyBlacklist];
		}
		if (options.propertyWhitelist && !(options.propertyWhitelist instanceof Array)) {
			options.propertyWhitelist = [options.propertyWhitelist];
		}
		
		if (options.propertyBlacklist){
			options.propertyBlacklist = options.propertyBlacklist.map(Myna.Sandbox._cleanRegex);
		}
		if (options.propertyWhitelist){
			options.propertyWhitelist = options.propertyWhitelist.map(Myna.Sandbox._cleanRegex);
		}
		
		return options;
	};

/* ================== Instance Properties ====================================*/
/* Property: whitelist
	*regex[]* to whitelist Java classes. 

	This is normally set in the constructor or a rules file

	Example: 
	> /^java\.net\.\w+$/ 
	*/
/* Property: debug
	*boolean, default false* indicates whether this sandbox should execute in 
	debug mode. In debug mode, sandbox violations do not result in errors but 
	rather get logged as type "sandbox" and write the rules necessary to whitelist
	the access to <sandboxRules>. This is helpful for debugging and for 
	gathering baseline rules.

	This can be set in the constructor
		
	*/
/* Property: sandboxRules
	Array of sandbox whitelist rules. These are generated when sandbox 
	exceptions are raised in <debug> mode. These are strings that can be 
	appended a proxy rules file, and imported via <importFromFile> or the
	_file_ constructor parameter.
	
	*/
/* Property: scope
	Object that represents the global scope within the sandbox. This can only 
	be modified via <addScopeObjects>, but can be read to view objects created 
	within the sandbox

	*/
	Object.defineProperty(Myna.Sandbox.prototype,"scope",{
		get:function () {return this._scope},
		set:function () {throw new Error("Sandbox scope can only be modifiec via addScopeObjects()")}
	})
/* Property: classPropertyWhitelist
	Object that contains property whitelists for java classes within the sandbox.
	This should only be modified via <addWhitelistPropery> or via a rules file

	*/

/* internal global blacklist
	*regex[]* to blacklist Java classes

	This is normally set in the constructor or a rules file
	
	example:
	> /^java\.net\.\w+$/ 

	*/
	Myna.Sandbox.prototype.blacklist=[/.*/];


	
/* ================== Instance Functions =====================================*/
/* ------------------ Override functions -------------------------------------*/
/* Function: globalBefore
	*Override* function to be executed before every function call and property 
	access in a proxied Java object

	Parameters:
		various		-	For wrapped functions, these will be the parameters to 
						the underlying function. For property access there are 
						no parameters

	Special variables:
	This will be called in a chain along with any other interceptor functions
	as per <Function.createChainFunction>. The name of the property or function
	being accessed can be found in 

	_arguments.callee.chain.array.propertyName_

	Also, like all chain functions, you can find the last returned value in 


	This is useful for global input filtering for all proxied functions.

	Example:
	(code)
		sandbox.globalBefore = function () {
			var chain = arguments.callee.chain;
			//alter arguments to next function in the chain
			chain.args = chain.args.map(function (arg) {
				if(arg && typeof arg == "string"){
					//escape HTML to prevent XSS attacks
					return String(arg).escapeHtml();
				} else {
					return arg;
				}
			})

		}
	(end)

	See:
		* <createJavaProxy>
		* <addScopeObjects>
		* <Function.createChainFunction>
		* <Myna.Sandbox.bypass>
		* <Myna.Sandbox.bypassFn>
		

	*/
/* Function: globalAfter
	*Override* function to be executed after every function call and property 
	access in a proxied object

	Parameters:
		various		-	For wrapped functions, these will be the parameters to 
						the underlying function. For property access there are 
						no parameters

	Special variables:
	This will be called in a chain along with any other interceptor functions
	as per <Function.createChainFunction>. The name of property or function
	being accessed can be found in 

	_arguments.callee.chain.array.propertyName_

	Also, like all chain functions, you can find the last returned value in 

	_arguments.callee.chain.lastReturn_

	This value should be returned from any "after" functions unless altering 
	return value is intended.

	This is useful for global output filtering for all proxied functions.


	Example:
	(code)
		sandbox.globalAfter = function () {
			Myna.Sandbox.bypass(function () {
				new Myna.File("log").appendString(
					"accessed property " + chain.array.propertyName
				);
			})

			return arguments.callee.chain.lastReturn;
		}
	(end)

	See:
		* <createJavaProxy>
		* <addScopeObjects>
		* <Function.createChainFunction>
		* <Myna.Sandbox.bypass>
		* <Myna.Sandbox.bypassFn>
	*/
/* Function: onSandboxException
	*Override* global violation exception handler for this sandbox;

	Parameters:
		exception	-	sandbox exception object

	This is only called for sandbox violations. By default it returns false. 
	This function should be overridden for custom sandbox exception handling.

	Override functions can return boolean true to suppress this exception.
	*/
	Myna.Sandbox.prototype.onSandboxException=function () {return false;};

/* Function: addScopeObjects
	Add one or more properties to the sandbox scope
	
	Parameters:
		objectStruct	-	JS object where each property should a be a
							top-level property or function in the sandbox scope

	Detail:
		each property  in _objectStruct_ will be merged into the sandbox's 
		<scope>, based on type:

		functions			-	Wrapped in a sandbox escape (see <Myna.sandbox.bypassFn>). This 
								means the sandbox class restrictions will not apply

		arrays				-	Copied as new array, and each item passed again to 
								<addScopeObjects>

		plain JS objects	-	Copied as new object, and each member passed again to 
								<addScopeObjects>

		dates				-	Cloned as new Date object

		Java objects		-	Passed to <createJavaProxy> before assigning

	Note:
		Information from the sandbox's settings is used by <addScopeObjects> to 
		construct the sandbox scope. This means that this function should be 
		called after all other sandbox configuration.

	*/
	Myna.Sandbox.prototype.addScopeObjects = function(objectStruct){
		var scope = this. _scope;
		var $this = this;

		
		function wrap(f){
			return $this.wrapFunction(f);
		}
		
		function cloneAndWrap(source,cloneMap){
			if (!cloneMap) cloneMap = {};
			if (source in cloneMap) return cloneMap[source];
			var target,filterProto;
			var shouldRecurse =false;
			if(typeof source == "function"){
				target = wrap(source);
				shouldRecurse =true;
				filterProto = Function.prototype;
			}else if (source && typeof source == "object" ){
				if (source.hasOwnProperty && !source.__proxied__){
					if (source instanceof Array){
						target =[];
						filterProto = Array.prototype;
						shouldRecurse =true;
					} else if (source instanceof Date){
						target = new Date(source.getTime());
					} else {
						target = {};
						filterProto = Object.prototype;
						shouldRecurse =true;
					}	
				} else if ("class" in source) {
					target = $this.createJavaProxy(source);
				} else{
					target = source;
				}
			} else{
				target = source;
			}
			
			if (shouldRecurse){
				cloneMap[source] = target;
				
				for (var p in source){//properties in the import object
					if (p in filterProto){
						continue;
					}
					/* I don't know what this was for 
					if (p in scope){
						target[p] = source[p];
					} else {*/
						target[p] = cloneAndWrap(source[p]);
					//}
				}
			}
			
			
			return target;
		}
		// top level properties should not be exotic, i.e. no getters/setters
		var clone= cloneAndWrap(objectStruct);
		for (var tp in clone){
			scope[tp] = clone[tp];
		}
	};
/* Function: addProxyDef
	Add an override for specific functions and properties for a Java 
	class. This overrides any generic white-listing provided via 
	<addWhitelistProperty>. Useful for altering input or output or conditional 
	restrictions

	Parameters:
		classPattern	-	className regex to apply these _settings_ to
		settings		-	settings Object definition. See "Settings" below
		
	Settings:
		propertyWhitelist		-	*Optional, default []*:tuple.value,
									Regex list of properties that are accessible.
		beforeFn				-	*Optional, default null*
									Function to run before accessing a property, 
									or running a function. This runs after the <globalBefore>
		afterFn					-	Function to run after accessing a property, 
									or running a function. This runs before the <globalAfter>

	*/
	Myna.Sandbox.prototype.addProxyDef =function(classPattern,settings){
		if (typeof classPattern == "string"){
			classPattern = new RegExp(classPattern);
		}
		this.proxyDefs.push({
			pattern:classPattern,
			settings:settings
		});
	};
/* Function: addWhitelistClass
	Adds a class regex to the sandbox's whitelist

	Parameters:
		classRegex	-	*RegeExp* regex to add


	This allows Java classes that match this regex to be created within the 
	sandbox. This can also be set via a rules file in the constructor.

	Note:
		By default no properties of these classes can be accessed within the 
		sandbox. See <addWhitelistProperty>

	Example:
	(code)
		sandbox.addWhitelistClass(/^java\.net\.URL$/)
	(end)
	*/
	Myna.Sandbox.prototype.addWhitelistClass =function(classRegex){
		this.whitelist.push(Myna.Sandbox._cleanRegex(classRegex));
	};
/* Function: addWhitelistProperty
	Adds a class property regex to the sandbox's whitelist

	Parameters:
		classRegex		-	*RegeExp* regex of className to apply
		propertyRegex	-	*RegeExp* regex of property name to apply

	This can also be set via a rules file in the constructor

	Note:
		This will also call <addWhitelistClass> using the _classRegex_

	Example:
	(code)
		sandbox.addWhitelistProperty(/^java\.net\.URL$/,/^toString$/)
	(end)
	*/
	Myna.Sandbox.prototype.addWhitelistProperty =function(classRegex,propertyRegex){
		this.whitelist.appendUnique(
			Myna.Sandbox._cleanRegex(classRegex),
			true,
			function (val) {return String(val)}
		);	
		classRegex = Myna.Sandbox._cleanRegex(classRegex);
		if (typeof propertyRegex == "string"){
			propertyRegex =new RegExp(propertyRegex);
		}
		if (!this.classPropertyWhitelist[classRegex]) {
			this.classPropertyWhitelist[classRegex] =[];
		}
		this.classPropertyWhitelist[classRegex].push(propertyRegex);
	};
/* Function: createJavaProxy
	Wraps an object with a proxy object that enforces the sandbox's property 
	permissions.
	
	Parameters:
		obj			-	object to wrap. If this is not a valid Java Object, 
						or if it is already a Java object proxy, it will be 
						returned unaltered
	
	This is called automatically inside <addScopeObjects> when a Java object is 
	encountered. 
		
	See:
		* <addProxyDef>
		* <addWhitelistProperty>
		* <addScopeObjects>
	
	*/
	Myna.Sandbox.prototype.createJavaProxy = function(obj){
		var className;
		//check for real object
		var shouldProxy = obj && typeof obj == "object";

		//check for named object
		if (shouldProxy){
			if ("class" in obj){
				try{
					className= obj["class"].name;

					if ("__proxied__" in obj){
						shouldProxy = false;
					} 
				} catch(e){
					shouldProxy = false;
				}
				
			} else if ("$objectPath" in obj) {
				className = obj.$objectPath;
			} else {
				shouldProxy = false;
			}
		}


		//check for reflection hack
		if (className == "java.lang.Class") return undefined;

		// get lists
		
		if (shouldProxy){
			var options = this._getClassSettings(className);
			var getterFn = function (o,p) {
				if (p == "__proxied__") return true;
				var nativeResult = arguments.length >2?arguments[2]:undefined;
				var pOptions = Myna.Sandbox._initLists(options.properties[p]||{});
				var isBlacklisted = (options.propertyBlacklist||[]).some(function(rs){
					return new RegExp(rs).test(p);
				});
				var isWhitelisted = (options.propertyWhitelist||[]).some(function(rs){
					return new RegExp(rs).test(p);
				});

				
				//wraps a function or property call
				var wrap = function(){
					var f;
					if (typeof nativeResult =="function"){
						f =nativeResult;
					} else {
						f = function(){
							return nativeResult;
						};
					}
					
					if (pOptions.hasOwnProperty("beforeFn")){
						pOptions.beforeFn.proxyConfig = options;
						pOptions.beforeFn.propertyName = p;
						f = f.before(pOptions.beforeFn);
					}
					if (pOptions.hasOwnProperty("afterFn")){
						pOptions.afterFn.proxyConfig = options;
						pOptions.afterFn.propertyName = p;
						f = f.after(pOptions.afterFn);
					}
					
					if (options.hasOwnProperty("beforeFn")){
						options.beforeFn.proxyConfig = options;
						options.beforeFn.propertyName = p;
						f = f.before(options.beforeFn);
					}
					if (options.hasOwnProperty("afterFn")){
						options.afterFn.proxyConfig = options;
						options.afterFn.propertyName = p;
						f = f.after(options.afterFn);
					}
					if (isBlacklisted && !isWhitelisted){
						if ($server_gateway.environment.get("SANDBOX_PROPERTY_DEBUG")){
							f = f.before(function(){
								var name ="";
								if (o["class"]) name = o["class"].name;
								else if (o.$className)	name = o.$className;
							
								Myna.log("sandbox","property:{0}:{1} Sandbox Debug: Property '{0}:{1}' would have been removed".format(
									name.escapeRegex(),
									p.escapeRegex()
								));
								
								return arguments.callee.chain.lastReturn;
							});
						} else {
							f = f.before(function(){
								if (!Myna.Sandbox.getCurrent()) {
									return arguments.callee.chain.lastReturn;
								}
								var name ="";
								if (o["class"]) name = o["class"].name;
								else if (o.$className)	name = o.$className;
								
								Myna.Sandbox.throw(
									'Blacklisted Property {0}:{1} accessed'.format(
										name,
										p
									),
									name,
									p
								);
								
								return undefined;
							});
						}
					}
					
					if (typeof nativeResult =="function"){
						//run our checks when the function is executed

						// hide the execution chain behind a delegate
						return function () {
							try{
								if(f.chainArray){
									f.chainArray.propertyName = p;
								}
								return f.apply(this,Array.parse(arguments));
							} catch(e if /TypeError: Cannot read property "exitChain" from undefined/.test(e)){
								//we got a sandbox violation, this error is irrelevant 
								return undefined
							}
						};
					}else {
						//run our checks now
						try{
							return f();
						} catch(e if /TypeError: Cannot read property "exitChain" from undefined/.test(e)){
							//we got a sandbox violation, this error is irrelevant 
							return undefined
						}
						
					}
					
				};
				return wrap();
			};
			return $server_gateway.proxyWrapJavaObject(obj,obj["class"],getterFn);
		} else {
			return obj;
		}

		
	};
/* Function: executeString
	Executes a JS string in the sandbox

	Parameters:
		string			-	Code to execute
		path			-	path to .js or .sjs file to execute within the 
							sandbox

		functionName	-	*Optional, default undefined*
							*String*
							If defined, this is the name of a function to 
							execute after loading the script into the sandbox

		arg				-	*Optional, default undefined*
							*Array*
							If defined, and array of arguments to pass to the 
							function

	Returns:
		result of _functionName_ or undefined
	*/
	Myna.Sandbox.prototype.executeString = function(string,path,functionName,args){
		var $this = this;
		var startingSandbox = $server_gateway.currentSandbox;
		$server_gateway.currentSandbox =this;


		if (/\.ejs$/.test(path)){
			string = "$res.print(<" +"ejs>" + string + "</" + "ejs>);";
		}
		var script = "try{" +string +"}catch(e){this.$error =e;}";
		
		var scope = this._scope;
		
		
		var startWhitelist = $server_gateway.classWhitelist.toArray();
		$server_gateway.classWhitelist.clear();
		var startBlacklist = $server_gateway.classBlacklist.toArray();
		$server_gateway.classBlacklist.clear();
		var startContent = $res.clear();
		if (this.blacklist){
			$server_gateway.classBlacklist.clear();
			this.blacklist.forEach(function(r){
				$server_gateway.classBlacklist.add(r);
				
			});
		}
		if (this.whitelist){
			$server_gateway.classWhitelist.clear();
			this.whitelist.forEach(function(r){
				$server_gateway.classWhitelist.add(r);
			});
		}
		var sandboxException=false;
		var contentSnapshot = $res.clear();
		var retVal;
		Myna.Sandbox._setDebugMode(this.debug);
		try{
			sandboxException = (function(){
				/*
					Continuations register a return point from inside a function.
					Calling this continuation later will rewind the call stack 
					to this point and return whatever value is passed to the
					Continuation instead of running the code below. 
				*/
				$this.exitSandbox=new Continuation();	
				return undefined;
			})();

			/*
				if sandboxException is defined, that means $this.exitSandbox was
				called with a value. We don't want to re-run our sandboxed code 
				in this case
			*/
			if (!sandboxException){
				$server_gateway.executeJsString(scope,script,path);
				if (functionName && functionName in scope) {
					retVal=scope[functionName].apply(scope,args||[]);
				}
			}
		}finally{
			$server_gateway.classWhitelist.clear();
			$server_gateway.classBlacklist.clear();
			Myna.Sandbox._setDebugMode(false);
			scope.$content = $res.clear();
			Myna.print(startContent);
			
			startWhitelist.forEach(function(r){
				$server_gateway.classWhitelist.add(r);
			});
			startBlacklist.forEach(function(r){
				$server_gateway.classBlacklist.add(r);
			});

			$server_gateway.currentSandbox =startingSandbox;
			$this.content = $res.clear();
			$res.print(contentSnapshot);
		}
		
		if (sandboxException){
			if (sandboxException.rule) {
				$this.sandboxRules.appendUnique(sandboxException.rule);
			}
			if (
				!Myna.Sandbox.isDebugMode()
				|| !this.onSandboxException
				|| this.onSandboxException(sandboxException) !== true
			){
				throw sandboxException;
			}
		}
		
		if (scope.$error) throw scope.$error;

		return retVal;
	};
/* Function: executePath
	Executes the code stored in the supplied MynaPath, in the sandbox
	
	Parameters:
		path			-	path to .js or .sjs file to execute within the 
							sandbox

		functionName	-	*Optional, default undefined*
							*String*
							If defined, this is the name of a function to 
							execute after loading the script into the sandbox

		arg				-	*Optional, default undefined*
							*Array*
							If defined, and array of arguments to pass to the 
							function
	
	Returns:
		result of _functionName_ or undefined.

	See: <executeString>
	*/
	Myna.Sandbox.prototype.executePath = function(path,functionName,args){
		if (!(path instanceof Myna.File)){
			path = new Myna.File(path);
		}
		
		return this.executeString(
			path.readString(),
			path.toString(),
			functionName,
			args
		);
		 
	};

/* Function: importFromFile
	Imports proxy rules from a rules file.

	Parameters:
		file	-	<MynaPath> or <Myna.File> instance

	Proxy rules files are text files with entries whitelisting classes and 
	class properties. Each rule is terminated by a line break

	Class rules consist of the text "class:" followed by a regular expression 
	describing the classname.
	(code)
	class:java.util.Collections\$UnmodifiableRandomAccessList
	class:java\.util\.ArrayList
	(end)

	Property rules consist of the text "property:" followed by a regular expression 
	describing the classname, followd by ":" and then a regular expression 
	describing the property name
	(code)
	property:java\.util\.ArrayList:toArray
	property:java\.util\.ArrayList:toString
	property:java\.util\.Collections\$UnmodifiableRandomAccessList:get
	property:java\.util\.Collections\$UnmodifiableRandomAccessList:size
	(end)

	This can be used from the constructor by passing the _file_ option
	*/
	Myna.Sandbox.prototype.importFromFile =function(file){
		var rules = new Myna.File(file).getLineIterator();

		for (var rule in rules){
			var parts = rule.split(":");
			if (parts[0] == "class"){
				this.addWhitelistClass(parts[1]);
			} else if (parts[0] == "property"){
				this.addWhitelistProperty(parts[1],parts[2]);
			}
		}
		return this;
	};
/* Function: wrapFunction
	wraps a function in a sandbox bypass, and proxies any Java objects returned 
	when called.

	This is normally called from within <addScopeObjects>
	
	Parameters:
		f			-	function reference to wrap
	
	*/
	Myna.Sandbox.prototype.wrapFunction = function(f){
		var sandbox=this;
		return Myna.Sandbox.bypassFn(function () {
			var retval = f.apply(this,Array.parse(arguments));
			//proxy java objects, other object pass through unaltered
			var proxyval = sandbox.createJavaProxy(retval);
			
			return proxyval;
		})
	};
/* internal function _getClassSettings
	Internal function that takes a className and returns its property settings
	*/	
	Myna.Sandbox.prototype._getClassSettings = function(className){
		var sandbox = this;
		var emptyFn = function emptyChain() {
			return arguments.callee.chain.lastReturn;
		};
		var globalAfter = (this.globalAfter||emptyFn).before(function afterProxyFunction(){
			var chain = arguments.callee.chain;
			var o = chain.lastReturn;
			var className ="Unknown";
			try{
				if (o && typeof o == "object" && "class" in o){
					try{
						className =o["class"].name;
					} catch(e){
						return chain.lastReturn;
					}
					var settings = sandbox._getClassSettings(className);
					
						var ret = sandbox.createJavaProxy(
							chain.lastReturn,
							settings
						);

						return ret;
					
				}else{
					return chain.lastReturn;
				}
			} finally{
				if ("_profiler_end" in chain) chain._profiler_end();
			}
		});

		var globalBefore=(this.globalBefore||emptyFn).before(function beforeProxyFunction(){
			var chain = arguments.callee.chain;
			

			var propertyName = chain.array.propertyName;
			var label = String(propertyName);
			if (propertyName) {
				chain._profiler_end=$profiler.begin(label);
			}
			return chain.lastReturn;
		});

		var settings={
			propertyBlacklist:[
				/.*/
			],
			propertyWhitelist:[],
			properties:{}
		};	
		this.proxyDefs.some(function(def){
			if (def.pattern.test(className)){
				settings = ({}).setDefaultProperties(def.settings).setDefaultProperties(settings);
				if (settings.afterFn != globalAfter){
					settings.afterFn = (settings.afterFn||emptyFn).after(globalAfter);
				}
				if (settings.beforeFn != globalBefore){
					settings.beforeFn = (settings.beforeFn||emptyFn).before(globalBefore);
				}
				return true;
			}
		});

		sandbox.classPropertyWhitelist.toArray().some(function(tuple){
			//tuple.key = String class regex
			//tuple.value = Array regex property whitelist
			if (new RegExp(tuple.key).test(className)){
				if (settings){
					settings.propertyWhitelist = tuple.value
						.concat(settings.propertyWhitelist||[]);
				} else {
					settings = {
						propertyBlacklist:[
							/.*/
						],
						propertyWhitelist:tuple.value,
						beforeFn:globalBefore,
						afterFn:globalAfter
					}
				}

				
				return true;
			}

		})

		return settings
	}
