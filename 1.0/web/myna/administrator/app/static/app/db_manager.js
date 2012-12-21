/*global Ext $FP appVars App  console*/
Ext.override(Ext.view.AbstractView, { 
    onRender: function() 
    { 
        var me = this; 
        this.callOverridden(); 
        if (me.loadMask && Ext.isObject(me.store)) { 
            me.setMaskBind(me.store); 
        } 
    } 
});

var controllers=[]
/* ----------- ViewPort ----------------------------------------------------- */
	Ext.define('App.view.Viewport' ,{
		extend: 'Ext.container.Viewport',
		alias: 'widget.view_main',
		initComponent: function() {
			Ext.apply(this,{
				layout:"fit",
				items:[{
					layout:"border",
					tbar:[{
							xtype:"tbtext",
							text:"<div class='app_title'>"+appVars.title+"</div>"
						},{
							xtype:"tbfill"
						},{
							xtype:"tbtext",
							text:"&nbsp;".repeat(10)

						},{
							text:"New SQL Window",
							iconCls:"icon_edit_form",
							handler:function(c){
								var view=c.up("viewport");
								view.fireEvent("new_sql_window",{
									src:view
								})
							}
									
						},{
							text:"New Table",
							iconCls:"icon_form_search",
							handler:function(c){
								var view=c.up("viewport");
								view.fireEvent("new_table",{
									src:view
								});
							}
						},{
							text:"Logout",
							handler:function(){
								location.href=appVars.appUrl+"main/logout"
							}
					}],
					items:[{//west
							region:"west",
							width:250,
							xtype:"db_object_tree",
							resizable:true,
							collapsible:true,
							title:"Database Objects"
					},{//center
						//	xtype:"panel",
							region:"center",
							frame:false,
							layout:"fit",
							border:false,
																
							tbar:[],
						//	items:[{//center_tabs
								id:"center_tabs",
								hidden:true,
								xtype:"tabpanel",
								autoDestroy:true,
								listeners: {
								}
								
						//	}]
						
						}]
				}]
			})
			this.callParent(arguments);
		}
	});
/* ----------- "U": local utility functions --------------------------------- */
	var U = {
		directMask:function(panel,text,func){
			var dom;
			var errorMsg = "App.directMask: " + String(panel) + " is not a valid panel";
			if (panel instanceof Ext.panel.Panel){
				dom = panel.getEl()
			} else if (typeof panel == "string"){
				dom =Ext.getCmp(panel);
				if (!dom){
					dom = Ext.get(panel);	
				}
				if (!dom){
					throw new Error(errorMsg);
				}
			} else {
				dom = Ext.get(panel);
				//throw new Error(errorMsg);
			}
			
			if (typeof text == "function"){
				func = text;
				text="Please Wait";
			}
			dom.mask(text)
			return function(){
				dom.unmask()
				return func.apply(this,Array.parse(arguments))
			}
		},
		infoMsg: function(/*template,replacement 1,replacement 2,... */){

			var s = Ext.String.format.apply(String, Array.prototype.slice.call(arguments, 0));
			Ext.create('widget.uxNotification', {
				title: 'Notification',
				corner: 'tr',
				//stickOnClick: false,
				//manager: 'center_tabs',
				iconCls: 'ux-notification-icon-information',
				slideInDuration: 800,
				//closable:false,
				slideBackDuration: 1500,
				slideInAnimation: 'elasticIn',
				slideBackAnimation: 'elasticIn',
				cls: 'ux-notification-light',

				html: s
			}).show();
		}
	}
/* =========== General View Components ====================================== */
/* =========== DbObjects ==================================================== */
	/* ----------- Controller ----------------------------------------------- */
		controllers.push("DbObjects");
		Ext.define('App.controller.DbObjects', {
			extend: 'Ext.app.Controller',
			init: function() {
				this.control({

				})
			}
		})
	/* =========== Views ==================================================== */
		/* ----------- db_object_tree --------------------------------------- */
			Ext.define('App.view.db_objects.Tree', {
				extend: 'Ext.tree.Panel',
				alias:'widget.db_object_tree',
				initComponent:function () {
					Ext.apply(this,{
						store:{
							proxy: {
								type: 'direct',
								directFn: $FP.DbManager.getTreeNode,
								extraParams:{
									ds:appVars.ds_name
								}
							},
							root: {
								text: '',
								id: 0,
								expanded: true
							},
							folderSort: true,
							sorters: [{
								property: 'text',
								direction: 'ASC'
							}]
						},
						useArrows: true,
						rootVisible:false,
						listeners:{
							itemcontextmenu:function(panel,record,item,index,e){
								e.stopEvent();
								var m=Ext.widget({
									xtype:"menu",
									items:[{
										text:"Query " + record.get("text")
									}]
								})
								m.showBy(item,null,[50,0])
							}
						}
					})
					this.callParent(arguments)
				}
			})
