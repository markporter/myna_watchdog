/* installs or upgrades standard tables */

var ds;
var db;
var table;
var dm;
Myna.include("/myna/administrator/myna_admin.sjs");

/* myna_log */
	ds = "myna_log"
	if (MynaAdmin.isUniqueDsName(ds)){
		MynaAdmin.saveDataSource({
			name:ds,
			desc:"Datsource for Myna Logging",
			driver:"org.h2.Driver",
			url:"jdbc:h2:" + new Myna.File("/WEB-INF/myna/local_databases/myna_log").toString(),
			username:"",
			password:"",
			type:"h2",
			location:"file",
			file:new Myna.File("/WEB-INF/myna/local_databases/myna_log").toString().listAfter(":")
		})
	}
	
	db = new Myna.Database(ds);
	/* myna_log_general table */
		table = db.getTable("myna_log_general");
		if (!table.exists){
			table.create({
				columns:[{
					name:"log_id",
					type:"VARCHAR",
					maxLength:255,
					isPrimaryKey:true
				},{
					name:"request_id",
					type:"VARCHAR",
					maxLength:255
				},{
					name:"instance_id",
					type:"VARCHAR",
					maxLength:255
				},{
					name:"hostname",
					type:"VARCHAR",
					maxLength:255
				},{
					name:"app_name",
					type:"VARCHAR",
					maxLength:255
				},{
					name:"type",
					type:"VARCHAR",
					maxLength:255
				},{
					name:"purpose",
					type:"VARCHAR",
					maxLength:100
				},{
					name:"label",
					type:"VARCHAR",
					maxLength:255
				},{
					name:"detail",
					type:"TEXT"
				},{
					name:"event_ts",
					type:"TIMESTAMP"
				},{
					name:"request_elapsed",
					type:"BIGINT"
				},{
					name:"log_elapsed",
					type:"BIGINT"
				}]
			});
			
		}
		//add missing indexes
		var hasIndex=table.indexInfo.some(function(i){
			return i.columns.sort().join()=="event_ts"
		})
		if (!hasIndex){
			table.addIndex({
					columns:["event_ts"]
			})	
		}
		
	
