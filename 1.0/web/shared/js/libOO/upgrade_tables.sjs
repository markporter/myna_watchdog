
/* installs or upgrades standard tables */


var ds;
var db;
var table;
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
	

$server_gateway.loadDataSources();