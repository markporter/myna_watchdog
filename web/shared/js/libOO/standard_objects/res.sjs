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
/* Function: clear
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
/* Function: getContent
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
/* Function: flush
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
		if ($server.isCommandline){
			java.lang.System.out.print($res.getContent());
			return $res.clear();
		} else if ($server.response){
			if (paddingSize==undefined) paddingSize =250; 
			var padding ="";
			
			new Array(paddingSize).forEach(function(){padding+=" "});
			try {//we don't care if flushing fails
				$server.response.getOutputStream().print(padding);
				$server.response.getOutputStream().print($res.getContent());
			
				$server.response.flushBuffer();
			} catch(e){}
			return $res.clear();	
		} else return ""
	},
/* Function: requestBasicAuth
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
		if (!$server.response) return;
		$res.setHeader("WWW-Authenticate",'Basic realm="' 
			+ (realm||"Myna Application Server") + '"');
		$res.setStatusCode(401,message||"")
	},
/* Function: setContentType
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
/* Function: setStatusCode
		returns an HTTP status code and optionally a message for this response
		
		Parameters: 
			code 	- 	Numeric HTTP status code such as 403,401,500 etc
			msg		-	*Optional default null*
						A string message to return to the browser
		
		Example:
			$res.metaRedirect("some_other_page.ejs");
	*/
	setStatusCode:function(code,msg){
		if (!$server_gateway.environment.get("response")) return;
		if (msg){
			$server_gateway.environment.get("response").sendError(code,msg);	
		} else {
			$server_gateway.environment.get("response").setStatus(code);
		}
	},
/* Function: setExitCode
		Sets an exit code (commandline mode only), and optionally sends a message 
		to standard err
		
		Parameters: 
			code 		- 	Numeric exit code. 0 is considered "OK", -1 will prevent 
							exiting 
			msg		-	*Optional default null*
							A string message print on standard error output
		
		Example:
			$res.setExitCode("1","Incorrect number of parameters")
	*/
	setExitCode:function(code,msg){
		if (msg) java.lang.System.err.println(msg)
		$server_gateway.environment.put("exitCode",String(code))
	},	
/* Function: metaRedirect
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
/* Function: redirect
		Redirect this page using HTTP 302 temporary redirect. 
		
		Note: 
			This method does NOT preserve any headers, such as cookies, sent to the 
			browser during this request. Page processing is aborted when calling 
			this function

		Security Note:
			This will only send text before the first hard return to prevent 
			header injection/split responses
		
		Parameters: 
			url - absolute url (including server) to redirect to. See 
					<$server.resolveUrl> for converting relative URLs to absolute 
					URLs 
		
		Examples:
		(code)	
			$res.redirect("http://example.com/page.html");
			$res.redirect($server.resolveUrl("fusebox.sjs?fuseaction=main"));
		(end)
	*/
	redirect:function(url){
		$res.clear()
		//protect against split responses
		url = url.split(/[\r\n]/).first()
		if ($server.response) try{$server.response.sendRedirect(url);} catch(e){}
		Myna.abort();		
	},
/* Function: redirectLogin
		Redirect this page to the central login page 
		
		
		Parameters: 
			options		-	options object, see below
			
		Options:
			callbackUrl		-	URL relative to the current directory that the user
									should return to after login.
			title				-	*Optional, default "Login"*
									Window title for login page
			providers			-	*Optional, default <Myna.Permissions.getAuthTypes> + "openid"*
									An array or comma separated list of auth_types to 
									include in the login window.
			loginPage			-	*Optional, default $server.rootUrl+"myna/auth/auth.sjs?fuseaction=login"*
									If you want to provide a customized login page, 
									indicate the URL here. Be sure that your page posts 
									to auth.sjs in the same way that dsp_login.ejs does. 
			message			-	*Optional, default ""*
									A short one-line message to display above the login 
									area 
		
		Detail:
			Myna provides a centralized authentication application that can 
			authenticate a users against any defined auth type. 
			Calling this function will send an HTTP redirect to the browser to send 
			the user to Myna's authentication page. Once the user is authenticated
			he/she will be redirected back to _callbackUrl_ and an authentication 
			cookie for your application will be generated. You can examine the 
			logged in user by calling <$cookie.getAuthUser>. Authorization can then 
			be performed via <Myna.Permissions.User.hasRight>
									
		Note:
			This function calls <Myna.abort>, so no further processing will be 
			done after a call to this function
	*/
	redirectLogin:function(options){
		options.setDefaultProperties({
			providers:["openid"].concat(Myna.Permissions.getAuthTypes()),
			title:"Login",
			loginPage:$server.rootUrl+"myna/auth/auth.sjs?fuseaction=login",
			message:""
		})
		options.checkRequired(["callbackUrl"]);
		var url = options.loginPage + 
			(/\?/.test(options.loginPage)?"&":"?") + "providers=" +
			(typeof options.providers ==="string"?options.providers.split(/,/):options.providers) +
			"&title=" + options.title +
			"&callback=" + options.callbackUrl+
			"&message=" + options.message
		$res.metaRedirect(url);
		//Myna.print("<a href ='" + url +"'>"+options.title+"</a>");
		//Myna.abort();
	},
