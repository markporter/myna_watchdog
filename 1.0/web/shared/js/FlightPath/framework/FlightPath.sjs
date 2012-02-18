/* Class: $FP
	Core framework instance for Myna FlightPath
	
	*/
	$server_gateway.threadScope.$FP=null;//this saves 500ms, don't ask me why
/* Property: dir
	MynaPath to the base directory for this FLightPath app
	
	Example:
	> file:/www/myna_dev/my_app
	
	See: <$application.directory>
	*/
	var dir = $application.directory

/* Property: url
	URL to the FlightPath app, minus server name	
	
	Example:
	> myna_dev/my_app/
	
	See: <$application.url>
	*/
	var url = $application.url

/* Property: version 
	FlightPath version
	*/
	var version="1.0"
/* Property: config
	Config from $application.config
	*/
	var config={}

/* _controllerClasses 
	private controller cache
	*/
	var _controllerClasses={}

/*  _modelClasses 
	private model cache
	*/
	var _modelClasses={}
/* mergeModels
	private factory function to merge models
	*/
	function mergeModels(model,modelName){
		var classList = [
			model,
			new $FP.Model(),
			"app/models/global.sjs",
		]
		
		var m = new Myna.File(
			$FP.dir,
			"app/models",
			c2f(modelName) + "_model.sjs"
		);
		if (!m.exists()){	//check for module path
			m = new Myna.File($FP.dir,"app/modules")
				.listFiles(function(f){return f.isDirectory() && /^\w+$/.test(f.fileName)})
				.map(function(f){
					return new Myna.File(
						f,
						"models",
						c2f(modelName) + "_model.sjs"
					)
				})
				.filter(function(f){return f.exists()})
				.first(false)
		}
		if (!m){	//check in the framework
			m = new Myna.File(
				$FP.frameworkFolder,
				"models",
				c2f(modelName) + "_model.sjs"
			);
		}
		if (!m.exists()){
			m ={init:function(){},notDefined:true}
		}
		
		classList.push(m)
		
		var result =mergeClasses(classList)
		result.name=modelName
		return result;
	}
/* init
	Internal initialization, should not be called by apps
	*/
	function init(forceReload){
		var core;
		core= this;
		$application.config.applyTo(this.config,true)
		if (
			"purpose" in this.config
			&&	$server.purpose.toLowerCase() in this.config.purpose 
		){
			this.config.purpose[$server.purpose.toLowerCase()].applyTo(this.config,true)
		}
		
		if (!this.config.frameworkFolder) this.config.frameworkFolder = this.dir
				
		this.appname = $application.appname
		
		this.modelManagers ={}
		if (this.config.ds) {
			if (typeof this.config.ds == "string") {
				this.config.ds={"default":this.config.ds}	
			}
			this.config.ds.forEach(function(ds,alias){
				core.modelManagers[alias] = new Myna.DataManager(ds)
	
				core.modelManagers[alias].getModel = core.modelManagers[alias].getManager
				core.modelManagers[alias].modelExists = core.modelManagers[alias].managerExists
				core.modelManagers[alias].getManager = core.getModel
			})
		}
		this.frameworkFolder = this.config.frameworkFolder; 
		Myna.include(this.frameworkFolder + "/Controller.sjs",this)
		Myna.include(this.frameworkFolder +"/Model.sjs",this)
		this.helpers={}
		new Myna.File(this.frameworkFolder +"/helpers").listFiles("sjs").forEach(function(f){
			var name =f2c(f.fileName.listBefore("."),true);
			core.helpers[name]=Myna.include(f,{});
		})
		var local_helpers = new Myna.File("app/helpers");
		if (local_helpers.exists()){
			new Myna.File("views/helpers").listFiles("sjs").forEach(function(f){
				var name =f2c(f.fileName.listBefore("."),true);
				core.helpers[name]=Myna.include(f,core.helpers[name]||{});
				
			})
		}
		
		this.loadedAt = new Date()
		
		$FP = core;
		Myna.include($FP.frameworkFolder +"/Flash.sjs")
		
		return core;
	}
