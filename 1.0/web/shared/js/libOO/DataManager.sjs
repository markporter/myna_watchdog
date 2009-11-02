if (!Myna) var Myna={}

/* Class: Myna.DataManager
		Creates Objects for reading from and writing to database tables 

		Myna.DataManager is a dynamic Object-Relational Mapping (ORM) tool to 
		simplify basic Create, Read, Update and Delete (CRUD) operations on 
		database tables.
   		
		The basic concept is that for a given table Myna.DataManager can generate a
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

			var dm = new Myna.DataManager("hr_datasource");
			
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
/* Constructor: Myna.DataManager
		Contructs a Myna.DataManager Object for the supplied dataSource
		
		Parameters:
			dataSource	-	Datasource Name
			
		
	*/
	Myna.DataManager = function (dataSource){ 
		/* Property: ds
			Datasource associated with this Myna.DataManager 
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
		this.managerTemplate = ({}).setDefaultProperties( 
			Myna.DataManager.managerTemplate
		)
		this.beanTemplate =({}).setDefaultProperties( 
			Myna.DataManager.beanTemplate
		)
	 
	
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
		var dm = new Myna.DataManager("hr_datasource");
		
		dm.subClasses.employeesManager = function(Myna.DataManager){}
		
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
			var dm = new Myna.DataManager("hr_datasource");
			Myna.includeOnce('employeesManager.sjs',dm.subClasses)
		(end)
		
		employeesManager.sjs:
		(code)
			function employeesManager(Myna.DataManager){
				this.genKey=function(){
					return new Myna.Query({
						dataSource:Myna.DataManager.ds,
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
		
		
		if (subClassName in this.subClasses){
			Myna.println("'" + subClassName +"'")
			manager = ({}).setDefaultProperties( 
				this.subClasses[subClassName]
			)
			manager.baseManager = ({}).setDefaultProperties( 
				this.managerTemplate
			)
			manager.setDefaultProperties(manager.baseManager);
		} else {
			
			manager= ({}).setDefaultProperties( 
				this.managerTemplate
			)
		}
		manager.ds = this.ds;
		manager.db = this.db;
		manager.dm = this
		manager.beanTemplate =({}).setDefaultProperties( 
			this.beanTemplate
		)
		manager.subClasses = ({}).setDefaultProperties( 
			this.subClasses
		)
		
		manager.table =this.db.getTable(tableName);
		$profiler.end("manager.getManager for " + tableName)
		manager.loadTableData(tableName);
		manager.init();
		return manager;
		
	}


	
/* Class: Myna.DataManager.beanTemplate
	template for "bean" objects
	
	Detail: 
		Used by <Myna.DataManager.managerTemplate.getById> to create a 
		Bean instance
*/
Myna.DataManager.beanTemplate ={
	init:function(){},
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
	setFields:function(fields){
		var bean = this;
		var result = new Myna.ValidationResult();
			fields.getKeys().forEach(function(name){
				if (bean["set_"+name]){
					result.merge(bean["set_"+name](fields[name]));
				} 
			})
		
		return result;
	},
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
	saveField:function(fieldName,newval){
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
					UPDATE <%=this.sqlTableName%>
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
	},
	/* Function: getData
		return a structure of this bean's data
		
		Detail: 
		This is a copy of the data, so it will not change when 
		the object is modified
	*/
	getData:function(){
		var result ={}
		result.setDefaultProperties(this.data)
		return result;
	},
	/* Function: getParent
		return a bean representing this bean's parent record
		
		Parameters:
			column		-	*Optional, default: first foreign key*
							column name in this table to dereference. Must be a 
							properly defined foreign key in the database 
		
		Example:
		(code)
			var orderBean = new Myna.DataManager("myapp")
								.getManager("orders")
								.getById(curOrderId);
			var customerBean = orderBean.getParent("customer_id");
			Myna.print(customerBean.last_name);
		(end)
	*/
	getParent:function(column){
		var fkrow;
		
		if (!column) {
			fkrow = this.manager.table.foreignKeys.findFirst("pkcolumn_name",/\w+/)
			if (!fkrow) throw new SyntaxError("No foreign keys in table '" + this.manager.table.sqlTableName +"'")
			column = fkrow.fkcolumn_name;	
		} else {
			fkrow = this.manager.table.foreignKeys.findFirst("fkcolumn_name",new RegExp("^"+column+"$","i"));
		}
		if (!fkrow) throw new SyntaxError("No foreign key '"+column+"' in table '" + this.manager.table.sqlTableName +"'")
		return this.manager.dm.getManager(fkrow.pktable_name).getById(this[column.toLowerCase()])
	},
	/* Function: getChildren
		return a <Myna.DataSet> of beans representing this bean's child records
		
		Parameters:
			table		-	name of child table to check for matching rows
			column		-	*Optional, default: first exported key to child table*
							column_name to match in child table. This is only 
							necessary if the child table declares more than one foreign 
							key to this table 
		
		Example:
		(code)
			var customerBean = new Myna.DataManager("myapp")
								.getManager("customers")
								.getById(curCustomerId);
			var orders = customerBean.getChildren("orders");
			Myna.print("Orders Total: " +orders.sumByCol("order_total"));
		(end)
	*/
	getChildren:function(table,column){
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
	},
}
/* Class: Myna.DataManager.managerTemplate 
	template for table managers
	
	Detail: 
		Used by <Myna.DataManager.getManager> to create a manager instance.   
*/
Myna.DataManager.managerTemplate ={
	init:function(){},
	/* Function: loadTableData
		internal function to load table data into the manager
	*/
		loadTableData:function(tableName){
			var manager = this;
			var con = manager.db.con;
			//var tables = manager.db.tables;
			
			
			manager.tableName = manager.table.tableName;
			manager.sqlTableName = manager.table.sqlTableName;
			
			
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
		},
	/* Function: remove
		Removes a row from the managed table matching the supplied primary key
		
		Parameters:
			id	-	primary key value of the row to remove 
	*/
		remove:function(id){
			var manager = this;
			var p = new Myna.QueryParams();
			var qry = new Myna.Query({
				dataSource:this.ds,
				sql:<ejs>
					delete from <%=this.sqlTableName%>
					where <%=this.columns[this.primaryKey].column_name%> = 
						<%=p.addValue(id,this.columns[this.primaryKey].data_type)%>
				</ejs>,
				parameters:p
			});
		},
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
	
				var dm = new Myna.DataManager("hr_datasource");
				
				var empManager = dm.getManager("employees");
				
				var newEmpBean = empManager.create({
					fname:"Bob",
					lname:"Dobb",
					hire_date:Date.parse("02/21/1992","m/d/Y")
				})
				
				(end)
	*/
		create:function(requiredFields){
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
			
			//update if exists instead of creating
			if (this.primaryKey){
				var exists =this.findBeans(requiredFields[this.primaryKey]);
				if (exists.length) {
					exists[0].setFields(requiredFields);
					return exists[0];
				}
			}
			
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
					insert into <%=this.sqlTableName%>(<%=fieldArray.join()%>) 
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
		},
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
		find:function(pattern,caseSensitive){
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
					from <%=this.sqlTableName%>
					where 1=1
					<@loop array="criteria" element="col" >
						and <%=col.column%> <%=col.op%> <%=p.addValue(col.pattern)%>
					</@loop>
				</ejs>
			})
			return qry.valueArray(pkey.toLowerCase());
		},
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
			var bobs_emps = employees.findBeans({
				manager_id:"55652315"
			})
			
			//Who are Bob's employees?
			bobs_emps.forEach(function(employee){
				Myna.print(employee.get_name() +"<br>");
			})
			//What are their email addresses?
			Myna.printDump(bobs_emps.valueArray("email"),"Bob's Emloyees' Email")
			
			
			//more complicated search with wildcards
			var bobs_helpers = employees.findBeans({
				manager_id:"55652315",
				job_title:"%assitant%"
			})
			
			//Using aggregate math: Bob's employees average salary
			//See Myna.DataSet
			var bobs_emps_avg_sal = employees.findBeans({
				manager_id:"55652315"
			}).average("salary")
			
		(end)
			
			See:
				<find>
	*/
		findBeans:function(pattern,caseSensitive){
			var $this = this;
			return new Myna.DataSet({
				columns:$this.columnNames,
				data:this.find(pattern,caseSensitive).map(function(id){
					return $this.getById(id);
				})
			})
		},
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
		genKey:function(){
			var maxId =new Myna.Query({
				dataSource:this.ds,
				sql:'select max(' + this.columns[this.primaryKey].column_name+ ') as id from ' + this.sqlTableName 
			}).data[0].id;
			if (!maxId) {
			 	return 1;
			} else {
				return maxId +1;
			}
		},
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
		var dm = new Myna.DataManager("hr_datasource");
		
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
						from <%=this.manager.sqlTableName%> 
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
		getById:function(id){
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
						
					from <%=this.sqlTableName%>
					where <%=this.columns[this.primaryKey].column_name%> = 
						<%=p.addValue(id,this.columns[this.primaryKey].data_type)%>
				</ejs>,
				parameters:p
			});
			
			if (!qry.data.length) {
				throw new Error("Unable to find '" + this.sqlTableName + "' by id '" + id +"'.");
			}
				
			var subClassName = manager.sqlTableName.replace(/\./g,"_")+"Bean";
			if (subClassName in this.subClasses){
				bean = ({}).setDefaultProperties( 
					this.subClasses[subClassName]
				)
			} 
			
			
			bean.baseBean = ({}).setDefaultProperties( 
				this.beanTemplate
			)
			bean.manager=manager;
			bean.dm = manager.dm;
			bean.ds = manager.ds;
			bean.data=qry.data[0];
			bean.id=id;
			
			//for (var p in bean) bean.hideProperty(p);
			//print(dump(qry,"bean query"))
			this.columnNames.forEach(function(colname){
				var fname = colname;
				
				bean.baseBean["get_"+fname] = function (){
					return this.data[arguments.callee.fieldName];
				}
				bean.__defineGetter__(fname, bean.baseBean["get_"+fname]);
				
				bean.baseBean["get_"+fname].fieldName = colname;
				//bean.hideProperty("get_"+fname);

				
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
					//bean.hideProperty("set_"+fname);
				}
				
			})
			
			
			bean.setDefaultProperties(bean.baseBean);
			//for (var p in bean.baseBean) bean.hideProperty(p);
			  
			
			bean.setDefaultProperties(this);
			//for (var p in this) bean.hideProperty(p);
			bean.init();
			return bean;
		},
}
	

