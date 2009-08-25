/* Class: Myna.Table 
	Create modify and delete SQL tables   

*/
if (!Myna) var Myna={}
/* 	Constructor: Myna.Table 
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
	
	
	table.init();
	if (this.schema && this.schema.trim().length){
		this.sqlTableName = '"' + this.schema + '"."' + this.tableName +'"';
	} else{
		this.sqlTableName = this.tableName;		
	}
	
}
/* Property: sqlTableName 
	name of this table including schema name that should be used in sql queries
	*/
/* Property: tableName 
	name of this table 
	*/

/* Property: db 
	reference to the <Myna.Database> object that create this Table object 
	*/




/* Property: indexInfo
	An array of index info. 
	Each entry contains:
	
	table_cat 			-	string table catalog/db name (may be null)
	table_schem			-	string table schema/username  (may be null)
	table_name			-	string table name
	non_unique			-	boolean can index values be non-unique. 
							false when type is tableIndexStatistic
	index_qualifier		-	string index catalog (may be null); null 
							when type is tableIndexStatistic
	index_name			-	string index name; null when type is 
							tableIndexStatistic
	type				-	short index type:
		* java.sql.DatabaseMetaData.tableIndexStatistic 
			= this identifies table statistics that are returned in 
			  conjuction with a table's index descriptions
		* java.sql.DatabaseMetaData.tableIndexClustered 
			= this is a clustered index
		* java.sql.DatabaseMetaData.tableIndexHashed 
			= this is a hashed index
		* java.sql.DatabaseMetaData.tableIndexOther 
			= this is some other style of index 
	ordinal_position	-	short column sequence number within index; 
							zero when type is tableIndexStatistic
	column_name			-	string column name; null when type is 
							tableindexstatistic
	asc_or_desc			-	string => column sort sequence, 
							"a" => ascending, "d" descending, may be 
							null if sort sequence is not supported; 
							null when type is tableIndexStatistic
	cardinality			-	int when type is tableIndexStatistic, then 
							this is the number of rows in the table; 
							otherwise, it is the number of unique values 
							in the index.
	pages				-	int when type is tableindexstatisic then 
							this is the number of pages used for the 
							table, otherwise it is the number of pages
							used for the current index.
	filter_condition	-	string filter condition, if any.(may be null) 
*/

/* 	Function: init 
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
}

/* Property: columns 
	Structure representing the defined columns in this table, keyed by
	the lowercase column name. Each entry contains:
	
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
	if (this.exists){
		var rsColumns =this.db.md.getColumns(
			this.db.catalog,
			this.schema,
			this.tableName,
			'%'
		)
		var columns = new Myna.Query(rsColumns);
		
		rsColumns.close();
		var result={}
		columns.data.forEach(function(row,index){
			result[row.column_name.toLowerCase()] = row;
		})
		return result;
	} else {
		return [];
	}
})

/* Property: columnNames 
	An array of lowercase column names, in the order they appear in the table 
*/
Myna.Table.prototype.__defineGetter__("columnNames", function() {
	if (this.exists){
		var table =this;
		return this.columns.getKeys().filter(function(name){
			return "column_name" in table.columns[name];	
		}); 
	} else {
		return []	
	}
})

/* Property: exists 
	true, if this table exists 
	*/
Myna.Table.prototype.__defineGetter__("exists", function() {
	var table= this;
	var rsTables= table.db.md.getTables(
		table.db.catalog,
		table.schema||table.db.defaultSchema,
		table.tableName,
		null
	)
	var qry = new Myna.Query(rsTables)
	rsTables.close();
	//if (qry.data.length) return true;
	
	return qry.data.length > 0
})

