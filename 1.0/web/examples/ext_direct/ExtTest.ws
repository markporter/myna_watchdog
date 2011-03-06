{
	name:"ExtTest",
	desc:"A WebService that demonstrates Ext.Direct support",
	beforeHandler:function(name,def,params){
		//set up mptt table
		Myna.include("/myna/administrator/myna_admin.sjs");
		
		var ds = "examples_ext_tree"
		/* create DS  */
			if (MynaAdmin.isUniqueDsName(ds)){
				MynaAdmin.saveDataSource({
					name:ds,
					desc:"Datsource Ext Tree Example",
					driver:"org.h2.Driver",
					url:"jdbc:h2:/WEB-INF/myna/local_databases/"+ds+";FILE_LOCK=SERIALIZED",
					username:"",
					password:"",
					type:"h2",
					location:"file",
					file:"/WEB-INF/myna/local_databases/" +ds
				})
				$server_gateway.loadDataSources();
			}
		/* create table */
			var db = new Myna.Database(ds);
			var table = db.getTable("mptt_test");
			var shouldReload =false
			if (!table.exists){
				table.create({
					columns:[{
						name:"id",
						type:"VARCHAR",
						maxLength:"255",
						allowNull:false
					},{
						name:"parent_id",
						type:"VARCHAR",
						maxLength:"255",
						allowNull:true
					},{
						name:"lft",
						type:"BIGINT",
						allowNull:true
					},{
						name:"rgt",
						type:"BIGINT",
						allowNull:true
					},{
						name:"depth",
						type:"BIGINT",
						allowNull:true
					},{
						name:"title",
						type:"VARCHAR",
						maxLength:"255",
						allowNull:true
					}]
				});
				
				// Keys:
					table.addPrimaryKey({
						id:"pk_mptt",
						column:"id"
					});	
				
				//Indexes
					table.addIndex({
						 id:"idx_mptt_left",
						 columns:["lft"]
					})
					table.addIndex({
						 id:"idx_mptt_right",
						 columns:["lft"]
					})
					table.addIndex({
						 id:"idx_mptt_LR",
						 columns:["lft","rgt"]
					})
					table.addIndex({
						 id:"idx_mptt_parent",
						 columns:["parent_id"]
					})
					
				// load table
					shouldReload = true;
					
			}
			this.treeManager = new Myna.DataManager(ds).getTreeManager(
				table,
				{
					depthCol:"depth"
				}
			)
			if (shouldReload) this.reloadTree() 
		
	},
	functions:{
		reloadTree:{
			desc:"deletes the current tree and reloads from /shared/docs/myna_api",
			returns:[{
				success:"numeric"
			}],
			params:[],
			handler:function(params){
				var result = {sucess:1}
				var man = this.treeManager;
				//delete tree if it exists
				if (man.hasRootNode()) man.remove(man.getRootNode().id)
				
				var rootNode=man.create({
					title:"Myna JS Docs folder"
				})
				var rootDir = new Myna.File("/shared/docs/js/libOO");
				var loadNode = function(dir,node){
					dir.listFiles()
						.forEach(function(f){
							var childNode = man.create({
									title:f.fileName
							},{
								underNode:node.id
							})
							if (f.isDirectory){
								loadNode(f,childNode)
							}
						})
				}
				loadNode(rootDir,rootNode)
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
				var man = this.treeManager;
				var nodes;
				if (parentId == "root"){
					nodes = [man.getRootNode()]
				} else {
					nodes = man.getById(parentId).childNodes	
				}
				return nodes.map(function(n){
					var leaf = !n.childIds.length
					var title = n.title
					if (!leaf) title += " [" + n.descendantIds.length + " files]"  
					return  {
						id:n.id,
						text:title,
						leaf:leaf
					}
				})
			}
		},
		moveNode:{
			desc:"moves a node to a new location",
			returns:[{
				success:"numeric"
			}],
			params:[{
					name:"node_id",
					type:"string",
					desc:"Id of node to move"
				},{
					name:"parent_id",
					type:"string",
					desc:"Id of parent node to move under"
				},{
					name:"index",
					type:"numeric",
					desc:"position in child array to move to"
			}],
			handler:function(params){
				var man = this.treeManager;
				var node = man.getById(params.node_id)
				var parent = man.getById(params.parent_id)
				var result = {success:1}
				var children =parent.childIds; 
				if (children.length > params.index){
					node.moveNode({
						beforeNode:children[params.index]
					})
				} else {
					node.moveNode({
						underNode:params.parent_id
					})	
				}
				
				return result;
				
			}
		}
	}
}

