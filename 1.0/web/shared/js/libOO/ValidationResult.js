if (!Myna) var Myna={}

/* Class: Myna.ValidationResult
		Stores the results of one or more validation operations
		
		Detail: 
			A validation result starts out representing a successful operation.
			Calls to <addError> will change <success> to false, and store the 
			error. Multiple ValidationResult objects can be merged via the 
			<merge> function, allowing several operations to return a 
			single result object. ValidationResult is primarily used to return 
			information to the browser regarding the status of an AJAX call, and 
			ValidationResult.toJson() will return an appropriate JSON string for
			an Ext form submit action. ValidationResult objects are also 
			returned by <Myna.DataManager.beanTemplate> "set" functions
			
		Example:
		(code)
		Myna.DataManager.beanTemplate.setFields=function(fields){
			var bean = this;
			var result = new Myna.ValidationResult();
				fields.getKeys().forEach(function(name){
					if (bean.columnNames.indexOf(name) != -1){
						result.merge(bean["set_"+name](fields[name]));
					}
				})
			
			return result;
		}
		
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
		(end)
		
*/
/* Property: success
		 Boolean result status for this ValidationResult *default true*
		 
		 This is set to false automatically when <addError> is called, or a
		 ValidationResult object with success=false is merged
	*/
/* Property: errors
		object containing errors keyed by property name *default {}*
		
		Errors are added to this object automatically when <addError> is 
		called with a property parameter
	*/
/* Property: errorMessage
		 Overall error message for this ValidationResult 
		 
		 This field is not set automatically 
	*/
/* Property: errorDetail
		 All messages added via <addError> without a property parameter 
		 
	*/
/* Constructor: Myna.ValidationResult
	Contructs a ValidationResult Object 
	
	Parameters:
		validation	-	*Optional default undefined* a ValidationResult 
						object to act as the base for this object 
		
	
	*/
	Myna.ValidationResult = function(validation){
	
		this.success=true;
	
	
		this.errors={};
		
	
		this.errorMessage="";
		
		
	
		this.errorDetail="";
		
		if (validation) this.merge(validation);
	}

/* Function: addError
	Adds an error to this result and sets <success> to false
	
	Parameters:
		message		-	HTML message to add
		property	-	*Optional default undefined* If defined, will save 
						message to <errors> by this property
	Returns:
		reference to this ValidatinResult
	*/
	Myna.ValidationResult.prototype.addError=function(message,property){
		if (property){
			this.errors[property] = message;	
		} else {
			//only  add unique errors
			if (!new RegExp(message).test(this.errorDetail)){
				this.errorDetail += message +"<br>\n"
			}
		}
		this.success=false;
		
		return this;
	}
/* Function: merge
	Merge a ValidationResult into this one, optionally changing the <errors>
	properties
	
	Parameters:
		validation	-	a ValidationResult object to merge wit this one
		prefix		-	*Optional default undefined* If defined, this string
						will be prepended to the _validation_.errors before 
						merging
						
	Detail:
			
	*/
	Myna.ValidationResult.prototype.merge=function(validation,prefix){
		if (validation.success) return;
		
		if (!prefix) prefix="";
		
		//merge general errors
		this.addError(validation.errorDetail)
		
		var thisResult = this;
		if (validation.errors){
			validation.errors.forEach(function(value,key){
				thisResult.addError(value,prefix+key);
			})
		}
	}

