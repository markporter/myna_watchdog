{
	name:"ExtTest",
	desc:"A WebService that demonstrates Ext.Direct support",
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
		},
		getTree:{
			desc:"retrieves tree nodes by parent node id.",
			returns:[{
				id:"string",
				text:"string",
				leaf:"numeric"
			}],
			params:[{
				name:"node_id",
				type:"string",
				desc:"array containing the parent node id"
			}],
			handler:function(params){
				var parentId =params.node_id;
				Myna.log("debug","params",Myna.dump(params));
				if (parentId == "root"){
					return Array.dim(5).map(function(element,index){
						var id=index+1;
						return {
							id:"n"+id,
							text:"Node " +id,
							leaf:0
						}
					})
				} else {
					var parentNum = parentId.charAt(1);
					return Array.dim(5).map(function(element,index){
						var id=index+1;	
						return {
							id:parentId+id,
							text:"Node " +parentNum +"." +id,
							leaf:1
						}
					})
				}
			}
		}
	}
}

