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
		* <TreeManagerObject>
		* <TreeNodeObject>
		* Examples -> Ext.Direct -> Routing Ext Tree
		
		
		
		Also check out empManager.columns for metadata about each column in the 
		table, such as name, default value, size, type, nullable, precision and 
		more.
	
		Constructor: DataManager
				Constructs a Myna.DataManager Object for the supplied datasource
				
				Parameters:
					dataSource	-	Datasource Name
					
				
			
			*/
		/* Function: getManager
			Constructs a <ManagerObject> for the supplied table.
			
			Parameters:
				tableName		- 	lowercase name of the table, or singular ProperCased
										name of table, e.g "part_orders" or "PartOrder"
				options			-	A JS object representing metadata for this table 
										that can't be calculated from the table itself  
										See "Options" Below
									
			Options:
				softDeleteCol	-	*Optional, default "deleted"*
										If this column exists in the table, then delete 
										operations will instead set this column to the 
										current time. Find operations will automatically 
										filter rows with this column set
				createdCol		-	*Optional, default "created"*
										If this column exists in the table, then create 
										operations will set this column to the 
										current time.
				modifiedCol		-	*Optional, default "modified"*
										If this column exists in the table, then modify 
										operations will set this column to the 
										current time.
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
		/* Function: managerExists
			returns true if a manager with a given name can be created form this 
			DataManager
			
			Parameters:
				name		- 	String. Table name or model name to check
				
			
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
		/* Function: addValidator
			adds a validation function to this manager
			
			Parameters:
				colname		-	column to validate. If this is set to null, then this 
									validator will be called for every column
									
				validator	-	Either a String or a validation function. If this is 
									a string, it must match one of the standard 
									validation functions stored in <validatorFunctions>.
									This function will be called when needed to validate 
									_colname_ See *Validator Function* below
									
				options		-	*Optional, default {}*
									this will be used as the "this" scope for the _validator_ 
									call. If the validator requires any options add them 
									here. All validators accept certain options. See 
									*Common Options* below
									
			Common Options:
				when					-	*Optional, default null*
											Function. If defined, this function must return true or 
											this validator will not be executed. This is called with
											the same scope and parameters as the validation function
											
				unless				-	*Optional, default null*
											Function. If defined, this function must return false or 
											this validator will not be executed. This is called with
											the same scope and parameters as the validation function
											
				validateWhenNull	-	*Optional, default false*
											Normally, validators are not executed against null values.
											Set this to true to run the validator even if the value 
											is null.
											*Note* <validatorFunctions.required> will automatically 
											run on null values
				
				message				-	*Optional, default null*
											If defined, then the validator should return this message 
											instead of its native one. It is the responsibility of 
											the _validator_ to honor this option.
 
								
			Validator Function:
			The _validator_ function  will be called with these parameters
			
				colname				-	The name of the current column being validated
				value					-	The value being validated
				validationResult	-	An instance of <Myna.ValidationResult> that 
											should be updated by calling 
											<Myna.ValidationResult.addError> for any 
											validation errors
				bean					-	The bean instance being validated
			
			Examples:
			
			(code)
				manager.addValidator("first_name","length",{
					min:3,
					max:25
				})
				
				function isBob(colname,value,v,bean){
					if (value != "Bob"){
						//we should honor a custom message
						var msg = this.message || bean.manager.getLabel(colname) + " is not Bob!"
						v.addError(msg,colname)
					}
				}
				
				manager.addValidator("first_name",isBob,{
					message:"Inferior name entered."
				})
				
			(end)
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
			returns a <Myna.DataSet> of information from this table
			
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
				[queryOptions]			-	Any other <Myna.Query> options such as maxRows								
			
												
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
										used for complex where clauses, see 
										*"where" pattern property* below
										
				options			-	find options, see *options* below
			
			"where" pattern property:
				This pattern property works much like the _sql_ property of <Myna.Query>.
				Any valid SQL that makes sense in a where clause can be used here, 
				and parameter placeholders can be used just as in <Myna.Query>. 
				Parameters are replaced from the other properties of _pattern_. 
				See example below
				
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
				
				//an even more complicated search with where property
				var bobs_helpers = employees.find({
					where:<ejs>
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
		/* Function: genLabel
			generates a display label from a column name
			
			The default implementation either uses one of the special replacements below, 
			or  replaces all underbars with spaces and calls <String.titleCap> on the 
			result. You can override this function in your models for custom behavior
			
			Special Replacements:
			id		-	ID
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
		/* Function: get
			returns either an instance of an existing row or the result of <getNew>
			
			Parameters:
				values		-	*Optionsal, default null*
									JS object containing the values for this object
				
			Detail:
				This function attempts to create a usable bean even if there is no 
				matching record. If _values_ is provided with a valid primary 
				key, then <getById> is called, <BeanObject.deferred> is set to true, 
				and <BeanObject.setFields> is called with _values_. Otherwise 
				<getNew> is called with _values_. Regardless, the resulting bean 
				will be deferred and <BeanObject.save> must be called to persist 
				changes
			
			Note:
				Any defaults set by <setDefault> will be applied before returning 
				the bean object
				
			Example:
			(code)
				//crate or update an order from form data:
				var order = new Myna.DataManager(ds).getManager("orders").get($req.rawData)
				var result = order.save();
				if (result.success) {
					...
				} else{
					...
				}
			(end)
			*/
		/* Function: getDefault
			returns the default value for a column name
			
			Parameters:
				colname		-	lowercase name of column to retrieve a default value for
				
			If an explicit default for this column has been set via <setDefault>, or <setDefaults>, that is 
			returned. Otherwise, null is returned
			
			See Also:
				<getDefaults>
			*/
		/* Function: getDefaults
			returns a structure of all the default values for this table
			
			See:
				<getDefault>
			
			*/
		/* Function: getLabel
			returns the display label for a column name
			
			Parameters:
				colname		-	lowercase name of column to retrieve a label for
				
			If an explicit label for this column has been set via <setLabel>, that is 
			returned. Otherwise, the result of <genLabel> is returned
			
			*/	
		/* Function: getNew
			Returns a <BeanObject> representing a new row not yet inserted
			
			Parameters:
				initialValues	-	object representing the initial values of this 
										object. If this does not include a value for the 
										primary key, the primary key will be set to the 
										result from <genKey>.
				
			Note:
				Any defaults set by <setDefault> will be applied before returning 
				the bean object
				
			See:
				* <BeanObject.deferred>
				* <BeanObject.save>
				
			*/
		/* Function: belongsTo
			Sets a "belongsTo" relationship with another table.
			
			This function has 3 parameter patterns:
			
				Model Name:
					name	-	Name of model to associate, or a table name. Model names
								are the ProperCased singular of the table name
					
					(code)
						//these are equivalent
						var Person = dm.getManager("Person")
						Person.belongsTo("Profile")
						Person.belongsTo("profiles")
						
					(end)
				
				Model Definition object:
					name			-	Name of model or table to associate
					
					alias			-	*Optional, default _name_*
										Name to use when attaching related beans. Using 
										different alias allows you to model multiple 
										belongsTo relationships to the same table
										
					conditions	-	*Optional, default null*
										"where" pattern Object to contain this association, 
										see <ManagerObject.find>. You do NOT need this to 
										constrain by the foreign key
										
					foreignKey	-	*Optional, foreign table's primary key *
										Name of column in related table that this table 
										refers to. This is almost always the primary key 
										of that table
										
					localKey		-	*Optional, default modelname +"_id" * 
										The column in this table that contains the 
										foreign key value.
										
					cascade		-	*Optional, default false*
										This affects the treatment of the related model when a 
										record is deleted from this model. A value of 
										false, undefined or null will do nothing. The 
										string "null" will set null values for the
										_foreignKey_ column in the related table.
										The string "delete" will delete the related record 
										in the related table
										
					(code)
						this.belongsTo({
							name:"Profile",
							conditions:{
								where:"public = 1 and modified > {oneYearAgo:date}",
								oneYearAgo:new Date().add(Date.YEAR,-1).clearTime()
							}
						})
					(end)
				
				Model definition object array:
					(code)
						this.belongsTo([{
							name:"Profile",
							conditions:{
								where:"public = 1 and modified > {oneYearAgo:date}",
								oneYearAgo:new Date().add(Date.YEAR,-1).clearTime()
							}]
						},{
							name:"Employee"
						}])
					(end)
			
			Detail:
				This maps a one-to-one relationship with the related table to this 
				one. Once set, any beans returned by this manager will include a 
				function with the same name as the related model that represents the 
				result of <relatedModel>.get() for the 
				related row in the related table. This is best shown by example
				
				(code)
				// --- from a FlightPath MVC app ---
				//Person Model
				function init(){
					this.belongsTo("Profile")
				}
				//Person controller
				function edit(params){
					this.set("person",this.Person.get({id:params.id}));
				}
				//person_edit view
				Name: <input name="name" value:"<%=person.name%>"><br>
				<!--
					this is the same as 
					$FP.getModel("Profile").findBeans({person_id:person.id}).first().email
				-->
				Email: <input name="Profile.email" value:"<%=person.Profile().email%>"><br>
				
				(end)
				
				
		*/
		/* Function: hasOne
			Sets a "hasOne" relationship with another table.
			
			This function has 3 parameter patterns:
			
				Model Name:
					name	-	Name of model to associate, or a table name. Model names
								are the ProperCased singular of the table name
					
					(code)
						//these are equivalent
						var Person = dm.getManager("Person")
						Person.hasOne("Profile")
						Person.hasOne("profiles")
						
					(end)
				
				Model Definition object:
					name			-	Name of model or table to associate
					alias			-	*Optional, default _name_*
										Name to use when attaching related beans. Using 
										different alias allows you to model multiple 
										hasOne relationships to the same table
					conditions	-	*Optional, default null*
										"where" pattern Object to contain this association, 
										see <ManagerObject.find>. You do NOT need this to 
										constrain by the foreign key
					foreignKey	-	*Optional, default modelname +"_id" *
										name of column in related model that refers to this model
					localKey		-	*Optional, default model's primary key *
										This is the column in this table that contains the 
										foreign key value. This is almost always the 
										primary key of this table
					cascade		-	*Optional, default false*
										This affects the treatment of the related model when a 
										record is deleted from this model. A value of 
										false, undefined or null will do nothing. The 
										string "null" will set null values for the
										_foreignKey_ column in the related table.
										The string "delete" will delete the related record 
										in the related table
										
					(code)
						var Person = dm.getManager("Person")
						Person.hasOne({
							name:"Profile",
							alias:"RecentPublicProfile",
							conditions:{
								where:"public = 1 and modified > {oneYearAgo:date}",
								oneYearAgo:new Date().add(Date.YEAR,-1).clearTime()
							}
						})
					(end)
				
				Model definition object array:
					(code)
						var Person = dm.getManager("Person")
						Person.hasOne([{
							name:"Profile",
							alias:"RecentPublicProfile",
							conditions:{
								where:"public = 1 and modified > {oneYearAgo:date}",
								oneYearAgo:new Date().add(Date.YEAR,-1).clearTime()
							}]
						},{
							name:"Profile"
						}])
					(end)
			
			Detail:
				This maps a one-to-one relationship with the related table to this 
				one. Once set, any beans returned by this manager will include a 
				property with the same name as the related model that represents the 
				result of <relatedModel>.get() for the 
				related row in the related table. This is best shown by example
				
				(code)
				// --- from a FlightPath MVC app ---
				//Person Model (a DataManager.ManagerObject)
				function init(){
					this.hasOne("Profile")
				}
				//Person controller
				function edit(params){
					this.set("person",this.Person.get({id:params.id}));
				}
				//person_edit view
				Name: <input name="name" value:"<%=person.name%>"><br>
				<!--
					this is the same as 
					$FP.getModel("Profile").findBeans({person_id:person.id}).first().email
				-->
				Email: <input name="Profile.email" value:"<%=person.Profile().email%>"><br>
				
				(end)
				
				
		*/
		/* Function: hasMany
			Sets a "hasMany" relationship with another table.
			
			This function has 3 parameter patterns:
			
				Model Name:
					name	-	Plural name of model or exact table name to associate. 
								Plural Model names are the ProperCased table name, e.g 
								profiles becomes Profiles, and user_profiles would be 
								UserProfiles
					
					(code)
						//these are equivalent
						var Person = dm.getManager("Person")
						Person.hasMany("Posts")
						Person.hasMany("posts")
						
					(end)
				
				Model Definition object:
					name			-	Plural name of model exact table name to associate.
					alias			-	*Optional, default _name_*
										Name to use when attaching related beans. Using 
										different alias allows you to model multiple 
										hasMany relationships to the same table 
					conditions	-	*Optional, default null*
										"where" pattern Object to contain this association, 
										see <ManagerObject.find>. You do NOT need this to 
										constrain by the foreign key
					foreignKey	-	*Optional, default modelname +"_id" *
										name of column in related model that refers to this model
					localKey		-	*Optional, default model's primary key *
										This is the column in this table that contains the 
										foreign key value. This is almost always the 
										primary key of this table
					orderBy		-	*Optional, default null*
										Valid SQL order by expression. if defined, this will be used
										to order the related beans. 
					cascade		-	*Optional, default false*
										This affects the treatment of the related model when a 
										record is deleted from this model. A value of 
										false, undefined or null will do nothing. The 
										string "null" will set null values for the
										_foreignKey_ column in the related table.
										The string "delete" will delete the related record 
										in the related table
										
					(code)
						var Person = dm.getManager("Person")
						Person.hasMany({
							name:"Posts",
							alias:"RecentPosts
							conditions:{
								where:"published = 1 and modified > {oneYearAgo:date}",
								oneYearAgo:new Date().add(Date.YEAR,-1).clearTime()
							},
							orderBy:"category_title ASC, date_published DESC"
						})
					(end)
				
				Model definition object array:
					(code)
						var Person = dm.getManager("Person")
						Person.hasMany([{
							name:"Posts",
							alias:"RecentPosts
							conditions:{
								where:"published = 1 and modified > {oneYearAgo:date}",
								oneYearAgo:new Date().add(Date.YEAR,-1).clearTime()
							},
							orderBy:"category_title ASC, date_published DESC"
						},{
							name:"Posts",
							orderBy:"category_title ASC, date_published DESC"
						},{
							name:"Favorites"
						}])
					(end)
			
			Detail:
				This maps a one-to-many relationship with the related table to this 
				one. Once set, any beans returned by this manager will include a 
				function with the same name as the related alias that represents the 
				result of <relatedModel>.findBeans(), constrained by the foreign key 
				relationship. This is best shown by example
				
				(code)
				// --- from a FlightPath MVC app ---
				//Person Model
				function init(){
					this.hasMany("Posts")
				}
				//Person controller
				function edit(params){
					this.set("person",this.Person.get({id:params.id}));
				}
				//person_edit view
				Name: <input name="name" value:"<%=person.name%>"><br>
				<!--
					person.Posts is the same as 
					$FP.getModel("Post").findBeans({person_id:person.person_id})
				-->
				Posts:
				<ul>
				<@loop array="person.Posts()" element="post" index="i">
					<li> <%=post.title%>	
				</@loop>
				</ul>
				
				(end)
				
				
		*/
		/* Function: setDefault
			sets an explicit default value for a column
			
			Parameters:
				colname			-	column name to set a default value for
				            	
				defaultValue	-	Default value to set. If this is a function, it will be 
										executed and its return value will be used. This 
										function will be called with the column name, and a 
										reference to this manager
					
			Note: 
				Defaults are automatically applied by <getNew> and <get> to the 
				resulting deferred bean. Direct calls to <findBeans>, <getById> and 
				<create> will not apply defaults.  
				
			See Also:
				* <setDefaults>
			*/
		/* Function: setDefaults
			sets several default values at once
			
			Parameters:
				map		-	JS object where the keys are column names and the values are 
								default values 
								
			See:
				* <setDefault>
			*/
		/* Function: setLabel
			sets an explicit display label for a column
			
			Parameters:
				colname		-	column name to map
				label			-	label so set
			*/
		/* Function: setLabels
			sets an explicit display label for multiple columns at once
			
			Parameters:
				map		-	JS object where the keys are column names and the values are 
								labels 
			*/
		/* Function: validatorFunctions.length
			Validates length of string and numeric types
				
			Options:
				min	-	*Optional*
							minimum number of characters/integer places, or function that returns a length
				max	-	*Optional*
							maximum number of characters/integer places, or function that returns a length
			
			Options Functions:
				If the options are functions, they will be called with the same 
				parameters as the validator
				
			See:
				* <addValidator>
			*/
		/* Function: validatorFunctions.list
			Validates a value against a regular expression
				
			Options:
				oneOf					- *Optional, default null*
										Array, or function that returns an Array. If 
										defined, value must match one of these values
										
				notOneOf			- *Optional, default null*
										Array, or function that returns an Array. If 
										defined, value must NOT match one of these values
										
				caseSensitive	-	*Optional, default false*
										If false, the value and the list will be 
										converted to strings and a case-insensitive 
										comparison will be made. This property is ignored 
										if _exact_ is true
				exact				-	*Optional, default false*
										If true, values are matched by both class and 
										value, via === instead of ==. Setting this true 
										disables _caseSensitive_
										
				
			Note:
				Just setting _oneOf_ or _notOneOf_ will result in a case insensitive 
				string match. If both _oneOf_ and _notOneOf_ are defined, _notOneOf_ 
				will be ignored. If _oneOf_ or _notOneOf_ are functions, they will 
				be called with the same parameters as the validator. Empty arrays 
				are ignored as if undefined, thus it is possible to define both 
				lists and have whichever is not empty match, or have the validator
				pass if both are empty
				
				
			
			See:
				* <addValidator>
			*/
		/* Function: validatorFunctions.regex
			Validates a value against a regular expression
				
			Options:
				regex	- regular expression to apply
				
			Note: 
				Value will be converted to a string for the comparison. 
			
			See:
				* <addValidator>
			*/	
		/* Function: validatorFunctions.type
			Validates basic type
				
			Options:
				type	- one of "string", "numeric", "date" or "binary"	
			
			See:
				* <addValidator>
				* <Myna.Database.dbTypeToJs>
			*/
		/* Function: validatorFunctions.unique
			Validates a value is unique in a column
				
			Parameters:
				caseSensitive			-	*Optional, default false*
												Set to true for exact matches. Only applies to 
												character columns
				includeSoftDeleted	-	*Optional, default false*
												set to true to include soft deleted rows in 
												the search. 
				
			Detail: 
				This will perform a query against the current table looking for any 
				instances of this value, NOT associated with this primary key. If 
				any are found this validator will add an error     
			
			See:
				* <addValidator>
			*/
		/* Function: validatorFunctions.required
			Validates that a value is non-empty
				
			Parameters:
				
				
			Detail: 
				This will add an error if (!value) would return false, and value is 
				not zero     
			
			See:
				* <addValidator>
			*/
		/* Property: dm
			The <Myna.DataManager> object that created this manager
		
			*/
		/* Property: db
			The <Myna.Database> for this manager
		
			*/
		/* Property: deferred
			*default, false* Sets the deferred status of beans generated by this manager
			
			See: <BeanObject.deferred>
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
			
		/* Function: forceDelete
			alias for <ManagerObject.forceDelete>, which passes this bean's id 
			*/
			
		/* Function: getData
			return a structure of this bean's data
			
			Detail: 
			This is a copy of the data, so it will not change when 
			the object is modified
			*/
			
		/* Function: getLabel
			alias for <ManagerObject.getLabel>
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
			
		/* Function: remove
			alias for <ManagerObject.remove>, which passes this bean's id 
			*/
			
		/* Function: save
			Saves a deferred bean and returns a <Myna.ValidationResult> object 
			
			If called against a <deferred> BeanObject, all values in <data> are 
			persisted to the database. Afterwards, this bean's <deferred> status is 
			set to the manager's <deferred> status 
			
			*/
			
		/* Function: validate
			Validates this bean.
			
			Calls all of the validator functions added via <ManagerObject.addValidator> 
			against this bean and returns the merged <Myna.ValidationResult> object
				
			Parameters:
				colname	-	*Optional, default null*
								If defined, limits validation to a single column
			See:
				* <ManagerObject.addValidator>	
				
			*/
			
		/* Property: exists
			true if this bean exists in the database
		
			*/
		
		/* Property: manager
			The <ManagerObject> that created this bean
		
			*/
			
		/* Property: dm
			The <Myna.DataManager> object that created this bean
		
			*/
		/* Property: isDirty 
			true if this bean has unsaved changes, only applies to <deferred> beans
			
			See: 
			* <deferred>
		
			*/
		/* Property: deferred
			*Default false* determines whether "set" operations update the database
			
			If this is set to true, "set" operations on the bean,only update the 
			<data> property. Deferred beans only persist to the database when 
			<save> is called
			
			See:
				<ManagerObject.get>
				<ManagerObject.getNew>
		
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
		Myna.DataManager = function (dataSource/* ,managerTemplatePath,beanTemplatePath */){ 
			
			this.ds = dataSource;
			
			this.db = new Myna.Database(dataSource);
			this.qt = this.db.columnQuoteChar;
			this.managerTemplate="/shared/js/libOO/OrmManagerTemplate.ejs"
			this.beanTemplate="/shared/js/libOO/OrmBeanTemplate.ejs"
			
			this._managers={}
		
		}
		/* private functions */
			Myna.DataManager.prototype.getCacheValue =function(key,defaultValue) {
				var cache = $server_gateway.environment.get("__DM_CACHE__:"+key)
				if (!cache) {
					cache =typeof defaultValue == "function"?defaultValue():defaultValue;
					$server_gateway.environment.put("__DM_CACHE__:"+key,cache)
				}
				return cache
			}
			Myna.DataManager.prototype.setCacheValue =function(key,value) {
				$server_gateway.environment.put("__DM_CACHE__:"+key,value)
			}
			/* splitCap */
			Myna.DataManager.prototype.splitCap=function(name){
				return name.replace(/[A-Z]/g,function(str,offset){
					if (offset ==0){
						return str.toLowerCase();	
					} else {
						return "," + str.toLowerCase();	
					}
				}).split(",")
				
			}
			/* tablename-to-modelname */
			Myna.DataManager.prototype.t2m=function(name){
				return name.toLowerCase().split(/[-_]/).map(function(part,index,array){
					if (index == array.length -1){
						part = Myna.Inflector.singularize(part)
					}
					return part.titleCap();
				}).join("")
			},
			/* modelname-to-tablename */
			Myna.DataManager.prototype.m2t=function(name){
				var result =this.splitCap(name)
				
				result.push(Myna.Inflector.pluralize(result.pop()))
				
				return result.join("_")
				
			},
			/* modelname-to-plural-modelname */
			Myna.DataManager.prototype.m2pm=function(name){
				var result = this.splitCap(name)
				result.push(Myna.Inflector.pluralize(result.pop()))
				
				return result.map(function(part){
					return part.titleCap()
				}).join("")
				
			},
			/* plural-modelname-to-modelname */
			Myna.DataManager.prototype.pm2m=function(name){
				var result = this.splitCap(name)
				result.push(Myna.Inflector.singularize(result.pop()))
				
				return result.map(function(part){
					return part.titleCap()
				}).join("")	
			}
			
			/* plural-modelname-to-tablename */
			Myna.DataManager.prototype.pm2t=function(name){
				return this.m2t(this.pm2m(name))
				
			},
			/* modelname-to-foreignkeyname */
			Myna.DataManager.prototype.m2fk=function(name){
				var result = this.splitCap(name)
				result.push("id")
				
				return result.join("_")
				
			},
			/* foreignKey-to-tablename */
			Myna.DataManager.prototype.fk2t=function(name){
				var result = name.toLowerCase().listBefore("_").split(/_/).map(function(part,index,array){
					if (index == array.length -1){
						part = Myna.Inflector.pluralize(part)
					}
					return part;
				})
				return result.join("_")
			},
		Myna.DataManager.managerClasses={}
	/* ---------- getManager ------------------------------------------------- */
		Myna.DataManager.prototype.getManager=function(table,options){
			if (!options) options ={}
			options.setDefaultProperties({
				softDeleteCol:"deleted",
				createdCol:"created",
				modifiedCol:"modified",
			})
			
			var name;
			var tableName = table
			if (table instanceof Myna.Table) {
				name =tableName = table.tableName;
			} else {
				name=table;
				if (!this.db.getTable(tableName).exists){
					if (this.db.getTable(this.m2t(tableName)).exists){
						tableName = this.m2t(tableName)
					}
				}
			}
			tableName = tableName.toLowerCase();
			if (!this.db.getTable(tableName).exists){
				throw new Error(<ejs>
					Unable to find either '<%=table%>' or '<%=tableName%>' in datasource '<%=this.ds%>'  
				</ejs>)	
			}
			//Myna.printConsole(this.db.getTable(table).exists + ":"+this.m2t(table) +":"+this.ds)
			var tkey =tableName.toLowerCase();
			
			
			if ( tkey in this._managers){
				return this._managers[tkey];	
			} 
			
			var classFile = new Myna.File("/WEB-INF/myna/ds_class_cache/" + this.ds +"/" +tableName +".sjs")
			var templateFile =new Myna.File(this.managerTemplate)
			var staleClassFile =(
				!classFile.exists() 
				|| classFile.lastModified.getTime() < templateFile.lastModified.getTime()
			);
			
			
			
			if (
				!Myna.DataManager.managerClasses[tableName]
				|| staleClassFile 
			) {
				if (!staleClassFile){//now check for DDL changes
					var t = this.db.getTable(tableName);
					
					
					if (!(tableName+"_manager" in Myna.DataManager.managerClasses)){
						//Myna.printConsole(tkey +" loading for DDL check")
						Myna.include(classFile,Myna.DataManager.managerClasses);
					}
					var signature = Object({
						columns:t.columns,
						primaryKeyInfo:t.primaryKeyInfo,
						foreignKeyInfo:t.foreignKeyInfo,
						exportedKeys:t.exportedKeys
					}).toJson().hashCode()
					
					if (Myna.DataManager.managerClasses[tableName+"_manager"].signature != signature){
						staleClassFile =true;
						Myna.printConsole(tkey +" failed DDL check")
					}
				}
				if(staleClassFile){
					classFile.getDirectory().createDirectory();
					classFile.writeString(
						Myna.includeContent(templateFile,{dm:this,tableName:tableName})	
							.replace(/\[(\/?ejs)\]/g,"<$1>")
							.replace(/<\|/g,"<\%")
							.replace(/\|>/g,"\%\>")
							.replace(/#/g,"@")
					)
					//Myna.printConsole("loading model " + classFile)
				}
				if (!(tableName+"_manager" in Myna.DataManager.managerClasses)){
					//Myna.printConsole(tkey +" loading for stale file check")
					Myna.include(classFile,Myna.DataManager.managerClasses);
				}
			}
			var manager =this._managers[tkey]= new Myna.DataManager.managerClasses[tableName+"_manager"]();
			
			
			return manager._init(this,options)
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
									
									//Myna.log("debug","renumbering from undernode");
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
	/* ---------- managerExists --------------------------------------------- */
		Myna.DataManager.prototype.managerExists = function(name){
			if (this.db.getTable(name).exists){
				return true;
			}else {
				if (this.db.getTable(this.m2t(name)).exists){
					return true
				}
			}
			return false
		}
	/* ---------- validatorFunctions -------------------------------------------- */
		Myna.DataManager.validatorFunctions={
			type:function(colname,value,v,bean){
				this.checkRequired(["type"])
				var label = bean.manager.getLabel(colname);
				var type = typeof this.type =="function"?this.type(colname,value,v,bean):this.type;
				var msg = this.message||<ejs>
					<%=label%> must be of type "<%=type%>"
				</ejs>
				switch(type){
					case "string":
						if (typeof value == "string") return  
					case "numeric":
						if (parseFloat(value) == value) return
					case "date":
						if (value instanceof Date) return
					case "binary":
						if (value instanceof Array){
							try{
								if (value.getClass().getName() == "[B") return
							} catch(e){}
						}
					default:
						v.addError(msg,colname)
				}
			},
			length:function(colname,value,v,bean){
				var colDef = bean.manager.table.columns[colname]
				var msg = this.message
				var min = typeof this.min =="function"?this.min(colname,value,v,bean):this.min;
				var max = typeof this.max =="function"?this.max(colname,value,v,bean):this.max;
				if (Myna.Database.dbTypeToJs(colDef.data_type) == "string"){
					if (max){
						if (String(value).length > max){
							
							v.addError(msg ||
								<ejs>
									Exceeded maximum length for <%=bean.manager.getLabel(colname)%> (<%=max%>), 
									by <%=String(bean.data[colname]).length-max%>
								</ejs>,
								colname
							)
						}
					}
					if (min){
						if (String(value).length < min){
							v.addError(msg ||
								<ejs>
									<%=bean.manager.getLabel(colname)%> 
									must be at least <%=String(bean.data[colname]).length-min%> long
								</ejs>,
								colname
							)
						}
					}
					
				} else if (Myna.Database.dbTypeToJs(colDef.data_type) == "numeric"){
					if (max){
						if (String(parseInt(value)).length > max){
							v.addError(
								<ejs>
									Exceeded maximum length for <%=bean.manager.getLabel(colname)%> (<%=max%>), 
									by <%=String(bean.data[colname]).length-colDef.column_size%>
								</ejs>,
								colname
							)
						}
					}
					if (min){
						if (String(parseInt(value)).length  < min){
							v.addError(
								<ejs>
									<%=bean.manager.getLabel(colname)%> 
									must be at least <%=String(bean.data[colname]).length-min%> long
								</ejs>,
								colname
							)
						}
					}
				}
			},
			regex:function(colname,value,v,bean){
				this.checkRequired(["regex"])
				var msg= this.message|| bean.manager.getLabel(colname) +" is not properly formatted."
				if (!this.regex.test(String(value))) v.addError(msg,colname);
			},
			list:function(colname,value,v,bean){
				var oneOf = typeof this.oneOf =="function"?this.oneOf(colname,value,v,bean):this.oneOf;
				var notOneOf = typeof this.notOneOf =="function"?this.notOneOf(colname,value,v,bean):this.notOneOf;
				if (oneOf && oneOf.length){
					var msg= this.message|| bean.manager.getLabel(colname) 
								+" must be "+(oneOf.length>1?"one of ":"")+"'" + oneOf.join()+"'"
					if (this.exact){
						if (oneOf.indexOf(value) == -1) v.addError(msg,colname);
					} else if (this.caseSensitive){
						if (!oneOf.contains(value)) v.addError(msg,colname);
					} else {
						if (!oneOf.join().listContainsNoCase(value)) v.addError(msg,colname);
					}
				} else if (notOneOf && notOneOf.length){
					msg= this.message|| bean.manager.getLabel(colname) 
												+ " must NOT be "+(notOneOf.length>1?"one of ":"")+"'" + notOneOf.join() +"'"
					if (this.exact){
						if (notOneOf.indexOf(value) != -1) v.addError(msg,colname);
					} else if (this.caseSensitive){
						if (notOneOf.contains(value)) v.addError(msg,colname);
					} else {
						if (notOneOf.join().listContainsNoCase(value)) v.addError(msg,colname);
					}
				}
			},
			unique:function(colname,value,v,bean){
				var msg= this.message|| bean.manager.getLabel(colname) +" ("+value+"), already exists in another record."
				var search ={}
				search[colname] = value
				var result = bean.manager.find(search,this)
				if (result.length){
					if (result.length > 1 || result[0] != bean.id) v.addError(msg,colname);
				}
			},
			required:function(colname,value,v,bean){
				var msg= this.message|| bean.manager.getLabel(colname) +" is required."
				if (!value && value != 0 && value !== false){
					v.addError(msg,colname);
				}
			},
		}
	/* ---------- getRelated -------------------------------------------- */
		Myna.DataManager.getRelated=function(bean,alias,type,relatedModelOptions){
			var dm = bean.manager.dm;
			var relatedBean
			var relatedModel = dm.getManager(relatedModelOptions.name)
			var thisModel = bean.manager;
			try{
				var criteria  = {
					where:<ejs>
						<%=relatedModel.getSqlColumnName(relatedModelOptions.foreignKey)%> = {<%=relatedModelOptions.foreignKey%>}
					</ejs>
				}
			}catch(e){
				
				Myna.abort(e.message,Array.parse(arguments))
			}
			criteria[relatedModelOptions.foreignKey]=bean.data[relatedModelOptions.localKey]
			if (relatedModelOptions.conditions){
				relatedModelOptions.conditions.getKeys().forEach(function(prop){
					if (prop=="where"){
						criteria.where += " and " +relatedModelOptions.conditions.where +" ";
					}else{
						criteria[prop] = relatedModelOptions.conditions[prop];
					}
				})
			}
			
			switch(type){
				case "belongsTo":
				case "hasOne":
					var exists;
					exists = relatedModel.find(criteria);
					if (exists.length){
						relatedBean=relatedModel.getById(exists[0]);
						relatedBean.deferred =true;
					} else {
						relatedBean=relatedModel.getNew(criteria);
					}
					break;
				case "hasMany":
					relatedBean =relatedModel.findBeans(criteria);
					relatedBean.getNew = function(initialValues){
						var values = (initialValues||{}).applyTo({});
						values.setDefaultProperties(criteria)
						return relatedBean[relatedBean.length]=relatedModel.getNew(values)
					}
					break;
				case "hasBridgeTo":
					var bridgeTable =dm.db.getTable(relatedModelOptions.bridgeTable);
					relatedModelOptions.setDefaultProperties({
						localKey:thisModel.primaryKey,
						foreignKey:relatedModel.primaryKey,
						bridgeTable:[relatedModel.tableName,thisModel.tableName].sort().join("_"),
						localBridgeKey:dm.m2fk(dm.t2m(thisModel.tableName)),
						foreignBridgeKey:dm.m2fk(dm.t2m(relatedModel.tableName))
					})
					relatedBean =new Myna.Query({
						ds:dm.ds,
						sql:<ejs>
							select 
								ft.<%=relatedModel.getSqlColumnName(relatedModel.primaryKey)%> as id
							from
								<%=relatedModel.table.sqlTableName%> ft,
								<%=bridgeTable.sqlTableName%> bt
							where 
								bt.<%=bridgeTable.getSqlColumnName(relatedModelOptions.foreignBridgeKey)%>
									=	ft.<%=relatedModel.table.getSqlColumnName(relatedModelOptions.foreignKey)%>
								and bt.<%=bridgeTable.getSqlColumnName(relatedModelOptions.localBridgeKey)%> 
									= {localId:<%=thisModel.columns[relatedModelOptions.localKey].data_type%>}
							<@if relatedModelOptions.conditions>
								and <%=relatedModelOptions.conditions%>	
							</@if>	
							<@if relatedModelOptions.orderBy>
								order by <%=relatedModelOptions.orderBy%>	
							</@if>
							
						</ejs>,
						values:{
							localId:<%=JSON.stringify(bean[relatedModelOptions.localKey])%>
						}
					}).data.map(function(row){
						return relatedModel.getById(row.id)
					})
					relatedBean.columns = relatedModel.columns.getKeys()
					
					relatedBean.relatedModelOptions = relatedModelOptions;
					relatedBean.getNew = function(initialValues){
						var values = (initialValues||{}).applyTo({});
						var newBean = relatedBean[relatedBean.length]=relatedModel.getNew(values)
						newBean._hasBridgeTo = relatedBean.relatedModelOptions;
						return newBean
					}
					break;
				
			}
			
			relatedBean.model = relatedModel;
			relatedBean.relatedModelOptions = relatedModelOptions;
			bean._loadedAliases[alias]=relatedBean
			return relatedBean;
		}
	/* ---------- managerBaseClass -------------------------------------------- */
		Myna.DataManager.managerBaseClass = function(){}
		Myna.DataManager.managerBaseClass.prototype = {
			addValidator:function(colname,validator,options){
				if (!options) options ={}
				if (!this._validators) this._validators={}
				if (!colname) colname ="ALL";
				if (!(colname in this._validators)) this._validators[colname]=[];
				if (typeof validator === "string"){
					if (validator == "required") options.validateWhenNull = true;
					if (validator in Myna.DataManager.validatorFunctions 
						&& typeof Myna.DataManager.validatorFunctions[validator] === "function"
					){
						validator = Myna.DataManager.validatorFunctions[validator]
					} else throw new  Error(validator + " is not a validation function")
				}
				
				this._validators[colname].push(options.applyTo({
					validator:validator
				}))
									
			},
			loadTableData:function(tableName){//deprecated
				return this
			},
			remove:function(id){
				var manager = this;
				
				if (this.table.columnNames.contains(this.softDeleteCol)){
					//check datatype
					var deleteColType = Myna.Database.dbTypeToJs(
						this.table.columns[this.softDeleteCol].data_type
					); 
					if (deleteColType == "date"){
						
						this.getById(id).saveField(this.softDeleteCol,new Date())
					} else this.forceDelete(id)
				} else this.forceDelete(id)
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
			
			getDefault:function getDefault(colname){
				if (!this._defaults) this._defaults={}
				if (colname in this._defaults){
					var def = this._defaults[colname];
					if (typeof def == "function"){
						return def(colname,this)	
					} else {
						return this._defaults[colname]
					}
				}
				return null;
			},
			getDefaults:function getDefaults(){
				if (!this._defaults) this._defaults={}
				var result = {}
				var $this = this
				this._defaults.forEach(function(v,k){
					result[k] = $this.getDefault(k)
				})	
				return result
			},
			setDefault:function setDefault(colname,defaultValue){
				if (!this._defaults) this._defaults={}
				this._defaults[colname] = defaultValue;
			},
			setDefaults:function setDefaults(map){
				this._defaults = map.applyTo({})
			},
			genLabel:function genLabel(colname){
				var sr={
					id:"ID"	
				}
				if (colname in sr) return sr[colname]
				return colname.split(/_/).map(function(part){
					if (sr.getKeys().indexOf(part) >-1) return sr[part]
					return part.titleCap()
				}).join(" ")
			},
			getLabel:function getLabel(colname){
				return this._labels[colname]||this.genLabel(colname);
			},
			setLabel:function setLabel(colname,label){
				this._labels[colname] = label;
			},
			setLabels:function setLabels(map){
				var $this = this
				map.forEach(function(v,k){
					$this.setLabel(k,v)
				})
			},
			_applyRelatedValues:function(bean,values){
				this.associations.forEach(function(aliases,type){
					aliases.forEach(function(relatedModelOptions,relatedAlias){
						if (!(relatedAlias in values)) return;	
						if (bean[relatedAlias]() instanceof Array){
							var relatedBeans = values[relatedAlias];
							if (!relatedBeans) return;
							var relatedModel = bean.manager.dm.getManager(relatedModelOptions.name);
							var pk = relatedModel.primaryKey;
							if (relatedBeans instanceof Array){
								relatedBeans.forEach(function(relatedBean){
									relatedBean[relatedModelOptions.foreignKey] = bean.id;
									relatedBean = relatedModel.get(relatedBean)
									var existingBean =bean[relatedAlias]().findFirstByCol(pk,relatedBean.id); 
									if (existingBean){
										existingBean.setFields(relatedBean)
									} else {
										bean[relatedAlias]().push(relatedBean)
									}
								})
							} else {
								relatedBeans.forEach(function(relatedBean,keyVal){
									var existingBean =bean[relatedAlias]().findFirstByCol(pk,keyVal); 
									if (existingBean){
										existingBean.setFields(relatedBean);
									} else {
										relatedBean[pk] = keyVal;
										relatedBean[relatedModelOptions.foreignKey] = bean.id;
										
										bean[relatedAlias]().push(relatedModel.get(relatedBean))
									}
								})
							}
						}else{
							
							var relatedBean = values[relatedAlias];
							if (!relatedBean) return;
							bean[relatedAlias]().setFields(relatedBean)
						}
					})
				})			
				return bean;
			},
			get:function(values){
				//Myna.printConsole("get","values " + values.toJson())
				var searchParams ={}
				searchParams[this.primaryKey] = values[this.primaryKey];
				//make a local copy
				//values=values.applyTo(this.getDefaults(),true)
				
				var record = this.findBeans(searchParams,{includeSoftDeleted:true}).first(false)
				
				if (record){
					record.deferred = true;
					record.setFields(values)
					record.exists=true
					return this._applyRelatedValues(record,values)
				} else {
					return this.getNew(values)
				}
			},
			getNew:function getNew(initialValues){
				//Myna.printConsole("getNew","values " + initialValues.toJson())
				if (!initialValues) initialValues={}
				if (!(this.primaryKey in initialValues)){
					initialValues[this.primaryKey] = this.genKey()
				}
				initialValues.setDefaultProperties(this.getDefaults())
				var data ={}
				this.columnNames.forEach(function(name){
					if (name in initialValues) {
						data[name]=initialValues[name]
					} else {
						data[name]=null
					}
				})
				
				var bean = new this.beanClass(data,this)
				bean.deferred = true;
				bean.exists=false;
				bean.isDirty=true;
				
				return this._applyRelatedValues(bean,initialValues); 
			},
			belongsTo:function belongsTo(name){
				var work =[]
				if (name instanceof Array){
					work = name
				} else if (typeof name === "string"){
					work.push({
						name:name
					})
				} else {
					work.push(name)
				}
				work.forEach(function(options){
					options._belongsTo=true
				})
				return this.hasOne(work)
			},
			hasOne:function hasOne(name){
				var work =[]
				if (name instanceof Array){
					work = name
				} else if (typeof name === "string"){
					work.push({
						name:name
					})
				} else {
					work.push(name)
				}
				var thisModel = this;
				
				//each relationship
				work.forEach(function (relatedModelOptions){
					var relatedModelName = relatedModelOptions.name
					var relatedAlias = relatedModelOptions.alias = relatedModelOptions.alias || relatedModelOptions.name
					 
					if (relatedModelOptions._belongsTo){
						if (relatedAlias in thisModel.associations.belongsTo) {
							relatedModelOptions.setDefaultProperties(thisModel.associations.belongsTo[relatedAlias])	
						}
						relatedModelOptions.setDefaultProperties({
							localKey:thisModel.dm.m2fk(relatedAlias==relatedModelName?relatedModelName:relatedAlias),
							foreignKey:thisModel.primaryKey
						})
						thisModel.associations.belongsTo[relatedAlias] = relatedModelOptions;
					} else {
						if (relatedAlias in thisModel.associations.hasOne) {
							relatedModelOptions.setDefaultProperties(thisModel.associations.hasOne[relatedAlias])	
						}
						relatedModelOptions.setDefaultProperties({
							localKey:thisModel.primaryKey,
							foreignKey:thisModel.dm.m2fk(relatedAlias==relatedModelName?thisModel.modelName:relatedAlias)
						})
						thisModel.associations.hasOne[relatedAlias] = relatedModelOptions;
					}
					
					thisModel.__defineGetter__(relatedModelName, function() { 
						
						return thisModel.dm.getManager(relatedModelName);
						
					});
				})
			},
			hasMany:function hasMany(name){
				
				var work =[]
				if (name instanceof Array){
					work = name
				} else if (typeof name === "string"){
					work.push({
						name:name
					})
				} else {
					work.push(name)
				}
				var thisModel = this;
				
				
				//each relationship
				work.forEach(function (relatedModelOptions){
					
					
					/* singularize if this is a model name */
					if (relatedModelOptions.name.toLowerCase() != relatedModelOptions.name){
						
						relatedModelOptions.name =relatedModelName = thisModel.dm.pm2m(relatedModelOptions.name)
						
					}
					/* convert to model name */
					else{
						relatedModelName = relatedModelOptions.name =thisModel.dm.t2m(relatedModelOptions.name)
					}
					
					var relatedModelName = relatedModelOptions.name;
					var relatedAlias = relatedModelOptions.alias = relatedModelOptions.alias || relatedModelOptions.name;
					if (relatedAlias in thisModel.associations.hasMany) {
						relatedModelOptions.setDefaultProperties(thisModel.associations.hasMany[relatedAlias])	
					}
					
					if (!thisModel.dm.managerExists(relatedModelName)) {
						throw new Error("Model '"+relatedModelName+"' does not exist.")	
					}
					
					//singular model name calculated above, like Person
					var foreignKeyName = thisModel.modelName;
					if (relatedAlias!=relatedModelOptions.name){
						//Convert plural model alias to singular, e.g. CustomWidgets to CustomWidget
						foreignKeyName = thisModel.dm.t2m(thisModel.dm.pm2t(relatedAlias))
					}
					relatedModelOptions.setDefaultProperties({
						localKey:thisModel.primaryKey,
						foreignKey:thisModel.dm.m2fk(foreignKeyName)
					})
					
					thisModel.associations.hasMany[relatedAlias] = relatedModelOptions;
					thisModel.__defineGetter__(relatedModelName, function() { 
						
						return thisModel.dm.getManager(relatedModelName);
						
					});
					
					
				})
			},
			hasBridgeTo:function hasBridgeTo(name){
				var dm = this.dm;
				var work =[]
				if (name instanceof Array){
					work = name
				} else if (typeof name === "string"){
					work.push({
						name:name
					})
				} else {
					work.push(name)
				}
				var thisModel = this;
				
				
				//each relationship
				work.forEach(function (relatedModelOptions){
					var relatedModelName = relatedModelOptions.name;
					var relatedAlias = relatedModelOptions.alias = relatedModelOptions.alias || relatedModelOptions.name;
					if (relatedAlias in thisModel.associations.hasBridgeTo) {
						relatedModelOptions.setDefaultProperties(thisModel.associations.hasBridgeTo[relatedAlias])	
					}
					
					/* singularize if this is a model name */
					if (relatedModelOptions.name.toLowerCase() != relatedModelOptions.name){
						relatedModelOptions.name =relatedModelName = thisModel.dm.pm2m(relatedModelOptions.name)
						
					}
					thisModel.__defineGetter__(relatedModelName, function() { 
						
						return thisModel.dm.getManager(relatedModelName);
						
					});

					thisModel.associations.hasBridgeTo[relatedAlias] = relatedModelOptions;
					
					
				})
			},
		}
	/* ---------- beanBaseClass -------------------------------------------- */
		Myna.DataManager.beanBaseClass = function(data){}
		Myna.DataManager.beanBaseClass.prototype = {
			save:function(){
				var $this = this;
				if (!this.deferred) return new Myna.ValidationResult();
				var v = this.validate()
				var manager = this.manager
				
				if (v.success){
					try{
						//first save/create parent objects
						this.manager.associations.belongsTo.forEach(function(relatedModelOptions,alias){
							var relatedValidation = $this[alias]().save()
							v.merge(relatedValidation,alias +".");
						})
						var bean =this.manager.create(this.data)
						
						bean.applyTo(this,true);
						this.isDirty = false;
						this.exists=true
						var localBean = this;
						this._loadedAliases.forEach(function(relatedBean,alias){
							//already handled parents
							if (alias in $this.manager.associations.belongsTo) return;
							
							if (relatedBean instanceof Array){
								relatedBean.forEach(function(bean){
									var relatedValidation = bean.save()
									v.merge(relatedValidation,alias +"."+bean.id +".");
									//bridge tables are a pain
									if (relatedBean._hasBridgeTo && relatedValidation.success){
										//Fire a blind insert into bridge table	
										try {
											var bridgeTable =dm.db.getTable(relatedModelOptions.bridgeTable);
											var lbk=relatedBean._hasBridgeTo.localBridgeKey;
											var fbk=relatedBean._hasBridgeTo.foreignBridgeKey;
											new Myna.Query({
												ds:bean.manager.dm.ds,
												sql:<ejs>
													insert into <%=relatedBean._hasBridgeTo.bridgeTable%>(
														<%=lbk%>,
														<%=fbk%>
													) values (
														{localId:<%=bridgeTable.columns[lbk].data_type%>},
														{foreignId:<%=bridgeTable.columns[fbk].data_type%>},
													)
														
												</ejs>,
												values:{
													localId:localBean.id,
													foreignId:bean.id
												}
											})
										}catch(e){}
									}
								})	
							} else {
								var relatedValidation = relatedBean.save()
								v.merge(relatedValidation,alias +".");
							}
						})
						
						return v
					} catch(e){
						Myna.log("error","Error saving record",Myna.formatError(e) + Myna.dump(this.data,"record"));
						v.addError("Unable to save record. See Administrator log for details.");
						
						return v
					}
				} else return v
			},
			forceDelete:function(id){
				var bean=this;
				this.manager.associations.hasOne.forEach(function(alias,relatedModelOptions){
					if (!relatedModelOptions.cascade) return
					//getCriteria - a function that bullds search criteria
					var criteria= {
						where:relatedModelOptions.foreignKey+" = {"+relatedModelOptions.foreignKey+"}",
					}
					criteria[relatedModelOptions.foreignKey] =bean.data[relatedModelOptions.localKey]
					if (relatedModelOptions.conditions) {
						relatedModelOptions.conditions.applyTo(criteria);
						criteria.where += " and " +relatedModelOptions.conditions.where	;
					}
					
					var type = relatedModelOptions.cascade;
					var relatedModel=bean.manager.dm.getManager(relatedModelOptions.name);
					var exists = relatedModel.find(criteria);
					if (exists.length ==1){
						var relatedBean=relatedModel.getById(exists[0]);
						if (type=="delete"){
							relatedModel.forceDelete(relatedBean.id)
						} else if (type=="null"){
							relatedBean.saveField(relatedModelOptions.foreignKey,null)	
						}
						
					} 
				})
				this.manager.associations.hasMany.forEach(function(alias,relatedModelOptions){
					if (!relatedModelOptions.cascade) return
					//getCriteria - a function that bullds search criteria
					var criteria= {
						where:relatedModelOptions.foreignKey+" = {"+relatedModelOptions.foreignKey+"}",
					}
					criteria[relatedModelOptions.foreignKey] =bean.data[relatedModelOptions.localKey]
					if (relatedModelOptions.conditions) {
						relatedModelOptions.conditions.applyTo(criteria);
						criteria.where += " and " +relatedModelOptions.conditions.where	;
					}
					
					var type = relatedModelOptions.cascade;
					var relatedModel=bean.manager.dm.getManager(relatedModelOptions.name);
					relatedModel.findBeans(criteria).forEach(function(relatedBean){
						if (type=="delete"){
							relatedModel.forceDelete(relatedBean.id)
						} else if (type=="null"){
							relatedBean.saveField(relatedModelOptions.foreignKey,null)	
						}
					})	
					 
						
				})
				return this.manager.forceDelete(this.id)
			},
			getLabel:function(colname){
				return this.manager.getLabel(colname)
			},
			getData:function(onelevel){
				var bean=this;
				var result ={}
				result.setDefaultProperties(this.data)
				
				if (!onelevel){
					this.manager.associations.forEach(function(aliases,type){
						aliases.forEach(function(relatedModelOptions,alias){
							if (bean[alias]() instanceof Array){
								result[alias] = bean[alias]().map(function(relatedBean){
									return relatedBean.getData(true);
								})
							}else{
								result[alias] = bean[alias]().getData(true)
							}
						})
					})
				}
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
			remove:function(id){
				return this.manager.remove(this.id)
			},
			validate:function(colname,type){
				var v = new Myna.ValidationResult()
				var fieldList = colname?[colname]:this.manager.columnNames
				var manager = this.manager
				var bean = this;
				
				
				fieldList.forEach(function(colname){
					var value = bean.data[colname];
					
					function shouldRun(obj){
						if (typeof obj.when ==="function" && !obj.when(colname,value,v,bean)) return false;
						if (typeof obj.unless ==="function" && obj.unless(colname,value,v,bean)) return false;
						if (!obj.validateWhenNull && value === null) return false;
						return true;
					}
					try{
						if (colname in manager._validators){
							manager._validators[colname].filter(shouldRun).forEach(function(obj){
								obj.validator(colname,value,v,bean)
							})
						}
						if ("ALL" in manager._validators){
							manager._validators.ALL.filter(shouldRun).forEach(function(obj){
								obj.validator(colname,value,v,bean)
							})
						}
					}catch(e){
						v.addError("Error in validation. See Administrator log for details",colname)
						Myna.log(
							"error",
							"Error in validation for " + colname,
							Myna.formatError(e) +Myna.dump(bean.data,"Bean Data")
						);
					}
				})
				
				return v
			},
			toJSON:function(){
				return this.getData()
			},
		}