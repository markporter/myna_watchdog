/* Class: Model
	Data Modeling base class. See <Overview> for more details.
	
	 
*/

/* Topic: Overview
	In FlightPath, models (the M in MVC) are represented by the Model class.
	
	How to load a model:
	By convention, a model with the same name as the controller is automatically 
	loaded and stored in the controller's "model" property, and as a property 
	with the same name as the model. If a table with a name that fits the 
	convention (See: <Model Conventions>). Models can also be loaded by calling 
	<$FP.getModel>, or by accessing related models in a <beanClass> 
	
	Models provide access to data. Normally this is a database data source, but 
	custom Models can access any kind of data. Models are heavily influenced by 
	<Myna.DataManager> managers and beans and instances of these classes are used 
	when accessing databases. Models can also be associated with other models, 
	allowing associated data to be easily accessed. Each Model has a beanClass 
	property that is a JavaScript class that represents a "row" of data.
	
	See:
	* <Model Conventions>
	* <Defining Models>
	* <FlightPath Overview>
	
*/

/* Topic: Model Conventions
	* 	Model Names are singular, ProperCase, ex: EmployeeAction
	* 	Model File names are in file_case, ending with "_model", 
		ex: app/models/employee_action_model.sjs
	* 	Model definitions are discovered in this order: framework/models/<model_name>_model.sjs, 
		app/models/<model_name>.sjs, app/modules/<module_name>/models/<model_name>_model.sjs
	*  The ini() and functions in app/models/global.sjs are applied before 
		any model definitions discovered
	* 	Table Names are plural and file_case, ex: employee_actions
	*	Table columns should be in file_case, ex: employee_id
	*	Primary key columns should be named "id"
	*	Foreign key columns should be named "<singular_table_name>_id", 
		ex: employee_action_id
	*	Foreign keys defined in the database are automatically detected and applied 
		to models, regardless of naming format.
	*	bridge tables, i.e. tables that link two other tables in a many-to-many 
		relationship, will be detected automatically if they consist of only 
		foreign key columns and optionally a primary key
	*	column datatype validators are automatically applied 
	*	columns default values are NOT detected, these must be set in init()
	*/
/* Topic: Defining Models
	
	Database Models are defined automatically for tables in the default 
	datasource. However the database does not contain all the necessary meta data 
	to properly configure a Model, so defining a model is a good idea. Model 
	definitions can be stored in app/models/<model_name>_model.sjs or in a module, 
	app/modules/module_name/models/<model_name>_model.sjs. The primary source of 
	configuration is the <init> function. This is executed after the init() 
	function in app/models/global.sjs. Any functions or properties defined in 
	this file will be added to final Model instance.
	
	Functions called from init:
	* Associations: <belongsTo>, <hasOne>, <hasMany>, <hasBridgeTo>
	* <beanClass> configuration: <setDefault>/<setDefaults>, <setLabel>/<setLabels>, <addField>/<addFields>, <addValidator>
	
	
	Functions typically overloaded in definitions:
	* <genKey>
	* <genLabel>
	
	
	Examples:
		(code)
		//app/models/employee_action.sjs
		
		//if the table name doesn't follow convention, i.e "employee_actions", 
		//you can force it here:
		//var tableName="emp_action"
		
		//If you model is not in the "default" datasource alias, you can indicate 
		//which manager to use by alias name here:
		//var manager="alias from $application.config.ds"
		
		
		//runs after Myna.DataManager and any init() in app/models/global.sjs
		function init(){
			 
			this.setLabels({//other lables will be generated 
				payrollgrp:"Payroll Group"
			})
			
			this.setDefaults({
				action_type:"other",
				action_date:function(){return new Date()}
			})
		
			//this is only necessary if the foreign key is not defined in the database 
			this.belongsTo("Employee");
			
		}
		
		//replaces default implementation
		function genKey(){
			//oracle specific sequence query
			// this could be defined in app/models/global.sjs if all tables generate 
			// keys in the same way
			return new Myna.Query({
				ds:this.ds,
				sql:<ejs>
					select 
						nextval(seq_employee_actions) id
					from dual
				</ejs>
			})[0].id
		}
		(end)
	
	See: 
	* <Myna.DataManager> all manager and bean functions and properties are 
		applied to Models and beanClasses
	* <Custom Models>, for information on non-database models
	*/
	
/* Topic: Custom Models
	
	Custom models are models that do not have a database table back-end. Because 
	of this, they require more configuration than table-backed models.
	
	Custom models must make one or more calls to <addField>/<addFields>, and 
	implement the following functions:
	* <create>
	* <forceDelete>
	* <saveBeanField>
	* <query>
	
	Otherwise Custom models should behave just like table-backed models.
	
	Here is an example of a custom model for managing Myna data sources
	
	(code)
		function init(){
			this.addFields([
				{ name:"name", idField:true, type:"string", defaultValue:""},
				{ name:"url",  type:"string", defaultValue:"" },
				{ name:"port", type:"numeric", defaultValue:0 },
				{ name:"file", type:"string", defaultValue:"" },
				{ name:"server", type:"string", defaultValue:"" },
				{ name:"case_sensitive", type:"numeric", label:"Case Sensitive Columns?", defaultValue:0 },
				{ name:"username", type:"string", defaultValue:"" },
				{ name:"desc", label:"Description", type:"string", defaultValue:"" },
				{ name:"type", type:"string", defaultValue:"" },
				{ name:"location", type:"string", defaultValue:"" },
				{ name:"password", type:"string", defaultValue:"" },
				{ name:"driver", type:"string", defaultValue:"" },
				{ name:"db", type:"string", label:"Database", defaultValue:"" }
			])
			this.deferred = true;
			this.validation = Myna.Admin.ds.dsValidation.clone()
		}
	
	
		function create(newDs){
			var isNew = !this.exists;
			var vr =Myna.Admin.ds.save(newDs,isNew)
			if (vr.success){
				return this.getById(newDs.name)
			} else throw vr
			
		}
		function forceDelete(name){
			new Myna.File($server.rootDir + "WEB-INF/myna/ds/" + name + ".ds").forceDelete()
		}
		function saveBeanField(bean,fieldName,oldval,newval){
			var v = bean.validate(fieldName);
			
			// Don't actually save. Bean instances of this model are always deferred and
			// must be saved via "save" which eventually calls "create"
			
			return v
		}
		
		function query(pattern,options){
			var $this = this;
			if (!pattern) pattern={}
			if (pattern.select == "*") delete pattern.select
			 
			//just in case these database query extensions are passed
			var criteria = pattern.filter(function(v,k){
				return !"select,where,orderBy".listContains(k)
			})
			var result= Myna.Admin.ds.getAll()
			.filter(function(ds){
				if (!criteria.getKeys().length) return true
				return criteria.getKeys()
					.every(function(key){
						if (typeof criteria[key] == "string"){
							return criteria[key].toLowerCase() == (ds[key]||"").toLowerCase()
						} else {
							return criteria[key] == ds[key]
						}
					})
			}).map(function(row){
				if (!pattern.select) return row
			
				//support a comma separated field list in "select"
				return row.filter(function(v,k){
					return pattern.select.listContains(k)
				})
			})
			return new Myna.DataSet({
				columns:pattern.select||this.fieldNames,
				data:result
			})
		}

	(end)
	
	*/
	
