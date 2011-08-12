/* Class: Myna.Query 
	Sql query object   
	
	Overview:
	The Query object can be used for queries that return a result set (select 
	statements), as well as those that do not (create, update, insert, delete 
	etc...).  
	
	Performing a simple query:
	(code)
	var qry = new Myna.Query({
		dataSource:"hr_ds",
		sql:"select last_name,first_name from employees"
	});
	(end)
	
	This creates a Query object and, because both dataSource and sql were 
	provided, immediately executes the SQL. When a SQL statement is executed, 
	several related properties are populated on the query object. Of particular
	interest for this query is <Myna.Query.data>. This property contains an
	array of objects that represent the returned rows. Each of these objects has 
	a property for every column in the resultset and its corresponding 
	value. Another useful property is <Myna.Query.columns> which is an array of
	column information objects in the order of appearance in the resultset.  
	
	Here is a quick example of displaying a Query in a table in an EJS file
	
	(code)
	<% 
	var qry = new Myna.Query({
		dataSource:"hr_ds",
		sql:"select * from employees",
		startRow:10,
		maxRows:10
	});
	%>
	<table border="1" >
		<caption> Records <%=qry.startRow%> - <%=qry.maxRows%> of <%=qry.totalRows%></caption>
		<tr>
			<@loop array='qry.columns' element='column'>
				<th><%=column.name%></th>
			</@loop>
		</tr>
		<@loop array='qry.data' element='row'>
			<tr>
				<@loop array='qry.columns' element='column'>
					<th><%=String(row[column.name.toLowerCase()])%></th>
				</@loop>
			</tr>
		</@loop>
	</table>
	(end)
	
	
	Notice the extra parameters: startRow and maxRows. These define a "window" 
	in the result set to return into the data property. startRow starts at 1. 
	<Myna.Query.totalRows> contains the total number of rows that would have 
	been returned if it was not limited. Have a look at <Myna.Query.pageSize> and 
	<Myna.Query.page> for an alternate way setting the result window.
	
	
	Inserting or updating records:
	
	<Myna.Query> is useful for updates and inserts as well. When inserting data
	the <Myna.Query.updateCount> property is updated with the number of rows 
	affected. It is also possible to use parametrized values in your queries. 
	For example, dates are handled in highly variable ways between different 
	databases. It is also dangerous to directly include client data into SQL 
	queries because of the the possibility of injecting sql code. This is where
	<Myna.QueryParams> comes in. This class represents an array of explicitly 
	typed parameters to your query. This array matches the order of '?' symbols 
	in your query. Here is an example:
	
	(code)
	var sql ='insert into employees(first_name,last_name,age,hire_date) values (?,?,?,?)'
	var params = new Myna.QueryParams([
		{
			value:"Bob"
		},{
			value:"Dobb"
		},{
			value:32,
			type:"INT4"
		},{
			value:Date.parseDate("01/01/1970","m/d/Y"),
			type:"DATE"
		}
	])
	
	var qry = new Myna.Query({
		dataSource:"hr_ds",
		sql:sql,
		parameters:params
	})
		
	(end)
	
	Here is more compact and maintainable version of the same query using embedded 
	JavaScript blocks:
	
	(code)
		var p = new Myna.QueryParams();
		var qry = new Myna.Query({
			dataSource:"hr_ds",
			sql:<ejs>
				insert into employees(first_name,last_name,age,hire_date) values (
				<%=p.addValue("Bob")%>,
				<%=p.addValue("Dobb")%>,
				<%=p.addValue(32,"INT4")%>,
				<%=p.addValue(Date.parseDate("01/01/1970","m/d/Y"),"DATE")%>
				)
			</ejs>,
			parameters:p
		})
	(end)
	
	Because <Myna.QueryParams.addValue> returns a '?' symbol, your parameters 
	will always be aligned to the position of the '?' symbols
	
	What if you want to the run the above query again, but with different 
	parameters?
	
	(code)
		var p = new Myna.QueryParams();
		p.addValue("Joe");
		p.addValue("Schmoe");
		p.addValue(72,"INT4");
		p.addValue(Date.parseDate("10/15/1995","m/d/Y"),"DATE");
		
		var qry.execute({
			parameters:p
		})
	(end)
	
	<Myna.Query.execute> executes a query again, optionally overriding its 
	properties
	
	Caching:
	Queries can be cached to enhance performance of frequently accessed but 
	infrequently changing data
	
	(code)
		//cache employee information for 12 hours
		var qry=new Myna.Query({
			ds:"hr_ds",
			sql:"select * from employees",
			cache:{
				refreshInterval:Date.getInterval(Date.HOUR,12)
			}
		})
	(end)
	See <Myna.Cache> for more detail on caching.
	
	See also <Myna.Query.getRowByColumn> and <Myna.Query.valueArray> for 
	alternate ways of accessing the data in a query object
	
*/
if (!Myna) var Myna={}
/* 	Constructor: Myna.Query 
	Construct a Query object
	
	Parameters:
		optionsOrResultSet 	- 	Either a java.sql.ResultSet object, 
								or a Options Object that contains optional 
								properties (see below),
								or null or undefined to create an empty query 
								object
		
	Options:
		sql			-	SQL string 
		dataSource	-	string datasource name defined in Myna Administrator
		deferExec		-	*Optional default false* Normally, new query objects are
							executed immediately. Setting this to true cancels that 
							behavior. The query will not be executed without an 
							explicit call to <execute>
		parameters	- 	*Optional Default null* 
							<Myna.QueryParams>
		maxRows		-	*Optional Default null* 
							Maximum number of rows to return. null 
							for all rows
		rowHandler	-	*Optional Default defaultRowHandler* 
							function to process each row in the resultset. This 
							function is passed an instance of <Myna.QueryResultRow> 
							and what is returned will be pushed onto <Myna.Query.data>
		startRow		-	*Optional Default 1* 
							Row number in result from which to start returning 
							rows. Starts with 1. Used with _maxRows_
						
		pageSize		-	*Optional Default null* 
							Number of rows to return per page. Null 
							means all rows. Used with _page_
						
		page			-	*Optional Default null* Page to return. Starts with 1. This 
							is used with _pageSize_ as a shortcut for startRow and 
							maxRows.
		cache			-	*Optional, default null*
							If defined, this is an options object describing how this
							query should be cached. All options of <Myna.Cache> are 
							supported except the the "code" parameter which is generated
							by the query.
							
			
		
	*/
	Myna.Query = function (optionsOrResultSet){
		/* Property: columns
			An Array of Objects that represent the columns in the result set. 
		
			Format:
			(code)
				[
					{
						name:<String column name>,
						typeId:<numeric JDBC type id>,
						typeName:<String type name>
					},
					...
				]
			(end)
			... created by <parseResultSet>
		*/
		this.columns=[];
		
		/* Property: dateFormat
			if set to a string format (see <Date.format>), then any date or timestamp 
			values will be converted to formatted strings. If set to null (default) 
			these values will be Date objects. Note that this will not change the type
			for date/time columns in <Query.columns> or <Query.result>.columns
		*/
		this.dateFormat=null
		
		/* Property: data
			An Array of Objects That represents the query data.
			
			Format:
			(code)
				[
					{
						<column name>:<column value>,
						...
					},
					...
				]
			(end)
			... created by <parseResultSet> 
		*/
		this.data=new Myna.DataSet();
		
		/* Property: dataSource
			The name of the datasource used to run the query.
			Datasources are configured in the Myna Administrator, located at 
			webroot/myna/administrator/index.sjs 
		*/
		/* Property: ds
			alternate name for <Myna.Query.dataSource>
		*/
		this.dataSource="";
		
		/* Property: sql	
			The SQL String of the query
		*/
		this.sql="";
		
		/* Property: executionTime	
			Elapsed time in milliseconds to run the query
		*/
		this.executionTime=0;
		
		/* Property: generatedKey	
			For insert queries, contains the generated prymary key, if any
		*/
		this.generatedKey="";
		
		/* Property: updateCount	
			Number of rows affected by the last update 
		*/
		this.updateCount=0;
		
		/* Property: parameters
			<Myna.QueryParams> object representing query parameters
		
		*/
		this.parameters = new Myna.QueryParams();
		
		/* Property: maxRows
			Maximum number of rows to return. null for all rows
		
		*/
		this.maxRows=null;
		
		/* Property: startRow
			Row number in result from which to start returning rows.  Starts with 1. 
			Used with _maxRows_
		*/
		this.startRow=1;
		
		/* Property: pageSize
			Number of rows to return per page.Null 	means all rows. Used with _page_
		*/
		this.pageSize=null;
							
		/* Property: page
			Page to return. Starts with 1. This is used with 
							_pageSize_ as a shortcut for startRow and maxRows. 
							startRow is set to (((_page_ - 1) * pageSize)+1) and 
							max rows is set to pageSize 
		*/
		this.page=null;
		
		/* Property: totalRows
			total rows in the query, if the entire result had been returned. The 
			actual number of rows is data.length  
		*/
		this.totalRows=null;
		/* Property: result
			contains just data result of this query.
			
			Detail:
				this property is an object that loks like this:
				(code)
				{
					data:[{colname:value}],
					totalRows:numeric,
					maxRows:numeric,
					startRow:numeric,
					columns:[{name:string,type:string}]
				}
				(end)
				the "type" in columns is the result from <Myna.Database.dbTypeToJs> for
				the database column type. This property is more appropriate for sending 
				to a client as it is smaller and does not contain any internal 
				information about your database tables 
		
		*/
		
		/* Property: log
			should executions of this query be logged?
			
			If this is set to true, then every execution of this query will be logged
			as a "query" type to the logging database. Not recommended for production 
			systems
		*/
		this.log =false
		
		/* Property: db
			the <Myna.Database> object associated wioth this query
			
			Detail:
				this property is only set when this query was initialized with a 
				datasource
		*/
		this.db ={}
		var qry = this;
		if (optionsOrResultSet instanceof java.sql.ResultSet){
			this.parseResultSet(optionsOrResultSet);
		} else if (ObjectLib.typeOf(optionsOrResultSet) == 'object') {
			if (optionsOrResultSet.hasOwnProperty("ds")){
				optionsOrResultSet.dataSource = optionsOrResultSet.ds;
			}
			if (optionsOrResultSet.hasOwnProperty("rowHandler")){
				qry.rowHandler = optionsOrResultSet.rowHandler;
			}
			optionsOrResultSet.applyTo(qry,true);
			if (qry.ds) qry.db = new Myna.Database(qry.ds);
			
			if (!optionsOrResultSet.deferExec){
				return this.execute();
			}
		} 
		return this
	}

