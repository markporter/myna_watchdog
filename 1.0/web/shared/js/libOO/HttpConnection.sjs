
/* 
	Class: Myna.HttpConnection
	Connects to HTTP resources
	
	Example:
	(code)
		var h = new Myna.HttpConnection({
			url:"http://www.google.com/search?q=myna+javascript",
			method:"GET",
			parameters:{
				um:"1", //this looks in google groups instead of web search
			},
		})
		try {
			h.connect();
		
			Myna.dump(h.getStatusCode(),"Status")
			Myna.print(Myna.dump(h.responseHeaders,"headers"))
			Myna.print(h.url)
			Myna.print(h.getResponseText())
		} catch(e){
			Myna.print(Myna.formatError(e) + Myna.dump(h))
		}
	(end)
*/
if (!Myna) var Myna={}

/* Constructor: Myna.HttpConnection
	Constructor function for HttpConnection class
	
	Parameters:
		options		-	Object that describes the options for this connection.
							See below.
	Options:
		url				-	URL to connect to. The query string can be appended. 
							Example: http://www.google.com/search?q=myna+javascript
							
		method			-	*Optional default "GET"* 
							http method to use, one of GET,POST,PUT,DELETE
							
		parameters	-	*Optional default null* 
							Object representing parameters to pass to the 
							connection. These are handled diffrently depending on 
							method:
							* *POST:* these are the post parameters,
							* *GET and PUT:* these are the URL parametrers, unless 
								that parameter is already specified in the URL.
							* *DELETE:* parameters are ignored 
						
		headers		-	*Optional default null* Object representing headers to 
							send with this request     
							
		content		-	*Optional default null*     
							For POST and PUT types, this is the content to send in the 
							body of the request. Currently, this is expected to be a 
							UTF-8 String.
							
		contentType	-	*Optional default "text/plain"* 
							content type of posted content
							
		username		-	*Optional default null* 
							username to send in a "Basic" auth header
							
		password		-	*Optional default null* 
							password to send in a "Basic" auth header
	
	Returns:							
		Reference to HttpConnection instance
*/
Myna.HttpConnection = function(options){
	importPackage(Packages.org.apache.commons.httpclient);
	options.checkRequired(["url"]);
	options.setDefaultProperties({
		method:"GET",
		parameters:{},
		headers:{},
		content:null,
		charset:"UTF-8",
		contentType:"text/plain"
	})
	options.applyTo(this);
	/* Property: responseHeaders
		object containing the response headers. 
	*/
	this.responseHeaders={}
	//var conMan = new MultiThreadedHttpConnectionManager();

	this.client = new HttpClient();
}

