
var templates = {
	
	addColumn:[
		"ALTER TABLE {tableName} ADD {columnDef}"
	],
	dropColumn:[
		"ALTER TABLE {tableName} DROP COLUMN {name}"
	],
	addConstraint:[
		"ALTER TABLE {tableName} ADD CONSTRAINT {id} {constraint} ({name})"
	],
	addNullConstraint:[
		"ALTER TABLE {tableName} {name} NOT NULL)"
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
		'<tpl if="defaultValue.length"> DEFAULT {defaultValue} </tpl> ',
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
			'<tpl if="onUpdate.length"> ON UPDATE {onUpdate} </tpl>',
			'<tpl if="onDelete.length"> ON DELETE {onDelete} </tpl>',
		'</tpl>',
	],
	foreignKeyConstraint:[
		'<tpl for="references">',
			'ALTER TABLE {parent.tableName} ADD CONSTRAINT {parent.id} FOREIGN KEY ({parent.name}) REFERENCES {table}({column})',
			'<tpl if="onDelete.length"> ON DELETE {onDelete} </tpl>',
		'</tpl>',
	],
}
var types={
	BIGINT:"BIGINT",
	BLOB:"VARBINARY(MAX)",
	CLOB:"VARCHAR(MAX)",
	DATE:"DATETIME",
	INTEGER:"INT",
	TEXT:"VARCHAR(MAX)", //this type should be whatever is best for large amounts 
				//of text that can fit in server memory
	NUMERIC:'NUMERIC({maxLength}<tpl if="decimalDigits.length">, {decimalDigits}</tpl>)',
	TIMESTAMP:"DATETIME",
	VARBINARY:"VARBINARY({maxLength})",
	VARCHAR:"VARCHAR({maxLength})"
}
var dsInfo={
	driver:"net.sourceforge.jtds.jdbc.Driver",
	url:"jdbc:jtds:sqlserver://{server}:{port}/{db}"
}
var functions={
	setClob:function(con,st,index,value){
		st.setObject(index+1,value,java.sql.Types.VARCHAR);
	},
	setBlob:function(con,st,index,value){
		st.setObject(index+1,value,java.sql.Types.VARBINARY);
	}
}