Myna.Query.prototype={
/* Function: formatSql
		returns returns a multiline text formated string of this.sql with any 
		values merged in
		 
		*/
	formatSql:function (){
		var qry = this;
		var sql = qry.sql instanceof Array ?qry.sql.join(" "):qry.sql;
		sql = sql.replace(/\s*select\s*/gi,'Select\n\t');
		sql = sql.replace(/\s+from\s*/gi,'\nFrom\n\t');
		sql = sql.replace(/\s+where\s*/gi,'\nWhere\n\t');
		sql = sql.replace(/\s+group by\s*/gi,'\nGroup By\n\t');
		sql = sql.replace(/\s+order by\s*/gi,'\nOrder By\n\t');
		sql = sql.replace(/\s+having\s*/gi,'\nHaving\n\t');
		sql = sql.replace(/\s+and/gi,'\n\tand');
		sql = sql.replace(/,/gi,',\n\t');
		
		if (qry.values){
			sql = sql.replace(/{([^:]*?)}/g,'_MYNA_LEFT_BRACE_varchar:{$1}_MYNA_RIGHT_BRACE_')
			sql = sql.replace(/{(.*?):(.*?)}/g,'_MYNA_LEFT_BRACE_$2:{$1}_MYNA_RIGHT_BRACE_')
			sql = new Myna.Template(sql).apply(qry.values);
			sql = sql.replace(/_MYNA_LEFT_BRACE_/g,'{').replace(/_MYNA_RIGHT_BRACE_/g,'}');
		} else if (qry.parameters){
			var index=0;
			var typeMap={}
			ObjectLib.getKeys(java.sql.Types).forEach(function(key){
				typeMap[java.sql.Types[key]] = key;	
			})
			sql =sql.replace(/\?/g,function(match){
				return "{" + typeMap[qry.parameters.params[index].type] +":" + qry.parameters.params[index++].value +"}";
			})	
		} 
		return sql
	},
/* Function: getRowByColumn
		returns first row of the result set that matches the column and value suppplied
		 
		Parameters: 
			columnName		-	Stirng name of the column to search
			value	 		-	value to match
			start			-	*Optional default 0* index to start the search from
	
		Returns: 
			first row of the result set that matches the column and value suppplied
		 
		*/
	
	getRowByColumn:function(columnName,value,start){
		if (start == undefined) start = 0;
		for (var x=start;x <this.data.length;++x){
			if (!this.db || !this.db.isCaseSensitive){
				columnName = columnName.toLowerCase();
			}	
			if (this.data[x][columnName] == value){
				return this.data[x]; 	
			}
		}
		return null;
	},
/* Function: parseResultSet
		parses a JDBC resultSet object and populates <data>
		 
		Parameters: 
			jdbcResultSet		-	JDBC resultSet
			
			
		Returns: 
			this
		 
		*/
	
	parseResultSet:function(jdbcResultSet,ignoreOffset){
		var md = jdbcResultSet.getMetaData();
		var qry = this;
		/* reset data properties */
			qry.columns=[];
			qry.data=new Myna.DataSet();
		var isNative=false;
		for (var index=0; index < md.getColumnCount(); ++index){
			var size=Number(java.lang.Integer.MAX_VALUE)
			try{
				size = Number(md.getPrecision(index+1));
			} catch(e){}
			qry.columns.push({
				name:String(md.getColumnLabel(index+1)),
				typeId:md.getColumnType(index+1),
				typeName:String(md.getColumnTypeName(index+1)),
				size:size
			});
			
		}
		this.data.columns = this.columns.map(function(e){
			if (qry.db && qry.db.isCaseSensitive){
				return e.name;
			} else {
				return e.name.toLowerCase();
			}
			
		});
		
		
		//$application.addOpenObject(jdbcResultSet);
		
		var ResultSet = java.sql.ResultSet;
		if (ignoreOffset){
			//doNothing
		} else if (jdbcResultSet.getType() == ResultSet.TYPE_SCROLL_INSENSITIVE){
			// Point to the last row in resultset.
			jdbcResultSet.last(); 
			
			// Get the row position which is also the number of rows in the ResultSet.
			this.totalRows = jdbcResultSet.getRow() ; 
			
			// now let's roll back to the startRow 
			jdbcResultSet.relative(-1 * (this.totalRows - this.startRow +1));
		} else if (this.startRow > 1){
			while(jdbcResultSet.next() && jdbcResultSet.getRow() < this.startRow-1){}
		}
		
		var row =new Myna.QueryResultRow(jdbcResultSet,this);
		while(jdbcResultSet.next()){
			if (this.maxRows >0 && this.data.length == this.maxRows ) break;
			this.data.push(this.rowHandler(row));
		}
		jdbcResultSet.close();
		return this;
	},
	
/* Function: valueArray
		returns an array of values of a column in the result set.
		
		Parameters:
			columnName		-	String Column name to return
	*/
	valueArray:function(columnName){
		return this.data.valueArray(columnName)	
	},

parseSql:function(values) {
		var sql = this.sql instanceof Array ?this.sql.join(" "):this.sql;
		
		var p = this.parameters = new Myna.QueryParams();
		var qry = this
		var fn = function(m, name, format, args){
			if (name in  values){
				return p.addValue(values[name],format || "VARCHAR")
			} else {
				throw new Error("Unable to find sql parameter '" + name +"' in " + values.toJson())	
			}
		}
		return sql.replace(/\{([\w-]+)(?:\:([\w\.]*)(?:\((.*?)?\))?)?\}/g,fn);
	},
	
/* Function: defaultRowHandler
		default rowHandler if not overridden 
		
		Parameters:
			row		-	instance of <Myna.QueryResultRow>
			
		Detail:
			The default rowHandler function returns each row of the resultset 
			as a JavaScript Object by calling <Myna.QueryResultRow.getRow>
	*/
	defaultRowHandler:function(row){
		return row.getRow();
	},
	
/* Function: rowHandler
		handles each row in the query result set 
		
		Parameters:
			row		-	instance of <Myna.QueryResultRow>
			
		Detail:
			This function takes row information and returns an object to be 
			appended to <Myna.Query.data>. This can be overridden in the query 
			parameters
	*/
	rowHandler:function(row){
		return this.defaultRowHandler(row)
	},
getStatement:function(sql){
		var st;
		var qry = this;
		var dsName = this.dataSource;
		var db =this.db = new Myna.Database(dsName);
		var con = db.con;
		var ResultSet = java.sql.ResultSet;
		
		if (!$req["__CACHE__STATEMENT"]) $req["__CACHE__STATEMENT"] = new java.util.Hashtable();
		if ($req["__CACHE__STATEMENT"].containsKey(qry.dataSource+sql) 
			&& !$req["__CACHE__STATEMENT"].get(qry.dataSource+sql)._closed
			&& !$req["__CACHE__STATEMENT"].get(qry.dataSource+sql).getConnection().isClosed()
		)	
		{
			st = $req["__CACHE__STATEMENT"].get(qry.dataSource+sql);	
		} else {
			/* if(false && /^\s*insert/.test(sql.toLowerCase())){
				try{
					st =  con.prepareStatement(sql,java.sql.Statement.RETURN_GENERATED_KEYS);
				} catch(e) { 
					st =  con.prepareStatement(sql,ResultSet.TYPE_SCROLL_INSENSITIVE,ResultSet.CONCUR_READ_ONLY);
				}
			} else{ */ 
				try{
					st =  con.prepareStatement(sql,ResultSet.TYPE_SCROLL_INSENSITIVE,ResultSet.CONCUR_READ_ONLY);
				} catch(e){
					st =  con.prepareStatement(sql);
					Myna.log("error","Error creating scrollable statement",Myna.formatError(__exception__));
				}
			/* } */
			$req["__CACHE__STATEMENT"].put(qry.dataSource +sql,st); 
			$application.addOpenObject(st);
		}
		return st;
	},
/* Function: execute 
		Executes an SQL query and updates and returns this <Query> object.
		 
		Parameters: 
			options 	-	Object of optional parameters. See <Myna.Query>.
	 
		Detail:
			execute executes this query object, optionally updating its properties.
			   
			
		Returns: 
			this
		
		Example:
			(code)
			var qry = new Query({
				dataSource:"mythtv",
				sql:<ejs>
					select *
					from channels
				</ejs>,
				startRow:1,
				maxRows:10
			})
			
			qry.execute({startRow:11})
			
			(end)
		 
		*/
	execute:function(options){
		var dsName = this.dataSource;
		var sql = this.sql;
		var profilerKey="Executing Query '" + sql.replace(/\s+/g," ") +"'";
		$profiler.begin(profilerKey)
		
		//if (!this.dataSource) throw new Error("A datasource is required to execute a query");
		if (!this.sql) throw new Error("An SQL string is required to execute a query");
		
		var qry = this;
		if (options === undefined) options={}
		options.getKeys().forEach(function(key){
			qry[key] = options[key];	
		});
		
		if (qry.values) sql = this.parseSql(qry.values);
			
		var sqlParameters = this.parameters;
		if (qry.pageSize){
			qry.maxRows = qry.pageSize;
		}
		if (qry.page){
			qry.startRow = (((qry.page - 1) * qry.pageSize)+1)
			qry.setDefaultProperties({pageSize:25})
			qry.maxRows = qry.pageSize;
		}
		
		if (qry.cache){
			var cacheQry ={}
			var cache = qry.cache.setDefaultProperties({
				name:sql,
				code:function(options){
					//just to be safe, we'll remove the cache settings
					if (options.cache) options.cache=false;
					var qry =new Myna.Query(options)
					qry.cachedAt = new Date();
					return qry
				}
			});
			/* this keeps cache settings from being copied to cache version. We 
			want "if (qry.cache)" to return false inside the cache function */
			cacheQry.cache=false;
			cacheQry.setDefaultProperties(qry)
			
			var result = new Myna.Cache(cache).call(cacheQry)
			$profiler.end(profilerKey)
			if (this.log && this.ds != "myna_log"){
				Myna.log("query","Query: " + sql.left(30),Myna.dump(result));
			}
			return result;
		} else {
			try {
				var db = new Myna.Database(dsName);
				var ignoreOffset=false;
				var origSql = sql;
				if (
					/^\s*select/i.test(sql) 
					&&(
						this.maxRows || this.startRow	>1
					)
					&& db.functions.offsetSql
				){
					sql=db.functions.offsetSql(sql,this.maxRows,this.startRow-1)
					ignoreOffset = true;
				} 
				var st = this.getStatement(sql);
				
				var con = db.con;
				
				if (sqlParameters instanceof Myna.QueryParams){
					sqlParameters.params.forEach(function(element,index){
						try {
							
							if (element.type == "GUESS" ){
								st.setObject(index+1,element.value);
							} else if (element.type == java.sql.Types.CLOB && db.functions.setClob){	
								db.functions.setClob(con,st,index,element.value)
							} else if (element.type == java.sql.Types.BLOB && db.functions.setBlob){	
								db.functions.setBlob(con,st,index,element.value)
							} else {
								if (String(element.value).length == 0){//empty strings are considered NULL
									st.setNull(index+1,element.type);
								} else {
									st.setObject(index+1,element.value,element.type);
								}
							}
						} catch (e){
							e.message +="<br>attempting to set value '" +String(element.value) + "' to a parameter of type '" 
								+ element.type +"' typeName: '" + element.typeName + "'."; 
							throw e;
						}
					});
				}
				
				var start = java.lang.System.currentTimeMillis();
				qry.success = false;
				var hasResults = st.execute();
				qry.success = true;
				qry.executionTime=java.lang.System.currentTimeMillis()-start;
				start = java.lang.System.currentTimeMillis();
				if (hasResults ){
					qry.resultSet = st.getResultSet();
					qry.parseResultSet(qry.resultSet,ignoreOffset);
					if (ignoreOffset){
						try{
							this.totalRows = new Myna.Query({
								ds:dsName,
								sql:db.functions.totalRowsSql(origSql),
								parameters:sqlParameters
							}).data[0].count
						} catch(e){
							Myna.printConsole(e)
							Myna.printConsole(db.functions.totalRowsSql(origSql))
						}
					}
					qry.parseTime=java.lang.System.currentTimeMillis()-start;
					/* st.close();
					qry.resultSet.close() */
					return qry;
				} else {
					/* 	Apparently if the driver does not support this feature it throws 
						an exception that cannot be caught. There does not appear to be 
						a way to tell if the driver supports this feature other than to 
						try and fail. I will have to make this something you turn on in 
						the datasource if you think your driver supports it
					*/ 
					try{
						qry.generatedKey=new Myna.Query(st.getGeneratedKeys()).valueArray('identity()').join();
					} catch(e){}  
					qry.updateCount=st.getUpdateCount();
				}
				qry.parseTime=java.lang.System.currentTimeMillis()-start;
			} catch (e){
				Myna.log("error","Query Error",Myna.formatError(__exception__)+Myna.dump(qry,"Query"));
				e.query = qry;
				qry.last_error = e;
				throw e;
			} finally {
				$profiler.end(profilerKey)
				if (this.log &&this.ds != "myna_log"){
					//Myna.printConsole("logging " + this.ql)
					Myna.log("query","Query: " + sql.left(30),Myna.dump(qry));
				}
			}
			/* 	let's give commiting a try, this will likely fail if the datasource
				supports autoCommit
			*/
			try {  
				con.commit();
			} catch(e){}
			
			return qry;
		}
	}
}

