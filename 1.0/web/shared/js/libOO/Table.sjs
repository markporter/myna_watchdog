/* Class: Myna.Table 
	Create modify and delete SQL tables   

*/
if (!Myna) var Myna={}
/* Constructor: Myna.Table 
	Construct a Query object. This should normally be called indirectly 
	via <Myna.Database.getTable>
	
	*/
	Myna.Table = function (db,tableName){
		var table = this;
		if (tableName.listLen(".")==2){
			this.schema = String(tableName.listFirst("."));
			this.tableName = String(tableName).listLast(".");
		} else {
			this.tableName = tableName;
			this.schema = String(db.defaultSchema);
		}
		table.db = db;
		table.qt = this.db.columnQuoteChar;
		
		
		table.init();
		if (this.schema && this.schema.trim().length){
			this.sqlTableName = table.qt + this.schema + table.qt +"." +table.qt + this.tableName +table.qt;
		} else {
			this.sqlTableName = this.tableName;		
		}
		
		this.deferExec=false;
		this.sql=""
		this.clearMetadataCache();
	}
/* Property: deferExec 
	if this is set to true, all functions that modify the database will instead 
	append their SQL to <Table.sql>
	
	See:
		* <Table.sql>
		* <Table.applyChanges>
	*/
/* Property: sql
	Stores SQL from database altering functions when <Table.deferExec> is true
	
	See:
		* <Table.applyChanges>
		* <Table.deferExec>
	*/
/* Property: sqlTableName 
	name of this table including schema name that should be used in sql queries
	*/
/* Property: tableName 
	name of this table 
	*/

/* Property: db 
	reference to the <Myna.Database> object that create this Table object 
	*/




/* Function: init 
	(re)loads table metadata
	
	*/
	Myna.Table.prototype.init = function(){
		var table = this;
		var db = this.db; //My database 
		var md = this.db.md; //My database metadata
		
		db.init();
		
		var rsTables = table.db.md.getTables(
			table.db.catalog,
			table.schema||table.db.defaultSchema,
			"%",
			null
		)
		var tables = new Myna.Query(rsTables).data
		rsTables.close();
		
		for (var x =0; x<tables.length; ++x){
			if (tables[x].table_name.toLowerCase() == this.tableName.toLowerCase()){
				this.tableName = tables[x].table_name;
				break;
			}  
		}
		this.mdArgs = {
			md:md,
			cat:db.catalog,
			schema:table.schema,
			tableName:table.tableName
		}
		
	}

/* Property: columns 
	Structure representing the defined columns in this table, keyed by
	the column name. If the "Case Sensitive" property of the Datasource is false,
	these keys will be lowercase. Each entry contains:
	
	table_cat			-	string table catalog/db name (may be null)
	table_schem			-	string table schema/username (may be null)
	table_name			-	string table name
	column_name			-	string column name
	data_type			-	int sql type from java.sql.types
	type_name			-	string data source dependent type name, for 
							a UDT the type name is fully qualified
	column_size			-	int column size. for char or date types this 
							is the maximum number of characters, for 
							numeric or decimal types this is precision.
	buffer_length 		- 	null
	decimalDigits		-	int the number of fractional digits
	num_prec_radix		-	int radix (typically either 10 or 2)
	nullable			-	int is null allowed.
		* java.sql.DatabaseMetaData.columnNoNulls 			= might not allow null values
		* java.sql.DatabaseMetaData.columnNullable 			= definitely allows null values
		* java.sql.DatabaseMetaData.columnNullableUnknown 	= nullability unknown 
	remarks				-	string comment describing column (may be null)
	column_def			-	string default value (may be null)
	sql_data_type		-	int unused
	sql_datetime_sub	-	int unused
	char_octet_length	-	int for char types the maximum number of 
							bytes in the column
	ordinal_position	-	int index of column in table (starting at 1)
	is_nullable			-	string "no" means column definitely does not 
							allow null values; "yes" means the column 
							might allow null values. an empty string 
							means nobody knows.
	scope_catlog		-	string catalog of table that is the scope of 
							a reference attribute (null if data_type 
							isn't ref)
	scope_schema		-	string schema of table that is the scope of 
							a reference attribute (null if the data_type 
							isn't ref)
	scope_table			-	string table name that this the scope of a 
							reference attribure (null if the data_type 
							isn't ref)
	source_data_type	-	short source type of a distinct type or 
							user-generated Ref type, SQL type from 
							java.sql.Types (null if DATA_TYPE isn't 
							DISTINCT or user-generated REF) 
	*/
	Myna.Table.prototype.__defineGetter__("columns", function() {
		var table = this;
		var $this = this;
		if (this.exists){
			return this._getCache("columns",function(t){
				var rsColumns =t.md.getColumns(
					t.cat,
					t.schema,
					t.tableName,
					'%'
				)
				var columns = new Myna.Query(rsColumns);
				
				rsColumns.close();
				var result={}
				columns.data.forEach(function(row,index){
						//hack for H2 support
						if (
								!("column_size" in row) 
								&& "character_maximum_length" in row
							){
							row.column_size = row.character_maximum_length;
						}
					var name = $this.db.isCaseSensitive?row.column_name:row.column_name.toLowerCase()
					result[name] = row;
				})
				return result;
			});
		} else {
			return [];
		}
	})

