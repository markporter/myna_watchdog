/* Class: $FP.helpers.Html */

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
		text		-	*Optional, default generated URL*
							If provided, this will be placed between the resulting 
							<a></a> tags
		[others]		-	Any other properties will be added as attributes to the tag 	
								
	*/
	
	function link(options){
		var url = this.url(options);
		var text = options.text||url
		var attributes = options.getKeys()
			.filter(function(key){
				return ![
					"staticUrl",
					"controller",	
					"action",
					"id",
					"params",		
					"anchor",
					"text"
				].contains(key)
			})
			.map(function(key){
				return <ejs>
					<%=key%>="<%=options[key]%>"
				</ejs>
			}).join(" ")
		return <ejs>
			<a href="<%=url%>" <%=attributes%>><%=text%></a>
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
		id				-	*Optional, default ""*
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
			template=routes[0].pattern.replace(/^\[.*?\]/,"").replace(/\*$/,"");
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
			id = options.id||"";
			action = $FP.c2f(options.action||$req.params.action);
			controller = $FP.c2f(options.controller||$req.params.controller);
			
			url += template
				.replace(/\$controller/g,controller)
				.replace(/\$action/g,action)
				.replace(/\/\$id\*?/g,id?"/"+id:"")
				.replace(/\$(\w+)\*?/g,function(str,p){
					if ("params" in options && p in options.params){
						var val =options.params[p];
						delete options.params[p]
						return String(val||"")
					} else {
						return ""	
					}
				})
			
		}
		
		
		if ("params" in options){
			var q = $FP.objectToUrl(options.params,!template)
			if (q) url+="?"+q	
		}
		
		var first= url.listFirst("?")
		var query = ""
		if (url.listLen("?") > 1){
			query = "?"+url.listAfter("?")	
		}
		
		first = first.split("/").filter(function(token){
			return !/\$/.test(token)
		}).join("/")
		url = first + query
		
		if ("anchor" in options) {
			url+="#"+escape(options.anchor)
		}
		
		//Myna.abort(url)
		return url
	}	