/* Property: primaryKeys 
	An array of lowercase  column names that make up the primary key 
*/
Myna.Table.prototype.__defineGetter__("primaryKeys", function() {
	if (this.exists){
		//some "table" types aren't really tables (views,synonyms,etc)
		try {
			var rsTemp =this.db.md.getPrimaryKeys(
				null,
				this.schema,
				this.tableName
			);
			var result =new Myna.Query(rsTemp).data.valueArray("column_name").map(function(element){
				return String(element.toLowerCase())
			});
			rsTemp.close();
			return result;
		}catch(e){
			return [];
		}
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
		//some "table" types aren't really tables (views,synonyms,etc)
		try {
			var rsTemp =this.db.md.getPrimaryKeys(
				null,
				this.schema,
				this.tableName
			);
			var data =new Myna.Query(rsTemp).data
			rsTemp.close();
			return data;
		} catch(e) {
			return [];
		}
		
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
		//some "table" types aren't really tables (views,synonyms,etc)
		try {
			var rsTemp = this.db.md.getImportedKeys(
				null,
				this.schema,
				this.tableName
			)
			var data =new Myna.Query(rsTemp).data
			rsTemp.close();
			return data;
		} catch(e) {
			return [];
		}
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
		//some "table" types aren't really tables (views,synonyms,etc)
		try {
			var rsTemp =this.db.md.getExportedKeys(
				null,
				this.schema,
				this.tableName
			)
			var data =new Myna.Query(rsTemp).data
			rsTemp.close();
			return data;
		} catch(e) {
			return [];
		}
	} else {
		return []	
	}
})

