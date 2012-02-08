/* Class: Controller
	In FlightPath, controllers (the C in MVC) are represented by the Controller 
	class. See <Overview>
	*/
	function Controller(){
		
	}
/* Topic: Overview
	In FlightPath, controllers (the C in MVC) are represented by the Controller class.
	
	Controllers are responsible for connecting requests to <Models> and <Views> 
	The consist of one or more _actions_: functions that take parameters from the 
	route, perform any necessary business logic with <Models> and render a response, 
	typically with <Views>
	
	How to load a controller:
	Controllers are normally loaded via a route (See: <Routes>), but they can 
	also be accessed via <$FP.getController>.
	
	 
	
	See:
	* <Conventions>
	* <Defining Controllers>
	* <FlightPath Overview>
	
*/

/* Topic: Conventions
	* 	Controller Names are singular, ProperCase, ex: EmployeeAction
	* 	Controller File names are in file_case, ending with "_controller", 
		ex: app/controllers/employee_action_controller.sjs
	* 	Controller definitions are discovered in this order: 
		framework/controllers/<controller_name>_controller.sjs, 
		app/controllers/<controller_name>.sjs, 
		app/modules/<module_name>/controllers/<controller_name>_controller.sjs
	*  The ini() and functions in app/controllers/global.sjs are applied before 
		any controller definitions discovered
	*	Actions are functions defined in the Controller definition file.
	*	init() and any functions starting with "_" are not considered Actions, 
		and cannot be called from <Routes> 
	*	Action names are camelCase, ex: changeStartDate()
	* 	Actions and are typically verbs that might be 
		applied to the controller, e.g.EmployeeAction.edit() rather than
		EmployeeAction.editAction()
	*	in URLs, controller and action names are in url-case, e.g. employee_action/edit/15
		or employee-action/edit/15
	*	The default route for FlightPath will connect a URL of employee_action/edit/15
		to EmployeeAction.edit({id:15})
	* 	Controllers will look for a <Model> with the same name as the controller, 
		and store a reference to it in this.model and this.<ModelName>
	* 	After executing an Action, Controllers will automatically load the View 
		with the same name as the action, ex: EmployeeAction.edit() will render 
		app/views/employee_action/edit.ejs
	*	Calling <render> or <renderContent> will cancel default view rendering
	*	Any data inteded to be rendered should be passed to the via via <data>
		or <set>   
	*/
/* Topic: Defining Controllers
	
	Controller definitions can be stored in app/controllers/<controller_name>_controller.sjs
	or in a module:app/modules/module_name/controllers/<controller_name>_controller.sjs. 
	The primary source of configuration is the <init> function. This is executed after the init() 
	function in app/controllers/global.sjs. Any functions or properties defined in 
	this file will be added to final Controller instance.
	
	Functions called from init:
	* <applyBehavior>
	* <addFilter>
	* <addLayout>
	
	
	
	Examples:
		(code)
		// app/controllers/employee_action.sjs
		
		function init(){
			// See: Behavior: MynaAuth in the docs
			// If this was in app/controlelr.global.sjs, it would aplpy to all 
			// controllers, not just EmployeeActino
			this.applyBehavior("MynaAuth",{
				whitelist:[],
				providers:Myna.Permissions.getAuthTypes(),
				redirectParams:{}
			})
		}

		function edit(params){
			// Generate ID for new record if none-supplied. That way ID will be in 
			// the URL and refreshing the page won't create a new record
			if (!params.id){
				$FP.redirectTo({
					id:this.model.genKey()
				})
			}
			
			// only get here if not re-directed
			this.set("bean",this.model.get(params);
			// this controller will automatically render 
			// app/views/employee_action/edit.ejs
		}
		(end)
	
	See: 
		* <init>
		* <set>
		* <render>
		* <renderContent>
	*/

