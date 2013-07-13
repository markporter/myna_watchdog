/* ---------- list ---------------------------------------------------------- */
	function list(params){
		var searchParams={};
		if ("id" in params && !(this.model.idField in params)){
			searchParams[this.model.idField] = params.id;	
		}
		this.model.fieldNames.forEach(function(name){
			if (name in params 
				&& params[name] 
				&& !"id,controller,action,$inline".listContains(name)
			){
				searchParams[name]=params[name];
			}
		});
		/*Myna.printDump(Myna.Admin.task.getAll());
		Myna.printDump(this.model.query());
		Myna.abort();*/
		return this.model.query(searchParams);
		
	}

/* ---------- get ----------------------------------------------------------- */
function get(params){
	return [this.model.getById(params.id).getData()];
}
/* ---------- remove -------------------------------------------------------- */
function remove(params){
	this.model.remove(params.name);
}
/* ---------- save ---------------------------------------------------------- */
function save(params){
	
	var bean = this.model.get(params);
	var ret= bean.save();
	
	return ret;
}

