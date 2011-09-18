function api(params){
	var API ={
		url:$server.serverUrl+$application.url+$FP.c2f(this.name)+"/router",
		type:"remoting",
		actions:{}
	}
	
	if (params.ns) API.ns = params.ns;
	if (params.namespace) API.namespace = params.namespace;
	$FP.getControllerNames().forEach(function(name){
		var controller = $FP.getController(name)
		Myna.println(name)
		Myna.println(controller.name)
		API.actions[name]=[]
		controller.getActions().forEach(function(def){
			API.actions[name].push({
				name:def.action,
				len:1
			})
		})
		
	})
	if (params.callback){
		this.renderContent(params.callback +"(" +API.toJson() +")","text/javascript");
	} else if (params.scriptvar){
		var content = [];
		if (params.ns){
			content.push("Ext.ns('"+params.ns+"');"+params.ns+".")
		} else if (params.namespace){
			content.push("Ext.namespace('"+params.namespace+"');"+params.namespace+".")
		}
		content.push($req.rawData.scriptvar + "=" +API.toJson());
		this.renderContent(conent.join(""),"text/javascript");
	}else {
		this.renderContent(API.toJson(),"application/json");
	}
	 
}

function router(params){
	var isJson = $req.contentType == "application/json";
	var result;
	
	var executeRequest = function(request){
		result={
			type:'rpc',
			tid:request.tid,
			action:request.action,
			method:request.method,
		};
		var args;
		try {
			
			var controller = $FP.getController(request.action)
			if (!controller) throw new Error("Controller '" +request.action+ "' not defined")
			if (!(request.method in controller)) throw new Error("Action '" +request.action+ ":"+request.method+"' not defined")
			
			if (request.data instanceof Array) {
				args = request.data.length?request.data[0]:{};
			} else { //data is a structure
				args= request.data	
			}
			result.result = controller.callAction(request.method,args);
			return result;
		} catch(e){
			var message = "Error in Ext.Direct call " + request.action + "." +request.method +", TID: " + request.tid; 
			Myna.logSync(
				"debug",
				message,
				Myna.formatError(__exception__) 
					+Myna.dump($req.data,"parms") 
					+ Myna.dump($req.contentText,"content")
			);
			return {
				type:'exception',
				tid:request.tid,
				message:message,
				where:"See administrator log for details"
			}
		}
	}
	
	
	if (isJson){
		var request = $req.contentText.parseJson();
		
		if (request instanceof Array){
			result = request.map(function(request){
				return executeRequest(request);
			})
		} else { 
			result = executeRequest(request);
		}
		
		this.renderContent(JSON.stringify(result),"application/json")
		
	} else {// post/upload request
		result = executeRequest({
			type:'rpc',
			tid:params.extTID,
			action:params.extAction,
			method:params.extMethod
		});
		$res.print("<html><body><textarea>"
			+ result.toJson().replace(/"/g,'\\"')
			+"</textarea></body></html>")
	}
}