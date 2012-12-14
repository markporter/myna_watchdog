/* ---------- list ---------------------------------------------------------- */
	function list(params){
		var searchParams={}
		if ("id" in params && !(this.model.idField in params)){
			searchParams[this.model.idField] = params.id	
		}
		this.model.fieldNames.forEach(function(name){
			if (name in params 
				&& params[name] 
				&& !"id,controller,action,$inline".listContains(name)
			){
				searchParams[name]=params[name];
			}
		})
		
		return this.model.query(searchParams)
		
	}

/* ---------- get ----------------------------------------------------------- */
function get(params){
	return [this.model.getById(params.id).getData()]
}
/* ---------- remove -------------------------------------------------------- */
function remove(params){
	this.model.remove(params.name)
}
/* ---------- save ---------------------------------------------------------- */
function save(params){
	var bean = this.model.get(params)
	var ret= bean.save()
	try {
		$server_gateway.loadDataSource(new Myna.File($server.rootDir + "WEB-INF/myna/ds/" + name + ".ds").javaFile,true);
		new Myna.Database(params.name);
	} catch (e if (e.javaException instanceof java.lang.ClassNotFoundException)){
		ret.addError(
			"Connection failed for datasource '" + data.name +"' : The database driver '" + ds.driver + "' cannot be found in the classpath.",
			"driver"
		)
	} catch (e){
		ret.addError(
			String(e),
			"name"
		)
	}
	return ret
}

