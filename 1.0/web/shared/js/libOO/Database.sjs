/* Class: Myna.Database 
	Provides database metadata and manages <Myna.Table> objects

	
*/
if (!Myna) var Myna={}
/* 	Constructor: Myna.Database 
	Construct a database proxy object
	
	Parameters:
		ds	-	 String datsource name
*/
Myna.Database = function (ds){
	$profiler.mark("loading db for " + ds)
	if (!ds) {
		throw new Error("Unable to load datasource '" + String(ds) +"'")
	}
	if (typeof ds === "string"){
		ds = String(ds).toLowerCase();
	}
	
	this.ds=ds;
	var db =$server_gateway.environment.get("__DS_CACHE__:" + ds)
	
	if (!db) {
		db = this;
		this.cache={
		}
		db.init()
		$server_gateway.environment.put("__DS_CACHE__:" + ds,this)
	}
	
	return db
}


/* Property: con
		jdbc connection object. Created in <init>, closed on requestEnd
		See <http://java.sun.com/j2se/1.4.2/docs/api/java/sql/Connection.html>
	*/
	Myna.Database.prototype.__defineGetter__("con", function() {
		var con
		var conCache = this.getCacheValue("ConectionCache",new java.util.Hashtable())
		if (conCache.containsKey(this.ds) && !conCache.get(this.ds).isClosed()){
			con = conCache.get(this.ds);
		} else { 
			try{
				if (/^:mem:/.test(this.ds)){
					con = java.sql.DriverManager.getConnection("jdbc:h2:mem");
				} else {
					//con = java.sql.DriverManager.getConnection("jdbc:apache:commons:dbcp:" + this.ds);
					if (typeof this.ds === "string"){
						con = $server_gateway.javaDataSources.get(this.ds).getConnection()
					} else /* if (this.ds instanceof Myna.DataSet) */{
						
						con = this.ds.getConnection()
					}
				}
				conCache.put(this.ds,con); 
				$application.addOpenObject(con);
			} catch(e){
				Myna.log("ERROR","Unable to load datasource '" + this.ds +"' : " + __exception__.message,Myna.formatError(__exception__));
				throw new Error("Unable to load datasource '" + this.ds +"' : " + __exception__.message)
			}
		} 
		return con;
	});
/* Function: init
	(re)loads database metadata
	*/
	Myna.Database.prototype.init = function(){
			
		var db = this;
		/* Property: ds
			Datasource associated with this Database object
		*/
		
		/* Property: isCaseSensitive
			true if table and column names are case sensitive
		*/
		this.isCaseSensitive = false;
		try{
			this.isCaseSensitive = !!Math.parseInt(Myna.JavaUtils.mapToObject(
				Myna.JavaUtils.mapToObject($server_gateway.dataSources)[this.ds]
			).case_sensitive);
		} catch(e){}
		
		/* Property: md
			database matadata object. Created in <init>, closed on requestEnd. 
			See <http://java.sun.com/j2se/1.4.2/docs/api/java/sql/DatabaseMetaData.html>
		*/
		try{
			this.md = this.con.getMetaData();
		} catch(e){
			
			Myna.log("error","error aquiring metaData",Myna.formatError(__exception__));	
		}
		this.catalog = this.con.getCatalog();
		
		/* Property: dbType
			Lowercase type of database. This should normaly be the name of the 
			database vendor. 
		*/
		this.dbType=String(this.md.getDatabaseProductName()).toLowerCase();
		
		var dbProperties = this.getCacheValue("dbProperties",{})
		if (!dbProperties[this.dbType]){
			dbProperties[this.dbType] = {}
			var dbTemplate ="/shared/js/libOO/db_properties/" + this.dbType.replace(/ /g,"_")+".sjs";
			if (new Myna.File(dbTemplate).exists()){
				Myna.include(dbTemplate,dbProperties[this.dbType]);	
			} else {
				Myna.include("/shared/js/libOO/db_properties/other.sjs",dbProperties[this.dbType]);	
			}
			this.setCacheValue("dbProperties",dbProperties)
		}
		
		dbProperties[this.dbType].applyTo(this,true)
		
	}
/* Property: schemas
	array of schema names available in this datasource
	
	*/
	Myna.Database.prototype.__defineGetter__("schemas", function() {
		return this.getCacheValue("schemas",function(){
			return this.functions.getSchemas(this);
		});
	});
/* Property: defaultSchema
	The default schema for this datasource
		 
	*/
	Myna.Database.prototype.__defineGetter__(
		"defaultSchema", 
		function() {
			return this.getCacheValue("defaultSchema",function(){
				return this.functions.getDefaultSchema(this)||"";
			});
		}
	)
	
