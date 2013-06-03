
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
		'</tpl>'
	],
	dropConstraint:[
		'ALTER TABLE {tableName} DROP CONSTRAINT {id}'
	],
	dropPrimaryKey:[
		'ALTER TABLE {tableName} DROP CONSTRAINT {id}'
	],
	dropIndex:[
		'DROP INDEX {name}'
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
			'<tpl if="onDelete.length"> ON DELETE {onDelete} </tpl>',
		'</tpl>'
	]
	/* foreignKeyConstraint:[
		'<tpl for="references">',
			'ALTER TABLE {parent.tableName} ADD CONSTRAINT {parent.id} FOREIGN KEY ({parent.name}) REFERENCES {table}({column})',
			'<tpl if="onDelete.length"> ON DELETE {onDelete} </tpl>',
		'</tpl>',
	], */
}
var types={
	BIGINT:"NUMBER(22)",
	BLOB:"BLOB",
	CLOB:"CLOB",
	INTEGER:"INT",
	TEXT:"CLOB", //this type should be whatever is best for large amounts 
				//of text that can fit in server memory
	NUMERIC:'NUMERIC({maxLength}<tpl if="decimalDigits">, {decimalDigits}</tpl>)',
	TIMESTAMP:"TIMESTAMP",
	VARBINARY:"BLOB",
	VARCHAR:"VARCHAR({maxLength})"
}
var dsInfo={
	driver:"oracle.jdbc.OracleDriver",
	url:"jdbc:oracle:thin:@{server}:{port}:{db}",
	port:"1521"
}
var columnQuoteChar='"';
var concatOperator=" || ";
var connectionTestSql="select 1 from dual";
var functions={
	getDefaultSchema:function(db){
		return String(db.md.getUserName());
	},
	getSchemas:function(db){
		var rsSchemas = db.md.getSchemas();
		var schemas = new Myna.Query(rsSchemas).valueArray("table_schem");
		schemas.push("");
		rsSchemas.close();
		return schemas;
	},
	/*getSchemas:function(db){
		return new Myna.Query({
			ds:db.ds,
			sql:"select distinct owner from all_tables"
		}).valueArray("owner")
	},*/
	getTables:function(db,schema){
		var user = String(db.md.getUserName());
		if (schema.toLowerCase() == user.toLowerCase()){
			var rsTables = db.md.getTables(
				db.catalog,
				schema,
				'%',
				null
			); 
			var data =new Myna.Query(rsTables).data;
			rsTables.close();
			return data.filter(function(row){
				return !/(\$|PLAN_TABLE)/.test(row.table_name)
			})
		} else {
			return new Myna.Query({
				ds:db.ds,
				sql:[
					"select",
						"null table_cat,",
						"null table_schem,",
						"tp.table_name,",
						"case when",
							"exists (select 'x' from all_views where view_name= table_name and owner={schema})",
						"then 'VIEW'",
						"else 'TABLE'",
						"end table_type,",
						"null remarks,",
						"null type_cat,",
						"{schema} type_schem,",
						"null type_name,",
						"null self_referencing_col_name,",
						"null ref_generation",
					"from",
						"table_privileges tp",
					"where",
						"grantee={user} ",
						"and owner={schema}"
				].join("\n"),
				values:{
					user:user,
					schema:schema
				}
			}).data
		}
		/*var rsTables = db.md.getTables(
			db.catalog,
			schema,
			'%',
			null
		); 
		var data =new Myna.Query(rsTables).data;
		rsTables.close();
		return data.filter(function(row){
			return !/(\$|PLAN_TABLE)/.test(row.table_name)
		})*/
	},

	setClob:function(con,st,index,value){
		con = st.getInnermostDelegate().getConnection();
		var clob = Packages.oracle.sql.CLOB.createTemporary(con, false,Packages.oracle.sql.CLOB.DURATION_SESSION);
		clob.putString(1,value);
		st.setClob(index+1, clob);
	},
	setBlob:function(con,st,index,value){
		con = st.getInnermostDelegate().getConnection();
		var blob = Packages.oracle.sql.BLOB.createTemporary(con, false,Packages.oracle.sql.BLOB.DURATION_SESSION);
		blob.putBytes(1,value);
		st.setBlob(index+1, blob);
	},
	totalRowsSql:function(sql){
		return "select count(*) count from ({0})  myna_count".format(sql)
	},
	offsetSql:function(sql,limit,offset){
		offset = offset||0
		return <ejs>
		
			SELECT * FROM (
		
				SELECT 
					rownum rnum, 
					a.*
				FROM(
					<%=sql%>
				) a 
				WHERE rownum <= <%=limit+offset%>
			)
			<@if offset>
			WHERE rnum ><%=offset%>
			</@if>
			
			
		</ejs> 
	},
}