//MyService.ws
{
	name:"MyService",
	desc:"A thing that does stuff",
	myFunction:function(arg1,arg2){
		//	arbitrary functions and properties can be defined on the spec object.
		//	in this case "myFunction" can be accessed as "this.myFunction" in 
		//	authFunction, beforeHandler, afterHandler or in the handler function
		//	requested
		
	},
	authFunction:function(authData){
		//	authData contans:
		//		*	username 		   - 	supplied username
		//		*	password			- 	supplied password
		//		*	user				-	<Myna.Permissions.User> object 
		//									associated with this cookie. To 
		//									associate a user with this call 
		//									<$cookie.setAuthUserId>
		//		*	functionName		- 	name of function called
		//		*	functionDef		- 	reference to the function 
		//										definition called
		//	returning true allows the cal, and false requests a login. Generally 
		//	you want to return false if the username or password is invalid, and 
		//	throw an exception if   
		 
		return true;
	},
	beforeHandler:function(name,def,params){
		//	name		- 	the name of the function handler
		//	def		   - 	a reference to the function definition
		//	params 	- 	an object of the function parameters to request.
		//
		//	This is called after authFunction but before the handler function.
		//	This function can manipulate the "params" object before the handler is 
		//	called, or can throw an error to abort processing
	},
	afterHandler:function(name,def,params,result){
		//	name		- 	the name of the function handler
		//	def		   - 	a reference to the function definition
		//	params 	- 	an object of the function parameters to the request.
		//	result		-	result of the handler call
		//
		//	This is called after the handler function but before out processing.
		//	This is generally used for logging, or manipulating the result
	},
	functions:{
		 echo:{
			  desc:"returns your parameters as an html table",
			  returns:"string",
			  params:[{
					name:"arg_string",
					type:"string",
					desc:"A string params"
			  },{
					name:"arg_number",
					type:"numeric",
					desc:"A numeric param"
			  },{
					name:"arg_date",
					type:"date",
					desc:"A date param"
			  }],
			  handler:function(params){
					return Myna.dump(params)
			  }
		 },
		 get_spec:{
			  desc:"returns the spec object as JSON string",
			  returns:"string",
			  params:[],
			  handler:function(){
				  //you can access the spec as "this"
				  return this.spec.toJson()
			  }
		 },
		 get_bob:{
			  desc:"Always returns bob. Example of a complex return type",
			  returns:{
					name:"string",
					age:"numeric",
					children:[{
						 name:"string",
						 age:"numeric"
					}],
					favorite_colors:["string"]
			  },
			  params:[],
			  handler:function(){
					return {
						 name:"Bob Dobb",
						 age:"44",
						 children:[{
							  name:"julie",
							  age:9
						 },{
							  name:"sam",
							  age:13
						 }],
						 favorite_colors:["yellow","green","blue"]
					}
			  }
		 }
	}
}