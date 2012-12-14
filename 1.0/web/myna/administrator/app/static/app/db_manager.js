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
							text:"<div class='app_title'>"+title+"</div>"
						},{
							xtype:"tbfill"
						},{
							xtype:"tbtext",
							text:"&nbsp;".repeat(10)
						},{
							text:"Logout",
							handler:function(){
								location.href=appUrl+"main/logout"
							}
					}],
					items:[{//west
							region:"west",
							width:250,
							layout:"fit",
							//autoWidth:true,
							resizable:true,
							collapsible:true,
							//border:false,
							xtype:"treepanel",
							title:"Database Objects",
							store:{
								proxy: {
									type: 'direct',
									directFn: $FP.DbManager.getTreeNode,
									extraParams:{
										ds:ds_name
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
							rootVisible:true
							
							
							
					},{//center
							xtype:"panel",
							region:"center",
							frame:false,
							layout:"fit",
							border:false,
																
							tbar:[{
								text:"New",
								iconCls:"icon_add",
								menu:new Ext.menu.Menu({
									id: 'mainMenu',
									items: [{        // <-- submenu by nested config object
										text: 'SQL Window',
										iconCls:"icon_edit_form",
										action:"sql"
										
									}, {
										text: 'Table',
										iconCls:"icon_form_search",
										handler:function(){
											C.edit_table()	
										}
									}]
								})
							}],
							items:[{//center_tabs
								id:"center_tabs",
								hidden:true,
								xtype:"tabpanel",
								autoDestroy:true,
								listeners: {
								}
								
							}]
						
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
		infoMsg: function(template/*,replacement 1,replacement 2,... */){
			var s = Ext.String.format.apply(String, Array.prototype.slice.call(arguments, 0));
			var win = new Ext.Window({
					preventHeader:true,				
					/* width:200,
					height:75, */
					layout:"fit",
					//title:title,
					y:0,
					bodyStyle:"padding:5px;",
					items:[{
						xtype:"label",
						style:"font-weight:bold;font-size:11pt;",
						text:s
					}]
			})
			win.show()
			var m = win.getEl(); 
			m.hide();
			m.alignTo(Ext.getCmp("center_tabs").getEl(),"tr-tr")
			m.slideIn("t").slideOut("t", { delay: 1000, calback:function(){win.destroy()}});
		}
	}
/* =========== General View Components ====================================== */
/* =========== Sql ========================================================== */
	/* ----------- Controller ------------------------------------------------ */
		controllers.push("Sql");
		Ext.define('App.controller.Sql', {
			extend: 'Ext.app.Controller',
			init: function() {
				var $this = this
				this.control({
					'viewport menu *[action=sql]':{
						click:this.openSql
					},
					'sql *[itemId=sql_control]':{
						change:this.sqlChange
					},
					'sql':{
						executeSql:this.executeSql
					}
				});
			},
			openSql:function(sql){
				App.addCenterTab({
					xtype:"sql",
					sql:sql||""
				})
			},
			executeSql:function(options){
				window.setTimeout(function(){
					var view = options.src
					view.el.mask("Executing query...")
					var rp = view.down("*[itemId=result_panel]")
					var pageSize = parseInt((rp.getHeight()-75)/21)
					$FP.DbManager.executeSql({
						sql:options.sql,
						ds:ds_name,
						limit:pageSize,
						page:1
					},function(result){
						view.el.unmask();
						rp.removeAll()
						rp.add({
							xtype:"resultgrid",
							sql:options.sql,
							pageSize:pageSize,
							result:result
						})
					})
				},100)
				
			},
			sqlChange:function(control,newValue){
				control.up("sql").setTitle("SQL: " + newValue.replace(/\s/g," ").left(25))
			}
			
		});
	/* =========== Views ===================================================== */
		/* ----------- sql ----------------------------------------- */
			Ext.define('App.view.sql.Sql', {
				extend: 'Ext.panel.Panel',
				alias:'widget.sql',
				layout:{
					type:"vbox",
					align:"stretch"
				},
				events:{
					/* Event: executeSql
						sql execution requested
						
						Parameters Object:
							src	-	this view
							sql	-	SQL code to execute
						
					*/
					executeSql:true
				},
				//queryMode:"local",
				initComponent:function(config){
					this.items=[{
						layout:"fit",
						resizable:true,
						items:[{
						xtype:"textarea",
							itemId:"sql_control",
							value:this.sql||"",
							flex:1,
							listeners:{
								afterrender:function(ta){
									ta.codeMirror = CodeMirror.fromTextArea(ta.getEl().dom,{
										lineNumbers: true,
										matchBrackets: true,
										indentUnit: 4,
										mode: "text/x-plsql",
										onChange:function(cm){
											ta.fireEvent("change",ta,cm.getValue())
										},
										extraKeys:{
											F8:function(){
												var view =ta.up("sql")
												view.fireEvent("executeSql",{
													src:view,
													sql:ta.codeMirror.getValue()
												})
											}	
										}
									})
									window.setTimeout(function(){
										ta.codeMirror.focus()
									},100)
									
									var panel = ta.up("sql")
									if (panel.sql) ta.codeMirror.setValue(panel.sql) 
								},
								resize:function(panel,w,h){
									var el =panel.getEl()
									var scroller =el.up("div").down(".CodeMirror-scroll")
									if (scroller) {
										scroller.setHeight(h)
										panel.codeMirror.refresh()
									}
								}
							}
						}],
						tbar:[{
							text:"Execute",
							iconCls:"icon_cog_go",
							handler:function(btn){
								var view=btn.up("sql")
								var sql=view.down("*[itemId=sql_control]").getValue()
								view.fireEvent("executeSql",{src:view,sql:sql})
							}
						}]
					},{
						layout:"fit",
						flex:2,
						itemId:"result_panel"
						
					}],
					this.callParent(arguments);
					if(this.sql) this.fireEvent("executeSql",{src:this,sql:this.sql})	
				}
			})
		/* ----------- resultgrid ----------------------------------------- */
			Ext.define('App.view.sql.ResultGrid', {
				extend: 'Ext.ux.SupaGrid',
				alias:'widget.resultgrid',
				
				events:{
				
				},
				paged:true,
				filterFormConfig:{
					xtype:"resultgridform"
				},
				initComponent:function(config){
					var columns = this.result.columns
					var data = this.result.data
					this.store = {
						proxy:{
							type: 'direct',
							directFn:$FP.DbManager.executeSql,
							paramsAsHash:true,
							extraParams:{
								ds:ds_name,
								sql:this.sql,
							},
							reader: {
								type: 'json',
								totalProperty:'totalRows',
								root:'data'
							}
						},
						pageSize:this.pageSize,
						
						fields:["$num"].concat(columns.map(function(col){
							if (col.type == "date"){
								return {
									name:col.name,
									convert:function(val){
										if (!val) return val
											return new Date(val.match(/\((\d+)\)/)[1])
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
						width:25
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
				initComponent:function(config){
					
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
					var tabPanel = Ext.getCmp("center_tabs");
					tabPanel.show();
					if (tabPanel.items.containsKey(config.id)){
						tabPanel.setActiveTab(config.id)
					}else {
						if (ordinal != undefined){
							tabPanel.insert(ordinal,config);	
						} else {
							tabPanel.add(config);
						}
						tabPanel.setActiveTab(config.id)
					}
					
				}
			})
			var $this = this;
			//window.setTimeout(function(){
					$this.getController("Sql").openSql("select * from myna_log_general")
			
			//},10000)
			
		}
		
	});	