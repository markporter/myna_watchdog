/* ----- CLASS: Database_General ------------------------------------------- */
	function Database_General(name){ TestCase.call( this, name );}
	Database_General.prototype = new TestCase();
	/* ------ setUp -------------------------------------------------------- */
		Database_General.prototype.setUp=function(){
			Myna.includeOnce("/myna/administrator/myna_admin.sjs");
			//Myna.print("running tests for:");
			this.dataSources =[
				// "myna_test_mssql",    
				"myna_test_h2", 
				"myna_test_mysql",
				"myna_test_pgsql",
				// "myna_test_oracle", 
				
				
			].filter(function(name){
				try {
					MynaAdmin.loadDataSource(name);
					//Myna.print(" " +name + " ");		
					return true;
				
				} catch (e){
					return false;
				} 
					
			})
			
		}
	/* ------ init -------------------------------------------------------- */
		Database_General.prototype.test_init=function(){
			this.dataSources.forEach(function(ds){
				new Myna.Database(ds);
			})
		}
	/* ------ getSchemas ------------------------------------------ */
		Database_General.prototype.test_getSchemas=function(){
			var test = this;
			
			this.dataSources.forEach(function(ds){
				var db = new Myna.Database(ds);
				var schemas = db.schemas;
				test.assertTrue("There should be at least one schema",schemas.length)
			})
		}
	/* ------ createDropTables ------------------------------------------ */
		Database_General.prototype.test_createDropTables=function(){
			var test = this;
			this.dataSources.forEach(function(ds){
				try{ 
					Myna.log("test","createDropTables - begin: " + ds );
					
					var db = new Myna.Database(ds);
					
					var users=db.getTable("test_users");
					var prefs=db.getTable("test_prefs");
					var all_col=db.getTable("test_all_col");
					
					prefs.drop();
					users.drop();
					all_col.drop();
					
					all_col.create({
						columns:[{
							name:"id",
							type:"bigint",
							isPrimaryKey:true
						},{
							name:"col_BLOB",
							type:"BLOB"
						},{
							name:"col_CLOB",
							type:"CLOB"
						},{
							name:"col_DATE",
							type:"DATE"
						},{
							name:"col_INTEGER",
							type:"INTEGER",
							maxLength:100,
							defaultValue:10
						},{
							name:"col_NUMERIC",
							type:"NUMERIC",
							maxLength:10,
							decimalDigits:2							
						},{
							name:"col_TEXT",
							type:"TEXT"
						},{
							name:"col_TIMESTAMP",
							type:"TIMESTAMP"
						},{
							name:"col_VARBINARY",
							type:"VARBINARY",
							maxLength:2000
						},{
							name:"col_VARCHAR",
							type:"VARCHAR",
							maxLength:100
						}]
					})
					
					
					
					test.assertTrue(ds + ": 'test_all_col' table should exist after create",all_col.exists);
					test.assertTrue(ds + ": 'test_all_col' primary key should be 'id'",all_col.primaryKeys[0] == "id");
					test.assertTrue(ds + ": 'test_all_col' table Should have 10 columns",all_col.columnNames.length ==10);
					
					all_col.columns.forEach(function(col,index){
						if (col.column_name.toLowerCase() != "id"){
							all_col.dropColumn(col.column_name);	
						}
					})
					test.assertTrue(ds + ": 'test_all_col' table Should have 1 column after column drops",all_col.columnNames.length ==1);
					
					
					all_col.addColumn({
						name:"col_BLOB",
						type:"BLOB"
					})
					all_col.addColumn({
						name:"col_CLOB",
						type:"CLOB"
					})
					all_col.addColumn({
						name:"col_DATE",
						type:"DATE"
					})
					all_col.addColumn({
						name:"col_INTEGER",
						type:"INTEGER",
						maxLength:100,
						defaultValue:10
					})
					all_col.addColumn({
						name:"col_NUMERIC",
						type:"NUMERIC",
						maxLength:10,
						decimalDigits:2							
					})
					all_col.addColumn({
						name:"col_TEXT",
						type:"TEXT"
					})
					all_col.addColumn({
						name:"col_TIMESTAMP",
						type:"TIMESTAMP"
					})
					all_col.addColumn({
						name:"col_VARBINARY",
						type:"VARBINARY",
						maxLength:2000
					})
					all_col.addColumn({
						name:"col_VARCHAR",
						type:"VARCHAR",
						maxLength:100
					})
					test.assertTrue(ds + ": 'test_all_col' table Should have 10 column after column adds",all_col.columnNames.length ==10); 
					
					
					users.create({
						recreate:true,
						columns:[{
							name:"user_id",
							type:"bigint",
							isPrimaryKey:true
						},{
							name:"first_name",
							type:"varchar",
							maxLength:100
						},{
							name:"last_name",
							type:"varchar",
							maxLength:100
						},{
							name:"job_desc",
							type:"text"
						},{
							name:"picture",
							type:"blob"
						}]
					})
					test.assertTrue(ds + ": 'test_users' table should exist after recreate",users.exists);
					test.assertTrue(ds + ": 'test_users' table Should have 5 columns",users.columnNames.length ==5);
					
					prefs.create({
						recreate:true,
						columns:[{
							name:"pref_id",
							type:"bigint",
							isPrimaryKey:true
						},{
							name:"user_id",
							type:"bigint",
							isPrimaryKey:false,
							references:{
								table:"test_users",
								column:"user_id",
								onDelete:"CASCADE",
								onUpdate:"CASCADE"
							}
						},{
							name:"name",
							type:"varchar",
							maxLength:100
						},{
							name:"value",
							type:"text",
						}]
					})
			
					test.assertTrue(ds + ": 'test_prefs' table should exist after create",
						prefs.exists);
					test.assertTrue(ds + ": 'test_prefs' table Should have 4 columns",
						prefs.columnNames.length ==4);
			
					
					
					/* 
						It seems MySql doesn't reliably support foriegn keys 
					*/
					if (ds != "myna_test_mysql"){
						test.assertTrue(ds + ": 'test_prefs' foreign keys should = 'user_id'",
							prefs.foreignKeys[0].pkcolumn_name.toLowerCase() == "user_id");
						test.assertTrue(ds + ": 'test_users' exported key should equal 'user_id'",
							users.exportedKeys[0].fkcolumn_name.toLowerCase() == "user_id");
					}
					
					new Myna.Query({
						ds:ds,
						sql:"insert into test_users(user_id) values(1)"
					})
					new Myna.Query({
						ds:ds,
						sql:"insert into test_prefs(pref_id,user_id) values(1,1)"
					})
					
					prefs.modifyColumn("user_id",{
						name:"pref_user_id"
					});
					
					var pref_user_id = new Myna.Query({
						ds:ds,
						sql:"select pref_user_id from test_prefs"
					}).data[0].pref_user_id
					test.assertTrue(ds + ": 'test_prefs' after renaming user_id to pref_user_id, value should still be '1'",
							pref_user_id == 1);
					
				} catch (e){
					Myna.print(Myna.formatError(e));
					Myna.print(Myna.dump(all_col,"all_col",10));
					Myna.print(Myna.dump(users,"users",10));
					Myna.print(Myna.dump(prefs,"prefs",10));
					
					test.fail(e.message);
				}
				
					
				Myna.log("test","createDropTables - end: " + ds );
				
				
			})
		}
