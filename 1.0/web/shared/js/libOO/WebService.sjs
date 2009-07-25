/* Class: Myna.WebService
	A WebService meta object that can serve requests for SOAP, XML-RPC and 
	JSON-RPC, and JSON-MYNA
		
	Detail:
		This object can be used directly to implement web rpc services or as a 
		wrapper around existing objects. For SOAP, this attempts to provide the 
		simplest useable implementation. For the simpler XML-RPC and JSON-RPC 
		specifications this object aims to provide a complete implementation. 
		
	JSON-MYNA: 
		This is a Myna specific protocol that aims to be the simplest 
		implementation of WebService. Requests are made via GET or POST. A 
		paramter "method" must be passed to indicate which function on this 
		WebService to execute. All other paramters are assumed to be named 
		function parameters. The response body will be a JSON encoding of the 
		funciton result without any extra metadata.  
		
	See <handleRequest> for how to call the web service using each of the 
	supported protocols
	
	See Also:
		* http://www.w3.org/TR/soap/
		* http://www.xmlrpc.com/
		* http://json-rpc.org/
*/
if (!Myna) var Myna={}

/* Constructor: Myna.WebService
	Constructor function for WebService class
	
	Parameters:
		spec		-	object that describes a web service - see below
		
	Spec Definition:
	name				-	A name for this set of services. Like a class name
	desc				-	A string describing this service set
	beforeHandler	-	*Optional default null*
						A function to execute before proccessing the function
						handler. This function is called with three parameters:
						the name of the function handler, a reference to the 
						function definition, and an array of the function 
						parameters from the request.
						
	afterHandler		-	*Optional default null*
						A function to execute after proccessing the function
						handler. This function is called with four parameters:					
						the name of the function handler, a reference to the 
						function definition, an array of  the function 
						parameters from the request, and the returned value from 
						the function handler
						
	authFunction		-	*Optional default null*
						Function that handles authentication before each 
						function request. This function will be called with a 
						single parameter, an object with these properties: 
						*	username 		- 	supplied username
						*	password			- 	supplied password
						*	functionName		- 	name of function called
						*	functionDef		- 	reference to the fucntion 
												definition called
						Returning false from this function will request an HTTP 
						basic auth request. Returning true will allow the 
						request to continue. Throwing an exception will return
						an error to the client.
						
	authSecret		-	*Optional default Myna Administrator password*
						Password to use for encrypting username and password in 
						the client's cookie. 
						
	authTimeout		- 	*Optional default 20*
						Lifetime of auth cookie in client's browser, in minutes.
						
	functions		-	An object where each property is a function name and the 
						value is an object representing a function definition as
						described below
					
	Function Definition:
	desc		-	*Optional default null*
					A string describing this function
	params		-	An array of Parameter Definitions. See below 
	handler		-	Function to execute. 
	scope		-	*Optional default: Spec Definition object*
					Object to use as "this" when executing the _handler_. 
	returns		-	A representation of the type of data to return. If this is a
	                string, it should be one of these type names:
					"string,numeric,date,date_time". If this is an array object, 
					then the first item should be either a string type name, 
					another array, or an object. If this is an object, each 
					property should be set equal to either a string type name, 
					another object, or an array.
					
	Parameter Definition:
	name		-	name of the parameter
	type			-	Type of the parameter. Currently, the only available types 
					are "string,numeric,date ,date_time"
		
	Returns:
		Reference to WebService instance
		
	Example:
	(code)
	var ws = new Myna.WebService({
		name:"stuff",
		desc:"A thing that does stuff",
		functions:{
			echo:{
				desc:"returns what you send",
				returns:"string",
				params:[{
					name:"arg_string",
					type:"string"
				},{
					name:"arg_number",
					type:"numeric"
				},{
					name:"arg_any",
					type:"any"
				}],
				handler:function(params){
					return Myna.dump(params)
				}
			},
			get_employee:{
				desc:"Always returns bob",
				returns:{
					name:"string",
					age:"numeric",
					children:[{
						name:"string",
						age:"numeric"
					}],  
					favorite_colors:["string"] 
				},
				params:[{
					name:"employee_id",
					type:"numeric"
				}],
				handler:function(employee_id){
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
	})
	ws.handleRequest($req);
	(end)
	*/
	Myna.WebService = function(spec){
		this.spec =spec
		this.mynasoap 	= new Namespace("mynasoap","http://myna.emptybrain.info/xml-soap");
		this.mynarpc 	= new Namespace("mynarpc","http://rpc.xml.myna");
		this.impl 		= new Namespace("impl","http://DefaultNamespace");
		this.wsdl 		= new Namespace("wsdl","http://schemas.xmlsoap.org/wsdl/");
		this.wsdlsoap 	= new Namespace("wsdlsoap","http://schemas.xmlsoap.org/wsdl/soap/");
		this.soapenc 	= new Namespace("soapenc","http://schemas.xmlsoap.org/soap/encoding/");
		this.soapenv 	= new Namespace("soapenv","http://schemas.xmlsoap.org/soap/envelope/");
		this.xsd 		= new Namespace("xsd","http://www.w3.org/2001/XMLSchema");
		this.xsi		= new Namespace("xsi","http://www.w3.org/2001/XMLSchema-instance");
		this.authData={}
	}
	
	/* Function: Myna.WebService.generateQueryType
		Static function that takes a columns definition and returns a type that 
		represents the <Myna.Query.result> type for the supplied columns that is 
		suitible for use in the "returns" section of a web service function 
		definition
		
		Parameters:
			columns		-	An array of objects in the form of 
								[{colname:type}] that represents the columns in the 
								returned query. "Type" should be one of string, numeric,
								date, date_time
	*/
	Myna.WebService.generateQueryType=function(columns){
		return {
			columns:[{
				name:"string",
				type:"string"
			}],
			totalRows:"numeric",
			data:columns,
			maxRows:"numeric",
			startRow:"numeric"
		}
	}