/* Model constructor, used internally by FlightPath
	*/
	function Model(){
		var model = this;
		if (!this._labels) 	this._labels={}
		if (!this._defaults) this._defaults={}
		if (!this._types) this._types={}
		if (!this._validators) this._validators={}	
		
		if (!this.associations){
			this.associations ={
				hasOne:{},
				hasMany:{},
				belongsTo:{},
				hasBridgeTo:{},
			}
		}
		
		/* if (!this.genKey){
			this.genKey =function genKey(){
				return "";
			}
		} */
		if (!this.fields) this.fields={}
		if (!this.fieldNames) this.fieldNames=[]
		if (!this.validation){	
			this.validation = new Myna.Validation();
			
			({
				unique:function(params){
					var v = new Myna.ValidationResult()
					//Myna.log("debug","got here "  + String(typeof $server_gatway != "undefined"));
					if (typeof $server_gateway != "undefined"){
						//Myna.log("debug","params",Myna.dump(params));
						var msg= params.options.message|| params.label +" ("+params.value+"), already exists in another record."
						var search ={}
						search[params.property] =params.value
						var result = params.obj.manager.find(search,params.options)
						//Myna.log("debug","resukt",Myna.dump(result));
						if (result.length){
							if (result.length > 1 || result[0] != params.obj.id) v.addError(msg,params.property);
						}
					}
					return v
				},
			}).applyTo(this.validation.validatorFunctions)
			this.validation.getLabel = this.getLabel
			this.validation.genLabel = this.genLabel
			this.addValidator = function(property,validator,options){
				return this.validation.addValidator(property,validator,options)
			}
			this.addValidators = function(config){
				return this.validation.addValidators(config)
			}
			
		}
	}
/* Property: manager
	Manager alias for this model. 
	
	This is an alias defined in the application.sjs in the config.ds section. 
	This causes this model to be loaded form the indicated datasource.
	Defined at the top of the model file before init()
	
	Example
	(code)
		// in application.sjs
		...
		config:{
			ds:{
				"default":"hr",
				"accounting":"gl",	
			}
		...
	(end)
	
	(code)
		// in app/models/account_model.sjs
		
		var manager="accounting";
		
		function init(){
		}
		...
	(end)
	
	*/
/* Property: tableName
	table to load instead of the default name. 
	
	For database backed Models where the table name does not conform to 
	convention. Defined at the top of the model file before init()
	
	Example
	
	(code)
		// in app/models/account_model.sjs
		
		var tableName="acc2012";
		
		function init(){
		}
		...
	(end)
	
	*/
/* Property: validation
	an instance of <Myna.Validation>. Normally built up via <addValidator> 
	*/
/* Property: name
	this model's name, set by FLightPath
	*/
/* Property: idField
	name of the identifying field, normally set in init() for Custom Models 
	*/	


