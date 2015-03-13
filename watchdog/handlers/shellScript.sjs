function shellScript(service,params){
	if (parseInt(params.is_restart,10)) {
		service.setRestarting()
	}
	Myna.executeShell("bash",params.code)
}

shellScript.params=[{
	label:"Will this script restart the service?",
	name:"is_restart",
	type:"yesno",
	defaultValue:0,
	required:false
},{
	label:"BASH Code",
	name:"code",
	type:"multiple",
	defaultValue:"",
	required:false
}]

shellScript.meta={
	description:"Executes a serverside Bash script (Linux/Unix)",
	config:[{
		fieldLabel:"Will this script restart the service?",
		name:"is_restart",
		xtype:"quickdrop",
		values:{
			Yes:1,
			No:0
		},
		value:0,
		required:false
	},{
		fieldLabel:"BASH Code",
		name:"code",
		xtype:"textarea",
		value:"",
		required:false
	}]
}