/* Function: handleRequest
	Parses a request and returns the appropriate data;
	
	Detail:
		This function examines $req.data for possible rpc calls.
		
		* *SOAP* 
		  If $req.data.wsdl is defined, a SOAP WSDL document is printed. 
		* *SOAP* 
		  If $req.data.soap is defined, the XML content is interpreted as a SOAP  
		  request and a SOAP envelope is printed
		  
		* *XML-RPC* 
		  If $req.data.xml-rpc is defined, the XML content is interpreted as an 
		  XML-RPC request and an XML-RPC response is printed
		  
		* *JSON-RPC* 
		  If $req.data.json-rpc is defined, the text content is interpreted a
		  JSON-RPC request and an JSON-RPC response is printed
		  
		* *JSON-MYNA* 
		  If $req.data.json-myna is defined, the text content is interpreted a
		  JSON-MYNA request and a plain JSON response is printed
		  
		* *Ext.Direct* 
		  If $req.data.ext-api is defined a JSON Ext.Direct api is generated. If 
		  $req.data.scriptvar is also defined, a javascript response is generated 
		  with thet Ext.Direct api set equal to the value of $req.data.scriptvar. 
		  This allows the loading of the api via a script table like this:
		  
		  (code)
		  	//creates a global MyServiceAPI variable containing the Ext.Direct API
		  	<script src="http://myhost.com/myservice.sjs?ext-api&scriptvar=MyServiceAPI"></script>
			
		  (end)
		* *Ext.direct*
		  If $req.data.ext-route is defined, the request is handled as either an 
		  Ext.Direct batch request or as an Ext.Direct POST request
		
	*/
	Myna.WebService.prototype.handleRequest=function(){
		var req =$req;
		if ("wsdl" in req.data){
			this.printWsdl(req);
			return;
		} else if ("soap" in req.data){
			this.executeSoap(req.contentXml);
			return;
		} else if ("json-rpc" in req.data){
			var m = $server.request.getMethod();
			if (m == "POST"){
				this.executeJsonRpcPost(req.contentText);
			} else {
				Myna.print({
					error:"Please use only POST methods for JSON-RPC calls"
				}.toJson())	
			}
			return;
		} else if("json-myna" in req.data){
			this.executeJsonMyna(req.rawData);
		} else if ("xml-rpc" in req.data){
			this.executeXmlRpc(req.contentXml);
			return;
		} else if ("ext-api" in req.data){
			this.printExtApi(req);
		} else if ("ext-route" in req.data){
			this.executeExtRoute();
		} else { //TODO: display help
			
		}
	}

