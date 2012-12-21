/*jshint unused:false*/
/*global Myna $FP $application $server $req java
*/
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
		"codemirror-3.0/lib/codemirror.css",
		"default.css"
	])
	this.$page.scripts =this.$page.scripts.concat([
		"extjs/ext-all-debug.js",
		"app/SupaGrid.js",
		"app/quickdrop.js",
		"app/Notification.js",
		"codemirror-3.0/lib/codemirror.js",
		"codemirror-3.0/mode/plsql/plsql.js",
		"codemirror-3.0/mode/javascript/javascript.js",
		"app/uxCodeMirror.js",
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
function getKeyInfo(params) {
	params.checkRequired(["table_name","ds"]);
	var table =new Myna.Database(params.ds)
		.getTable(params.table_name.unEscapeHtml())
	
	var result =[];
	if (table.primaryKeys.length){
		result.push({
			key_name:table.primaryKeyInfo[0].pk_name,
			columns:table.primaryKeys.join(),
			type:"Primary"
		})	
	}
	var keyMap ={}
	keyMap[parseInt(java.sql.DatabaseMetaData.importedKeyNoAction,10)] ="NO ACTION",
	keyMap[parseInt(java.sql.DatabaseMetaData.importedKeyCascade,10)] ="CASCADE",
	keyMap[parseInt(java.sql.DatabaseMetaData.importedKeySetNull,10)] ="SET NULL",
	keyMap[parseInt(java.sql.DatabaseMetaData.importedKeySetDefault,10)] ="SET DEFAULT"
	
	table.foreignKeys.forEach(function(key){
			result.push({
			key_name:key.fk_name,
			type:"Foreign",
			columns:key.fkcolumn_name,
			foreign_table:key.pktable_name,
			foreign_column:key.pkcolumn_name,
			on_delete:keyMap[key.delete_rule],
			on_update:keyMap[key.update_rule]
		})
	})
	return result
}
function getIndexInfo(params) {
	params.checkRequired(["table_name","ds"]);
	var table =new Myna.Database(params.ds)
		.getTable(params.table_name.unEscapeHtml())
	return table.indexInfo
}
function getTreeNode(params){
	params.checkRequired(["ds","node"])
		var db = new Myna.Database(params.ds);
		var defaultSchema=db.defaultSchema;
		if (params.node ===0){
			var schemas =db.schemas
			.filter(function(s){
				return !!s && s != defaultSchema;
				/*if (!s) return false;
				return s.toLowerCase() != defaultSchema.toLowerCase() 
				&& db.getTablesBySchema(s).length;*/
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
					if (obj[name] === null){
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
				
				startRow:((parseInt(params.page,10)-1) * parseInt(params.pageSize,10) ) +1 
			})
		} else{ 
			qry.execute({
				pageSize:parseInt(params.limit,10),
				page:parseInt(params.page,10)
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
	//clip redundant data

	qry.result.data = undefined;
	/*delete qry.db;
	delete qry.resultSet;
	delete qry.sql;*/

	return qry;
}
function describeTable(params) {
	params.checkRequired(["table_name","ds"]);
	var table =new Myna.Database(params.ds)
		.getTable(params.table_name)
	return table.columnNames.map(function(col_name){
		var col_def = table.columns[col_name.toLowerCase()];
		var local_col = {}
		col_def.getKeys().forEach(function(key){
			if ("ordinal_position,num_prec_radix,decimalDigits,column_name,type_name,column_size,column_def,is_nullable".listContains(key)){
				if (key == "column_size" && !"varchar2,varchar,numeric,number,decimal".listContainsNoCase(col_def.type_name)){
					local_col.column_size="";
				} else if (key == "decimalDigits" && !"numeric,number,decimal".listContainsNoCase(col_def.type_name)){
					local_col.decimalDigits="";
				} else if (key == "column_def" && String(col_def[key]).toLowerCase() == "null"){
					local_col.column_def="";
				} else {
					local_col[key] =col_def[key];
				}
			} 
		})
		return local_col;
	});
}

function convertToCol(col) {
	return {
		name:col.column_name,
		type:col.type_name,
		maxLength:col.column_size,
		decimalDigits:col.decimal_digits||null,
		allowNull:col.is_nullable == "YES",
		defaultValue:col.column_def
	}
}
function jsonFormat(obj,indentLevel) {
	var keys = obj.getKeys().filter(function (k) {return obj[k]||obj[k]===0});
	return ["{"]
		.concat(keys.map(function (k) {
			return "    {0}:{1}".format(k,JSON.stringify(obj[k]));
		}))
		.concat(["}"])
		.join("\n" + " ".repeat(indentLevel*4));

}
function saveTable(params) {
	try{
		var table = new Myna.Database(params.ds).getTable(params.table_name);
		table.deferExec=params.sqlOnly;
		var isNew = params.recreate || !table.exists;
		var unchanged =(params.sqlOnly||params.mynaCodeOnly) && params.columns
				.concat(params.keys)
				.concat(params.indexes)
				.every(function (data) {return data.action=="none"})
		var args;
		var code =<ejs>
			var dm = new Myna.Database("<%=params.ds%>")
			var table = dm.getTable("<%=params.table_name%>");	
		</ejs>
	/*Main table / columns*/
		if (isNew || unchanged){
			args = params.columns.filter(function (col) {
					return col.action!="remove"
				}).sort(function (a,b) {
					return String.compareNumeric(a,b)
				}).map(convertToCol)
			if (params.mynaCodeOnly){
				code+="\n\n";
				code +=<ejs>
					table.create({
						recreate:<%=!!params.recreate%>,
						columns:[<%=args.map(function(a){return jsonFormat(a,1)})%>]
					})	
				</ejs>
				code+="\n";
			} else {
				table.create({
					recreate:params.recreate,
					columns:args
				})
			}
		} else {
			params.columns.forEach(function (col) {
				code+="\n\n";
				args=convertToCol(col);
				switch(col.action){
					case "new":
						if (params.mynaCodeOnly){
							code +=<ejs>
								table.addColumn(<%=jsonFormat(args)%>);
							</ejs>
						} else {
							table.addColumn(args);
						}
						break;
					case "change":
						if (params.mynaCodeOnly){
							code +=<ejs>
								table.modifyColumn(<%=JSON.stringify(col.oldValues.column_name||col.column_name)%>,<%=jsonFormat(args)%>);
							</ejs>
						} else {
							table.modifyColumn(col.oldValues.column_name||col.column_name,args);
						}
						break;
					case "remove":
						if (params.mynaCodeOnly){
							code +=<ejs>
								table.dropColumn(<%=JSON.stringify(col.column_name)%>);
							</ejs>
						} else {
							table.dropColumn(col.column_name);
						}
						break;
				}
			})
		}
	/* keys*/
		params.keys.forEach(function (key) {
			code+="\n\n";
			if (
				"change,remove".listContains(key.action) 
				&& !isNew
			){
				var key_name = key.key_name;
				if (key.action=="change" && key.oldValues.key_name){
					key_name = key.oldValues.key_name;
				}
				if (params.mynaCodeOnly){
					code +=<ejs>
						table.dropConstraint(<%=JSON.stringify(key_name)%>);
					</ejs>
				} else {
					table.dropConstraint(key_name);
				}
			}

			if ("change,new".listContains(key.action) || isNew || unchanged){
				code+="\n\n";
				if (key.type =="Primary"){
					if (!key.key_name){
						key.key_name = "{0}_{1}_pkey_{2}".format(
							params.table_name.left(9),
							key.columns.left(9),
							String(new Date().getTime()).right(4)
						)
					}
					if (params.mynaCodeOnly){
						code +=<ejs>
							table.addPrimaryKey(<%=jsonFormat({
								id:key.key_name,
								column:key.columns
							})%>)
						</ejs>
					} else {
						table.addPrimaryKey({
							id:key.key_name,
							column:key.columns
						});
					}
				} else {
					if (!key.key_name){
						key.key_name = "{0}_{1}_fkey_{2}".format(
							params.table_name.left(9),
							key.columns.left(9),
							String(new Date().getTime()).right(4)
						)
					}
					if (params.mynaCodeOnly){
						code +=<ejs>
							table.addForeignKey(<%=jsonFormat({
								id:key.key_name,
								localColumn:key.columns,
								foreignTable:key.foreign_table,
								foreignColumn:key.foreign_column,
								onDelete:key.on_delete,
								onUpdate:key.on_update
							})%>);
						</ejs>	
					} else {
						table.addForeignKey({
							id:key.key_name,
							localColumn:key.columns,
							foreignTable:key.foreign_table,
							foreignColumn:key.foreign_column,
							onDelete:key.on_delete,
							onUpdate:key.on_update
						})
					}
				}
			}
		})
	/* indexes */
		params.indexes.forEach(function (index) {
			code+="\n\n";
			if (
				"change,remove".listContains(index.action) 
				&& !isNew
			){
				var name = index.name;
				if (index.action=="change" && index.oldValues.name){
					name = index.oldValues.name;
				}
				if (params.mynaCodeOnly){
					code +=<ejs>
						table.dropIndex(<%=JSON.stringify(name)%>);
					</ejs>
				} else {
					table.dropIndex(name);
				}
			}

			if ("change,new".listContains(index.action) || isNew || unchanged){

				code+="\n\n";
				
				if (!index.name){
					index.name = "{0}_{1}_idx_{2}".format(
						params.table_name.left(9),
						index.columns.replace(/,/g,"_").left(9),
						String(new Date().getTime()).right(4)
					)
				}
				args = {
					id:index.name,
					columns:index.columns
				}
				if (params.mynaCodeOnly){
					code +=<ejs>
						table.addIndex(<%=jsonFormat(args)%>);
					</ejs>
				} else {
					try{
						table.addIndex(args);
					} catch (e){}
				}
				
			}
		})
	/* return */
		if (params.sqlOnly) {
			return table.sql
		} else if (params.mynaCodeOnly){
			return code;
		} else {
			return {
				success:true
			}
		}
	}catch(e){
		Myna.log("error","Error in saveTable " + e.message,Myna.dump(params,"Table Definition") + Myna.formatError(e));
		if (params.sqlOnly||params.mynaCodeOnly) {
			return e.message
		} else {
			return {
				success:false,
				errorMessage:e.message
			}
		}		
	}

	
}
function getSqlCode(params) {
	params.sqlOnly=true;
	return {
		code:this.saveTable(params).replace(/\n\n\n+/g,"\n\n")
	}	
}

function getMynaCode(params) {
	params.mynaCodeOnly=true;
	return {
		code:this.saveTable(params).replace(/\n\n\n+/g,"\n\n")
	}	
}