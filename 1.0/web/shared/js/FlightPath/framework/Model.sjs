/* Class: Model
	base model class. 
*/
function Model(){
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
	
	if (!this.fields) this.fields={}
	if (!this.fieldNames) this.fieldNames=[]
}

Model.validatorFunctions={
	type:function type(colname,value,v,bean){
		this.checkRequired(["type"])
		var label = bean.model.getLabel(colname);
		var type = typeof this.type =="function"?this.type(colname,value,v,bean):this.type;
		var msg = this.message||<ejs>
			<%=label%> must be of type "<%=type%>"
		</ejs>
		switch(type){
			case "string":
				if (String(value) == value) return  
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
	length:function length(colname,value,v,bean){
		var colDef = bean.model.table.columns[colname]
		var msg = this.message
		var min = typeof this.min =="function"?this.min(colname,value,v,bean):this.min;
		var max = typeof this.max =="function"?this.max(colname,value,v,bean):this.max;
		if (Myna.Database.dbTypeToJs(colDef.data_type) == "string"){
			if (max){
				if (String(value).length > max){
					
					v.addError(msg ||
						<ejs>
							Exceeded maximum length for <%=bean.model.getLabel(colname)%> (<%=max%>), 
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
							<%=bean.model.getLabel(colname)%> 
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
							Exceeded maximum length for <%=bean.model.getLabel(colname)%> (<%=max%>), 
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
							<%=bean.model.getLabel(colname)%> 
							must be at least <%=String(bean.data[colname]).length-min%> long
						</ejs>,
						colname
					)
				}
			}
		}
	},
	regex:function regex(colname,value,v,bean){
		this.checkRequired(["regex"])
		var msg= this.message|| bean.model.getLabel(colname) +" is not properly formatted."
		if (!this.regex.test(String(value))) v.addError(msg,colname);
	},
	list:function list(colname,value,v,bean){
		var oneOf = typeof this.oneOf =="function"?this.oneOf(colname,value,v,bean):this.oneOf;
		var notOneOf = typeof this.notOneOf =="function"?this.notOneOf(colname,value,v,bean):this.notOneOf;
		if (oneOf && oneOf.length){
			var msg= this.message|| bean.model.getLabel(colname) 
						+" must be "+(oneOf.length>1?"one of ":"")+"'" + oneOf.join()+"'"
			if (this.exact){
				if (oneOf.indexOf(value) == -1) v.addError(msg,colname);
			} else if (this.caseSensitive){
				if (!oneOf.contains(value)) v.addError(msg,colname);
			} else {
				if (!oneOf.join().listContainsNoCase(value)) v.addError(msg,colname);
			}
		} else if (notOneOf && notOneOf.length){
			msg= this.message|| bean.model.getLabel(colname) 
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
	unique:function unique(colname,value,v,bean){
		var msg= this.message|| bean.model.getLabel(colname) +" ("+value+"), already exists in another record."
		var search ={}
		search[colname] = value
		
		var result = bean.model.find(search,this)
		if (result.length){
			if (colname == bean.model.idField && !bean.exists) return v.addError(msg,colname);
			if (bean.exists ){
				if (result.length > 1 || result[0] != bean.id)
				return v.addError(msg,colname);
			}
		}
	},
	required:function required(colname,value,v,bean){
		var msg= this.message|| bean.model.getLabel(colname) +" is required."
		if (!value && value != 0 && value !== false){
			v.addError(msg,colname);
		}
	},
}
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
			var result =this.splitCap(name)
			
			result.push(Myna.Inflector.pluralize(result.pop()))
			
			return result.join("_")
			
		}
	/* modelname-to-plural-modelname */
		Model.m2pm=function(name){
			var result = this.splitCap(name)
			result.push(Myna.Inflector.pluralize(result.pop()))
			
			return result.map(function(part){
				return part.titleCap()
			}).join("")
			
		}
	/* plural-modelname-to-modelname */
		Model.pm2m=function(name){
			var result = this.splitCap(name)
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
			var result = this.splitCap(name)
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
Model.prototype={
/* Properties */
	name:"",
	model:null,
	idField:"",
//These must be implemented by the extending class
	create:function create(requiredFields){Model.notImplemented(arguments.callee.name)},
	forceDelete:function forceDelete(id){Model.notImplemented(arguments.callee.name)},
	saveBeanField:function saveBeanField(bean,fieldName,newval){Model.notImplemented(arguments.callee.name)},
	query:function query(pattern,options){Model.notImplemented(arguments.callee.name)},
/* Methods */

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
					b=new Myna.File($FP.dir,"framework/behaviors/models",$FP.c2f(name)+".sjs")
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
		genKey:function genKey(){
			return "";
		},
		getField:function getField(name){
			return {
				name:name,
				type:this.getType(name),
				label:this.getLabel(name),
				defaultValue:this.getDefault(name)
			}
			
		},
		getFields:function getFields(){
			var $this= this;
			return this.fieldNames.reduce(function(obj,name){
				obj[name] = $this.getField(name)
				return obj
			},{})
		},
		getType:function getType(name){
			return this._types[name]
		},
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
		},
		addFields:function addFields(fields){
			var $this = this;
			fields.forEach(function(def){
				$this.addField(def)
			})
		},
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
		getDefault:function getDefault(colname){
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
		remove:function remove(id){
			return this.forceDelete(id)
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
		setFields:function setFields(bean,fields){
			var $this = this;
			fields.forEach(function(v,k){
				$this.saveField(bean,k,v)
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
		get:function get(values){
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
						localKey:Model.m2fk(relatedAlias==relatedModelName?relatedModelName:relatedAlias),
						foreignKey:thisModel.primaryKey
					})
					thisModel.associations.belongsTo[relatedAlias] = relatedModelOptions;
				} else {
					if (relatedAlias in thisModel.associations.hasOne) {
						relatedModelOptions.setDefaultProperties(thisModel.associations.hasOne[relatedAlias])	
					}
					relatedModelOptions.setDefaultProperties({
						localKey:thisModel.primaryKey,
						foreignKey:Model.m2fk(relatedAlias==relatedModelName?thisModel.modelName:relatedAlias)
					})
					thisModel.associations.hasOne[relatedAlias] = relatedModelOptions;
				}
				
				thisModel.__defineGetter__(relatedModelName, function() { 
					
					return $FP.getModel(relatedModelName);
					
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
					localKey:thisModel.primaryKey,
					foreignKey:Model.m2fk(foreignKeyName)
				})
				
				thisModel.associations.hasMany[relatedAlias] = relatedModelOptions;
				thisModel.__defineGetter__(relatedModelName, function() { 
					
					return $FP.getModel(relatedModelName);
					
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
					relatedModelOptions.name =relatedModelName = Model.pm2m(relatedModelOptions.name)
					
				}
				thisModel.__defineGetter__(relatedModelName, function() { 
					
					return $FP.getModel(relatedModelName);
					
				});
	
				thisModel.associations.hasBridgeTo[relatedAlias] = relatedModelOptions;
				
				
			})
		},
		queryCol:function queryCol(pattern,options){
			var result = this.query(pattern,options);
			return result.valueArray(result.columns[0]);
		},
		queryValue:function queryValue(pattern,options){
			var result = this.query(pattern,options);
			if (result.length){
				return result[0][result.columns[0]]	
			} else return undefined
		},
		
}
	
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
			this.data[name]=value;
			var v = this.validate(name);
			if (!this.deferred) {
				if (v.success){
					v = this.model.saveBeanField(this,name,model)
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
	getData:function getData(onelevel){
		var bean=this;
		var result ={}
		result.setDefaultProperties(this.data)
		
		if (!onelevel){
			this.model.associations.forEach(function(aliases,type){
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
	
	remove:function remove(id){
		return this.model.remove(this.id)
	},
	
	validate:function validate(colname){
		var v = new Myna.ValidationResult()
		var fieldList = colname?[colname]:this.model.fieldNames
		var model = this.model
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
				if (colname in model._validators){
					model._validators[colname].filter(shouldRun).forEach(function(obj){
						obj.validator(colname,value,v,bean)
					})
				}
				if ("ALL" in model._validators){
					model._validators.ALL.filter(shouldRun).forEach(function(obj){
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
	toJSON:function toJSON(){
		return this.getData()
	},
}
	