/* Property: columnNames 
	An array of column names, in the order they appear in the table. If the 
	"Case Sensitive" property of the Datasource is false, these names will be 
	lowercase.
	*/
	Myna.Table.prototype.__defineGetter__("columnNames", function() {
		if (this.exists){
			var table =this;
			return this.columns.getKeys().filter(function(name){
				return "column_name" in table.columns[name];	
			}).sort(function(a,b){
				  if (table.columns[a].ordinal_position > table.columns[b].ordinal_position){
					  return 1;
				  } else if (table.columns[a].ordinal_position < table.columns[b].ordinal_position){
					  return -1;
				  } else{
					  return 0;
				  }
			  });
		} else {
			return []	
		}
	})

/* Property: exists 
	true, if this table exists 
	*/
	Myna.Table.prototype.__defineGetter__("exists", function() {
		return this._getCache("exists",function(t){
			var rsTables= t.md.getTables(
				t.cat,
				t.schema,
				t.tableName,
				null
			)
			var qry = new Myna.Query(rsTables)
			rsTables.close();
			//if (qry.data.length) return true;
			
			return qry.data.length > 0
		})
	})

/* Property: primaryKeys 
	An array of column names that make up the primary key. If this datasource is
	not case-sensitive, the nthe keys will be in lowercase.
	*/
	Myna.Table.prototype.__defineGetter__("primaryKeys", function() {
		var $this = this;
		if (this.exists){
			return this._getCache("primaryKeys",function(t){
				//some "table" types aren't really tables (views,synonyms,etc)
				try {
					var rsTemp =t.md.getPrimaryKeys(
						null,
						t.schema,
						t.tableName
					);
					var result =new Myna.Query(rsTemp).data.valueArray("column_name").map(function(element){
					var name = String(element) 
					return $this.db.isCaseSensitive?name:name.toLowerCase();
					});
					rsTemp.close();
					return result;
				}catch(e){
					return [];
				}
			});
		} else {
			return [];
		}
	})


/* Property: primaryKeyInfo 
	An array of primary key metadata. 
	Each entry contains:
	
	table_cat		-	table catalog (may be null)
   table_schem	-	table schema (may be null)
   table_name	-	table name
   column_name	-	column name
   key_seq		-	sequence number within primary key
   pk_name		-	primary key name (may be null) 

	*/
	Myna.Table.prototype.__defineGetter__("primaryKeyInfo", function() {
		if (this.exists){
			return this._getCache("primaryKeyInfo",function(t){
				//some "table" types aren't really tables (views,synonyms,etc)
				try {
					var rsTemp =t.md.getPrimaryKeys(
						null,
						t.schema,
						t.tableName
					);
					var data =new Myna.Query(rsTemp).data
					rsTemp.close();
					return data;
				} catch(e) {
					return [];
				}
			})
		} else {
			return [];
		}
	})

/* Property: foreignKeys 
	An array of foreign(imported) key information. 
	Each entry contains:
	
	pktable_cat		-	string Referenced table catalog/db name 
						being imported (may be null)
	pktable_schem	-	string Referenced table schema/username 
						being imported (may be null)
	pktable_name	-	string Referenced key table name
	pkcolumn_name	-	string Referenced column name being imported
	fktable_cat		-	string this table catalog/db name (may be null)
	fktable_schem	-	string this table schema/username (may be null)
	fktable_name	-	string this table name
	fkcolumn_name	-	string this column name
	key_seq			-	short sequence number within a foreign key
	update_rule		-	short what happens to a local column when 
						the referenced column is updated:
		* java.sql.DatabaseMetaData.importedKeyNoAction 		
			= do not allow update of referenced column if it has been imported
		* java.sql.DatabaseMetaData.importedKeyCascade 		
			= change local column to agree with referenced column update
		* java.sql.DatabaseMetaData.importedKeySetNull 		
			= change local column to null if its referenced column has been updated
		* java.sql.DatabaseMetaData.importedKeySetDefault	
			= change local column to default values if its referenced column has been updated
		* java.sql.DatabaseMetaData.importedKeyRestrict 	
			= same as importedkeynoaction (for odbc x compatibility)
		
	delete_rule		-	short what happens to the local column when 
						the referenced column is deleted.
		* java.sql.DatabaseMetaData.importedKeyNoAction 	
			= do not allow delete of referenced column if it has been imported
		* java.sql.DatabaseMetaData.importedKeyCascade 	
			= delete rows that import a deleted key
		* java.sql.DatabaseMetaData.importedKeySetNull 	
			= change local column to null if its referenced column has been deleted
		* java.sql.DatabaseMetaData.importedKeyRestrict 	
			= same as importedkeynoaction (for odbc x compatibility)
		* java.sql.DatabaseMetaData.importedKeySetDefault 
			= change local column to default if its referenced column has been deleted
		
	fk_name			-	string foreign key name (may be null)
	pk_name			-	string primary key name (may be null)
	deferrability	-	short can the evaluation of foreign key 
						constraints be deferred until commit
		* java.sql.DatabaseMetaData.importedKeyInitiallyDeferred 	
			= see sql92 for definition
		* java.sql.DatabaseMetaData.importedKeyInitiallyImmediate 
			= see sql92 for definition
		* java.sql.DatabaseMetaData.importedKeyNotDeferrable 		
			= see sql92 for definition 

	*/
	Myna.Table.prototype.__defineGetter__("foreignKeys", function() {
		if (this.exists){
			return this._getCache("foreignKeys",function(t){
				//some "table" types aren't really tables (views,synonyms,etc)
				try {
					var rsTemp = t.md.getImportedKeys(
						null,
						t.schema,
						t.tableName
					)
					var data =new Myna.Query(rsTemp).data
					rsTemp.close();
					return data;
				} catch(e) {
					
					return [];
				}
			})
		} else {
			return [];
		}
	})

