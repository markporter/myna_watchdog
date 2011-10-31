if (!Myna) var Myna={}

/* Class: Myna.Validation
		
		Example:
		(code)
		
		(end)
		
*/
/* Constructor: Myna.Validation
	Constructs a Validation Object 
	
	
	
	*/
	Myna.Validation = function(){
		this.validators={}
		this.labels={}
	}
	
	
	Myna.Validation.prototype.validatorFunctions={
		type:function type(obj,property,label,value,options){
			var v = new Myna.ValidationResult();
			if (value === null || value===undefined) return v;
			if (!options) throw new Error(" type validator requires 'type' option")
			if (typeof options == "string") options = {type:options}
			
			var type = typeof options.type =="function"?options.type.apply(this, Array.parse(arguments)):options.type;
			var msg = options.message||'{0} must be of type "{1}"'.format(label,type)
			switch(type){
				
				case "string":
					if (String(value) == value) return v
				case "numeric":
					if (parseFloat(value) == value) return v
				case "date":
					if (value instanceof Date) return v
				case "binary":
					if (value instanceof Array){
						try{
							if (value.getClass().getName() == "[B") return v
						} catch(e){}
					}
				case "array":
					if (value instanceof Array){
						return v	
					}
					break;
				case "function":
					if (typeof obj == "function"){
						return v	
					}
					break;
				case "struct":
					if (value && typeof value == "object"){
						return v;	
					}
					break;
				default:
					v.addError(msg,property)
			}
			return v;
		},
		length:function length(obj,property,label,value,options){
			var v = new Myna.ValidationResult();
			if (value === null || value===undefined) return v;
			var msg = options.message
			var min = typeof options.min =="function"?options.min.apply(options, Array.parse(arguments)):options.min;
			var max = typeof options.max =="function"?options.max.apply(options, Array.parse(arguments)):options.max;
			
			var hasLength = ("length" in value) && value.length;
			
			if (max && hasLength && value.length > max){
				
				v.addError(msg ||
					'Exceeded maximum length for {label} ({max}) by {diff}'.format({
						label:label,
						max:max,
						diff: String(bean.data[property]).length-max
					}),
					property
				)
			}
			if (min && (!hasLength || value.length < min)){
				v.addError(msg ||
					'{label} must be at least {min} long'.format({
						label:label,
						min:min
					}),
					property
				)
				
			}
			return v
		},
		value:function length(obj,property,label,value,options){
			var v = new Myna.ValidationResult();
			if (value === null || value===undefined) return v;
			var msg = options.message
			var min = typeof options.min =="function"?options.min.apply(options, Array.parse(arguments)):options.min;
			var max = typeof options.max =="function"?options.max.apply(options, Array.parse(arguments)):options.max;
			
			
			
			if (max && value && value > max){
				
				v.addError(msg ||
					'{label} must be less than {max}'.format({
						label:label,
						max:max
					}),
					property
				)
			}
			if (min && value && value < min){
				v.addError(msg ||
					'{label} must be at least {min}'.format({
						label:label,
						min:min
					}),
					property
				)
				
			}
			return v
		},
		regex:function regex(obj,property,label,value,options){
			var v = new Myna.ValidationResult();
			if (value === null || value===undefined) return v;
			if (options instanceof RegExp) options = {pattern:options}
			if (!options.pattern) throw new Error("option 'pattern' is required for the regex validator");
			var msg= options.message|| label +" is not properly formatted."
			if (!options.pattern.test(String(value))) v.addError(msg,property);
			return v
		},
		list:function list(obj,property,label,value,options){
			var v = new Myna.ValidationResult();
			if (value === null || value===undefined) return v;
			var oneOf = typeof options.oneOf =="function"?options.oneOf.apply(options, Array.parse(arguments)):options.oneOf;
			var notOneOf = typeof options.notOneOf =="function"?options.notOneOf.apply(options, Array.parse(arguments)):options.notOneOf;
			if (oneOf && oneOf.length){
				var msg= options.message|| "{0} must be {1} '{2}'".format(label,oneOf.length>1?"one of ":"",oneOf.join())
				
				if (options.exact){
					if (oneOf.indexOf(value) == -1) v.addError(msg,property);
				} else if (options.caseSensitive){
					if (!oneOf.contains(value)) v.addError(msg,property);
				} else {
					if (!oneOf.join().listContainsNoCase(value)) v.addError(msg,property);
				}
			} else if (notOneOf && notOneOf.length){
				msg= options.message|| "{0} must NOT be {1} '{2}'".format(label,notOneOf.length>1?"one of ":"",notOneOf.join())
				if (options.exact){
					if (notOneOf.indexOf(value) != -1) v.addError(msg,property);
				} else if (options.caseSensitive){
					if (notOneOf.contains(value)) v.addError(msg,property);
				} else {
					if (notOneOf.join().listContainsNoCase(value)) v.addError(msg,property);
				}
			}
			return v;
		},
		
		required:function required(obj,property,label,value,options){
			var v = new Myna.ValidationResult();
			if (typeof options != "object") options={}
			var msg= options.message|| label +" is required."
			if (!value && value != 0 && value !== false){
				v.addError(msg,property);
			}
			return v
		},
	}
	
	Myna.Validation.prototype.clone=function(){
		var result = new Myna.Validation();
		var p;
		for (p in this.validatators){
			result.validators[p] = this.validators[p]	
		}
		for (p in this.labels){
			result.labels[p] = this.labels[p]	
		}
		for (p in this.validatorFunctions){
			result.validatorFunctions[p] = this.validatorFunctions[p]	
		}
		return result
	}
