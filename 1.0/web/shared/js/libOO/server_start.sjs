Myna.include("/shared/js/libOO/upgrade_tables.sjs",{});

/* add connection testing to datasources */
var keys = Myna.JavaUtils.enumToArray($server_gateway.javaDataSources.keys());
var dbTypes = {}
new Myna.File("/shared/js/libOO/db_properties/").listFiles("sjs").forEach(function(file){
	dbTypes[file.fileName.listFirst(".")] = Myna.include(file.toString(),{})
})
keys.forEach(function(dsName){
        var bds = $server_gateway.javaDataSources.get(dsName);
        var ds = Myna.JavaUtils.mapToObject($server_gateway.dataSources.get(dsName));
        var file = new Myna.File("/WEB-INF/myna/ds/" + ds.type);
		
        if (ds.type in dbTypes &&
                "connectionTestSql" in dbTypes[ds.type]
        ) {
                bds.setTestOnBorrow(true);
                bds.setValidationQuery(dbTypes[ds.type].connectionTestSql);
        }

})