/* Property: exportedKeys 
	An array of exported key information. 
	Each entry contains:
	
	pktable_cat		-	string local column table catalog (may be null)
	pktable_schem	-	string local column table schema (may be null)
	pktable_name	-	string local column table name
	pkcolumn_name	-	string local column column name
	fktable_cat		-	string foreign catalog (may be null)
	fktable_schem	-	string foreign schema (may be null) 
	fktable_name	-	string foreign table name 
	fkcolumn_name	-	string foreign column name 
	key_seq			-	short sequence number within foreign key
	update_rule		-	short what happens to foreign key when primary is updated:
		* java.sql.DatabaseMetaData.importedKeyNoAction 
			= do not allow update of local column if it has been imported
		* java.sql.DatabaseMetaData.importedKeyCascade 
			= change imported key to agree with local column update
		* java.sql.DatabaseMetaData.importedKeySetNull 
			= change imported key to null if its local column has been updated
		* java.sql.DatabaseMetaData.importedKeySetDefault 
			= change imported key to default values if its local column has been updated
		* java.sql.DatabaseMetaData.importedKeyRestrict 
			= same as importedkeynoaction (for odbc x compatibility) 
	delete_rule		-	short what happens to the foreign key when primary is deleted.
		* java.sql.DatabaseMetaData.importedKeyNoAction 
			= do not allow delete of local column if it has been imported
		* java.sql.DatabaseMetaData.importedKeyCascade 
			= delete rows that import a deleted key
		* java.sql.DatabaseMetaData.importedKeySetNull 
			= change imported key to null if its local column has been deleted
		* java.sql.DatabaseMetaData.importedKeyRestrict 
			= same as importedkeynoaction (for odbc x compatibility)
		* java.sql.DatabaseMetaData.importedKeySetDefault 
			= change imported key to default if its local column has been deleted 
	fk_name			-	string foreign key name (may be null)
	pk_name			-	string local column name (may be null)
	deferrability	-	short can the evaluation of foreign key constraints be deferred until commit
		* java.sql.DatabaseMetaData.importedKeyInitiallyDeferred 
			= see sql92 for definition
		* java.sql.DatabaseMetaData.importedKeyInitiallyImmediate 
			= see sql92 for definition
		* java.sql.DatabaseMetaData.importedKeyNotDeferrable 
			= see sql92 for definition 

	*/
	Myna.Table.prototype.__defineGetter__("exportedKeys", function() {
		if (this.exists){
			return this._getCache("exportedKeys",function(t){
				//some "table" types aren't really tables (views,synonyms,etc)
				try {
					var rsTemp =t.md.getExportedKeys(
						null,
						t.schema,
						t.tableName
					)
					var data =new Myna.Query(rsTemp).data
					rsTemp.close();
					return data;
				} catch(e) {
					return [];
				}
			});
		} else {
			return []	
		}
	})

/* Property: indexInfo
	An array of index info. 
	Each entry contains:
	
	name 			-	index name
	unique		-	boolean, true if this is a unique index
	columns		-	an array of the column names that make of the index. 
	*/
	Myna.Table.prototype.__defineGetter__("indexInfo", function() {
		var $this = this;
		if (this.exists){
			return this._getCache("indexInfo",function(t){
				//some "table" types aren't really tables (views,synonyms,etc)
				try {
					var rsTemp = t.md.getIndexInfo(
						null,
						t.schema,
						t.tableName,
						false,
						false
					)
					var indexInfo=[];
					var localIndexes={};
					new Myna.Query(rsTemp).data.forEach(function(row){
						if (!row.index_name || !row.column_name) return;
						var curIndex;
						if (localIndexes[row.index_name]){
							curIndex = localIndexes[row.index_name];
						} else {
							curIndex=localIndexes[row.index_name] ={
								name:row.index_name,
								unique:!row.non_unique,
								columns:[]
							}
							indexInfo.push(curIndex)
						}
						var name = $this.db.isCaseSensitive?row.column_name:row.column_name.toLowerCase()
						curIndex.columns[row.ordinal_position-1] = name;
					}); 
					rsTemp.close();
					return indexInfo;
				} catch(e) {
					return [];
				}
			});
		} else {
			return []	
		}
	})