/* Function: redirectWithToken
	redirect to a URL, including an auth_token for the current user.
	
	Parameters:
		url	-	url to redirect to

	*/
	redirectWithToken:function(url){
		var urlArray = url.split(/\?/);
		url = urlArray[0];
		var query;
		if (urlArray.length > 1){
			query=urlArray[1] + "&auth_token=";
		} else {
			query="auth_token=";
		}
		query+=escape(Myna.Permissions.getAuthToken($cookie.getAuthUserId()));
		$res.redirect($server.resolveUrl(
			url + "?" + query
		))
	},	
/* Function: serveFile
		Efficiently serves a file on the filesystem. 
		
		Parameters: 
			file 				-  a Myna.File, java.io.File, or MynaPath to a file to serve 
									to the client
		
		Detail:
			This function replaces the normal output of this response with the contents 
			of _file_. Executing this function after a call to <$res.flush> will likely 
			fail or corrupt the file. This function is appropriate for for large 
			file downloads as it supports resuming.
			
		Note:
			When this function returns, the file may not have been downloaded yet. 
			This is because some browsers/downloaders have advanced multi-threaded
			download support, so you should plan for this request to be 
			called several times in parallel. Also if the client pauses and resumes 
			the download you may get multiple calls. 
		
	*/
	serveFile:function(file){
	
		file = new Myna.File(file);
		
		var codes =javax.servlet.http.HttpServletResponse;
		var ranges=[];
		if (!file.exists()){
			$application._onError404()
			Myna.log("404","$res.serveFile: file " + file + " does not exist",Myna.dump($req.data));
			/*throw new Error("Filename does not exist"); */
			return;
		}
		$server_gateway.requestHandled=true;
		
		//clear any existing content
		$res.clear();
		
		var fs = new net.balusc.webapp.FileServer(
			file.javaFile,
			$server.servlet,
			$server.request,
			$server.response
		)
		fs.serve($server_gateway.type != "HEAD");
		
		Myna.abort();
	},
	serveFile2:function(file,options){
		if (!options) options={}
		options.setDefaultProperties({
			contentType:null,
			downloadName:null,
			headers:null
		})
		file = new Myna.File(file);
		
		var codes =javax.servlet.http.HttpServletResponse;
		var ranges=[];
		if (!file.exists()){
			Myna.log("error","$res.serveFile: file " + file + " does not exist",Myna.dump($req.data));
			throw new Error("Filename does not exist");
			return;
		}
		$server_gateway.requestHandled=true;
		
		//clear any existing content
		$res.clear();
		var ETag = file.fileName 
						+ "_" + file.size + "_" 
						+ Math.floor(file.lastModified.getTime()/1000);
		
		/* header checks, if supplied*/
		if (options.headers){
			var ifNoneMatch = options.headers["If-None-Match"];
			if (ifNoneMatch == ETag) {
				$res.setHeader("ETag", ETag); 
				$res.setStatusCode(codes.SC_NOT_MODIFIED);
				return;
			}
	
			var ifModifiedSince = options.headers["If-Modified-Since"];
			if (ifModifiedSince && ifModifiedSince + 1000 > file.lastModified) {
				$res.setHeader("ETag", ETag); 
				$res.setStatusCode(codes.SC_NOT_MODIFIED);
				return;
			}
			var ifMatch = options.headers["If-Match"];
			if (ifMatch && ifMatch != ETag) {
				$res.setStatusCode(codes.SC_PRECONDITION_FAILED);
				return;
			}
	
			var ifUnmodifiedSince = options.headers["If-Unmodified-Since"];
			if (ifUnmodifiedSince && ifUnmodifiedSince + 1000 <= file.lastModified.getTime()) {
				$res.setStatusCode(codes.SC_PRECONDITION_FAILED);
				return;
			}
			//Get ranges
			var range = options.headers["Range"];
			if (range){
				range =String(range);
				// Range header should match format "bytes=n-n,n-n,n-n...". If not, then return 416.
				if (!range.match(/^bytes=\d*-\d*(,\d*-\d*)*$/)) {
					$res.setHeader("Content-Range", "bytes */" + file.size); 
					$res.setStatusCode(codes.SC_REQUESTED_RANGE_NOT_SATISFIABLE);
					return;
				}
				// If-Range header should either match ETag or be greater then LastModified. If not,
				// then return full file.
				var ifRange = options.headers["If-Range"];
				if (!ifRange || ifRange !=ETag) {
					var ifRangeTime = options.headers["If-Range"];
					if (!ifRangeTime || ifRangeTime + 1000 >= file.lastModified) {
						range.after(6).split(",").forEach(function(part){
							// Assuming a file with length of 100, the following examples returns bytes at:
							// 50-80 (50 to 80), 40- (40 to length=100), -20 (length-20=80 to length=100).
							var rangeParts = part.split(/-/)
							var start = rangeParts[0]
							var end = rangeParts[1]
		
							if (start == "") {
								start = file.size - end;
								end = file.size - 1;
							} else if (end == "" || end > file.size - 1) {
								end = file.size - 1;
							}
		
							// Check if Range is syntactically valid. If not, then return 416.
							if (start > end) {
								$res.setHeader("Content-Range", "bytes */" + file.zise); // Required in 416.
								$res.setStatusCode(codes.SC_REQUESTED_RANGE_NOT_SATISFIABLE);
								return;
							}
		
							// Add range.
							ranges.push({
								start:parseInt(start), 
								end:parseInt(end),
								length:parseInt(end) - parseInt(start) + 1,
								total:file.size
							});
						})
					}
				}
			}
		}
		//get content type
		if (!options.contentType) {
			options.contentType=$server.servlet
							.getServletContext()
							.getMimeType(file.javaFile.toString());
			if (!options.contentType) {
				options.contentType ="application/octet-stream";
			}
		}
		
		$res.setHeader("ETag", ETag); 
		if (options.downloadName){
			$res.setHeader("Content-disposition", 'attachment; filename="'+options.downloadName+'"');
		}
		$server.response.setDateHeader("Last-Modified", file.lastModified.getTime());
		$res.setHeader("Accept-Ranges", "bytes");
		
		if (ranges.length){
			var output = $server.response.getOutputStream();
			var input = new java.io.RandomAccessFile(file.javaFile, "r");
			ranges.forEach(function(r,index){
				$res.setStatusCode(codes.SC_PARTIAL_CONTENT);
				if (ranges.length ==1){
					$res.setHeader("Content-Range", "bytes " + r.start + "-" + r.end + "/" + r.total);
					$res.setHeader("Content-Length", r.length);
					$res.setContentType(options.contentType);
				} else {
					var boundry="MULTIPART"
					$res.setContentType("multipart/byteranges; boundary="+boundry);
					output.println();
					output.println("--" + boundry);
					output.println("Content-Type: " + options.contentType);
					output.println("Content-Range: bytes " + r.start + "-" + r.end + "/" + r.total);
					
				}
				
				var buffer = Myna.JavaUtils.createByteArray(4*1024);
				var read=0;
				var remaining = r.length;
				input.seek(r.start)
				while ((read = input.read(buffer)) > 0) {
					if ((remaining -= read) > 0) {
						output.write(buffer, 0, read);
					} else {
						output.write(buffer, 0, remaining + read);
						break;
					}
				}
				if (ranges.length >1){
					output.println();
					output.println(("--" + boundry + "--").toJava());
				}
				
			})
		} else {
			$server.response.setContentLength(file.size);
			$res.setContentType(options.contentType);
			Myna.JavaUtils.streamCopy(
				file.getInputStream(),
				$server.response.getOutputStream(),
				true
			);
		}
		
	
	},	
	
	
