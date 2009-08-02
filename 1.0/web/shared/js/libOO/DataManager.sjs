if (!Myna) var Myna={}

/* 
	Class: Myna.DataManager
		Creates Objects for reading from and writing to database tables 

		DataManager is a dynamic Object-Relational Mapping (ORM) tool to 
		simplify basic Create, Read, Update and Delete (CRUD) operations on 
		database tables.
   		
		The basic concept is that for a given table DataManager can generate a
		manager object that represents that table and knows how to create and 
		delete rows. That manager can then generate a bean object that 
		represents a specific row in the table that knows how to read and write 
		column values to that row. Both of these types objects can be extended 
		for extra functionality. 
		
		Here is an example:
		(code)
				+- - - - - - - - - - - - - - - - - -+
				|	table employees					|
				+- - - - - - - - - - - - - - - - - -+
				|	emp_id		int4	primary key	|
				|	fname		varchar				|
				|	mname		varchar				|
				|	lname		varchar				|
				|	manager_id	int4				|
				|	hire_date	date				|
				+- - - - - - - - - - - - - - - - - -+

			var dm = new DataManager("hr_datasource");
			
			var empManager = dm.getManager("employees");
			
			var newEmpBean = empManager.create({
				fname:"Bob",
				lname:"Dobb",
				hire_date:Date.parse("02/21/1992","m/d/Y")
			})
			
			print (newEmp.get_emp_id()) // Prints the auto generated primary key
			newEmp.set_mname("R"); //sets this value in an update
			
			// column values are also available as property proxies on the bean objects:
			// see https://developer.mozilla.org/En/Core_JavaScript_1.5_Guide:Creating_New_Objects:Defining_Getters_and_Setters
			// for how this works
			print (newEmp.emp_id) // calls get_emp_id() on the bean
			newEmp.mname = "R"; // calls set_emp_id("R") on the bean
			
		
			
			// you can also add your own functions to mangers and beans
			dm.subClasses.employeesBean = function(){}
			dm.subClasses.employeesBean.prototype.getBoss = function(){
				if (this.get_manager_id().length){
					return this.manager.get_by_id(this.data.manager_id);
				}
			}
			
			var myBoss = empManager.get_by_id(1000012).getBoss();
			
			
			
			
		(end)
		
		Also check out empManager.columns for metadata about each column in the 
		table, such as name, default value, size, type, nullable, precision and 
		more.
	*/
/* 	
	Constructor: DataManager
		Contructs a DataManager Object for the supplied dataSource
		
		Parameters:
			dataSource	-	Datasource Name
			
		
	*/
	Myna.DataManager = function (dataSource){ 
		/* Property: ds
			Datasource associated with this DataManager 
		*/
		this.ds = dataSource;
		/* Property: db
			<Myna.Database> object that represents the database this table resides in 
		*/
		this.db = new Myna.Database(dataSource);
		/* Property: subClasses
			Contains contructors for overiding sub classes in the form of 
			<tablename>Bean or <tablename>Manager.
			
			
		*/
		this.subClasses={}
	}