/* Function: addColumn
	Adds a column to an existing table
	
	Parameters:
		options		-	Object representing the porperties of this column. 
						See below
						
	Options:
		name			-	name of the column,
		type			- 	one of BIGINT,BLOB,CLOB,DATE,INTEGER,NUMERIC,TEXT,
							TIMESTAMP,VARBINARY,VARCHAR
		maxLength		-	Maximum size in characters or digits
		decimalDigits	-	Maximum decimal places stored for NUMERIC types
		allowNull		-	*Optional, default true* Should null values be allowed 
							in this column?
		defaultValue	-	*Optional, default null* What should be stored in 
							this column when no value is supplied?
		isUnique		-	*Optional, default false* must all values in this 
							column be unique?
		isPrimaryKey	-	*Optional, default false* should this column be the 
							primary key for this table?. will generate an error 
							if a primary key already exists
		references		-	*Optional, default null* column definition of 
							existing column in foreign table that this column 
							references. See Reference Definition below
							
	Reference Definition properties:
		table		- 	name of foreign table
		column		-	name of foreign column
		onDelete	-	*Optional, default null* one of 
						"CASCADE, SET NULL, SET DEFAULT, NO ACTION"
		onUpdate	-	*Optional, default null* one of 
						"CASCADE, SET NULL, SET DEFAULT, NO ACTION"
	
	Example:
	(code)
		var db = new Database("example")
		
		var t = db.getTable("orders");
		t.addColumn({
			name:"customer_id",
			type:"BIGINT",
			allowNull:false,
			references:{
				table:"customers",
				column:"customer_id",
				onDelete:"cascade", 
				onUpdate:"cascade" 
			}
		})
	(end)

	*/
	Myna.Table.prototype.addColumn = function(options){
		options = new Object().setDefaultProperties(options);
		var table = this;
		options.checkRequired(["name"]);
		options.name = this.db.isCaseSensitive?options.name:options.name.toUpperCase()
		options.setDefaultProperties({
			defaultValue:"",
			decimalDigits:"",
			maxLength:"",
			constraints:""
		})
		if (!this.deferExec){
			if (!table.exists){
				throw new Error("Table.addColumn(): Table '" + table.tableName+ "' does not exist.");
			}
			var name = this.db.isCaseSensitive?options.name:options.name.toLowerCase()
			if (table.columnNames.indexOf(name) != -1){
				throw new Error("Table.addColumn(): Column '" + options.name+ "' already exists.");
			}
			
			if (options.isPrimaryKey && table.primaryKeys.length){
				throw new Error("Table.addColumn(): Can't set '" + options.name
					+ "' as primary key. '" 
					+ table.columns[table.primaryKeys[0]].column_name 
					+"' is already a primary key.");
			}
		}
		
		var text = table.db.types[options.type.toUpperCase()];
		if (!text) text = options.type.toUpperCase();
		options.type = new Myna.XTemplate(text).apply(options) ;
		if ((options.allowNull != undefined && !options.allowNull) || options.primaryKey){
			options.constraints += 	" " + table.getTemplate("notNullConstraint").apply(options) + " ";
		}
		
		var qry =new Myna.Query({
			dataSource:table.db.ds,
			sql:table.getTemplate("addColumn").apply({
				tableName:table.sqlTableName,
				columnDef:table.getTemplate("createColumn").apply(options)
			}),
			deferExec:this.deferExec
		}) 
		if (this.deferExec && qry.sql.trim().length) this.sql+=qry.sql.trim()+";\n\n";
		options.getKeys().forEach(function(key){
			var text;
			var qry;
			switch(key){
				case "isUnique":
					if (options.isUnique){
						qry =new Myna.Query({
							dataSource:table.db.ds,
							sql:table.getTemplate("addConstraint").apply({
								tableName:table.sqlTableName,
								constraint:table.getTemplate("uniqueConstraint").apply(options),
								name:options.name.toUpperCase(),
								id:table.tableName.left(9)+"_"
									+options.name.left(9)+"_uniq_"
									+String(new Date().getTime()).right(5)
							}),
							deferExec:this.deferExec
						}) 
						if (this.deferExec && qry.sql.trim().length) this.sql+=qry.sql.trim()+";\n\n";
						
					}
				break;
				
				case "isPrimaryKey":
					if (options.isPrimaryKey){
						qry =new Myna.Query({
							dataSource:table.db.ds,
							sql:table.getTemplate("addConstraint").apply({
								tableName:table.sqlTableName,
								constraint:table.getTemplate("primaryKeyConstraint").apply(options),
								name:options.name.toUpperCase(),
								id:table.tableName.left(9)+"_"
									+options.name.left(9)+"_pkey_"
									+String(new Date().getTime()).right(5)
							}),
							deferExec:this.deferExec
						}) 
						if (this.deferExec && qry.sql.trim().length) this.sql+=qry.sql.trim()+";\n\n";
					}
				break;
				
				case "references":
					options.references.checkRequired(["table","column"]);
					options.setDefaultProperties({
						onUpdate:"",
						onDelete:""
					})
					options.tableName = table.sqlTableName;
					options.id=table.tableName.left(9)+"_"
						+options.name.left(9)+"_fkey_"
						+String(new Date().getTime()).right(5)
						
					qry =new Myna.Query({
						dataSource:table.db.ds,
						sql:table.getTemplate("addForeignKeyConstraint").apply(options),
						deferExec:this.deferExec
					}) 
					if (this.deferExec && qry.sql.trim().length) this.sql+=qry.sql.trim()+";\n\n";
				break;
				
			}
		})
		
		table.init();
		table.clearMetadataCache()
	}

