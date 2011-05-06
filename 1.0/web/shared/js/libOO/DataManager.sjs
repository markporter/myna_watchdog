if (!Myna) var Myna={}
/* ========== documentation ================================================= */
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
                | table employees                   |
                +- - - - - - - - - - - - - - - - - -+
                | emp_id       int4    primary key  |
                | fname        varchar              |
                | mname        varchar              |
                | lname        varchar              |
                | manager_id   int4                 |
                | hire_date    date                 |
                +- - - - - - - - - - - - - - - - - -+

			var dm = new Myna.DataManager("hr_datasource");
			
			var empManager = dm.getManager("employees");
			
			var newEmpBean = empManager.create({
				fname:"Bob",
				lname:"Dobb",
				hire_date:Date.parse("02/21/1992","m/d/Y")
			})
			
			Myna.println (newEmp.get_emp_id()) // Prints the auto generated primary key
			newEmp.set_mname("R"); //sets this value in an update
			
			// column values are also available as property proxies on the bean objects:
			// see https://developer.mozilla.org/En/Core_JavaScript_1.5_Guide:Creating_New_Objects:Defining_Getters_and_Setters
			// for how this works
			Myna.println (newEmp.emp_id) // calls get_emp_id() on the bean
			newEmp.mname = "R"; // calls set_emp_id("R") on the bean
			
		
			
			// you can also add your own functions to mangers and beans
			empManager.beanTemplate.getBoss=function(){
				if (this.get_manager_id().length){
					return this.manager.get_by_id(this.data.manager_id);
				} else return this.manager.get_by_id(0); //CEO
			}
			
			//this loads the emplyeesBean defined in empManager.beanTemplate
			var myBoss = empManager.get_by_id(1000012).getBoss();
			
			
		(end)
		
		For more about extending DataManager classes, see:
		* <DataManager.managerTemplate>
		* <DataManager.beanTemplate>
		* <ManagerObject.beanTemplate>
		
		The DataManager can also manage MPTT organized tree tables. This is a 
		method of storing hierarchical data in flat database tables. 
		
		For more on this see:
		
		* <DataManager.getTreeManager>
		* <DataManager.TreeManagerObject>
		* <DataManager.TreeNodeObject>
		* Examples -> Ext.Direct -> Routing Ext Tree
		
		
		
		Also check out empManager.columns for metadata about each column in the 
		table, such as name, default value, size, type, nullable, precision and 
		more.
	
		Constructor: DataManager
				Contructs a Myna.DataManager Object for the supplied dataSource
				
				Parameters:
					dataSource	-	Datasource Name
					
				
			
			*/
		/* Function: getManager
			Constructs a <ManagerObject> for the supplied table.
			
			Parameters:
				tableName		- 	lowercase name of the table
				options			-	A JS object representing metadata for this table 
										that can't be calculated from the table itself  
										See "Options" Below
									
			Options:
				softDeleteCol	-	*Optional, default "deleted"*
										If this column exists in the table, then delete 
										operations will instead set this column to the 
										current time. Find operations will automatically 
										filter rows with this column set
				
			Detail:
				Creates a <ManagerObject> for the supplied table. 
				
			
			See: 
			* <Myna.DataManager.managerTemplate>
				
			
			*/
		/* Function: getTreeManager
			An extension of <getManager> that specifically manages Modified 
			Pre-order Tree Traversal (MPTT) organized tables.
			
			Parameters:
				tableName	-	Name of MPTT organized table
				options		-	A JS object representing metadata for the MPTT table. 
									See "Options" Below
									
			Options:
				leftCol		-	*Optional, default "lft" *
									Column name that contains the "left" values
				rightCol		-	*Optional, default "rgt" *
									Column name that contains the "right" values
				idCol			-	*Optional, default primary key col *
									The column that contains the "id" values
				parentCol	-	*Optional, default "parent_id" *
									The column that contains the "parent" values
				depthCol		-	*Optional, default null *
									The column that contains the "depth" values. If this 
									is null, then this TreeManager will not manage a 
									depth column
									
					
			See:
				* <TreeManagerObject> for More Detail on MPTT
			See Also:
				* Storing Hierarchical Data in a Database - http://articles.sitepoint.com/article/hierarchical-data-database
			*/
		/* Property: ds
				Datasource associated with this Myna.DataManager 
			
			*/
		/* Property: db
			<Myna.Database> object that represents the database this table resides in 
			
			*/
		/* Property: managerTemplate
			Base template for <ManagerObject>s. 
			
			This contains all the functions of <ManagerObject>. Behavior of <ManagerObject>s
			can be altered by modifying this object:
			(code)
				var dm = new Myna.DataManager("hr_datasource");
				
				
				//the init function is called right after instantiating a <ManagerObject> 
				dm.managerTemplate.init=function(){
					Myna.log("debug",this.table.tableName +" manager called");
				}
				
				//replace existing function
				dm.managerTemplate.genKey=function(value){
					return new Myna.Query({
						ds:this.ds,
						sql:<ejs>
							select sequence_<%=this.table.tableName%>.nextval from dual
						</ejs>
					}).data[0].nexval
				}
				
				//append or prepend function
				dm.managerTemplate.before("remove",function(id){
					Myna.log(
						"audit",
						"Table " +this.table.tableName +
							" row "+ this.data[this.table.primaryKey] + " removed.",
						"Removed by " + Myna.dump($cookie.getAuthUser()) +
							"<br> Values " + Myna.dump(this.getById(id).data)
					);
				})
			(end)
			See:
				* <Myna.DataManager.beanTemplate>
				* <ManagerObject.beanTemplate>
			
			*/
		/* Property: beanTemplate
			Base template for <BeanObject>s. 
			
			This contains all the functions of <BeanObject>. Behavior of <BeanObject>s
			can be altered by modifying this object:
			(code)
				var dm = new Myna.DataManager("hr_datasource");
				
				
				//the init function is called right after instantiating a <BeanObject> 
				dm.beanTemplate.init=function(){
					Myna.log(
						"audit",
						"Table " +this.manager.table.tableName +
							
						"Accessed by " +Myna.dump($cookie.getAuthUser())
					);
				}
				
				//replace existing function
				// This would make more sense to be set on a Manager's beanTemplate object
				dm.beanTemplate.set_age=function(value){
					//this is a calculated column and should not be set
					return;
				}
				
				//append or prepend function
				dm.beanTemplate.before("saveField",function(fname,newval){
					Myna.log(
						"audit",
						"Table " +this.manager.table.tableName +
							" row "+ this.data[this.table.primaryKey] 
							+ " column " + fname+" modified",
						"Modified by " + Myna.dump($cookie.getAuthUser()) +
							"<br>Old value:" + this.data[fname] +
							"<br>New value:" + newval
					);
				})
			(end)
			See:
				<ManagerObject.beanTemplate>
			
		*/			
	/* Class: ManagerObject 
		Table data access object generated and returned by <Myna.DataManager.getManager>
		
			*/
		
		/* Function: loadTableData
			internal function to load table data into the manager
			*/
		
		/* Function: remove
			Removes a row from the managed table matching the supplied primary key
			
			Parameters:
				id	-	primary key value of the row to remove
			*/
		
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
						 |   table employees                 |
						 +- - - - - - - - - - - - - - - - - -+
						 |  emp_id       int4    primary key |
						 |  fname        varchar             |
						 |  mname        varchar             |
						 |  lname        varchar             |
						 |  manager_id   int4                |
						 |  hire_date    date                |
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
		/* Function: query
			returns a <Myna.DataSet> of informatino from this table
			
			Parameters:
				pattern			-	if this is a String, Number, or Date, the primary 
										key will be searched for this value. If this is an 
										object, each key is expected to by a column name 
										and the value a pattern to search for. In either
										mode, the SQL wildcard (%) can be used for a 
										"like" search. Special pattern properties are 
										available for advanced queries. See *Special 
										Pattern Properties* below
										
				options			-	query options, see *options* below
			
			Special Pattern Properties:
				select	-	*default, "*"*
								This is the select expression to use for this query. 
								Any valid SQL will work
				where 	-	*default, false*
								This pattern property works much like the _sql_ property of <Myna.Query>.
								Any valid SQL can be used here, and parameter placeholders can be used
								just as in <Myna.Query>. Parameters are replaced from the other 
								properties of _pattern_. See example below
				orderBy	-	*default, false*
								if defined, this is a valid SQL order by expression
				
				
			Options:
				caseSensitive			-	*default false*
												if true, patterns will be matched in a 
												case-sensitive manner
				includeSoftDeleted	-	*default false*
												if true, soft deleted columns will be 
												included in query results  
			
			
												
			Examples:
			(code)
				var employees = new Myna.DataManager("some_ds").getManager("employees");
				
				//Find all employees of a given supervisor
				var grunts = man.query({
					supervisor_id:"0102236"
				}) 
				
								
				//more complicated search with wildcards
				var assitants = employees.find({
					supervisor_id:"0102236"
					job_title:"%assitant%"
				})
				
				// an even more complicated search with "select",
				//  "where" and "orderBy" pattern properties
				//  and including soft deleted records
				var bobs_helpers = employees.find({
					select:"name",
					where:<ejs>
						supervisor_id = {supervisor_id}
						and (
							job_title like {job_title}
							or start_date > {start_date:date}
						)
					</ejs>,
					orderBy:"name desc",
					
					supervisor_id:"55652315",
					job_title:"%assitant%",
					start_date:new Date().add(Date.year,-1)
				},{
					includeSoftDeleted:true
				})
				
			(end)
				
			See:
				<queryCol>
				<queryValue>
				<find>
				<findBeans>
			*/
		
		
		/* Function: find
			returns an array of primaryKey values that match a search
			
			Parameters:
				pattern			-	if this is a String, Number, or Date, the primary 
										key will be searched for this value. If this is an 
										object, each key is expected to by a column name 
										and the value a pattern to search for. In either
										mode, the SQL wildcard (%) can be used for a 
										"like" search. A special property _where_ can be 
										used for complex where clauses, see *$where* below
				options			-	find options, see *options* below
			
			where:
				This pattern property works much like the _sql_ property of <Myna.Query>.
				Any valid SQL can be used here, and parameter placeholders can be used
				just as in <Myna.Query>. Parameters are replaced from the other 
				properties of _pattern_. See example below
				
			Options:
				caseSensitive			-	*default false*
												if true, patterns will be matched in a 
												case-sensitive manner
				includeSoftDeleted	-	*default false*
												if true, soft deleted columns will be 
												included in find results  
			
			
												
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
				
				//an even more complicated search with $where property
				var bobs_helpers = employees.find({
					$where:<ejs>
						manager_id = {manager_id}
						and (
							job_title like {job_title}
							or start_date > {start_date:date}
						)
					</ejs>,
					manager_id:"55652315",
					job_title:"%assitant%",
					start_date:new Date().add(Date.year,-1)
				})
				
				//include deleted "helpers"
				var bobs_helpers = employees.find({
					manager_id:"55652315",
					job_title:"%assitant%",
				},{
					includeSoftDeleted:true
				})
			(end)
				
			See:
				<findBeans>
			*/
		
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
		/* Function: genKey
			generates a primary key value
			
			Detail:
				By default this function checks the type of the primary key and 
				returns <Myna.createUuid> for text keys or returns the maximum value 
				of the primary key column + 1 for numeric keys. This is not the 
				ideal algorithm and should be replaced with a database specific 
				means of generating a primary key.   
				
					
				This function can be replaced in <Myna.DataManager.managerTemplate>
				or by replacing the function in <ManagerObject>
				(code)
					var dm = new Myna.DataManager("some datasource");
					
					//via manager template
					dm.managerTemplate.genKey=function(){
						<your code here returning a key here>
					}
					//via the ManagerObject
					var man = dm.getManager("employees")
					man.genKey = function(){
						<your code here returning a key here>
					}
					
				(end)
			*/
		/* Function: getById
			Returns a <BeanObject> representing the row identified by the supplied 
			primary key 
			
			Parameters:
				id	-	primary key value of the row to retrieve
				
			Detail:
				This function loads the data from the indicated row into into a 
				<Myna.DataManager.prototype.BeanBase> object. Each bean is generated 
				with get_<column name> and set_<column name> functions. The set 
				functions will immediately set the value in the underlying row.
				
				If a an object with the specified id cannot be found, an exception is 
				thrown
				
			See:
			* <BeanObject>
			* <ManagerObject.find>
			* <ManagerObject.findBeans>
			* <Myna.DataManager.beanTemplate> 
			* <ManagerObject.beanTemplate>
		
			*/
		
		/* Property: dm
			The <Myna.DataManager> object that created this manager
		
			*/
		/* Property: db
			The <Myna.Database> for this manager
		
			*/
		
			/* Property: table
			The <Myna.Table> for this manager
		
			*/
		
		/* Property: ds
			The datasource name for this manager
		
			*/
		
			/* Property: columns
			The columns array from <Myna.Table.columns> for this table
		
			*/
		/* Property: logQueries
			if true, log all queries made by this manager *default: false*
		
			*/
		
		/* Property: columnNames
			The columnNames array from <Myna.Table.columnNames> for this table
		
			*/
		/* Property: beanTemplate
			a <ManagerObject> specific base template for <BeanObject>s. 
			
			This is a copy of <Myna.DataManager.beanTemplate> which contains all the functions 
			of <BeanObject>. Changes to this object only affect beans created by this 
			manager. Behavior of <BeanObject>s can be altered by modifying this object:
			(code)
				var dm = new Myna.DataManager("hr_datasource");
				var man = dm.getManager("employees")
				
				//the init function is called right after instantiating a <BeanObject> 
				man.beanTemplate.init=function(){
					Myna.log(
						"audit",
						"Employee " +this.data.emp_id +
							
						"Accessed by " +Myna.dump($cookie.getAuthUser())
					);
				}
				
				//replace existing function
				man.beanTemplate.set_age=function(value){
					//this is a calculated column and should not be set
					return;
				}
				
				//append or prepend function
				man.beanTemplate.before("saveField",function(fname,newval){
					Myna.log(
						"audit",
						"Employee + this.data.emp_id + " column " + fname+" modified",
						"Modified by " + Myna.dump($cookie.getAuthUser()) +
							"<br>Old value:" + this.data[fname] +
							"<br>New value:" + newval
					);
				})
			(end)
			See:
				<Myna.DataManager.beanTemplate>
		*/
	/* Class: TreeManagerObject 
		Table data access object generated and returned by 
		<Myna.DataManager.getTreeManager> for Modified Pre-order Tree Traversal 
		(MPTT) organized tables
		
		This object contains all of the functions of <ManagerObject> plus MPTT 
		specific functions.
		
			
			
		See:
		See Also:
			* Storing Hierarchical Data in a Database - http://articles.sitepoint.com/article/hierarchical-data-database
			
			*/
		/* Function: create
			Inserts a row in the table relative to an existing node, and re-orders 
			affected nodes.
			
			Parameters:
				data		-	JS Object containing the non MPTT data
				location	-	*Optional*
								JS object defining where to insert this node. See 
								"Location" below
				
			Location:
				underNode	-	*Optional, default null*
									The id of the parent node to insert under. This is 
									unused if _beforeNode_ is defined. Will append as the last 
									child of _underNode_
				beforeNode	-	*Optional, default null*
									The id of the node before which this node should be 
									inserted 
			
			Note:
			If both _underNode_ and _beforeNode_ are null, then this node will be 
			inserted as the root node, if the table is empty, or as the last child 
			of the root node. This function calls <ManagerObject.create>.
			
			See:
				* <ManagerObject.create>
			
			*/
		/* Function: remove
			removes a row in the table and also deletes any descending nodes
			
			Parameters:
				id					-	primary key value of node to delete
			
			
			Note:
				When removing the root node of the tree the entire tree will be 
				deleted
			
						
			See:
				* <ManagerObject.remove>
			
			*/
		/* Function: hasRootNode
			returns true if there is a root node in this table.
			*/
		/* Function: getRootNode
			returns the root node of this table, or throws an exception
			*/	
		/* Function: rebuildTree
			recalculates left, right, and depth values based on  parent ids
			
			If an MPTT organized table has correct parent ids defined but 
			inaccurate or missing right, left and depth values, this function will 
			rebuild them. This is useful for converting an existing table to an 
			MPTT organized table, or if an non-MPTT aware process modifies the 
			table.
			
			Note:
				This is a recursive function and may run out of memory for very 
				large trees
			*/
	/* Class: BeanObject
		Row data access object generated and returned by <ManagerObject.getById>
		
			*/
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
		/* Function: getData
			return a structure of this bean's data
			
			Detail: 
			This is a copy of the data, so it will not change when 
			the object is modified
			*/
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
		
		/* Property: manager
			The <ManagerObject> that created this bean
		
			*/
		/* Property: dm
			The <Myna.DataManager> object that created this bean
		
			*/
		/* Property: ds
			The datasource name for this bean
		
			*/
		/* Property: data
			a simple JS object containing this bean's data 
		
			*/
		/* Property: id
			The value of the primary key of this bean
		
			*/
		/* Property: columns
			The columns array from <Myna.Table.columns> for this table
		
			*/
		/* Property: columnNames
			The columnNames array from <Myna.Table.columnNames> for this table
		*/
	/* Class: TreeNodeObject
		Sub-class of <BeanObject> generated and returned by <TreeManagerObject.getById>
		
		This class has all the properties of <BeanObject>, plus tree specific 
		functions 
		*/
		/* Function: moveNode
			Moves this node to another location in the tree, only applies to nodes access through <ManagerObject.getTreeManager>
			
			Parameters:
				location		-	*Optional*
									JS object defining where to move this node. See 
									"Location" below
				
			Location:
				underNode	-	*Optional, default null*
									The id of the parent node to insert under. This is 
									unused if _beforeNode_ is defined. Will append as the last 
									child of _underNode_
				beforeNode	-	*Optional, default null*
									The id of the node before which this node should be 
									inserted 
			Returns:
				this node
				
			Note:
			If both _underNode_ and _beforeNode_ are null, then this node will be 
			moved to the last child of the root node.
			
			*/
		/* Function: getLeft
			returns the value of this node's "left" property. 
			*/
		/* Function: getRight
			returns the value of this node's "right" property. 
			*/
		/* Function: getParentId
			returns the value of this node's "parent" property. 
			*/
		/* Function: getParentNode
			returns this node's parent node 
			*/
		/* Function: isRootNode
			returns true if this node is the root node 
			*/
		/* Property: childIds
				an array of the node ids of this node's direct children  
			*/
		/* Property: childNodes
				an array of the TreeNodes of this node's direct children  
			*/
		/* Property: descendantIds
				an array of the node ids of all of this node's descendants  
			*/
		/* Property: descendantNodes
				an array of the TreeNodes of all of this node's descendants  
			*/
		/* Property: ancestorIds
				an array of the node ids of this node's ancestors  
			*/
		/* Property: ancestorNodes
				an array of the TreeNodes of this node's ancestors  
			*/