/* Function: c2f
		see <camelNameToFileName>   
	*/
/* Function: camelNameToFileName 
	Converts the camelCase formatted name of a controller or action to a file 
	name format  
		
		Parameters: 
			name	- name to convert
			
		
	*/
	function camelNameToFileName(name){
		if (typeof name != "string") throw new Error("invalid name '" + String(name) +"'")
		return name.replace(/[A-Z]/g,function(str,offset){
			if (offset ==0){
				return str.toLowerCase();	
			} else {
				return "_" + str.toLowerCase();	
			}
		})
	}
	
	var c2f=camelNameToFileName;
/* Function: f2c
		see <fileNameToCamelName>   
	*/
/* Function: fileNameToCamelName 
	Converts the filename formatted name of a controller or action to a 
	camel-cased name format  
		
		Parameters: 
			name			- 	name to convert
			capFirst		-	*Optional, default false*
								Whether to capitalize the first letter. Set this to true 
								for controller names
			
		
	*/
	function fileNameToCamelName(name,capFirst){
		if (typeof name != "string") throw new Error("invalid name '" + String(name) +"'")
		return name.split(/[-_]/).map(function(part,index){
			if (index == 0 && !capFirst){
				return part.toLowerCase();
			} else {
				return part.titleCap();
			}
		}).join("")
	}
	var f2c=fileNameToCamelName
/* Function: getController
	factory function to find a a controller by name, instantiate it,  
	initialize it, and return it. 
	
	This is normally called by <handleAction>, but can also be used to call an 
	action in an arbitrary controller
	
	Parameters:
		controllerName		-	Name of controller to include
	*/
	function getController(controllerName){
		var controllerClass =function(){
		
		};
		var controller;
		if (controllerName in _controllerClasses) {
			controllerClass.prototype=_controllerClasses[controllerName];
		} else {
			var classList = [
				new this.Controller(),
				"app/controllers/global.sjs",
			]
			
			controller = new Myna.File(
				$FP.dir,
				"app/controllers",
				c2f(controllerName) + "_controller.sjs"
			);
			if (!controller.exists()){	//check for module path
				controller = new Myna.File($FP.dir,"app/modules")
					.listFiles(function(f){return f.isDirectory() && /^\w+$/.test(f.fileName)})
					.map(function(f){
						
						return new Myna.File(
							f,
							"controllers",
							c2f(controllerName) + "_controller.sjs"
						)
					})
					.filter(function(f){return f.exists()})
					.first(false)
			}
			
			if (!controller){	//check in the framework
				controller = new Myna.File(
					$FP.frameworkFolder,
					"controllers",
					c2f(controllerName) + "_controller.sjs"
				);
			}
			if (!controller.exists()) return null
			classList.push(controller)
			controllerClass.prototype = mergeClasses(classList)
				
			if (controllerClass.prototype.notFound){
				return null	
			} else {
				var existingFunctions = $FP.Controller.prototype.getProperties().filter(function(prop){
					return (typeof $FP.Controller.prototype[prop] === "function")
				})
				//label all the action functions
				controllerClass.prototype.getProperties().forEach(function(prop){
					if (
						typeof controllerClass.prototype[prop] === "function" 
						&& !/^_/.test(prop)
						&& !existingFunctions.contains(prop)
					){
						controllerClass.prototype[prop].action=prop
					}	
				})
				//init merged class
				controllerClass.prototype.init(controllerName);
				_controllerClasses[controllerName] = controllerClass.prototype
			}
		}
		
		return new controllerClass()
	}