/* Function: addValidator
	adds a validation function to this manager
	
	Parameters:
		property		-	property to validate. If this is set to null, then this 
							validator will be called for every property
							
		validator	-	Either a String or a validation function. If this is 
							a string, it must match one of the standard 
							validation functions stored in <validatorFunctions>.
							This function will be called when needed to validate 
							_property_ See *Validator Function* below
							
		options		-	*Optional, default undefined*
							any options needed by the validator
							

						
	Validator Function:
	The _validator_ function  will be called with these parameters
		obj			-	Object being validated
		property		-	Property being validated
		label			-	result of <getLabel> for _property_
		value			-	value being validated
		options		-	validator options
	
	Examples:
	
	(code)
		manager.addValidator("first_name","length",{
			min:3,
			max:25
		})
		
		function isBob(obj,property,label,value,options){
			var vr = new Myna.ValidationResult();
			if (value != "Bob"){
				var msg = options.message || label + " is not Bob!"
				vr.addError(msg,colname)
			}
			return vr;
		}
		
		manager.addValidator("first_name",isBob,{
			message:"Inferior name entered."
		})
		
	(end)
	*/
		
	Myna.Validation.prototype.addValidator=function addValidator(property,validator,options){
		if (!options) options ={}
		if (!this.validators) this.validators={}
		if (!property) property ="$ALL";
		if (!(property in this.validators)) this.validators[property]=[];
		if (typeof validator === "string"){
			if (validator == "required") options.validateWhenNull = true;
			if (validator in this.validatorFunctions 
				&& typeof this.validatorFunctions[validator] === "function"
			){
				validator = this.validatorFunctions[validator]
			} else throw new  Error(validator + " is not a validation function")
		}
		
		this.validators[property].push({
			validator:validator,
			options:options
		})
							
	}
/* Function: addValidators
	add multiple validators
	
	Parameters:
		validator_config		-	JS Object keyed by property name, with sub-objects
										keyed by validator name (or "custom" for custom validators),
										with values equal to validator options (or {}, if no options)
										
	Example:
		var v = new Myna.Validation()
		v.addValidators({
			name:{
				required:{},
				type:"string",
				regex:{
					pattern:/^[A-Za-z ]+$/,
					message:"Names must only contain Letters and spaces"
				},
				
			},
			dob:{
				type:"date",
				value:{
					min:new Date().add(Date.YEAR,-150),
					max:new Date()
				}
			},
			children:{
				type:"array",
				length:{
					max:12
				},
				custom:function(obj,property,label,value,options){
					var vr = new Myna.ValidationResult();
						value.forEach(function(child,index){
							vr.merge(this.validate(child),"child_" + index "_")	
						})
						
					return vr;
				}
			}
		})
	*/
	Myna.Validation.prototype.addValidators=function addValidators(validator_config){
		var $this = this;
		for (var p in validator_config){
			if (validator_config.hasOwnProperty(p)){
				var property  =p;
				var vDef = validator_config[p];
				for (p in vDef){
					var validator = p
					var options = vDef[p]
					if (p == "custom") {
						validator = options;
						options={}
					}
					$this.addValidator(property,validator,options)
				}
			}
		}
	}
/* Function: genLabel
	generates a display label from a property name
	
	The default implementation either uses one of the special replacements below, 
	or replaces all underbars with spaces, inserts spaces befor Capital letters,  a
	nd calls <String.titleCap> on the result. You can override this function in 
	Validation instances for custom behavior. Used internally to generate labels 
	for validation errors
	
	Special Replacements:
	id		-	ID
	
	Example:
	(code)
		//Let's say your properties start with "htc" but that's not really part of 
		//the the property name
		
		var v = new Myna.Validation()
		
		//let's override via a function chain
		v.before("genLabel",function(property){
			var chain = arguments.callee.chain
			var test;
			if (property && (test = property.match(/^htc(.*)$/))){
				chain.args[0] =test[1]
			}
		})
		
		//Or you can override via prototype callback
		v.genLabel =function(property){
			if (property && (test = property.match(/^htc(.*)$/))){
				property =test[1]
			}
			Myna.Validation.prototype.genLabel.call(this,property)
		}
		
		//Or maybe you already have a label generator
		v.genLabel = MyObj.genLabel.bind(MyObj)
	(end)
	*/	
	Myna.Validation.prototype.genLabel=function genLabel(property){
		var sr={
			id:"ID"	
		}
		if (property in sr) return sr[property]
		property = property.splitCap().join("_").toLowerCase()
		return property.split(/_/).map(function(part){
			if (sr.getKeys().indexOf(part) >-1) return sr[part]
			return part.titleCap()
		}).join(" ")
	}
