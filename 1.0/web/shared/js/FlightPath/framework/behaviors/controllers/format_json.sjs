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