/* =========== Sql ========================================================== */
	/* ----------- Controller ----------------------------------------------- */
		controllers.push("Sql");
		Ext.define('App.controller.Sql', {
			extend: 'Ext.app.Controller',
			init: function() {
				this.control({
					'viewport':{
						new_sql_window:function () {
							this.openSql();
						}
					},
					'sql *[itemId=sql_control]':{
						change:this.sqlChange
					},
					'sql':{
						executeSql:this.executeSql
						
					}
				});
			},
			openSql:function(sql,autoRunSql){
				App.addCenterTab({
					xtype:"sql",
					sql:sql||" ",
					autoRunSql:autoRunSql
				})
			},
			executeSql:function(options){
				window.setTimeout(function(){
					var view = options.src
					view.el.mask("Executing query...")
					var rp = view.down("*[itemId=result_panel]")
					var pageSize = parseInt((rp.getHeight()-75)/21,10)
					$FP.DbManager.executeSql({
						sql:options.sql,
						ds:appVars.ds_name,
						limit:pageSize,
						page:1
					},function(result){
						view.el.unmask();
						rp.removeAll()
						if (result.data){
							rp.add({
								xtype:"resultgrid",
								sql:options.sql,
								pageSize:pageSize,
								result:result
							})
						} else {
							rp.add({
								xtype:"form",
								title:"Error Executing Query",
								bodyStyle:"padding:15px;",
								items:[{
									xtype:"displayfield",
									value:result.errorMsg
								},
								{
									xtype:"displayfield",
									value:result.errorDetail
								}]
							})
						}
					})
				},100)
				
			},
			sqlChange:function(control,newValue){
				control.up("sql").setTitle("SQL: " + newValue.replace(/\s/g," ").left(25))
			}
			
		});
	/* =========== Views ==================================================== */
		/* ----------- sql ----------------------------------------- */
			Ext.define('App.view.sql.Sql', {
				extend: 'Ext.panel.Panel',
				alias:'widget.sql',
				layout:{
					type:"vbox",
					align:"stretch"
				},
				//queryMode:"local",
				beautify:function () {
					var indent =0;
					var selectIndent =0;
					/*var parenIndent =0;
					var result=[];
					var line=[];*/
					var lastCommand="";
					var parens =[];
					var selects =[];
					var sqlControl=this.down("*[itemId=sql_control]");
					var sql = sqlControl.getValue()||"";
					var newSql = sql
						.replace(/[\n\s]+/g," ")
						.replace(/(\W)on\s*\(/ig,"$1 on ( ")
						
						.replace(/(\s*)(['\.\w]+|,|\(|\))(\s*)/g,function(match,begin,word,end){
							switch(true){
							
							
								case word =="(":
									parens.push(indent);
									
									indent++;
									lastCommand="subquery";
									return word +"\n" + "\t".repeat(indent);
								case word ==")":
									if (lastCommand != "function") {
										if (parens.length == selects.parenDepth) {
											selects.pop();
											selects.parenDepth--;
										}
										indent = parens.pop();
									}
									
									lastCommand="end_subquery";
									//return word + end
									return  "\n" + "\t".repeat(indent) +word + "\n" + "\t".repeat(indent);
								case /^inner|outer|full|join$/i.test(word) && !/_/.test(word):
									if (/^inner|outer|full$/i.test(lastCommand)){
										return match;
									}else{
										//indent++;
									}
									
									lastCommand = word;
									return  "\n" + "\t".repeat(indent) +match;
									
								case /^on$/i.test(word):
									if (!/^inner|outer|full|join$/i.test(lastCommand)){
										//indent++
									}
									
									lastCommand = word;
									return  word  + "\t".repeat(indent);
								case /^and|or$/i.test(word):
									if (lastCommand != word ){
										//indent++
									}
									lastCommand = word;
									return "\n"+"\t".repeat(indent) + word +" ";
										
								case /^union/i.test(word):
									selectIndent=0;
									indent=0;
										
									lastCommand = word;
									return "\n" + word +"\n";
								case /^select/i.test(word):
									selects.push(indent);
									selects.parenDepth = parens.length;
									indent++;
										
									lastCommand = word;
									return "\n" + "\t".repeat(indent-1)   + word +"\n" + "\t".repeat(indent);
									
								case /^from|where|having$/i.test(word):
									if (lastCommand=="text") return match;
									indent = selects.last(0)+1;
									return "\n" +"\t".repeat(indent-1) + word +"\n" + "\t".repeat(indent);
								
								case /^group|order$/i.test(word):
									if (lastCommand=="text") return match;
									indent = selects.last(0)+1;
									lastCommand=word;
									return "\t".repeat(indent-1) +"\n" + word +end;
								case /^by$/i.test(word):
									if (/group|order/.test(lastCommand)) {
										return  /* "\t".repeat(indent-1) +"\n" + */word +"\n" + "\t".repeat(indent);
									} else return match;

								case /,$/.test(word)/* word =="," */:
									//console.log("word==",word)
									if (lastCommand == "function") return word;
									return word +"\n" + "\t".repeat(indent);
								default:
									lastCommand=match;
									return match;
							}
						}).replace(/\n\s*\n/g,"\n").trim();
					sqlControl.setValue(newSql);
				},
				setSql:function (sql) {
					this.down("*[itemId=sql_control]").setValue(sql);
				},
				sql_autocomplete:function(editor) {

			        // We want a single cursor position.
			        if (editor.somethingSelected()) return;

			        var cur = editor.getCursor();
			        var alias = editor.getTokenAt(editor.getCursor());
			        var table_name = alias.string;
			        
			        
			        
			        function insert(str) {
			            //editor.replaceSelection(str, result.from, result.to);
			            editor.replaceSelection(str);
			            window.setTimeout(function(){
			                editor.setSelection(
			                    editor.getCursor(false),
			                    editor.getCursor(false)
			                );
			                editor.focus();
			            });
			        }
			        insert(".");
			        var matches = editor.getValue().match(r =new RegExp("(\\w+)\\s+" + alias.string+"\\s","im"));
			        if (matches){
			            table_name = matches[1];
			        }
			        console.log(r,table_name)
			   
			        
			        var m = Ext.create('Ext.menu.Menu', {
			            plain:true,
			            items:[{
			                xtype:"combo",
			                //values:completions,
			                enableKeyEvents:true,
			                typeAhead:true,
			                queryMode:"remote",
			                displayField:'text',
			                valueField:'text',
			                store:{
			                    autoLoad:true,
			                    proxy:{
			                        type: 'direct',

			                        directFn:$FP.DbManager.getTreeNode,
			                        paramsAsHash:true,
			                        extraParams:{
			                            ds:appVars.ds_name,
			                            node:"table:"+table_name
			                        },
			                        reader: {
			                            type: 'json'
			                        }
			                    },
			                    fields:[
			                        {name:'text'}
			                    ]
			                    
			                },
			                listeners:{
			                    afterrender:function (c) {
			                        window.setTimeout(function () {c.doQuery("",true);c.focus();},100);
			                    },
			                    select:function (c,r) {
			                        insert(r.first().get("text"));
			                        c.ownerCt.hide();
			                    },
			                    specialKey:function (c,e) {
			                        if (e.getKey() == e.ESC) c.ownerCt.hide();
			                    }
			                }
			            }],
			            listeners:{

			                hide:function (panel) {
			                    window.setTimeout(function(){
			                        editor.setSelection(
			                            editor.getCursor(false),
			                            editor.getCursor(false)
			                        );
			                        editor.focus();
			                    });
			                }
			            }
			        });
			        
			        var coords=editor.cursorCoords(true, "page");
			        m.showAt([coords.left,coords.bottom+3]);
			        /*window.setTimeout(function(){
			            editor.setSelection(
			                editor.getCursor(false),
			                editor.getCursor(false)
			            );
			            editor.focus();
			        },50);*/

			        return true;
			    },
				initComponent:function(){
					if (!CodeMirror.commands.sql_autocomplete) {
						CodeMirror.commands.sql_autocomplete = this.sql_autocomplete
					}
					var view = this;
					this.items=[{
						layout:"fit",
						items:[{
							xtype:"codemirror",
							itemId:"sql_control",
							value:this.sql||"",
							flex:1,
							options:{
								lineNumbers: true,
								matchBrackets: true,
								//theme:"rubyblue",
								indentUnit: 4,
								mode: "text/x-plsql",
								extraKeys:{
									".": "sql_autocomplete",
									F8:function(){
										view.fireEvent("executeSql",{
											src:view,
											sql:view.down("*[itemId=sql_control]").getValue()
										})
									},
									F9:function(){
										view.beautify();
									}
								}
							},
							listeners:{
								change:Ext.Function.createBuffered(function(c,sql){
									var v =c.up("sql");
									v.fireEvent("sql_changed",{
										src:v,
										sql:sql
									});
								},1000)
							}
						}],
						flex:1,
						tbar:[{
							text:"Execute (F8)",
							iconCls:"icon_cog_go",
							handler:function(btn){
								var view=btn.up("sql")
								var sql=view.down("*[itemId=sql_control]").getValue()
								view.fireEvent("executeSql",{src:view,sql:sql})
							}
						},{
							text:"Beautify (F9)",
							iconCls:"icon_beautify",
							handler:function(){
								view.beautify();
							}
						}]
					},{
						xtype:"splitter"
					},{
						layout:"fit",
						flex:2,
						itemId:"result_panel"
						
					}],
					this.callParent(arguments);
					if(this.autoRunSql) this.fireEvent("executeSql",{src:this,sql:this.sql})	
				}
			})
		/* ----------- resultgrid ----------------------------------------- */
			Ext.define('App.view.sql.ResultGrid', {
				extend: 'univnm.ext.SupaGrid',
				alias:'widget.resultgrid',
				
				events:{
				
				},
				paged:true,
				editFormConfig:{
					xtype:"resultgridform",
					width:400,
					title:"Values",
					position:"right"
				},
				loadMask:true,
				initComponent:function(){
					var columns = this.result.result.columns
					this.store = {
						proxy:{
							type: 'direct',
							directFn:$FP.DbManager.executeSql,
							paramsAsHash:true,
							extraParams:{
								ds:appVars.ds_name,
								sql:this.sql
							},
							reader: {
								type: 'json',
								totalProperty:'totalRows',
								root:'data'
							}
						},
						pageSize:this.pageSize,
						
						fields:["$num"].concat(columns.map(function(col){
							col.name = col.name.toLowerCase();
							if (col.type == "date"){
								return {
									name:col.name,
									convert:function(val){
										if (!(/\/Date\(\d+\)\//).test(val)) return val
										return new Date(
											parseInt(
												val.match(/Date\((\d+)\)/)[1],
												10
											)
										);
									}
									
								}
							} else {
								return col.name	
							}
						}))
					}
					
					this.columns=[{
						dataIndex:"$num", 
						text:"#",
						width:30
					}].concat(columns.map(function(col){
						return {dataIndex:col.name}	
					})).map(function(col){
						return Ext.applyIf(col,{
							text:col.dataIndex,
							renderer:function(val){
								if (val && val instanceof Date){
									return val.format("m/d/Y H:i:s")	
								} else {
									return String(val).left(100).escapeHtml()	
								}
							}	
						})
					})
					this.callParent(arguments);
					
					var s =this.getStore()
					s.totalCount = this.result.totalRows
					s.loadData(this.result.data)
					
					
				}
			})
		/* ----------- resultgridform ----------------------------------------- */
			Ext.define('App.view.sql.ResultGridForm', {
				extend: 'Ext.form.Panel',
				alias:'widget.resultgridform',
				width:800,
				events:{
				
				},
				initComponent:function(){
					Ext.apply(this,{

						title:"Values",
						tools:[{
							type:"close",
							handler:function(event,tool,panel){
								panel.ownerCt.form.close();
							}
						}],
						//autoScroll:true,
						layout:"fit",
						
						items:[{
							xtype:"propertygrid",
							source:{}
						}],
						listeners:{
							beforegridload:function(form,record){
								form.down("propertygrid").setSource(record.data);
							}
						}
					})
					this.callParent(arguments);
					
				}
			})
/* =========== Table ========================================================== */
	/* ----------- Controller ------------------------------------------------ */
		controllers.push("Table");
		Ext.define('App.controller.Table', {
			extend: 'Ext.app.Controller',
			init: function() {
				this.control({
					'viewport':{
						new_table:function () {
							this.editTable();
						}
					},
					'edit_table, edit_table *':{
						table_changed:function (event) {
							var dialog = event.src;
							if (!dialog.is("edit_table")) dialog= dialog.up("edit_table");
							this.tableChanged(dialog);
						},
						save_table:function (event) {
							event.src.el.mask("Applying Changes...");
							this.saveTable(event.tableDef,function (result) {
								event.src.el.unmask();
								if (result.success){
									event.src.resetTable();
								} else {
									U.infoMsg(result.errorMessage);
								}
							});
						}
					},
					'*[itemId=sqltab]':{
						activate:function (panel) {
							this.loadSqlCode(panel);
						}
					},
					'*[itemId=mynatab]':{
						activate:function (panel) {
							this.loadMynaCode(panel);
							
						}
					}
					
				});
			},
			saveTable:function (tableDef,cb) {
				$FP.DbManager.saveTable(tableDef,cb);
			},
			editTable:function(table_name){
				App.addCenterTab({
					xtype:"edit_table",
					table_name:table_name
				})
			},
			loadSqlCode:function (sqlCodePanel) {
				sqlCodePanel.mask("loading...")
				var tableDef=sqlCodePanel.up("edit_table").getTableDef();
				$FP.DbManager.getSqlCode(tableDef,function (result) {
					sqlCodePanel.unmask();
					var sqlTab = sqlCodePanel.down("*[itemId=sql_code]")
					sqlTab.setValue(result.code)
				})

			},
			loadMynaCode:function (mynaCodePanel) {
				mynaCodePanel.mask("loading...")
				var tableDef=mynaCodePanel.up("edit_table").getTableDef();
				$FP.DbManager.getMynaCode(tableDef,function (result) {
					mynaCodePanel.unmask();
					var mynaTab = mynaCodePanel.down("*[itemId=myna_code]")
					mynaTab.setValue(result.code)
				})

			},
			tableChanged:function (view) {
				var colStore = view.down("table_column_grid").getStore();
				if (!colStore.count() ||colStore.last().get("column_name")){
					colStore.add({})
				}

				var keyStore = view.down("table_key_grid").getStore();
				if (!keyStore.count() ||keyStore.last().get("key_name")){
					keyStore.add({})
				}

				var indexStore = view.down("table_index_grid").getStore();
				if (!indexStore.count() ||indexStore.last().get("name")){
					indexStore.add({})
				}
				
				var activeTab=view.down("tabpanel").getActiveTab();
				if (activeTab.itemId=="sqltab"){
					this.loadSqlCode(activeTab);
				}
				if (activeTab.itemId=="mynatab"){
					this.loadMynaCode(activeTab);
				}
				view.down("*[itemId=table_apply]").setDisabled(false);
				view.down("*[itemId=table_discard]").setDisabled(false);
				console.log("table_changed",view.getTableDef())
			}
			
			
		});
	/* =========== Views ===================================================== */
		/* ----------- edit_table ----------------------------------------- */
			Ext.define('App.view.table.Detail', {
				extend: 'Ext.panel.Panel',
				alias:'widget.edit_table',
				frame:true,
				resetTable:function () {
					this.down("table_column_grid").getStore().load()
					this.down("table_key_grid").getStore().load()
					this.down("table_index_grid").getStore().load()
					this.down("*[itemId=table_apply]").setDisabled(true);
					this.down("*[itemId=table_discard]").setDisabled(true);
					this.down("*[itemId=fld_recreate]").setValue(false);
				},
				getTableDef:function () {
					var view = this;
					var colStore = view.down("table_column_grid").getStore();
					var keyStore = view.down("table_key_grid").getStore();
					var indexStore = view.down("table_index_grid").getStore();
					function getData(store) {
						return store.data.items.map(function (record) {
								var data= record.data;
								if (record.phantom) {
									data.action="new"
								} else if (record.dirty){
									data.action="change";
									data.oldValues=record.modified
								} else {
									data.action="none"
								}
								return data
							}).concat(store.removed.map(function (record) {
								var data= record.data;
								data.action="remove";
								return data
							}))
					}

					return {
						table_name:view.table_name,
						ds:appVars.ds_name,
						recreate:view.recreate,
						keys:getData(keyStore).filter(function (data) {
							return data.type
						}),
						indexes:getData(indexStore).filter(function (data) {
							return data.columns
						}),
						columns:getData(colStore).filter(function (data) {
							return data.column_name
						})
					}
				},
				initComponent:function(){
					if (!this.table_name) this.table_name = window.prompt("New Table Name");
					if (!this.table_name){
						this.callParent(arguments);
						var tab =this;
						window.setTimeout(function () {tab.close()})
						return;
					}
					var table_name = this.table_name ||""
					Ext.applyIf(this,{
						is_new:!table_name.length,
						deleted_cols:[],
						title:"Editing Table: " + table_name,
						frame:true,
						/* main panel - table name */
						//layout:"fit",
						tbar:[{
								xtype:"tbtext",
								text:"Table Name:"
							},{
								xtype:"displayfield",
								value:table_name,
								itemId:"fld_table_name"
							},{
								xtype:"tbtext",
								text:"&nbsp;".repeat(10)
							},{
								xtype:"tbtext",
								text:"Drop and recreate?"
							},{
								xtype:"checkbox",
								itemId:"fld_recreate",
								checked:false,
								listeners:{
									change:function(c,currentState){
										var view=c.up("edit_table");
										view.recreate =currentState;
										view.fireEvent("table_changed",{
											src:view
										});
									}
								}
						}],
						layout:"fit",
						items:[{
						/* tabs */
							xtype:"tabpanel",
							/*enableTabScroll:true,
							deferredRender:false,
							layoutOnTabChange:true,
							autoDestroy:true,*/
							activeTab:0,
							items:[{
							/* column grid */
								title:"Columns",
								xtype:"table_column_grid",
								table_name:table_name
							},{
							/* keys */
								title:"Keys",
								xtype:"table_key_grid",
								table_name:table_name

							},{
								title:"Indexes",
								xtype:"table_index_grid",
								table_name:table_name
							},{
							/* Myna Code */
								title:"Myna Code",
								layout:"fit",
								itemId:"mynatab",
								items:[{
									itemId:"myna_code",
									xtype:"codemirror",
									options:{
										lineNumbers: true,
										matchBrackets: true,
										indentUnit: 4,
										mode: "text/javascript"
									}
								}]
							},{
							/* SQL Code */
								title:"SQL Code",
								itemId:"sqltab",
								layout:"fit",
								items:[{
									itemId:"sql_code",
									xtype:"codemirror",
									options:{
										lineNumbers: true,
										matchBrackets: true,
										indentUnit: 4,
										mode: "text/x-plsql"
									}
								}]
							}]
						}],
						buttonAlign:"center",
						buttons:[{
							text:"Apply Changes",
							itemId:"table_apply",
							disabled:true,
							handler:function(c){
								var view=c.up("edit_table");
								view.fireEvent("save_table",{
									src:view,
									tableDef:view.getTableDef()
								});
							}
						},{
							text:"Discard Changes",
							itemId:"table_discard",
							disabled:true,
							handler:function(c){
								var view=c.up("edit_table");
								view.resetTable();
								view.fireEvent("discard_table",{
									src:view
								});
							}
						}]
					})

					this.callParent(arguments);

				}
			})
		/* ----------- table_column_grid ------------------------------------ */
			Ext.define('App.view.table.ColumnGrid', {
				extend: 'Ext.grid.Panel',
				alias:'widget.table_column_grid',
				
				loadMask:true,
				initComponent:function(){
					var table_name = this.table_name
					var $this = this;
					Ext.applyIf(this,{
						tbar:[{
							xtype:"label",
							text:"Double-Click a row to edit"
						},{
							xtype:"tbfill"
						},{
							text:"Delete Column",
							iconCls:"icon_delete",
							handler:function(btn){
								//console.log(btn)
								var grid = btn.ownerCt.ownerCt;
								var selected_record = grid.getSelectionModel().getSelection().first(false);
								if (selected_record){
									var store = grid.getStore();
									//thisTab.deleted_cols.push(selected_record.id);
									//selected_record.deleted=true;
									//selected_record.set("column_name","MYNA DELETED")
									store.remove(selected_record);
									grid.fireEvent("table_changed",{src:grid});
								} else {
									window.alert("Please Select a column to delete.");

								}
							}
						}],
						store:new Ext.data.Store({
							autoLoad:true,
							proxy:{
								type: 'direct',
								directFn:$FP.DbManager.describeTable,
								paramsAsHash:true,
								extraParams:{
									ds:appVars.ds_name,
									table_name:table_name
								},
								reader: {
									type: 'json',
									id:"column_name"
								}
							},
							fields:[
								{name:'column_name'},
								{name:'type_name',convert:Ext.util.Format.uppercase},
								{name:'decimal_digits',defaultValue:""},
								{name:'column_size',defaultValue:""},
								{name:'column_def',defaultValue:""},
								{name:'ordinal_position',defaultValue:""},
								{name:'is_nullable',defaultValue:"YES"}
							],
							listeners: {
								load:function () {
									this.add({});
								},
								update:function(){
									var view = $this;
									view.fireEvent("table_changed",{
										src:view
									});
								}
							}
						}),
						plugins:[{
							ptype:"rowediting",
							errorSummary:false,
							clicksToMoveEditor:1,
							clicksToEdit:2,
							autoCancel:false
						}],
						columns:[{
								header: "Column Name", 
								width: 150, 
								sortable: true,  
								dataIndex: 'column_name',
								editor: {
									xtype:"textfield",
									allowBlank:false,
									selectOnFocus:true,
									regex:/^[a-z][\w]*$/i,
									regexText:"columns names must start with a letter, and only contain letters, numbers or the underscore",
									maxLength:30
								}
							},{
								header: "Type", 
								width: 100, 
								sortable: true,  
								dataIndex: 'type_name',
								editor:{
									xtype:"quickdrop",
									values:[
										"BIGINT",
										"INTEGER",
										"NUMERIC",
										"DATE",
										"TIMESTAMP",
										"VARCHAR",
										"CLOB",
										"TEXT",
										"VARBINARY",
										"BLOB"
									],
									editable:false,
									allowBlank:false
								}

							},{
								header: "Size", 
								width: 75, 
								sortable: true,  
								dataIndex: 'column_size',
								editor: {
									xtype:"numberfield",
									allowBlank:true,
									selectOnFocus:true
								}
							},{
								header: "Precision", 
								width: 75, 
								sortable: true,  
								dataIndex: 'decimal_digits',
								editor: {
									xtype:"numberfield",
									allowBlank:true,
									selectOnFocus:true
								}
							},{
								header: "Default Value", 
								width: 75, 
								sortable: true,  
								dataIndex: 'column_def',
								editor: {
									xtype:"textfield",
									allowBlank:true,
									selectOnFocus:true
								}
							},{
								header: "Nullable?", 
								width: 50, 
								sortable: true,  
								dataIndex: 'is_nullable',
								editor:{
									xtype:"quickdrop",
									listWidth:150,
									values:[
										"NO",
										"YES"
									],
									typeAhead: true,
									mode: 'local',
									triggerAction: 'all',
									emptyText:'',
									selectOnFocus:true,
									editable:true,
									allowBlank:false
								}
						}]
					})
					this.callParent(arguments);
				}
			})
		/* ----------- table_key_grid --------------------------------------- */
			Ext.define('App.view.table.KeyGrid', {
				extend: 'Ext.grid.Panel',
				alias:'widget.table_key_grid',
				
				loadMask:true,
				initComponent:function(){
					var table_name = this.table_name
					var $this = this;
					Ext.applyIf(this,{
						tbar:[{
							xtype:"label",
							text:"Double-Click a row to edit"
						},{
							xtype:"tbfill"
						},{
							text:"Delete Key",
							iconCls:"icon_delete",
							handler:function(btn){
								//console.log(btn)
								var grid = btn.ownerCt.ownerCt;
								var selected_record = grid.getSelectionModel().getSelection().first(false);
								if (selected_record){
									var store = grid.getStore();
									//thisTab.deleted_cols.push(selected_record.id);
									//selected_record.deleted=true;
									//selected_record.set("key_name","MYNA DELETED")
									store.remove(selected_record);
									grid.fireEvent("table_changed",{src:grid});
								} else {
									window.alert("Please Select a key to delete.");

								}
							}
						}],
						store:new Ext.data.Store({
							autoLoad:true,
							proxy:{
								type: 'direct',
								directFn:$FP.DbManager.getKeyInfo,
								paramsAsHash:true,
								extraParams:{
									ds:appVars.ds_name,
									table_name:table_name
								},
								reader: {
									type: 'json',
									id:"key_name"
								}
							},
							fields:[
								{name:'key_name'},
								{name:"type"},
								{name:"columns"},
								{name:"foreign_table"},
								{name:"foreign_column"},
								{name:"on_delete", defaultValue:"CASCADE"},
								{name:"on_update", defaultValue:"CASCADE"}
							],
							listeners: {
								load:function () {
									this.add({});
								},
								update:function(){
									var view = $this;
									view.fireEvent("table_changed",{
										src:view
									});
								}
							}
						}),
						plugins:[{
							ptype:"rowediting",
							errorSummary:false,
							clicksToMoveEditor:1,
							clicksToEdit:2,
							autoCancel:false
						}],
						columns:[{
								header: "Key Name", 
								width: 150, 
								sortable: true,  
								dataIndex: 'key_name',
								editor: {
									xtype:"textfield",
									itemId:"key_name",
									allowBlank:true,
									emptyText:"leave blank to auto-generate",
									selectOnFocus:true
								}
							},{
								header: "Type", 
								width: 75, 
								sortable: true,  
								dataIndex: 'type',
								editor:{
									xtype:"quickdrop",
									itemId:"type",
									width:100,								
									values:[
										"Primary",
										"Foreign"
									],
									editable:false,
									allowBlank:false
								}
							},{
								header: "Local Column", 
								width: 150, 
								sortable: true,  
								dataIndex: 'columns',
								editor:{
									xtype:"combo",
									itemId:"local_column",
									displayField:"column_name",
									valueField:"column_name",
									editable:false,
									allowBlank:false,
									listeners:{
										beforequery:function (event) {
											var c = event.combo;
											//console.log(Array.parse(arguments))
											var colStore=$this.up("edit_table").down("table_column_grid").getStore()
											if (c.getStore() != colStore){
												c.store =colStore
											}
											return true
											var cols =[]
											colStore.each(function (record) {
												if (record.get("column_name")){
													cols.push({
														label:record.get("column_name"),
														value:record.get("column_name")
													})
												}
											})
											//c.getStore().removeAll();
											c.getStore().add(cols)
											
										}
									}
								}
							},{
								header: "Foreign Table", 
								width: 100, 
								sortable: true,  
								dataIndex: 'foreign_table',
								editor:{
									xtype:"combo",
									itemId:"foreign_table",
									store:{
										proxy:{
											type: 'direct',
											directFn:$FP.DbManager.getTreeNode,
											paramsAsHash:true,
											extraParams:{
												ds:appVars.ds_name,
												node:"table_type::TABLE"
											},
											reader: {
												type: 'json'
											}
										},
										fields:[
											{name:'text'}
										],
										filters:[function (record) {
											return record.get("text").toLowerCase() != table_name.toLowerCase();
										}]
									},
									displayField:'text',
									valueField:'text',
									typeAhead: true,
									mode: 'remote', 
									triggerAction: 'all',
									emptyText:'',
									selectOnFocus:true,
									editable:true,
									validator:function (val) {
										var c= this;
										var fields = c.ownerCt.items.map;
										if (fields.type.getValue() == "Foreign" && !val) {
											return "This field is required for foreign keys"
										} else {
											return true
										}

									}
									
								}
							},{
								header: "Foreign Column", 
								width: 100, 
								sortable: true,  
								dataIndex: 'foreign_column',
								editor:{
									xtype:"combo",
									itemId:"foreign_column",
									store:{
										proxy:{
											type: 'direct',
											directFn:$FP.DbManager.getTreeNode,
											paramsAsHash:true,
											extraParams:{
												ds:appVars.ds_name,
												node:"table:"+table_name
											},
											reader: {
												type: 'json'
											}
										},
										fields:[
											{name:'text'}
										]
										
									},
									listeners:{
										beforequery:function (event) {
											var c = event.combo;
											var fields = c.ownerCt.items.map
											console.log("foreign column",c)

											c.getStore().proxy.extraParams={
												ds:appVars.ds_name,
												node:"table:"+fields.foreign_table.getValue()
											}
											c.getStore().load()
											
										}
									},
									displayField:'text',
									valueField:'text',
									
									mode: 'remote', 
									
									editable:false,
									validator:function (val) {
										var c= this;
										var fields = c.ownerCt.items.map;
										if (fields.type.getValue() == "Foreign" && !val) {
											return "This field is required for foreign keys"
										} else {
											return true
										}

									}
									
								}
							},{
								header: "On Delete", 
								width: 70, 
								sortable: true,  
								dataIndex: 'on_delete',
								editor:{
									xtype:"quickdrop",
									itemId:"on_delete",
									width:150,								
									values:[
										"CASCADE",
										"SET NULL",
										"SET DEFAULT",
										"NO ACTION"
									],
									editable:false,
									validator:function (val) {
										var c= this;
										var fields = c.ownerCt.items.map;
										if (fields.type.getValue() == "Foreign" && !val) {
											return "This field is required for foreign keys"
										} else {
											return true
										}

									}
								}
							},{
								header: "On Update", 
								width: 70, 
								sortable: true,  
								dataIndex: 'on_update',
								editor:{
									xtype:"quickdrop",
									itemId:"on_update",
									width:150,								
									values:[
										"CASCADE",
										"SET NULL",
										"SET DEFAULT",
										"NO ACTION"
									],
									editable:false,
									validator:function (val) {
										var c= this;
										var fields = c.ownerCt.items.map;
										if (fields.type.getValue() == "Foreign" && !val) {
											return "This field is required for foreign keys"
										} else {
											return true
										}

									}
								}
						}]
					})
					this.callParent(arguments);
				}
			})
		
		/* ----------- table_index_grid ------------------------------------ */
			Ext.define('App.view.table.IndexGrid', {
				extend: 'Ext.grid.Panel',
				alias:'widget.table_index_grid',
				
				loadMask:true,
				initComponent:function(){
					var table_name = this.table_name
					var $this = this;
					Ext.applyIf(this,{
						tbar:[{
							xtype:"label",
							text:"Double-Click a row to edit"
						},{
							xtype:"tbfill"
						},{
							text:"Delete index",
							iconCls:"icon_delete",
							handler:function(btn){
								//console.log(btn)
								var grid = btn.ownerCt.ownerCt;
								var selected_record = grid.getSelectionModel().getSelection().first(false);
								if (selected_record){
									var store = grid.getStore();
									store.remove(selected_record);
									grid.fireEvent("table_changed",{src:grid});
								} else {
									window.alert("Please Select a index to delete.");

								}
							}
						}],
						store:new Ext.data.Store({
							autoLoad:true,
							proxy:{
								type: 'direct',
								directFn:$FP.DbManager.getIndexInfo,
								paramsAsHash:true,
								extraParams:{
									ds:appVars.ds_name,
									table_name:table_name
								},
								reader: {
									type: 'json'
								}
							},
							fields:[
								{name:'name'},
								{name:'unique'},
								{name:'columns'}
								
							],
							listeners: {
								load:function () {
									this.add({});
								},
								update:function(){
									var view = $this;
									view.fireEvent("table_changed",{
										src:view
									});
								}
							}
						}),
						plugins:[{
							ptype:"rowediting",
							errorSummary:false,
							clicksToMoveEditor:1,
							clicksToEdit:2,
							autoCancel:false
						}],
						columns:[{
								header: "Index Name", 
								width: 200, 
								sortable: true,  
								dataIndex: 'name',
								editor: {
									xtype:"textfield",
									allowBlank:true,
									emptyText:"Leave blank to auto-generate",
									selectOnFocus:true,
									regex:/^[a-z][\w]*$/i,
									regexText:"index names must start with a letter, and only contain letters, numbers or the underscore",
									maxLength:30
								}
							},{
								header: "Unique?", 
								width: 100, 
								sortable: true,  
								dataIndex: 'unique',
								editor:{
									xtype:"quickdrop",
									values:[
										"true",
										"false"
									],
									editable:false,
									allowBlank:false
								}

							},{
								header: "Columns", 
								width: 75, 
								flex:1,
								sortable: true,  
								dataIndex: 'columns',
								editor: {
									xtype:"textfield",
									allowBlank:false,
									selectOnFocus:true
								}
						}]
					})
					this.callParent(arguments);
				}
			})
		

/*  */

/* ----------- Application definition: App ---------------------------- */
	Ext.application({
		name: 'App',
		controllers:controllers,
		autoCreateViewport:true,
		launch:function(){
			Ext.apply(App,{
				addCenterTab:function(config,ordinal){
					Ext.apply(config,{
						closable:true
					})
					Ext.applyIf(config,{
						id:Ext.id()
					})
					var tabPanel = Ext.getCmp("center_tabs");
					tabPanel.show();
					if (tabPanel.items.containsKey(config.id)){
						tabPanel.setActiveTab(config.id)
					}else {
						if (ordinal !== undefined){
							tabPanel.insert(ordinal,config);	
						} else {
							tabPanel.add(config);
						}
						tabPanel.setActiveTab(config.id)
					}
					
				}
			})
			this.getController("Sql").openSql("select * from play2 p join test t  on	( t.)");

			
			
		}
		
	});	