/* Function: getLabel
	returns the display label for a property name
	
	Parameters:
		colname		-	lowercase name of property to retrieve a label for
		
	If an explicit label for this property has been set via <setLabel>, that is 
	returned. Otherwise, the result of <genLabel> is returned
	
	*/	
	Myna.Validation.prototype.getLabel=function getLabel(property){
		return this.labels[property]||this.genLabel(property);
	}
/* Function: setLabel
	sets an explicit display label for a property
	
	Parameters:
		colname		-	column name to map
		label			-	label so set
	*/
	Myna.Validation.prototype.setLabel=function setLabel(property,label){
		this.labels[property] = label;
	}
/* Function: setLabels
	sets an explicit display label for multiple properties at once
	
	Parameters:
		map		-	JS object where the keys are column names and the values are 
						labels 
	*/
	Myna.Validation.prototype.setLabels=function setLabels(map){
		var $this = this
		map.forEach(function(v,k){
			$this.setLabel(k,v)
		})
	}
/* Function: validate
	Validates an object against this Validation.
	
	Parameters:
		obj		-	object to validate
		property	-	*Optional, default null*
						If defined, limits validation to a single property
	
	Calls all of the validator functions added via <addValidator> 
	against an object and returns the merged <ValidationResult> object
	
	Example:
	(code)
		var v = new Myna.Validation()
		
		
		//set some label overrides:
		v.setLabels({
			dob:"Date of Birth",
			children:"Dependents"
		})
		
		//add multiple validators at once
		v.addValidators({
			name:{
				required:true,
				type:"string",
				regex:{
					pattern:/^[A-Za-z ]+$/,
					message:"Names must only contain Letters and spaces"
				}
			},
			startDate:{
				value:{
					min:new Date().add(Date.YEAR,-50),
					max:new Date().add(Date.DAY,-1)
				}
			},
			dob:{
				type:"date",
				value:{
					min:new Date().add(Date.YEAR,-150),
					max:new Date()
				}
			},
			children:{
				type:"array",
				length:{
					max:12
				}
			}
		})
		
		
		// cloning Validation for children
		var cv = v.clone()
		//addinf child specific validators
		cv.addValidators({
			relationship:{
				required:true,
				type:"string",
				regex:{
					pattern:/^(son|daughter)$/i,
					message:'Relationship must be "Son" or "Daughter"'
				}
			}
		})
		// adding a single custom validator to test the children array members
		v.addValidator("children",function(obj,property,label,value,options){
			var vr = new Myna.ValidationResult()
			
			value.forEach(function(child,index){
				var prefix ="child[{1}].".format(name,index)
				vr.merge(cv.validate(child),prefix)
			})
			
			return vr;
		})
		
		//finally, let's validate:
		var vr = v.validate({
			dob:"yesterday",
			startDate:new Date(),
			children:[{
				name:"sally",
				relationship:"pet"
			}]
		})
		
		Myna.printDump(vr)
		// Prints:
		// [ Object ]
		//   +-[errorDetail] 
		//   +-[errorMessage] 
		//   +-[errors] [ Object ]
		//   | +-[child[0].relationship] Relationship must be "Son" or "Daughter"
		//   | \-[name] Name is required.
		//   | \-[startDate] Start Date must be less than Sat Oct 29 2011 09:27:37 GMT-0600 (MDT)
		//   \-[success] false
	(end)
	
	See:
		* <addValidator>
		* <addValidators>
		
	*/
	Myna.Validation.prototype.validate=function(obj,property){
		var vr = new Myna.ValidationResult()
		var $this = this
		var validateProperty = function(property,value){
			var label = $this.getLabel(property)
			var args= [obj,property,label,value]
			function shouldRun(obj){
				if (typeof obj.when ==="function" && !obj.when(property,value,obj)) return false;
				if (typeof obj.unless ==="function" && obj.unless(property,value,obj)) return false;
				//if (!obj.validateWhenNull && value === null) return false;
				return true;
			}
			try{
				if (property in $this.validators){
					$this.validators[property].filter(shouldRun).forEach(function(obj){
						vr.merge(obj.validator.call(this,obj,property,label,value,obj.options))
					})
				}
				if ("$ALL" in $this.validators){
					$this.validators.$ALL.filter(shouldRun).forEach(function(obj){
						vr.merge(obj.validator.call(this, obj,property,label,value,obj.options))
					})
				}
			}catch(e){
				vr.addError("Error in validation. See Administrator log for details",property)
				Myna.log(
					"error",
					"Error in validation for " + property,
					Myna.formatError(e) +Myna.dump(obj.data,"Obj Data")
				);
			}
		}
		
		if (property && property in $this.validators) {
			validateProperty(property,obj[property])
		} else {
			var properties=[]
			for (property in obj){
				if (obj.hasOwnProperty(property)){
					properties.appendUnique(property)
				}
			}
			for (property in $this.validators){
				if ($this.validators.hasOwnProperty(property)){
					properties.appendUnique(property)
				}
			}
			properties.forEach(function(property){
				validateProperty(property,obj[property])
			})
			
		}
		return vr
	}