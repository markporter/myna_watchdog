
/* 
	Class: Myna.Sandbox
	Creates a sandbox for running JavaScript code with restrictions on access to 
	Java and and hosting code  
	
	Example:
	(code)
		var sandbox = new Myna.Sandbox({
			blacklist:".*"
		});
		//assuming WebWrapper is a wrapper object for URL connections
		sandbox.addScopeObjects(
			{
				website:new WebWrapper(url),
				log:log,
				error:error,
				savePage:savePage
			},
			{
				whitelist:".*"
			}
		)
		sandbox.executePath("/scripts/somescript.sjs")
	(end)
*/
if (!Myna) var Myna={}

/* Constructor: Myna.Sandbox
	Constructor function for Sandbox class
	
	Parameters:
		options		-	Object that describes the options for this connection.
						See *Options* below.
	Options: 
	Returns:							
		Reference to Sandbox instance
	*/
	Myna.Sandbox = function(options){
		this.blacklist=options.blacklist||[];
		this.whitelist=options.whitelist||[];
		
		if (!(this.blacklist instanceof Array)) this.blacklist = [this.blacklist]
		if (!(this.whitelist instanceof Array)) this.whitelist = [this.whitelist]
		
		this.blacklist = this.blacklist.map(function(r){
			if (r instanceof RegExp){
				return r.toString().replace(/^\//,"").replace(/\/[mig]*$/,"")	
			} else return r
		})
		this.whitelist = this.whitelist.map(function(r){
			if (r instanceof RegExp){
				return r.toString().replace(/^\//,"").replace(/\/[mig]*$/,"")	
			} else return r
		}) 
		
		
		this.scope=$server_gateway.threadContext.initStandardObjects();
		if (options.mynaStandardObjects){
			[
				"Number.js",
				"Array.js",
				"ObjectLib.js",
				"String.js",
				"Function.js",
				"Date.js",
				"ValidationResult.js",
				"Validation.js",
				"Profiler.js",
				"DataSet.js",
				"Inflector.js",
			].forEach(function(file){
				Myna.include(new Myna.File("/shared/js/libOO",file),scope);
			});
		}
					
		
	}
	
Myna.Sandbox._initLists = function(options){
	if (options.blacklist && !(options.blacklist instanceof Array)) options.blacklist = [options.blacklist]
	if (options.whitelist && !(options.whitelist instanceof Array)) options.whitelist = [options.whitelist]
	
	if (options.blacklist){
		options.blacklist = options.blacklist.map(function(r){
			if (r instanceof RegExp){
				return r.toString().replace(/^\//,"").replace(/\/[mig]*$/,"")	
			} else return r
		})
	}
	if (options.whitelist){
		options.whitelist = options.whitelist.map(function(r){
			if (r instanceof RegExp){
				return r.toString().replace(/^\//,"").replace(/\/[mig]*$/,"")	
			} else return r
		})
	}
	
	if (options.propertyBlacklist && !(options.propertyBlacklist instanceof Array)) options.propertyBlacklist = [options.propertyBlacklist]
	if (options.propertyWhitelist && !(options.propertyWhitelist instanceof Array)) options.propertyWhitelist = [options.propertyWhitelist]
	
	if (options.propertyBlacklist){
		options.propertyBlacklist = options.propertyBlacklist.map(function(r){
			if (r instanceof RegExp){
				return r.toString().replace(/^\//,"").replace(/\/[mig]*$/,"")	
			} else return r
		})
	}
	if (options.propertyWhitelist){
		options.propertyWhitelist = options.propertyWhitelist.map(function(r){
			if (r instanceof RegExp){
				return r.toString().replace(/^\//,"").replace(/\/[mig]*$/,"")	
			} else return r
		})
	}
	
	return options;
}
/* Function: addScopeObjects
	Add one or more properties to the sandbox scope
	
	Parameters:
		objectStruct	-	JS object where each property should a be a 
							top-level variable in the sandbox scope
		options			-	JS options object, see *Options* below
		
		
	Options:
		whitelist		- alternate whitelist to use for functions in ObjectStruct
		backlist		- alternate blacklist to use for functions in ObjectStruct
	*/	
	Myna.Sandbox.prototype.addScopeObjects = function(objectStruct,options){
		var scope = this.scope;
		var $this = this;
		
		Myna.Sandbox._initLists(options)
		
		
		function wrap(f){
			return Myna.Sandbox.wrapFunction(f,options)
		}
		
		function cloneAndWrap(source,cloneMap){
			if (!cloneMap) cloneMap = {};
			if (source in cloneMap) return cloneMap[source];
			var target,filterProto;
			var shouldRecurse =false;
			if(typeof source == "function"){
				target = wrap(source)
				shouldRecurse =true;
				filterProto = Function.prototype
			}else if (source && typeof source == "object" && source.hasOwnProperty && !source.__proxied__){
				if (source instanceof Array){
					target =[];
					filterProto = Array.prototype
					shouldRecurse =true;
				} else if (source instanceof Date){
					target = new Date(source.getTime());
				} else {
					target = {}
					filterProto = Object.prototype
					shouldRecurse =true;
				}
				
			} else{
				target = source	
			}
			
			if (shouldRecurse){
				cloneMap[source] = target;
				
				for (var p in source){//properties in the import object
					if (p in filterProto){
						continue
					}
					target[p] = cloneAndWrap(source[p])
				}
				if (options.seal){
					Object.preventExtensions(target)
				}
			}
			
			
			return target;
		}
		// top level properties should not be exotic, i.e. no getters/setters
		var clone= cloneAndWrap(objectStruct);
		for (tp in clone){ 
			scope[tp] = clone[tp] 
		}
	}
/* Function: Myna.Sandbox.wrapFunction
	(Class Function) creates a function wrapper with specific permissions.
	
	Parameters:
		f			-	function reference to wrap
		options		-	See *Options* below
		
	Options:
		blacklist	-	Array of RegExp objects or Java regex strings that 
						describe the disallowed Java classes
		whitelist	-	Array of RegExp objects or Java regex strings that 
						describe the allowed Java classes. Overrides _blacklist_
	
	*/	
	Myna.Sandbox.wrapFunction = function(f,options){
		Myna.Sandbox._initLists(options)
		
		
		var $this = this;
		
		return function(){
			var startWhitelist = $server_gateway.classWhitelist.toArray();
			var startBlacklist = $server_gateway.classBlacklist.toArray();
			
			if (options.blacklist){
				$server_gateway.classBlacklist.clear();
						
				options.blacklist.forEach(function(r){
					$server_gateway.classBlacklist.add(r);
				})
			}
			if (options.whitelist){
				$server_gateway.classWhitelist.clear();
				options.whitelist.forEach(function(r){
					$server_gateway.classWhitelist.add(r);
				})
				
			}
			
			try{
				
				var retval = f.apply(this,Array.parse(arguments))
				if (options.proxy){
					retval = $this.createProxy(retval,options.proxy) 	
				}
				return retval
			}finally{
				$server_gateway.classWhitelist.clear();
				startWhitelist.forEach(function(r){
					$server_gateway.classWhitelist.add(r);
				})
				
				$server_gateway.classBlacklist.clear();
				startBlacklist.forEach(function(r){
					$server_gateway.classBlacklist.add(r);
				})
			}
		}
	}
/* Function: Myna.Sandbox.createProxy
	(Class Function) wraps an object with a proxy object that can have arbitrary permissions.
	
	Parameters:
		o			-	object to wrap. Can be a Java object.
		options		-	see below
		
	Options:
		blacklist			-	default Array of RegExp objects or Java regex strings that 
								describe the disallowed Java classes
		whitelist			-	default Array of RegExp objects or Java regex strings that 
								describe the allowed Java classes. Overrides _blacklist_
		propertyBlacklist 	-	Array of RegExp objects or Java regex strings that 
								describe the disallowed function/property names
		propertyWhitelist 	-	Array of RegExp objects or Java regex strings that 
								describe the allowed function/property names. Overrides
								_propertyBlacklist_
								
		before				-	function to run before calling ANY native 
								property, even non-function properties. Also runs before 
								any _before_ definitions defined in the _properties_ section
								See <Funciton.before>
								
		after				-	function to run after calling ANY native 
								property, even non-function properties. Also runs after 
								any _after_ definitions defined in the _properties_ section
		
		properties			-	JS Object where the keys are names (or String Regular 
								Expressions) of properties in _o_, and values are 
								property options as described in *Property Options* below
	
	Property Options:
		blacklist			-	Array of RegExp objects or Java regex strings that 
								describe the disallowed Java classes for this 
								property value or this function's execution.
								Overrides default _blacklist_ 
								
		whitelist			-	Array of RegExp objects or Java regex strings that 
								describe the allowed Java classes for this property 
								value or this function's execution. 
								
								Overrides default _whitelist_ and function _blacklist_
		before				-	function to run before calling the native version. 
								See <Function.before>
								
		after				-	function to run before calling the native version. 
								See <Function.after>. be sure 
								
		returnProxy			-   Causes the return from this function to be wrapped 
								via <Myna.Sandbox.createProxy>. If this is a JS object
								it will be passed as _options_ to <Myna.Sandbox.createProxy>,
								if this is a string, then the _returnProxy_ of the named 
								function will be used. If set to boolean true, then the 
								original _options_ object passed to create Proxy will be used
								
								
	Example:
	(code)
		var javaFile= new java.io.File("/tmp/sandbox")
		var proxyFile = Myna.Sandbox.createProxy(
			javaFile,
			{
				blacklist:".*",
				whitelist:[
					"^java.lang.*$",
					"^java.io.File$",
				],
				propertyBlacklist:[
					"^set.*",
					"^list.*",
					"^mk.*",
					"^delete.*",
					"^create.*"
				],
				after:function(){
					var chain = arguments.callee.chain;
					var f = chain.lastReturn; 
					if (f instanceof java.io.File){
						
						if (!/^\/tmp\/sandbox/.test(f.getCannonicalPath())){
							throw new Error("attempt to access invalid path")
						}
					}
					chain.returnValue = chain.lastReturn;
				},
				properties:{
					toString:{
						after:function(){
							var chain = arguments.callee.chain;
							chain.returnValue = chain.lastReturn.replace(/^\/tmp\/sandbox/,"");
						}
					}
				}	
			}
		)
		
		
	(end)
	*/	
	Myna.Sandbox.createProxy = function(o,options){
		if (o.__proxied__) return o;
		Myna.Sandbox._initLists(options)
		var result={
			"__proxied__":true
		}
		if (!options.properties)options.properties={}
		
		Object.keys(o).forEach(function(p){
			var pOptions = Myna.Sandbox._initLists(options.properties[p]||{})
			
			var isBlacklisted = (options.propertyBlacklist||[]).some(function(rs){
				return new RegExp(rs).test(p)
			})
			var isWhitelisted = (options.propertyWhitelist||[]).some(function(rs){
				return new RegExp(rs).test(p)
			})
			
			if (isBlacklisted && !isWhitelisted) return;
			//wraps a function or property call 
			var wrap = function wrap(){
				var f;
				if (typeof o[p] =="function"){
					f =o[p].createDelegate(o);
				} else {
					f = function(){
						return o[p]
					}	
				}
				
				if (pOptions.hasOwnProperty("before")){
					pOptions.before.proxyConfig = options
					pOptions.before.propertyName = p
					f = f.before(pOptions.before)	
				}
				if (pOptions.hasOwnProperty("after")){
					pOptions.after.proxyConfig = options
					pOptions.after.propertyName = p
					f = f.after(pOptions.after)	
				}
				
				if (options.hasOwnProperty("before")){
					options.before.proxyConfig = options
					options.before.propertyName = p
					f = f.before(options.before)	
				}
				if (options.hasOwnProperty("after")){
					options.after.proxyConfig = options
					options.after.propertyName = p
					f = f.after(options.after)	
				}
				
				var seal=function(f,scope){
					return function(){
						return f.apply(scope,Array.parse(arguments))
					}
				}
				// hide the execution chain behind a delegate
				f= f.createDelegate()
				
				if (typeof o[p] =="function"){
					wrap= function(){
						return f
					}
				}else {
					wrap= function(){
						return f()
					};	
				}
				return wrap()
			}
			var getter = Myna.Sandbox.wrapFunction(
				wrap,
				{
					blacklist:(pOptions.blacklist||[])
						.concat(options.blacklist||[])
						.getUnique(),
					whitelist:(pOptions.whitelist||[])
						.concat(options.whitelist||[])
						.getUnique()		
				}
			)
		
			Object.defineProperty(
				result,
				p,
				{
					get:getter,
					
					enumerable: true,
					configurable: false
				}
			)
			
		})
		return result;
		
	}
	
/* Function: executePath
	Executes the code stored in the supplied MynaPath
	
	Parameters:
		path	-	path to .js or .sjs file to execute within the sandbox
		
	See: <executeString>
	*/	
	Myna.Sandbox.prototype.executePath = function(path){
		if (!(path instanceof Myna.File)){
			path = new Myna.File(path)	
		}
		
		return this.executeString(path.readString(),path.toString());
		 
	}
/* Function: executeString
	Executes a JS string stored in the supplied MynaPath
	Parameters:
	
	*/	
	Myna.Sandbox.prototype.executeString = function(string,path){
		
		var script = <ejs>
			try{<%=string%>}catch(e){this.$error =e;}
		</ejs>;
		
		if (/\.ejs$/.test(path)){
			throw new Error("Myna.Sandbox can only execute .js or .sjs files")
			//this needs to wait until the EJS parser can be implemented as pure JS 
			/* script = "<"+"%try{%" +">" + string 
				+"<" +"%} catch(e) {this.$error =e;}%" +">\n"; */
		}
		
		var scope = this.scope
		
		
		var startWhitelist = $server_gateway.classWhitelist.toArray();
		$server_gateway.classWhitelist.clear();
		var startBlacklist = $server_gateway.classBlacklist.toArray();
		$server_gateway.classBlacklist.clear()
		var startContent = $res.clear();
		if (this.blacklist){
			$server_gateway.classBlacklist.clear();
			this.blacklist.forEach(function(r){
				$server_gateway.classBlacklist.add(r);
				
			})
		}
		if (this.whitelist){
			$server_gateway.classWhitelist.clear();
			this.whitelist.forEach(function(r){
				$server_gateway.classWhitelist.add(r);
			})
		}
		
		try{
			//var scope = $server_gateway.threadContext.initStandardObjects()
			/* var con = new Myna.HttpConnection({
				url:"http://mynajs2.org"
			})
			var http = new org.apache.commons.httpclient.HttpClient();
			scope.print=Myna.println
			scope.con = con
			scope.http = http */
		
			
			$server_gateway.executeJsString(scope,script,path);
			
			
			//Myna.include(path,scope)
		}finally{
			$server_gateway.classWhitelist.clear();
			$server_gateway.classBlacklist.clear();
			
			scope.$content = $res.clear();
			Myna.print(startContent);
			
			startWhitelist.forEach(function(r){
				$server_gateway.classWhitelist.add(r);
			})
			startBlacklist.forEach(function(r){
				$server_gateway.classBlacklist.add(r);
			})
		}
		
		
		if (scope.$error) throw scope.$error
		return this
	}