/* Function: getManager
	Contructs a manager object for the supplied table.
	
	Parameters:
		tableName		- lowercase name of the table
		
	Detail:
		Creates table manager  (<Myna.DataManager.prototype.ManagerBase>) for 
		the supplied table. If 	<Myna.DataManager.subClasses> contains an object 
		named <tablename>Manager, that object is used instead, and any missing 
		functions are copied from <Myna.DataManager.prototype.ManagerBase>. The 
		subClasses contructor is called with a reference to the data manager 
		instance.
		
		Examples of extending ManagerBase:
		
		(code)
		var dm = new DataManager("hr_datasource");
		
		dm.subClasses.employeesManager = function(dataManager){}
		
		//new function, returns an array of employee objects
		dm.subClasses.employeesManager.prototype.getByManagerId = function(manager_id){
			var p = new Myna.QueryParams();
			var qry = new Myna.Query({
				dataSource:this.ds,
				sql:<ejs>
					select emp_id
					from employees
					where manager_id=<%=p.addValue(manager_id,this.columns.manager_id.data_type)%>
					);
				</ejs>,
				parameters:p
			})
			var thisManager = this;
			return qry.data.map(function(row){
				return thisManager.getById(row.emp_id);
			})
		}
		
		//override existing function: logs all deletes
		dm.subClasses.employeesManager.prototype.delete = function(emp_id){
			//let's assume there is a log table in this datasource
			this.dm.getManager("log_table").create({
				event:"delete",
				emp_id:emp_id
			});
			
			//no we call the baseManager's delete function using this scope
			this.baseManager.delete.apply(this, arguments)
		}
		(end)
		
		Using includes to define subclasses:
		(code)
			var dm = new DataManager("hr_datasource");
			Myna.includeOnce('employeesManager.sjs',dm.subClasses)
		(end)
		
		employeesManager.sjs:
		(code)
			function employeesManager(dataManager){
				this.genKey=function(){
					return new Myna.Query({
						dataSource:dataManager.ds,
						sql:"select NEXTVAL('seq_employees') as id"
					}).data[0].id;
				}
			}
			
			employeesManager.prototype.delete = function(emp_id){
				//let's assume there is a log table in this datasource
				this.dm.getManager("log_table").create({
					event:"delete",
					emp_id:emp_id
				});
			
				//no we call the baseManager's delete function using this scope
				this.baseManager.delete.apply(this, arguments)
			}
		(end)
		
*/
	Myna.DataManager.prototype.getManager=function(tableName){
		$profiler.begin("manager.getManager for " + tableName)
		var manager;
		var subClassName = tableName+"Manager";
		
		if (this.subClasses.hasOwnProperty(subClassName)){
			manager = new this.subClasses[subClassName](this);
			manager.baseManager = new this.ManagerBase();
			manager.setDefaultProperties(manager.baseManager);
		} else {
			manager= new this.ManagerBase();
		}
		manager.ds = this.ds;
		manager.db = this.db;
		manager.dm = this
		
		
		manager.table =this.db.getTable(tableName);
		$profiler.end("manager.getManager for " + tableName)
		manager.loadTableData(tableName);
		
		return manager;
		
	}

