/* 	Class: $res
	Global object for managing the servlet response.
	
	All content produced via <$res.print> or <Myna.print> is appended to an 
	internal response buffer. This content is nomally sent to the browser 
	at the end of the request. By using the content maniplulation functions 
	in this object (<getContent>, <clear> and <print>) you can alter content 
	before it reaches the browser. 
	
	Note that <flush> sends content to the browser immediately and resets the 
	buffer.
*/
var $res = {
/* 	Function: clear
		Clears response buffer and returns the previous contents.
		
		Returns:
			Response content before it wwas cleared
			
		Detail:
			Response content created by <$res.print> is buffered internally. This function clears
			that buffer and returns it's previous contents.
			
		See:
			<$res.print>, <$res.getContent>
	*/
	clear:function (){
		var currentContent;
			currentContent =String($server_gateway.generatedContent.toString());
			$server_gateway.generatedContent.setLength(0);
		return currentContent;
		
	},
/* 	Function: getContent
		Returns current response buffer contents.
		
		Returns:
			Current response buffer contents
			
		Detail:
			Response content created by <$res.print> is buffered internally. This function returns
			the current contents of that buffer.
		
		See:
			<$res.print>, <$res.clear>
		
	*/
	getContent:function (){
		return String($server_gateway.generatedContent.toString());
		
	},
/* 	Function: flush
		Sends the current response buffer contents to the browser.
		
		Paramters:
			paddingSize	-	*Optional default 250* Number of space (" ") charcters to append 
							to encourage the browser to display the content immediately. 
		
		Returns:
			Current response buffer contents.
			
		Detail:
			Response content created by <$res.print> is buffered internally. This function 
			sends the current contents of that buffer to the browser, and then clears the 
			buffer and	returns its former contents. No changes to the HTTP response can be 
			sent after a call to flushContent, such as cookies.
		
		See:
			<$res.print>, <$res.clear>
		
	*/
	flush:function (paddingSize){
		if (!$server.response) return "";
		if (paddingSize==undefined) paddingSize =250; 
		var padding ="";
		
		new Array(paddingSize).forEach(function(){padding+=" "});
		$server.response.getWriter().print(padding);
		$server.response.getWriter().print($res.getContent());
		$server.response.flushBuffer();
		return $res.clear();
	},
/* 	Function: requestBasicAuth
		returns a "Basic" http auth request 
		
		Parameters: 
			realm 	- 	*Optional, default 'Myna Application Server'* 
						an organization or application name to indicate to the 
						user what credentials to enter
			message	-	*Optional, default null*
						A message to include withthe request. This may not be 
						shown by the browser, or may only be shown after three 
						failures
			
		Detail:
			sets the WWW-Authenticate header and returns a 401 HTTP status.
			any content sent after this function call will likely not be 
			displayed by a browser
		
		
	*/
	requestBasicAuth:function(realm, message){
		$res.setHeader("WWW-Authenticate",'Basic realm="' 
			+ (realm||"Myna Application Server") + '"');
		$res.setStatusCode(401,message||"")
	},
/* 	Function: setContentType
		sets the content MIME type of the response.
		
		Parameters: 
			type - *default 'text/html'* MIME content type string 
		Returns:
			Current response buffer contents.
			
		Detail:
			Response content created by <$res.print> is buffered internally. This function returns
			the current contents of that buffer.
		
		
	*/
	setContentType:function(type){
		if ($server.response) $server.response.setContentType(java.lang.String(type));
	},
/* 	Function: setStatusCode
		returns an HTTP status code and optionally a message for this response
		
		Parameters: 
			code 	- 	Numeric HTTP status code such as 403,401,500 etc
			msg		-	*Optional default null*
						A string message to return to the browser
		
		Example:
			$res.metaRedirect("some_other_page.ejs");
	*/
	setStatusCode:function(code,msg){
		if (msg){
			$server.response.sendError(code,msg);	
		} else {
			$server.response.setStatus(code);
		}
	},
/* 	Function: metaRedirect
		Redirect this page using META HTTP-EQUIV="refresh" tag. 
		
		Note: 
			This method preserves any headers, such as cookies, sent to the 
			browser during this request. Page processing continues after calling 
			this function.
		
		Parameters: 
			url - absolurte url to redirect to
		
		Example:
			$res.metaRedirect("http://example.com/page.html");
	*/
	metaRedirect:function(url){
		this.print('<META HTTP-EQUIV="refresh" content="0; url=' + url + '">');	
	},
/* 	Function: redirect
		Redirect this page using HTTP 302 temporary redirect. 
		
		Note: 
			This method does NOT preserve any headers, such as cookies, sent to the 
			browser during this request. Page processing is aborted when calling 
			this function
		
		Parameters: 
			url - absolute url to redirect to
		
		Example:
			$res.redirect("http://example.com/page.html");
	*/
	redirect:function(url){
		if ($server.response) $server.response.sendRedirect(url);
		Myna.abort();		
	},
	
/* 	Function: setHeader
		sets a header to return to the browser
		
		Parameters: 
			name 	-  	Header name
			value	-	Header value
		
			
		Example:
			$res.setHeader("Content-disposition", 'attachment; filename="result.xls"');
		
		
	*/
	setHeader:function(name,value){
		if ($server.response) $server.response.setHeader(name,value);
	},
/* 	Function: printBinary
		sends binary data to the browser
		
		Parameters: 
			data 		-  	Binary data from <Myna.File.readBinary> or from binary 
							database query (byte [])
							
			contentType -	*Optional, default application/octet-stream* MIME type of 
							the binary data. If "" or null, the default will be used
							
			filename	-	*Optional, default null* if defined, a "Content-disposition"
							reponse header is set to present the standard "Save or Open?" 
							dialog to the client. Use this if offering a file for download, 
							but not if you expect the content to be rendered inline 
		
		Detail:
			This function replaces the normal output of this response with the contents 
			of _data_. Executing this function after a call to <$res.flush> will likely 
			fail or currupt the file.
			
		Example:
			var bytes = new Myna.File("path_to_doc.pdf").readBinary();
			$res.printBinary(bytes,"application/pdf","result.pdf");
		
		
	*/
	printBinary:function(data,contentType,filename){
		if (!contentType || contentType=="") contentType="appplication/octet-stream";
		
		$res.setContentType(contentType);
		$server.response.setContentLength(data.length);
		if (filename){
			$res.setHeader("Content-disposition", 'attachment; filename="'+filename+'"');
		}
		var writer = $server.response.getOutputStream();
		writer.write(data,0,data.length);
	},
/* 	Function: print
		Appends content to the response buffer. 
		
		Parameters: 
			text - text to append to response buffer
			
		Returns:
			void
			
		Detail:
			Response content created by <$res.print> is buffered internally. 
			At the end of the request this content is flushed to the browser
		
		See:
			<$res.clear>, <$res.getContent>
	*/
	print:function (text){
		//Myna.log("debug","text - " + $server.isThread,text);
			$server_gateway.generatedContent.append(String(text));
	},
}