/* Function: modifyColumn
	Modifies an existing column 
	
	Parameters:
		name		-	Name of existing column to modify
		options		-	Object representing the properties of this column. 
						See below
						
	Options:
		name			-	*Optional* new name of the column,
		type			- 	*Optional* one of BIGINT,BLOB,CLOB,DATE,INTEGER,
							NUMERIC,TEXT,TIMESTAMP,VARBINARY,VARCHAR. Be aware 
							that if the new type is incompatible with the 
							existing, the modification will fail. As an example,
							changing from INTEGER to BIGINT will probably work,
							but VARCHAR to DATE probably won't
							
		maxLength		-	*Optional* Maximum size in characters or digits. 
							Setting this to smaller value than the existing type 
							will probably fail.
							
		decimalDigits	-	*Optional* Maximum decimal places stored for NUMERIC 
							types. Setting this to smaller value than the 
							existing type will probably fail.
							
		allowNull		-	*Optional* Should null values be allowed 
							in this column? Setting this to false on a column
							with null values will fail
							
		defaultValue	-	*Optional* What should be stored in 
							this column when no value is supplied?
							
		isUnique		-	*Optional* must all values in this column be unique?
							
		isPrimaryKey	-	*Optional* should this column be the primary key for 
							this table?. This will generate an error if a 
							primary key already exists
							
		references		-	*Optional, default null* column definition of 
							existing column in foreign table that this column 
							references. See Reference Definition below
							
	Reference Definition properties:
		table		- 	name of foreign table
		column		-	name of foreign column
		onDelete	-	*Optional, default null* one of 
						"CASCADE, SET NULL, SET DEFAULT, NO ACTION"
		onDelete	-	*Optional, default null* one of 
						"CASCADE, SET NULL, SET DEFAULT, NO ACTION"
	
	Example:
	(code)
		var db = new Database("example")
		
		var t = db.getTable("orders");
		t.modifyColumn("customerid",{
			name:"customer_id",
			type:"BIGINT",
			allowNull:false,
			references:{
				table:"customers",
				column:"customer_id",
				onDelete:"cascade", 
				onUpdate:"cascade" 
			}
		})
	(end)

	*/
	Myna.Table.prototype.modifyColumn = function(name,options){
		var table = this;
		
		name= this.db.isCaseSensitive?name:name.toLowerCase();
		options.name =this.db.isCaseSensitive?options.name:options.name.toLowerCase()
		var 
			originalCol = this.columns[name],
			currentCol = new Object().setDefaultProperties(options),
			tempName,
			isSame=true,
			isRename = options.name&& options.name != name
		;
		//check if existing column matches new column
		if (isRename) {
			isSame=false;
			currentCol.setDefaultProperties({
				type:originalCol.type_name.toUpperCase(),
				allowNull:originalCol.nullable,
			})
			if (originalCol.column_size) currentCol.maxLength=originalCol.column_size;
			if (originalCol.decimal_digits) currentCol.decimalDigits=originalCol.decimal_digits;
			if (originalCol.column_def) currentCol.defaultValue=originalCol.column_def;
		} else {
			currentCol.name = tempName= "temp_" + Myna.createUuid().replace(/\W/g,"").left(25);
			
			//check for redundant modification
			options.forEach(function(v,k){
				if (!isSame) return;
				switch(k){
					case "type":
						if (v.toUpperCase() in table.db.types){
							v = table.db.types[v.toUpperCase()].match(/^(\w+)/)[1] 	
						}
						if (v.toUpperCase().match(/^(\w+)/)[1] != originalCol.type_name.toUpperCase()){
							isSame=false;
						}
					break;
					
					case "maxLength":
						if (v != originalCol.column_size){
							isSame=false;
						}
					break;
					case "decimalDigits":
						if (v != originalCol.decimalDigits){
							isSame=false;
						}
					break;
					case "allowNull":
						if (v != originalCol.nullable){
							isSame=false;
						}
					break;
					case "defaultValue":
						if (v && String(v).trim() != String(originalCol.column_def).trim()){
							isSame=false;
						}
					break;
				}
			})	
			if (isSame) {
				return;//don't bother if this is the same as existing
			} 
		}
		
		function fkType(t){
			switch(t){
				case java.sql.DatabaseMetaData.importedKeyCascade:
					return "CASCADE"
				break;
				case java.sql.DatabaseMetaData.importedKeySetNull:
					return "SET NULL"
				break;
				case java.sql.DatabaseMetaData.importedKeySetDefault:
					return "SET DEFAULT"
				break;
				case java.sql.DatabaseMetaData.importedKeyNoAction:
					return "SET DEFAULT"
				break;
				default:
					return undefined
				break;
			}
		}	
		//gather and drop refs
			originalCol.foreignKeys= this.foreignKeys
				.filter(function(row){
					return row.fkcolumn_name.toLowerCase() == name.toLowerCase()
				})
				.map(function(row){
					table.dropConstraint(row.fk_name);
					return {
						id:row.fk_name,
						localTable:this.sqlTableName,
						localColumn:name,
						foreignColumn:row.pkcolumn_name,
						foreignTable:row.pktable_name,
						onUpdate:fkType(row.update_rule),
						onDelete:fkType(row.delete_rule)
					}
				})
				
			
			originalCol.exportedKeys= this.exportedKeys
				.filter(function(row){
					return row.pkcolumn_name.toLowerCase() == name.toLowerCase()
				})
				.map(function(row,index,array){
					var ftable =table.db.getTable(row.fktable_name)
					ftable.deferExec = table.deferExec
					ftable.dropConstraint(row.fk_name);
					if (table.deferExec) table.sql+=ftable.sql;
					return {
						id:row.fk_name,
						localTable:row.fktable_name,
						localColumn:row.fkcolumn_name,
						foreignColumn:row.pkcolumn_name,
						foreignTable:row.pktable_name,
						onUpdate:fkType(row.update_rule),
						onDelete:fkType(row.delete_rule)
					}
				})
			
			originalCol.exportedKeys.columns = originalCol.foreignKeys.columns = [
				"id",
				"localTable",
				"localColumn",
				"foreignColumn",
				"foreignTable",
				"onUpdate",
				"onDelete"
			]
			table.primaryKeyInfo.forEach(function(row,index){
				if (row.column_name.toLowerCase() == name.toLowerCase() && index==0){
					originalCol.primaryKey=true;
					table.dropConstraint(row.pk_name)
				}
			})
		//Myna.abort(Myna.dump(currentCol));
		table.addColumn(currentCol)
		
		//copy data from old_column
		var qry =new Myna.Query({
			dataSource:table.db.ds,
			sql:<ejs>
				update <%=table.sqlTableName%> set
				<%=currentCol.name%> = <%=originalCol.column_name%>
			</ejs>,
			deferExec:this.deferExec
		}) 
		if (this.deferExec && qry.sql.trim().length) this.sql+=qry.sql.trim()+";\n\n";
		
		if (!isRename){
			table.dropColumn(originalCol.column_name);
			
			currentCol.name = originalCol.column_name;
			table.addColumn(currentCol);
			//copy data from temp_column
			qry =new Myna.Query({
				dataSource:table.db.ds,
				sql:<ejs>
					update <%=table.sqlTableName%> set
					<%=originalCol.column_name%> = <%=tempName%> 
				</ejs>,
				deferExec:this.deferExec
			}) 
			if (this.deferExec && qry.sql.trim().length) this.sql+=qry.sql.trim()+";\n\n";
			table.dropColumn(tempName);
		}
		//apply old references
			if (originalCol.primaryKey){
				table.addPrimaryKey({column:originalCol.column_name});
			}
			originalCol.foreignKeys.forEach(function fkeys(o){
				table.addForeignKey(o);
			})
			/* originalCol.indexes.forEach(function indexes(o){
				table.addIndex(o);
			}) */
			originalCol.exportedKeys.forEach(function exportedKeys(o){
				var ftable =table.db.getTable(o.localTable)
				ftable.deferExec = table.deferExec
				ftable.addForeignKey(o);
				if (table.deferExec) table.sql+=ftable.sql.trim();
			})	
	}