/* Function: connect
	connects to an HTTP           
	
*/
Myna.HttpConnection.prototype.connect=function(){
	importPackage(Packages.org.apache.commons.httpclient.methods);
	var con = this;
	var url_params = this.url.match(/[?|&][^?&]+/g)
	
	var params = this.method.toUpperCase() =="POST"?{}:this.parameters;
	if (url_params){
		url_params.forEach(function(pair){
			var matches =pair.match(/[?|&](\w+)=?(.*)/)
			if (matches){
				if (matches.length ==3){
					params[matches[1]] = matches[2]; 
				} else {
					params[matches[1]] = "";	
				}
			}
		});
	} 
	this.url =  params.getKeys().reduce(function(base,key,index){
		if (index==0){
			base+="?";	
		} else{
			base+="&"
		}
		base+=key;
		if (String(params[key]).length){
			base+="="+String(params[key]);	
		}
		return base;
	},this.url.listFirst("?"));
	
	switch(this.method.toUpperCase()){   
	/* GET */
		case "GET":                                  
			this.methodHandler = new GetMethod(this.url);
		break;    
	/* POST */       
		case "POST":
			con.methodHandler = new PostMethod(this.url);
			var nvp = [];
			con.parameters.getKeys().forEach(function(key){
				nvp.push(new NameValuePair(key,con.parameters[key]))
				//con.methodHandler.addParameter(key,String(con.parameters[key]))
			})
			con.methodHandler.setRequestBody(nvp)
			if (con.content){
				con.methodHandler.setRequestEntity(new StringRequestEntity(con.content,con.contentType,con.charset));
			}
		break;  
	/* PUT */
		case "PUT":
			con.methodHandler = new PutMethod(this.url);
			if (con.content){
				con.methodHandler.setRequestEntity(new StringRequestEntity(con.content,con.contentType,con.charset));
			}
		break; 
	/* DELETE */
		case "DELETE":
			con.methodHandler = new DeleteMethod(this.url);
			
		break;
	}
	con.headers.getKeys().forEach(function(key){
		con.methodHandler.setRequestHeader(key, con.headers[key]);
	})
	if (con.username){
		con.client.getState().setCredentials(
            new Packages.org.apache.commons.httpclient.auth.AuthScope(
				con.methodHandler.getURI().getHost(),
				con.methodHandler.getURI().getPort()
			),
            new Packages.org.apache.commons.httpclient.UsernamePasswordCredentials(
				con.username, 
				con.password
			)
        );
		con.methodHandler.setDoAuthentication(true);
	}
	
	con.client.executeMethod(this.methodHandler);
	
	con.methodHandler.getResponseHeaders().forEach(function(header){
		var headerParts=String(header.toString()).match(/(\S+)\s*:\s*(.*)/);
		if (headerParts){
			if (headerParts[1] in con.responseHeaders){
				con.responseHeaders[headerParts[1]] +="; " + headerParts[2]
			} else {
				con.responseHeaders[headerParts[1]] = headerParts[2]
			}
		}
	});

	
	
	var method = this.methodHandler;
	this.responseText = null;
	this.statusCode = null;
	$application.closeArray.push({
		close:function(){
			try {
				/* var stream = method.getResponseBodyAsStream();
				var string = Myna.JavaUtils.streamToString(stream);
				stream.close() */
				//method.getResponseBody();
				method.releaseConnection();
			} catch(e){}
			
		}
	})
}

/* Function: getResponseText
	returns http response body as text 
	
*/
Myna.HttpConnection.prototype.getResponseText=function(){
	if (!this.responseText){ 
		var method = this.methodHandler;
		var stream = method.getResponseBodyAsStream();
		var string="";
		if (stream){
			this.responseText = String(Myna.JavaUtils.streamToString(stream));
			stream.close()
		}
		
		this.methodHandler.releaseConnection();
	}
	return this.responseText;
}

/* Function: getResponseXml
	returns http response body as an E4X XML object 
	
	See:
	*	https://developer.mozilla.org/en/e4x
	*  http://www.faqts.com/knowledge_base/index.phtml/fid/1762
*/
Myna.HttpConnection.prototype.getResponseXml=function(){
	if (!this.responseText){ 
		var method = this.methodHandler;
		var stream = method.getResponseBodyAsStream();
		var string="";
		if (stream){
			this.responseText = String(Myna.JavaUtils.streamToString(stream));
			stream.close()
		}
		
		this.methodHandler.releaseConnection();
	}
	return String(this.responseText).toXml();
}

/* Function: getResponseData
	returns http response body as a byte array
	
*/
Myna.HttpConnection.prototype.getResponseData=function(){
	if (!this.responseData){ 
		var method = this.methodHandler;
		var stream = method.getResponseBodyAsStream();
		if (stream){
			this.responseData = Myna.JavaUtils.streamToByteArray(stream);
			stream.close()
		}
		
		this.methodHandler.releaseConnection();
	}
	return this.responseData;
	//return this.methodHandler.getResponseBody();
}

/* Function: getResponseStream
	returns http response body as a stream
	
*/
Myna.HttpConnection.prototype.getResponseStream=function(){
	var method = this.methodHandler;
	var stream = method.getResponseBodyAsStream();
	$application.addOpenObject(stream);
	return stream;
}

/* Function: getStatusCode
	returns http response status code
	
*/
Myna.HttpConnection.prototype.getStatusCode=function(){
	return this.methodHandler.getStatusCode();
}