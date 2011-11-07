if (!Myna) var Myna={}

/* Class: Myna.Validation
		A store for validation functions that can be used to validate objects
		
		See: <validate>
		
*/
/* Constructor: Myna.Validation
	Constructs a Validation Object 
	
	
	
	*/
	Myna.Validation = function(){
		this.validators={}
		this.labels={}
	}
	
	
	
/* Function: clone
	makes a copy of this Validation object, including validators, labels, and 
	any custom validatorFunctions
	
	
	*/
	Myna.Validation.prototype.clone=function(){
		var result = new Myna.Validation();
		var p;
		for (p in this.validators){
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
		var v = new Myna.Validation()
		v.addValidator("first_name","length",{
			min:3,
			max:25
		})
		
		//only validate spouse_name when married is true
		v.addValidator("spouse_name","required",{
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
		
		v.addValidator("first_name",isBob,{
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
			if (validator in this.validatorFunctions 
				&& typeof this.validatorFunctions[validator] === "function"
			){
				validator = this.validatorFunctions[validator]
			} else throw new  Error(validator + " is not a validation function")
		}
		
		this.validators[property].push({
			property:property,
			validator:validator,
			options:options
		})
		return this;		
	}
/* Function: addValidators
	add multiple validators
	
	Parameters:
		validator_config		-	JS Object keyed by property name, with sub-objects
										keyed by validator name (or "custom" for custom validators),
										with values equal to validator options (or {}, if no options)
			
	Returns:
		this validation instance 
		
	Example:
	(code)
		var v = new Myna.Validation()
		v.addValidators({
			name:{
				required:{},
				type:"string",
				regex:{
					pattern:/^[A-Za-z ]+$/,
					message:"Names must only contain Letters and spaces"
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
				},
				custom:function(params){
					var vr = new Myna.ValidationResult();
						params.value.forEach(function(child,index){
							vr.merge(this.validate(child),"child_" + index "_")	
						})
						
					return vr;
				}
			}
		})
	(end)
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
		return this
	}
/* Function: removeValidator
	removes all validators for a property and optionally by == validator type
	
	Parameters:
		property		-	name of property to modify
		validator	-	*Optional, default null*
							If defined, this can be either a string or a function 
							reference representing the specific validator to remove
							
		if _validator_ is undefined, then all validators for the property are removed
			
	Returns:
		this validation instance 
		
	Example:
	(code)
		
		v.addValidators({
			name:{
				required:{},
				type:"string",
				regex:{
					pattern:/^[A-Za-z ]+$/,
					message:"Names must only contain Letters and spaces"
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
				},
				custom:function(params){
					var vr = new Myna.ValidationResult();
						params.value.forEach(function(child,index){
							vr.merge(this.validate(child),"child_" + index "_")	
						})
						
					return vr;
				}
			}
		})
		// cloning Validation for children
		var cv = v.clone()
		cv.removeValidator("children")//children don't have children
		//add in child specific validators
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
		v.addValidator("children",function(params){
			Myna.printDump(params)
			var vr = new Myna.ValidationResult()
			
			params.value.forEach(function(child,index){
				var prefix ="child[{1}].".format(name,index)
				vr.merge(cv.validate(child),prefix)
			})
			
			return vr;
		})
	(end)
	*/
	Myna.Validation.prototype.removeValidator=function removeValidator(property, validator){
		if (! (property in this.validators)) return this
		if (validator){
			if (typeof validator === "string"){
				if (validator in this.validatorFunctions 
					&& typeof this.validatorFunctions[validator] === "function"
				){
					validator = this.validatorFunctions[validator]
				} else throw new  Error(validator + " is not a validation function")
			}	
			this.validators[property] =this.validators[property].filter(function(def){
				return def.validator != validator
			}) 
		} else this.validators[property] = []
		return this
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
			if (part in sr ) return sr[part]
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
		label			-	label to set
		
	Returns:
		this instance
	*/
	Myna.Validation.prototype.setLabel=function setLabel(property,label){
		this.labels[property] = label;
		return this
	}
/* Function: setLabels
	sets an explicit display label for multiple properties at once
	
	Parameters:
		map		-	JS object where the keys are column names and the values are 
						labels 
	Returns:
		this instance
	*/
	Myna.Validation.prototype.setLabels=function setLabels(map){
		var $this = this
		map.forEach(function(v,k){
			$this.setLabel(k,v)
		})
		return this
	}
/* Function: toCode
	returns this Validation object as Javascript source-code
	
	Detail:
		Myna.Validation and <Myna.ValidationResult> are designed to be used 
		client-side as well as server-side. This function returns the JS code
		necessary to represent this Validation object in client-side JS.
		
	Notes:
		* The Myna client-side libraries must be loaded:
		> <script src="<context_root>/shared/js/libOO/client.sjs"></script>
		* Any custom validators that depend on external properties will fail 
			because those objects won't exist in the browser. See examples for work 
			arounds.
			
	Examples:
	(code)
	// Complex validation with embedded custom validation:
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
			},
			custom:function(params){
				var v = new Myna.ValidationResult()
				//don't run client side
				if (typeof $server_gateway != "undefined"){
					var existing new Myna.Query({
						ds:ds,
						sql:<ejs>
							select 
								name 
							from names
							where name = {value} 
						</ejs>,
						values:params
					})
					if (existing.data.length) {
						v. addError(
							"{0} '{1}' already exists".format(params.label,params.value),
							params.property
						)
					}
				}
				
				return v
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
			},
			custom:function(params){
				// cloning Validation for children
				var cv = this.clone()
				cv.removeValidator("children")//children don't have children
				//add in child specific validators
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
				
				var vr = new Myna.ValidationResult()
				
				params.value.forEach(function(child,index){
					var prefix ="child[{1}].".format(name,index)
					var v = cv.validate(child)
					//console.log(v)
					vr.merge(v,prefix)
				})
				
				return vr;
			}
		}
	})
	
	Myna.print(<ejs>
		<script src="<%=$server.rootUrl%>shared/js/libOO/client.sjs"></script>
		<script>
			var v =<%=v.toCode()%>)
			var vr = v.validate({
				dob:"yesterday",
				startDate:new Date(),
				children:[{
					name:"sally",
					relationship:"pet"
				}]
			})
			debug_window(vr)
		</script>
	</ejs>)
	(end)
	*/
	Myna.Validation.prototype.toCode=function(){
		if (typeof $server_gateway != "undefined"){
			var code = this.toSource()
			return "$O({0}).applyTo(new Myna.Validation(),true)".format(code);
		}
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
		v.addValidator("children",function(params){
			var vr = new Myna.ValidationResult()
			
			params.value.forEach(function(child,index){
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
			var params ={
				label:$this.getLabel(property),
				obj:obj,
				property:property,
				value:value
			}
			
			function shouldRun(validatorDef){
				var options =params.options = validatorDef.options||{};
				if ( typeof options.when ==="function" && !options.when(params)) return false;
				return true;
			}
			try{
				
				if (property in $this.validators){
					$this.validators[property].filter(shouldRun).forEach(function(validatorDef){
							params.options = validatorDef.options || {};
						vr.merge(validatorDef.validator.call($this, params))
					})
				}
				if ("$ALL" in $this.validators){
					$this.validators.$ALL.filter(shouldRun).forEach(function(validatorDef){
						params.options = validatorDef.options;
						vr.merge(validatorDef.validator.call($this, params))
					})
				}
			}catch(e){
				if (typeof $server_gateway == "undefined"){
					//Don't flag as error client-side, just log
					if (typeof "console" != "undefined" && "log" in  console){
						console.log(
							"Error in validation for " + property +", with value: ",
							value,
							"Error:",
							e
						);
					}
				} else {
					vr.addError("Error in validation. See Administrator log for details",property)
					Myna.log(
						"error",
						"Error in validation for " + property,
						Myna.formatError(e) +Myna.dump(obj.data,"Obj Data")
					);
				}
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
Myna.Validation.prototype.validatorFunctions={
/* Function: validatorFunctions.type
	Validates basic type
		
	Options:
		type	- 	Function or String. One of "string", "numeric", "date", "binary", "array", 
					or "struct". "binary" means a byte array and "struct" means 
					a non null/undefined JS object. If this is a Function, it will be 
					passed the validator arguments and should return one of the above 
					types 	
	
	Note: 
		if the options to this validator are a single string, that string is 
		assumed to be the type
		
	Example:
	(code)
		var v = new Myna.Validation()
		//options as object, with optional message
		v.addValidator("first_name","type",{
			 type:"string",
			 message:"First Name must be text"
		})
		
		//with implicit type
		//options as type string
		v.addValidator("children","type","array")
		
		//with custom type generator and applied to all properties
		v.addValidator(null,"type",function(params){
			return Myna.Database.dbTypeToJs(params.obj.columns[params.property].data_type)
		})
		
	(end)
	See:
		* <addValidator>
		* <Myna.Database.dbTypeToJs>
	*/
	type:function type(params){
		var v = new Myna.ValidationResult();
		if (!params.value && params.value !== 0 && params.value !== false || params.value === "") return v;
		
		if (!params.options) throw new Error(" type validator requires 'type' option")
		if (typeof params.options == "string") params.options = {type:params.options}
		
		var type = typeof params.options.type =="function"?params.options.type.apply(this, Array.parse(arguments)):params.options.type;
		var msg = params.options.message||'{0}(value:{1}) must be of type "{2}"'.format(params.label,params.value,type)
		switch(type){
			
			case "string":
				if (String(params.value) == params.value) return v
				break;
			case "numeric":
				if (parseFloat(params.value) == params.value) return v
				break;
			case "date":
				if (params.value instanceof Date) return v
				break;
			case "binary":
				if (params.value instanceof Array){
					try{
						if (params.value.getClass().getName() == "[B") return v
					} catch(e){}
				}
				break;
			case "array":
				if (params.value instanceof Array){
					return v	
				}
				break;
			case "function":
				if (typeof params.obj == "function"){
					return v	
				}
				break;
			case "struct":
				if (params.value && typeof params.value == "object"){
					return v;	
				}
				break;
		}
		v.addError(msg,params.property)
		return v;
	},
/* Function: validatorFunctions.length
	Validates length 
		
	Options:
		min	-	*Optional*
					minimum length, or function that returns a length. If this is a 
					Function, it will be passed the validator arguments and should 
					return a min value
		max	-	*Optional*
					maximum length, or function that returns a length. If this is a 
					Function, it will be passed the validator arguments and should 
					return a max value
	
	Examples:
	(code)
		var v = new Myna.Validation()
		//with optional message
		v.addValidator("first_name","length",{
			 max:255,
			 message:"First Name must be Less that 255 characters"
		})
				
		//with custom max length generator and applied to all properties
		v.addValidator(null,"length",{
			max:function(params){
				return params.obj.columns[params.property].column_size
			}
		})
	(end)
		
	See:
		* <addValidator>
	*/
			
	length:function length(params){
		var v = new Myna.ValidationResult();
		if (!params.value && params.value !== 0 && params.value !== false || params.value === "") return v;
		var msg = params.options.message
		var min = typeof params.options.min =="function"?params.options.min.apply(params.options, Array.parse(arguments)):params.options.min;
		var max = typeof params.options.max =="function"?params.options.max.apply(params.options, Array.parse(arguments)):params.options.max;
		
		var hasLength = ("length" in params.value) && params.value.length;
		
		if (max && hasLength && params.value.length > max){
			
			v.addError(msg ||
				'Exceeded maximum length for {label} ({max}) by {diff}'.format({
					label:params.label,
					max:max,
					diff: String(bean.data[params.property]).length-max
				}),
				params.property
			)
		}
		if (min && (!hasLength || params.value.length < min)){
			v.addError(msg ||
				'{label} must be at least {min} long'.format({
					label:params.label,
					min:min
				}),
				params.property
			)
			
		}
		return v
	},
	
/* Function: validatorFunctions.value
	Validates min/max value 
		
	Options:
		min	-	*Optional*
					minimum value, or function that returns a value. If this is a 
					Function, it will be passed the validator arguments and should 
					return a min value
		max	-	*Optional*
					maximum value, or function that returns a value. If this is a 
					Function, it will be passed the validator arguments and should 
					return a max value
	
	Examples:
	(code)
		var v = new Myna.Validation()
		//with optional message
		v.addValidator("age","value",{
			min:16,
			max:130,
			message:"Employees must be between the ages of 16 and 130"
		})
				
		//with custom min value generator for use with dates
		v.addValidator("end_date","value",{
			min:function(params){
				return params.obj.start_date.add(Date.DAY,1)
			},
			message:"End Date must be at least one day after Start Date"
		})
	(end)
		
	See:
		* <addValidator>
	*/	
	value:function validateValue(params){
		var v = new Myna.ValidationResult();
		if (!params.value && params.value !== 0 && params.value !== false || params.value === "") return v;
		var msg = params.options.message
		var min = typeof params.options.min =="function"?params.options.min.apply(params.options, Array.parse(arguments)):params.options.min;
		var max = typeof params.options.max =="function"?params.options.max.apply(params.options, Array.parse(arguments)):params.options.max;
		
		
		
		if (max && params.value && params.value > max){
			
			v.addError(msg ||
				'{label} must be less than {max}'.format({
					label:params.label,
					max:max
				}),
				params.property
			)
		}
		if (min && params.value && params.value < min){
			v.addError(msg ||
				'{label} must be at least {min}'.format({
					label:params.label,
					min:min
				}),
				params.property
			)
			
		}
		return v
	},
/* Function: validatorFunctions.regex
	Validates a value against a regular expression
		
	Options:
		pattern	- regular expression to apply
		
	Notes:
		* If the options to this validator are a single RegExp object, that
			RegExp is assumed to be the _pattern_
		* Value will be converted to a string for the comparison. 
	
	Examples:
	(code)
		var v = new Myna.Validation()
		//options as object, with optional message
		v.addValidator("first_name","regex",{
			 pattern:/^[A-Za-z ]+$/,
			 message:"First Name must only contain letters and spaces"
		})
		
		//with implicit regex, options as RegExp
		v.addValidator("zipcode","regex",/^\d{5}(-\d{4})?/)
	(end)	
		
	See:
		* <addValidator>
	*/	
	
	regex:function regex(params){
		var v = new Myna.ValidationResult();
		if (!params.value && params.value !== 0 && params.value !== false || params.value === "") return v;
		if (params.options instanceof RegExp) params.options = {pattern:params.options}
		if (!params.options.pattern) throw new Error("option 'pattern' is required for the regex validator");
		var msg= params.options.message|| params.label +" is not properly formatted."
		if (!params.options.pattern.test(String(params.value))) v.addError(msg,params.property);
		return v
	},
/* Function: validatorFunctions.list
	Validates a value against a list of values
		
	Options:
		oneOf					- *Optional, default null*
								Array, or function that returns an Array. If 
								defined, value must match one of these values. If 
								this is a Function, it will be passed the validator 
								arguments and should return an array of values 	
								
		notOneOf			- *Optional, default null*
								Array, or function that returns an Array. If 
								defined, value must NOT match one of these values. If 
								this is a Function, it will be passed the validator 
								arguments and should return an array of values
								
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
	
	Examples:
	(code)
		var v = new Myna.Validation()
		v.addValidator("color","list",{
			oneOf:[
				"Green",
				"Yellow",
				"blue"
			]
		})
				
		//with custom list value generator for use with dates
		v.addValidator("scheduled_date","list",{
			notOneOf:function(params){
				return new Myna.Query({
					ds:"event_db",
					sql:<ejs>
						select 
							scheduled_date
						from events
						where 
							id != {id}
					</ejs>,
					values:params.obj
				})
				.valueArray("scheduled_date")
				.map(function(date){
					return date.clearTime()
				})
			},
			exact:true,
			message:"This date has already been scheduled"
		})
	(end)
		
	See:
		* <addValidator>
	*/
	list:function list(params){
		var v = new Myna.ValidationResult();
		if (!params.value && params.value !== 0 && params.value !== false || params.value === "") return v;
		var oneOf = typeof params.options.oneOf =="function"?params.options.oneOf.apply(params.options, Array.parse(arguments)):params.options.oneOf;
		var notOneOf = typeof params.options.notOneOf =="function"?params.options.notOneOf.apply(params.options, Array.parse(arguments)):params.options.notOneOf;
		if (oneOf && oneOf.length){
			var msg= params.options.message|| "{0} must be {1} '{2}'".format(params.label,oneOf.length>1?"one of ":"",oneOf.join())
			
			if (params.options.exact){
				if (oneOf.indexOf(params.value) == -1) v.addError(msg,params.property);
			} else if (params.options.caseSensitive){
				if (!oneOf.contains(params.value)) v.addError(msg,params.property);
			} else {
				if (!oneOf.join().listContainsNoCase(params.value)) v.addError(msg,params.property);
			}
		} else if (notOneOf && notOneOf.length){
			msg= params.options.message|| "{0} must NOT be {1} '{2}'".format(params.label,notOneOf.length>1?"one of ":"",notOneOf.join())
			if (params.options.exact){
				if (notOneOf.indexOf(params.value) != -1) v.addError(msg,params.property);
			} else if (params.options.caseSensitive){
				if (notOneOf.contains(params.value)) v.addError(msg,params.property);
			} else {
				if (notOneOf.join().listContainsNoCase(params.value)) v.addError(msg,params.property);
			}
		}
		return v;
	},
/* Function: validatorFunctions.required
	Validates that a value be supplied
		
		
	This that the value is "true" or native 0 or native false. This means NaN, 
	null, undefined, etc will fail
	
	Examples:
	(code)
		var v = new Myna.Validation()
		//options as object, with optional message
		v.addValidator("first_name","required",{
			 message:"First Name is required"
		})
		
	(end)	
		
	See:
		* <addValidator>
	*/	
	required:function required(params){
		var v = new Myna.ValidationResult();
		if (typeof params.options != "object") params.options={}
		var msg= params.options.message|| params.label +" is required."
		if (!params.value && params.value !== 0 && params.value !== false){
			v.addError(msg,params.property);
		}
		return v
	}
}