/* Function: addForeignKey
	Adds a foreign key to this table
	
	Parameters:
		options		-	Object representing the properties of this key. 
						See below
						
	Options:
		
		localColumn			-	Name of local column that references foreign table
		foreignTable			- 	Name of foreign table
		foreignColumn		-	Name of foreign column
		id						-	*Optional, default auto generated* 
									Name of key
		onDelete				-	*Optional, default null* one of 
									"CASCADE, SET NULL, SET DEFAULT, NO ACTION"
		onUpdate				-	*Optional, default null* one of 
									"CASCADE, SET NULL, SET DEFAULT, NO ACTION"
	
	Example:
	(code)
		var db = new Database("example")
		
		var t = db.getTable("orders");
		t.addForeignKey({
			id:"fk_orders_customer_id",
			localColumn:"customer_id",
			foreignTable:"customers",
			foreignColumn:"customer_id",
			onDelete:"cascade",
			onUpdate:"cascade" 
		})
	(end)

	*/
	Myna.Table.prototype.addForeignKey = function(options){
		options.checkRequired(["foreignTable","foreignColumn","localColumn"]);
		var table = this;
		if (!this.deferExec && !table.exists){
			throw new Error("Table.addForeignKey(): Table '" + table.tableName+ "' does not exist.");
		}
		if (!("id" in options)) {
			options.id=table.tableName.left(9)+"_"
				+options.localColumn.left(9)+"_fkey_"
				+String(new Date().getTime()).right(5)
		}
		options.setDefaultProperties({
			table:options.foreignTable,
			column:options.foreignColumn,
			onUpdate:"",
			onDelete:""
		})
		options = {
			tableName:table.sqlTableName,
			id:options.id,
			name:options.localColumn,
			references:options
		}
		qry =new Myna.Query({
			dataSource:table.db.ds,
			sql:table.getTemplate("addForeignKeyConstraint").apply(options),
			deferExec:this.deferExec
		}) 
		if (this.deferExec && qry.sql.trim().length) this.sql+=qry.sql.trim()+";\n\n";
				
		
		table.init();
		table.clearMetadataCache()
	}

/* Function: addPrimaryKey
	Adds a primary key to this table
	
	Parameters:
		options		-	Object representing the properties of this key. 
						See below
						
	Options:
		column					-	Name of local column that will be the primary key. 
									Myna only supports a single column key
		id						-	*Optional, default auto generated* 
									Name of key
	Example:
	(code)
		var db = new Database("example")
		
		var t = db.getTable("orders");
		t.addPrimaryKey({
			id:"pk_orders",
			column:"order_id",
		})
	(end)

	*/
	Myna.Table.prototype.addPrimaryKey = function(options){
		var table = this;
		if (!this.deferExec && !table.exists){
			throw new Error("Table.addPrimaryKey(): Table '" + table.tableName+ "' does not exist.");
		}
		options.tableName = table.sqlTableName;
		options.name = options.column
		options.constraint = table.getTemplate("primaryKeyConstraint").apply({}) 
		if (!("id" in options)) {
			options.id=table.tableName.left(9)+"_"
					+options.name.left(9)+"_pkey_"
					+String(new Date().getTime()).right(5)
		}
			
		qry =new Myna.Query({
			dataSource:table.db.ds,
			sql:table.getTemplate("addConstraint").apply(options),
			deferExec:this.deferExec
		}) 
		if (this.deferExec && qry.sql.trim().length) this.sql+=qry.sql.trim()+";\n\n";
				
		
		table.init();
		table.clearMetadataCache()
	}