Myna.WebService.prototype.getSchemaType=function(type){
	switch(type){
		case "any":
			return "xsd:anyType";
		break;
		case "numeric":
			return "xsd:double";
		break;
		case "date":
			return "xsd:date";
		break;
		case "date_time":
			return "xsd:dateTime";
		break;
		case "map":
			return "mynasoap:Map";
		break;
		case "string":
			return "xsd:string";
		break;
	}
	throw new Error("WebService::getSchemaType(): Unknown type '" + type +"'");
}
Myna.WebService.prototype.makeCustomSoapType = function(obj,name, schema){
	var ws =this;
	/* string */
		if (typeof obj == "string"){
			return ws.getSchemaType(obj);
		} 
	/* Array */
		if (obj instanceof Array){
			var itemType = ws.makeCustomSoapType(obj[0],name,schema);
			var curType = new XML(<ejs>
				<complexType name="ArrayOf<%=name%>" xmlns="<%=ws.xsd%>" xmlns:wsdl="<%=ws.wsdl%>">
					<complexContent>
						<restriction base="soapenc:Array">
							<attribute ref="soapenc:arrayType" wsdl:arrayType="<%=itemType%>[]"/>
						</restriction>
					</complexContent>
				</complexType>
			</ejs>);
			
			schema.appendChild(curType);
			return "impl:ArrayOf"+name;
		}
	/* Object/Struct */
		if (typeof obj == "object" && obj.getKeys().length){
			var structType = new XML(<ejs>
				<complexType name="<%=name%>" xmlns="<%=ws.xsd%>"></complexType>
			</ejs>);
			var seq = new XML(<ejs>
				<sequence xmlns="<%=ws.xsd%>"/>
			</ejs>)
	 
			
			obj.getKeys().forEach(function(key){
				seq.appendChild(new XML(<ejs>
					<element name="<%=key%>" nillable="true" type="<%=ws.makeCustomSoapType(obj[key],key,schema)%>" xmlns="<%=ws.xsd%>"/>
				</ejs>))
			})
			structType.appendChild(seq);
			schema.appendChild(structType);
			return "impl:"+name;
		}
	
	throw new Error("WebService::makeCustomSoapType: Unknown type "+name +" = " + String(obj))
}

/* Function: setAuthUserId
		sets WebService.authUserId and calls <$cookie.setAuthUserId>
		
		Parameters:
			user_id	-	user_id of user to register
	*/
Myna.WebService.prototype.setAuthUserId=function(user_id){
	this.authUserId = user_id;
	$cookie.setAuthUserId(user_id);
}
/* Function: clearAuthUserId
		sets WebService.authUserId to null and calls <$cookie.clearAuthUserId>
		
		Parameters:
			user_id	-	user_id of user to register
	*/
Myna.WebService.prototype.clearAuthUserId=function(){
	this.authUserId = null;
	$cookie.clearAuthUserId()
}
/* Function: executeFunctionHandler
		*INTERNAL* handles the execution of web service function. Used by service 
		specific function handlers 
		
		Parameters:
			functionName		-	name of method being executed
			functionDef		-	reference to the function definition in the spec
			paramArray		-	array of parameters to the method
	*/
Myna.WebService.prototype.executeFunctionHandler=function(functionName,functionDef,paramArray){
	$profiler.mark("begin executeFunctionHandler");
	var ws = this;
	this.authData={
		username:$req.authUser,
		password:$req.authPassword,
		functionName:functionName,
		functionDef:functionDef
	}
	var authData = this.authData;
	var authSuccess=false;
	//default timeout is 24 hours
	var timeout = ws.spec.authTimeout?ws.spec.authTimeout:24*60;
	timeout=parseInt(timeout)*60*1000;
	var secret = ws.spec.authSecret?ws.spec.authSecret:Myna.getGeneralProperties().admin_password;
	if (ws.spec.authFunction){
		var user_id =$cookie.getAuthUserId();
		if (user_id){
			ws.setAuthUserId(user_id);
		}
		authSuccess = ws.spec.authFunction.call(ws.spec,authData);
		
		if (!authSuccess) {
			$res.requestBasicAuth(ws.spec.name)
		} else {
			//Myna.log("debug","auth success",Myna.dump(authData));	
		}
		
	}
	var paramObject ={}
	if ("params" in  functionDef){
		functionDef.params.forEach(function(p,index){
			if (paramArray[index] == undefined){
				if ("defaultValue" in p){
					paramObject[p.name] = p.defaultValue;
				} else if ("required" in p && p.required){
					throw new Error(p.name + " parameter is required");	
				}
			} else {
				paramObject[p.name] = paramArray[index];
			}
		})
	}
	try{
		if (ws.spec.beforeHandler){
			ws.spec.beforeHandler.call(ws.spec,functionName,functionDef,paramObject)
		}
		if (!functionDef.scope) functionDef.scope = ws.spec;
		
		var result = functionDef.handler.call(functionDef.scope,paramObject,ws.spec,functionName,functionDef)
	} catch(exception){
		if (__exception__) exception =__exception__;
		var formattedError = Myna.formatError(exception) 
		var message = exception.message || exception.getMessage();
		Myna.log("ERROR","Error in "+ this.spec.name +":" +message,formattedError);
		throw exception;
	} finally {
		try {
			if (ws.spec.afterHandler){
				ws.spec.afterHandler.call(ws.spec,functionName,functionDef,paramObject,result);
			}
		} catch(exception){
			if (__exception__) exception =__exception__;
			formattedError = Myna.formatError(exception) 
			message = exception.message || exception.getMessage();
			Myna.log("ERROR","Error in "+ this.spec.name +" afterHandler :" +message,formattedError);
		}
		 
	}
	return result;
}