/* Function: getControllerNames
	returns an array containing all the available controller names
	*/
	function getControllerNames(){
		var names= new Myna.File("app/controllers")
			.listFiles("sjs")
			.filter(function(file){
				return $FP.f2c(file.fileName.listBefore("_"),true);
			})
			.valueArray("fileName")
			.map(function(fileName){
				return $FP.f2c(fileName.listBefore("_"),true);
			})
		//search modules for controllers
		var controllerFolders = new Myna.File($FP.dir,"app/modules")
			.listFiles(function(file){
				return file.isDirectory() && /^\w+$/.test(file.fileName)
			})
		controllerFolders.forEach(function(folder){
			names =names.concat(
				new Myna.File(folder,"controllers").listFiles("sjs")
				.filter(function(file){
					return /_controller.sjs$/.test(file.fileName);
				})
				.valueArray("fileName")
				.map(function(fileName){
					return $FP.f2c(fileName.listBefore("_"),true);
				})
				.filter(function(name){//prevent duplicate names
					return ! names.contains(name)
				})
			)
			
		})
		//search framework for controllers
		names =names.concat(
			new Myna.File($FP.frameworkFolder,"controllers").listFiles("sjs")
			.filter(function(file){
				return /_controller.sjs$/.test(file.fileName);
			})
			.valueArray("fileName")
			.map(function(fileName){
				return $FP.f2c(fileName.listBefore("_"),true);
			})
			.filter(function(name){//prevent duplicate names
				return ! names.contains(name)
			})
		)
			
		
		
		return names
	}
/* Function: getModel
	factory function that finds, loads, and initializes a model by name
	
	Parameters:
		modelName	- name of model to load	
	*/
	function getModel(modelName){
		
		var model;
		
		if (modelName in _modelClasses) {
			model=_modelClasses[modelName];
		} else {
			model = mergeModels({},modelName);
			
			if (!model.manager) model.manager ="default"
			
		
			if (model.manager in $FP.modelManagers){
				var mm = $FP.modelManagers[model.manager]
				var realName = model.tableName||model.realName||modelName;
				
				try{
					var manager = mm.getModel(realName)
				} catch(e){
					manager={notTable:true}
					//ok, lets try the other managers:
					$FP.config.ds.getKeys().some(function(alias){
						if (alias!=model.manager){ //this one already failed
							var mm = $FP.modelManagers[alias]
							try{
								manager = mm.getModel(realName)
								return true;
							} catch(e){
								return false;
							}
						}
					})
				}
				manager.setDefaultProperties(model)
				manager.after("init",model.init)
				_modelClasses[modelName]=model = manager;
			}
			model.init()
			
		}
		
		
		return model
		
	}
