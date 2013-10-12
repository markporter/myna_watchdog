var isWindows = /windows/i.test($server.osName);


if (isWindows){
	function testService(test,params){
		var result =Myna.executeWinBatch(<ejs>
			net start | find /I /C "{name}"
			exit 0
		</ejs>.format(params));
		
		var count = result.output.split(/\n/)[2].trim()
		if (count == 1){
			return test.pass();
		} else if (count > 1){
			return test.fail(
				"failed service status check: More than one running service with pattern {0}"
					.format(params.name)
			);
		} else {
			return test.fail(
				"failed service status check: no running services with pattern {0}"
					.format(params.name)
			);
		}
		

	}

	var output="";
	try{
		var result =Myna.executeWinBatch("net start".format(params.name));
		output = result.output
	} catch(e){}

	testService.meta={
		description:"Tests whether a Windows Service is running",
		config:[{
			fieldLabel:"Name Pattern (running services in dropdown)",
			xtype:"quickdrop",
			values:output.split("\n"),
			name:"name",
			type:"textfield",
			defaultValue:"",
			required:true
		}]
	}

} else {
	var isBSD = /BSD/.test($server.osName);
	var scriptPath = isBSD?"/etc/rc.d/":"/etc/init.d/"

	function testService(test,params){
		var result =Myna.executeShell("bash","{scriptPath}{name} {action}".format(params))
		if (result.exitCode === 0){
			return test.pass();
		} else {
			return test.fail("failed service status check" +result.errors);
		}

	}

	try{
		var result =Myna.executeShell("bash","ls -1 {0}".format(scriptPath),true)
		output = result.output
	} catch(e){}

	testService.params=[{
		label:"Service Name ",
		name:"name",
		type:"short",
		defaultValue:"",
		required:true
	}]

	var result =Myna.executeShell("bash","ls -1 /etc/init.d/",true)


	testService.meta ={
		description:"Tests whether a UNIX/Linux Service is running",
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
			xtype:"textfield",
			value:"status",
			required:true
		}]
	}
}