/* Property: indexInfo
	An array of index info. 
	Each entry contains:
	
	table_cat 			-	string table catalog/db name (may be null)
	table_schem			-	string table schema/username  (may be null)
	table_name			-	string table name
	non_unique			-	boolean can index values be non-unique. 
							false when type is tableIndexStatistic
	index_qualifier		-	string index catalog (may be null); null 
							when type is tableIndexStatistic
	index_name			-	string index name; null when type is 
							tableIndexStatistic
	type				-	short index type:
		* java.sql.DatabaseMetaData.tableIndexStatistic 
			= this identifies table statistics that are returned in 
			  conjuction with a table's index descriptions
		* java.sql.DatabaseMetaData.tableIndexClustered 
			= this is a clustered index
		* java.sql.DatabaseMetaData.tableIndexHashed 
			= this is a hashed index
		* java.sql.DatabaseMetaData.tableIndexOther 
			= this is some other style of index 
	ordinal_position	-	short column sequence number within index; 
							zero when type is tableIndexStatistic
	column_name			-	string column name; null when type is 
							tableindexstatistic
	asc_or_desc			-	string => column sort sequence, 
							"a" => ascending, "d" descending, may be 
							null if sort sequence is not supported; 
							null when type is tableIndexStatistic
	cardinality			-	int when type is tableIndexStatistic, then 
							this is the number of rows in the table; 
							otherwise, it is the number of unique values 
							in the index.
	pages				-	int when type is tableindexstatisic then 
							this is the number of pages used for the 
							table, otherwise it is the number of pages
							used for the current index.
	filter_condition	-	string filter condition, if any.(may be null) 
*/
Myna.Table.prototype.__defineGetter__("indexInfo", function() {
	if (this.exists){
		//some "table" types aren't really tables (views,synonyms,etc)
		try {
			var rsTemp = this.db.md.getIndexInfo(
				null,
				this.schema,
				this.tableName,
				false,
				false
			)
			var indexInfo=[];
			var localIndexes={};
			new Myna.Query(rsTemp).data.forEach(function(row){
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
				curIndex.columns[row.ordinal_position-1] = row.column_name;
			}); 
			rsTemp.close();
			return indexInfo;
		} catch(e) {
			return [];
		}
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
	var table = this;
	options.checkRequired(["name"]);
	options.name = options.name.toUpperCase();
	options.setDefaultProperties({
		defaultValue:"",
		decimalDigits:"",
		maxLength:"",
		constraints:""
	})
	if (!table.exists){
		throw new Error("Table.addColumn(): Table '" + table.tableName+ "' does not exist.");
	}
	
	if (table.columnNames.indexOf(options.name.toLowerCase()) != -1){
		throw new Error("Table.addColumn(): Column '" + options.name+ "' already exists.");
	}
	
	if (options.isPrimaryKey && table.primaryKeys.length){
		throw new Error("Table.addColumn(): Can't set '" + options.name
			+ "' as primary key. '" 
			+ table.columns[table.primaryKeys[0]].column_name 
			+"' is already a primary key.");
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
		})
	}) 
	
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
						})
					}) 
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
						})
					}) 
				}
			break;
			
			case "references":
				options.references.checkRequired(["table","column"]);
				options.setDefaultProperties({
					onUpdate:"",
					onDelete:""
				})
				options.tableName = table.tableName;
				options.id=table.tableName.left(9)+"_"
					+options.name.left(9)+"_fkey_"
					+String(new Date().getTime()).right(5)
					
				qry =new Myna.Query({
					dataSource:table.db.ds,
					sql:table.getTemplate("addForeignKeyConstraint").apply(options)
				})
			break;
			
		}
	})
	
	table.init();
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
	var col_info = table.columns[name.toLowerCase()];
	
	if (!table.exists){
		throw new Error("Table.modifyColumn(): Table '" + table.tableName+ "' does not exist.");
	}
	
	var normalizedName ="";
	var keys =table.columns.getKeys();
	for (var x=0; x< keys.length;++x){
		if (table.columns[keys[x]].column_name.toLowerCase() == name.toLowerCase()){
			normalizedName = table.columns[keys[x]].column_name; 
		} 
	}
	
	
	if (!normalizedName.length){
		throw new Error("Table.modifyColumn(): Column '" + name+ "' does not exist.");
	}
	
	var isRenamed = options.hasOwnProperty("name");
	var new_col_name = "MYNA_TEMP";
	
	if (isRenamed) {
		new_col_name = options.name.toUpperCase();		
	} else {
		new_col_name +=Myna.createUuid().right(30-new_col_name.length);
	}
	
	
	//copy defaults from current column
	options.setDefaultProperties({
		name:new_col_name,
		type:col_info.type_name,
		maxLength:col_info.column_size,
		decimalDigits:col_info.decimal_digits,
		allowNull:col_info.is_nullable.toLowerCase() == 'no',
		defaultValue:col_info.column_def
	})
	
	/* clip out any contraints */
		var constraints=[];
		if ("allowNull" in options){
			if (!options.allowNull){
				constraints.push({
					type:"notNull"
				})	
			}
			delete options.allowNull
		}
		if (options.isUnique){
			constraints.push({
				type:"isUnique"
			})	
			delete options.isUnique
		}
		if ("references" in options){
			constraints.push({
				type:"references",
				references:options.references
			})	
			delete options.references
		} else { /* check for existing foreign key */
			table.foreignKeys.forEach(function(fkey){
				if (fkey.fkcolumn_name.toLowerCase() == name.toLowerCase()){
					var getType = function(type){
						var T =java.sql.DatabaseMetaData;
						if (type == T.importedKeyCascade) return "CASCADE";
						if (type == T.importedKeySetNull) return "SET NULL";
						if (type == T.importedKeySetDefault) return "SET DEFAULT";
						return "NO ACTION";
					}
					constraints.push({
						type:"references",
						references:{
							table:fkey.pktable_name,
							column:fkey.pkcolumn_name,
							onDelete:getType(fkey.delete_rule), 
							onUpdate:getType(fkey.update_rule) 
						}
					})
				}
			})
		}
	
	/* add new column */
		table.addColumn(options);
	
	/* copy old data to new column */
		new Myna.Query({
			dataSource:table.db.ds,
			sql:<ejs>
				update <%=table.sqlTableName%> set
				<%=options.name.toUpperCase()%> = <%=normalizedName%>
			</ejs>
		})
	
	
	/* remove any foreign key constraints on this column */
		table.foreignKeys.forEach(function(fkey){
			if (fkey.fkcolumn_name.toLowerCase() == name.toLowerCase()){
				new Myna.Query({
					dataSource:table.db.ds,
					sql:table.getTemplate("dropConstraint").apply({
						id:fkey.fk_name,
						tableName:table.sqlTableName
					})
				}) 	
			}
		})
	//drop orginal column
		table.dropColumn(normalizedName)
	/* re-apply constraints */
		constraints.forEach(function(c){
			switch(c.type){
				case "isUnique":
					new Myna.Query({
						dataSource:table.db.ds,
						sql:table.getTemplate("addConstraint").apply({
							tableName:table.sqlTableName,
							constraint:table.getTemplate("uniqueConstraint").apply(options),
							name:options.name.toUpperCase(),
							id:table.tableName.left(9)+"_"
								+options.name.left(9)+"_uniq_"
								+String(new Date().getTime()).right(5)
						})
					}) 
				break;
				
				/* case "isPrimaryKey":
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
							})
						}) 
					}
				break; */
				
				case "references":
					c.references.checkRequired(["table","column"]);
					c.references.setDefaultProperties({
						onUpdate:"",
						onDelete:""
					})
					c.setDefaultProperties(options)
					c.tableName = table.tableName;
					c.id=table.tableName.left(9)+"_"
						+c.name.left(9)+"_fkey_"
						+String(new Date().getTime()).right(5)
						
					
					new Myna.Query({
						dataSource:table.db.ds,
						sql:table.getTemplate("addForeignKeyConstraint").apply(c)
					})
				break;
				
			}
		})
	//if this column was not renamed, copy back to original name
	if (!isRenamed){
		table.modifyColumn(new_col_name,{name:normalizedName})
	}
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
			table:"customers",
			column:"customer_id",
			onDelete:"cascade",
			onUpdate:"cascade" 
		})
	(end)

