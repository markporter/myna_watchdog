var db = new Myna.Database("myna_instance");
var table = db.getTable("HANDLERS");

table.create({
	recreate:false,
	columns:[{
		name:"ID",
		maxLength:"255",
		allowNull:false,
		type:"VARCHAR"
	},{
		name:"NAME",
		maxLength:"255",
		allowNull:true,
		type:"VARCHAR"
	},{
		name:"PARAMS",
		maxLength:"2147483647",
		allowNull:true,
		type:"VARCHAR"
	},{
		name:"SERVICE_ID",
		maxLength:"255",
		allowNull:true,
		type:"VARCHAR"
	
	
	}]
});


// Keys:
table.addPrimaryKey({
	id:"PK_HANDLERS",
	column:"id"
});

table.addForeignKey({
	localColumn:"SERVICE_ID",
	foreignTable:"SERVICES",
	foreignColumn:"ID",
	onDelete:"CASCADE", 
	onUpdate:"CASCADE" 
});

		
var db = new Myna.Database("myna_instance");
var table = db.getTable("SERVICES");

table.create({
	recreate:false,
	columns:[{
		name:"ID",
		maxLength:"255",
		allowNull:false,
		type:"VARCHAR"
	},{
		name:"NAME",
		maxLength:"255",
		allowNull:true,
		type:"VARCHAR"
	},{
		name:"ADMIN_EMAIL",
		maxLength:"255",
		allowNull:true,
		type:"VARCHAR"
	},{
		name:"ENABLED",
		defaultValue:"0",
		allowNull:true,
		type:"INTEGER"
	},{
		name:"TEST_STATUS",
		maxLength:"255",
		defaultValue:"'pending'",
		allowNull:true,
		type:"VARCHAR"
	},{
		name:"STATUS",
		maxLength:"255",
		defaultValue:"'unknown'",
		allowNull:true,
		type:"VARCHAR"
	
	
	}]
});


var db = new Myna.Database("myna_instance");
var table = db.getTable("TEST_PARAMETERS");

table.create({
	recreate:false,
	columns:[{
		name:"ID",
		maxLength:"255",
		allowNull:false,
		type:"VARCHAR"
	},{
		name:"TEST_ID",
		maxLength:"255",
		allowNull:true,
		type:"VARCHAR"
	},{
		name:"NAME",
		maxLength:"255",
		allowNull:true,
		type:"VARCHAR"
	},{
		name:"VALUE",
		maxLength:"4000",
		allowNull:true,
		type:"VARCHAR"
	
	
	}]
});

// Keys:
table.addPrimaryKey({
	id:"PK_TEST_PARAMETERS",
	column:"id"
});

table.addForeignKey({
	localColumn:"TEST_ID",
	foreignTable:"TESTS",
	foreignColumn:"ID",
	onDelete:"CASCADE", 
	onUpdate:"CASCADE" 
});



var db = new Myna.Database("myna_instance");
var table = db.getTable("TESTS");

table.create({
	recreate:false,
	columns:[{
		name:"ID",
		maxLength:"255",
		allowNull:false,
		type:"VARCHAR"
	},{
		name:"SERVICE_ID",
		maxLength:"255",
		allowNull:true,
		type:"VARCHAR"
	},{
		name:"SCRIPT_NAME",
		maxLength:"255",
		allowNull:true,
		type:"VARCHAR"
	},{
		name:"SCRIPT_TEXT",
		maxLength:"2147483647",
		allowNull:true,
		type:"VARCHAR"
	},{
		name:"STATUS",
		maxLength:"255",
		defaultValue:"'unknown'",
		allowNull:true,
		type:"VARCHAR"
	},{
		name:"LAST_CHECK",
		allowNull:true,
		type:"TIMESTAMP"
	},{
		name:"FAIL_AFTER",
		defaultValue:"1",
		allowNull:true,
		type:"INTEGER"
	},{
		name:"FAIL_COUNT",
		defaultValue:"0",
		allowNull:true,
		type:"INTEGER"
	},{
		name:"FAIL_MESSAGES",
		maxLength:"2147483647",
		allowNull:true,
		type:"VARCHAR"
	},{
		name:"ENABLED",
		defaultValue:"0",
		allowNull:true,
		type:"INTEGER"
	
	
	}]
});

