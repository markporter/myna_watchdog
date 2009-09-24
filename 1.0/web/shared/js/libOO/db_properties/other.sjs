
var templates = {
	addColumn:[
		"ALTER TABLE {tableName} ADD COLUMN {columnDef}"
	],
	dropColumn:[
		"ALTER TABLE {tableName} DROP COLUMN {name}"
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
	addConstraint:[
		"ALTER TABLE {tableName} ADD CONSTRAINT {id} {constraint} ({name})"
	],
	dropPrimaryKey:[
		'ALTER TABLE {tableName} DROP CONSTRAINT {id}'
	],
	addNullConstraint:[
		"ALTER TABLE {tableName} ADD CONSTRAINT {id} CHECK ({name} IS NOT NULL)"
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
			'<tpl if="onUpdate.length"> ON UPDATE {onUpdate} </tpl>',
			'<tpl if="onDelete.length"> ON DELETE {onDelete} </tpl>',
		'</tpl>',
	],
	
}
var types={
	BIGINT:"BIGINT",
	BLOB:"BLOB",
	CLOB:"CLOB",
	DATE:"DATE",
	INTEGER:"INT",
	NUMERIC:'NUMERIC({maxLength}<tpl if="decimalDigits.length">, {decimalDigits}</tpl>)',
	TIMESTAMP:"TIMESTAMP",
	VARBINARY:"VARBINARY({maxLength})",
	VARCHAR:"VARCHAR({maxLength})"
}
var dsInfo={
	driver:"",
	url:""
}
var connectionTestSql="select 1";
var functions={
	getDefaultSchema:function(db){
		var schemas = db.schemas;
		var defaultSchema="public";
		for (var x =0; x < schemas.length; ++x){
			if (schemas[x].toLowerCase() == ""){
				defaultSchema = "";
				break;

			}
		}
		return defaultSchema;
	},
	getSchemas:function(db){
		var rsSchemas = db.md.getSchemas();
		var schemas = new Myna.Query(rsSchemas).valueArray("table_schem");
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
}