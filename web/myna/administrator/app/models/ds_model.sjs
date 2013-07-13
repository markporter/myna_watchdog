/* ------------- init ------------------------------------------------------- */
	function init(){
		this.addFields([
			{ name:"name", idField:true, type:"string", defaultValue:""},
			{ name:"url",  type:"string", defaultValue:"" },
			{ name:"port", type:"numeric", defaultValue:0 },
			{ name:"file", type:"string", defaultValue:"/WEB-INF/myna/local_databases/" },
			{ name:"server", type:"string", defaultValue:"" },
			{ name:"case_sensitive", type:"numeric", label:"Case Sensitive Columns?", defaultValue:0 },
			{ name:"username", type:"string", defaultValue:"" },
			{ name:"desc", label:"Description", type:"string", defaultValue:"" },
			{ name:"type", type:"string", defaultValue:"h2" },
			{ name:"location", type:"string", defaultValue:"file" },
			{ name:"password", type:"string", defaultValue:"" },
			{ name:"driver", type:"string", defaultValue:"org.h2.Driver" },
			{ name:"db", type:"string", label:"Database", defaultValue:"" },
			{ name:"isNew", type:"numeric", label:"new?", defaultValue:0 }
		])
		
		this.deferred = true;
		this.validation = Myna.Admin.ds.dsValidation.clone()
		
		/* var testDs = this.get({name:"test_ds",desc:"test data source2",url:"bob",driver:"org.h2.Driver"})
		Myna.abort("this model",testDs.save()) */ 
	}
/* ------------- Methods ---------------------------------------------------- */

function create(newDs){
	var vr =Myna.Admin.ds.save(newDs)
	if (vr.success){
		return this.getById(newDs.name)
	} else throw vr
	
}
function forceDelete(name){
	new Myna.File($server.rootDir + "WEB-INF/myna/ds/" + name + ".ds").forceDelete()
	$server_gateway.dataSources.remove(name);
	Myna.printConsole("deleting " + name)
}
function saveBeanField(bean,fieldName,oldval,newval){
	var v = bean.validate(fieldName);
	/* 
	Don't actually save. Bean instances of this model are always deferred and
	must be saved via "save" which eventually calls "create"
	*/
	return v
}

function query(pattern,options){
	var $this = this;
	if (!pattern) pattern={}
	if (pattern.select == "*") delete pattern.select
	if (pattern.select) pattern.select = pattern.select.replace(/\s*/g,"")
	var criteria = pattern.filter(function(v,k){
		return !"select,where,orderBy".listContains(k)
	})
	var result= Myna.Admin.ds.getAll()
	.filter(function(ds){
		if (!criteria.getKeys().length) return true
		var ret= 
			criteria.getKeys()
			.every(function(key){
				if (typeof criteria[key] == "string"){
					return new RegExp(criteria[key],"i").test(ds[key]||"")
				} else {
					return criteria[key] == ds[key]
				}
			})
		return ret
	}).map(function(row){
		if (!pattern.select) return row
					
		return row.filter(function(v,k){
			return pattern.select.listContains(k)
		})
	})
	//Myna.printDump(result,"result")
	return new Myna.DataSet({
		columns:pattern.select||this.fieldNames,
		data:result
	})
}