/* myna_permissions */
	ds = "myna_permissions";
	if (MynaAdmin.isUniqueDsName(ds)){
		MynaAdmin.saveDataSource({
			name:ds,
			desc:"Datsource for Myna Permissions",
			driver:"org.h2.Driver",
			url:"jdbc:h2:" + new Myna.File("/WEB-INF/myna/local_databases/myna_permissions").toString(),
			username:"",
			password:"",
			type:"h2",
			location:"file",
			file:new Myna.File("/WEB-INF/myna/local_databases/myna_permissions").toString().listAfter(":")
		})
	}
	
	db = new Myna.Database(ds);
	/* apps table */
		table = db.getTable("apps");
		if (!table.exists){
			table.create({
				columns:[{
					name:"appname",
					type:"VARCHAR",
					maxLength:255,
					isPrimaryKey:true
				},{
					name:"display_name",
					type:"VARCHAR",
					maxLength:255
				},{
					name:"description",
					type:"VARCHAR",
					maxLength:2000
				},{
					name:"inactive_ts",
					type:"TIMESTAMP"
				}]
			});
		}
	/* users table */
		table = db.getTable("users");
		if (!table.exists){
			table.create({
				columns:[{
					name:"user_id",
					type:"VARCHAR",
					maxLength:255,
					isPrimaryKey:true
				},{
					name:"first_name",
					type:"VARCHAR",
					maxLength:255
				},{
					name:"middle_name",
					type:"VARCHAR",
					maxLength:255
				},{
					name:"last_name",
					type:"VARCHAR",
					maxLength:255
				},{
					name:"created",
					type:"TIMESTAMP",
					maxLength:1
				},{
					name:"inactive_ts",
					type:"TIMESTAMP",
					maxLength:1
				},{
					name:"title",
					type:"VARCHAR",
					maxLength:255
				}]
			});
			
		}
		/* add newer columns */
			if (!("country" in table.columns)){
				table.addColumn({
					name:"country",
					type:"VARCHAR",
					maxLength:255
				})	
			}
			if (!("dob" in table.columns)){
				table.addColumn({
					name:"dob",
					type:"DATE"
				})	
			}
			if (!("email" in table.columns)){
				table.addColumn({
					name:"email",
					type:"VARCHAR",
					maxLength:255
				})	
			}
			if (!("gender" in table.columns)){
				table.addColumn({
					name:"gender",
					type:"VARCHAR",
					maxLength:1
				})	
			}
			if (!("language" in table.columns)){
				table.addColumn({
					name:"language",
					type:"VARCHAR",
					maxLength:255
				})	
			}
			if (!("nickname" in table.columns)){
				table.addColumn({
					name:"nickname",
					type:"VARCHAR",
					maxLength:255
				})	
			}
			if (!("postcode" in table.columns)){
				table.addColumn({
					name:"postcode",
					type:"VARCHAR",
					maxLength:255
				})	
			}
			if (!("timezone" in table.columns)){
				table.addColumn({
					name:"timezone",
					type:"VARCHAR",
					maxLength:255
				})	
			}
	/* user_logins table */
		table = db.getTable("user_logins");
		if (!table.exists){
			table.create({
				columns:[{
					name:"user_login_id",
					type:"VARCHAR",
					maxLength:255,
					isPrimaryKey:true
				},{
					name:"user_id",
					type:"VARCHAR",
					maxLength:255,
					references:{
						table:"users",
						column:"user_id",
						onDelete:"cascade",
						onUpdate:"cascade"
					}
				},{
					name:"login",
					type:"VARCHAR",
					maxLength:255
				},{
					name:"password",
					type:"VARCHAR",
					maxLength:255
				},{
					name:"type",
					type:"VARCHAR",
					maxLength:255
				}]
			});
			table.addIndex({
				id:"idx_user_logins",
				unique:true,
				columns:["user_id","login","type"]
			})
		}
		/* add newer columns */
			/* if (!("failed_logins" in table.columns)){
				table.addColumn({
					name:"failed_logins",
					type:"BIGINT",
					defaultValue:0
				})	
			}
			if (!("last_failed_login" in table.columns)){
				table.addColumn({
					name:"last_failed_login",
					type:"TIMESTAMP"
				})	
			} */
		
		
			
	
	/* groups table */
		table = db.getTable("user_groups");
		if (!table.exists){
			table.create({
				columns:[{
					name:"user_group_id",
					type:"VARCHAR",
					maxLength:255,
					isPrimaryKey:true
				},{
					name:"name",
					type:"VARCHAR",
					maxLength:255
				},{
					name:"appname",
					type:"VARCHAR",
					maxLength:255
				},{
					name:"description",
					type:"VARCHAR",
					maxLength:255
				}]
			});
			table.addIndex({
				id:"idx_user_group_appname",
				columns:["appname"]
			})
		}
		
	/* user_group_members table */
		table = db.getTable("user_group_members");
		if (!table.exists){
			table.create({
				columns:[{
					name:"user_group_member_id",
					type:"VARCHAR",
					maxLength:255,
					isPrimaryKey:true
				},{
					name:"user_id",
					type:"VARCHAR",
					maxLength:255,
					references:{
						table:"users",
						column:"user_id",
						onDelete:"cascade",
						onUpdate:"cascade"	
					}
				},{
					name:"user_group_id",
					type:"VARCHAR",
					maxLength:255,
					references:{
						table:"user_groups",
						column:"user_group_id",
						onDelete:"cascade",
						onUpdate:"cascade"	
					}
				}]
			});
			table.addIndex({
				id:"idx_group_members",
				unique:true,
				columns:["user_id","user_group_id"]
			})
			
		}
	
	/* rights table */
		table = db.getTable("rights");
		if (!table.exists){
			table.create({
				columns:[{
					name:"right_id",
					type:"VARCHAR",
					maxLength:255,
					isPrimaryKey:true
				},{
					name:"name",
					type:"VARCHAR",
					maxLength:255
				},{
					name:"appname",
					type:"VARCHAR",
					maxLength:255
				},{
					name:"description",
					type:"VARCHAR",
					maxLength:255
				}]
			});
			table.addIndex({
				id:"idx_rights_key",
				unique:true,
				columns:["name","appname"]
			})
			table.addIndex({
				id:"idx_rights_appname",
				columns:["appname"]
			})
		}
		
	/* assigned_rights table */
		table = db.getTable("assigned_rights");
		if (!table.exists){
			table.create({
				columns:[{
					name:"assigned_right_id",
					type:"VARCHAR",
					maxLength:255,
					isPrimaryKey:true
				},{
					name:"user_group_id",
					type:"VARCHAR",
					maxLength:255,
					references:{
						table:"user_groups",
						column:"user_group_id",
						onDelete:"cascade",
						onUpdate:"cascade"	
					}
				},{
					name:"right_id",
					type:"VARCHAR",
					maxLength:255,
					references:{
						table:"rights",
						column:"right_id",
						onDelete:"cascade",
						onUpdate:"cascade"	
					}
				}]
			});
			table.addIndex({
				id:"idx_rights",
				unique:true,
				columns:["user_group_id","right_id"]
			})
		}
		
	/* tokens table */
		table = db.getTable("tokens");
		if (!table.exists){
			table.create({
				columns:[{
					name:"user_id",
					type:"VARCHAR",
					maxLength:255,
				},{
					name:"token",
					type:"VARCHAR",
					maxLength:255,
					
				},{
					name:"expires",
					type:"timestamp",
				}]
			});
			table.addIndex({
				id:"tokens_token",
				unique:true,
				columns:["token"]
			})
		}
	/* crypt_keys table */
		table = db.getTable("crypt_keys");
		if (!table.exists){
			table.create({
				columns:[{
					name:"name",
					type:"VARCHAR",
					maxLength:255,
					isPrimaryKey:true
				},{
					name:"key",
					type:"VARCHAR",
					maxLength:255,
				},{
					name:"created",
					type:"timestamp",
				}]
			});
			table.addIndex({
				id:"crypt_keys",
				unique:true,
				columns:["name"]
			})
		}
		/* add newer columns */
			if (!("type" in table.columns)){
				table.addColumn({
					name:"type",
					type:"VARCHAR",
					maxLength:255,
					defaultValue:"'jasypt-basic'"
				})	
			}
		/* modify existing columns */
			if (table.columns.key.column_size < 2000){
				table.modifyColumn("key",{
					type:"VARCHAR",
					maxLength:2000
					
				})
			}
		
	dm = new Myna.DataManager("myna_permissions");
	
	/* check for Myna Admin rights */
		var installed_rights = new Myna.Query({
				ds:"myna_permissions",
				sql:<ejs>
					 select name from rights
					 where appname='myna_admin'
				</ejs>
		}).valueArray("name").join()
		if (!installed_rights.listContains("full_admin_access")){
				Myna.Permissions.addRight({
					 appname:"myna_admin",
					 description:"Full access to all parts of the application",
					 name:"full_admin_access"
				})
		}
	/* check for myna_admin user */
		var users = dm.getManager("users");
		if (!users.find("myna_admin").length){
				users.create({
					 user_id:"myna_admin",
					 first_name:"Myna",
					 middle_name:"",
					 last_name:"Administrator",
					 title:"",
					 created:new Date()
				})
				Myna.Permissions.getUserById("myna_admin")
				.setLogin({type:"server_admin",login:"Admin"})
		}
	/* check for "Myna Administrators" user group */
		var user_groups = dm.getManager("user_groups");
		var admin_group = user_groups.find({name:"Myna Administrators",appname:"myna_admin"});
		if (!admin_group.length){
			var group = Myna.Permissions.addUserGroup({
				 name:"Myna Administrators",
				 appname:"myna_admin",
				 description:"Users with full access to Myna's administrative tools"
			})
		} else {
			group=Myna.Permissions.getUserGroupById(admin_group[0])
		}
		group.addUsers("myna_admin");
		group.addRights(
			 Myna.Permissions.getRightsByAppname("myna_admin")
				.valueArray("right_id")
		);
$server_gateway.loadDataSources();
