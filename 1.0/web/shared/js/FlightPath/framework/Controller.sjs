/* Class: Controller
	base Controller class for FlightPath
	*/
	function Controller(){
		
	}
/* Property: $page
	$page metadata object
*/

/* Function: addLayout 
	adds a layout layer to this this request
	
	Parameters:
		layoutName  -	String. Layout name, or path relative to app/layouts
		only			-	*Optional, default false*
							If set to true, this is the only layout that will be applied
	
	Detail:
		Layouts are templates that wrap the content produced in a view. Layouts 
		are stored in app/views/layouts/layoutName.ejs. Layouts are layered like 
		so:
	(code)
		/app/views/layouts/default.ejs wraps
			/app/views/layouts/controllername/default.ejs wraps
				/app/views/controllername/actionname.ejs
	(end)
	
	Calling this function adds additional layouts that wrap the view, like so:
	
	(code)
		function init(){
			this.addLayout("mylayout1")
			this.addLayout("otherController/mylayout2.ejs")
		}
		
	//results in 
	/app/views/layouts/default.ejs wraps
		/app/views/layouts/controllername/default.ejs wraps
			/app/views/layouts/mylayout1.ejs wraps
				/app/views/layouts/otherController/mylayout2.ejs wraps
					/app/views/controllername/actionname.ejs	
		
	(end)
	
	You can also use the _only_ parameter to disable layering and force the use 
	of a particular layout
	
	(code)
		function init(){
			this.addLayout("mylayout1",true)
		}
		
	//results in 
		/app/views/layouts/mylayout1.ejs wraps
			/app/views/controllername/actionname.ejs	
		
	(end)	

	*/
	Controller.prototype.addLayout = function addLayout(layout,only){
		this.layouts.push(layout)	
	}
/* Function: addFilter 
	adds an action filter
	
	Parameters:
		filter		-	Function or Array. Filter function to execute, or Array of 
							filter functions to execute. See *Filter Function Parameters*
							below
							
		options		-  *Optional, default see below*
							JS struct, see *Options:* below		
	
	Options:
		when			-	*Optional, default "beforeAction"*
							When the filter should be run. see *Events* below 
							
		only			-	*Optional, default null*
							Array of String/RegExp. If defined, limit this filter to these
							action names. Mutually exclusive with _except_
							
		except		-	*Optional, default null*
							Array String/RegExp. If defined, exclude this filter from these
							action names. Mutually exclusive with _only_
	
	Filter Function Parameters:
		controller	-	Object reference to the controller to which this filer is applied
		action		-	String name of action requested
		params		-	the "params" argument passed to the action
		response		-	The return from the action. This is always null for 
							"beforeAction" filters
		
	Events:
		beforeAction		-	fired before executing an action function. Return 
									false to cancel execution, return a JS object to 
									supply new "params" to the action. Normally used to 
									alter params or cancel routing. such as for authentication
									
		afterAction			-	Fired after the action is complete but before default 
									rendering. If the action contains an explicit <render>
									or <renderContent> call then that will be executed 
									first, without triggering "beforeRender" or 
									"afterRender". Return false or make a call to <render> 
									or <renderContent> to cancel the default render. 
									Normally used for altering/adding properties to 
									controller.data prior to rendering. Might also be 
									used for custom rendering, but "beforeRender" is 
									generally a better choice for that.
									
		beforeRender		-	Fired before rendering the default view. Return false 
									or make a call to <render> or <renderContent> to 
									cancel the default render. Normally used for custom 
									renders that replace the default, such as rendering as 
									RSS, or returning JSON
									
		afterRender			-	Fired after the default render. Any changes to output
									should be made through <$res.clear>, <$res.getContent>, 
									<$res.print>, etc. Normally used to convert generated 
									output such as converting to PDF or XHTML
									
	
	Detail:
		Filters are function run before or after actions and rendering for actions. 
		Filters, by default, are run before every action, but can be applied to
		only specific actions. Great uses of filters are authentication and 
		logging. Filters are only executed in <handleAction>, such as calls from 
		web requests or <include>, vs. <call> or direct execution from another 
		action.
		
		
	Examples:
	(code)
		function init(){
			// exec an auth function before every action except
			// "home" and "status" 
			this.addFilter(
				this._auth,
				{
					except:["home","status"]
				}
			)
			
			//log only actions whose name starts with "save"
			this.addFilter(
				this._audit,
				{
					only:[/^save/i]
				}
			)
			
			this.addFilter(
				this._pdfView,
				{
					when:"afterRender"
				}
			)
			
		}
		
		
		//Functions that begin with "_" are excluded from browser requests
		function _auth(controller,action,params){
			if (!$cookie.getAuthUser()){
				$FP.redirectTo({
					controller:"Auth",
					action:"login"
				})
				//unnecessary, but good practice
				return false; //cancels actino
			}
		}
		
		function _audit(controller,action,params){
			Myna.log(
				"audit",
				controller.name + "." + action,
				Myna.dump({
					params:params,
					user:$cookie.getAuthUser()
				})
			);
		}
		
		function _pdfView(controller, action, params){
			if (params.format =="pdf"){
				this.renderContent(
					Myna.xmlToPdf(
						Myna.htmlToXhtml(
							$res.clear()
						)
					),
					"application/pdf",
					params.controller + "." + params.action + ".pdf"
				);
			}
		}
		
	(end)

	*/
	Controller.prototype.addFilter = function addFilter(filter,options){
		
		var c= this;
		if (!options) options={}
		
		options.setDefaultProperties({when:"beforeAction"})
		var events = [
			"beforeAction",
			"afterAction",
			"beforeRender",
			"afterRender"
		];
		
		if (!events.contains(options.when)){
			throw new Error("'when' parameter mus be one of " + events.join())
		}
		
		if (typeof filter === "function"){
			filter = [filter]
		}
		
		if (options.only && options.except) throw new Error('"except" and "only" are mutually exclusive ')
		filter.forEach(function(filter){
			c.getActions()
			.filter(function(def){
				if (options.except){
					return !options.except.contains(def.action)
				}
				if (options.only){
					return options.only.contains(def.action)
				}
				return true
			})
			.forEach(function(def){
				if (!c.filters[options.when][def.action]){
					c.filters[options.when][def.action] = []
				}
				c.filters[options.when][def.action].push(filter);
			})
		})
			
	}