Myna.Query.prototype.__defineGetter__("result", function() {
	var q= this;
	var result ={
		data:q.data,
		totalRows:q.totalRows,
		maxRows:q.maxRows,
		startRow:q.startRow,
		columns:q.columns.map(function(col){
			return {
				name:col.name,
				type:Myna.Database.dbTypeToJs(col.typeId)
			}
		})
	}
	return result;
})

/* Class: Myna.QueryResultRow 
	Object that represents a row in a jdbc result set that can retrieve values 
	and metadata 
	
	Detail:
	
	This object is normally constructed by <Myna.parseResultSet> to pass to 
	<Myna.Query.rowHandler>
*/
/* Constructor: QueryResultRow
	Constructs QueryResultRow object
	
	Parameters:
		rs				-	a java.sql.ResultSet object, intialized to a valid 
							row. 
		query			-	the <Myna.Query> object that created the row. This 
							object is expects to be initalized with the query 
							metadata prior to contructing this object
	 
	*/
	Myna.QueryResultRow=function(rs, query){
		this.rs = rs;
		this.query = query;
		this.columns=query.columns;
	}
	Myna.QueryResultRow.prototype={
		/*	Property: query
			a reference to the calling query 
		*/
		/*	Property: rs
			a reference to the calling query's java.sql.ResultSet object 
		*/
		/*	Property: columns
			a reference to the calling query's columns property 
		*/
		
		/* Function: getValue
			returns the value of the indicated column of the current row
			
			Parameters:
				indexOrName	- The 0 based index of the column, or the column name
				 
		*/
		getValue:function(indexOrName){
			var curValue=null;
			var stream;
			var colIndex = indexOrName;
			var Types = java.sql.Types;
			
			if (typeof indexOrName =="string"){
				colIndex =this.columns
					.map(function(el){return el.name})
					.join(",")
					.listFindNoCase(indexOrName);
				if (colIndex == -1){ 
					throw new Error("a column named '" + indexOrName +"' could not be found in the result set");
				}
			}
			var col = this.columns[colIndex]
			switch (col.typeId){
				case Types.ARRAY:
					curValue = this.rs.getArray(colIndex+1);
				break;
				
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
					curValue = this.rs.getObject(colIndex+1);
					if (curValue != null){
						curValue = Number(curValue);
					}
				break;
				
				case Types.TIME:
				case Types.TIMESTAMP:
				case Types.DATE:
					curValue = this.rs.getObject(colIndex+1);
					if(curValue != null) {
						curValue = new Date(curValue.getTime());
						if (this.query.dateFormat){
							curValue = curValue.format(this.query.dateFormat);	
						}
					}
					
				break;
				
				case Types.BOOLEAN:
					curValue = !!this.rs.getObject(colIndex+1);
				break;
				
				case Types.BINARY:
				case Types.LONGVARBINARY:
				case Types.VARBINARY:
				case Types.BLOB:
					curValue = this.rs.getObject(colIndex+1);
					if (curValue){
						if ("read" in curValue){  
							stream = curValue;
						} else {
							stream = this.rs.getBinaryStream(colIndex+1);
						}
						
						if (stream){
							curValue =Packages.org.apache.commons.io.IOUtils.toByteArray(stream);
						} 
					}
				break;
				case Types.CLOB:
					curValue = this.rs.getObject(colIndex+1);
					if (curValue){
						if ("read" in curValue){ 
							stream = curValue;
						} else {
							stream = this.rs.getCharacterStream(colIndex+1);
						}
						
						if (stream){
							curValue =String(Packages.org.apache.commons.io.IOUtils.toString(stream));
						} 
					}
				break;
				default:
					curValue = String(this.rs.getObject(colIndex+1))
					if (this.rs.wasNull()) curValue=null;
				break;
			}
			
			
			return curValue;
		},
		/* Function: getRow
			returns all the values of the current row as a JavaScript object
			
			
		*/
		getRow:function(){
			var result={}
			var row = this;
			this.columns.forEach(function(col,index){
				var name = col.name;
				
				if (!row.query.db || !row.query.db.isCaseSensitive){
					name = name.toLowerCase();
				} 
				result[name] = row.getValue(index) 
			})
			return result;
			
		},
		/*	Property: rowNum
			the current row number, starting with 1 
		*/
		get rowNum(){
			return this.rs.getRow();	
		}
	}
