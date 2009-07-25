
var templates = {
	
	addColumn:[
		"ALTER TABLE {tableName} ADD {columnDef}"
	],
	addConstraint:[
		"ALTER TABLE {tableName} ADD CONSTRAINT {id} {constraint} ({name})"
	],
	addNullConstraint:[
		"ALTER TABLE {tableName} ADD CONSTRAINT {id} CHECK ({name} IS NOT NULL)"
	],
	addForeignKeyConstraint:[
		'<tpl for="references">',
			'ALTER TABLE {parent.tableName} ADD CONSTRAINT {parent.id} FOREIGN KEY ({parent.name}) REFERENCES {table}({column})',
			'<tpl if="onDelete.length"> ON DELETE {onDelete} </tpl>',
		'</tpl>',
	],
	dropConstraint:[
		'ALTER TABLE {tableName} DROP CONSTRAINT {id}'
	],
	dropPrimaryKey:[
		'ALTER TABLE {tableName} DROP CONSTRAINT {id}'
	],
	dropColumn:[
		"ALTER TABLE {tableName} DROP COLUMN {name}"
	],
	createTable:[
		'CREATE TABLE {tableName} ( \n',
		'<tpl for="columns">',
			'\t{.}{[ xindex == xcount?"":", " ]}\n',
		'</tpl>',
		')'
	],
	createColumn:[
		'{name} ',
		'{type} ',
		'<tpl if="defaultValue && defaultValue.length"> DEFAULT {defaultValue} </tpl> ',
		'{constraints} '
	],
	createIndex:[
		'CREATE <tpl if="unique.length"> UNIQUE </tpl>  INDEX {id} ',
		'ON {tableName} ({columns})'
	],
	dropTable:[
		'DROP TABLE {tableName}'
	],
	notNullConstraint:[
		'NOT NULL'
	],
	uniqueConstraint:[
		'UNIQUE'
	],
	primaryKeyConstraint:[
		'PRIMARY KEY'
	],
	referencesConstraint:[
		'<tpl for="references">',
			'REFERENCES {table}({column})',
			'<tpl if="onDelete.length"> ON DELETE {onDelete} </tpl>',
		'</tpl>',
	],
	/* foreignKeyConstraint:[
		'<tpl for="references">',
			'ALTER TABLE {parent.tableName} ADD CONSTRAINT {parent.id} FOREIGN KEY ({parent.name}) REFERENCES {table}({column})',
			'<tpl if="onDelete.length"> ON DELETE {onDelete} </tpl>',
		'</tpl>',
	], */
}
var types={
	BIGINT:"NUMBER(10)",
	BLOB:"BLOB",
	CLOB:"CLOB",
	INTEGER:"INT",
	TEXT:"CLOB", //this type should be whatever is best for large amounts 
				//of text that can fit in server memory
	NUMERIC:'NUMERIC({maxLength}<tpl if="decimalDigits.length">, {decimalDigits}</tpl>)',
	TIMESTAMP:"TIMESTAMP",
	VARBINARY:"BLOB",
	VARCHAR:"VARCHAR({maxLength})"
}
var dsInfo={
	driver:"oracle.jdbc.OracleDriver",
	url:"jdbc:oracle:thin:@{server}:{port}:{db}"
}
var functions={
	getDefaultSchema:function(db){
		return String(db.md.getUserName());
	},
	getSchemas:function(db){
		return new Myna.Query({
			ds:db.ds,
			sql:"select distinct owner from all_tables"
		}).valueArray("owner")
	},
	getTables:function(db,schema){
		var rsTables = db.md.getTables(
			db.catalog,
			schema,
			'%',
			null
		); 
		/* var rsTables = this.md.getTables(
			null,
			null,
			null,
			null
		); */
		
		var data =new Myna.Query(rsTables).data;
		rsTables.close();
		return data
	},
	setClob:function(con,st,index,value){
		var clob = Packages.oracle.sql.CLOB.createTemporary(con, false,Packages.oracle.sql.CLOB.DURATION_SESSION);
		clob.putString(1,value);
		st.setClob(index+1, clob);
	},
	setBlob:function(con,st,index,value){
		var blob = Packages.oracle.sql.BLOB.createTemporary(con, false,Packages.oracle.sql.BLOB.DURATION_SESSION);
		blob.putBytes(1,value);
		st.setBlob(index+1, blob);
	}
}