/* Property: $page
	$page metadata object
	
	This can contain arbitrary metadata about the current page, but the following 
	properties are used by the default layout file in app/views/layouts/default.ejs
	
	Default Properties:
		css				-	*String Array.* 
							each entry should be either a complete 
							<link> tag or a URL to a css file, 
							e.g $FP.url +"static/css/global.css". If a URL does 
							NOT start with "/" or "http" it is assumed to be 
							relative to app/static/
		icon			-	*String.* favicon url. 
							Defaults to $server.rootUrl +"favicon.ico"
		scripts			-	*String/Object Array.* 
							String entries should be URLs to JavaScript source 
							files. Object entries should be in the form of 
							{type:"mime/type",src:"url"}. If a URL does NOT 
							start with "/" or "http" it is assumed to be 
							relative to app/static/   			
		title			-	*String.* Page Title. 
							Defaults to $controller.name + "."+$params.action
		tags			-	*Object Array.*
							Meta tags to add to header. Entries in the form of 
							{name:"meta tag name",content:"tag content"}
		keywords		-	*String Array.*
							"keywords" meta tag. Each entry will be joined into 
							a comma-separated list
		description		-	*String.*
							Description meta tag
		content			-	Set by <render> when including layout files. This 
							represents the current content that needs to be 
							included in the layout 
	
	
	Example:
	(code)
		//in test_controller.sjs
		function init(){
			This.$page.title ="Test"
		}
		
		function index(params){
			this.$page.css.push("css/default.css")
			this.$page.scripts.push("/app/admin.js")
		}
		
		//loads js and CSS to support a ExtJs application with Ext.Direct support
		function extIndex(params){
			// using concat instead of directly assigning values preserves any 
			// existing values set in init() 
			
			this.$page.css =this.$page.css.concat([
				"extjs/resources/css/ext-all.css",
				"css/default.css"
			])
			this.$page.scripts =this.$page.scripts.concat([
				"extjs/ext-all-debug.js",
				// this is a JSONP callback to load the API from Controller: Direct
				$FP.helpers.Html.url({
					controller:"Direct",
					action:"api",
					params:{
						callback:"Ext.Direct.addProvider",
						namespace:"$FP"
					}
				})
			])
		}
		
	(end)
*/
/* Property: data
	local request-specific data to be passed to views
	
	See:
	* <set>
*/
/* Property: name
	The name of this controller
	
*/
/* Function: addLayout 
	adds a layout layer to this this request
	
	Parameters:
		layout  -	String. Layout name, or path relative to app/layouts
		
	This layout will in included after the global default layout, the controller 
	default layout, and any previously defined layouts for this controller 
	
	
	See:
		* <Layouts>

	*/
	Controller.prototype.addLayout = function addLayout(layout){
		this.layouts.push(layout)	
	}
/* Function: setLayout 
	Sets a single layout layer to this this request, clearing any existing layouts
	
	Parameters:
	layout		-	String or Boolean. Layout name, or path relative to 
						app/layouts, or false to disable all layouts
						
	Detail:
		 disables global and controller default layouts. If _layout_ is a layout 
		 name or path, then that will be the only layout applied 
	
	
	See:
		* <Layouts>
	*/	
	Controller.prototype.setLayout = function setLayout(layout){
		if (layout){
			this.layouts =[layout]
		} else {
			this.layouts=[]
		}
	}