/* Function: applyBehavior
	loads a behavior and applies it to this object
	
	Parameters:
		name		-	The ProperCased name of the behavior to load, or an array of these names,
		options	-	*Optional, defaul null*
						JS Object containing options to pass to the behavior's init 
						function
		
	Detail:
		Loads a behavior by name from app/behaviors/controllers/ or 
		framework/behaviors/controllers/, whichever is found first. Behaviors are 
		functions that are applied to the current object. <applyBehavior> should 
		be called from <init>
	
	Example:
	(code)
		//in some_controller.sjs
		function init(){
			// loads the built-in PDF andJSON filters
			// Each of these has an "init" function that adds the appropriate 
			// before and after filters
			this.applyBehavior([
				"FormatPdf",
				"FormatJson"
			]);
			
			//loads a single behavior with options
			this.applyBehavior("MynaAuth",{
				whitelist:[
					"Main.index",
					"Main.logout"
				],
				redirectParams:{
					message: "Enter your AD domain credentials",
					providers:["ldap_ad"]
				}
			});
		}
	(end)
	*/	
	Controller.prototype.applyBehavior = function applyBehavior(name,options){
		if (!(name instanceof Array)){
			name = [name]
		}
		var $this= this;
		name.forEach(function(name){
			var b=new Myna.File($FP.dir,"app/behaviors/controllers",$FP.c2f(name)+".sjs")
			if (!b.exists()) {//check in framework
				b=new Myna.File($FP.dir,"framework/behaviors/controllers",$FP.c2f(name)+".sjs")
			}
			if (!b.exists()) throw new Error("Behavior '"+name + "' does not exist.");
				
			b=Myna.include(b,{});
			
			for (var p in b){
				if (p=="init") continue;
				$this[p] = b[p];
			}
			if ("init" in b) b.init.call($this, options)
		})
		
	}
/* Function: getFilters
	returns the filter array for the requested event and action.
	
	Parameters:
		event		-	event name
		action	-	action name
		
	See:
		* <addFilter>
	*/
	Controller.prototype.getFilters = function addFilter(event,action){
		if (!this.filters[event][action]) this.filters[event][action]=[]
		return this.filters[event][action]
	}
/* Function: getActions
	returns an array of objects for each action that contain the action name 
	and action function.
	
	Object Properties:
		action	-	String action name
		handler	-	Function reference to action function
	*/
	Controller.prototype.getActions = function getActions(){
		var $this=this	
		
		return this.getProperties().filter(function(prop){
			//Myna.println(prop + ":"+(typeof $this[prop] === "function") +"&&"+$this[prop].action)
			return (
					typeof $this[prop] === "function" 
					&& $this[prop].action // actions are identified this way in $FP.getController
			)
		}).map(function(prop){
			return {
				action:prop,
				hanlder:$this[prop]
			}
		})
	}


Controller.prototype.callAction = function callAction(action,params){
	params = ({action:action}).setDefaultProperties(params||{});
	var renderstate = this.rendered;
	this.rendered = true
	var ret= this.handleAction(params,true)
	this.rendered = renderstate
	return ret;
}

