var isWindows = /windows/i.test($server.osName);


if (isWindows){
	function manageService(service,params){
		
		if ("start,restart".listContains(params.action)) {
			service.setRestarting();
			service.set_status("restarting");
		} else if (action == "stop") {
			service.set_status("stopped");
			Myna.printConsole("service stopped");
		}
		var result;
		
		if (params.action == "restart"){
			result =Myna.executeWinBatch([
				'net stop "{name}"',
				'net start "{name}"'
			].join("\n").format(params));
		} else {
			result =Myna.executeWinBatch('net {action} "{name}"'.format(params));
		}
	}

	var output="";
	try{
		var result =Myna.executeWinBatch("net start".format(params.name));
		output = result.output
	} catch(e){}

	manageService.meta={
		description:"Restarts a Windows service",
		isServiceManager:true,
		config:[{
			fieldLabel:"Exact Name (running services in dropdown)",
			xtype:"quickdrop",
			values:output.split("\n"),
			name:"name",
			type:"textfield",
			defaultValue:"",
			required:true
		},{
			fieldLabel:"Action:",
			name:"action",
			xtype:"quickdrop",
			values:[
				"start",
				"stop",
				"restart"
			],
			value:"restart",
			required:true
		}]
	}

} else {
	var isBSD = /BSD/.test($server.osName);
	var scriptPath = isBSD?"/etc/rc.d/":"/etc/init.d/"

	function manageService(service,params){
		if ("start,restart".listContains(params.action)) {
			service.setRestarting();
			service.set_status("restarting");
		} else if (params.action == "stop") {
			service.set_status("stopped");
			Myna.printConsole("service stopped");
		}

		var script =[
			"{scriptPath}{name} {action} &",
			"exit 0"
		].join("\n").format(params)
		Myna.printConsole("executing script",script);
		var result =Myna.executeShell(
			"bash",
			script,
			false
		)
	}
	try{
		var result =Myna.executeShell("bash","ls -1 {0}".format(scriptPath),true)
		output = result.output
	} catch(e){}
	manageService.meta={
		description:"Restarts a Unix service",
		isServiceManager:true,
		config:[{
			fieldLabel:"<b>Script Path</b> <br>directory where service scripts are stored, including training /",
			labelAlign:"top",
			name:"scriptPath",
			xtype:"textfield",
			value:scriptPath,
			required:true
		},{
			fieldLabel:"<b>Service Script</b>",
			//labelAlign:"top",
			name:"name",
			xtype:"quickdrop",
			values:result.output.split("\n"),
			required:true
			
		},{
			fieldLabel:"<b>Action</b>",
			//labelAlign:"top",
			name:"action",
			xtype:"quickdrop",
			values:[
				"start",
				"stop",
				"restart",
				"reload",
				"force-reload"
			],
			value:"restart",
			required:true
		}]
	}
}
