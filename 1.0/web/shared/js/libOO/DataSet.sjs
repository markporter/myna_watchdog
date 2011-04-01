/* Function: getDs
	returns a java DataSource object that can be used as the "ds" option in queries
	
	Detail:
		This will create an in-memory H2 database containing a single table "data"
		which contains the contents of this DataSet. The return value will be a 
		DataSource that can be used to query this table
		
	
	*/	
	Myna.DataSet.prototype.getDs =function(){
		var bds = new Packages.org.apache.commons.dbcp.BasicDataSource();
		bds.setDriverClassName("org.h2.Driver");
		bds.setUrl("jdbc:h2:mem:" + Myna.createUuid());
		var db = new Myna.Database(bds);
		var $this = this;
		db.getTable("data").create({
			columns:[{
				name:"dataset_row_number",
				type:"BIGINT",
				isPrimaryKey:true
			}].concat(
				$this.columns.map(function(colname){
					return {
						name:colname,
						type:"VARCHAR", 
						maxLength:32000
					}
				})
			)
		})
		var sql=<ejs>
			insert into data(dataset_row_number,<%=$this.columns.join()%>) 
			values ({dataset_row_number:BIGINT},
			<% 
				$this.columns.forEach(function(colName,index, columnArray){
					Myna.print("{" +colName+":VARCHAR}")
					if (index < columnArray.length -1) Myna.print(",")
				});
				
			%>
			)
		
		</ejs>
		$this.forEach(function(row,index){
			row.dataset_row_number = index;
			new Myna.Query({
				ds:bds,
				sql:sql,
				values:row
			})
		});	
		
		return bds;
	} 
/* Function: query
	queries this DataSet as a table named "data", and returns a <Myna.Query> 
	object
	
	Detail:
		This will create an in-memory H2 database containing a single table "data"
		which contains the contents of this DataSet. This function takes the same 
		options as <Myna.Query>, except that the ds/dataSource parameter is 
		ignored
		
	
	*/	
	Myna.DataSet.prototype.query =function(options){
		options.ds = this.getDs();
		return new Myna.Query(options);	
	}
