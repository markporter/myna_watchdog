var MynaAdmin={
//properties
//functions
	//data sources
		createDs:function(name,type){
			var newDs = this.newDataSource();
			newDs.name = name;
			newDs.type = type;
			
			if (!this.isUniqueDsName(name)) throw {message:"Datsource '" + name +"' already exists "}
			
			saveProperties(newDs, $server.rootDir + "WEB-INF/myna/ds/" + name + ".ds");
			$server_gateway.loadDataSources();
		},
		isUniqueDsName:function(name){
			return !(new Myna.File($server.rootDir + "WEB-INF/myna/ds/" + name + ".ds").exists());
		},
		deleteDs:function(name){
			var file = new Myna.File($server.rootDir + "WEB-INF/myna/ds/" + name + ".ds").javaFile;
			file["delete"]();
			$server_gateway.dataSources.remove(name);
		},
		getDsTypes:function(){
			var dsDir = new Myna.File($server.currentDir + "views/ds").javaFile;
			var filter = java.io.FileFilter({
				accept:function(path){
					var pathname = path.getName();
					return (path.getName().substring(pathname.length() -4) == ".ejs");
				}
			});
			var dataSourcesPaths = dsDir.listFiles(filter);
			var types = []
			for (var x =0; x < dataSourcesPaths.length; ++x){
				var dsName = dataSourcesPaths[x].getName().substring(0,dataSourcesPaths[x].getName().length() -4);
				types[x] = new String(dsName).toLowerCase();
			}
			return types.sort();
		},
		getDataSource:function(dsName){
			return Myna.loadProperties($server.rootDir + "WEB-INF/myna/ds/" + dsName + ".ds");
		},
		loadDataSource:function(dsName){
			$server_gateway.loadDataSource(new Myna.File($server.rootDir + "WEB-INF/myna/ds/" + dsName + ".ds").javaFile,true);
		},
		saveDataSource:function(ds){
			ds.checkRequired(["name"]);
			var 
				path =$server.rootDir + "WEB-INF/myna/ds/" + ds.name + ".ds";
			Myna.saveProperties(ds,path);
			//$server_gateway.loadDataSources();
			
			
		},
		newDataSource:function(){
			return {
				"desc":"",
				"name":"",
				"type":"other",
				"driver":"",
				"location":"network",
				"file":"",
				"server":"",
				"port":"",
				"db":"",
				"username":"",
				"password":"",
				"url":new Myna.File("/WEB-INF/myna/local_databases").toString().listAfter(":")
			}
		}
}