/* Class: Myna.DataManager.prototype.ManagerBase 
	base class for all table managers
	
	Detail: 
		Used by <Myna.DataManager.getManager> to create a manager instance.   
*/
	Myna.DataManager.prototype.ManagerBase=function(){}
	/* Property: ds
		dataSource associated with this table manager instance
	*/
	/* Property: table
		<Myna.Table> object that represents the manages table 
	*/
	
	/* Property: dm
			<Myna.DataManager> associated with this table manager instance
		*/
	/* Property: columns
			Object of column info by lowercase column name. 
			From the Java Documentation:
			  -  TABLE_CAT String => table catalog (may be null)
			  -  TABLE_SCHEM String => table schema (may be null)
			  -  TABLE_NAME String => table name
			  -  COLUMN_NAME String => column name
			  -  DATA_TYPE int => SQL type from java.sql.Types
			  -  TYPE_NAME String => Data source dependent type name, for a UDT the type name is fully qualified
			  -  COLUMN_SIZE int => column size. For char or date types this is the maximum number of characters, for numeric or decimal types this is precision.
			  -  BUFFER_LENGTH is not used.
			  -  DECIMAL_DIGITS int => the number of fractional digits
			  -  NUM_PREC_RADIX int => Radix (typically either 10 or 2)
			  -  NULLABLE int => is NULL allowed.
			  -  REMARKS String => comment describing column (may be null)
			  -  COLUMN_DEF String => default value (may be null)
			  -  SQL_DATA_TYPE int => unused
			  -  SQL_DATETIME_SUB int => unused
			  -  CHAR_OCTET_LENGTH int => for char types the maximum number of bytes in the column
			  -  ORDINAL_POSITION int => index of column in table (starting at 1)
			  -  IS_NULLABLE String => "NO" means column definitely does not allow NULL values; "YES" means the column might allow NULL values. An empty string means nobody knows.
			  -  SCOPE_CATLOG String => catalog of table that is the scope of a reference attribute (null if DATA_TYPE isn't REF)
			  -  SCOPE_SCHEMA String => schema of table that is the scope of a reference attribute (null if the DATA_TYPE isn't REF)
			  -  SCOPE_TABLE String => table name that this the scope of a reference attribure (null if the DATA_TYPE isn't REF)
			  -  SOURCE_DATA_TYPE short => source type of a distinct type or user-generated Ref type, SQL type from java.sql.Types (null if DATA_TYPE isn't DISTINCT or user-generated REF) 
			
			
			for more detail see 
			http://java.sun.com/j2se/1.4.2/docs/api/java/sql/DatabaseMetaData.html
		*/
	/* Property: columnNames
		array of lowercase column names in the order they appear in the table 
	*/
	/* Property: tableName
		name of the managed table as reported by the datasource
	*/
	/* Property: primaryKey
		name of the primaryKey for this table. 
		
		Datamanager can only work with tables that have a single primary key
	*/
	
	/* Function: loadTableData
		internal function to load table data into the manager
	*/
		Myna.DataManager.prototype.ManagerBase.prototype.loadTableData=function(tableName){
			var manager = this;
			manager.tableName=tableName;
			
			var con = manager.db.con;
			//var tables = manager.db.tables;
			
			
			manager.tableName = manager.table.tableName;
			
			
			if (!manager.table.exists){
				throw new Error("No table '" + tableName +"' found in data source '" + manager.ds +"' \nTables: " + manager.db.tables.join());
			}
			
			manager.columns = manager.table.columns;
			manager.columnNames = manager.table.columnNames;
			 
			
			if (manager.table.primaryKeys.length != 1){
				throw new Error("getManager can only handle tables with exactly one primary key");	
			} 
			if (manager.table.primaryKeys.length == 1){
				manager.primaryKey=manager.table.primaryKeys[0]
			} else {
				manager.primaryKey=null;
			}
			return manager;
		}
	/* Function: remove
		Removes a row from the managed table matching the supplied primary key
		
		Parameters:
			id	-	primary key value of the row to remove 
	*/
		Myna.DataManager.prototype.ManagerBase.prototype.remove=function(id){
			var manager = this;
			var p = new Myna.QueryParams();
			var qry = new Myna.Query({
				dataSource:this.ds,
				sql:<ejs>
					delete from "<%=this.tableName%>"
					where <%=this.columns[this.primaryKey].column_name%> = 
						<%=p.addValue(id,this.columns[this.primaryKey].data_type)%>
				</ejs>,
				parameters:p
			});
		}
	/* Function: create 
		Creates a record in the database, optionally generating a primary key
		
		Parameters:
			requiredFields	-	An object where the keys are column names and 
								the values are the values to insert.
								
			Detail:
				_requiredFields_  must contain entries for all  non-null columns 
				without default values, except the primary key. If the primary 
				key is not specified, and the column does not have a default 
				value, <genKey> is called to generate a key. Any extra columns 
				supplied will be inserted as well.
				
			Returns:
				instance of the Bean that represents the new row. See 
				<getById>
				
			Example:
				(code)
					+- - - - - - - - - - - - - - - - - -+
					|	table employees					|
					+- - - - - - - - - - - - - - - - - -+
					|	emp_id		int4	primary key	|
					|	fname		varchar				|
					|	mname		varchar				|
					|	lname		varchar				|
					|	manager_id	int4				|
					|	hire_date	date				|
					+- - - - - - - - - - - - - - - - - -+
	
				var dm = new DataManager("hr_datasource");
				
				var empManager = dm.getManager("employees");
				
				var newEmpBean = empManager.create({
					fname:"Bob",
					lname:"Dobb",
					hire_date:Date.parse("02/21/1992","m/d/Y")
				})
				
				(end)
	*/
		Myna.DataManager.prototype.ManagerBase.prototype.create=function(requiredFields){
			var manager = this;
			if (!requiredFields) requiredFields={}
			if (this.primaryKey	 && !requiredFields[this.primaryKey]){
				/* if (this.columns[this.primaryKey].column_def.length ==0) { */
					requiredFields[this.primaryKey] = this.genKey();
				/* } */
			}
			
			if (!requiredFields) requiredFields={}
			
			requiredFields.checkRequired(this.columnNames.filter(function(colName){
					return (manager.columns[colName].is_nullable == "NO" 
						&& !manager.columns[colName].column_def
						&& colName != manager.primaryKey);
				
			}))
			
			var columnArray = requiredFields.getKeys().filter(function(colName){
				//ignore columns that don't exist
				return manager.columns[colName];
			}); 
			var fieldArray = columnArray.map(function(colName){
				return  '"' + manager.columns[colName].column_name + '"';
			});
			
			var p = new Myna.QueryParams();
			var qry = new Myna.Query({
				dataSource:this.ds,
				parameters:p,
				sql:<ejs>
					insert into <%=this.tableName%>(<%=fieldArray.join()%>) 
					values (
					<% 
						columnArray.forEach(function(colName,index){
							var value = requiredFields[colName];
							var type = manager.columns[colName].data_type;
							var isNull = (value === null);
							Myna.print(p.addValue(value,type,isNull))
							if (index < columnArray.length -1) Myna.print(",")
						});
						
					%>
					)
					
				</ejs>
			});
			if (this.primaryKey 
				
			 && (this.columns[this.primaryKey].column_def ==null ||this.columns[this.primaryKey].column_def.length !=0)  
			 && !requiredFields[this.primaryKey]){
				 requiredFields[this.primaryKey] = qry.generatedKey
			}
			return this.getById(requiredFields[this.primaryKey]);
		}
	/* Function: find
		returns an array of primaryKey values that match a search
		
		Parameters:
			pattern			-	if this is a string, the primary key will be 
									searched for this value. If this is an object, each 
									key is expected to by a column name and the value a 
									pattern to search for. In either mode, the SQL 
									wildcard (%) can be used for a "like" search.
			caseSensitive	-	*Optional, default false*
									if true, patterns will be matched in a 
									case-sensitive manner
		
		
		Examples:
		(code)
			var employees = new Myna.DataManager("some_ds").getManager("employees");
			
			// a primary key search
			var bob_exists = employees.find("55652315").length
			
			//one column search for exact match
			var bobs_emps = employees.find({
				manager_id:"55652315"
			})
			
			//Who are Bob's employees?
			bobs_emps.forEach(function(employee_id){
				Myna.print(employees.getById(employee_id).get_name() +"<br>");
			})
			
			//more complicated search with wildcards
			var bobs_helpers = employees.find({
				manager_id:"55652315",
				job_title:"%assitant%"
			})
		(end)
			
		See:
			<findBeans>
	*/
		Myna.DataManager.prototype.ManagerBase.prototype.find=function(pattern,caseSensitive){
			var criteria=[];
			var pkey =this.columns[this.primaryKey].column_name;
			
			
			if (typeof pattern == "string"){
				criteria.push({
					column:pkey,
					op:/%/.test(pattern)?" like " :" = ",
					pattern:pattern
				})
			} else if (typeof pattern == "object"){
				var myColumnList = this.columnNames.join()
				pattern.getKeys().filter(function(colname){
					return myColumnList.listContains(colname.toLowerCase())
				}).forEach(function(colName){
					if (pattern[colName] === undefined) pattern[colName] ="";
					criteria.push({
						column:caseSensitive?colName:"lower(" + colName +")",
						op:/%/.test(pattern[colName])?" like " :" = ",
						pattern:caseSensitive?pattern[colName]:pattern[colName].toLowerCase()
					})
					
				})	
			} else {
				throw new Error("Myna.DataManager.prototype.ManagerBase.prototype.find: Pattern must be a string or an object")	
			}
			var p = new Myna.QueryParams();
			var qry = new Myna.Query({
				dataSource:this.ds,
				parameters:p,
				sql:<ejs>
					select <%=pkey%>
					from <%=this.tableName%>
					where 1=1
					<@loop array="criteria" element="col" >
						and <%=col.column%> <%=col.op%> <%=p.addValue(col.pattern)%>
					</@loop>
				</ejs>
			})
			return qry.valueArray(pkey);
		}
	/* Function: findBeans
		returns a <Myna.DataSet> of bean objects that match a search
		
		Parameters:
			pattern			-	if this is a string, the primary key will be 
									searched for this value. If this is an object, each 
									key is expected to by a column name and the value a 
									pattern to search for. In either mode, the SQL 
									wildcard (%) can be used for a "like" search.
			caseSensitive	-	*Optional, default false*
									if true, patterns will be matched in a 
									case-sensitive manner
		
		
		Examples:
		(code)
			var employees = new Myna.DataManager("some_ds").getManager("employees");
			
			// a primary key search
			var bob_exists = employees.find("55652315").length
			
			//one column search for exact match
			var bobs_emps = employees.find({
				manager_id:"55652315"
			})
			
			//Who are Bob's employees?
			bobs_emps.forEach(function(employee){
				Myna.print(employee.get_name() +"<br>");
			})
			
			
			//more complicated search with wildcards
			var bobs_helpers = employees.find({
				manager_id:"55652315",
				job_title:"%assitant%"
			})
		(end)
			
			See:
				<find>
	*/
	Myna.DataManager.prototype.ManagerBase.prototype.findBeans=function(pattern,caseSensitive){
		var $this = this;
		return new Myna.DataSet({
			columns:$this.columnNames,
			data:this.find(pattern,caseSensitive).map(function(id){
				return $this.getById(id);
			})
		})
	}
	/* Function: genKey
		generates a primary key value
		
		Detail:
			By default this returns the maximum value of the primary key 
			column + 1. This is not the ideal algorythm and should be replaced 
			with a database specific means of generating a primary key. 
			
			This function can be replaced globally on a data manager instance:
			(code)
				var dm = new Myna.DataManager("some datasource");
			    dm.ManagerBase.prototype.genKey=function(){<your code here>}
			(end)
			
			This function can be replaced in a table manager subclass: 
			(code)
				var dm = new Myna.DataManager("some datasource");
				dm.subClasses.employeesManager=function(){
					this.genKey=function(){<your code here>}
				}
			(end)
			
			This function can also be replaced on a table manager instance: 
			(code)
				var dm = new Myna.DataManager("some datasource");
				var emp_manager = dm.getManager("employees")
			    emp_manager.genKey=function(){<your code here>}
			(end)
			
			
			
			
	*/
		Myna.DataManager.prototype.ManagerBase.prototype.genKey=function(){
			var maxId =new Myna.Query({
				dataSource:this.ds,
				sql:'select max(' + this.columns[this.primaryKey].column_name+ ') as id from "' + this.tableName +'"'
			}).data[0].id;
			if (!maxId) {
			 	return 1;
			} else {
				return maxId +1;
			}
		}
	/* Function: getById
		Returns a bean instance representing the row identified by the supplied primary key 
		
		Parameters:
			id	-	primary key value of the row to retrieve
			
		Returns:
			a bean instance representing the row identified by the supplied primary key
		
		Detail:
			This function loads the data from the indicated row into into a 
			<Myna.DataManager.prototype.BeanBase> object. If 
			<Myna.DataManager.subClasses> contains an object named 
			<tablename>Bean, that object is used instead, and any missing 
			functions are copied from <Myna.DataManager.prototype.BeanBase>. The 
			subClasses contructor is called with a reference to the data manger 
			instance, the table manager instance, and the data for the row 
			(<Myna.Query.data>). Each bean is generated with get_<column name>
			and set_<column name> functions. The set functions will immediately 
			set the value in the underlying row.
			
		Examples of extending BeanBase:
		
		(code)
		var dm = new DataManager("hr_datasource");
		
		// adding extra information during construction
		dm.subClasses.employeesBean = function(dm,manager,data){
			// sub Object for storing extra information not in the
			// employees table
			this.info={}
			if (data.supervisor_id.length) { // CEO has no supervisor_id 
				this.info.supervisor = manager.getById(data.supervisor_id)
			}
		}
		
		//overriding a base function
		dm.subClasses.employeesBean.prototype.set_ssn = function(newval){
			//"set" function must return a Myna.ValidationResult object
			var result = new Myna.ValidationResult();
			// check for unique ssn before insert
				var p = new Myna.QueryParams();
				var dupeSSN = new Myna.Query({
					dataSource:this.ds,
					sql:<ejs>
						select 'x' 
						from <%=this.manager.tableName%> 
						where ssn = <%=p.addValue(newval,this.manager.columns.ssn.data_type)%>
						and emp_id != <%=p.addValue(this.data.emp_id,this.manager.columns.emp_id.data_type)%>
					</ejs>,
					parameters:p
				})
				
			if (dupeSSN.data.length){
				result.addError("SSN '" + newval +"' already in use by another employee","ssn");	
			} else {
				this.baseBean.set_ssn.apply(this, arguments)
			}
			return result;
		}
		(end)
	*/
		Myna.DataManager.prototype.ManagerBase.prototype.getById=function(id){
			var manager = this;
			var bean={};
			var p = new Myna.QueryParams();
			var qry = new Myna.Query({
				dataSource:this.ds,
				sql:<ejs>
					select
						<@loop array="manager.columnNames" element="name" index="i">
							"<%=manager.columns[name].column_name%>" <@if i < manager.columnNames.length - 1 >,</@if>
						</@loop>
						
					from <%=this.tableName%>
					where <%=this.columns[this.primaryKey].column_name%> = 
						<%=p.addValue(id,this.columns[this.primaryKey].data_type)%>
				</ejs>,
				parameters:p
			});
			
			if (!qry.data.length) {
				throw new Error("Unable to find '" + this.tableName + "' by id '" + id +"'.");
			}
				
			var subClassName = manager.tableName+"Bean";
			if (this.dm.subClasses.hasOwnProperty(subClassName)){
				bean = new this.dm.subClasses[subClassName](this.dm,this,qry.data);
			} 
			
			
			bean.baseBean = new this.dm.BeanBase(this);
			bean.data=qry.data[0];
			bean.id=id;
			
			//print(dump(qry,"bean query"))
			this.columnNames.forEach(function(colname){
				var fname = colname;
				
				bean.baseBean["get_"+fname] = function (){
					return this.data[arguments.callee.fieldName];
				}
				bean.__defineGetter__(fname, bean.baseBean["get_"+fname]);
				
				bean.baseBean["get_"+fname].fieldName = colname;
				

				
				if (fname != manager.primaryKey){
					bean.baseBean["set_"+fname] = function (newval){
						var result = new Myna.ValidationResult();
						if (typeof newval === "undefined"){
							result.addError("argument 'newval' required for set" +fname +".",fname);
							return result;
						}
						if (newval != this.data[arguments.callee.fieldName]){
							result.merge(this.saveField(arguments.callee.fieldName,newval));
							this.data[arguments.callee.fieldName] = newval;
						}
						return result;
					}
					bean.__defineSetter__(fname, bean.baseBean["set_"+fname]);
					bean.baseBean["set_"+fname].fieldName = colname;
				}
				
			})
			
			bean.setDefaultProperties(bean.baseBean);
			
			  
			
			bean.setDefaultProperties(this);
			return bean;
		}
