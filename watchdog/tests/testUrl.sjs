function testUrl(test,params){
	var con = new Myna.HttpConnection({
		url:params.url,
		timeout:params.timeout*1000
	})
	
	try{
		$profiler.mark("about to connect " + test.script_name)
		con.connect()
		$profiler.mark("connected " + test.script_name)
		if (con.getStatusCode() == 200){
			if ("responseMatches" in params){
				var matches = new RegExp(params.responseMatches).test(con.getResponseText());
				if (matches){
					return test.pass();
				} else{
					return test.fail(<ejs>
						Response does not match /<%=params.responseMatches%>/
						<hr>
						<%=con.getResponseText().left(10000)%>
					</ejs>);
				}
			} else {
				return test.pass();	
			}
		} else {
			return test.fail(con.getStatusCode() +": " +con.methodHandler.getStatusText());
		}
			 
	} catch(e){
		
		if (/SocketTimeoutException/.test(e.message)){
			return test.fail("Timeout after " + (params.timeout) + " seconds.");	
		} else {
			return test.fail(Myna.formatError(e));
		}
	}
}

testUrl.params=[{
	label:"URL",
	name:"url",
	type:"long",
	defaultValue:"http://localhost/",
	required:true
},{
	label:"Timeout (seconds)",
	name:"timeout",
	type:"numeric",
	defaultValue:"10"
},{
	label:"Response Matches (RegEx)",
	name:"responseMatches",
	type:"long",
	defaultValue:".*"
}]

testUrl.meta={
	description:"Tests a URL for return code, response and/or timeout ",
	config:[{
		fieldLabel:"URL",
		name:"url",
		xtype:"textfield",
		value:"http://localhost/",
		required:true
	},{
		fieldLabel:"Timeout (seconds)",
		name:"timeout",
		xtype:"numberfield",
		value:10
	},{
		fieldLabel:"Response Matches (RegEx)",
		name:"responseMatches",
		xtype:"textfield",
		value:".*"
	}]
}