/* Function: printWsdl
	 prints a SOAP WSDL document representing this web service
	*/
	Myna.WebService.prototype.printWsdl=function(){
		$res.setContentType("text/xml");
		$res.clear();
		
		var xml;//generic temp XML object
		var f = this.spec.functions;
		var ws = this;
		
		var mynasoap 	= ws.mynasoap;
		var mynarpc 	= ws.mynarpc;
		var impl 		= ws.impl;
		var wsdl 		= ws.wsdl;
		var wsdlsoap 	= ws.wsdlsoap;
		var soapenc 	= ws.soapenc;
		var soapenv 	= ws.soapenv;
		var xsd 		= ws.xsd;
		var xsi			= ws.xsi;
		
		/* definitions wrapper with types and  SOAPInvocationException message*/
			var response =<wsdl:definitions 
				targetNamespace={impl} 
				xmlns:mynasoap={mynasoap} 
				xmlns:impl={impl} 
				xmlns:soapenc={soapenc} 
				xmlns:mynarpc={mynarpc} 
				xmlns:wsdl={wsdl} 
				xmlns:wsdlsoap={mynasoap} 
				xmlns:xsd={xsd}
			>
				<wsdl:types>
					<schema 
						targetNamespace={mynasoap} 
						xmlns={xsd}
					>
						<import namespace={impl}/>
						<import namespace={mynarpc}/>
						<import namespace={soapenc}/>
						<complexType name="mapItem">
							<sequence>
								<element name="key" nillable="true" type="xsd:string"/>
								<element name="value" nillable="true" type="xsd:anyType"/>
							</sequence>
						</complexType>
						<complexType name="Map">
							<sequence>
								<element maxOccurs="unbounded" minOccurs="0" name="item" type="mynasoap:mapItem"/>
							</sequence>
						</complexType>
		
					</schema>
					
					<schema targetNamespace={impl} xmlns={xsd}>
						<import namespace={mynasoap}/>
						<import namespace={mynarpc}/>
		
						<import namespace={soapenc}/>
					</schema>
				</wsdl:types>
	
				
			</wsdl:definitions>;
	
		/* request and response messages + custom types*/
			f.getKeys().forEach(function(method){
				/* request */
					xml = <wsdl:message name={method+"Request"} xmlns:wsdl={wsdl}/>;
					
					f[method].params.forEach(function(p){
						/* append params */
						xml.appendChild(<wsdl:part 
							name={p.name} 
							type={ws.getSchemaType(p.type)}
							xmlns:wsdl={ws.wsdl}
						/>);
					})
					response.appendChild(xml);
				/* response */
					var returnType="";
				
					var xsd = ws.xsd;
					var schema = response..xsd::schema.(@targetNamespace==ws.impl)
					
					returnType = ws.makeCustomSoapType(f[method].returns,"result",schema);
						
					response.appendChild(
						<wsdl:message name={method+"Response"} xmlns:wsdl={wsdl}>
							<wsdl:part name="result" type={returnType}/>
						</wsdl:message>
					);
				
					
			})
		/* portType */
			xml = <wsdl:portType name={ws.spec.name} xmlns:wsdl={ws.wsdl}/>
		/* portType operations */
			f.getKeys().forEach(function(method){
				var methodOrder = f[method].params.map(function(p){
					return p.name
				}).join(" ");
				xml.appendChild(
					<wsdl:operation name={method} parameterOrder={methodOrder} xmlns:wsdl={wsdl}>
						<wsdl:input message={"impl:" +method+"Request"} name={method + "Request"}/>
						<wsdl:output message={"impl:" +method +"Response"} name={method + "Response"}/>
						
					</wsdl:operation>
				);
			});
			response.appendChild(xml);
		
		
		xml = 
			<wsdl:binding name={ws.spec.name+".soapBinding"} type={"impl:"+ws.spec.name} 
				xmlns:wsdl={ws.wsdl}
				xmlns:wsdlsoap={ws.wsdlsoap}
			>
				<wsdlsoap:binding style="rpc" transport="http://schemas.xmlsoap.org/soap/http"/>
				
			</wsdl:binding>
		
		f.getKeys().forEach(function(method){
			xml.appendChild(
				<wsdl:operation name={method}
					xmlns:wsdl={ws.wsdl}
					xmlns:wsdlsoap={ws.wsdlsoap}
				>
				<wsdl:documentation>{f[method].desc}</wsdl:documentation>
					<wsdlsoap:operation soapAction=""/>
					<wsdl:input name={method+"Request"}>
						<wsdlsoap:body encodingStyle={ws.soapenc} namespace={ws.impl} use="encoded"/>
					</wsdl:input>
					<wsdl:output name={method+"Response"}>
						<wsdlsoap:body encodingStyle={ws.soapenc} namespace={ws.impl} use="encoded"/>
					</wsdl:output>
					
				</wsdl:operation>
			);
		});
		response.appendChild(xml);
		response.appendChild(
			<wsdl:service name={ws.spec.name}
				xmlns:wsdl={wsdl}
				xmlns:wsdlsoap={wsdlsoap}
			>
				<wsdl:documentation>{ws.desc}</wsdl:documentation>
				<wsdl:port binding={"impl:"+ws.spec.name+".soapBinding"} name={ws.spec.name}>
				<wsdlsoap:address location={$server.requestServerUrl+$server.requestUrl+$server.scriptName+"?soap"}/>
				</wsdl:port>
			</wsdl:service>	
		);
		$res.clear();
		$res.print(<ejs><?xml version="1.0" encoding="UTF-8"?><!--
			WSDL created by Myna Application Server version <%=$server.version%>
		--><%=response.toXMLString()%></ejs>);
		
	}