/* Class: Myna.DataManager.prototype.BeanBase
	base class for "bean" objects
	
	Detail: 
		Used by <Myna.DataManager.prototype.ManangerBase.getById> to create a 
		Bean instance
*/
	Myna.DataManager.prototype.BeanBase=function(manager){
		/* Property: manager
			a reference to this bean's table manager instance
		*/
		this.manager=manager;
		/* Property: dm
			a reference to this bean's <Myna.DataManager> instance
		*/
		this.dm = manager.dm;
		/* Property: ds
			a reference to this bean's dataSource
		*/
		this.ds = manager.ds;
	}
	
	/* Function: get_<columnName>
		gets a value for <columnName>
		
		Detail:
			This function is generated for every column in the 
			associated table.
	*/
	/* Function: set_<columnName>
		sets a value for <columnName>
		
		Parameters:
			newval		-	new value for the column
		
		Returns:
			<Myna.ValidationResult> object representing the result of the set.
			
		Detail:
			This function is generated for every column in the 
			associated table, except for the primary key.
	*/
	
	
	/* Function: setFields
		Sets multiple fields at once
		
		Parameters:	
			fields	-	an object of column names and their values 
		
		Returns:
			<Myna.ValidationResult> representing the result of this action.
			
		Detail:
			This function will examine each non-function property of fields and
			call the corosponding "set" function, if available. Properties that do 
			not match a "set" function are ignored 
	*/
	Myna.DataManager.prototype.BeanBase.prototype.setFields=function(fields){
		var bean = this;
		var result = new Myna.ValidationResult();
			fields.getKeys().forEach(function(name){
				if (bean["set_"+name]){
					result.merge(bean["set_"+name](fields[name]));
				} 
			})
		
		return result;
	}
	/* Function: saveField
		Persists a value to its underlying row
		
		Parameters:	
			fieldName	-	A column name in the row to savee a value to
			newval		-	The value to save
			
		Returns:
			<Myna.ValidationResult> representing the result of this action.		
		
		Detail:
			This function is normally called from the "set" function, but may be
			useful when overriding the generated "set" function.
	*/
	Myna.DataManager.prototype.BeanBase.prototype.saveField=function(fieldName,newval){
		var result = new Myna.ValidationResult();
		var bean = this;
		try {
			var columnName = this.columns[fieldName].column_name;
			var p =new Myna.QueryParams();
			var value = newval;
			var type = this.columns[fieldName].data_type;
			var isNull = (value === null);
			
			var qry = new Myna.Query({
				dataSource:this.manager.ds,
				parameters:p,
				sql:<ejs>
					UPDATE "<%=this.tableName%>"
					SET
						"<%=columnName%>" = <%=p.addValue(value,type,isNull)%>
					WHERE
						"<%=this.columns[this.primaryKey].column_name%>" = <%=p.addValue(bean.id,this.columns[this.primaryKey].data_type)%>
				</ejs>
			});
		} catch (e){
			result.addError(e.message,fieldName);
		}
		return result;
	}
	/* Function: getData
		return a structure of this bean's data
		
		Detail: 
		This is a copy of the data, so it will not change when 
		the object is modified
	*/
	Myna.DataManager.prototype.BeanBase.prototype.getData=function(){
		var result ={}
		result.setDefaultProperties(this.data)
		return result;
	}
	/* Function: getParent
		return a bean representing this bean's parent record
		
		Parameters:
			column		-	*Optional, default: first foreign key*
							column containing id to retrieve. Must be a properly 
							defined foreign key in the database 
		
		Example:
		(code)
			var orderBean = new Myna.DataManager("myapp")
								.getManager("orders")
								.getById(curOrderId);
			var customerBean = orderBean.getParent("custormer_id");
			Myna.print(customerBean.last_name);
		(end)
	*/
	Myna.DataManager.prototype.BeanBase.prototype.getParent=function(column){
		var fkrow;
		
		if (!column) {
			fkrow = this.manager.table.foreignKeys.findFirst("pkcolumn_name",/\w+/)
			if (!fkrow) throw new SyntaxError("No foreign keys in table '" + this.manager.table.tableName +"'")
			column = fkrow.fkcolumn_name;	
		} else {
			fkrow = this.manager.table.foreignKeys.findFirst("fkcolumn_name",new RegExp("^"+column+"$","i"));
		}
		if (!fkrow) throw new SyntaxError("No foreign key '"+column+"' in table '" + this.manager.table.tableName +"'")
		return this.manager.dm.getManager(fkrow.pktable_name).getById(this[column.toLowerCase()])
	}
	/* Function: getChildren
		return a <Myna.DataSet> of beans representing this bean's child records
		
		Parameters:
			table		-	name of table to check for children
			column		-	*Optional, default: first exported key to child table*
							column_name to match in child table. This is only 
							necessary if the child table declares mor than one foreign 
							key to this table 
		
		Example:
		(code)
			var customerBean = new Myna.DataManager("myapp")
								.getManager("customers")
								.getById(curCustomerId);
			var orders = orderBean.getChildren();
			Myna.print("Orders Total: " +orders.sumByCol("order_total"));
		(end)
	*/
	Myna.DataManager.prototype.BeanBase.prototype.getChildren=function(table,column){
		var fkrow;
		if (!table) throw new SyntaxError("parameter 'table' is required.")
		fkrow = 	this.manager.table.exportedKeys.findAll("fktable_name",new RegExp("^"+table+"$","i"))
		if (!fkrow.length) throw new SyntaxError("No child relationships with table '"+table+"' found.")
		if (column && fkrow.length >1){
			fkrow = fkrow.findFirst(fkcolumn_name,new RegExp("^"+column+"$","i"));
			if (!fkrow) throw new SyntaxError("No foreign key '"+column+"' in table '" + table +"' to this table")
		} else {
			fkrow = fkrow[0];
		}
		var search={}
		search[fkrow.fkcolumn_name.toLowerCase()] = this.id;
		return this.manager.dm.getManager(fkrow.fktable_name).findBeans(search)
	}
