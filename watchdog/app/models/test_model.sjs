function init(){
	this.addFields([
		{name:"parameters"},
		{name:"parameters_text"}
	])
	//Myna.printConsole("initing test model")
	this.setDefaults({
		enabled:1,
		fail_after:1,
		restart_grace:0,
		fail_messages:"",
		status:"unknown"
	})
	this.setLabels({
		name:"Name",
		script_name:"Test Script"	,
		fail_after:"Attempts before Fail",
		restart_grace:<ejs>
			Restart Grace Seconds<br>
			(how long to wait after restarting before failing again)
		</ejs>,
	})
	//this.logQueries=true;
	this.beanClass.prototype.setDefaultProperties({
		failMessage:function failMessage(msg){
			this.set_fail_messages(<ejs>
				<%=this.fail_messages%>
				<div class="fail_message"><%=msg%></div>
			</ejs>);
			//Myna.printConsole(this.script_name,msg)
		},
		
		getTestFile:function getTestFile(){
			return new Myna.File($FP.dir,"tests/",this.script_name +".sjs");
		},
		
		fail:function fail(msg){
			
			//check if we are in restart grace perid
			if (this.Service().restarted && this.restart_grace){
				var elapsed = new Date().getTime() - this.Service().restarted.getTime();
				if (elapsed < this.restart_grace*1000) {
					this.set_status("restarting");
					return
				}
			}
			this.set_fail_count(this.fail_count+1);
			this.set_status("fail");
			if (msg){
				this.failMessage(msg)	
			}
			return false
		},
		
		pass:function pass(){
			this.set_status("pass");
			this.set_fail_messages("");
			this.set_fail_count(0);
			return true;
		},
	})

	this.beanClass.prototype.after("getData",function (depth) {
		var chain = arguments.callee.chain

		var test = this;
		chain.lastReturn.parameters_text = this.TestParameters()
			.filter(function (tp) { return tp.script_name == test.script_name})
			.map(function (tp) {
				return "{name} = {value}".format(tp) 
			}).join("<br>")
		chain.lastReturn.parameters = this.TestParameters().reduce(function (result,tp) {
			if(!result[tp.script_name]) result[tp.script_name] ={}
			result[tp.script_name][tp.data.name] = tp.data.value
			return result
		},{})

		return chain.lastReturn
	})
	/*this.after("afterLoad",function (bean) {
		

		bean.parameters_text =bean.data.parameters_text = bean.TestParameters().map(function (tp) {
			return "{name} = {value}".format(tp) 
		}).join("<br>")
	})*/
	

	//add denormalized params
	
}
