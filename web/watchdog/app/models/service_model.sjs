function init(){
	this.hasMany({
		name:"Tests",
		orderBy:"enabled desc, script_name asc"
	})
	this.setDefaults({
		enabled:0,
		name:"",
		admin_email:"mporter@salud.unm.edu",
		test_status:"unknown",
		status:"unknown"
	})
	this.setLabels({
		admin_email:"Administrator Email List"	
	})
	this.beanClass.prototype.setDefaultProperties({
		setRestarting:function setRestarting(){
			this.set_status("restarting")
			this.set_restarted(new Date())
			this.Tests().forEach(function(test){
				test.set_fail_count(0);
				test.set_status("restarting");
			})
			this.save()
		}
	})
	this.addValidators({
		name:{
			required:{},
			type:"string",
			unique:{}
		}
	})

	this.hasOne({
		"name":"Handler",
		alias:"ServiceManager"
	})

}



function fail(){
	this.set_test_status("fail");
	this.set_status("fail");
}