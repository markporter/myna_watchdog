var fusebox={
	login:function(data){
		data.setDefaultProperties({
			providers:["openid"].concat(Myna.Permissions.getAuthTypes()).join(),
			title:"Login"
		})
		var session_data = $session.get("_LOGIN_REQUEST_") || {}
		session_data.applyTo(data);
		
		data.providerMap ={};
		data.providers.split(/,/).forEach(function(p){
			if (p == "openid"){
				data.providerMap[p]={
					name:"OpenID: Google, Yahoo, AOL, and more",
					desc:"Select your login service:"
				}
			} else {
				var adapter = Myna.Permissions.getAuthAdapter(p);
				data.providerMap[p]={
					name:adapter.config.prettyName,
					desc:adapter.config.desc
				}
			}
		})
		data.login_page=$server.serverUrl
			+$server.requestUrl
			+$server.requestScriptName
			+"?fuseaction=login"
		$session.set("_LOGIN_REQUEST_",data)
		Myna.include("dsp_login.ejs",data);
	},
	auth:function(data,rawData){
		$session.set("auth_data",rawData);
		var SRegRequest = org.openid4java.message.sreg.SRegRequest;
		var httpReq = $server.request; 
		var httpResp = $server.response;
		if (data.provider =="openid"){
			//Myna.log("debug","openid_request",Myna.dump($req.data));
			var manager = $server_gateway.openidConsumerManager;
			
			var returnToUrl = $server.serverUrl + $server.requestUrl + $server.requestScriptName 
				+"?fuseaction=openid_return&requested_id=" + rawData.openid +"&callback=" + data.callback;
				
			// --- Forward proxy setup (only if needed) ---
			// var proxyProps = new ProxyProperties();
			// proxyProps.setProxyName("proxy.example.com");
			// proxyProps.setProxyPort(8080);
			// HttpClientFactory.setProxyProperties(proxyProps);
			
			// perform discovery on the user-supplied identifier
			try{
				var discoveries = manager.discover(rawData.openid);
				
				// attempt to associate with the OpenID provider
				// and retrieve one service endpoint for authentication
				var discovered = manager.associate(discoveries);
				
				// store the discovery information in the user's session
				//httpReq.getSession().setAttribute("openid-disc", discovered);
				
				// obtain a AuthRequest message to be sent to the OpenID provider
				var authReq = manager.authenticate(discovered, returnToUrl);
				
				var sregReq = SRegRequest.createFetchRequest();
				sregReq.addAttribute("nickname", true);
				sregReq.addAttribute("email", true);
				sregReq.addAttribute("fullname", true);
				sregReq.addAttribute("dob", true);
				sregReq.addAttribute("gender", true);
				sregReq.addAttribute("postcode", true);
				sregReq.addAttribute("country", true);
				sregReq.addAttribute("language", true);
				sregReq.addAttribute("timezone", true);
				
				// attach the extension to the authentication request
				authReq.addExtension(sregReq);
				
				
				if (! discovered.isVersion2() ) {
					 // Option 1: GET HTTP-redirect to the OpenID Provider endpoint
					 // The only method supported in OpenID 1.x
					 // redirect-URL usually limited ~2048 bytes
					 httpResp.sendRedirect(authReq.getDestinationUrl(true));
					 Myna.abort();
				} else {
					 // Option 2: HTML FORM Redirection (Allows payloads >2048 bytes)
					 var paramArray = authReq.getParameterMap().entrySet().toArray().map(function(entry){
						 return {
								key:entry.getKey(),
								value:	entry.getValue()				 
						 }
					 })
					 Myna.print(<ejs>
						<html xmlns="http://www.w3.org/1999/xhtml">
						<head>
							 <title>OpenID HTML FORM Redirection</title>
						</head>
						<body onload="document.forms['openid-form-redirection'].submit();">
							 <form name="openid-form-redirection" action="<%=authReq.getDestinationUrl(false)%>" method="post" accept-charset="utf-8">
								  <@loop array="paramArray" element="parameter">
								  <input type="hidden" name="<%=parameter.key%>" value="<%=parameter.value%>"/>
								  </@loop>
								  <button type="submit">Continue...</button>
							 </form>
						</body>
						</html>	 
						 
					 </ejs>)
				}
			} catch(e){
				Myna.log("AUTH","Failed to negotiate OpenID '" + rawData.openid + "'" ,Myna.dump($req.data));
				data.message="Unable to locate your OpenId provider."
				fusebox.login(data);
			}
		} else {
			var username = data.username || ""
			var password = data.password || ""
			//Myna.log("debug","username",username + ";"+password+Myna.dump($req.data));
			var user = Myna.Permissions.getUserByAuth(username,password,data.provider);
			if (user){
				if (rawData.callback.listLen("?")>1){
					rawData.callback+="&"
				} else {
					rawData.callback+="?"
				}
				rawData.callback+="auth_token=" + Myna.Permissions.getAuthToken(user.user_id).escapeUrl()
				$res.metaRedirect(rawData.callback);	
			} else {
				data.message="Authentication failed."
				fusebox.login({});
			}
		}
	},
	openid_return:function(data,rawData){
		Myna.log("debug","$req",Myna.dump($req.data));
		var SRegResponse = org.openid4java.message.sreg.SRegResponse;
		var SRegMessage = org.openid4java.message.sreg.SRegMessage;
		importPackage(org.openid4java.message);
		var httpReq = $server.request; 
		var httpResp = $server.response;
		var manager = $server_gateway.openidConsumerManager;
		// extract the parameters from the authentication response
		// (which comes in as a HTTP request from the OpenID provider)
		var response =
				  new ParameterList(httpReq.getParameterMap());
	
		// retrieve the previously stored discovery information
		/* var discovered = 
				  httpReq.getSession().getAttribute("openid-disc"); */
	
		// extract the receiving URL from the HTTP request
		var receivingURL = httpReq.getRequestURL();
		var queryString = httpReq.getQueryString();
		if (queryString != null && queryString.length() > 0)
			 receivingURL.append("?").append(httpReq.getQueryString());
	
		// verify the response; ConsumerManager needs to be the same
		// (static) instance used to place the authentication request
		
		var verification = manager.verify(
			$server.serverUrl + $server.requestUrl+$server.requestScriptName +"?" + httpReq.getQueryString(),
			response, null);
	
		// examine the verification result and extract the verified identifier
		var verified = verification.getVerifiedId();
		var user;
		if (verified != null) {
			var auth_data =$session.get("auth_data");
			var claimed_id = auth_data.claimed_id = $req.rawData.requested_id;
			if ("openid.claimed_id" in $req.rawData) auth_data.claimed_id =$req.rawData["openid.claimed_id"];
			
			var ext = verification.getAuthResponse().getExtension(SRegMessage.OPENID_NS_SREG);
			
			//try to find user by this login
			user = Myna.Permissions.getUserByLogin("openid",auth_data.claimed_id);
			if (!user){
				user = Myna.Permissions.getUserByLogin("openid",auth_data.requested_id);
				if (!user){
					user = Myna.Permissions.getUserByLogin("openid",auth_data["openid.identity"]);
					if (!user){ //ok, I guess there is no existing user, let's create one
						user = Myna.Permissions.addUser({})
					}
				}
			}
				
			if (ext instanceof SRegResponse) {
				auth_data.userAttributes = Myna.JavaUtils.mapToObject(ext.getAttributes())
				auth_data.userAttributes.forEach(function(value,key,obj){
					switch(key){
						case "dob":
							obj.dob = Date.parseDate(value,"Y-m-d");
						break;
						case "fullname":
							value.split(/\s+/).forEach(function(part,index,array){
								if (index == 0){
									obj.first_name = part; 	
								}
								else if (index == array.length-1){
									obj.last_name = part;
									if (obj.middle_name) obj.middle_name = obj.middle_name.trim()
								} else {
									obj.middle_name += part + " ";	
								}
							})
						break;
						
					}
					if (!user[key])  user.saveField(key,value)
				})
				
				//user.setFields(auth_data.userAttributes)
				
			}
			
			auth_data.user = user;
			user.setLogin({
				type:"openid",
				login:auth_data.claimed_id
			})
			user.setLogin({
				type:"openid",
				login:rawData.requested_id
			})
			user.setLogin({
				type:"openid",
				login:auth_data.identity
			})
			if (rawData.callback.listLen("?")>1){
				rawData.callback+="&"
			} else {
				rawData.callback+="?"
			}
			rawData.callback+="auth_token=" + Myna.Permissions.getAuthToken(user.user_id).escapeUrl();
			
			$res.metaRedirect(rawData.callback);
		} else {
			Myna.log("WARNING","Failed OpenID authentication",Myna.dump(Myna.JavaUtils.beanToObject(verified))+ Myna.dump($req.data));
			fusebox.login({message:"Unable to verify your OpenID"})
		}
	},
}
//$req.data.setDefaultProperties({fuseaction:"login"})
fusebox[$req.data.fuseaction]($req.data,$req.rawData);

