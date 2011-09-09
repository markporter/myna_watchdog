/* Class: $helpers.Html */

/* Function: link
	Returns an HTML link for a specified controller and action
	
	Parameters:
		options		-	options object, see below
	
	Options:
		route		-	*Optional, default "default"*
						Name of route to construct
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
		route		-	*Optional, default "default"*
						Name of route to construct
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
		var template=false,controller,action,id,url=$application.url,hash="";
		var routes = $FP.config.routes.filter(function(r){
			return r.name == (options.route||"default")
		})
		
		if (routes.length ){
			template=routes[0].pattern;
		} else {
			if (options.route) {//oops! we asked for a non-existent route
				throw new Error("No route '" +options.route+"' in configuration.")
			} else {//No routes defined? We'll use URL params
				if (!options.params) options.params={}
				options.params.setDefaultProperties({
					id: options.id||$req.params.id||"",
					action: $FP.c2f(options.action||$req.params.action),
					controller: $FP.c2f(options.controller||$req.params.controller),
				})
			}
		} 
			
		if (options.staticUrl){
			url +="static/" +options.staticUrl
		} else if (template){
			id = options.id||$req.params.id||"";
			action = $FP.c2f(options.action||$req.params.action);
			controller = $FP.c2f(options.controller||$req.params.controller);
			
			url += template
				.replace(/\$controller/g,controller)
				.replace(/\$action/g,action)
				.replace(/\$id/g,id) 
		}
		
		if ("params" in options){
			var q = $FP.objectToUrl(options.params,!template)
			if (q) url+="?"+q	
		}
		if ("anchor" in options) {
			url+="#"+escape(options.anchor)
		}
		
		//Myna.abort(url)
		return url
	}	