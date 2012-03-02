/* Class: Controller: Direct
	Framework controller class for working with Ext.Direct
	
	Stored in framework/controller/direct_controller.sjs
	
	See:
		* <Overview>
		* http://www.sencha.com/products/extjs/extdirect
	
Topic: Overview
	Normally this is all that is needed to enable Ext and Ext.Direct support in a 
	FlightPath application:
	
	(code)
		// in app/controllers/<controller_name>_controller.sjs
		// assumes Ext 3.x or 4.x is installed to static/extjs
		function index(){
			this.$page.css =this.$page.css.concat([
				"extjs/resources/css/ext-all.css",
				"default.css"
			])
			this.$page.scripts =this.$page.scripts.concat([
				"extjs/ext-all.js",
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
	
	This will create a global variable "$FP" in the browser that contains a 
	property for each controller name, which in turn will have a function for 
	each action on that controller. The signature for these functions is 
	function(params,callback){} where "params" is an object that should be used 
	as the params to the action, and "callback" is a function that will be called 
	when the AJAX callback is complete, and will contain as its first parameter, 
	the result of the action.
	
	Actions called in this way will execute their
	filters, but not produce any output. Instead, any output from the action's 
	return will be used as the return to the direct function.
	
	Examples:
	(code)
		// in app/controllers/post_controller.sjs
		// assumes Ext 3.x or 4.x is installed to static/extjs
		function index(){
			this.$page.css =this.$page.css.concat([
				"extjs/resources/css/ext-all.css",
				"default.css"
			])
			this.$page.scripts =this.$page.scripts.concat([
				"extjs/ext-all.js",
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
		
		function edit(params){
			// getData() dereferences associated beans, one level deep
			// getData(0) forces only this bean's data to be returned,
			// essentially the same as bean.data
			return this.model.get(params).getData();
		}
	(end)
	
	(code)
		// in app/views/post/post_index.ejs
		
		<script>
			Ext.onReady(function(){
				
				//makes a callback to Post.list.
				
				$FP.Post.edit({},function(result){
					// this will be the data for a new Post
					// including "id" and  default values
					console.log(result)
				})
			})
		</script>
	(end)
	
	
		
*/

/* Action: api
	returns an Ext.Direct api.
	
	
	Parameters:
		namespace		-	*Optional, default null*
								if defined, then this namepace will be added to the 
								generated API. This results in the Controller objects 
								being scoped to this namespace. Without this property, 
								the Controllers will be created as global variables. 
								See _scriptvar_ for special JavaScript 
								
		scriptvar		-	*Optional, default null*
								If set, the response will be JavaScript like this: 
								"var _scriptvar_ = {API}". If _namespace_ is defined 
								then a call to Ext.namespace() will be made first, and 
								_scriptvar_ will be set in that namespace
		callback			-	*Optional, default null*
								If set, the response will be JSONP. cat call to the 
								client-side function _callback_ will be made
	
	Detail:
		Returns an API of all controllers, and their actions, available in this application, including 
		framework controllers and module controllers.
		By default, raw JSON is returned from this action, which makes it 
		appropriate for being called from an Ext.Ajax.request(). Passing _scriptvar_
		will return JavaScript appropriate for a <script src=""> call. Passing callback
		will return JavaScript appropriate for a <script src=""> that calls a callback 
		function to set up the the Direct API.  
		
		The easiest way to load the Direct API is to use _callback_ and include 
		the API in the scripts list in the default layout for a particular action
	
		(code)
			// in app/controllers/<controller_name>_controller.sjs
			// assumes Ext 3.x or 4.x is installed to static/extjs
			function index(){
				this.$page.css =this.$page.css.concat([
					"extjs/resources/css/ext-all.css",
					"default.css"
				])
				this.$page.scripts =this.$page.scripts.concat([
					"extjs/ext-all.js",
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
		
	See:
		* JSONP http://wikipedia.org/wiki/JSONP
*/
var model=null
function api(params){
	var API ={
		url:$application.url+$FP.c2f(this.name)+"/router",
		type:"remoting",
		actions:{}
	}
	
	if (params.ns) API.ns = params.ns;
	if (params.namespace) API.namespace = params.namespace;
	$FP.getControllerNames().forEach(function(name){
		var controller = $FP.getController(name)
		/* Myna.println(name)
		Myna.println(controller.name) */
		API.actions[name]=[]
		controller.getActions().forEach(function(def){
			API.actions[name].push({
				name:def.action,
				len:1
			})
		})
		
	})
	if (params.callback){
		this.renderContent(params.callback +"(" +API.toJson() +")","text/javascript");
	} else if (params.scriptvar){
		var content = [];
		if (params.ns){
			content.push("Ext.ns('"+params.ns+"');"+params.ns+".")
		} else if (params.namespace){
			content.push("Ext.namespace('"+params.namespace+"');"+params.namespace+".")
		}
		content.push($req.rawData.scriptvar + "=" +API.toJson());
		this.renderContent(conent.join(""),"text/javascript");
	}else {
		this.renderContent(API.toJson(),"application/json");
	}
	 
}

function router(params){
	var isJson = $req.contentType == "application/json";
	var result;
	
	var executeRequest = function(request){
		result={
			type:'rpc',
			tid:request.tid,
			action:request.action,
			method:request.method,
		};
		var args;
		try {
			
			var controller = $FP.getController(request.action)
			if (!controller) throw new Error("Controller '" +request.action+ "' not defined")
			if (!(request.method in controller)) throw new Error("Action '" +request.action+ ":"+request.method+"' not defined")
			
			if (request.data instanceof Array) {
				args = request.data.length?request.data[0]:{};
			} else { //data is a structure
				args= request.data	
			}
			result.result = controller.callAction(request.method,args);
			return result;
		} catch(e){
			var message = "Error in Ext.Direct call " + request.action + "." +request.method +", TID: " + request.tid; 
			Myna.logSync(
				"debug",
				message,
				Myna.formatError(__exception__) 
					+Myna.dump($req.data,"parms") 
					+ Myna.dump($req.contentText,"content")
			);
			return {
				type:'exception',
				tid:request.tid,
				message:message,
				where:"See administrator log for details"
			}
		}
	}
	
	
	if (isJson){
		var request = $req.contentText.parseJson();
		
		if (request instanceof Array){
			result = request.map(function(request){
				return executeRequest(request);
			})
		} else { 
			result = executeRequest(request);
		}
		try{
			//faster but more error-prone
			var content = JSON.stringify(result);
		}catch(e){
			//slower but more reliable
			content = result.toJson();
		}
		this.renderContent(content,"application/json")
		
	} else {// post/upload request
		result = executeRequest({
			type:'rpc',
			tid:params.extTID,
			action:params.extAction,
			method:params.extMethod
		});
		$res.print("<html><body><textarea>"
			+ result.toJson().replace(/"/g,'\\"')
			+"</textarea></body></html>")
	}
}