/* Function: printExtApi
	 prints an Ext.Direct API representing this web service. 
	 
	 if $req.data.scriptvar is also defined, a javascript response is generated 
	 with thet Ext.Direct api set equal to the value of $req.data.scriptvar. 
	 
	 if $req.data.ns is defined, this namespace is will be defined in tha api, 
	 and  $req.data.scriptvar, if also defined will be created in this namespace 
	 as well.
	 
	 Client-side Examples:
		(code)
		  	// adds a Ext.Direct provider via AJAX callback
			
			<script>
				Ext.Ajax.request({
					url:"http://myhost.com/myservice.sjs?ext-api",
					success:function(response){
						Ext.Direct.addProvider(Ext.decode(response));		
					}
				})
				MyService.someFunction(arg1, arg1,function(response){
					alert(response);
				})
			</script>
		  (end)
		  
		  (code)
		  	// adds a Ext.Direct provider in the MyNS namespace via AJAX callback 
			
			<script>
				Ext.Ajax.request({
					url:"http://myhost.com/myservice.sjs?ext-api",
					success:function(response){
						Ext.Direct.addProvider(Ext.decode(response));		
					}
				})
				MyService.someFunction(arg1, arg1,function(response){
					alert(response);
				})
			</script>
		  (end)	  
	 
		  (code)
		  	// creates a global MyServiceAPI variable containing the Ext.Direct API 
			//	via script include
			
		  	<script src="http://myhost.com/myservice.sjs?ext-api&scriptvar=MyServiceAPI"></script>
			<script>
				Ext.Direct.addProvider(MyServiceAPI);
				MyService.someFunction(arg1, arg1,function(response){
					alert(response);
				})
			</script>
		  (end)
		  
		  (code)
		  	// creates a MyServiceAPI variable in the MyNS namespace containing the 
			//	Ext.Direct API via script include
			
		  	<script src="http://myhost.com/myservice.sjs?ext-api&ns=MyNS&scriptvar=MyServiceAPI"></script>
			<script>
				Ext.Direct.addProvider(MyNS.MyServiceAPI);
				MyNS.MyService.someFunction(arg1, arg1,function(response){
					alert(response);
				})
			</script>
		  (end)
		  
		  
	*/
	Myna.WebService.prototype.printExtApi=function(req){
		var f = this.spec.functions;
		var API ={
			url:$server.requestServerUrl+$server.currentUrl+$server.scriptName +"?ext-route",
			type:"remoting",
			actions:{}
		}
		if ("ns" in $req.data){
			API.namespace=$req.rawData.ns
		}
		
		API.actions[this.spec.name]=f.getKeys().map(function(method){
			return {
				name:method,
				len:f[method].params.length
			}
		})
		 
		if ("scriptvar" in $req.data){
			if (!$req.data.scriptvar.length) {
				throw new SyntaxError("A value for scriptvar must be defined");
			}
			
			$res.setContentType("text/javascript");
			$res.clear();
			if ("ns" in $req.data){
				$res.print("Ext.ns('"+$req.rawData.ns+"');"+$req.rawData.ns+".");
			}
			$res.print($req.rawData.scriptvar +"=" +API.toJson());
		} else {
			$res.setContentType("application/json");
			$res.clear();
			$res.print(API.toJson());
		}
	}
