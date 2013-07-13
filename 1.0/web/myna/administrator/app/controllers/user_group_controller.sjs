/* ---------- init ---------------------------------------------------------- */
	function init(){
		this.applyBehavior("ModelSearchList",{
			pageSizeParam:"limit",
			defaultSort:[{
				property:"appname",
				direction:"asc"
			},{
				property:"name",
				direction:"asc"
			}]
		})
	}
/* ---------- save ---------------------------------------------------------- */
	function save(params){
		var bean = this.model.get(params);
		var result = bean.save()
		result.data = bean.data
		return result
	}