/* Function: addIndex
	Adds an index to an existing table
	
	Parameters:
		options		-	Object representing the porperties of this column. 
						See below
						
	Options:
		columns		-	Array of column names to include in the index
		id			-	*Optional, default auto-generate* name to give to the index
		unique		-	*Optional, default null* is this a unique index?
	
	Example:
	(code)
		var db = new Database("example")
		
		var t = db.getTable("orders");
		t.addIndex({
			id:"idx_order_ts",
			columns:["order_ts"]
		})
	(end)

	*/
	Myna.Table.prototype.addIndex = function(options){
		var table= this;
		
		if (!this.deferExec && !table.exists){
			throw new Error("Table.addColumn(): Table '" + table.tableName+ "' does not exist.");
		}
		options.checkRequired(["columns"]);
		options.setDefaultProperties({
			unique:"",
			tableName:table.tableName,
			id:table.tableName.left(9)+"_"
				+options.columns[0].left(9)+"_idx_"
				+String(new Date().getTime()).right(5)
		})
		
		var qry =new Myna.Query({
			dataSource:table.db.ds,
			sql:table.getTemplate("createIndex").apply(options),
			deferExec:this.deferExec
		}) 
		if (this.deferExec && qry.sql.trim().length) this.sql+=qry.sql.trim()+";\n\n";
		table.init()
		table.clearMetadataCache()
	}

/* Function: getTemplate
	Retrieves the template associated with the supplied type.
	
	Parameters:
		type		-	template key to retrieve 

	*/
	Myna.Table.prototype.getTemplate = function(type){
		return new Myna.XTemplate(this.db.templates[type])	
	}

/* Function: create
	Create this table.
	
	Parameters:
		options		-	Object representing the porperties of this column. 
						See below
						
	Options:
		recreate	-	*Optional, default false* Should this table be dropped 
						first if it already exists?
		columns		-	*Optional, default []* Array of column definitions; 
						see <Table.addColumn>. Although this is not required, some 
						databases will throw errors if you attempt to create a 
						table with no columns. Also, attempting to add a primary 
						key to an existing table is more difficult than declaring 
						a primary key at table creation 
	
	Example:
	(code)
		var db = new Database("example")
		
		var t = db.getTable("customers");
		t.create({
			recreate:true,
			columns:[{
				name:"customer_id",
				type:"BIGINT",
				isPrimaryKey:true
			},{
				name:"fname",
				type:"VARCHAR",
				maxLength:100,
				allowNull:true
			},{
				name:"lname",
				type:"VARCHAR",
				maxLength:100
			}]
		})
		
	(end)

	*/
	Myna.Table.prototype.create = function(options){
		var table= this;
		this.db.init();
		this.init();
		
		if(options.recreate){
			this.drop();
		} else if (!this.deferExec){
			if (table.exists){
				throw new Error("Table.create(): Table '" + table.tableName+ "' already exists. Use the"
					+ " 'recreate' parameter to override.");
			}
		}
		options.setDefaultProperties({columns:[]});
		
		var qry =new Myna.Query({
			dataSource:table.db.ds,
			sql:table.getTemplate("createTable").apply({
				tableName:table.tableName,
				columns:options.columns.map(function(col){
					col.checkRequired(["name","type"]);
					//col.name=col.name.toUpperCase();
					col.setDefaultProperties({
						defaultValue:"",
						decimalDigits:"",
						maxLength:"",
						constraints:""
					})
					col.getKeys().forEach(function(key){
						var text;
						switch(key){
							case "type":
								text = table.db.types[col.type.toUpperCase()];
								if (!text) text = col.type.toUpperCase();
								col.type = new Myna.XTemplate(text).apply(col) ;
							break;
							
							case "allowNull":
								if (!col.allowNull){
									text = table.getTemplate("notNullConstraint").apply(col);
									col.constraints += " " + text + " ";
								}
							break;
							
							case "isUnique":
								if (col.isUnique){
									text = table.getTemplate("uniqueConstraint").apply(col);
									col.constraints += " " + text + " ";
								}
							break;
							
							case "isPrimaryKey":
								if (col.isPrimaryKey){
									text = table.getTemplate("primaryKeyConstraint").apply(col);
									col.constraints += " " + text + " ";
								}
							break;
							
							case "references":
								col.references.checkRequired(["table","column"]);
								col.setDefaultProperties({
									onUpdate:"",
									onDelete:"",
									id:"fk_" + table.tableName.left(9)+"_"
									+col.name.left(9)+"_"
									+String(new Date().getTime()).right(5)
								})
								
								
								
								text = table.getTemplate("referencesConstraint").apply(col);
								col.constraints += " " + text + " ";
							break;
							
							
							default: col[key] = col[key]
						}
					})
					return table.getTemplate("createColumn").apply(col);
				})
			}),
			deferExec:this.deferExec
		}) 
		if (this.deferExec && qry.sql.trim().length) this.sql+=qry.sql.trim()+";\n\n";
		table.init();
		table.clearMetadataCache()
		
	}