/* Property: tables
		array of table information for the current schema.
		
		Each element contains these properties:
			table_cat  					-	table catalog/db name (may be null)
			table_schem  				-	table schema/username (may be null)
			table_name  				-	table name
			table_type  				-	table type. Typical types are 
											"TABLE", "VIEW", "SYSTEM TABLE", 
											"GLOBAL TEMPORARY", "LOCAL TEMPORARY", 
											"ALIAS", "SYNONYM".
			remarks  					-	explanatory comment on the table
			type_cat  					-	the types catalog (may be null)
			type_schem  				-	the types schema (may be null)
			type_name  					-	type name (may be null)
			self_referencing_col_name  	-	name of the designated "identifier" 
											column of a typed table (may be null)
			ref_generation  			-	specifies how values in SELF_REFERENCING_COL_NAME 
											are created. Values are "SYSTEM", 
											"USER", "DERIVED". (may be null) 

		Some databases may not return information for all tables. 
	*/
	Myna.Database.prototype.__defineGetter__("tables", function() {
		return  this.getTablesBySchema(this.defaultSchema);
	});
/*	Function: getTable
	returns a <Myna.Table> object representing the named table. 
	*/
	Myna.Database.prototype.getTable = (function(tableName){
		return new Myna.Table(this,tableName);
	}).cache()
	

/*	Function: dbTypeToJs
	Static function that takes a column type name ("VARCHAR") or a column type id 
	(-5) and returns string that represents the equivalent Myna type (string, 
	numeric, date, binary, unsupported)
	
	Parameters:
		sourceType	-	DB column type as a string ("VARCHAR") or number (112)
	*/
	Myna.Database.dbTypeToJs = function(sourceType){
		var Types = java.sql.Types;
		var type=null;
		
		if (typeof sourceType == "number" || sourceType == parseInt(sourceType)){
			type = parseInt(sourceType);
		} else if (typeof sourceType == "string"){
			sourceType=sourceType.toUpperCase();
			if (sourceType in Types){
				type = Types[sourceType];	
			} else return "unsupported";
		} else return "unsupported";
		
		switch (type){
			case Types.BIGINT:
			case Types.BIT:
			case Types.DECIMAL:
			case Types.FLOAT:
			case Types.DOUBLE:
			case Types.INTEGER:
			case Types.NUMERIC:
			case Types.REAL:
			case Types.SMALLINT:
			case Types.TINYINT:
				return "numeric"
			break;
			
			case Types.TIME:
			case Types.TIMESTAMP:
			case Types.DATE:
				return "date"
				
			break;
			
			case Types.BINARY:
			case Types.LONGVARBINARY:
			case Types.VARBINARY:
			case Types.BLOB:
				return "binary";
			break;
			case Types.CLOB:
			case Types.CHAR:
			case Types.VARCHAR:
			case Types.NCHAR:
			case Types.NVARCHAR:
				return "string";
			break;
			default:
				return "unsupported";
			break;
		}
		
	}

/* Function: getTablesBySchema
	returns table information for a specific schema
	
	Parameters:
		schema	-	schema name to return tables for
	
	Detail:
	
	returns an array of table information for all schemas in the database
	
	Each element contains these properties:
		table_cat  					-	table catalog/db name (may be null)
		table_schem  				-	table schema/username (may be null)
		table_name  				-	table name
		table_type  				-	table type. Typical types are 
										"TABLE", "VIEW", "SYSTEM TABLE", 
										"GLOBAL TEMPORARY", "LOCAL TEMPORARY", 
										"ALIAS", "SYNONYM".
		remarks  					-	explanatory comment on the table
		type_cat  					-	the types catalog (may be null)
		type_schem  				-	the types schema (may be null)
		type_name  					-	type name (may be null)
		self_referencing_col_name  	-	name of the designated "identifier" 
										column of a typed table (may be null)
		ref_generation  			-	specifies how values in SELF_REFERENCING_COL_NAME 
										are created. Values are "SYSTEM", 
										"USER", "DERIVED". (may be null) 

		Some databases may not return information for all tables. 
	*/
	Myna.Database.prototype.getTablesBySchema = function(schema){
		return this.getCacheValue("getTablesBySchema",function(){
			return this.functions.getTables(this,schema);
		});
	}

	
Myna.Database.prototype.getCacheValue =function(key,defaultValue) {
	if (!("cache" in this)){
		this.clearMetadataCache();		
	}
	var value = this.cache[key]
	if (!(key in this.cache)) {
		value =typeof defaultValue == "function"?defaultValue.call(this):defaultValue;
		this.cache[key] = value
	}
	return value
}
Myna.Database.prototype.setCacheValue =function(key,value) {
	this.cache[key] = value
}

/* Property: _cacheKey
	(private) cache key base for internal metadata caching 
	*/
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
	Myna.Database.prototype.clearMetadataCache = function(){
		this.cache={}
		
	}