Controller.prototype.include = function include(action,params){
	
	params = ({
		controller:this.name,
		action:action
	}).setDefaultProperties(params||{});
	return this.handleAction(params)
}

Controller.prototype.handleAction = function handleAction(params,inline){
	this.$params =params = params.applyTo({$inline:inline})
	var c = this;
	var action = params.action;
	if (inline){
		var content = $res.getContent()
	}
	//beforeAction filters
	if(
		! this.getFilters("beforeAction",params.action)
		.every(function(filter){
			var localResult = filter.call(c, action,params)
			
			if (localResult === undefined) return true;
			if (localResult === false) return false;
			
			params = localResult;
			return true
		})
	) return;//if any of the beforeAction filters return false, abort this action
	
	//Merge in id var
	if (params.id && c.model) {
		var idField = c.model.primaryKey
		params[idField] =params.id;
	}
	var result;
	var shouldRender;
	if (params.action in c) {
		result = c[params.action](params)||c.data;
		//afterAction filters
		shouldRender =this.getFilters("afterAction",params.action)
			.every(function(filter){
				var localResult = filter.call(c, action,params,result)
				
				if (localResult === undefined) return true;
				if (localResult === false) return false;
				
				result = localResult;	
				return true
			})
		if (!inline && shouldRender){
			//beforeRender filters
			shouldRender =this.getFilters("beforeRender",params.action)
				.every(function(filter){
					var localResult = filter.call(c, action, params,result)
					
					if (localResult === undefined) return true;
					if (localResult === false) return false;
					return true
				})
			if (shouldRender){
				c.render({action:params.action});
				//afterRender filters
				this.getFilters("afterRender",params.action)
					.every(function(filter){
						var localResult = filter.call(c, action, params,result)
						
						if (localResult === undefined) return true;
						if (localResult === false) return false;
						return true
					})
			}
		}
	}
	if (inline){
		$res.clear()
		Myna.print(content)
	} 
	
	return result;
}