/* ========== code ========================================================== */
	/* ---------- Constructor ------------------------------------------------ */
		Myna.DataManager = function (dataSource){ 
			
			this.ds = dataSource;
			
			this.db = new Myna.Database(dataSource);
			this.qt = this.db.columnQuoteChar;
			this.managerTemplate = ({}).setDefaultProperties( 
				Myna.DataManager.managerTemplate
			)
			this.beanTemplate =({}).setDefaultProperties( 
				Myna.DataManager.beanTemplate
			)
		 
		
		}

	/* ---------- getManager ------------------------------------------------- */
		Myna.DataManager.prototype.getManager=function(table,options){
			if (!options) options ={}
			options.setDefaultProperties({
				softDeleteCol:"deleted"
			})
			
			var tableName = table
			if (table instanceof Myna.Table) {
				tableName = table.tableName;
			}
				
			$profiler.begin("getManager for " + tableName)
			var tkey =tableName.toLowerCase(); 
			if (!("_managers" in this)) this._managers={}
			if ( tkey in this._managers){
				//Myna.printConsole("got here first")
				$profiler.end("getManager for " + tableName)
				return this._managers[tkey];	
			} else {
				//Myna.printConsole("got here")
				var $this = this;
				var manager={};
				
				manager= ({}).setDefaultProperties( 
					this.managerTemplate
				).setDefaultProperties(options)
			
				manager.ds = this.ds;
				manager.db = this.db;
				manager.qt = this.qt;
				manager.dm = this
				manager.beanTemplate =({}).setDefaultProperties( 
					this.beanTemplate
				)
				
				
				
				manager.table =this.db.getTable(tableName);
				
				manager.loadTableData(tableName);
				manager.init();
				/* build bean class */
					manager.beanClass=function(data){
						this.id = data[manager.primaryKey]
						this.data = data;
						//this.hideProperty("data")
						this.init();
					}
					manager.beanTemplate.setDefaultProperties(manager);
					
					manager.beanClass.prototype = manager.beanTemplate	
					manager.beanTemplate.manager=manager
					for (var prop in manager.beanTemplate){
						//manager.beanTemplate.hideProperty(prop)
					}
					manager.columnNames.forEach(function(colname){
						var fname = colname;
						if (!("get_"+fname in manager.beanTemplate)){
							manager.beanTemplate["get_"+fname] = function (){
								return this.data[arguments.callee.fieldName];
							}
							if (colname !="id"){
								manager.beanTemplate.__defineGetter__(fname, manager.beanTemplate["get_"+fname]);
							}
							
						}
						
						manager.beanTemplate["get_"+fname].fieldName = colname;
						
						if (fname != manager.primaryKey){
							if (!("set_"+fname in manager.beanTemplate)){
								manager.beanTemplate["set_"+fname] = function (newval){
									var result = new Myna.ValidationResult();
									if (typeof newval === "undefined"){
										result.addError("argument 'newval' required for set" +fname +".",fname);
										return result;
									}
									result.merge(this.saveField(arguments.callee.fieldName,newval));
									return result;
								}
							}
							if (colname !="id"){
								manager.beanTemplate.__defineSetter__(fname, manager.beanTemplate["set_"+fname]);
							}
							manager.beanTemplate["set_"+fname].fieldName = colname;
						}
						
					}) 
				
					
					
				this._managers[tkey] = manager;
				$profiler.end("getManager for " + tableName)
				return manager;
			}
			
		}
	/* ---------- getTreeManager --------------------------------------------- */
		Myna.DataManager.prototype.getTreeManager = function (tableName, options){
			var man =this.getManager.call(this,tableName,options);
			if ("rebuildTree" in man) return man;
			if (!options) options ={}
			options.setDefaultProperties({
				leftCol:"lft",
				rightCol:"rgt",
				idCol:man.primaryKey,
				parentCol:"parent_id",
				depthCol:null
			})
			//translate the col names into DB specific syntax
			
			options.applyTo(man,true);
			
			/* function overrides */
				/* create */
					man.before("create",function(data,location){
						//Myna.printConsole("starting",Myna.dumpText(Array.parse(arguments)));
						var chain = arguments.callee.chain;
						chain.args =[data];
						function processArgs(data,location){
							//Myna.printConsole("processing",Myna.dumpText(Array.parse(arguments)))
							if (!location) location = {
								beforeNode:false,
								underNode:false
							}
							var anchorNode;
							var rightCol = man.table.getSqlColumnName(options.rightCol);
							var leftCol = man.table.getSqlColumnName(options.leftCol);
							if (location.beforeNode){
								//see if the beforeNode element really exists
								anchorNode = man.findBeans(location.beforeNode)
								if (!anchorNode.length || anchorNode[0].isRootNode()){//node does not exist
									//treat this as a top level insert   
									
									return arguments.callee(data);
								} else {
									anchorNode = anchorNode[0];
									data[options.parentCol] = anchorNode[options.parentCol]
									if (options.depthCol) data[options.depthCol] = anchorNode[options.depthCol]
									data[options.leftCol] = anchorNode[options.leftCol]+1;
									data[options.rightCol] = anchorNode[options.leftCol]+2;
									
									man.renumberForInsert(location.beforeNode,"before",2)
								}
							} else if (location.underNode){
								//see if the underNode element really exists
								anchorNode = man.findBeans(location.underNode)
								if (!anchorNode.length){//node does not exist
									//treat this as a top level insert   
									return arguments.callee(data);
								} else {
									anchorNode = anchorNode[0];
									data[options.parentCol] = anchorNode[options.idCol]
									if (options.depthCol) data[options.depthCol] = anchorNode[options.depthCol] +1
									data[options.leftCol] = anchorNode[options.rightCol];
									data[options.rightCol] = anchorNode[options.rightCol]+1;
									
									Myna.log("debug","renumbering from undernode");
									man.renumberForInsert(location.underNode,"under",2)
								}
							} else {
								var search = {}
								//search for root node
								search[options.parentCol] = null;
								anchorNode = man.findBeans(search)
								if (anchorNode.length){//there is a root node
									anchorNode=anchorNode[0]
									//treat this as an "under" insert to the rot node   
									var id = anchorNode.data[options.idCol]
									location={
										underNode:id
									}
									return arguments.callee(data,location)
									
								} else {//insert root node
									data[options.parentCol] = null
									if (options.depthCol) data[options.depthCol] = 1
									data[options.leftCol] = 1;
									data[options.rightCol] = 2;
								}
							}
						}
						var gotLock =Myna.clusterLock(
							this.table.tableName + "_treeManager",
							0,
							function(){
								processArgs(data,location||{
									beforeNode:false,
									underNode:false
								})
							}
						)
						if (!gotLock) {
							throw new Error("Unable to acquire lock on " +this.table.tableName + "_treeManager" )
						} 
						//Myna.printConsole("done",Myna.dumpText(Array.parse(chain)))
						
						//now we fall thorough to ManagerObject.create(data)
					})
					
				/* getById */
					man.after("getById",function(id){
						var chain = arguments.callee.chain;
						var newProps ={
							isRootNode:function(){return this.getParentId() === null},
							getLeft:function(){return this.data[options.leftCol]},
							getRight:function(){return this.data[options.rightCol]},
							getParentId:function(){return this.data[options.parentCol]},
							getParentNode:function(){
								return this.manager.getById(this.getParentId())
							},
							moveNode:function(location){
								var $this = this;
								Myna.clusterLock(
									this.table.tableName + "_treeManager",
									0,
									function(){
										if (!location) location = {
											beforeNode:false,
											underNode:false
										}
										var anchorNode;
										var rightCol = man.table.getSqlColumnName($this.manager.rightCol);
										var leftCol = man.table.getSqlColumnName($this.manager.leftCol);
										var myRight = $this.data[$this.manager.rightCol];
										var myLeft = $this.data[$this.manager.leftCol];
										var subTreeSize = (myRight - myLeft) +1
										var newOffset;
										$profiler.mark("removing subtree")
										/* 
										first, remove this sub-tree from the world by 
										setting negative sides 
										*/ 
										new Myna.Query({
											ds:man.ds,
											log:man.logQueries,
											sql:<ejs>
												update <%=$this.table.sqlTableName%> set 
													<%=rightCol%> = <%=rightCol%> * -1,
													<%=leftCol%> = <%=leftCol%> * -1
												where
												<%=rightCol%> <= {myRight:bigint}
												and <%=leftCol%> >= {myLeft:bigint}
											</ejs>,
											values:{
												myRight:myRight,
												myLeft:myLeft,
											}
										})
										$profiler.mark("backfilling")
										/* 
										re-order the downstream tree to backfill
										*/
										new Myna.Query({
											ds:man.ds,
											log:man.logQueries,
											sql:<ejs>
												update <%=$this.table.sqlTableName%> set 
												<%=rightCol%> = <%=rightCol%> - {size:bigint},
												<%=leftCol%> = <%=leftCol%> - {size:bigint}
												where
												<%=leftCol%> > {myRight:bigint}
											</ejs>,
											values:{
												myRight:$this.data[$this.manager.rightCol],
												size:subTreeSize,
											}
										})
										/* 
										re-order parentNodes to backfill
										*/
										new Myna.Query({
											ds:man.ds,
											log:man.logQueries,
											sql:<ejs>
												update <%=$this.table.sqlTableName%> set 
												<%=rightCol%> = <%=rightCol%> - {size:bigint}
												where
												<%=leftCol%> < {myLeft:bigint}
												and <%=rightCol%> > {myRight:bigint}
											</ejs>,
											values:{
												myRight:$this.data[$this.manager.rightCol],
												myLeft:$this.data[$this.manager.leftCol],
												size:subTreeSize,
											}
										})
										
										$profiler.mark("preocessing before")
										if (location.beforeNode != undefined){
											//see if the beforeNode element really exists
											anchorNode = man.findBeans(location.beforeNode)
											if (!anchorNode.length || anchorNode[0].isRootNode()){//node does not exist
												//treat this as a top level insert   
												// by falling through
												location.beforeNode = false;
											} else {
												anchorNode = anchorNode[0];
												
												$this["set_" +$this.manager.parentCol](anchorNode.data[$this.manager.parentCol]);
												if ($this.manager.depthCol) {
													$this["set_" +$this.manager.depthCol](anchorNode.data[$this.manager.depthCol]);
												}
												newOffset = anchorNode.data[$this.manager.leftCol] - myLeft						
												$this.manager.renumberForInsert(location.beforeNode,"before",subTreeSize)
											}
										}
										$profiler.mark("processing under")
										if (location.underNode != undefined){
											//see if the underNode element really exists
											anchorNode = man.findBeans(location.underNode)
											if (!anchorNode.length){//node does not exist
												//treat this as a top level insert   
												//by falling through
												location.underNode = false;
											} else {
												anchorNode = anchorNode[0];
												$this["set_" +$this.manager.parentCol](anchorNode[$this.manager.idCol]);
												if ($this.manager.depthCol) {
													$this["set_" +$this.manager.depthCol](anchorNode.data[$this.manager.depthCol] + 1);
												}
												newOffset = anchorNode.data[$this.manager.rightCol] - myLeft				
												$this.manager.renumberForInsert(location.underNode,"under",subTreeSize)
											}
										} 
										$profiler.mark("preocessing else")
										if (!(location.beforeNode || location.underNode)){
											var search = {}
											//search for root node
											search[$this.manager.parentCol] = null;
											anchorNode = man.findBeans(search)
											if (anchorNode.length){//there is a root node
												anchorNode=anchorNode[0]
												$this["set_" +$this.manager.parentCol](anchorNode[$this.manager.idCol]);
												if ($this.manager.depthCol) {
													$this["set_" +$this.manager.depthCol](2);
												}
												newOffset = anchorNode.data[$this.manager.rightCol] - myLeft				
												$this.manager.renumberForInsert(anchorNode.data[$this.manager.idCol],"under",subTreeSize)
											} else {//insert root node
												throw new Error("cannot move a node when the is no root node!")
											}
										}
										
										$profiler.mark("inserting tree")
										//insert  the subTree
										new Myna.Query({
											ds:man.ds,
											log:man.logQueries,
											sql:<ejs>
												update <%=$this.table.sqlTableName%> set 
												<%=rightCol%> = <%=rightCol%> * -1 + ({offset:bigint}),
												<%=leftCol%> = <%=leftCol%> * -1 + ({offset:bigint})
												where
													<%=leftCol%> < 0 
											</ejs>,
											values:{
												offset:newOffset
											}
										})
									}
								)
								//Myna.printDump(anchorNode)
								return $this;
							}
						}
						newProps.applyTo(chain.lastReturn,true)
						chain.lastReturn.__defineGetter__("childIds",function (){
							var parentCol = man.table.getSqlColumnName(options.parentCol);
							var leftCol = man.table.getSqlColumnName(options.leftCol);
							var rightCol = man.table.getSqlColumnName(options.rightCol);
							var idCol = options.idCol;
							var idColType = man.table.columns[idCol].date_type;
							var p = new Myna.QueryParams();
							var result =  new Myna.Query({
								ds:man.ds,
								log:man.logQueries,
								sql:<ejs>
									select  
										<%=idCol%>
									from <%=man.table.sqlTableName%>
									where
									<%=parentCol%> =  <%=p.addValue(id,idColType)%>
									order by <%=leftCol%> ASC	 
								</ejs>,
								parameters:p
							})
							return result.valueArray(idCol)
						})
						chain.lastReturn.__defineGetter__("childNodes",function (){
							return this.childIds.map(function(nodeId){
								return man.getById(nodeId);
							})
						})
						chain.lastReturn.__defineGetter__("descendantIds",function (){
							var parentCol = man.table.getSqlColumnName(options.parentCol);
							var leftCol = man.table.getSqlColumnName(options.leftCol);
							var rightCol = man.table.getSqlColumnName(options.rightCol);
							var idCol = options.idCol;
							var idColType = man.table.columns[idCol].date_type;
							
							var result =  new Myna.Query({
								ds:man.ds,
								log:man.logQueries,
								sql:<ejs>
									select  
										<%=idCol%>
									from <%=man.table.sqlTableName%>
									where
									<%=leftCol%> >  {left:bigint}
									and <%=rightCol%> <  {right:bigint}
									order by <%=leftCol%> ASC	 
								</ejs>,
								values:{
									left:this.getLeft(),
									right:this.getRight()
								}
							})
							return result.valueArray(idCol)
						})
						chain.lastReturn.__defineGetter__("descendantNodes",function (){
							return this.descendantIds.map(function(nodeId){
								return man.getById(nodeId);
							})
						})
						chain.lastReturn.__defineGetter__("ancestorIds",function (){
							var parentCol = man.table.getSqlColumnName(options.parentCol);
							var leftCol = man.table.getSqlColumnName(options.leftCol);
							var rightCol = man.table.getSqlColumnName(options.rightCol);
							var idCol = options.idCol;
							var idColType = man.table.columns[idCol].date_type;
							
							var result =  new Myna.Query({
								ds:man.ds,
								log:man.logQueries,
								sql:<ejs>
									select  
										<%=idCol%>
									from <%=man.table.sqlTableName%>
									where
									<%=leftCol%> <  {left:bigint}
									and <%=rightCol%> >  {right:bigint}
									order by <%=leftCol%> ASC	 
								</ejs>,
								values:{
									left:this.getLeft(),
									right:this.getRight()
								}
							})
							return result.valueArray(idCol)
						})
						chain.lastReturn.__defineGetter__("ancestorNodes",function (){
							return this.ancestorIds.map(function(nodeId){
								return man.getById(nodeId);
							})
						})
						return chain.lastReturn
					})
				/* remove */
					man.before("remove",function(id){
						var thisNode = this.getById(id);
						var $this = this;
						var chain = arguments.callee.chain;
						Myna.clusterLock(
							this.table.tableName + "_treeManager",
							0,
							function(){
								//recursively delete child nodes
									thisNode.childIds.forEach(function(childId){
										man.dm.managerTemplate.remove.call(man,childId);
									})
								//backfill
									var rightCol = man.table.getSqlColumnName(man.rightCol);
									var leftCol = man.table.getSqlColumnName(man.leftCol);
									var myRight = thisNode.data[man.rightCol];
									var myLeft = thisNode.data[man.leftCol];
									var subTreeSize = (myRight - myLeft) +1
									/* 
									re-order the downstream tree to backfill
									*/
									new Myna.Query({
										ds:man.ds,
										log:man.logQueries,
										sql:<ejs>
											update <%=man.table.sqlTableName%> set 
											<%=rightCol%> = <%=rightCol%> - {size:bigint},
											<%=leftCol%> = <%=leftCol%> - {size:bigint}
											where
											<%=leftCol%> > {myRight:bigint}
										</ejs>,
										values:{
											myRight:myRight,
											size:subTreeSize,
										}
									})
									/* 
									re-order parentNodes to backfill
									*/
									new Myna.Query({
										ds:man.ds,
										log:man.logQueries,
										sql:<ejs>
											update <%=man.table.sqlTableName%> set 
											<%=rightCol%> = <%=rightCol%> - {size:bigint}
											where
											<%=leftCol%> < {myLeft:bigint}
											and <%=rightCol%> > {myRight:bigint}
										</ejs>,
										values:{
											myRight:myRight,
											myLeft:myLeft,
											size:subTreeSize,
										}
									})
							}
						)
					})
				/* rebuildTree */
					man.rebuildTree = function(){
						var rootNode = man.getRootNode();
						
						var calcRight = function(node,left,depth){
							var right = left +1;
							node["set_" + options.leftCol](left)
							if (options.depthCol) node["set_" + options.depthCol](depth)
							node.childNodes.forEach(function(child){
								right = calcRight(child,right,depth+1);
							})
							
							node["set_" + options.rightCol](right)
							
							return right +1
						}
						calcRight(rootNode,1,1)
						
					}
				/* hasRootNode */
					man.hasRootNode = function(){
						var search = {}
						search[options.parentCol] = null;
						return !!man.find(search).length	
					}
				/* getRootNode */
					man.getRootNode = function(){
						var search = {}
						search[options.parentCol] = null;
						return man.findBeans(search)[0]
					}
				/* renumberForInsert */
					man.renumberForInsert = function(target,type,size){
						var $this = this;
						var rightCol = man.table.getSqlColumnName($this.rightCol);
						var leftCol = man.table.getSqlColumnName($this.leftCol);
						var anchorNode = man.findBeans(target)
						if (!anchorNode.length){//node does not exist
							return;
						} else anchorNode = anchorNode[0];
						
						if (type=="before"){
							new Myna.Query({
								ds:man.ds,
								log:man.logQueries,
								sql:<ejs>
									update <%=$this.table.sqlTableName%> set 
									<%=rightCol%> = <%=rightCol%> + ({size:bigint})
									where
									<%=rightCol%> > {nodeRight:bigint} 
								</ejs>,
								values:{
									nodeRight:anchorNode[$this.leftCol] -1,
									size:size
								}
							})
							new Myna.Query({
								ds:man.ds,
								log:man.logQueries,
								sql:<ejs>
									update <%=$this.table.sqlTableName%> set 
									<%=leftCol%> = <%=leftCol%> + ({size:bigint})
									where
									<%=leftCol%> > {nodeRight:bigint} 
								</ejs>,
								values:{
									nodeRight:anchorNode[$this.leftCol] -1,
									size:size
								}
							})
						} else {
							new Myna.Query({
								ds:man.ds,
								log:man.logQueries,
								sql:<ejs>
									update <%=$this.table.sqlTableName%> set 
									<%=rightCol%> = <%=rightCol%> + ({size:bigint}) 
									where
									<%=rightCol%> >= {nodeRight:bigint} 
								</ejs>,
								values:{
									nodeRight:anchorNode[$this.rightCol],
									size:size
								}
							})
							new Myna.Query({
								ds:man.ds,
								log:man.logQueries,
								sql:<ejs>
									update <%=$this.table.sqlTableName%> set 
									<%=leftCol%> = <%=leftCol%> + ({size:bigint}) 
									where
									<%=leftCol%> > {nodeRight:bigint} 
								</ejs>,
								values:{
									nodeRight:anchorNode[$this.rightCol],
									size:size
								}
							})
						}
					}
			return man;
		}	
	/* ---------- managerTemplate -------------------------------------------- */
		Myna.DataManager.managerTemplate ={
			init:function(){},
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
			remove:function(id){
				var manager = this;
				var p = new Myna.QueryParams();
				if (this.table.columnNames.contains(this.softDeleteCol)){
					//check date type
					var deleteColType = this.db.dbTypeToJs(
						this.table.columns[this.softDeleteCol].data_type
					); 
					if (deleteColType == "date"){
						this.getById(id).saveField(this.softDeleteCol,new Date())
					}
				} else {
					var qry = new Myna.Query({
						dataSource:this.ds,
						log:this.logQueries,
						sql:<ejs>
							delete from <%=this.sqlTableName%>
							where <%=manager.qt%><%=this.columns[this.primaryKey].column_name%><%=manager.qt%> = 
								<%=p.addValue(id,this.columns[this.primaryKey].data_type)%>
						</ejs>,
						parameters:p
					});
				}
			},
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
				//Myna.printDump(columnArray)
				var fieldArray = columnArray.map(function(colName){
					return  manager.qt + manager.columns[colName].column_name + manager.qt;
				});
				
				var p = new Myna.QueryParams();
				var qry = new Myna.Query({
					dataSource:this.ds,
					log:this.logQueries,
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
			
			query:function(pattern,options){
				if (!pattern) pattern={}
				var $this = this;
				var criteria=[];
				var $this= this;
				var pkey =this.columns[this.primaryKey].column_name;
				var colNameSql;
				var op;
				var caseSensitive=false
				var where = false;
				var select ="*"
				var orderBy=false;
				
				if (typeof options == "object"){
					if (!options.getKeys().length){
						caseSensitive = options
					}
				} else {
					caseSensitive = options
					options={}
				}

				var getCriteria=function(colName,pattern){
					colName= colName.toLowerCase();
					var col = {
						column:colName,
						op:"=",
						isNull:false,
						type:$this.columns[colName].data_type,
						pattern:pattern
					}
					
					
					
					if (/%/.test(String(pattern))){
						col.op =" like ";
					}
					
					col.compareColumn =col.column
					if (pattern === null){
						col.isNull = true;
					} else if (Myna.Database.dbTypeToJs($this.columns[colName].data_type) == "string"){
						if (!caseSensitive){
							col.pattern = String(col.pattern).toLowerCase();
							col.column = colName.toLowerCase();
							col.compareColumn ="LOWER(" + col.column +")"	
						} else {
							
						}
					}
					
					return col
				}
				
				if (typeof pattern == "object" && !(pattern instanceof Date)){
					if ("select" in pattern) select = pattern.select
					if ("orderBy" in pattern) orderBy = pattern.orderBy
					if ("where" in pattern){
						where = pattern.where
					} else {
						var myColumnList = this.columnNames.join()
						if (!options.includeSoftDeleted){
							pattern[this.softDeleteCol] = null	
						}
						pattern.getKeys().filter(function(colName){
							return myColumnList.listContains(colName.toLowerCase())
						}).forEach(function(colName){
							
							criteria.push(getCriteria(colName,pattern[colName]))
						})
					}
					
				} else{
					criteria.push(getCriteria($this.db.isCaseSensitive?pkey:pkey.toLowerCase(),pattern));
				}
				
				if (where){
					$profiler.begin("DataManager("+this.tableName+").find("+pattern.toJson()+")")
					var qry = new Myna.Query({
						dataSource:this.ds,
						log:$this.logQueries,
						sql:<ejs>
							select <%=select%>
							from <%=this.sqlTableName%>
							where 
							<@if !options.includeSoftDeleted && $this.softDeleteCol in $this.table.columnNames>
								<%=$this.table.getSqlColumnName($this.softDeleteCol)%> is null and
							</@if>
							<%=where%>
							<@if orderBy>
								order by <%=orderBy%>
							</@if>
						</ejs>,
						values:pattern
					})
					$profiler.end("DataManager("+this.tableName+").find("+pattern.toJson()+")")
				} else {
					var p = new Myna.QueryParams();
					$profiler.begin("DataManager("+this.tableName+").find("+pattern.toJson()+")")
					var qry = new Myna.Query({
						dataSource:this.ds,
						log:$this.logQueries,
						parameters:p,
						sql:<ejs>
							select <%=select%>
							from <%=this.sqlTableName%>
							where 1=1
							<@loop array="criteria" element="col" >
								<@if col.isNull>
								and <%=col.column%> is null
								<@else>
								and <%=col.compareColumn%> <%=col.op%> <%=p.addValue(col.pattern,col.type,!!col.pattern)%>
								</@if>
							</@loop>
							<@if orderBy>
								order by <%=orderBy%>
							</@if>
						</ejs>
					})
					$profiler.end("DataManager("+this.tableName+").find("+pattern.toJson()+")")
				}
				
				return qry.data
			},
			queryCol:function(pattern,options){
				var result = this.query(pattern,options);
				return result.valueArray(result.columns[0]);
			},
			queryValue:function(pattern,options){
				var result = this.query(pattern,options);
				if (result.length){
					return result[0][result.columns[0]]	
				} else return undefined
			},
			find:function(pattern,options){
				var $this = this
				var pkey =this.columns[this.primaryKey].column_name;
				var sqlKey = this.table.getSqlColumnName(pkey)
				if (typeof pattern == "object" && !(pattern instanceof Date)){
					pattern.setDefaultProperties({select:sqlKey})
				} else {
					var id = pattern;
					pattern ={
						select:sqlKey
					}
					pattern[pkey] = id
				}
				return this.queryCol(pattern,options)
				
				/* if (!pattern) pattern={}
				var criteria=[];
				var $this= this;
				var pkey =this.columns[this.primaryKey].column_name;
				var colNameSql;
				var op;
				var caseSensitive=false
				var whereStyle = false;
				
				if (typeof options == "object"){
					if (!options.getKeys().length){
						caseSensitive = options
					}
				} else {
					caseSensitive = options
					options={}
				}

				var getCriteria=function(colName,pattern){
					var col = {
						column:colName,
						op:"=",
						isNull:false,
						type:$this.columns[colName].data_type,
						pattern:pattern
					}
		
					if (/%/.test(String(pattern))){
						col.op =" like ";
					}
					
					col.compareColumn =col.column
					if (pattern === null){
						col.isNull = true;
					} else if (Myna.Database.dbTypeToJs($this.columns[colName].data_type) == "string"){
						if (!caseSensitive){
							col.pattern = String(col.pattern).toLowerCase();
							col.column = colName.toLowerCase();
							col.compareColumn ="LOWER(" + col.column +")"	
						} else {
							
						}
					}
					
					return col
				}
				
				if (typeof pattern == "object" && !(pattern instanceof Date)){
					if ("$where" in pattern){
						whereStyle = true;
					} else {
						var myColumnList = this.columnNames.join()
						if (!options.includeSoftDeleted){
							pattern[this.softDeleteCol] = null	
						}
						pattern.getKeys().filter(function(colName){
							return myColumnList.listContains(colName.toLowerCase())
						}).forEach(function(colName){
							criteria.push(getCriteria(colName,pattern[colName]))
						})
					}
					
				} else{
					criteria.push(getCriteria($this.db.isCaseSensitive?pkey:pkey.toLowerCase(),pattern));
				}
				
				if (whereStyle){
					$profiler.begin("DataManager("+this.tableName+").find("+pattern.toJson()+")")
					var qry = new Myna.Query({
						dataSource:this.ds,
						log:$this.logQueries,
						sql:<ejs>
							select <%=$this.table.getSqlColumnName(pkey)%>
							from <%=this.sqlTableName%>
							where 
							<@if !options.includeSoftDeleted>
								<%=$this.table.getSqlColumnName($this.softDeleteCol)%> is null and
							</@if>
							<%=pattern.$where%>
								
						</ejs>,
						values:pattern
					})
					$profiler.end("DataManager("+this.tableName+").find("+pattern.toJson()+")")
				} else {
					var p = new Myna.QueryParams();
					$profiler.begin("DataManager("+this.tableName+").find("+pattern.toJson()+")")
					var qry = new Myna.Query({
						dataSource:this.ds,
						log:$this.logQueries,
						parameters:p,
						sql:<ejs>
							select <%=$this.table.getSqlColumnName(pkey)%>
							from <%=this.sqlTableName%>
							where 1=1
							<@loop array="criteria" element="col" >
								<@if col.isNull>
								and <%=col.column%> is null
								<@else>
								and <%=col.compareColumn%> <%=col.op%> <%=p.addValue(col.pattern,col.type,!!col.pattern)%>
								</@if>
							</@loop>
						</ejs>
					})
					$profiler.end("DataManager("+this.tableName+").find("+pattern.toJson()+")")
				}
				return qry.valueArray(pkey.toLowerCase()); */
			},
			findBeans:function(pattern,caseSensitive){
				var $this = this;
				return new Myna.DataSet({
					columns:$this.columnNames,
					data:this.find(pattern,caseSensitive).map(function(id){
						return $this.getById(id);
					})
				})
			},
			genKey:function(){
				var manager=this;
				var pktype =Myna.Database.dbTypeToJs(
					manager.table.columns[
						manager.primaryKey
					].data_type
				);
				switch (pktype){
					case "string":
						return Myna.createUuid();
					case "numeric":
						var maxId =new Myna.Query({
							dataSource:this.ds,
							sql:'select max('+manager.qt+  this.columns[this.primaryKey].column_name+ manager.qt+') as id from ' + this.sqlTableName 
						}).data[0].id;
						if (!maxId) {
							return 1;
						} else {
							return maxId +1;
						}
					default:
						throw new Error("genKey must be overloaded for primary keys of type" + pktype )
				}
			},
			getById:function(id){
				$profiler.begin("loading "+this.tableName+" bean "+ id)
				var manager = this;
				var bean={};
				var p = new Myna.QueryParams();
				var qry = new Myna.Query({
					dataSource:this.ds,
					log:this.logQueries,
					sql:<ejs>
						select
							<@loop array="manager.columnNames" element="name" index="i">
								<%=manager.qt%><%=manager.columns[name].column_name%><%=manager.qt%> <@if i < manager.columnNames.length - 1 >,</@if>
							</@loop>
							
						from <%=this.sqlTableName%>
						where <%=manager.qt%><%=this.columns[this.primaryKey].column_name%><%=manager.qt%> = 
							<%=p.addValue(id,this.columns[this.primaryKey].data_type)%>
					</ejs>,
					parameters:p
				});
				if (!qry.data.length) {
					throw new Error("Unable to find '" + this.sqlTableName + "' by id '" + id +"'.");
				}
					
				 
				bean = new this.beanClass(qry.data[0])
				
				/* bean.baseBean = ({}).setDefaultProperties( 
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
					if (!("get_"+fname in bean.baseBean)){
						bean.baseBean["get_"+fname] = function (){
							return this.data[arguments.callee.fieldName];
						}
					}
					bean.__defineGetter__(fname, bean.baseBean["get_"+fname]);
					
					bean.baseBean["get_"+fname].fieldName = colname;
					//bean.hideProperty("get_"+fname);
	
					
					if (fname != manager.primaryKey){
						if (!("set_"+fname in bean.baseBean)){
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
				//bean.hideProperty("manager");
				//bean.hideProperty("baseBean");
				//bean.hideProperty("data");
				bean.init(); */
				$profiler.end("loading "+this.tableName+" bean "+ id)
				return bean;
			},
		}
	/* ---------- beanTemplate ----------------------------------------------- */
		Myna.DataManager.beanTemplate ={
			init:function(){},
			setFields:function(fields){
				var result = new Myna.ValidationResult();
				var bean = this;
				try {
					var p =new Myna.QueryParams();
					var fieldArray = fields.getKeys().filter(function(colname){
						//filter non column properties
						return (
							bean.columns[colname.toLowerCase()]
							&& colname.toLowerCase() != bean.primaryKey
						);
					});
					var qry = new Myna.Query({
						dataSource:this.manager.ds,
						log:this.manager.logQueries,
						parameters:p,
						sql:<ejs>
							UPDATE <%=this.sqlTableName%>
							SET
								<@loop array="fieldArray" element="fieldName" index="i">
									<% 
										var value = fields[fieldName];
										var type = bean.columns[fieldName.toLowerCase()].data_type;
										var isNull = (value === null);
										var columnName=bean.columns[fieldName.toLowerCase()].column_name;
									%>
									<%=bean.manager.qt%><%=columnName%><%=bean.manager.qt%> = <%=p.addValue(value,type,isNull)%>
									<@if i != fieldArray.length-1 >,</@if>
								</@loop>
								
								
							WHERE
								<%=bean.manager.qt%><%=bean.columns[bean.primaryKey].column_name%><%=bean.manager.qt%> = 
									<%=p.addValue(bean.id,bean.columns[bean.primaryKey].data_type)%>
						</ejs>
					});
					//bean.data[fieldName] = newval;
					
				} catch (e){
					Myna.log("error",e.message,Myna.formatError(e));
					result.addError(e.message);
				}
				return result;
				
				/* var bean = this;
				var result = new Myna.ValidationResult();
					fields.getKeys().forEach(function(name){
						if (bean["set_"+name]){
							result.merge(bean["set_"+name](fields[name]));
						} 
					})
				
				return result; */
			},
			saveField:function(fieldName,newval){
				var result = new Myna.ValidationResult();
				if (newval != this.data[fieldName]){
					var bean = this;
					try {
						var columnName = this.columns[fieldName].column_name;
						var p =new Myna.QueryParams();
						var value = newval;
						var type = this.columns[fieldName].data_type;
						var isNull = (value === null);
						var qry = new Myna.Query({
							dataSource:this.manager.ds,
							log:this.manager.logQueries,
							parameters:p,
							sql:<ejs>
								UPDATE <%=this.sqlTableName%>
								SET
									<%=bean.manager.qt%><%=columnName%><%=bean.manager.qt%> = <%=p.addValue(value,type,isNull)%>
								WHERE
									<%=bean.manager.qt%><%=this.columns[this.primaryKey].column_name%><%=bean.manager.qt%> = <%=p.addValue(bean.id,this.columns[this.primaryKey].data_type)%>
							</ejs>
						});
						this.data[fieldName] = newval;
					} catch (e){
						Myna.log("error",e.message,Myna.formatError(e));
						result.addError(e.message,fieldName);
					}
				}
				return result;
			},
			getData:function(){
				var result ={}
				result.setDefaultProperties(this.data)
				return result;
			},
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