/* Function: getParams
	marshals parameters from the URL route and any url or form variables, and 
	returns merged params
	*/
	function getParams(){
		var meta ={
			usingHomeRoute:false,
			usingPageRoute:false,
			routes:[],
		}
		var restParams  = $server.requestUrl
			.after($server.currentUrl)
		
		restParams = restParams?restParams.before(1):"";	
		var params = false;
		if (restParams.length) {
			restParams= restParams.split("/")
			if ($server.requestScriptName) restParams.push($server.requestScriptName)
		} else if ($server.requestScriptName){
			restParams = [$server.requestScriptName]
		} else {
			
			if (this.config.homeRoute){
				meta.usingHomeRoute=true
				var ha = this.config.homeRoute;
				restParams=[$FP.c2f(ha.controller)];
				if ("action" in ha) restParams.push($FP.c2f(ha.action))
				if ("id" in ha) restParams.push(ha.id)
				if ("params" in ha) params= ha.params
			} else {
				meta.usingPageRoute=true
				restParams=["page","home"]
			}
		}
		meta.urlParts = restParams
		
		var routes=this.config.routes
		if (restParams.length){
			var controllerNames = meta.controllerNames=getControllerNames()
			var foundOne = routes.some(function(route,index){
				var mr;
				meta.routes.push(mr={
					name:route.name,
					pattern: route.pattern,
					tokens:{}
				})
				if (!route.pattern.listLen("/") == restParams.length) {
					mr.selected = false
					mr.reason = "route pattern length != urlParts length"
					return false;
				}
				
				var localParams=mr.matchedValues=route.filter(function(v,k){
					return !"name,pattern".listContains(k)
				})
				
				function testToken(p,value){
					var mt;
					mr.tokens[p] = mt ={comparedTo:value}
					
					if (p.left(1) == "$"){
						var paramName = p;
						if (p.right(1) == "*"){
							paramName = p.before(1)
							value = restParams.slice(index+1).join("/")
							mt.matched = true
							mt.matchedValue = value
						} else if (p.right(1) == ")"){
							var parts = p.match(/^(\$\w+)\((.*?)\)$/);
							paramName =parts[1];
							var regex = new RegExp(parts[2],"i")
							if (!regex.test(value)) {
								mt.matched =false
								mt.reason = "did not match regex " + regex
								return false
							}
						}
						
						route.forEach(function(v,k){
							if (v == paramName){
								localParams[k] = value
							}
						})
						mt.matched = true
						return true
					} else {
						if (p == String(value).toLowerCase() || new RegExp(p,"i").test(value)){
							mt.matched = true
							return true;
						} else {
							mt.matched = false
							mt.reason = <ejs>
								p == value.toLowerCase() != <%=p == String(value).toLowerCase()%>
								AND
								new RegExp("<%=p%>","i").test("<%=value%>") !=<%=new RegExp(p,"i").test(value)%>
							</ejs>
							return false;
						}
						 
					}
				}
				var matchedAll = route.pattern.split("/").every(function(p,index){
					if (index == 0 && p.left(1) == "["){
						var method  = p.match(/^\[(.*?)\]/)[1];
						if (!testToken(method,$req.type)) return false
						p = p.after(p.indexOf("]")+1)
					}
					return testToken(p,restParams[index])
				})
				
				if (!matchedAll && index < routes.length){
					mr.selected = false
					mr.reason = <ejs>
						Some route parts did not match URL
					</ejs>	
					return false;
				}
				
				localParams.controller = localParams.controller||"";
				localParams.action = localParams.action||"index";
				if (/^[a-z0-9-_]+$/.test(localParams.controller)){
					localParams.controller = f2c(localParams.controller,true)
				}
				
				if (/^[a-z0-9-_]+$/.test(localParams.action)){
					localParams.action = f2c(localParams.action,false)
				}
				
				var controllerExists = controllerNames.contains(function(c){
						return c == localParams.controller
				})
				if (controllerExists){
					var actionExists = getController(localParams.controller).getActions().contains(function(a){
						return a.action==localParams.action
					}) 
					if (actionExists){
						params = localParams;
						mr.selected = true
						return true
					} else {
						mr.selected = false
						mr.reason = <ejs>
							Action <%=localParams.action%> not found in <%=localParams.controller%>
						</ejs>
						return false
					}
				} else {
					mr.selected = false
					mr.reason = <ejs>
						Controller name <%=localParams.controller%> not found in controllerNames
					</ejs>
					return false
				}
			})
			if (foundOne){
				if ($FP.config.debug){
					Myna.log("debug","Route metadata for " + restParams.join("/"),Myna.dump(meta,"Routing Metadata",7));
				}
			}else{
				Myna.log("warning","failed route for " + restParams.join("/"),Myna.dump(meta,"Routing Metadata",7));
			}
		} else {
			
		}
		
		$req.rawData.forEach(function(v,k){
			if (v === "") $req.rawData[k] = null 
		})
		
		params = $req.rawData.setDefaultProperties(params);
		 
		
		return params;
	}

/* Function: handleRequest
	Main entry point for requests
	*/
	function handleRequest(){
		try{
			if (this._handling_request) {
				return;
			}
			this._handling_request=true
			var path =$server.requestUrl
				.after($server.currentUrl)
					
			if (path.listFirst("/") == "static"){
				
				var f = new Myna.File(
					$FP.dir,
					"app",
					path,
					$server.requestScriptName
				)
				$res.serveFile(f)
			} else {
				var params =$req.params = getParams();
				
				if(!params.controller){
					$application._onError404();
				}
				
				var c = getController(params.controller)	
				if (!params.action) params.action ="index"
				c.handleAction(params);
				$req.handled=true;
			}
		} finally{
			this._handling_request=false	
		}
	}

