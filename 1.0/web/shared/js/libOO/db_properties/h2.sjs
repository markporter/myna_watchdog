
var templates = {
	addColumn:[
		"ALTER TABLE {tableName} ADD COLUMN {columnDef}"
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
			'<tpl if="onUpdate.length"> ON UPDATE {onUpdate} </tpl>',
			'<tpl if="onDelete.length"> ON DELETE {onDelete} </tpl>',
		'</tpl>',
	],
	dropConstraint:[
		'ALTER TABLE {tableName} DROP CONSTRAINT {id}'
	],
	dropIndex:[
		'DROP INDEX {name}'
	],
	dropPrimaryKey:[
		'ALTER TABLE {tableName} DROP CONSTRAINT PRIMARY KEY'
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
		'CREATE <tpl if="unique"> UNIQUE </tpl>  INDEX {id} ',
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
	maxRows:[
		'{query}\n',
		'LIMIT {maxRows}\n',
	],
	offsetRows:[
		'{query}\n',
		'LIMIT {offset},{maxRows}\n',
	]
	/* foreignKeyConstraint:[
		'<tpl for="references">',
			'ALTER TABLE {parent.tableName} ADD CONSTRAINT {parent.id} FOREIGN KEY ({parent.name}) REFERENCES {table}({column})',
			'<tpl if="onUpdate.length"> ON UPDATE {onUpdate} </tpl>',
			'<tpl if="onDelete.length"> ON DELETE {onDelete} </tpl>',
		'</tpl>',
	], */
}
var types={
	BIGINT:"BIGINT",
	BLOB:"BLOB",
	CLOB:"VARCHAR",
	DATE:"DATE",
	INTEGER:"INT",
	NUMERIC:'NUMERIC({maxLength}<tpl if="decimalDigits">, {decimalDigits}</tpl>)',
	TEXT:"VARCHAR", //this type should be whatever is best for large amounts 
					//of text that can fit in server memory
	TIMESTAMP:"TIMESTAMP",
	VARBINARY:"BINARY({maxLength})",
	VARCHAR:"VARCHAR({maxLength})"
}
var columnQuoteChar='"';
var dsInfo={
	driver:"org.h2.Driver",
	url:"jdbc:h2:tcp://{server}:{port}/{db}",
	file_url:"jdbc:h2:file:{file};AUTO_SERVER=TRUE"
}
var connectionTestSql="select 1";
var functions={
	getDefaultSchema:function(db){
		var schemas = db.schemas;
		var defaultSchema="public";
		for (var x =0; x < schemas.length; ++x){
			if (!schemas[x] || schemas[x].toLowerCase() == ""){
				defaultSchema = "";
				break;

			}
		}
		return defaultSchema;
	},
	getSchemas:function(db){
		
		var rsSchemas = db.md.getSchemas();
		var schemas = new Myna.Query(rsSchemas).valueArray("schema_name");
		schemas.push("");
		rsSchemas.close();
		return schemas;
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
		st.setObject(index+1,value,java.sql.Types.CLOB);
		/* var reader =new java.io.StringReader(value);
		st.setCharacterStream(index,reader,value.length) */
	}
}