/* Class: Myna.QueryParams 
	Object that contains query parameter information
	
	Detail:
	
	This object can be contructed from an array or via the 
	<Myna.QueryParams.addValue> function. It represents an array of explicitly 
	typed values to use in a query. 
*/
/*
	Constructor: QueryParams
	Constructs QueryParams object
	
	Parameters:
		config		-	*Optional default null* Array of parameter objects in 
						the form of [{value:'value',type:'type',isNull:false}]
	
	See:
		<Myna.Query>
	 
	*/
	Myna.QueryParams=function(config){
		this.params=[];
		var thisObj = this;
		if (config instanceof Array){
			config.forEach(function(element){
				element.setDefaultProperties({
					value:"",
					type:"VARCHAR",
					isNull:false
				})
				Myna.QueryParams.prototype.addValue.call(thisObj,element.value, element.type, element.isNull);
			});
		}
		
	}
	
	Myna.QueryParams.prototype={
		/* Function: addValue
			adds an sql parameter value to to QueryParams and returns a paceholder.
			
			Parameters:
				value	-	value to store
				type	-	*Optional default 'VARCHAR'* String or numeric JDBC type. See java.sql.types for the names
				isNull	-	*Optional default false* If true, the value is ignored 
							and an SQL null of the supplied type will be used instead 
	
			Returns:
				Placeholder value for a prepared statement: "?"
				
		*/
		addValue:function(value,type,isNull){
			if (type == undefined) type='VARCHAR';
			if (type.toUpperCase) type = type.toUpperCase();
			
			if (isNull == undefined) isNull=false;
			var sqlTypes = java.sql.Types;
			
			//some type conversions
				//dates and times
					if ("DATE" == type){
						value = new java.sql.Date(new Date(value).getTime());
					}
					if ("TIME" == type){
						value = new java.sql.Time(new Date(value).getTime());
					}
					if ("TIMESTAMP" == type){
						value = new java.sql.Timestamp(new Date(value).getTime());
					}
			if (ObjectLib.typeOf(value) == 'date') value = new java.sql.Timestamp(value.getTime());
					
			if (isNaN(parseInt(type))){
				type= sqlTypes[type];
			}
			this.params.push({
				type:type,
				value:value,
				isNull:isNull
			});
			
			return "?";
		},
		
	}
