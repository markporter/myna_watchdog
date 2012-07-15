
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
		
		function wrap(f){
			return $this.wrapFunction(f,options.blacklist,options.whitelist)
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
			}else if (source && typeof source == "object" && source.hasOwnProperty){
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
/* Function: wrapFunction
	creates a function wrapper with specific permissions.
	
	Parameters:
		f			-	function reference to wrap
		blacklist	-	Array of RegExp objects or Java regex strings that 
						describe the disallowed Java classes
		whitelist	-	Array of RegExp objects or Java regex strings that 
						describe the allowed Java classes. Overrides _blacklist_
	
	*/	
	Myna.Sandbox.prototype.wrapFunction = function(f,blacklist,whitelist){
		
		return function(){
			
			var startWhitelist = $server_gateway.classWhitelist.toArray();
			var startBlacklist = $server_gateway.classBlacklist.toArray();
			
			if (blacklist){
				$server_gateway.classBlacklist.clear();
						
				blacklist.forEach(function(r){
					$server_gateway.classBlacklist.add(r);
				})
			}
			if (whitelist){
				$server_gateway.classWhitelist.clear();
				whitelist.forEach(function(r){
					$server_gateway.classWhitelist.add(r);
				})
				
			}
			
			try{
				
				f.apply(this,Array.parse(arguments))
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