*/
Myna.Table.prototype.addForeignKey = function(options){
	var table = this;
	if (!table.exists){
		throw new Error("Table.addForeignKey(): Table '" + table.tableName+ "' does not exist.");
	}
	options = {
		references:options
	}
	options.references.checkRequired(["foreignTable","foreignColumn","localColumn"]);
	options.setDefaultProperties({
		onUpdate:"",
		onDelete:""
	})
	options.tableName = table.tableName;
	if (!("id" in options)) {
		options.id=table.tableName.left(9)+"_"
			+options.references.localColumn.left(9)+"_fkey_"
			+String(new Date().getTime()).right(5)
	}
		
	qry =new Myna.Query({
		dataSource:table.db.ds,
		sql:table.getTemplate("addForeignKeyConstraint").apply(options)
	})
			
	
	table.init();
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
	if (!table.exists){
		throw new Error("Table.addPrimaryKey(): Table '" + table.tableName+ "' does not exist.");
	}
	options.tableName = table.tableName;
	options.name = options.column
	options.constraint = table.getTemplate("primaryKeyConstraint").apply({}) 
	if (!("id" in options)) {
		options.id=table.tableName.left(9)+"_"
				+options.name.left(9)+"_pkey_"
				+String(new Date().getTime()).right(5)
	}
		
	qry =new Myna.Query({
		dataSource:table.db.ds,
		sql:table.getTemplate("addConstraint").apply(options)
	}) 
			
	
	table.init();
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
	
	if (!table.exists){
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
		sql:table.getTemplate("createIndex").apply(options)
	})
	table.init()
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
	} else {
		if (table.exists){
			throw new Error("Table.create(): Table '" + table.tableName+ "' already exists. Use the"
				+ " 'recreate' parameter to override.");
		}
	}
	options.setDefaultProperties({columns:[]});
	
	var qry =new Myna.Query({
		dataSource:table.db.ds,
		sql:table.getTemplate("createTable").apply({
			tableName:table.sqlTableName,
			columns:options.columns.map(function(col){
				col.checkRequired(["name","type"]);
				col.name=col.name.toUpperCase();
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
		})
	})   
	table.init();
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
		if (table.exists){
			new Myna.Query({
				dataSource:table.db.ds,
				sql:table.getTemplate("dropTable").apply({
					tableName:table.sqlTableName
				})
			})
			deleted=true;
		}
	/* } catch(e) {
	} */
	table.init();
	
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

	if (!table.exists){
		throw new Error("Table.dropColumn(): Table '" + table.tableName+ "' does not exist.");
	}
	
	if (!table.columnNames.join(",").listContainsNoCase(name) ){
		return;
	}
	
	new Myna.Query({
		dataSource:table.db.ds,
		sql:table.getTemplate("dropColumn").apply({
			tableName:table.sqlTableName,
			name:name
		})
	})
	
	table.init();
}