/* Function: addFilter 
	Adds an action filter
	
	Parameters:
		filter		-	Function or Array. Filter function to execute, or Array of 
							filter functions to execute. See *Filter Function Parameters*
							below
							
		options		-  *Optional, default see below*
							JS struct, see *Options* below		
	
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
		controller	-	Object reference to the controller to which this filter is applied
		action		-	String name of action requested
		params		-	the "params" argument passed to the action
		response		-	The return from the action. This is always null for 
							"beforeAction" filters
		
	Events:
		beforeAction		-	fired before executing an action function. Return 
								false to cancel execution, return a JS object to 
								supply new "params" to the action. Normally used to 
								alter params or cancel routing, such as for authentication
									
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
		Filters are functions run before or after actions and/or before and 
		after rendering the view for an action. 
		Filters, by default, are run before every action, but can be applied to
		only specific actions. Great uses of filters are authentication and 
		logging. Filters are only executed in standard request handling, 
		<callAction>, and <include>. Direct execution of an action will not 
		trigger filters.
				
		
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
		
		
		// Functions that begin with "_" are not considered actions and 
		// are excluded from browser requests
		function _auth(controller,action,params){
			if (!$cookie.getAuthUser()){
				$FP.redirectTo({
					controller:"Auth",
					action:"login"
				})
				//unnecessary, becasue redirecTo halts processing, but good practice
				return false; //cancels action
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
				// calling render or renderContent prevents default view from rendering
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
	
	See:
		* <Behaviors>
	*/	
	Controller.prototype.applyBehavior = function applyBehavior(name,options){
		if (!(name instanceof Array)){
			name = [name]
		}
		var $this= this;
		name.forEach(function(name){
			var b=new Myna.File($FP.dir,"app/behaviors/controllers",$FP.c2f(name)+".sjs")
			if (!b.exists()) {//check in framework
				b=new Myna.File($FP.frameworkFolder,"behaviors/controllers",$FP.c2f(name)+".sjs")
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


/* Function: callAction
	Call an action as an inline function.
	
	Parameters:
		action	-	action name to execute
		params	-	*Optional, default {}*
					params to pass to the action

	Detail:
	Calling this function on a controller will execute the specified action 
	"inline", meaning without generating output, and will return whatever the 
	action returns. Before and after action filters are also triggered. This 
	can be useful for marshaling several actions in one request, or for providing
	alternate ways of calling actions (see <framework.controllers.DirectController>)
	
	Example:
	(code)
		//triggers filters, so will fail if cur user is not authorized
		var empList = $FP.getController("employee").callAction("list",params);
	(end)
	
	Note: 
	You can also call actions directly from a controller, but filters won't be
	triggered.
	
	(code)
		// does not run filters, but might render output if render() or 
		// renderContent() is called inside this action
		var empList = $FP.getController("employee").list(params);
	(end)
	
		
	*/
	Controller.prototype.callAction = function callAction(action,params){
		params = ({action:action}).setDefaultProperties(params||{});
		var renderstate = this.rendered;
		this.rendered = true
		var ret= this.handleAction(params,true)
		this.rendered = renderstate
		return ret;
	}

/* Function: include
	Call an action and includes its output in the current request
	
	Parameters:
		action	-	action name to execute
		params	-	*Optional, default {}*
					params to pass to the action

	Detail:
	Calling this function on a controller will execute the specified action, 
	appending any output generated to the current request. This will also return 
	any response from the action. Before and after action filters are also 
	triggered. This can be useful for including several actions in one request.
	
	Example:
	(code)
		// triggers filters, so will fail if cur user is not authorized
		// includes employee listing table in the current view
		$FP.getController("employee").callAction("list",params);
	
	(end)
	
		
	*/
	Controller.prototype.include = function include(action,params){
		
		params = ({
			controller:this.name,
			action:action
		}).setDefaultProperties(params||{});
		return this.handleAction(params)
	}
/* handleAction
	internal function to execute an action and return the result 
	*/
	Controller.prototype.handleAction = function handleAction(params,inline){
		this.$params =params
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
		if (params.id && c.model && c.model.primaryKey) {
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
/* Function: init
	Initializes a controller instance
	
	Whenever a controller is instantiated, init() is run to configure the 
	instance. First the init() in the controller base class is run, then the 
	init() in app/controllers/global.sjs, and finally the init() in 
	app/controllers/<name>_controller.sjs
	
	This is a good place to call this.applyBehavior, this.addFilter and this.add/setLayout
	
	See Also:
	* <applyBehavior>
	* <addFilter>
	* <addLayout>
	*/
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
				icon:$server.rootUrl +"favicon.ico",
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
							undefined, see *Options* below:
							
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
	
	View Scope properties:
		$controller				- A reference to the controller that called this view
		$model					- A reference to this controllers default model, may be null
		$params					- A reference to the params of the most recent action
		$page					- a reference to this controller's <$page> property
		getElement				- a reference to <getElement>
		[data properties]		- all of this controller's <data> properties are available as global variables
		[$FP.helpers classes]	- "Html" refers to $FP.helpers.Html, etc
		
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
		
		//in app/views/person/person_do_stuff.ejs
		<%=getElement("form_wrap",{title:"Edit Employee"})%>
		<form action="<%=Html.url({action:"save",id:bean.id})%>" method="post"> 
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
		<%=getElement("form_wrap",{type:"end"})%>
		
		
		//in app/elements/form_wrap.ejs
		<@if type == "end">
			</div>
		<@else>
			<div class="form_wrap">
			<div class="caption"><%=title||""%></div>
		</@if>
		
		//in app/elements/form_footer.ejs
		</div>
	(end)
								
	See:
	* <Views>
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
					getElement:function() { return $this.getElement.apply($this, Array.parse(arguments)); }
				},
				$this.data
			])
			$FP.helpers.forEach(function(helper) { helper.$view = scope; });
			$res.clear()
			//include the view
				Myna.include(viewFile,scope);
			
			//include any defined layouts
			this.layouts.reverse().forEach(function(layout){
				
				var path = $application.directory +"app/views/layouts/" + layout
				if (!/.[e|s]js$/.test(path)) path += ".ejs"
				layout = new Myna.File(path)
				
				if (layout.exists()){
					scope.$page.content = $res.clear()
					Myna.include(
						layout,
						scope
					);			
				}
			});
			
			
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
						
		contentType		-	*Optional, default text/html for strings, 
								application/octet-stream for binary* 
							MIME type of _data_. If "" or null, the default will
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
/* Function: getElement 
	renders an HTML template returns the content as a string
	
	Parameters:
		element		-	name of an element template, should map to
						app/views/elements/_element_ (can be a path like "common/header.ejs")
						app/views/elements/<current controller name>/_element_.ejs, or
						app/views/elements/_element_.ejs, 
						
		options		-	any extra global properties to pass to the template
		
	Element Scope properties:
		$controller				- A reference to the controller that called this element
		$model					- A reference to this controllers default model, may be null
		$params					- A reference to the params of the most recent action
		$page					- a reference to this controller's <$page> property
		[data properties]		- all of this controller's <data> properties are available as global variables
		[options properties]	- all _options_ properties are available as global variables
		[$FP.helpers classes]	- "Html" refers to $FP.helpers.Html, etc
		
	This function is normally used inside view templates. See <render> for example usage
			
	Examples:
	(code)
		//in app/views/test/index.ejs
		
		<%=getElement("shared/common_commonlinks.ejs")%>
		<%=getElement()%>
	(end)
	
	See:
	* <Elements>
	*/
	Controller.prototype.getElement = function renderElement(element,options){
		if (!options) options = {}
		var e = new Myna.File($application.directory ,"app/views/elements",element)
		if (!e.exists()){
			e =new Myna.File($application.directory ,"app/views/elements",this.name , element + ".ejs")
		}
		if (!e.exists()){
			e = new Myna.File($application.directory ,"app/views/elements", element + ".ejs")
		}
		var $this = this;
		var scope = $FP.mergeClasses([
			$FP.helpers,
			{
				$controller:$this,
				$model:$this.model,
				$page:$this.$page,
				$params:$this.$params,
				getElement:function() { return $this.getElement.apply($this, Array.parse(arguments)) }
			},
			$this.data,
			options
		])
		
		return Myna.includeContent(e,scope);
	}
/* Function: set
	Sets a property on <data>
	
	Parameters:
		prop		-	Either String property name to set, or JS object containing 
						key/value pairs. This will overwrite same-named properties 
						but will preserver any other existing properties  
		val			-	value to set
		
	All top level properties of <data> become global variables in views and elements. 
	
	Returns _val_
	
	Examples:
	(code)
	function myAction(params){
		//set single property
		this.set("firstName","Bob")
		
		//set multiple properties, preserves "firstName" set earlier
		this.set({
			lastName:"Dobb",
			age:56
		})
		
		//you can also directly manipulate the data object
		this.data.position="Slackmaster"
	}
	(end)
	
	*/
	Controller.prototype.set = function set(prop,val){
		if (arguments.length == 1){
			prop.applyTo(this.data,true);
		} else {
			this.data[prop] = val
		}
		return val;
	}