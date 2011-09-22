/* Class: FlightPath
	Core framework class for Myna FlightPath
*/
$server_gateway.threadScope.$FP=null;//this saves 500ms, don't ask me why
/*  */
/* Property: dir
	shortcut to $application.directory
*/
var dir = $application.directory

/* Property: url
	shortcut to $application.url
*/
var url = $application.url
var initialized=false;
var config={
	
}

/* Property: version 
	FlightPath version
*/
var version="1.0"


/* Property: _controllerClasses 
	private controller cache
*/
var _controllerClasses={}

/* Property: _modelClasses 
	private model cache
*/
var _modelClasses={}
/* mergeModels */
	function mergeModels(model,modelName){
		var classList = [
			model,
			"app/models/global.sjs",
		]
		
		var m = new Myna.File(
			$FP.dir,
			"app/models",
			c2f(modelName) + "_model.sjs"
		);
		if (!m.exists()){	//check for module path
			m = new Myna.File($FP.dir,"app/modules")
				.listFiles(function(f){return f.isDirectory()})
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
				$FP.dir,
				"framework/models",
				c2f(modelName) + "_model.sjs"
			);
		}
		if (!m.exists()){
			m ={init:function(){}}
		}
		
		classList.push(m)
		
		var result =mergeClasses(classList)
		//Myna.printDump(result.getProperties(),modelName)
		result.init();
		return result;
	}
/* Function: init
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
		
		this.appname = $application.appname
			
		if (this.config.ds) {
			this.dm = new Myna.DataManager(new Myna.Template(this.config.ds).apply(this))
	
			this.dm.after("getManager",function(modelName){
				var chain = arguments.callee.chain
				var model = chain.lastReturn
				if (!model._configured){
					model._configured=true;
					
					
					model = mergeModels(model,modelName)
				}
				return model;
			})
		}
		
		Myna.include("framework/Controller.sjs",this)
		Myna.include("framework/Model.sjs",this)
		this.helpers={}
		new Myna.File("framework/helpers").listFiles("sjs").forEach(function(f){
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
		Myna.include("framework/Flash.sjs")
		
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
					.listFiles(function(f){return f.isDirectory()})
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
					$FP.dir,
					"framework/controllers",
					c2f(controllerName) + "_controller.sjs"
				);
			}
			//Myna.abort(controller + controller.exists())
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
		
		//Myna.printDump(c,"Controller")
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
			.map(function(file){
				return $FP.f2c(file.fileName.listBefore("_"),true);
			})
		//search modules for controllers
		var controllerFolders = new Myna.File($FP.dir,"app/modules")
			.listFiles(function(file){
				return file.isDirectory()
			})
		controllerFolders.forEach(function(folder){
			names =names.concat(
				new Myna.File(folder,"controllers").listFiles("sjs")
				.filter(function(file){
					return /_controller.sjs$/.test(file.fileName);
				})
				.map(function(file){
					//Myna.println(file)
					return $FP.f2c(file.fileName.listBefore("_"),true);
				})
				.filter(function(name){//prevent duplicate names
					return ! names.contains(name)
				})
			)
			
		})
		//search framework for controllers
		names =names.concat(
			new Myna.File($FP.dir,"framework/controllers").listFiles("sjs")
			.filter(function(file){
				return /_controller.sjs$/.test(file.fileName);
			})
			.map(function(file){
				//Myna.println(file)
				return $FP.f2c(file.fileName.listBefore("_"),true);
			})
			.filter(function(name){//prevent duplicate names
				return ! names.contains(name)
			})
		)
			
		
		//Myna.abort("names",names)
		return names
	}
/* Function: getModel
	factory function that finds, loads, and initializes a model by name
	
	Parameters:
		modelName	- name of model to load	
	*/
	function getModel(modelName){
		var modelClass =function(){
			this.init(modelName)
		};
		
		var model;
		
		if (modelName in _modelClasses) {
			model=_modelClasses[modelName];
			Myna.printConsole("using stored model for " + modelName)
		} else {
			if (this.dm && this.dm.managerExists(modelName)){
				model = this.dm.getManager(modelName)
			} else {
				model = mergeModels({},modelName)	
			}
			
			_modelClasses[modelName] = model;
			
		}
		
		//Myna.printDump(c,"Model")
		
		return model
		
	}
/* Function: getParams
	marshals parameters from the URL route and any url or form variables, and 
	returns merged params
	*/
	function getParams(){
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
				var ha = this.config.homeRoute;
				restParams=[$FP.c2f(ha.controller)];
				if ("action" in ha) restParams.push($FP.c2f(ha.action))
				if ("id" in ha) restParams.push(ha.id)
				if ("params" in ha) params= ha.params
			} else {
				restParams=["page","home"]
			}
		}
		
		/* Myna.printDump(restParams)
		Myna.printDump($server)
		Myna.abort("getparams",$req) */
		
		var routes=this.config.routes
		if (restParams.length){
			var controllerNames = getControllerNames()
			routes.some(function(route){
				if (!route.pattern.listLen("/") == restParams.length) return false;
				
				var localParams={}
				var matchedAll = route.pattern.split("/").every(function(p,index){
					if (p.left(1) == "$"){
						localParams[p.after(1)] = restParams[index];
						return true
					} else {
						return p == restParams[index].toLowerCase() 	
					}
				})
				
				if (!matchedAll) return false;
				
				[
					"controller",
					"action",
					"id"
				].forEach(function(name){
					if (name in route){
						if (route[name].left(1) =="$"){
							localParams[name] = localParams[route[name].after(1)];
						} else {
							localParams[name] = route[name];
						}
					}
				})
				//Myna.printDump(localParams)
				var controller = $FP.f2c(localParams.controller||"",true);
				var action = $FP.f2c(localParams.action||""); 
				if (controllerNames.contains(controller)){
					if (getController(controller).getActions().contains(function(a){return a.action==action})){
						params = localParams;
						//Myna.abort("matched",params)
						return true
					} else return false
				} else return false
			})
		} else {
			
		}
		
		//Myna.abort("params", params)
		//convert "" to nulls
		$req.rawData.forEach(function(v,k){
			if (v === "") $req.rawData[k] = null 
		})
		
		params = $req.rawData.setDefaultProperties(params);
		
		if (
			params.controller 
			&& /^[a-z0-9-_]+$/.test(params.controller)
		){
			params.controller = f2c(params.controller,true)
		}
		
		if (
			params.action 
			&& /^[a-z0-9-_]+$/.test(params.action)
		){
			params.action = f2c(params.action,false)
		}
		return params;
	}

/* Function: handleRequest
	Main entry point for requests
	*/
	function handleRequest(){
		try{
			if (this._handling_request) {
				Myna.printConsole("recursive")
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
		//Myna.abort("",result.init.chainArray.map(function(e){return e.toSource()}))
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
		//if (url.charAt(0) == "/") url= $server.serverUrl + url
		$res.redirect(url)
		
		//Myna.abort("<a href="+url+">"+url+"</a")
		
	}
/* Class: FlightPath.Html
	This is a library within FLightPath for creating HTML snippets 
*/