/* Function: executeJsonRpcPost
	parses the supplied JSON-RPC request data, executes that requested funtion, and  
	prints a JSON-RPC response text
	
	Parameters:
		dataString	-	String object containing the JSON-RPC request
	
	*/
	Myna.WebService.prototype.executeJsonRpcPost=function(dataString){
		var ws = this;
		var r ={
			version:"1.1"
		}	
		try{
			
			var req = dataString.parseJson();
			if (req.id) r.id = req.id;
			if (req.version && req.version > 1.1){
				throw new Error("Only JSON-RPC 1.0 and 1.1 clients are supported")
			}
			
			if (!req.method){
				throw new Error("Please supply a method to invoke")
			}
			var requestPath = 	$server.requestServerUrl
								+$server.requestUrl
								+$server.requestScriptName;
			
			if (req.method == "system.describe"){
				r = {
					sdversion:"1.0",
					name:ws.spec.name,
					id:requestPath,
					summary:ws.spec.desc,
					address:requestPath+"?json-rpc",
					procs:ws.spec.functions.getKeys().map(function(key){
						var f = ws.spec.functions[key];
						return {
							name:key,
							summary:f.desc,
							params:f.params.map(function(param){
								var p= {
									name:param.name	
								}
								switch(param.type){
									case "string":
										p.type="str";
									break;
									case "numeric":
										p.type="num";
									break;
									default:
										p.type="any";
									
								}
								return p;
							}),
							returns:(function(){
								var type;
								if (!f.returns) return "nil";
								
								switch(f.returns){
									case "string":
										type="str";
									break;
									case "numeric":
										type="num";
									break;
									default:
										type="any";
									
								}
								if (type=="any"){
									if (f.returns instanceof Array){
										type="arr";
									} else if (typeof f.returns == "object"){
										type="obj";
									}
								}
								return type;
							})()
						}
					})
				}
				
			} else {
				var handlerName= req.method;
				var f = ws.spec.functions[handlerName];
				if (!f) throw new Error("method '" 
					+req.method+"' is not available in this service");
				
				var params;
				if (req.params){
					if (req.params instanceof Array){
						params = req.params;	
					} else if (typeof req.params == "object"){
						params = f.params.map(function(param,index){
							if (param.name in req.params){
								return req.params[param.name];
							} else if (index in req.params){
								return 	req.params[index];
							} else return null;
						})
					}
				}
				//r.result = f.handler.apply(f.scope?f.scope:f,params)
				r.result =ws.executeFunctionHandler(req.method,f,params)
			}
			
		} catch(e){
			$res.setStatusCode(500)
			Myna.log("error","Error: " +this.spec.name ,Myna.formatError(__exception__));
			r.error = {
				name:"JSONRPCError",
				code:100,
				message:e.message,
				error:__exception__,
			}
			r.error.htmlDetail = Myna.formatError(__exception__);
			
		}
		$res.setContentType("application/json");
		
		$res.clear();
		Myna.print(r.toJson())
		
	}
/* Function: executeJsonMyna
	parses the supplied JSON-MYNA request data, executes that requested funtion, and  
	prints a JSON response text
	
	Parameters:
		dataString	-	String object containing the JSON-RPC request
	
	*/
	Myna.WebService.prototype.executeJsonMyna=function(data){
		var ws = this;
		var result;
		try{
			data.checkRequired(["method"]);
			var handlerName= data.method;
			var f = ws.spec.functions[handlerName];
			if (!f) throw new Error("method '" 
				+data.method+"' is not available in this service");
			
			var params=[];
		
			if ("params" in f){
				params = f.params.map(function(param,index){
					if (param.name in data){
						if (param.type instanceof Array && param.name +"$array" in data){
							return data[param.name +"$array"];	
						} else if (typeof param.type == "object" && param.name +"$object" in data){
							return data[param.name +"$object"];
						} else if (param.type == "numeric"){
							if (data[param.name] =="" || data[param.name] === null) return null;
							return parseFloat(data[param.name])
						} else if (param.type == "date"){
							if (data[param.name] =="" || data[param.name] === null) return null;
							return new Date(data[param.name])
						} else return data[param.name];
					
					} else return null;
				})
			}
			result =ws.executeFunctionHandler(data.method,f,params)
			
		} catch(e){
			result={
				success:false,
				message:e.message,
				detail:Myna.formatError(__exception__)
			}
			
		}
		$res.setContentType("application/json");
		
		$res.clear();
		if (typeof f.returns == "string"){
			if (f.returns =="numeric"){
				$res.print(parseFloat(result))
			} else if (f.returns =="date"){
				$res.print(new Date(result).getTime());
			} else if (f.returns =="string"){
				$res.print(String(result).toJson());	
			}
		} else $res.print(result.toJson()) 
		
		
	}