/* Function: validate
	checks whether an object's properties pass some basic validations
	
	Parameters:
		obj			-	Object to validate
		config		-	Object where the keys are properties in _obj_ and the values
							are validation config Objects as described below
		prefix		-	*Optional, default ""*
							if defined, this will be inserted in front of property 
							names before errors are added to this result 
							
	Validation Config:
		label				-	String, default property name. Set this to use a different 
								name for this field in validation errors
		            	
		exists			-	Boolean. If true then this property must exist in the 
								object, even if it is set to null
		notNull			- 	Boolean. If true, this property must exist and have a 
								non-null value
		nonEmpty			-	Boolean. If true, this property must exist and have a 
								nonEmpty value, meaning it must not be null or undefined, 
								nor an empty string, and empty array, or an empty object 
								with no own properties.
		type				-	String. If exists, this property must match this type. _type_ 
								can be one of "string,numeric,date,binary,array,function,struct" 
								where "struct" is any defined non-null object. If this 
								property is null or undefined, type checking is skipped
								Note that loose type checking is performed, so  "5" and 
								5 and "five" will match the string test but only the 
								first 2 will match the numeric test 
		regex				-	RegExp. If this property is a string, it must pass this 
								regular expression.
		regexMessage	-	String. default "<field label> is  invalid." Message to 
								use for regex errors
		minLength		-	Numeric. If this property is a string or array, then it 
								must be at least this length
		maxLength		-	Numeric. If this property is a string or array, then it 
								must be at most this length
		minValue			-	Numeric. If this property is numeric or a Date, then it 
								must be at least this value
		maxValue			-	Numeric. If this property is numeric or a Date, then it 
								must be at most this value
		custom			-	Function. This function will be passed the property value, 
								property name, and _obj_, this ValidationResult and _prefix_ instance. 
								This function should return true if this property is valid 
								or if it directly manipulates the validation result
		customMessage	-	String. default "<field label> is invalid." Message to
								use for custom errors
					
	Returns:
		this validation object 
	Examples:
	(code)                               
		var v = new Myna.ValidationResult().validate(obj,{
			name:{
				label:"Name",
				nonEmpty:true,
				type:"string",
				regex:/^[A-Za-z ]+$/,
				regexMessage:"Names must only contain Letters and spaces" 
			},
			dob:{
				label:"Date of Birth",
				type:"date",
				
				minValue:new Date().add(Date.YEAR,-150),
				maxValue:new Date(),
				
			},
			children:{
				label:"Children",
				type:"array",
				maxLength:12,
				custom:function(value,name,obj,v,prefix){
					value.forEach(function(child,index){
						v.validate(
							child,
							{
								name:{
									label:"Name",
									nonEmpty:true,
									type:"string",
									regex:/^[A-Za-z ]+$/
								},
								dob:{
									label:"Date of Birth",
									type:"date",
									minValue:new Date().add(Date.YEAR,-150),
									maxValue:new Date(),
								},
								relationship:{
									label:"Relationship",
									type:"string",
									nonEmpty:true,
									regex:/^(son|daughter)$/i,
									regexMessage:'Relationship must be "Son" or "Daughter"'
								}
							},
							prefix +"{0}[{1}].".format(name,index)
						)
					})
					return true;// return true because we already handled via nested 
									// validation
				}
				
			}
		})
	(end)
	*/
	Myna.ValidationResult.prototype.validate=function(obj,config, prefix){
		var $this = this;
		if (!config)  return this
		config.forEach(function(validator,prop){
			var label = validator.label||prop
			validator.forEach(function(v,test){
				switch(test){
					case "exists":
						if (v&& (!(prop in obj))) {
							$this.addError("{0} is required".format(label),(prefix||"")+prop)
						}
						break;
					case "notNull":
						if (v&&(!(prop in obj) || obj[prop] === null)) {
							$this.addError("{0} is required".format(label),(prefix||"")+prop)
						}
						break;
					case "nonFalse":
						if (v&&!obj[prop]) {
							$this.addError("{0} is required".format(label),(prefix||"")+prop)
						}
						break;
					case "nonEmpty":
						if (v&&(
							!(prop in obj) || obj[prop] === null || (
								typeof obj[prop] == "object"
								&& "length" in obj[prop] && !obj[prop].length 
							)
							|| (
								typeof obj[prop] == "object" 
								&& !ObjectLib.getKeys(obj[prop]).length	
							)
						)) {
							$this.addError("{0} is required".format(label),(prefix||"")+prop)
						}
						break;
					case "type":
						if (prop in obj && obj[prop]){
							switch (v){
								case "string":
									if (String(obj[prop]) != obj[prop] ){
										$this.addError("{0} must be a text value".format(label),(prefix||"")+prop)
									}
									break;
								case "numeric":
									if (obj[prop] ==0 && parseFloat(obj[prop]) != obj[prop] ){
										$this.addError("{0} must be a numeric value".format(label),(prefix||"")+prop)
									}
									break;
								case "date":
									if (!(obj[prop] instanceof Date) ){
										$this.addError("{0} must be a Date".format(label),(prefix||"")+prop)
									}
									break;
								
								case "binary":
									if (obj[prop] instanceof Array){
										try{
											if (value.getClass().getName() != "[B") {
												$this.addError("{0} must be binary".format(label),(prefix||"")+prop)	
											}
										} catch(e){}
									}
									break;
								case "array":
									if (!(obj[prop] instanceof Array)){
										$this.addError("{0} must be an Array".format(label),(prefix||"")+prop)	
									}
									break;
								case "struct":
									if (typeof obj != "object"){
										$this.addError("{0} must be an Object".format(label),(prefix||"")+prop)	
									}
									break;
								case "function":
									if (typeof obj != "function"){
										$this.addError("{0} must be a Function".format(label),(prefix||"")+prop)	
									}
									break
							}
						}
						break;
					case "regex":
						if (prop in obj && obj[prop]){
							if (!(v instanceof RegExp)) throw new Error("Value of 'regex' must be a regular expression")
							if (!v.test(String(obj[prop]))){
								var msg = validator.regexMessage ||"{0} is invalid."; 
								$this.addError(msg.format(label),(prefix||"")+prop)
							}
						}
						break;
					case "minLength":
						if (prop in obj && obj[prop] 
								&& "length" in obj[prop] && obj[prop].length < v
						){
							$this.addError("The size of {0} must be at least {1}".format(label,v),(prefix||"")+prop)
						}
						break;
					case "maxLength":
						if (prop in obj && obj[prop] 
								&& "length" in obj[prop] && obj[prop].length > v
						){
							$this.addError("The size of {0} must be at most {1}".format(label,v),(prefix||"")+prop)
						}
						break;
					case "minValue":
						if (prop in obj && obj[prop] && (obj[prop] instanceof Date || parseFloat(obj[prop]) == obj[prop])){
							if (obj[prop] < v){
								$this.addError("{0} must be at least {1}".format(label,v),(prefix||"")+prop)
							}
						}
						break;
					case "maxValue":
						if (prop in obj && obj[prop] && (obj[prop] instanceof Date || parseFloat(obj[prop]) == obj[prop])){
							if (obj[prop] > v){
								$this.addError("{0} must be at most {1}".format(label,v),(prefix||"")+prop)
								
							}
						}
						break;
						
				}
				if ("custom" in validator && typeof validator.custom == "function"){
					var result = validator.custom(obj[prop],prop,obj,$this,prefix)
					if (!result){
						var msg = validator.customMessage ||"{0} is invalid."; 
						$this.addError(msg.format(label),(prefix||"")+prop)
					}
				}
			})
		})
		return this
	}