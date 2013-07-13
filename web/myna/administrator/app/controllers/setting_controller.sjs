function getSettings(params){
	var result ={}
	Myna.getGeneralProperties().forEach(function(element,key){
		result[key.replace(/\./,"_dot_")] = element;
	})
	delete result.admin_password;
	return result;
}

function saveSettings(params){
	var props = Myna.getGeneralProperties();
	
	params.forEach(function(value,key){
		if ("id,controller,action,$inline".listContains(key)) return
		var cleanedKey = key.replace(/_dot_/,".");
		if (cleanedKey in props ){
			$server_gateway.generalProperties.setProperty(cleanedKey,value);
		}
	});
	$server_gateway.saveGeneralProperties();
	return {success:true}
}
