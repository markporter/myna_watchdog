function init(){
	this.applyBehavior("MynaAuth",{
		whitelist:[],
		providers:Myna.Permissions.getAuthTypes(),
		redirectParams:{}
	})
	
	
}

function index(params){
	this.$page.css =this.$page.css.concat([
		"extjs/resources/css/ext-all.css",
		"CodeMirror-2.2/lib/codemirror.css",
		"default.css"
	])
	this.$page.scripts =this.$page.scripts.concat([
		"extjs/ext-all-debug.js",
		"app/supagrid.js",
		"CodeMirror-2.2/lib/codemirror.js",
		"app/plsql.js",
		$FP.helpers.Html.url({
			controller:"Direct",
			action:"api",
			params:{
				callback:"Ext.Direct.addProvider",
				namespace:"$FP"
			}
		})
	])
	
	var props=Myna.getGeneralProperties();
	this.set("globalProperties",{
		title:this.$page.title="DB Manager: " + params.id,
		ds_name:params.id,
		dbProperties:$application.get("db_properties"),
		appUrl:$FP.url,
		rootUrl:$server.rootUrl
	})
	
}

function getTreeNode(params){
	params.checkRequired(["ds","node"])
		var db = new Myna.Database(params.ds);
		var defaultSchema=db.defaultSchema;
		if (params.node ==0){
			var schemas =db.schemas
			.filter(function(s){
				return !!s && s != defaultSchema;
				if (!s) return false;
				return s.toLowerCase() != defaultSchema.toLowerCase() 
				&& db.getTablesBySchema(s).length;
			}) 
			.map(function(s){
				return {
					text:s,
					id: 'schema:' + s,
					leaf:false,
					iconCls:"icon_db",
					object_type:"schema"
				}
			}).sort(String.compareNatural)
			schemas.unshift({
				text:"Default (" + defaultSchema +")",
				id: 'schema:' + defaultSchema,
				leaf:false,
				expanded:true,
				iconCls:"icon_db",
				object_type:"schema"
			}) 
			return schemas;
		} else if (params.node.split(":")[0]=="schema"){
			var table_types = "";
			db.getTablesBySchema(params.node.split(":")[1])
			.filter(function(t){
				if (/^BIN\$.*/.test(t.table_name)){
					return false
				} 
				if ([
					"index",
					"null",
					"system index",
					"system toast index",
					"system table",
					"system view"
				].join(",").listContains(String(t.table_type).toLowerCase())) return false;
				return true;
			})
			.forEach(function(t){
				table_types = table_types.listAppendUniqueNoCase(t.table_type);
			})
			
			if (table_types.trim().length){
				return table_types.split(/,/).sort(String.compareNatural).map(function(t){
					return {
						text:String(t).titleCap() + (t.toLowerCase().charAt(t.length-1) == "x"?"es":"s"),
						id:'table_type:'+ params.node.split(":")[1]+':' + t,
						leaf:false,
						expanded:t=="TABLE",
						table_type:String(t),
						object_type:"table_type"
					}
				})
			} else return []
		} else if (params.node.split(":")[0]=="table_type"){
			var tables="";
			var array = db.getTablesBySchema(params.node.split(":")[1])
			.filter(function(t){
				if (/^BIN\$.*/.test(t.table_name)){
					return false
				} 
				if (tables.listContains(t.table_name.toLowerCase())){
					return false;
				} else {
					tables.listAppend(t.table_name.toLowerCase());
				}
				return t.table_type == params.node.split(":")[2]
			})
			
			.map(function(t){
				var schema =params.node.split(":")[1]
				return {
					text: t.table_name,
					id:"table:" + (schema.trim().length?schema + '.':'') + t.table_name,
					leaf:false,
					iconCls:"icon_db_table",
					table_type:t.table_type,
					table_name:t.table_name,
					schema:params.node.split(":")[1],
					object_type:"table"
				}
			})
			array.sort(function (a,b){
				return String.compareNatural(a.text,b.text)
			})
			return array;
		} else if (params.node.split(":")[0]=="table"){
			var t = db.getTable(params.node.split(":")[1]);
			return t.columnNames.map(function(colName){
				return {
					text: colName,
					id:"column:" + colName,
					leaf:true,
					cls:"db_column",
					object_type:"column"
				}
			})
		} else {return []}
}

function executeSql(params){
	$req.timeout = 5*60;
	params.checkRequired(["sql","ds"]);
	params.setDefaultProperties({
		page:1,
		limit:25,
		return_all:"false"
	});
	//throw new Error(params.toJson())
	var qry = new Myna.Query({
		ds:params.ds,
		sql:params.sql,
		deferExec:true,
		rowHandler:function(row){
			var T = java.sql.Types;
			var obj={}
			obj["$num"] = row.rowNum + ((row.query.page-1) * row.query.pageSize)
			row.columns.forEach(function(col,index){
				var name = col.name.toLowerCase(); 
				if ([T.BLOB,T.BINARY,T.VARBINARY].join().listContains(col.typeId)  ){
					obj[col.name.toLowerCase()] = "[[ BINARY PARAMS ]]"
				} else {
					obj[name] = row.getValue(index)
					/* if (obj[name] instanceof Date){
						obj[name] = obj[name].format("m/d/Y H:i:s")
					} */
					if (obj[name] == null){
						obj[name] = ""
					}
				}
			})
			return obj;
		}
	});
	try{
		if (params.return_all == "true"){
			qry.execute({
				
				startRow:((parseInt(params.page)-1) * parseInt(params.pageSize) ) +1 
			})
		} else{ 
			qry.execute({
				pageSize:parseInt(params.limit),
				page:parseInt(params.page)
			})
		}
	} catch(e){
		if (e.javaException && e.javaException instanceof java.sql.SQLException){
			return {
				success:false,
				errorMsg:"Error Executing SQL:",
				errorDetail:e.javaException.getMessage() 
			}
		} else {
			throw e	
		}
	}
	return qry.result;
}