/* Function: drop
	Drop (delete) this table.
	
	
	Example:
	(code)
		var db = new Database("example")
		
		var t = db.getTable("customers");
		t.drop();
		
	(end)

	*/
	Myna.Table.prototype.drop = function(){
		var table = this;
		var deleted = false;
		/* try { */
			if (table.exists || this.deferExec){
				var qry =new Myna.Query({
					dataSource:table.db.ds,
					sql:table.getTemplate("dropTable").apply({
						tableName:table.sqlTableName
					}),
					deferExec:this.deferExec
				}) 
				if (this.deferExec && qry.sql.trim().length) this.sql+=qry.sql.trim()+";\n\n";
				deleted=true;
			}
		/* } catch(e) {
		} */
		table.init();
		table.clearMetadataCache()
		return deleted;
	}

/* Function: dropColumn
	Drop (delete) this table.
	
	Paramaters:
		name		-	name of column ot drop
	
	Example:
	(code)
		var db = new Database("example")
		
		var t = db.getTable("customers");
		t.dropColumn("fname");
		
	(end)

	*/
	Myna.Table.prototype.dropColumn = function(name){
		var table = this;
		table.init();
		name = name.toUpperCase();
	
		if (!this.deferExec){
			if (!table.exists){
				throw new Error("Table.dropColumn(): Table '" + table.tableName+ "' does not exist.");
			}
			
			if (!table.columnNames.join(",").listContainsNoCase(name) ){
				return;
			}
		}
		
		var qry =new Myna.Query({
			dataSource:table.db.ds,
			sql:table.getTemplate("dropColumn").apply({
				tableName:table.sqlTableName,
				name:name
			}),
			deferExec:this.deferExec
		}) 
		if (this.deferExec && qry.sql.trim().length) this.sql+=qry.sql.trim()+";\n\n";
		
		table.init();
		table.clearMetadataCache()
	}
/* Function: dropConstraint
	Drop (delete) a table constraint such as a foreign or primary key.
	
	Paramaters:
		name		-	name of constraint to remove
	
	Example:
	(code)
		var db = new Database("example")
		
		var t = db.getTable("customers");
		t.dropConstraint("pkey_customers");
		
	(end)

	*/
	Myna.Table.prototype.dropConstraint = function(name){
		var table = this;
		table.init();
		name = name;
	
		if (!this.deferExec){
			if (!table.exists){
				throw new Error("Table.dropConstraint(): Table '" + table.tableName+ "' does not exist.");
			}
		}
		
		var qry =new Myna.Query({
			dataSource:table.db.ds,
			sql:table.getTemplate("dropConstraint").apply({
				tableName:table.sqlTableName,
				id:name
			}),
			deferExec:this.deferExec
		}) 
		if (this.deferExec && qry.sql.trim().length) this.sql+=qry.sql.trim()+";\n\n";
		
		table.init();
		table.clearMetadataCache()
	}
/* Function: dropIndex
	Drop (delete) a table constraint such as a foreign or primary key.
	
	Paramaters:
		name		-	name of constraint to remove
	
	Example:
	(code)
		var db = new Database("example")
		
		var t = db.getTable("customers");
		t.dropConstraint("pkey_customers");
		
	(end)

	*/
	Myna.Table.prototype.dropIndex = function(name){
		var table = this;
		table.init();
		name = name;
	
		if (!this.deferExec && !table.exists){
			throw new Error("Table.dropIndex(): Table '" + table.tableName+ "' does not exist.");
		}
		
		
		
		var qry =new Myna.Query({
			dataSource:table.db.ds,
			sql:table.getTemplate("dropIndex").apply({
				tableName:table.sqlTableName,
				name:name
			}),
			deferExec:this.deferExec
		}) 
		if (this.deferExec && qry.sql.trim().length) this.sql+=qry.sql.trim()+";\n\n";
		
		table.init();
		table.clearMetadataCache()
	}
/* Property: _cacheKey
	(private) cache key base for internal metadata caching 
	*/
/* Function: _getCache
	(private) internal function for caching metadata
	

	*/
	Myna.Table.prototype._getCache = function(type,f){
		var mdArgs = {
			md:this.db.md,
			cat:this.db.catalog,
			schema:this.schema,
			tableName:this.tableName
		}
		if (!("cache" in this)){
			this.clearMetadataCache();		
		}
		if (!(type in this.cache)){
			this.cache[type] = f(mdArgs);
			
		}
		return this.cache[type]	
		
	}
/* Function: clearMetadataCache
	clears metadata cache for this table
	
	Detail:
		to improve performance, table metadata is cached between new Myna.Table 
		calls. After making changes to a table, a call to this function is
		necessary to refresh metadata. This function is called automatically by 
		all the Myna.Table functions that modify the table, so calling this 
		should only be necessary if the table is modified outside of Myna.table
		or another Myna instance
		
	*/
	Myna.Table.prototype.clearMetadataCache = function(){
		this.cache={}
	}
/* Function: applyChanges
	Applies the contents of <Table.sql> to this Table's datasource.
	
	See:
		* <Table.deferExec>
		* <Table.sql>

	*/
	Myna.Table.prototype.applyChanges = function(){
		var table = this;
		this.sql.split(";").forEach(function(sql){
			if (sql.trim().length){
				new Myna.Query({
					ds:table.db.ds,
					sql:sql
				}) 
			}
		})	
		this.sql="";
	}