/* Function: executeXmlRpc
	parses the supplied XML-RPC request xml, executes that requested funtion, and  
	prints a XML-RPC response text
	
	Parameters:
		xml	-	XML object containing the XML-RPC request
	
	*/
	Myna.WebService.prototype.executeXmlRpc=function(xml){
		var ws = this;
		var response=<methodResponse>
				<params>
					<param>
						<value/>
					</param>
				</params>
			</methodResponse>
		try{
			var params=[];
			var value;
			for each (var paramXml in xml..param){
				if (!(paramXml instanceof XML)) continue;
				params.push((function(paramXml){
					value = String(paramXml.value.child(0));
					switch(paramXml.value.child(0).localName()){
						case "i4":
						case "int":
							params.push(parseInt(value))
						break;
						case "double":
							params.push(parseFloat(value))
						break;
						case "boolean":
							params.push(!!value)
						break;
						case "dateTime.iso8601":
							if(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(-\d\d:\d\d|Z)/.test(value.toUpperCase())){
								value = Date.parseDate(value,"Y-m-d\\TH:i:so");
							} else if(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d.\d{3}(-\d\d:\d\d|Z)/.test(value.toUpperCase())){
								value = Date.parseDate(value,"Y-m-d\\TH:i:s.uo");
							}
							params.push(value)
						break;
					}
				})(paramXml))
			}
			var handlerName = xml..methodName.toString();
			var f= ws.spec.functions[handlerName]
			
			if (!f) throw "No method '" +xml..methodName.toString()+ "' defined in this service";
			
			//var result = f.handler.apply(f.scope?f.scope:f,params)
			var result =ws.executeFunctionHandler(handlerName,f,params)
			var parseResult = function(part){
				var result;
				if (part instanceof Array){
					result = <array/>
					part.forEach(function(element){
						result.appendChild(parseResult(element))
					})
					return result;
				}
				if (part instanceof Date){
					return <dateTime.iso8601>{part.format("Y-m-d\\TH:i:so")}</dateTime.iso8601>
				}
				if (typeof part == "object"){
					result = <struct/>
					part.getKeys().forEach(function(key){
						if (key){
						result.appendChild(<member>
							<name>{key}</name>
							<value>{parseResult(part[key])}</value>
						</member>)
						}
					})
					return result;
				}
				if (typeof part == "string"){
					if (parseInt(part) == part){
						return <int>{part}</int>;	
					}
					if (parseFloat(part) == part){
						return <double>{part}</double>;
					}
					
				}
				return <string>{part}</string>;	
			}
			response..value.appendChild(parseResult(result));
			
			
		
		} catch(e){
			$res.setStatusCode(500)
			response=<methodResponse>
				<struct>
					<member>
						<name>faultCode</name>
						<value><int>4</int></value>
					</member>
					<member>
						<name>faultString</name>
						<value><string>{e.message}{Myna.formatError(__exception__)}</string></value>
					</member>
				</struct>
			</methodResponse>
			/* response..string.appendChild(new XML("<![CDATA[" + Myna.formatError(__exception__) + "]]>")); */
			/* response..string.appendChild(<![CDATA[]]>);
			response..string.child(0) = Myna.formatError(__exception__); */
	
		}
		$res.setContentType("text/xml");
		
		$res.clear();
		Myna.print('<?xml version="1.0"?>' + response.toXMLString());
		
	}

