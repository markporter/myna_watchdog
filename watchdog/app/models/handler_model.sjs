function init(){
	this.addFields([
		{name:"parameters"},
		{name:"parameters_text"}
	])
	this.setLabels({
		handler_name:"Handler Script"	
	})
	this.beanClass.prototype.setDefaultProperties({
		getHandlerFile:function getHandlerFile(){
			//Myna.printConsole(new Myna.File($FP.dir,"handlers/",this.script_name +".sjs"));
			return new Myna.File($FP.dir,"handlers/",this.script_name +".sjs");
		}
	})
	this.beanClass.prototype.after("getData",function (depth) {
		var chain = arguments.callee.chain

		var handler = this;
		chain.lastReturn.parameters_text = this.HandlerParameters()
			.filter(function (hp) { return hp.script_name == handler.script_name})
			.map(function (hp) {
				return "{name} = {value}".format(hp) 
			}).join("<br>")

		chain.lastReturn.parameters = this.HandlerParameters().reduce(function (result,hp) {
			if(!result[hp.script_name]) result[hp.script_name] ={}
			result[hp.script_name][hp.data.name] = hp.data.value
			return result
		},{})

		return chain.lastReturn
	})
	//Myna.log("debug","proto",Myna.dump(this.beanClass.prototype.gehproperties()));
}