/* Function: mergeClasses
	factory function merges any number of objects, classes, or MynaPaths and 
	returns the result
	
	Parameters:
		classes		-	Array of objects, class functions, or MynaPaths
	
	Detail:
		Takes a number of "class" entries. See *Class Types* below. Any "init" 
		functions will be chained such that they will executed in LIFO order, 
		i.e the init function on the first argument will be executed last 
		
	Class Types:
		Class Function			-	This is a constructor function. This will be 
										called with the "new" operator before merging
		MynaPath/Myna.File	-	This will be included into an empty scope, which
										will then be merged.
		Object					-	Objects will merged directly
	*/
	function mergeClasses(classes){
		var result = classes.reduce(function(obj,part){
			var init = obj.init;
			
			if (typeof part == "function"){
				new part().applyTo(obj,true)
			} else if (typeof part == "string" || part instanceof Myna.File){
				if (new Myna.File(part).exists()){
					Myna.include(part,{}).applyTo(obj,true);
				}
			} else {
				part.applyTo(obj,true)	
			}
			
			if (init && init !== obj.init) obj.before("init",init)
			
			
			return obj
		},{})
		return result
	}
/* Function: objectToUrl
	converts a JS object into a URL query string.
	
	Parameters:
		object				-	object to convert
		preserveFpParams	-	*Optional, default false*
								Normally,"controller","action" and "id"
								parameters are ignored. Setting this to true 
								allows them to be included. 
		
	Note:
		The resulting string will not start with a "?" or a "&". This function 
		ignores any properties that start with "$". Unless _preserveFpParams_ is 
		set to true, the parameters "controller", "action" and "id" will also be 
		ignored. This function is useful for converting controller params into 
		URL params 
	*/
	function objectToUrl(object,preserveFpParams){
		var result =[]
		function addProp(p,v){
			if (v==null) v=""
			result.push( escape(p) +"="+escape(v))	
		}
		object.forEach(function(v,p){
			if (p+"$array" in params && params[p+"$array"].length > 1){	
				for (var i=0; i < v.length-1; ++i){
					addProp(p,params[p+"$array"][i])	
				}
			} else if (!/\$/.test(p) ) {
				if (preserveFpParams || !"action,controller,id".listContains(p)){
					addProp(p,v)
				}
			}
					
		})
		
		return result.join("&")
	}
	
/* Function: redirectTo
	redirects the browser to another controller/action, cancels further processing.
	
	Parameters:
		options	-	options object, see below
		
	Options:
		route		-	*Optional, default "default"*
						Name of route to construct
		controller	-	*Optional, default null*
						Name of controller to redirect to
		action		-	*Optional, default null*
						Name of action to redirect to. If controller is not also 
						defined, then the current controller is assumed
		id			-	*Optional, default null*
						ID to redirect to. If controller or action are not also 
						defined, then the current controller and action is assumed
		params		-	*Optional, default null*
						JS object containing URL parameters to include in the redirect
		anchor		-	*Optional, default null*
						Anchor (#) string to append to redirect
		<others>	-	Any other property will be considered a $flash key. Any 
						property that starts with "flash" will remove "flash" 
						and be camelCased before using as a flash key  
		
	
	*/
	function redirectTo(options){
		var url=this.helpers.Html.url(options);
		delete options.id;
		delete options.action;
		delete options.controller;
		delete options.params;
		delete options.anchor;
		delete options.route;
		
		options.forEach(function(v,k){
			if (/^flash/.test(k)){
				delete options[k]
				k = k.replace(/^flash/,"")
				k = k.left(1).toLowerCase()+k.after(1)
				options[k]=v;		
			}
		})                 
		$flash.set(options)
		$res.redirect(url)
		
		
		
	}


