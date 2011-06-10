/* 	Class: $req
	Global object that contains properties related to the current 
	request. 
*/ 
var $req={
/* Property: authUser
		If a  "Basic" auth token is supplied ion the header, this function 
		will return the username part, otherwise "".
	*/
	get authUser(){
		if ("Authorization" in $req.headers 
			&& $req.headers.Authorization[0].listFirst(" ") == "Basic"
		){
			var decoder = Packages.org.apache.commons.codec.binary.Base64;
			var token = $req.headers.Authorization[0].listLast(" ");
			token = String(new java.lang.String((decoder.decodeBase64(new java.lang.String(token).getBytes()))));
			return token.listFirst(":");
		} else {
			return "";	
		}
	},
/* Property: authPassword
		If a  "Basic" auth token is supplied ion the header, this function 
		will return the password part, otherwise "".
	*/
	get authPassword(){
		if ("Authorization" in $req.headers 
			&& $req.headers.Authorization[0].listFirst(" ") == "Basic"
		){
			var decoder = Packages.org.apache.commons.codec.binary.Base64;
			var token = $req.headers.Authorization[0].listLast(" ");
			token = String(new java.lang.String((decoder.decodeBase64(new java.lang.String(token).getBytes()))));
			return token.listLast(":");
		} else {
			return "";	
		}
	},
/* Property: data
		Stores parameters to the request. 
		
		Detail:
			Every parameter in the HttpServletRequest is copied as a 
			lowercase property of the _data_ object. 
			
			If a parameter is passed multiple times, this property will the last 
			passed value of the parameter. In addition, 
			a property called <paramName>$array is created. This property 
			contains an array of all the values of that parameter name, in the 
			order they were passed. This parameter is created even if only one 
			value is passed
			
			If a parameter value can be interpreted as JSON, a property 
			called <paramName>$object is created by calling 
			<String.parseJson> against the value. If there are multiple
			JSON valid objects, only the last will be stored in 
			parameter_name$object, but a property called parameter_name$objectArray
			is populated with every object created.
			
			If a parameter contains dots (.) then is is presumed to be a property 
			path and is interpreted via <Object.setByPath>. Thus a parameter called
			"Users.336642.firstName" can be accessed at $req.data.Users["336642"].firstName
			
			_data_ parameters created via setByPath are not filtered through  
			<String.escapeHtml> as described below
			
			Every value in _data_.<paramName> and _data_.<paramName>$array 
			is escaped via <String.escapeHtml>. This helps to protect 
			against Cross-Site Scripting (XSS) and SQL injection. To access
			un-altered parameter data, see <rawData>
			
		File Upload Fields:
			File uploads produce an object in $req.data containing 
			information about the upload that looks like this
			(code)
			$req.data.<fieldname> ={
				diskItem: org.apache.commons.fileupload.disk.DiskFileItem,
				stats:{
					fieldName:String, name of field in form,
					fileName:String, name of file on client side,
					contentType:String, mime type,
					isInMemory:boolean, true if file contents are in memory,
					sizeInBytes:int, size in bytes,
					diskLocation:String, the current location of the uploaded file
				}
			}
			(end)
			
			multiple uploads with the same fieldname are stored in 
			$req.data.<fieldname>$array.
			
			Upload progress can be tracked  in a separate request/Thread via 
			(code)
				var progress=$session.get("$uploadProgress");
			(end)
			
			which returns a progress object.
			
			Progress Object properties:
			fileNumber			-	File number currently being uploaded
			bytesRead				-	Bytes uploaded so far for this file
			totalBytes			-	Total bytes to be uploaded for this file
			percentComplete		-	Percent complete as a ratio, from 0 to 1
			kps						-	Upload rate in KiloBytes Per Second. Multiply this 
										by 8 to get KiloBits per second 
			message				-	Generic message in the form of 
										"Uploading file #1, 10% complete (200 KBps)"; 
			elapsedSeconds		-	total time in seconds since upload processing 
										started
			
			
			
	*/
	data:{},
/* Property: handled
	set this to true to prevent requested page from processing
*/
	handled:false,
/* Property: headers
		a JavaScript Object where the properties are header names and the 
		property values are an array of strings containing each of request 
		header's values.
		
		Note:
			Each header is keyed by how it appeared in the header, and as 
			lowercase. This is because not every server formats header names the 
			same. This means that if you are looking for a specific header, it is 
			better to use 
			
			(code)
			if ("user-agent" in $req.headers)
			(end)
			rather than
			(code)
			if("User-Agent" in $req.headers)
			(end)
			
			To avoid confusion when looping over key names, the lowercase key names 
			are hidden and do not show up in Myna.dump() or $req.headers.getKeys()
	*/
	get headers(){
		var result={};
		try{
			var headerNames = Myna.JavaUtils.enumToArray($server.request.getHeaderNames());
			headerNames.forEach(function(name){
				//try to detect date headers
				try {
					result[name] = new Date($server.request.getDateHeader(name));
				} catch (e){
					var values =Myna.JavaUtils.enumToArray($server.request.getHeaders(name))
					if (values.length == 1){
						values = String(values[0]).split(/,/)
					} else {
						values  = values.map(function(value){return String(value)})
					}
					
					result[name] =values;
					result[name.toLowerCase()]=result[name];
					result.hideProperty(name.toLowerCase());
				}
			});
		} catch(e){}
		return result;
	},
/* Property: timeout
		The maximum time in seconds this request should be allowed to run.
		see "Default Request Timeout" in the administrator under General Settings. 
		a value of 0 disables the timeout.
	*/
	get timeout(){
		return $server_gateway.requestTimeout;
	},
	set timeout(val){
		$server_gateway.requestTimeout = parseInt(val);
	},
/* Property: type
		The type of http request. One of GET,POST,PUT or DELETE.
	*/
	get type(){
		return String($server.servlet.type);
	},
/* Property: rawData
		Stores raw parameters to the request. 
		
		Detail:
			This property contains the same content as <data>, but without 
			any filtering through <String.escapeHtml>. Be very careful 
			displaying this data in a web page as it may expose your site to
			Cross Site Scripting (XSS) exploits
	*/
	rawData:{},
/* Property: id
		A unique identifier for this request  
	*/
	id:Myna.createUuid(),
/* Property: paramNames
		A array of the parameter names passed to this request  
	*/
	paramNames:[],
	
/* Property: contentText
		content of the request body as a string 
		
	*/
	get contentText(){
		if (!this._contentText && $server.request.getContentLength() >0){
			try{
				this._contentText = Myna.JavaUtils.readerToString($server.request.getReader())
			} catch (e){return e.toString()}
		} 
		if (this._contentText) return this._contentText
		else return ""
	},
	
/* Property: contentType
		content type of the request 
		
	*/
	get contentType(){
		return String($server.request.getContentType()).listFirst(";");
	},
	
/* Property: contentXml
		content of the request body as an XML() object 
		
	*/
	get contentXml(){
		return new XML($req.contentText)
	},
	
/* Property: contentByteArray
		content of the request body as a Java byte[] 
		
	*/
	get contentByteArray(){
		if ($server.request.getContentLength() >0){
			try{
				return Myna.JavaUtils.streamToByteArray($server.request.getInputStream())
			} catch (e){return e.toString()}
		}else return Myna.JavaUtils.createByteArray(0);
	},
	
}

	