/* Function: executeSoap
	parses the supplied SOAP request XML, executes that requested funtion, and  
	prints a SOAP response envelope  
	
	Parameters:
		xml		-	XML object containing the SOAP request
	
	*/
	Myna.WebService.prototype.executeSoap=function(xml){
		$res.setContentType("text/xml")
		var ws = this;
		var soapenv = ws.soapenv;
		var soapenc = ws.soapenc;
		var mynasoap=ws.mynasoap;
		var xsi=ws.xsi
		var impl=ws.impl;
		var body = xml..soapenv::Body;
		var fname = body.child(0).localName();
		var f = this.spec.functions[fname];
		var response =
			<soapenv:Envelope
				xmlns:mynasoap={mynasoap}
				xmlns:xsi={xsi}
				xmlns:soapenv={soapenv}
				xmlns:impl={impl}
				s:encodingStyle={soapenc}
			>  
				<soapenv:Body><impl:{fname +"Response"} /></soapenv:Body>
			</soapenv:Envelope>
		try{
			var params=[]
			f.params.forEach(function(def){
				if (!eval("body..*::" +def.name)){
					throw new Error("Required parameter '" + def.name + "' was not provided")
				}
				var value = String(eval("body..*::" +def.name));
				switch(def.type){
					case "date":
						value = Date.parseDate(value,"Y-m-d");
					break;
					case "date_time":
						/* different venders have different opions on the iso time format */
						if(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(-\d\d:\d\d|Z)/.test(value.toUpperCase())){
							value = Date.parseDate(value,"Y-m-d\\TH:i:so");
						} else if(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d.\d{3}(-\d\d:\d\d|Z)/.test(value.toUpperCase())){
							value = Date.parseDate(value,"Y-m-d\\TH:i:s.uo");
						}// else value =null;
					break;
					case "numeric":
						value = parseFloat(value);
					break;
				}
				params.push(value)
			})
			/* for each (var tag in body.child(0).*){
				if (tag.toXMLString){
					params[tag.localName()] = tag.toString();
				}
			} */
			
			var result = <impl:result xmlns:impl={impl}/>
			var parseResultPart = function(tagName,xmlPart, specPart, valuePart){
				var args = Array.prototype.slice.call(arguments,0)
				args[1] = args[1].toXMLString().escapeHtml(); 
				/* string */
					if (typeof specPart == "string"){
						switch(specPart){
							case "string":
								valuePart = String(valuePart);
							break;
							case "numeric":
								valuePart = parseFloat(valuePart);
							break;
							case "date":
								valuePart =  new Date(valuePart).format(p)
							break;
							case "date_time":
								valuePart =  new Date(valuePart).format(p)
							break;
						}
						xmlPart.appendChild(
							<impl:{tagName} 
								xmlns:impl={impl} 
								xmlns:xsi={xsi}
								xsi:type={ws.getSchemaType(specPart)}
								>{valuePart}</impl:{tagName}>
						)
					
				/* Arrays */
					} else if (specPart instanceof Array){
						var type;
						if (typeof specPart[0] == "string"){
							type= ws.getSchemaType(specPart[0]);
						} else {
							type="impl:"+tagName;
						}
						var arrayXml =
							<impl:{tagName}
								xmlns:impl={impl}	
								xmlns:xsi={xsi}
								soapenc:arrayType={type+"[]"} 
								xsi:type={"impl:ArrayOf"+tagName} 
								xmlns:soapenc={soapenc}
							/>
						
						valuePart.forEach(function(item){
							parseResultPart("item",arrayXml, specPart[0], item)
						})
						xmlPart.appendChild(arrayXml);
					
				/* Complex/custom/struct */
					} else {
						var customXml =<impl:{tagName} xmlns:impl={impl} />
						
						
						valuePart.getKeys().forEach(function(key){
							
							parseResultPart(key,customXml, specPart[key], valuePart[key])
						})
						xmlPart.appendChild(customXml);
					}
			}
			
			//parseResultPart("result",response..soapenv::Body.child(0), f.returns, f.handler.apply(f.scope?f.scope:f,params))
			parseResultPart("result",response..soapenv::Body.child(0), f.returns, ws.executeFunctionHandler(fname,f,params))
		} catch(e) {
			response.soapenv::Body = <soapenv:Body xmlns:soapenv={soapenv}/>
			response.soapenv::Body.appendChild(
				<Fault xmlns={soapenv}>
					<faultcode>soapenv:Server</faultcode>
					<faultstring>{e.message +"<br/>"+ Myna.formatError(__exception__)}</faultstring>
						
				</Fault>
			)
		}
		$res.clear();
		$res.print(response.toXMLString())
	}
/* Function: executeExtRoute
	parses the supplied EXT-ROUTE requests, executes that requested functions, 
	and prints the appropriate response
	
	
	
	*/
	Myna.WebService.prototype.executeExtRoute=function(){
		var ws = this;
		var isJson = $req.contentType == "application/json";
		var isArray=false;
		var curTid=null;
		var result;
		
		var executeRequest = function(request){
			result={
				type:'rpc',
				tid:request.tid,
				action:request.action,
				method:request.method,
			};
			
			try {
				var handlerName=request.method;
				var f = ws.spec.functions[handlerName];
				if (request.data instanceof Array){
					result.result =ws.executeFunctionHandler(request.method,f,request.data)	
				} else {// named argument object
					var params=[];
					if ("params" in f){
						params = f.params.map(function(param,index){
							if (param.name in request.data) {
								return request.data[param.name];
							} else {
								return undefined;
							}
						})
					}
					result.result= ws.executeFunctionHandler(request.method,f,params);		
				}
				return result;
			} catch(e){
				Myna.log(
					"debug",
					"Error in WebService call " + ws.spec.name ,
					Myna.formatError(__exception__) 
						+Myna.dump($req.data,"parms") 
						+ Myna.dump($req.contentText,"content")
				);
				return {
					type:'exception',
					tid:request.tid,
					message:"An error occurred",
					where:"See administrator log for details"
				}
			}
		}
		
		
		if (isJson){
			$res.setContentType("application/json");
			var request = $req.contentText.parseJson();
			
			if (request instanceof Array){
				result = request.map(function(request){
					return executeRequest(request);
				})
			} else { 
				result = executeRequest(request);
			}
			$res.clear();
			$res.print(result.toJson());
		} else {// post/upload request
			result = executeRequest({
				type:'rpc',
				tid:$req.data.extTID,
				action:$req.rawData.extAction,
				method:$req.rawData.extMethod
			});
			$res.clear();
			$res.print("<html><body><textarea>"
				+ result.toJson().replace(/"/g,'\\"')
				+"</textarea></body></html>")
		}
		
		
	}

