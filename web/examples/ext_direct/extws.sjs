var ws = new Myna.WebService({
	name:"stuff",
	desc:"A thing that does stuff",
	authSecret:"fuzzy_pickles",
	authTimeout:20,
	functions:{
		get_stuff:{
			desc:"Does Stuff",
			returns:"string",
			params:[{
            name:"callnum",
            type:"numeric"
         }],
			handler:function(params){
				return "(" +params.callnum+") Hello from the 'get_stuff' service!" 
			}
		} 
	}
})
ws.handleRequest($req);

