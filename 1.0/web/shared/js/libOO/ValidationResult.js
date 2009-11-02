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
/* 	Constructor: Myna.ValidationResult
		Contructs a ValidationResult Object 
		
		Parameters:
			validation	-	*Optional default undefined* a ValidationResult 
							object to act as the base for this object 
			
		
	*/
	Myna.ValidationResult = function(validation){
		/* Property: success
			 Boolean result status for this ValidationResult *default true*
			 
			 This is set to false automatically when <addError> is called, or a
			 ValidationResult object with success=false is merged
		*/
		this.success=true;

		/* Property: errors
			object containing errors keyed by property name *default {}*
			
			Errors are added to this object automatically when <addError> is 
			called with a property parameter
		*/
		this.errors={};
		
		/* Property: errorMessage
			 Overall error message for this ValidationResult 
			 
			 This field is not set automatically 
		*/
		this.errorMessage="";
		
		
		/* Property: errorDetail
			 All messages added via <addError> without a property parameter 
			 
		*/
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
			this.errorDetail += message +"<br>\n"	
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
		this.addError(validation.errorDetal)
		
		var thisResult = this;
		if (validation.errors){
			validation.errors.forEach(function(value,key){
				thisResult.addError(value,prefix+key);
			})
		}
	}	