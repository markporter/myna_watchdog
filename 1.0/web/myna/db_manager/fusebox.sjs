var fusebox={
/* login/auth/main */
	auth:function(data){
		data.checkRequired(["password","username"]);
        
        var user = Myna.Permissions.getUserByAuth(data.username,data.password)
		
		if (user){
			$cookie.setAuthUserId(user.get_user_id());
            if (user.hasRight("myna_admin","full_admin_access")){
                print({success:true,url:"?fuseaction="+$application.mainFuseAction}.toJson());
            } else {
                print({success:false,errorMsg:"You do not have access to this application."}.toJson());
            }
		} else {
			$session.clear();
			$cookie.clearAuthUserId();
			print({success:false,errorMsg:"Login invalid. Please try again."}.toJson());
		}
	},
	
	logout:function(data){
			$session.clear();
			$cookie.clearAuthUserId();
			//this.main({});
			$res.metaRedirect("?fuseaction=main")
	},
	main:function(data){
		//abort("session_cookie",$session.get("authenticated"))
		data.setDefaultProperties({
			ds:""
		})
		
		includeTemplate("views/dsp_main.html",{
			version:$server.version,
			extUrl:$application.extUrl,
			bespinUrl:$application.bespinUrl,
			prettyName:$application.prettyName,
			rootUrl:$server.rootUrl,
			startDs:data.ds,
			authenticated:!!$cookie.getAuthUserId(),
			hasAccess:$cookie.getAuthUserId()&&$cookie.getAuthUser().hasRight("myna_admin","full_admin_access"),
			dbProperties:$application.get("db_properties").toJson()
		});
	},
	get_data_sources:function(data){
		var dataSources =mapToObject($server_gateway.dataSources);
		return Myna.enumToArray($server_gateway.dataSources.keys()).map(function(name){
			return {name:String(name)}	
		}).sort(function(a,b){return String.compareNatural(a.name,b.name)});
	},
	get_db_type:function(data){
		data.checkRequired(["ds"])
		return {
			db_type:new Myna.Database(data.ds).dbType.replace(/ /g,"_"),
			success:true
		}
	},
	load_objects:function(data){
		data.checkRequired(["ds","node"])
		var db = new Database(data.ds.unEscapeHtml());
		var defaultSchema=db.defaultSchema;
		if (data.node ==0){
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
					object_type:"schema"
				}
			}).sort(String.compareNatural)
			schemas.unshift({
				text:"Default (" + defaultSchema +")",
				id: 'schema:' + defaultSchema,
				leaf:false,
				cls:"db",
				object_type:"schema"
			}) 
			return schemas;
		} else if (data.node.split(":")[0]=="schema"){
			var table_types = "";
			db.getTablesBySchema(data.node.split(":")[1])
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
						id:'table_type:'+ data.node.split(":")[1]+':' + t,
						leaf:false,
						table_type:String(t),
						object_type:"table_type"
					}
				})
			} else return []
		} else if (data.node.split(":")[0]=="table_type"){
			var tables="";
			var array = db.getTablesBySchema(data.node.split(":")[1])
			.filter(function(t){
				if (/^BIN\$.*/.test(t.table_name)){
					return false
				} 
				if (tables.listContains(t.table_name.toLowerCase())){
					return false;
				} else {
					tables.listAppend(t.table_name.toLowerCase());
				}
				return t.table_type == data.node.split(":")[2]
			})
			
			.map(function(t){
				var schema =data.node.split(":")[1]
				return {
					text: t.table_name,
					id:"table:" + (schema.trim().length?schema + '.':'') + t.table_name,
					leaf:false,
					cls:"db_table",
					table_type:t.table_type,
					table_name:t.table_name,
					schema:data.node.split(":")[1],
					object_type:"table"
				}
			})
			array.sort(function (a,b){
				return String.compareNatural(a.text,b.text)
			})
			return array;
		} else if (data.node.split(":")[0]=="table"){
			var t = db.getTable(data.node.split(":")[1]);
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
	},
	describe_table:function(data){
		data.checkRequired(["table_name","ds"]);
		var table =new Database(data.ds.unEscapeHtml())
			.getTable(data.table_name.unEscapeHtml())
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
	},
	get_keys:function(data){
		data.checkRequired(["table_name","ds"]);
		var table =new Database(data.ds.unEscapeHtml())
			.getTable(data.table_name.unEscapeHtml())
		
		var result =[];
		if (table.primaryKeys.length){
			result.push({
				key_name:table.primaryKeyInfo[0].pk_name,
				columns:table.primaryKeys.join(),
				type:"Primary"
			})	
		}
		var keyMap ={}
		keyMap[parseInt(java.sql.DatabaseMetaData.importedKeyNoAction)] ="NO ACTION",
		keyMap[parseInt(java.sql.DatabaseMetaData.importedKeyCascade)] ="CASCADE",
		keyMap[parseInt(java.sql.DatabaseMetaData.importedKeySetNull)] ="SET NULL",
		keyMap[parseInt(java.sql.DatabaseMetaData.importedKeySetDefault)] ="SET DEFAULT"
		
		table.foreignKeys.forEach(function(key){
				result.push({
				key_name:key.fk_name,
				type:"Foreign",
				columns:key.fkcolumn_name,
				foreign_table:key.pktable_name,
				foreign_column:key.pkcolumn_name,
				on_delete:keyMap[key.delete_rule],
				on_update:keyMap[key.update_rule],
			})
		})
		return result
	},
	drop_table:function(data){
		data.checkRequired(["table_name","ds"]);
		new Database(data.ds.unEscapeHtml()).getTable(data.table_name.unEscapeHtml()).drop();
		return {
			success:true	
		}
	},
	rename_table:function(data){
		data.checkRequired(["table_name","ds","new_name"]);

		new Myna.Query({
			ds:data.ds,
			sql:<ejs>
				alter table <%=data.table_name%> rename to <%=data.new_name%>
			</ejs>
		})
		return {
			success:true	
		}
	},
	download_file:function(data){
		data.checkRequired(["sql","ds","column","index"]);
		
		var qry = new Query({
			dataSource:data.ds.unEscapeHtml(),
			sql:data.sql.unEscapeHtml(),
			startRow:parseInt(data.index)+1,
			maxRows:1,
			rowHandler:function(row){
				var T = java.sql.Types;
				var obj={}
				row.columns.forEach(function(col,index){
					if ([T.BLOB,T.BINARY,T.VARBINARY].join().listContains(col.typeId)){
						obj.data = row.getValue(index);
					} 
				})
				return obj;
			}
		});
		if (qry.data[0].data){
			$res.printBinary(qry.data[0].data,null,data.column+ "_data");
		} else $res.print("Null Value")
	},
	execute_query:function(data){
		$req.timeout = 5*60;
		data.checkRequired(["sql","ds"]);
		data.setDefaultProperties({
			page:1,
			page_size:25,
			return_all:"false"
		});
		//throw new Error(data.toJson())
		var qry = new Query({
			dataSource:data.ds.unEscapeHtml(),
			sql:data.sql.unEscapeHtml(),
			deferExec:true,
			rowHandler:function(row){
				var T = java.sql.Types;
				var obj={}
				row.columns.forEach(function(col,index){
					var name = col.name.toLowerCase(); 
					if ([T.BLOB,T.BINARY,T.VARBINARY].join().listContains(col.typeId)  ){
						obj[col.name.toLowerCase()] = "[[ BINARY DATA ]]"
					} else {
						obj[name] = row.getValue(index)
						if (obj[name] instanceof Date){
							obj[name] = obj[name].format("m/d/Y H:i:s")
						}
						if (obj[name] == null){
							obj[name] = ""
						}
					}
				})
				return obj;
			}
		});
		try{
			if (data.return_all == "true"){
				qry.execute({
					
					startRow:((parseInt(data.page)-1) * parseInt(data.page_size) ) +1 
				})
			} else{ 
				qry.execute({
					pageSize:parseInt(data.page_size),
					page:parseInt(data.page)
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
		return qry;
	},
}