/* Class: $helpers.Html */

/* Function: link
	Returns an HTML link for a specified controller and action
	
	Parameters:
		options		-	options object, see below
	
	Options:
		staticUrl	-	*Optional, default null*
							A url relative to the "static" folder. If defined, this 
							overrides _controller_, _action_ and _id_
		controller	-	*Optional, default current controller*
		action		-	*Optional, default current action*
		id				-	*Optional, default current id*
		params		-	*Optional, default null*
							additional params to add to the URL
		anchor		-	*Optional, default null*
							String to add after "#' in the URL
		content		-	*Optional, default generated URL*
							If provided, this will be placed between the resulting 
							<a></a> tags
		[others]		-	Any other properties will be added as attributes to the tag 	
								
	*/
	
	function link(options){
		var url = this.url(options);
		var content = options.content||url
		var attributes = options.getKeys()
			.filter(function(key){
				return ![
					"staticUrl",
					"controller",	
					"action",
					"id",
					"params",		
					"anchor",
					"content"
				].contains(key)
			})
			.map(function(key){
				return <ejs>
					<%=key%>="<%=options[key].escapeHtml()%>"
				</ejs>
			}).join(" ")
		return <ejs>
			<a href="<%=url%>" <%=attributes%>><%=content%></a>
		</ejs>
	}	

/* Function: url
	Returns a URL for a specified controller and action
	
	Parameters:
		options		-	options object, see below
	
	Options:
		staticUrl	-	*Optional, default null*
							A url relative to the "static" folder. If defined, this 
							overrides _controller_, _action_ and _id_ 
		controller	-	*Optional, default current controller*
		action		-	*Optional, default current action*
		id				-	*Optional, default current id*
		params		-	*Optional, default null*
							additional params to add to the URL
		anchor		-	*Optional, default null*
							String to add after "#' in the URL
								
	*/
	function url(options){
		var controller,action,id,url=$application.url,hash="";
		if (options.staticUrl){
			url +="static/" +options.staticUrl
		} else if ("id" in options){
			id = options.id;
			action = $FP.c2f(options.action||$req.params.action);
			controller = $FP.c2f(options.controller||$req.params.controller);
			url += [controller,action,id].join("/")
		} else if ("action" in options){
			action = $FP.c2f(options.action);
			controller = $FP.c2f(options.controller||$req.params.controller);
			url += [controller,action].join("/")
		} else if ("controller" in options){
			controller = $FP.c2f(options.controller);
			url += controller
		} else {
			
			url += [
				$FP.c2f($req.params.controller),
				$FP.c2f($req.params.action),
				$req.params.id
			].join("/")
		}
		if ("params" in options){
			var q = $FP.objectToUrl(options.params)
			if (q) url+="?"+q	
		}
		if ("anchor" in options) {
			url+="#"+escape(options.anchor)
		}
		return url
	}	