/* Model Class Functions */
	/* splitCap */
		Model.splitCap=function(name){
			return name.replace(/[A-Z]/g,function(str,offset){
				if (offset ==0){
					return str.toLowerCase();	
				} else {
					return "," + str.toLowerCase();	
				}
			}).split(",")
			
		}
	/* tablename-to-modelname */
		Model.t2m=function(name){
			return name.toLowerCase().split(/[-_]/).map(function(part,index,array){
				if (index == array.length -1){
					part = Myna.Inflector.singularize(part)
				}
				return part.titleCap();
			}).join("")
		}
	/* modelname-to-tablename */
		Model.m2t=function(name){
			var result =this.name.splitCap()
			
			result.push(Myna.Inflector.pluralize(result.pop()))
			
			return result.join("_")
			
		}
	/* modelname-to-plural-modelname */
		Model.m2pm=function(name){
			var result = this.name.splitCap()
			result.push(Myna.Inflector.pluralize(result.pop()))
			
			return result.map(function(part){
				return part.titleCap()
			}).join("")
			
		}
	/* plural-modelname-to-modelname */
		Model.pm2m=function(name){
			var result = name.splitCap()
			result.push(Myna.Inflector.singularize(result.pop()))
			
			return result.map(function(part){
				return part.titleCap()
			}).join("")	
		}
		
	/* plural-modelname-to-tablename */
		Model.pm2t=function(name){
			return this.m2t(this.pm2m(name))
			
		}
	/* modelname-to-foreignkeyname */
		Model.m2fk=function(name){
			var result = this.name.splitCap()
			result.push("id")
			
			return result.join("_")
			
		}
	/* foreignKey-to-tablename */
		Model.fk2t=function(name){
			var result = name.toLowerCase().listBefore("_").split(/_/).map(function(part,index,array){
				if (index == array.length -1){
					part = Myna.Inflector.pluralize(part)
				}
				return part;
			})
			return result.join("_")
		}
	/* notImplemented */
		Model.notImplemented = function notImplemented(method){
			throw new Error("Method '{0}' is not implemented by this class".format(method))
		} 	
	/* getRelated */
		Model.getRelated=function(bean,alias,type,relatedModelOptions){
			
			var relatedBean
			var relatedModel = $FP.getModel(relatedModelOptions.name)
			var thisModel = bean.model;
			var criteria  = {}
			
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
					var bridgeModel =$FP.getModel(relatedModelOptions.bridgeModel);
					relatedModelOptions.setDefaultProperties({
						localKey:thisModel.idField,
						foreignKey:relatedModel.idField,
						bridgeModel:[relatedModel.name,thisModel.name].sort().join(""),
						localBridgeKey:Model.m2fk(Model.t2m(thisModel.name)),
						foreignBridgeKey:Model.m2fk(Model.t2m(relatedModel.name))
					})
					criteria  = {}
			
					criteria[relatedModelOptions.localBridgeKey]=bean.data[relatedModelOptions.localKey]
					relatedBean =bridgeModel.findBeans(criteria).map(function(bridgeBean){
						return relatedModel.getById(bridgeBean[relatedModelOptions.foreignBridgeKey])
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
		
Model.prototype={
	name:"",
	idField:"",
/* Function: init
	Initializes a model instance
	
	Whenever a model is instantiated, init() is run to configure the 
	instance. First the init() in the Model base class is run, then the 
	init() in app/models/global.sjs, and finally the init() in 
	app/models/<name>_model.sjs
	
	Functions typically called from init:
	* Associations: <belongsTo>, <hasOne>, <hasMany>, <hasBridgeTo>
	* <beanClass> configuration: <setDefault>/<setDefaults>, <setLabel>/<setLabels>, <addField>/<addFields>, <addValidator>
	
	*/
/* Function: applyBehavior
	loads a behavior and applies it to this object
	
	Parameters:
		name		-	The ProperCased name of the behavior to load, or an array of these names
		
	Detail:
		Loads a behavior by name from app/behaviors/models/ or 
		framework/behaviors/models/, whichever is found first. Behaviors are 
		functions that are applied to the current object. <applyBehavior> should 
		be called from <init>
	
	Example:
	(code)
		//in some_model.sjs
		function init(){
			this.applyBehavior([
				"SomeBehavior",
				"SomeOtherBehavior"
			]);
		}
	(end)
	*/	
	applyBehavior:function applyBehavior(name){
		if (!(name instanceof Array)){
			name = [name]
		}
		var $this= this;
		name.forEach(function(name){
			var b=new Myna.File($FP.dir,"app/behaviors/models",$FP.c2f(name)+".sjs")
			if (!b.exists()) {//check in framework
				b=new Myna.File($FP.frameworkFolder,"behaviors/models",$FP.c2f(name)+".sjs")
			}
			if (!b.exists()) throw new Error("Behavior '"+name + "' does not exist.");
				
			b=Myna.include(b,{});
			
			for (var p in b){
				if (p=="init") continue;
				$this[p] = b[p];
			}
			if ("init" in b) b.init.call($this)
		})
		
	},

/* Function: addValidator
	adds a validation function to this Model's <validation> object
	
	Parameters:
		property		-	property to validate. If this is set to null, then this 
							validator will be called for every property
							
		validator	-	Either a String or a validation function. If this is 
							a string, it must match one of the standard 
							validation functions stored in <Myna.Validation.validatorFunctions>,
							or the Model-specific validator <validatorFunctions.unique>
							This function will be called when needed to validate 
							_property_ See *Validator Function* below
							
		options		-	*Optional, default undefined*
							any options needed by the validator
							

						
	Validator Function:
	The _validator_ function  will be called with a parameters object with these properties
		obj			-	Object being validated
		property		-	Property being validated
		label			-	result of <getLabel> for _property_
		value			-	value being validated
		options		-	validator options. Most validators define their own 
							specific options, but all validators accept the options below 
		
	
	Validator Options:
		when		-	A function that will take the same parameters as a validator 
						function and return true if the validator should be run. This 
						is normally used conditionally validate one of the built-in 
						validators  
		
		
	Returns:
		this validation instance
		
	Examples:
	
	(code)
		this.addValidator("first_name","length",{
			min:3,
			max:25
		})
		
		//only validate spouse_name when married is true
		this.addValidator("spouse_name","required",{
			when:function(params){
				return params.obj.married
			}
		})
		
		function isBob(params){
			var vr = new Myna.ValidationResult();
			if (params.value != "Bob"){
				var msg = params.options.message || params.label + " is not Bob!"
				vr.addError(msg,colname)
			}
			return vr;
		}
		
		this.addValidator("first_name",isBob,{
			message:"Inferior name entered."
		})
		
	(end)
	
	See:
		* <Myna.Validation>
		* <validation> property
		* <addValidators>
		* <beanClass.validate>
	*/
	addValidator:function addValidator(colname,validator,options){
		if (!options) options ={}
		if (!this._validators) this._validators={}
		if (!colname) colname ="ALL";
		if (!(colname in this._validators)) this._validators[colname]=[];
		if (typeof validator === "string"){
			if (validator == "required") options.validateWhenNull = true;
			if (validator in Model.validatorFunctions 
				&& typeof Model.validatorFunctions[validator] === "function"
			){
				validator = Model.validatorFunctions[validator]
			} else throw new  Error(validator + " is not a validation function")
		}
		
		this._validators[colname].push(options.applyTo({
			validator:validator
		}))
							
	},

/* Function: create
	*Custom Model Override* A model specific create function function.

	Parameters:
	requiredFields			-	A JS object where the properties are field names 
									and the values are field values   
		
	returns a <beanClass> instance of the bean created
		
	*Custom Models must implement this function.*
	
	Database models use <ManagerObject.create> 
	*/
	create:function create(requiredFields){Model.notImplemented(arguments.callee.name)},
/* Function: forceDelete
	*Custom Model Override* A model specific delete function.

	Parameters:
	id			-	id of "row" to delete 
		
		
	*Custom Models must implement this function.*
	
	Database models use <ManagerObject.forceDelete> 
	*/	
	forceDelete:function forceDelete(id){Model.notImplemented(arguments.callee.name)},
/* Function: query
	*Custom Model Override* A model specific search function.

	Parameters:
	pattern	-	String or Object. Search pattern. Can be either a single string 
					value to search within the id field, or an object where each 
					property is a field name and the values are search patterns
	options	-	*Optional* JS Object. Extra options tothe query
	
	returns a <Myna.DataSet> of <beanClass> Objects
	
	*Custom Models must implement this function.*
	
	Database models use <ManagerObject.query> from <DataManager>
	*/
	query:function query(pattern,options){Model.notImplemented(arguments.callee.name)},
	

/* Function: saveBeanField
	*Custom Model Override* A model specific save function.

	Parameters:
	bean			-	reference to <beanClass> instance being saved 
	fieldName	-	name of field being saved
	oldval		-	value of field before being modified
	newval		-	new value of field
	
	returns a <Myna.ValidationResult> object
	
	*Custom Models must implement this function.*
	
	Database models do not use this function 
	*/	
	saveBeanField:function saveBeanField(bean,fieldName,oldval,newval){Model.notImplemented(arguments.callee.name)},
/* Function: find
	returns an array of <idField> values that match a search
	
	Parameters:
		pattern			-	if this is a String, Number, or Date, the primary 
								key will be searched for this value. If this is an 
								object, each key is expected to by a field name 
								and the value a pattern to search for. 
								
		options			-	query options, used by extending classes
	
	Database models use <ManagerObject.find> which offers more options. Custom 
	Models may offer extra features as well. 
		
	See:
		* <ManagerObject.find> 
		* <findBeans>
	*/
		
	find:function find(pattern,options){
		var $this = this
		if (!pattern) pattern={}
		if (typeof pattern == "object" && !(pattern instanceof Date)){
			pattern.setDefaultProperties({select:$this.idField})
		} else {
			var id = pattern;
			pattern ={
				select:$this.idField
			}
			pattern[this.idField] = id
		}
		return this.queryCol(pattern,options)
		
	},
/* Function: findBeans
	returns a <Myna.DataSet>  of <beanField> values that match a search
	
	Parameters:
		pattern			-	if this is a String, Number, or Date, the primary 
								key will be searched for this value. If this is an 
								object, each key is expected to by a field name 
								and the value a pattern to search for. 
								
		options			-	query options, used by extending classes
	
	Database models use <ManagerObject.findBeans> which offers more options. Custom 
	Models may offer extra features as well.
	
		
	See:
		* <ManagerObject.findBeans> 
		* <find>
	*/
	findBeans:function findBeans(pattern,options){
		var $this = this;
		pattern=pattern||{}
		if (options === !!options) {
			options={
				caseSensitive:!!options
			}	
		}
		
		try {
			if ( pattern && typeof pattern == "object" &&  !("select" in pattern)){
				pattern.select ="*"
			}
		}catch(e){
			Myna.printConsole("Model.findBeans: bad pattern " + String(pattern) + " == "+ (typeof pattern))
		}
			
		return new Myna.DataSet({
			columns:$this.fieldNames,
			data:this.query(pattern,options)
				.map(function(row){
					var bean = new $this.beanClass(row,$this)
					bean.deferred = $this.deferred;
					bean.exists=true;
					return bean
				})
		})
	},
/* Function: genKey
	Generates a unique identifier for this Model
	
	Database models use <ManagerObject.genKey> Custom 
	Models should override this this function
		
	See:
		* <ManagerObject.genKey> 
	*/
	
	
/* Function: getField
	returns metadata for a field
	
	Returned Object Properties:
		name				-	name of field
		type				-	type of field, See: <getType>
		label				-	label of field, See: <getLabel>
		defaultValue	-	default value, See: <getDefault>
	 
	*/	
	getField:function getField(name){
		return {
			name:name,
			type:this.getType(name),
			label:this.getLabel(name),
			defaultValue:this.getDefault(name)
		}
		
	},
/* Function: getField
	returns array of field metadata objects
	
	
	See:
		* <getField>
	*/	
	getFields:function getFields(){
		var $this= this;
		return this.fieldNames.reduce(function(obj,name){
			obj[name] = $this.getField(name)
			return obj
		},{})
	},
/* Function: getType
	returns type of field
	
	Parameters:
	name		-	name of field
	
	Possible Types:
	* string
	* numeric
	* date
	* binary
	
	
	See:
		* <addField>
	*/	
	getType:function getType(name){
		return this._types[name]
	},
/* Function: addField
	adds a field to this Model's <beanClass>
	
	Parameters:
	def		-	JS Object, see Field Definition below
	
	Field Definition:
	name				-	name of field
	type				-	*Optional* field type, one of ["string","numeric","date","binary"]
	label				-	*Optional* label of field
	defaultValue	-	*Optional* default value of field
	idField			-	*Optional, boolean* if true, this will be set as the 
							<idField> for this model. There can be only one id field per 
							model
	
	returns this model
	See:
		* <addFields>
	*/	
	addField:function addField(def){
		if (this.fieldNames.indexOf(def.name) == -1){
			this.fieldNames.push(def.name);
			this._types[def.name]=def.type;
			if ("label" in def){
				this.setLabel(def.name,def.label);
			}
			if ("defaultValue" in def){
				this.setDefault(def.name,def.defaultValue);
			}
			if (def.validators){
				var $this = this;
				def.validators.forEach(function(v,k){
					$this.addValidator(def.name,v.validator,v.options)
				})	
			} else if ("string,numeric,date,binary".listContains(def.type)) {
				this.addValidator(def.name,"type",{type:def.type})
			}
			if (def.idField) this.idField=def.name
		}
		return this
	},
/* Function: addField
	adds multiple fields to this Model's <beanClass>
	
	Parameters:
	fields	-	array of  Field Definitions
	
	
	returns this model
	See:
		* <addField>
	*/	
	addFields:function addFields(fields){
		var $this = this;
		fields.forEach(function(def){
			$this.addField(def)
		})
	},
/* Function: getById
	returns the <beanClass> for a given ID, or throws an exception
	
	Parameters:
		id		-	id of bean to return
	*/
	getById:function getById(id){
		var criteria ={}
		criteria[this.idField] = id
		var qry =this.query(criteria)
		if (!qry.length) throw new Error("ID {0} not found in {1}".format(id,this.name))
		
		var bean = new this.beanClass(qry[0],this)
		bean.deferred = this.deferred;
		bean.exists=true;
		
		return bean
	},
/* Function: getDefault
	returns the default value for a given field name
	
	Parameters:
		name		-	name of field
		
	See:
		* <getDefaults>
	*/
	getDefault:function getDefault(name){
		if (name in this._defaults){
			var def = this._defaults[name];
			if (typeof def == "function"){
				return def(name,this)	
			} else {
				return this._defaults[name]
			}
		}
		return null;
	},
/* Function: getDefaults
	returns a JS Object where the properties are field names and values are their 
	default values
	
	Parameters:
		name		-	name of field
		
	See:
		* <getDefault>
	*/
	getDefaults:function getDefaults(){
		if (!this._defaults) this._defaults={}
		var result = {}
		var $this = this
		this._defaults.forEach(function(v,k){
			result[k] = $this.getDefault(k)
		})	
		return result
	},
/* Function: remove
	removes a bean by id
	
	Parameters:
		id		-	id of bean to remove
		
	Note that database models support "soft" deletes via a softDelete Column
	See:
		* <ManagerObject.remove>
		* <forceDelete>
	*/	
	remove:function remove(id){
		return this.forceDelete(id)
	},
/* Function: setDefault
	sets a default value for a field
	
	Parameters:
		name		-	name of field
		value		-	default value
		
	See:
		* <setDefaults>
	*/	
	setDefault:function setDefault(name,value){
		if (!this._defaults) this._defaults={}
		this._defaults[name] = value;
	},
/* Function: setDefaults
	sets a default values for multiple fields
	
	Parameters:
		map		-	JS Object where the properties are field names and the values 
						are default values 
		
	See:
		* <setDefault>
	*/
	setDefaults:function setDefaults(map){
		this._defaults = map.applyTo({})
	},
/* Function: genLabel
	generates a display label from a field name
	
	The default implementation either uses one of the special replacements below, 
	or  replaces all underbars with spaces and calls <String.titleCap> on the 
	result. You can override this function in your models for custom behavior
	
	Special Replacements:
	id		-	ID
	*/	
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
/* Function: getLabel
	returns the label for a field name
	
	Parameters:
		name 	-	field name 
		
	See:
		* <setLabel>
	*/
	getLabel:function getLabel(name){
		return this._labels[name]||this.genLabel(name);
	},
/* Function: setLabel
	sets a label for a field name
	
	Parameters:
		name 	-	field name
		label	-	label
		
	See:
		* <setLabels>
		* <getLabel>
	*/	
	setLabel:function setLabel(name,label){
		this._labels[name] = label;
	},
/* Function: setLabels
	sets multiple labels 
	
	Parameters:
		map		-	JS Object where the properties are field names and the values 
						are labels
		
		
	See:
		* <setLabel>
		* <getLabel>
	*/	
	setLabels:function setLabels(map){
		var $this = this
		map.forEach(function(v,k){
			$this.setLabel(k,v)
		})
	},
	_applyRelatedValues:function _applyRelatedValues(bean,values){
		this.associations.forEach(function(aliases,type){
			aliases.forEach(function(relatedModelOptions,relatedAlias){
				if (!(relatedAlias in values)) return;	
				if (bean[relatedAlias]() instanceof Array){
					var relatedBeans = values[relatedAlias];
					if (!relatedBeans) return;
					var relatedModel = $FP.getModel(relatedModelOptions.name);
					var pk = relatedModel.idField;
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
/* Function: get
	returns either an instance of an existing bean or the result of <getNew>
	
	Parameters:
		values		-	*Optionsal, default null*
							JS object containing the values for this object
		
	Detail:
		This function attempts to create a usable bean even if there is no 
		matching record. If _values_ is provided with a valid primary 
		key, then <getById> is called, <beanClass.deferred> is set to true, 
		and <beanClass.setFields> is called with _values_. Otherwise 
		<getNew> is called with _values_. Regardless, the resulting bean 
		will be deferred and <beanClass.save> must be called to persist 
		changes
	
	Note:
		Any defaults set by <setDefault> will be applied before returning 
		the bean object
		
	Example:
	(code)
		//in app/controllers/order_controler.sjs
		//crate or update an order from form data:
		function save(params){
			var order = this.model.get(params)
			var result = order.save();
			if (result.success) {
				...
			} else{
				...
			}
		}
	(end)
	*/
			
	get:function get(values){
		//Myna.printConsole("get","values " + values.toJson())
		var searchParams ={}
		searchParams[this.idFiedl] = values[this.idField];
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
/* Function: getNew
	Returns a <beanClass> representing a new row not yet inserted
	
	Parameters:
		initialValues	-	object representing the initial values of this 
								object. If this does not include a value for the 
								<idField>, the <idField> will be set to the 
								result from <genKey>.
		
	Note:
		Any defaults set by <setDefault> will be applied before returning 
		the bean object
		
	See:
		* <beanClass.deferred>
		* <beanClass.save>
		
	*/
	getNew:function getNew(initialValues){
		//Myna.printConsole("getNew","values " + initialValues.toJson())
		if (!initialValues) initialValues={}
		if (!(this.idField in initialValues)){
			initialValues[this.idField] = this.genKey()
		}
		initialValues.setDefaultProperties(this.getDefaults())
		var data ={}
		this.fieldNames.forEach(function(name){
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
/* Function: belongsTo
	Sets a "belongsTo" relationship with another model.
	
	This function has 3 parameter patterns:
	
		Model Name:
			name	-	Name of model to associate. Model names
			
		Model Definition object:
			name			-	Name of model to associate
			
			alias			-	*Optional, default _name_*
								Name to use when attaching related beans. Using 
								different alias allows you to model multiple 
								belongsTo relationships to the same Model
								
			conditions	-	*Optional, default null*
								"where" pattern Object to contain this association, 
								see <find>. You do NOT need this to 
								constrain by the foreign key
								
			foreignKey	-	*Optional, foreign Model's <idField> *
								Name of field in related Model that this Model 
								refers to. This is almost always the <idField> 
								of that Model
								
			localKey		-	*Optional, default file_case alias +"_id" * 
								The field in this Model that contains the 
								foreign key value. This defaults to the 
								underbar(_) separated alias of the associated 
								model + "_id"
								
			cascade		-	*Optional, default false*
								This affects the treatment of the related model when a 
								record is deleted from this model. A value of 
								false, undefined or null will do nothing. The 
								string "null" will set null values for the
								_foreignKey_ field in the related Model.
								The string "delete" will delete the related record 
								in the related Model
								
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
		This maps a one-to-one relationship with the related Model to this 
		one. Once set, any beans returned by this manager will include a 
		function with the same name as the related model that represents the 
		result of <relatedModel>.get() for the 
		related row in the related Model. This is best shown by example
		
		(code)
		
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
/* Function: hasOne
	Sets a "hasOne" relationship with another Model.
	
	This function has 3 parameter patterns:
	
		Model Name:
			name	-	Name of model to associate
				
		Model Definition object:
			name			-	Name of model to associate
			alias			-	*Optional, default _name_*
								Name to use when attaching related beans. Using 
								different alias allows you to model multiple 
								hasOne relationships to the same Model
			conditions	-	*Optional, default null*
								"where" pattern Object to contain this association, 
								see <find>. You do NOT need this to 
								constrain by the foreign key
			foreignKey	-	*Optional, default modelname +"_id" *
								name of field in related model that refers to this model
			localKey		-	*Optional, default model's <idField> *
								This is the field in this Model that contains the 
								foreign key value. This is almost always the 
								<idField> of this Model
			cascade		-	*Optional, default false*
								This affects the treatment of the related model when a 
								record is deleted from this model. A value of 
								false, undefined or null will do nothing. The 
								string "null" will set null values for the
								_foreignKey_ field in the related Model.
								The string "delete" will delete the related record 
								in the related Model
								
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
		This maps a one-to-one relationship with the related Model to this 
		one. Once set, any beans returned by this manager will include a 
		property with the same name as the related model that represents the 
		result of <relatedModel>.get() for the 
		related row in the related Model. This is best shown by example
		
		(code)
		// --- from a FlightPath MVC app ---
		//Person Model (a DataManager.Model)
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
					localKey:Model.m2fk(relatedAlias==relatedModelName?relatedModelName:relatedAlias),
					foreignKey:thisModel.idField
				})
				thisModel.associations.belongsTo[relatedAlias] = relatedModelOptions;
			} else {
				if (relatedAlias in thisModel.associations.hasOne) {
					relatedModelOptions.setDefaultProperties(thisModel.associations.hasOne[relatedAlias])	
				}
				relatedModelOptions.setDefaultProperties({
					localKey:thisModel.idField,
					foreignKey:Model.m2fk(relatedAlias==relatedModelName?thisModel.modelName:relatedAlias)
				})
				thisModel.associations.hasOne[relatedAlias] = relatedModelOptions;
			}
			
			thisModel.__defineGetter__(relatedModelName, function() { 
				
				return $FP.getModel(relatedModelName);
				
			});
		})
	},
/* Function: hasMany
	Sets a "hasMany" relationship with another Model.
	
	This function has 3 parameter patterns:
	
		Model Name:
			name	-	Plural name of model to associate. 
						Plural Model names are the ProperCased Model name, e.g 
						profiles becomes Profiles, and user_profiles would be 
						UserProfiles
			
			(code)
				//these are equivalent
				var Person = dm.getManager("Person")
				Person.hasMany("Posts")
				Person.hasMany("posts")
				
			(end)
		
		Model Definition object:
			name			-	Plural name of model to associate.
			alias			-	*Optional, default _name_*
								Name to use when attaching related beans. Using 
								different alias allows you to model multiple 
								hasMany relationships to the same Model 
			conditions	-	*Optional, default null*
								"where" pattern Object to contain this association, 
								see <Model.find>. You do NOT need this to 
								constrain by the foreign key
			foreignKey	-	*Optional, default modelname +"_id" *
								name of field in related model that refers to this model
			localKey		-	*Optional, default model's <idField> *
								This is the field in this Model that contains the 
								foreign key value. This is almost always the 
								<idField> of this Model
			orderBy		-	*Optional, default null*
								Valid SQL order by expression. if defined, this will be used
								to order the related beans. 
			cascade		-	*Optional, default false*
								This affects the treatment of the related model when a 
								record is deleted from this model. A value of 
								false, undefined or null will do nothing. The 
								string "null" will set null values for the
								_foreignKey_ field in the related Model.
								The string "delete" will delete the related record 
								in the related Model
								
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
		This maps a one-to-many relationship with the related Model to this 
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
				
				relatedModelOptions.name =relatedModelName = Model.pm2m(relatedModelOptions.name)
				
			}
			/* convert to model name */
			else{
				relatedModelName = relatedModelOptions.name =Model.t2m(relatedModelOptions.name)
			}
			
			var relatedModelName = relatedModelOptions.name;
			var relatedAlias = relatedModelOptions.alias = relatedModelOptions.alias || relatedModelOptions.name;
			if (relatedAlias in thisModel.associations.hasMany) {
				relatedModelOptions.setDefaultProperties(thisModel.associations.hasMany[relatedAlias])	
			}
			
			
			//singular model name calculated above, like Person
			var foreignKeyName = thisModel.modelName;
			if (relatedAlias!=relatedModelOptions.name){
				//Convert plural model alias to singular, e.g. CustomWidgets to CustomWidget
				foreignKeyName = Model.t2m(Model.pm2t(relatedAlias))
			}
			relatedModelOptions.setDefaultProperties({
				localKey:thisModel.idField,
				foreignKey:Model.m2fk(foreignKeyName)
			})
			
			thisModel.associations.hasMany[relatedAlias] = relatedModelOptions;
			thisModel.__defineGetter__(relatedModelName, function() { 
				
				return $FP.getModel(relatedModelName);
				
			});
			
			
		})
	},
/* Function: hasBridgeTo
	Sets a "many-to-many" relationship with another Model.
	
	This function has 3 parameter patterns:
	
		Model Name:
			name	-	Plural name of model to associate. 
						Plural Model names are the ProperCased Model name, e.g 
						profiles becomes Profiles, and user_profiles would be 
						UserProfiles
			
			(code)
				//these are equivalent
				var Person = dm.getManager("Person")
				Person.hasBridgeTo("Tags")
				Person.hasBridgeTo("tags")
				
			(end)
		
		Model Definition object:
			name			-	Plural name of model to associate.
			alias			-	*Optional, default _name_*
								Name to use when attaching related beans. Using 
								different alias allows you to model multiple 
								hasMany relationships to the same Model 
			conditions	-	*Optional, default null*
								"where" pattern Object to contain this association, 
								see <Model.find>. You do NOT need this to 
								constrain by the foreign key
								
			bridgeModel	-	*Optional, default [relatedModel.name,thisModel.name].sort().join("")* 
								name of bridge Model. Defaults to the two Models 
								names in alphabetical order, concatenated 
						
			localBridgeKey	-	*Optional, default <idField>*
								the field in the bridge Model that stores this Model's 
								ids 
			
			foreignBridgeKey	-	*Optional, default foreign Model <idField>*
								the field in the bridge Model that stores the 
								foreign Model's ids
			
			foreignKey	-	*Optional, default modelname +"_id" *
								name of field in related model that refers to this model
			localKey		-	*Optional, default model's <idField> *
								This is the field in this Model that contains the 
								foreign key value. This is almost always the 
								<idField> of this Model
			orderBy		-	*Optional, default null*
								Valid SQL order by expression. if defined, this will be used
								to order the related beans. 
			cascade		-	*Optional, default false*
								This affects the treatment of the related model when a 
								record is deleted from this model. A value of 
								false, undefined or null will do nothing. The 
								string "null" will set null values for the
								_foreignKey_ field in the related Model.
								The string "delete" will delete the related record 
								in the related Model
								
			(code)
				var Person = dm.getManager("Person")
				Person.hasBridgeTo({
					name:"Tags",
					alias:"RecentTags",
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
				Person.hasBridgeTo([{
					name:"Tags",
					alias:"RecentTags",
					conditions:{
						where:"published = 1 and modified > {oneYearAgo:date}",
						oneYearAgo:new Date().add(Date.YEAR,-1).clearTime()
					},
					orderBy:"category_title ASC, date_published DESC"
				},{
					name:"Tags",
					orderBy:"category_title ASC, date_published DESC"
				}])
			(end)
	
	Detail:
		This maps a many-to-many relationship with the related Model to this 
		one. This requires a "bridge" Model i.e a Model that maps the 
		<idField> of both Models. Once defined, any beans returned by 
		this manager will include a  function with the same name as the 
		related alias that represents the 
		result of <relatedModel>.findBeans(), constrained by the foreign key 
		relationship. This is best shown by example
		
		(code)
		// --- from a FlightPath MVC app ---
		//Person Model
		function init(){
			this.hasMany("Tags")
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
		<@loop array="person.Tags()" element="tag" index="i">
			<li> <%=tag.title%>	
		</@loop>
		</ul>
		
		(end)
		
		
	*/
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
				relatedModelOptions.name =relatedModelName = Model.pm2m(relatedModelOptions.name)
				
			}
			thisModel.__defineGetter__(relatedModelName, function() { 
				
				return $FP.getModel(relatedModelName);
				
			});

			thisModel.associations.hasBridgeTo[relatedAlias] = relatedModelOptions;
			
			
		})
	},
	queryCol:function queryCol(name,pattern,options){
		var result = this.query(pattern,options);
		return result.valueArray(name);
	},
	
	queryValue:function queryValue(pattern,options){
		var result = this.query(pattern,options);
		if (result.length){
			return result[0][result.columns[0]]	
		} else return undefined
	}
	
}

/* Function: validation.validatorFunctions.unique
	Custom validator that validates a value is unique in a field
		
	Parameters:
		caseSensitive			-	*Optional, default false*
										Set to true for exact matches. Only applies to 
										character fields
		
	Detail: 
		This will search all instance of this model looking for any 
		instances of this value, NOT associated with this idProperty. If 
		any are found this validator will add an error     
	
	Examples:
	(code)
		this.addValidators({
			name:{
				required:{},
			
			},
			slug:{
				required:{},
				unique:{},//slug must be unique in the table, regardless of case
				regex:{
					pattern:/^[a-z0-9-]+$/,
					message:"Can only contain numbers, lowercase letters, '_' or '-'"
				}
	
			},
		})
		//OR
		this.addValidator("slug","unique")
	(end)
		
	See:
		* <addValidator>
	*/

/* Class: beanClass
	A model's bean class
	*/
	Model.prototype.beanClass = function(data,model){
		this.model = model
		var $this = this;
		this.data = data;
		this.data.getKeys().forEach(function(prop){
			$this["get_"+prop]=function(){
				return this.data[prop]
			}
			$this["set_"+prop]=function(value){
				return this.saveField(prop,value);
			}
			if (!(prop in $this)){
				Object.defineProperty(
					$this, 
					prop, 
					{
						get:$this["get_" + prop],  
						enumerable: true,  
						configurable: true
					}
				); 
			}
		})    
		Object.defineProperty(
			$this, 
			"id", 
			{
				get:$this["get_" + model.idField],  
				enumerable: true,  
				configurable: true
			}
		); 
		Object.defineProperty(
			$this, 
			"data", 
			{
				value:data,
				writeable:true,
				enumerable: false,  
				configurable: false
			}
		);
		$this.exists = false;
		$this.isDirty= false;
		$this.deferred = false;
		Object.defineProperty(
			$this, 
			"model", 
			{
				value:model,
				writeable:false,
				enumerable: false,  
				configurable: false
			}
		);
	
		Object.defineProperty(
			$this, 
			"_loadedAliases", 
			{
				value:{},
				writeable:false,
				enumerable: false,  
				configurable: false
			}
		);
		
		//$this.setDefaultProperties(model)
		[
			"associations",
			"fieldNames"
			
		].forEach(function(prop){
			Object.defineProperty(
				$this, 
				prop, 
				{
					value:model[prop],  
					enumerable: false,  
					configurable: false
				}
			);
			
		})
		
		//build associations
		model.associations.forEach(function(models,type){
			if (type=="belongsTo") type="hasOne";
			//if(type == "hasOne" || type == "hasMany")
			models.forEach(function(options,alias){
				$this[alias] = function(conditions){
					if (!options){
						Myna.abort("fail")	
					}
					if (conditions){
						if (options.conditions){
							conditions.forEach(function(option,prop){
								if (prop=="where"){
									options.conditions.where += " and " + conditions.where +" ";
								}else{
									options.conditions[prop] = conditions[prop];
								}
							})
						} else {
							options.conditions = conditions;
						}
					}
					var relatedBean = Model.getRelated($this,alias,type,options.toJson().parseJson());
					this[alias] =function(){return relatedBean}
					return this[alias]()
				}
			})
		})
	}

/* Property: exists
	true if this bean exists in the Model

	*/

/* Property: model
	The <Model> that created this bean

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
		<Model.get>
		<Model.getNew>

	*/

/* Property: data
	a simple JS object containing this bean's data 

	*/
/* Property: id
	The value of the primary key of this bean

	*/
/* Property: fieldNames
	The fieldNames for this bean
	*/

/* Function: get_<fieldName>
	gets a value for <fieldName>
	
	Detail:
		This function is generated for every column in the 
		associated table.

	*/
/* Function: set_<fieldName>
	sets a value for <fieldName>
	
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
		call the corresponding "set" function, if available. Properties that do 
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
		useful when overriding the generated "set" function. This will not 
		actually persist its value if <deferred> is true 
	*/
	
/* Function: forceDelete
	alias for <Model.forceDelete>, which passes this bean's id 
	*/
	
/* Function: getData
	return a structure of this bean's data
	
	Parameters:
		depth	-	*Optional, default 1* 
					Number of levels of related beans to include in 
					this data. Set this to 0 to only include this bean's data
	
	Detail: 
	This is a copy of the data, so it will not change when 
	the object is modified
	*/
	
/* Function: getLabel
	alias for <Model.getLabel>
	*/
	
/* Function: remove
	alias for <Model.remove>, which passes this bean's id 
	*/
	
/* Function: save
	Saves a deferred bean and returns a <Myna.ValidationResult> object 
	
	If called against a <deferred> BeanObject, all values in <data> are 
	persisted to the database. Afterwards, this bean's <deferred> status is 
	set to the Model's <deferred> status 
	
	*/
	
/* Function: validate
	Validates this bean.
	
	Calls all of the validator functions added via <Model.addValidator> 
	against this bean and returns the merged <Myna.ValidationResult> object
		
	Parameters:
		fieldName	-	*Optional, default null*
						If defined, limits validation to a single column
	See:
		* <Model.addValidator>
		* <Model.validation>
		* <Myna.Validation>
		
	*/
			
		

Model.prototype.beanClass.prototype = {
	save:function save(){
		var $this = this;
		if (!this.deferred) return new Myna.ValidationResult();
		var v = this.validate()
		if (v.success){
			try{
				//first save/create parent objects
				this.model.associations.belongsTo.forEach(function(relatedModelOptions,alias){
					var relatedValidation = $this[alias]().save()
					v.merge(relatedValidation,alias +".");
				})
				var bean =this.model.create(this.data)
				
				bean.applyTo(this,true);
				this.isDirty = false;
				this.exists=true
				var localBean = this;
				this._loadedAliases.forEach(function(relatedBean,alias){
					//already handled parents
					if (alias in $this.model.associations.belongsTo) return;
					
					if (relatedBean instanceof Array){
						relatedBean.forEach(function(bean){
							var relatedValidation = bean.save()
							v.merge(relatedValidation,alias +"."+bean.id +".");
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
			return this.model.saveBean(this)
		} else return v 
	},
	saveField:function(name,value){
		if (value != this.data[name]){
			this.isDirty = true;
			var oldVal = this.data[name] 
			this.data[name]=value;
			var v = this.validate(name);
			if (!this.deferred) {
				if (v.success){
					v = this.model.saveBeanField(this,name,oldval,newval)
				} 
			}
			return v
		} else return new Myna.ValidationResult()
	},
	setFields:function(values){
		var result = new Myna.ValidationResult()
		if (!values || typeof values != "object") return result;
		var $this=this;
		values.forEach(function(v,k){
			result.merge($this.saveField(k,v))
		})
		return result
	},
	forceDelete:function forceDelete(id){Model.notImplemented(arguments.callee.name)},
	
	getLabel:function getLabel(colname){
		return this.model.getLabel(colname)
	},
	getData:function getData(depth){
		var bean=this;
		var result ={}
		result.setDefaultProperties(this.data)
		//for backwards compatibility
			if (depth === true) depth =0
			if (depth === undefined) depth=1
		if (depth){
			this.model.associations.forEach(function(aliases,type){
				aliases.forEach(function(relatedModelOptions,alias){
					if (bean[alias]() instanceof Array){
						result[alias] = bean[alias]().map(function(relatedBean){
							return relatedBean.getData(depth-1);
						})
					}else{
						result[alias] = bean[alias]().getData(depth-1)
					}
				})
			})
		}
		return result;
	},
	
	remove:function remove(id){
		return this.model.remove(this.id)
	},
	
	validate:function validate(fieldName){
		return this.model.validation.validate(this.data,fieldName)
	},
	toJSON:function toJSON(){
		return this.getData()
	},
}
	