Controller.prototype.afterAction = function afterAction(params){
}
Controller.prototype.beforeAction = function beforeAction(params){
	return params
}
Controller.prototype.init = function init(controllerName){
	({
		name:controllerName,
		rendered:false,
		layouts:[
			"default",//global default
			$FP.c2f(controllerName)+"/layout.ejs" // controller default
		],
		data:{},
		filters:{
			beforeAction:{},
			afterAction:{},
			beforeRender:{},
			afterRender:{}
		},
		$page:{
			css:[],
			icon:"",
			scripts:[],
			title:"",
			tags:[],
			keywords:[],
			description:null
		}
	}).applyTo(this)
	this.model =this[this.name] =$FP.getModel(this.name);
}
/* Function: render
	renders a view
	
	Parameters:
		options		-	*Optional*
							String or Object or null. If a string, the filename of the 
							view in app/views to load, minus the extension. If this is 
							null, then rendering is canceled. If this is an object or 
							undefined, see *Options:* below
							
	Options:
		controller		-	*Optional, default current controller*
								ProperCased controller folder within app/views to 
								reference. This will be converted to file format 
								automatically
		action			-	*Optional, default current action*
								camelCased action name. This will be converted to file 
								format automatically
	
	Detail:
		This function is called automatically with default _options_ whenever an 
		action function returns. This function can be called explicitly from 
		inside an action function to override this default behavior
		
		When rendering a view, all previously generated content is cleared, and 
		the view is included. Once the view is rendered, it is wrapped in any 
		defined layouts (see <addLayout>)  The following variables are available 
		in view scope, and can be directly referenced:
		
		*	Myna functions, i.e. createUuid() instead of Myna.createUuid(),
		*	$FP properties, all $FP functions and properties can be directly referenced
		* 	$controller, a reference to the controller that called this view
		*	$helpers, a reference to $FP.helpers
		*	$page, a reference to this controller's <$page> property
		*	renderElement a reference to <renderElement>
		*	This controller's <data> properties 
		
		
		
	Examples:
	(code)
		//in app/controllers/person_controller.sjs
		function doStuff(params){
			//bulk sets/replaces this.data
			this.set({
				firstName:"Bob",
				lastName:"Dobb"
			})
			
			//sets an individual property
			this.set("bean",this.Person.get({id:params.id}))
			
			// implied render, same as
			// this.render({controller:this.name,action:"doStuff"})
		}
		
		//in app/viwes/person/do_stuff.ejs
		<form action="<%=$helpers.Html.url({action:"save",id:bean.id})%>" method="post"> 
		<table width="100%" height="1" cellpadding="0" cellspacing="0" border="0" >
			<tr>
				<th class="">ID:</th><td><%=bean.id%><td>
			</tr>
			
			<tr>
				<th><%=bean.getLabel("first_name")%>:</th>
				<td><input name="first_name" value="<%=String(bean.data.first_name||"").escapeHtml()%>"><td>
			</tr>
			<tr>
				<th><%=bean.getLabel("last_name")%>:</th>
				<td><input name="last_name" value="<%=String(bean.data.last_name||"").escapeHtml()%>"><td>
			</tr>
			
			<tr>
				<td colspan="2" align="right">
					<button type="submit">Save</button>
				</td>
			</tr>
		</table>
		</form>
	(end)
								
	
	*/
	Controller.prototype.render = function render(options){
		if (this.rendered) return;
		var viewFile;
		var $this= this;
		if (typeof options === "string"){ // direct view load
			var path = options;
			if (/[-_\.]/.test(path)){
				path = path.toLowerCase().replace(/-/g,"_");
				if (!/.[e|s]js$/.test(path)) path += ".ejs"
				viewFile = new Myna.File($application.directory +"app/views/"+path)
			} else {
				viewFile = new Myna.File($application.directory +"app/views/"+$FP.c2f(path) + ".ejs")
			}
		} else {
			if (!options) options ={}
			options.checkRequired(["action"])
			if (!options.controller){
				options.controller = this.name
			}
			viewFile = new Myna.File($FP.dir,"app/views/")
				.listFiles(
					function(f){
						return f.fileName == $FP.c2f(options.controller)
						
					}
				)
				.reduce(function(base,f){
					return f.listFiles(
						function(f){
							return [
								$FP.c2f(options.controller)+"_"+$FP.c2f(options.action) + ".ejs",
								$FP.c2f(options.action) + ".ejs"
							].contains(f.fileName) 
						}	
					).first(false)
				},false)
			if (!viewFile){//Lets try raw controller name in the views root
				viewFile = new Myna.File("app/views/" + $FP.c2f(options.controller) + ".ejs")
				if (!viewFile.exists()) viewFile=false
			}
		}
		//Myna.abort("viewfile",viewFile)
		if (viewFile){
			var scope = $FP.mergeClasses([
				$FP.helpers,
				{
					$controller:$this,
					$model:$this.model,
					$page:$this.$page,
					$params:$this.$params,
					renderElement:$this.renderElement
				},
				$this.data
			])
			$res.clear()
			//include the view
				Myna.include(viewFile,scope);
			
			//include any defined layouts
			this.layouts.reverse().forEach(function(layout){
				
				var path = $application.directory +"app/views/layouts/" + layout
				if (!/.[e|s]js$/.test(path)) path += ".ejs"
				layout = new Myna.File(path)
				/* Myna.printDump(scope)
				Myna.abort() */
				if (layout.exists()){
					scope.$page.content = $res.clear()
					Myna.include(
						layout,
						scope
					);			
				}
			});
			
			
			
			
			this.afterRender();
			this.rendered =true
		} else {
			if (options.action == "index"){
				$application._onError404();
			} else {
				$FP.redirectTo({action:"index"})
			}
		}
	}
	

/* Function: renderContent
	Directly render content, bypassing default render 
	
	Parameters: 
			data 			-  String content, or binary data from 
								<Myna.File.readBinary> or from binary database query 
								(byte [])
							
			contentType -	*Optional, default text/html for strings and application/octet-stream for binary* 
								MIME type of _content_. If "" or null, the default will
								be used
							
			filename		-	*Optional, default null* if defined, a 
								"Content-disposition" response header is set to present 
								the standard "Save or Open?" dialog to the client. Use 
								this if offering a file for download, but not if you 
								expect the content to be rendered inline 
	
	See:
		<$res.printBinary>
	
	*/
	Controller.prototype.renderContent = function renderBinary(data,contentType,filename){
		if (this.rendered) return
		if (typeof data === "string") {
			data=data.toJava().getBytes()
			if (!contentType) contentType = "text/html";
		}
		
		$res.printBinary(data,contentType,filename)
		this.rendered =true;
	}
Controller.prototype.renderElement = function renderElement(element,options){
	if (!options) options = {}
	return Myna.includeContent(
		$application.directory +"app/views/elements/" + element + ".ejs",
		$FP.mergeClasses([
			Myna,
			$FP,
			options
		])
	)
}

Controller.prototype.set = function set(prop,val){
	if (arguments.length == 1){
		this.data = prop
	} else {
		this.data[prop] = val
	}
}

Controller.prototype.setLayout = function setLayout(layout){
	this.layouts =[layout]	
}

Controller.prototype.afterRender = function afterAction(params,data,rawData){
}