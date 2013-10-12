/* Class:  Behavior: FormatJson
	Applies filters that will automatically convert action returns into JSON responses
	
	This behavior uses a "beforeAction" filter that listens for Action calls with 
	a "format" parameter that equals "json". When discovered, normal output is 
	suppressed and instead the return value from the action is captured, 
	converted to JSON, and sent to the browser with a mime/type of 
	"application/json"
	
	Potential security risk:
	Because this behavior halts further filter execution, it should be applied 
	AFTER any authentication or authorization, so that passing a format parameter 
	doesn't bypass security 
	
	(code)
		// in app/controllers/<name>_controller.sjs
		function init(){
			//apply auth behaviors/filters first
			this.applyBehavior("MynaAuth")
			
			// then apply FormatJson
			this.applyBehavior("FormatJson")
		}
		
		// calling this with ?format=json will cause it to return JSON instead of
		// calling the view
		function list(params){
			//set returns the value set
			return this.set("rows",this.model.findBeans())
		}
	(end)
*/
function init(){
	this.addFilter(
		this._formatJson,
		{
			when:"beforeAction"
		}
	)
}

function _formatJson(action, params){
	if (params.format =="json"){
		var ret = this[action](params)
		var json = JSON.stringify(ret,function(k,v){
			if (v instanceof Date) {
				return "\\/Date(' +v.getTime() +')\\/"
			}else{
				return v	
			}
		},"   ")
		this.renderContent(json,"application/json")
		return false;//cancel original action call
	}
}