/* Function: setHeader
		sets a header to return to the browser
		
		Parameters: 
			name 	-  	Header name
			value	-	(String or Date) 
						Header value. If a date, it will be formated to the 
						appropriate format for HTTP headers
		
			
		Example:
			$res.setHeader("Content-disposition", 'attachment; filename="result.xls"');

		Security Note:
			This will only set text before the first hard return to prevent 
			header injection/split responses
	*/
	setHeader:function(name,value){
		if ($server.response) {
			if (value instanceof Date){
				$server.response.setDateHeader(name,value.getTime());
			} else {
				//protect against header injection
				value = value.split(/[\r\n]/).first()
				$server.response.setHeader(name,value);
			}
		}
	},
/* Function: printBinary
		sends binary data to the browser
		
		Parameters: 
			data 		-  	Binary data from <Myna.File.readBinary> or from binary 
							database query (byte [])
							
			contentType -	*Optional, default application/octet-stream* MIME type of 
							the binary data. If "" or null, the default will be used
							
			filename	-	*Optional, default null* if defined, a "Content-disposition"
							response header is set to present the standard "Save or Open?" 
							dialog to the client. Use this if offering a file for download, 
							but not if you expect the content to be rendered inline 
		
		Detail:
			This function replaces the normal output of this response with the contents 
			of _data_. Executing this function after a call to <$res.flush> will likely 
			fail or corrupt the file.
			
		Example:
			(code)
			var bytes = new Myna.File("path_to_doc.pdf").readBinary();
			$res.printBinary(bytes,"application/pdf","result.pdf");
			(end)
		See Also:
			* <serveFile>
	*/
	printBinary:function(data,contentType,filename){
		if (!contentType || contentType=="") contentType="application/octet-stream";
		
		$res.setContentType(contentType);
		$server.response.setContentLength(data.length);
		if (filename){
			$res.setHeader("Content-disposition", 'attachment; filename="'+filename+'"');
		}
		var writer = $server.response.getOutputStream();
		writer.write(data,0,data.length);
	},
/* Function: print
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