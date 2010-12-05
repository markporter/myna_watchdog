Ext.Ajax.timeout = 5*60*1000
var viewport;
var C ={
	body:null,
	dSstore:null,
	msgCt:null,
	currentDs:"",
	currentDbType:"other",
	editorTab:" ".repeat(4)
}

/* ---------------- init ---------------------------------------------------- */
	C.init=function(){
		this.currentDs =startDs;
		C.body = Ext.get(document.body);
		C.msgCt = Ext.DomHelper.insertFirst(C.body, {id:'msg-div'}, true);
		var oldDecode = Ext.util.JSON.decode;
		Ext.decode = Ext.util.JSON.decode = function(text){
			try{
				return oldDecode(text);	
			} catch(e){
				new Ext.Window({
					id:"decode_error",
					layout:'fit',
					width:640,
					height:480, 
					autoScroll:true,
					plain: true,
					modal:true,
					constrain:true,
					title:"Error:",
					maximizable:true,
					bodyStyle:"padding:10px",
					html:text,
					buttonAlign:"center",
					buttons:[{
						text:"Close",
						handler:function(){
							Ext.getCmp("decode_error").close();	
						}
					}]
				}).show()
				C.body.unmask();
				throw e
			}
		}
		Ext.form.Field.prototype.msgTarget = 'under';
		//Provides attractive and customizable tooltips for any element.
		Ext.QuickTips.init();
		var buttons=[];
		
		Ext.form.TextArea.prototype.insertAtCursor=function(text){
			this.el.focus();
			if (Ext.isIE) {
				document.selection.createRange().text = tab
			} else {
				var t = this.el.dom;
				var ss = t.selectionStart;
				var se = t.selectionEnd;
				
				if (t.value.charAt(ss+1) == "\n") ++ss;
				
				t.value = t.value.left(ss) + text + t.value.right(t.value.length-ss);
				if (ss == se) {
					t.selectionStart = t.selectionEnd = ss + text.length;
				} else {
					t.selectionStart = ss + text.length;
					t.selectionEnd = se + text.length;
				}
			}
			setTimeout(function(){t.focus();},100)
			
		}
		
		Ext.Ajax.on('beforerequest',function(conn,options){
			if (options.waitMsg){
				conn.waitInstance = Ext.Msg.wait(options.waitMsg,"Please Wait");
			}
		})
		Ext.Ajax.on('requestcomplete',function(conn,response,options){
			if (conn.waitInstance){
				conn.waitInstance.hide();
				delete conn.waitInstance;
			}
		})
		if (authenticated===true && hasAccess == true){
			C.main()
		}else{
			//C.login();
			var url = rootUrl+"myna/auth/auth.sjs?"+[
				"fuseaction=login",
				"callback=" +String(location.href),
				"title=" +escape("DB Administrator Login"),
				hasAccess?"":"message=You do not have access to this application"
			].join("&")
			
			location.href=url;
		}
	}
/* ================ helper functions ======================================== */
	/* ---------------- addTab ----------------------------------------------- */
		C.addTab = function(tabPanel,config,ordinal){
			tabPanel.show();
			if (ordinal != undefined){
				tabPanel.insert(ordinal,config);	
			} else {
				tabPanel.add(config);
			}
			
			if (tabPanel.items.getCount() ==1){
				tabPanel.activate(config.id);
				tabPanel.syncSize();
				tabPanel.ownerCt.doLayout();
			}
			tabPanel.hide();
			tabPanel.show();
			tabPanel.doLayout();
			C.body.unmask();
		}
	/* ---------------- infoMsg ---------------------------------------------- */
		C.infoMsg = function(message){
			
			C.msgCt.alignTo(document, 't-t');
			//C.msgCt.dom.innerHTML =""; 
			//var m = Ext.DomHelper.append(msgCt, {html:createBox(title, message)}, true);;
			var msg = C.msgCt.createChild({html:"<b>" + message+ "</b>",style:{'z-index':"10000"}})
			.boxWrap()
			.setWidth(200)
			.alignTo(C.body,"tr-tr",[0,10])
			.slideIn('t')
			.pause(3)
			.ghost("t",{remove:true});		
		}
	/* ---------------- disableUnchanged ------------------------------------- */
		C.disableUnchanged = function(form,mask){
			var disabledIndexes = form.items.items.filter(function(item,index){
				item.setDisabled(!item.isDirty());
				return !item.isDirty()
			});
			return function(){
				disabledIndexes.forEach(function(item){
					item.setDisabled(false);
				})	
			}
		}
	/* ---------------- defaultActionFailed --------------------------------- */	
		C.defaultActionFailed = function(form,action){
			C.showAjaxError(action.response.responseText)
		}
	/* ---------------- createStore ------------------------------------------ */
		/*	takes a standard store config and returns a store with
		a listener for loadexcetion that calls showAjaxError.
		*/
		C.createStore = function(config){
			if (!config.listeners)config.listeners={}
			if(!config.listeners.loadexception){
				config.listeners.loadexception = function(conn,options,response){
					C.showAjaxError(response.responseText);
				}
			}
			return new Ext.data.Store(config);
		}
	/* ---------------- cbHandler -------------------------------------------- */
		/* 	returns a function that can be used as the callback funciton in 
			an Ext.Ajax.request(). The passed in function should expect a 
			result parameter that contains the decoded response.responseText,
			as well as the options,success,and response parameters callbacks 
			normally recieve. If the passed in function returns false, 
			C.showAjaxError will be called.
			
			EX:
			Ext.Ajax.request({
				url:"?fuseaction=save",
				callback=C.cbHandler(function(result,options,success,response){
					if (result instanceof Array){
						
						...process...	
						return true;
					} else return false
				})
			})
		*/
		C.cbHandler = function(func){
			return function(o,s,r){
				var result = Ext.decode(r.responseText);
				if (func(result) === false){
					C.showAjaxError(r.responseText);
				}
				
			}
		}
	/* ---------------- showAjaxError --------------------------------------- */	
		C.showAjaxError = function(responseText){
			var text ="";
			try{
				var result = Ext.decode(responseText);
				
				if (result.errorMsg){
					if (!result.errorDetail){
						result.errorDetail =result.errorMsg;
						result.errorMsg = "Error:"
					}
					text+= result.errorDetail
				} else if (result.errors){
					text += "Error submitting data. Please see highlighted fields.";
				} else{
					text += responseText;
				}
			} catch(e){
				text +=responseText;
			} 
			new Ext.Window({
				id:"ajax_error",
				layout:'fit',
				width:640,
				height:480, 
				autoScroll:true,
				plain: true,
				modal:true,
				constrain:true,
				title:result.errorMsg,
				maximizable:true,
				bodyStyle:"padding:10px",
				html:text,
				buttonAlign:"center",
				buttons:[{
					text:"Close",
					handler:function(){
						Ext.getCmp("ajax_error").close();	
					}
				}]
			}).show()
			//Ext.MessageBox.alert(result.errorMsg,result.errorDetail);
			return;	
			
		}
/* ================ main functions ========================================== */
/* ---------------- login --------------------------------------------------- */
	C.login=function(){
		var win=new Ext.Window({
			layout:'fit',
			width:300,
			height:125,
			closeAction:'hide',
			closable:false,
			plain: true,
			title:  prettyName +' Login',
			items:[{
				xtype:"form",
				labelWidth: 75, // label settings here cascade unless overridden
				
				frame:true,
				
				bodyStyle:'padding:5px 5px 0',
				defaults: {
					width: 150,
					selectOnFocus:true
				},
				defaultType: 'textfield',
				keys:{
					key: [10,13],
					fn:submit=function(){
						Ext.Ajax.request({
							url:'?fuseaction=auth',
							params:{
								password:Ext.getCmp("password").getValue(),
								username:Ext.getCmp("username").getValue()
							},
							waitMsg:"Authenticating...",
							callback:C.cbHandler(function(result){
								if (result.success){
									win.hide();
									C.main();
									
								} else return false
							})
						})
					}
				},
				//floating:true,
				items: [{
					fieldLabel: 'Username',
					value:"Admin",
					id: 'username',
					allowBlank:false
				},{
					fieldLabel: 'Password',
					inputType:'password',
					id: 'password',
					allowBlank:false
				}
				],
				buttons: [{
					text: 'Login',
					handler:submit
				}]
				
			}]
			
			
		});
		
		win.show(this,function(){
			var pwd =Ext.getCmp("password")
			pwd.focus.defer(10,pwd);
		});
	}

/* ---------------- main ---------------------------------------------------- */
	C.main=function(){
		var config={
			layout:"border",
			items:[{
				/* center center_tabs*/
				xtype:"panel",
				region:"center",
				frame:false,
				layout:"fit",
				border:false,
				/* tbar */
				tbar:[{
					text:"New",
					menu:new Ext.menu.Menu({
						id: 'mainMenu',
						items: [{        // <-- submenu by nested config object
							text: 'SQL Window',
							iconCls:"edit_icon",
							handler:function(){
								C.new_sql_window()
							}
						}, {
							text: 'Table',
							iconCls:"query_icon",
							handler:function(){
								C.edit_table()	
							}
						}]
					})
				},{
					xtype:"tbspacer"
				},{
					xtype:"tbtext",
					text:"Datasource:"
				},{
					xtype:"combo",
					id:"ds_dropdown",
					fieldLabel:"Datasource",
					minChars:1,
					
					store:C.createStore({
						storeId:"ds_dropdown",
						proxy: new Ext.data.HttpProxy({
							url: '?fuseaction=get_data_sources'
						}),
						
						reader: new Ext.data.JsonReader({
							id: 'name'
						},[
						{name:'name'} 
						])
					}),
					forceSelection:true,
					triggerAction:"all",
					displayField:"name",
					valueField:"name",
					resizable:true,
					editable:false,
					value:C.currentDs,
					listeners:{
						select:function(combo,newVal,oldVal){
							C.currentDs = newVal.id;
							C.loadObjects();
							
						},
						beforerender:function(){
							window.setTimeout(function(){
								C.loadObjects();
							},100)
							
						}
					}
				}],
				items:[{
					id:"center_tabs",
					hidden:true,
					enableTabScroll:true,
					xtype:"tabpanel",
					deferredRender:false,
					layoutOnTabChange:true,
					autoDestroy:true
					
				}]
				
			},{
				/* north titlebar*/
				region:"north",
				height:25,
				layout:"border",
				
				defaults:{
					border:false,
					layout:"fit"
				},
				items:[{
					html:"<div class='app_title'>" + prettyName +"</div>",
					region:"west",
					width:400
				},{
					region:"center", 
					html:""
				},{
					region:"east",
					html:' <a class="link" href="?fuseaction=logout">Logout</a>',
					bodyStyle:"padding-right:10px;text-align:right",
					width:200
					
				}]
			},{
				/* west objects */
				region:"west",
				width:250,
				border:false,
				layout:"fit",
				xtype:"panel",
				/* bodyStyle:"padding:10px;", */
				bodyBorder:false,
				title:"Objects",
				split:true,
				collapsible:true,
				frame:true,
				defaults:{
					border:false,
					bodyStyle:"padding:5px"
				},
				items:[{
					layout:"border",
					items:[{
						region:"center",
						xtype:"treepanel",
						id:"object_tree",
						useArrows:true,
						autoScroll:true,
						animate:true,
						enableDD:false,
						rootVisible:true,
						containerScroll: true, 
						loader: new Ext.tree.TreeLoader({
							
						}),
						root:new Ext.tree.TreeNode({
							text:"Please select a datasource",
							id:'0'
							
						}),
						listeners:{
							contextmenu:function(node,e){
								e.stopEvent();
								if (node.attributes.table_name){
									var menu = new Ext.menu.Menu({
										items: [{        // <-- submenu by nested config object
											text: "Query " +node.text,
											handler:function(){
												Ext.Ajax.request({
													url:"?fuseaction=load_objects&node=" + node.id + "&ds=" +C.currentDs,
													callback:C.cbHandler(function(result){
															var table_alias = node.attributes.table_name.split(/_/).map(function(part){
																return part.left(1).toLowerCase()
															}).join("")
															var sql=[
																"select",
																result.map(function(col,index,array){
																	var result=C.editorTab + table_alias +"." +col.text
																	if (index < array.length -1) result +=",";
																	return result;
																}).join("\n"),
																"from " + (node.attributes.schema.length?node.attributes.schema + ".":"") + node.attributes.table_name + " " + table_alias
															].join("\n")
															var tpls = dbProperties[C.currentDbType].templates
															if ("maxRows" in tpls){
																sql= new Ext.XTemplate(tpls.maxRows).apply({
																	query:sql,
																	maxRows:100
																})
															}
															
															C.new_sql_window(sql)
													})
												})
												
											},
											iconCls:"query_icon"
										},{
											text: "Edit " +node.text,
											handler:function(){
												C.edit_table(node.id.listLast(":"));
											},
											iconCls:"edit_icon"
										},{
											text: "Drop " +node.text,
											iconCls:"drop_icon",
											handler:function(){
												var name = node.id.listLast(":");
												Ext.MessageBox.confirm("Warning","Drop table '" + name +"'?",function(btn){
													if (btn == 'yes') {
														Ext.Ajax.request({
															url:'?fuseaction=drop_table',
															params:{
																table_name:name,
																ds:C.currentDs
															},
															callback:C.cbHandler(function(result){
																if (result.success){
																	C.infoMsg("Table  '" + name + "' dropped.");
																	C.loadObjects();
																} else return false;
															})
														})
														
													}
												})
											}
										},{
											text: "Rename " +node.text,
											iconCls:"rename_icon",
											handler:function(){
												var name = node.id.listLast(":");
												var new_name=window.prompt("New name for this table",name);
												if (new_name) {
													Ext.Ajax.request({
														url:'?fuseaction=rename_table',
														params:{
															table_name:name,
															new_name:new_name,
															ds:C.currentDs
														},
														callback:C.cbHandler(function(result){
															if (result.success){
																C.infoMsg("Table  '" + name + "' renamed to +'" + new_name + "'.");
																C.loadObjects();
															} else return false;
														})
													})
													
												}
											}
										}]
									})
									menu.show(node.ui.getAnchor());
								} else {
									var menu = new Ext.menu.Menu({
										items: [{        // <-- submenu by nested config object
											text:"Refresh",
											iconCls:"refresh_db_icon",
											handler:function(){
												if (node.reload) {
													node.reload();
												} else{ 
													C.loadObjects();
												}       
											}
										}]
									})
									menu.show(node.ui.getAnchor());
								}
							},
							click:function(node){
								var ct = Ext.getCmp("center_tabs");
								var at = ct.getActiveTab()
								if (at){
									var sql = Ext.getCmp("sql"+at.id);
									if (sql){
										sql.insertAtCursor(node.text)	
									}
								}
							},
							beforeload:function(node){
								//node.wait =  Ext.Msg.wait("Loading")
							},
							expandnode:function(node){
								//if (node.wait) node.wait.hide();
							}
						}
						
					}]
					
				}]
			}]
		}
		viewport = new Ext.Viewport(config);	
	}
/* ---------------- loadObjects() ------------------------------------------- */
	C.loadObjects=function(){
		if (!C.currentDs.length) {
			Ext.Msg.alert("Info","Please select a datasource.")
			return 
		}
		ot = Ext.getCmp("object_tree");
		ot.collapseAll();
		root=ot.getRootNode() 
		root.setText(C.currentDs+ " Schemas:");
		ot.getLoader().dataUrl ="?fuseaction=load_objects&ds=" +C.currentDs
		var wait = Ext.Msg.wait("Loading Schemas...");
		ot.getLoader().load(root,function(){
			wait.hide();
			root.expand();
			//debug_window(root)
			root.childNodes[0].expand(false,true,function(){
				root.childNodes[0].childNodes.forEach(function(node){
					if (node.text == "Tables"){
						node.expand();	
					}
				})
					
			})	
		});
		
		
		
		//debug_window(root)
		Ext.Ajax.request({
			url:"?fuseaction=get_db_type&ds=" + C.currentDs,
			callback:C.cbHandler(function(result){
				if (result.success){
					C.currentDbType = result.db_type;
				} else return false;
			})
		})
	}
/* ---------------- new_desc_window ----------------------------------------- */
	C.new_desc_window=function(table_name){
		var win_id = table_name + Ext.id();
		if (Ext.WindowMgr.get(win_id)) Ext.WindowMgr.get(win_id).close();
		
		var win = new Ext.Window({
			id:win_id,
			width:460,
			height:320,
			minimizable:true,
			constrain:true,
			title:"Tabel Detail: " + table_name,
			layout:"fit",
			items:[{
				xtype:"grid",
				id:"desc_grid"+win_id,
				stripeRows:true,
				ds:new Ext.data.Store({
					storeId:"desc_grid_store" +win_id,
					proxy: new Ext.data.HttpProxy({
						url: '?fuseaction=describe_table'
					}),
					baseParams:{
						table_name:table_name,
						ds:C.currentDs
					},
					reader: new Ext.data.JsonReader({
						id: "column_name"            
					},
					[
					{name:'column_name'},
					{name:'type_name'},
					{name:'column_size'},
					{name:'column_def'},
					{name:'is_nullable'}
					]),
					remoteSort: false,
					sortInfo:{
						field:'column_name',
						direction:'ASC'
					}
				}),
				columns:[{
					header: "Column Name", 
					width: 150, 
					sortable: true,  
					dataIndex: 'column_name'
				},{
					header: "Type", 
					width: 75, 
					sortable: true,  
					dataIndex: 'type_name'
				},{
					header: "Size", 
					width: 75, 
					sortable: true,  
					dataIndex: 'column_size'
				},{
					header: "Default Value", 
					width: 75, 
					sortable: true,  
					dataIndex: 'column_def'
				},{
					header: "Nullable?", 
					width: 50, 
					sortable: true,  
					dataIndex: 'is_nullable'
				}],
				autoExpandColumn:0,
				sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
				loadMask: true,
				listeners: {
					beforerender:function(){
						Ext.StoreMgr.get("desc_grid_store"+win_id).load();
					}
				}
			}],
			listeners:{
				minimize:function(){
					if (win.collapsed){
						win.expand();
					}else{
						win.collapse();
					}
				}
			}
		})
		
		win.show();
	}
/* ---------------- new_sql_window ------------------------------------------ */
	C.new_sql_window=function(sql){
		if (!sql) sql="";
		var center_tabs = Ext.getCmp("center_tabs");
		
		var tabId=Ext.id("new_sql_window");
		
		if (!center_tabs.findById(tabId)){
			var editor;
			var config={
				id:tabId,
				title:"SQL: " + sql.left(15),
				closable:true,
				header:false,
				layout:"border",
				sql:sql,
				execute_function:function(page,return_all){
					var result_panel = Ext.getCmp("result_panel" + tabId);
					if (!C.currentDs.length){
						Ext.Msg.alert("","Please select a datasource.")
						return;
					}
					var sql;
					var thisTab = Ext.getCmp(tabId);
					sql= Ext.getCmp("sql"+tabId).getValue()//.replace(/\n/g," ");
		
					thisTab.setTitle("SQL: " + sql.replace(/\n/g," ").left(20))
					
					var pageSize =  (result_panel.getInnerHeight()-75)/21;
					if (result_panel.body){
						result_panel.body.mask("Executing Query...")
					}
					Ext.Ajax.request({
						url:"?fuseaction=execute_query",
						params:{
							sql:sql,
							ds:C.currentDs,
							page_size:pageSize,
							page:page?page:1,
							return_all:return_all?"true":"false"
						},
						callback:C.cbHandler(function(result){
							result_panel.body.unmask()
							if (!result.hasOwnProperty("success") || result.success === false) return false;
							
							thisTab.page = result.page;
							
							if (result.page == 1){
								if(result_panel.items.items[0]){
									result_panel.remove(result_panel.items.items[0])	
								}
								thisTab.data = result.data;
								thisTab.sql = result.sql;
								var data_columns = result.columns.map(function(col_spec){
									return {name:col_spec.name.toLowerCase()}
								})
								var display_columns = result.columns.map(function(col_spec){
									return {
										header: col_spec.name, 
										width: 150, 
										sortable: true,
										renderer:function(val){
											var result= String(val)
											.left(100)
											.escapeHtml();
											
											return result;
										},
										dataIndex: col_spec.name.toLowerCase()	
									}
								});
								var reader =  new Ext.data.JsonReader({
									root:"data",
									totalProperty:"totalRows"
								},data_columns);
								
								
								result_panel.add({
									layout:"border",
									items:[{
										region:"center",
										xtype:"grid",
										id:"result_grid" + tabId,
										stripeRows:true,
										ds:C.createStore({
											storeId:"result_store"+tabId,
											proxy: new Ext.data.MemoryProxy(result),
											reader:reader,
											remoteSort: false
										}),
										
										columns:display_columns,
										sm: new Ext.grid.RowSelectionModel({
											singleSelect:true,
											listeners:{
												rowselect:function(sm,rowIndex,record){
													var formPanel = Ext.getCmp("result_row_form" + tabId);
													var form = formPanel.form;
													form.loadRecord(record)
													formPanel.rowIndex = rowIndex
													formPanel.expand();
													
												}
											}
										}),
										bbar:[{
											xtype:"tbtext",
											text:"Executed in " + (result.executionTime/1000) +" seconds"
										},{
											xtype:"tbseparator"
										},{	
											xtype:"tbtext",
											text:"<span id=result_parsed" + tabId + ">Parsed in " + (result.parseTime/1000) +" seconds</span>"
										},{
											xtype:"tbseparator"
										},{
											xtype:"tbtext",
											text:"<span id=result_displaying" + tabId + ">Displaying " + result.data.length +" of " + result.totalRows + " rows</span>"
										}]
										
									},{
										region:"east",
										id:"result_row_form" + tabId,
										collapsible:true,
										collapsed:true,
										hideMode:"offsets",
										hidden:false,
										titleCollapse:true,
										split:true,
										title:"Current Row Transposed:",
										xtype:"form",
										width:300,
										autoScroll:true,
										bodyStyle:"padding:5px;",
										frame:true,
										labelAlign:"top",
										items:result.columns.map(function(col_spec){
											var obj={
												fieldLabel:col_spec.name,
												name:col_spec.name.toLowerCase(),
												xtype:"textfield",
												readOnly:true,
												style:{width:"100%"}
												/* width:450 */
											}
											if (/binary|varbinary|blob/i.test(col_spec.typeName)){
												obj.xtype="textfield";
												var id =Ext.id();
												obj.id=id;
												obj.download=function(){
													window.open("?fuseaction=download_file"
														+"&sql=" + escape(sql) 
														+ "&ds=" + C.currentDs 
														+ "&column=" + col_spec.name
														+ "&index=" + Ext.getCmp("result_row_form" + tabId).rowIndex
													)
												}
												
												obj.fieldLabel+=[
													' <span \n',
													'class=link \n',
													'onclick=\'Ext.getCmp("' + id + '").download()\' \n',
													'>(download file)</span>\n'
												].join("")
											}
											if ((col_spec.size > 300 || col_spec.size < 1) && /varchar|clob|text/i.test(col_spec.typeName)){
												//debug_window(col_spec)
												obj.xtype="textarea";
												var id =Ext.id();
												obj.id=id;
												obj.showHtml=function(){
													var text = this.getValue();
													var title = this.name;
													new Ext.Window({
														layout:'fit', 
														width:800, 
														height:600,
														maximizable:true,
														resizable:true,
														autoScroll:true,
														title:title,
														items:[{
															xtype:"tabpanel",
															activeTab:0,
															items:[{
																title:"TEXT",
																autoScroll:true,
																html:"<pre>" + text.escapeHtml()+"</pre>"
															},{
																title:"HTML",
																autoScroll:true,
																html:text
															}]
														}]
													}).show()
												}
												obj.fieldLabel+=[
													' <span \n',
													'class=link \n',
													'onclick=\'Ext.getCmp("' + id + '").showHtml()\' \n',
													'>(Open in New Window)</span>\n'
												].join("")
											}
											return obj
										}),
										listeners:{
											onrender:function(formPanel){
												//windows.setTimeout(function(){formPanel.collapse()},100)
											}
										}
									}]
								});
								
							} else {
								result.data.forEach(function(element){
									thisTab.data.push(element);
								});
								var grid = Ext.getCmp("result_grid" + tabId);
								document.getElementById("result_parsed" + tabId).innerHTML ="Parsed in " + (result.parseTime/1000) +" seconds"
								document.getElementById("result_displaying" + tabId).innerHTML ="Displaying " + thisTab.data.length +" of " + result.totalRows + " rows"
							}
							
							Ext.StoreMgr.get("result_store"+tabId).load();
							result_panel.doLayout();
						})
					})
				},
				items:[{
					/* north */
					region:"north",
					split:true,
					height:200,
					layout:"fit",
					xtype:"panel",
					items:[editor={
						xtype:"panel",
						id:"sql"+tabId,
						value:sql,
						enableKeyEvents:true,
						tempValue:sql,
						setValue:function(val){
							if (this.bespin){
								this.bespin.buffer.model.setValue(val);
							} else this.tempValue=val
						},
						getValue:function(){
							if (this.bespin){
								return this.bespin.buffer.model.getValue();
							} else return this.tempValue || ""
						},
						insertAtCursor:function(text){
							console.debug(this.bespin)
							this.bespin.editor.replace(this.bespin.editor.selection,text)
							window.setTimeout(function(){
								this.bespin.view.focus()
							},100)
							
						},
						listeners:{
							resize:function(ta){
								if (ta.bespin) {
									ta.bespin.editor.dimensionsChanged.call(ta.bespin.editor)
								}
							},
							render:function(ta){
								window.setTimeout(function(){
									bespin.useBespin(ta.body.dom,
										{ 
											 settings:{ 
												tabstop: 4, 
												//theme:"white"
												
											},
											syntax:"sql",
											stealFocus: true 
										}
									).then(function(bespin){
										bespin.tabId = tabId;
										if (ta.tempValue) bespin.buffer.model.setValue(ta.tempValue)
										ta.bespin = bespin	
										//console.debug(ta,"SQL control")
										//console.debug("console.debug(Ext.getCmp(\"" +ta.id+"\") )")
										
									});
								},100)
							},
							keydown2:function(ta,evt){
								var t = ta.el.dom;
								var kc = evt.getKey();
								if ("9,8,37,39,46,13,119".listContains(kc) ) {
									// hack for ie
									if (Ext.isIE){
										var range = document.selection.createRange();
										var stored_range = range.duplicate();
										stored_range.moveToElementText(t);
										stored_range.setEndPoint('EndToEnd', range);
										t.selectionStart = stored_range.text.length - range.text.length;
										t.selectionEnd = t.selectionStart + range.text.length;
										t.setSelectionRange = function(start, end){
											var range = this.createTextRange();
											range.collapse(true);
											range.moveStart("character", start);
											range.moveEnd("character", end - start);
											range.select();
										}
									}
																	
									// Set desired tab- defaults to four space softtab
									var tab = C.editorTab;
									var ss = t.selectionStart;
									var se = t.selectionEnd;
									// Tab key - insert tab expansion
									if (kc == 9) {
										evt.stopEvent();
										// Special case of multi line selection
										if (ss != se && t.value.slice(ss,se).indexOf("\n") != -1 ) {
											if (!Ext.isGecko) {
												Ext.Msg.alert("Error:","Mullt-line indent is only supported on Gecko based browsers (e.g. Firefox)");
												return
											}
											//first, normalize selection to whole lines
											for(;ss > 0;--ss){
												if (t.value.charAt(ss-1) == "\n") break;
											}
											t.selectionStart=ss;
											for(;se < t.value.length-1;++se){
												if (t.value.charAt(se+1) == "\n") break;
												
											}
											t.selectionEnd=se;
											
											
											var pre	= t.value.left(ss);
											var post = (t.value.length > se ? t.value.right(t.value.length -se): "")
											var tab_count = 1;
											
											var selection = t.value.slice(ss,se)
											selection = tab+selection.replace(/\n/g,function(str,p1){
												++tab_count
												return "\n"+tab
											});
											t.value = pre+selection+post;
											 t.selectionStart = ss
											t.selectionEnd = se + (tab.length * tab_count);
											
										}
										// "Normal" case (no selection or selection on one line only)
										else {
											if (Ext.isIE) {
												document.selection.createRange().text = tab
											} else {
												if (t.value.charAt(ss+1) == "\n") ++ss;
												
												t.value = t.value.left(ss) + tab + t.value.right(t.value.length-ss);
												if (ss == se) {
													t.selectionStart = t.selectionEnd = ss + tab.length;
												}
												else {
													t.selectionStart = ss + tab.length;
													t.selectionEnd = se + tab.length;
												}
											}
										}
									
									}
									// Backspace key - delete preceding tab expansion, if exists
									else if (evt.keyCode == 8 && t.value.slice(ss - tab.length,ss) == tab) {
										evt.stopEvent();
										t.value = t.value.slice(0,ss - 4).concat(t.value.slice(ss,t.value.length));
										t.selectionStart = t.selectionEnd =ss= ss - tab.length;
										
										
										if (Ext.isIE){
											var crChars = t.value.slice(0,ss).match(/(\r)/g);
											if (crChars) t.selectionEnd =t.selectionStart -= crChars.length;
											setTimeout(function(){
												t.setSelectionRange(t.selectionStart,t.selectionEnd)
											},100)
										}
									}
									
									// Enter key - align with previous line
									else if (evt.keyCode ==13 && ss != 0) {
										evt.stopEvent();
										var pre	= t.value.left(ss);
										var post = (t.value.length > se ? t.value.right(t.value.length -se): "")
										
										var start,end;
										
										for(start=ss;start > 0;--start){
											if (t.value.charAt(start-1) == "\n") break;
										}
										for(end=start;end < t.value.length;++end){
											if (t.value.charAt(end) != " ") break;
										}
										var white_space = "\n"+t.value.slice(start,end);
										t.value = pre+white_space+post;
										//t.value = pre+"bob"+"\n"+post;
										t.selectionStart = t.selectionEnd = ss+white_space.length ;
										if (Ext.isIE){
											var crChars = t.value.slice(0,ss).match(/(\r)/g);
											if (crChars) t.selectionEnd =t.selectionStart -= crChars.length;
											setTimeout(function(){
												t.setSelectionRange(t.selectionStart,t.selectionEnd)
											},100)
										}
									}
									// Left/right arrow keys - move across the tab in one go
									else if (evt.keyCode == 37 && t.value.slice(ss - tab.length,ss) == tab) {
										evt.stopEvent();
										t.selectionStart = t.selectionEnd = ss - tab.length;
										if (Ext.isIE){
											setTimeout(function(){
												t.setSelectionRange(t.selectionStart,t.selectionEnd)
											},100)
										}
									}
									else if (evt.keyCode == 39 && t.value.slice(ss,ss + tab.length) == tab) {
										evt.stopEvent();
										t.selectionStart = t.selectionEnd = ss + tab.length;
										if (Ext.isIE){
											setTimeout(function(){
												t.setSelectionRange(t.selectionStart,t.selectionEnd)
											},100)
										}
									}
									else if (evt.keyCode == 119 && t.value.trim().length) {
										config.execute_function()
									} else {
										
									}
	
									
								}
								
							}
						}
					}]
					
				
				},{
					/* center (button bar) and grid */
					region:"center",
					layout:"fit",
					id:"result_panel" + tabId,
					tbar:[{
						text:"Execute F8",
						//cls:"execute_button",
						handler:function(){config.execute_function()}
					},{
						xtype:"tbseparator"
					},{
						text:"Next Page",
						handler:function(){
							var thisTab = Ext.getCmp(tabId);
							config.execute_function(parseInt(thisTab.page)+1);	
						}
					},{
						xtype:"tbseparator"
					},{
						text:"All Pages",
						handler:function(){
							var thisTab = Ext.getCmp(tabId);
							config.execute_function(parseInt(thisTab.page)+1,true);	
						}
					}],
					xtype:"panel"
					
				}],
				listeners:{
					beforerender:function(){
						
					},
					render:function(){
						window.setTimeout(function(){
							var tab = Ext.getCmp(tabId);
							var editor = Ext.getCmp("sql"+tabId);
							
							
							if (sql.length){
								config.execute_function()
							}
							
						},100)	
					}
				}
			}
			
			
			 
			C.addTab(center_tabs,config);
			
			center_tabs.activate(tabId)
		}  else center_tabs.activate(tabId)
	}
/* ---------------- edit_table ---------------------------------------------- */
	C.edit_table=function(table_name){
		if (!table_name) table_name="";
		
		var center_tabs = Ext.getCmp("center_tabs");
		var validate_key,validate_coumn,table_changed;
		
		var tabId=Ext.id("edit_table");
		if (!center_tabs.findById(tabId)){
			var config={
				id:tabId,
				is_new:!table_name.length,
				deleted_cols:[],
				title:"Editing Table: " + table_name,
				closable:true,
				header:false,
				layout:"fit",
				frame:true,
				/* functions */
					validate_column:validate_column=function(record){
						var col = record.data;
						var error ="Error in column '" + col.column_name +"': "
						//if (!(/^[a-z][\w]*$/i.test(col.column_name))) return error + "columns names must start with a letter, and only contain letters, numbers or the underscore";
						if (!col.type_name.length) return error + "A type must be defined";
						if (
							"VARCHAR,VARBINARY".listContains(col.type_name)
							&& !col.column_size
						) return error + "Variable types must have a size defined";
						
						return "";
					},
					validate_key:validate_key=function(record){
						var key = record.data;
						var error ="Error in key '" + key.key_name +"': "
						
						if (!key.key_name.length) return error + "A key name must be defined";
						if (!key.type.length) return error + "A key type must be defined";
						if (!key.columns.length) return error + "A local column must be selected";
						
						if (key.type == "Foreign"){
							if (!key.foreign_table.length) return error + "A foriegn table must be selected for foreign keys";
							if (!key.foreign_column.length) return error + "A foriegn column must be selected for foreign keys";
						}
						return "";
					},
					table_changed:table_changed=function(){
						var tab = Ext.getCmp(tabId);
						var is_new = tab.is_new;
						var column_store = Ext.StoreMgr.get("desc_grid_store" +tabId);
						//isModified is a property set in the afterEdit listener
						var columns_changed = column_store && (column_store.isModified ||column_store.getModifiedRecords().length);
						var key_store = Ext.StoreMgr.get("key_grid_store" +tabId);
						var keys_changed = key_store && (key_store.isModified || key_store.getModifiedRecords().length);
						var is_recreate = Ext.getCmp("fld_recreate" + tabId).checked;
						
						var table_name = Ext.getCmp("fld_table_name" + tabId).getValue().toUpperCase();
						var myna_code="";
						var sql_code="";
						var mod_records;
						var any_changed=columns_changed || keys_changed;
						var errors,columns;
						
						
						if (is_new ||is_recreate || any_changed){
							Ext.getCmp("apply" + tabId).setDisabled(false);
						} 
						
						/* create db and table vars */
							myna_code+=new Ext.XTemplate([
								'var db = new Myna.Database("{ds}");\n',
								'var table = db.getTable("{table_name}");\n\n'
							]).apply({
								ds:C.currentDs,
								table_name:table_name
							});
						/* columns */
							if (is_new ||is_recreate || !any_changed){
								errors=[]
								columns = column_store.data.items
								.filter(function(record){
									if (!record.get("column_name").length) return false;
									if (record.deleted) return false;
									
									var error = validate_column(record);
									if (error.length) {
										errors.push(error);
										myna_code+="\n//"+error;
										sql_code+="\n--"+error;
										return false;
									}
									
									return true
								})
								
								if (columns.length){
									myna_code+=new Ext.XTemplate([
										'table.create({\n',
										'	recreate:{is_recreate},\n',
										'	columns:[{\n',
										'	<tpl for="columns">',
										'	name:"{column_name}",\n',
										'		type:"{type_name}"\n',
										'<tpl if="column_size !== null && column_size !==\'\'">		maxLength:"{column_size}",\n</tpl>',
										'<tpl if="decimal_digits">		decimalDigits:"{decimal_digits}",\n</tpl>',
										'<tpl if="column_def !== null && column_def !==\'\'">		defaultValue:"{column_def}",\n</tpl>',
										'		allowNull:{allowNull}\n',
										'	{[xindex < xcount ? "},{" : ""]}\n',
										'	</tpl>\n',
										'	}]\n',
										'});\n\n'
									]).apply({
										table_name:table_name,
										is_recreate:is_recreate,
										columns:columns.map(function(record){
											record.data.allowNull = record.data.is_nullable.toLowerCase() == 'yes'
											return record.data;
										})
									});
									sql_code += "-- " + (is_recreate ? "re" : "") +"creating table " +table_name + ";\n";
									if (is_recreate){
										sql_code += "DROP TABLE " + table_name + ";\n";
									}
									sql_code += new Ext.XTemplate(dbProperties[C.currentDbType].templates.createTable).apply({
										tableName:table_name,
										columns:columns.map(function(record){
											var col ={
												type:record.data.type_name.toUpperCase(),
												name:record.data.column_name.toUpperCase(),
												maxLength:String(record.data.column_size),
												decimalDigits:String(record.data.decimal_digits),
												defaultValue:String(record.data.column_def),
												allowNull:record.data.is_nullable.toLowerCase()=="yes",
												constraints:""
											}
											
											ObjectLib.getKeys(col).forEach(function(key){
												var text;
												switch(key){
													case "name":
														text = dbProperties[C.currentDbType].types[col.type];
														if (!text) text = col.type;
														
														col.type = new Ext.XTemplate(text).apply(col) ;
													break;
													
													case "allowNull":
														if (!col.allowNull){
															text = new Ext.XTemplate(dbProperties[C.currentDbType].templates.notNullConstraint).apply(col);
															col.constraints += " " + text + " ";
														}
													break; 
													
												}
											})
											return new Ext.XTemplate(dbProperties[C.currentDbType].templates.createColumn).apply(col);
										})
									}) + ";\n";
								}
								if (errors.length){
									//Ext.Msg.alert("Errors",errors.join("<br>"))
								}
							} else if (columns_changed){
								mod_records = column_store.getModifiedRecords()
								.filter(function(record){
									if (!record.get("column_name").length) return false;
									
									var error = validate_column(record);
									if (error.length) {
										myna_code+="\n//"+error;
										sql_code+="\n--"+error;
										return false;
									}
									
									return true
								});
								
								if (mod_records.length){
									mod_records.forEach(function(record){
										record.data.allowNull = record.data.is_nullable.toLowerCase() == 'yes'
										if (record.deleted){
											myna_code+=new Ext.XTemplate([
												'table.dropColumn("{name}");\n\n'
												]).apply({name:record.get("column_name")});
											sql_code += new Ext.XTemplate(dbProperties[C.currentDbType].templates.dropColumn).apply({
												tableName:table_name,
												name:record.get("column_name")
											}) + ";";
										} else if (record.modified.column_name =="" ) {
											myna_code+=new Ext.XTemplate([
												'table.addColumn({\n',
												'	name:"{column_name}",\n',
												'	type:"{type_name}"\n',
												'	maxLength:"{column_size}",\n',
												'	decimalDigits:"{decimal_digits},"\n',
												'	defaultValue:"{column_def},"\n',
												'	allowNull:{allowNull}\n',
												'});\n'
											]).apply(record.data);
											/* sql code */
												var col ={
													type:record.data.type_name.toUpperCase(),
													name:record.data.column_name.toUpperCase(),
													maxLength:String(record.data.column_size),
													decimalDigits:String(record.data.decimal_digits),
													defaultValue:String(record.data.column_def),
													allowNull:record.data.is_nullable.toLowerCase()=='yes',
													constraints:""
												}
												if (!col.allowNull){
													text = new Ext.XTemplate(dbProperties[C.currentDbType].templates.notNullConstraint).apply(col);
													col.constraints += " " + text + " ";
												}
												var text = dbProperties[C.currentDbType].types[col.type];
												if (!text) text = col.type;
												col.type = new Ext.XTemplate(text).apply(col) ;
												
												sql_code += new Ext.XTemplate(dbProperties[C.currentDbType].templates.addColumn).apply({
													tableName:table_name,
													columnDef:new Ext.XTemplate(dbProperties[C.currentDbType].templates.createColumn).apply(col)
												}) + ";\n";
										} else {
											myna_code+=new Ext.XTemplate([
												'table.modifyColumn({\n',
												'	name:"{column_name}",\n',
												'	type:"{type_name}"\n',
												'	maxLength:"{column_size}",\n',
												'	decimalDigits:"{decimal_digits},"\n',
												'	defaultValue:"{column_def},"\n',
												'	allowNull:{allowNull}\n',
												'});\n'
											]).apply(record.data);
											/* sql code */
												var new_col_name = "MYNA_TEMP";
												if (record.modified.column_name && record.modified.column_name != record.data.column_name){
													new_col_name = record.data.column_name.toUpperCase();
												} else {
													new_col_name += String(new Date().getTime()).right(30-new_col_name.length);
												}
												
												var col ={
													type:record.data.type_name.toUpperCase(),
													maxLength:String(record.data.column_size),
													decimalDigits:String(record.data.decimal_digits),
													defaultValue:String(record.data.column_def),
													allowNull:record.data.is_nullable.toLowerCase()=='yes',
													constraints:""
												}
												if (!col.allowNull){
													text = new Ext.XTemplate(dbProperties[C.currentDbType].templates.notNullConstraint).apply(col);
													col.constraints += " " + text + " ";
												}
												var text = dbProperties[C.currentDbType].types[col.type];
												if (!text) text = col.type;
												col.type = new Ext.XTemplate(text).apply(col) ;
												var add_and_copy = function(from_col,to_col){
													col.name = to_col;
													//add new column
													sql_code += new Ext.XTemplate(dbProperties[C.currentDbType].templates.addColumn).apply({
														tableName:table_name,
														columnDef:new Ext.XTemplate(dbProperties[C.currentDbType].templates.createColumn).apply(col)
													}) + ";\n";
													
													//copy data to new column
													sql_code += new Ext.XTemplate(
														'update {table_name} set {to_col} = {from_col};\n'
													).apply({
														table_name:table_name.toUpperCase(),
														to_col:to_col,
														from_col:from_col
													})	
													
													//drop old column
													sql_code += new Ext.XTemplate(dbProperties[C.currentDbType].templates.dropColumn).apply({
														tableName:table_name,
														name:from_col
													}) + ";\n";
												}
												add_and_copy(record.id.toUpperCase(),new_col_name);
												
												//if this column was not renamed, copy back to original name
												if (!record.modified.column_name){
													add_and_copy(new_col_name,record.data.column_name.toUpperCase());
												}
												
											
												
										}
										
										//new_col_name +=String(new Date.getTime()).right(30-new_col_name.length);
									})
								} 
							}
						/* keys */
							
							if (keys_changed ){
								mod_records = key_store.getModifiedRecords();
							} else {
								mod_records=key_store.data.items
							}
							if (keys_changed || !any_changed){
								mod_records = mod_records.filter(function(record){
									if (!(record.data.key_name.length + record.data.type.length)) return false;
									
									var error = validate_key(record);
									if (error.length) {
										myna_code+="\n//"+error;
										sql_code+="\n--"+error;
										return false;
									}
									
									return true
								})
								
								if (mod_records.length){
									myna_code+="\n// Keys:\n";
									sql_code +="\n-- Keys:\n";
									
									mod_records.forEach(function(record){
										if (
												(keys_changed && record.modified.key_name != "") 
												|| is_recreate
										){ 
											myna_code+=new Ext.XTemplate([
												'table.dropConstraint("{name}");\n'
												]).apply({name:record.modified.key_name});
											if (record.data.type =="Primary"){
												sql_code += new Ext.XTemplate(dbProperties[C.currentDbType].templates.dropPrimaryKey).apply({
													tableName:table_name,
													id:record.modified.key_name
												}) + ";\n";
											} else {
												sql_code += new Ext.XTemplate(dbProperties[C.currentDbType].templates.dropConstraint).apply({
													tableName:table_name,
													id:record.modified.key_name
												}) + ";\n";
											}
										} 
										if (record.data.key_name != "MYNA DELETED"){
											if (record.data.type == "Primary"){
												/* myna code */
													myna_code+=new Ext.XTemplate([
														'table.addPrimaryKey({\n',
														'	id:"{key_name}",\n',
														'	column:"{columns}"\n',
														'});\n\n'
													]).apply(record.data);
												/* sql code */
													sql_code += new Ext.XTemplate(dbProperties[C.currentDbType].templates.addConstraint).apply({
														tableName:table_name,
														id:record.data.key_name,
														constraint:new Ext.XTemplate(dbProperties[C.currentDbType].templates.primaryKeyConstraint).apply({}),
														name:record.data.columns.listFirst()
													}) + ";\n\n";
											} else {
												/* myna code */
													myna_code+=new Ext.XTemplate([
														'table.addForeignKey({\n',
														
														'	localColumn:"{columns}",\n',
														'	foreignTable:"{foreign_table}",\n',
														'	foreignColumn:"{foreign_column}",\n',
														'	onDelete:"{on_delete}", \n',
														'	onUpdate:"{on_update}" \n',
														'});\n\n'
													]).apply(record.data);
												/* sql code */
													sql_code += new Ext.XTemplate(dbProperties[C.currentDbType].templates.addForeignKeyConstraint).apply({
														tableName:table_name,
														name:record.data.columns.listFirst(),
														id:record.data.key_name,
														references:{
															table:record.data.foreign_table,
															column:record.data.foreign_column,
															onDelete:record.data.on_delete,
															onUpdate:record.data.on_update	
														}
													}) + ";\n\n";
											}
										}
									})
								}
							} 
						Ext.getCmp("myna_code" + tabId).setValue(myna_code)
						Ext.getCmp("sql_code" + tabId).setValue(sql_code)
					},
				items:[{
				/* main panel - table name */
					xtype:"panel",
					layout:"fit",
					tbar:[{
							xtype:"tbtext",
							text:"Table Name:"
						},{
							xtype:"textfield",
							value:table_name,
							id:"fld_table_name" + tabId,
							disabled:!!table_name.length
						},{
							xtype:"tbtext",
							text:"&nbsp;".repeat(10)
						},{
							xtype:"tbtext",
							text:"Drop and recreate?"
						},{
							xtype:"checkbox",
							id:"fld_recreate" + tabId,
							checked:false,
							listeners:{
								check:table_changed	
							}
					}],
					items:[{
					/* tabs */
						xtype:"tabpanel",
						deferredRender:false,
						layoutOnTabChange:true,
						autoDestroy:true,
						activeTab:0,
						items:[{
						/* column grid */
							title:"Columns",
							layout:"fit",
							items:[{
								xtype:"editorgrid",
								title:"Click a table cell to edit.",
								bbar:[{
									text:"Add Column",
									handler:function(){
										var store= Ext.StoreMgr.get("desc_grid_store" +tabId);
										store.loadData([{
											column_name:"",
											type_name:'',
											decimal_digits:'',
											column_size:'',
											column_def:'',
											ordinal_position:'',
											is_nullable:'YES'
										}],true);
										
										
									}
								},{
									xtype:"tbspacer"
								},{
									text:"Delete Column",
									handler:function(){
										var thisTab = Ext.getCmp(tabId); 
										var grid = Ext.getCmp("desc_grid"+tabId);
										var selected_record = grid.getSelectionModel().getSelected();
										var store = grid.getStore();
										//thisTab.deleted_cols.push(selected_record.id);
										selected_record.deleted=true;
										selected_record.set("column_name","MYNA DELETED")
										store.remove(selected_record);
									}
								}],
								id:"desc_grid"+tabId,
								stripeRows:true,
								ds:column_store=new Ext.data.Store({
									storeId:"desc_grid_store" +tabId,
									proxy: new Ext.data.HttpProxy({
										url: '?fuseaction=describe_table'
									}),
									baseParams:{
										table_name:table_name.listLast(":"),
										ds:C.currentDs
									},
									reader: new Ext.data.JsonReader({
										id: "column_name"            
									},
									[
										{name:'column_name'},
										{name:'type_name',convert:Ext.util.Format.uppercase},
										{name:'decimal_digits'},
										{name:'column_size'},
										{name:'column_def'},
										{name:'ordinal_position'},
										{name:'is_nullable'}
									]),
									remoteSort: false,
									sortInfo:{
										field:'ordinal_position',
										direction:'ASC'
									},
									listeners: {
										update:table_changed
									}
								}),
								columns:[{
										header: "Column Name", 
										width: 150, 
										sortable: true,  
										dataIndex: 'column_name',
										editor: new Ext.form.TextField({
											allowBlank:false,
											selectOnFocus:true,
											regex:/^[a-z][\w]*$/i,
											regexText:"columns names must start with a letter, and only contain letters, numbers or the underscore",
											maxLength:30
										})
									},{
										header: "Type", 
										width: 75, 
										sortable: true,  
										dataIndex: 'type_name',
										editor:new Ext.form.ComboBox({
											listWidth:150,								
											store:new Ext.data.SimpleStore({
												fields: ['type'],
												data:[
													["BIGINT"],
													["INTEGER"],
													["NUMERIC"],
													["DATE"],
													["TIMESTAMP"],
													["VARCHAR"],
													["CLOB"],
													["TEXT"],
													["VARBINARY"],
													["BLOB"]
												]
											}),
											displayField:'type',
											typeAhead: true,
											mode: 'local',
											triggerAction: 'all',
											emptyText:'',
											selectOnFocus:true,
											editable:true,
											forceSelection:true,
											allowBlank:false
										})
									},{
										header: "Size", 
										width: 75, 
										sortable: true,  
										dataIndex: 'column_size',
										editor: new Ext.form.NumberField({
											allowBlank:true,
											selectOnFocus:true
										})
									},{
										header: "Precision", 
										width: 75, 
										sortable: true,  
										dataIndex: 'decimal_digits',
										editor: new Ext.form.NumberField({
											allowBlank:true,
											selectOnFocus:true
										})
									},{
										header: "Default Value", 
										width: 75, 
										sortable: true,  
										dataIndex: 'column_def',
										editor: new Ext.form.TextField({
											allowBlank:true,
											selectOnFocus:true
										})
									},{
										header: "Nullable?", 
										width: 50, 
										sortable: true,  
										dataIndex: 'is_nullable',
										editor:new Ext.form.ComboBox({
											listWidth:150,								
											store:new Ext.data.SimpleStore({
												fields: ['type'],
												data:[
													["NO"],
													["YES"]
												]
											}),
											displayField:'type',
											typeAhead: true,
											mode: 'local',
											triggerAction: 'all',
											emptyText:'',
											selectOnFocus:true,
											editable:true,
											allowBlank:false
										})
								}],
								autoExpandColumn:0,
								sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
								loadMask: true,
								clicksToEdit:1,
								listeners: {
									beforerender:function(grid){
										var store =Ext.StoreMgr.get("desc_grid_store"+tabId); 
										store.load({
											callback:function(){
												var store = grid.getStore();
												if (!store.getCount()){
													store.loadData([{
														column_name:"",
														type_name:'',
														decimal_digits:'',
														column_size:'',
														column_def:'',
														ordinal_position:'',
														is_nullable:'NO'
													}],true);
													grid.startEditing(0, 0)
												}
												config.table_changed();
											}
										});
										
									},
									afteredit:function(e){
										/* "e" properties: 
										 * grid - This grid
										 * record - The record being edited
										 * field - The field name being edited
										 * value - The value being set
										 * originalValue - The original value for the field, before the edit.
										 * row - The grid row index
										 * column - The grid column index
										*/
										var store = e.grid.getStore();
										store.isModified =true;
										table_changed();
										if (e.row == store.getCount()-1){
											store.loadData([{
												column_name:"",
												type_name:'',
												decimal_digits:'',
												column_size:'',
												column_def:'',
												ordinal_position:'',
												is_nullable:'YES'
											}],true);
										}
									}
								}
							}]
						},{
						/* keys */
							title:"Keys",
							layout:"fit",
							items:[{
								xtype:"editorgrid",
								title:"Click a table cell to edit.",
								bbar:[{
									text:"Add Key",
									handler:function(){
										var store= Ext.StoreMgr.get("key_grid_store" +tabId);
										store.loadData([{
											key_name:"",
											type:"",
											columns:"",
											forign_table:"",
											foreign_column:"",
											on_delete:"CASCADE",
											on_update:"CASCADE"
										}],true);
										
										
									}
								},{
									xtype:"tbspacer"
								},{
									text:"Delete Key",
									handler:function(){
										var thisTab = Ext.getCmp(tabId); 
										var grid = Ext.getCmp("key_grid"+tabId);
										var selected_record = grid.getSelectionModel().getSelected();
										var store = grid.getStore();
										selected_record.deleted=true;
										selected_record.set("key_name","MYNA DELETED")
										store.remove(selected_record);
										table_changed();
									}
								}],
								id:"key_grid"+tabId,
								stripeRows:true,
								ds:new Ext.data.Store({
									storeId:"key_grid_store" +tabId,
									proxy: new Ext.data.HttpProxy({
										url: '?fuseaction=get_keys'
									}),
									baseParams:{
										table_name:table_name.listLast(":"),
										ds:C.currentDs
									},
									reader: new Ext.data.JsonReader({
										id: "key_name"            
									},
									[
										{name:'key_name'},
										{name:'type'},
										{name:'columns'},
										{name:'foreign_table'},
										{name:'foreign_column'},
										{name:'on_delete'},
										{name:'on_update'}
									]),
									remoteSort: false,
									listeners: {
										update:table_changed
									}
								}),
								columns:[{
										header: "Key Name", 
										width: 150, 
										sortable: true,  
										dataIndex: 'key_name',
										editor: new Ext.form.TextField({
											allowBlank:true,
											selectOnFocus:true
										})
									},{
										header: "Type", 
										width: 75, 
										sortable: true,  
										dataIndex: 'type',
										editor:new Ext.form.ComboBox({
											listWidth:100,								
											store:new Ext.data.SimpleStore({
												fields: ['type'],
												data:[
													["Primary"],
													["Foreign"]
												]
											}),
											displayField:'type',
											typeAhead: true,
											mode: 'local',
											triggerAction: 'all',
											emptyText:'',
											selectOnFocus:true,
											editable:true,
											allowBlank:false
										})
									},{
										header: "Local Column", 
										width: 150, 
										sortable: true,  
										dataIndex: 'columns',
										editor:new Ext.form.ComboBox({
											xtype:"combo",
											id: "key_local_column" + tabId,
											/* store:new Ext.data.Store({
												storeId:"key_local_column" + tabId,
												proxy: new Ext.data.HttpProxy({
													url: "?fuseaction=load_objects"
												}),
											
												reader: new Ext.data.JsonReader({
													id: "text"            
												},
												[
													{name:'text'},
												])
												
											}), */
											store:column_store,
											displayField:'column_name',
											valueField:'column_name',
											forceSelection:true,
											typeAhead: true,
											mode: 'local', 
											triggerAction: 'all',
											emptyText:'',
											selectOnFocus:true,
											editable:true,
											allowBlank:false,
											listeners:{
												beforerender:function(combo){
													/* combo.store.baseParams={
														ds:C.currentDs,
														node:"table:" + Ext.getCmp("fld_table_name" + tabId).getValue()
													} */
												}
											}
										})
									},{
										header: "Foreign Table", 
										width: 100, 
										sortable: true,  
										dataIndex: 'foreign_table',
										editor:new Ext.form.ComboBox({
											xtype:"combo",
											id: "key_foreign_table" + tabId,
											store:new Ext.data.Store({
												storeId:"key_local_column" + tabId,
												proxy: new Ext.data.HttpProxy({
													url: "?fuseaction=load_objects"
												}),
											
												reader: new Ext.data.JsonReader({
													id: "text"            
												},
												[
													{name:'text'},
												])
												
											}),
											displayField:'text',
											valueField:'text',
											typeAhead: true,
											mode: 'remote', 
											triggerAction: 'all',
											emptyText:'',
											selectOnFocus:true,
											editable:true,
											allowBlank:false,
											listeners:{
												beforerender:function(combo){
													combo.store.baseParams={
														ds:C.currentDs,
														node:"table_type::TABLE"
													}
												}
											}
										})
									},{
										header: "Foreign Column", 
										width: 100, 
										sortable: true,  
										dataIndex: 'foreign_column',
										editor:new Ext.form.ComboBox({
											xtype:"combo",
											id: "key_foreign_column" + tabId,
											store:new Ext.data.Store({
												storeId:"key_local_column" + tabId,
												proxy: new Ext.data.HttpProxy({
													url: "?fuseaction=load_objects"
												}),
											
												reader: new Ext.data.JsonReader({
													id: "text"            
												},
												[
													{name:'text'},
												])
												
											}),
											displayField:'text',
											valueField:'text',
											typeAhead: true,
											mode: 'remote', 
											triggerAction: 'all',
											emptyText:'',
											selectOnFocus:true,
											editable:true,
											allowBlank:false
											
										})
									},{
										header: "On Delete", 
										width: 100, 
										sortable: true,  
										dataIndex: 'on_delete',
										editor:new Ext.form.ComboBox({
											listWidth:150,								
											store:new Ext.data.SimpleStore({
												fields: ['type'],
												data:[
													["CASCADE"],
													["SET NULL"],
													["SET DEFAULT"],
													["NO ACTION"]
												]
											}),
											displayField:'type',
											typeAhead: true,
											mode: 'local',
											triggerAction: 'all',
											emptyText:'',
											selectOnFocus:true,
											forceSelection:true,
											editable:true,
											allowBlank:false
										})
									},{
										header: "On Update", 
										width: 100, 
										sortable: true,  
										dataIndex: 'on_update',
										editor:new Ext.form.ComboBox({
											listWidth:150,								
											store:new Ext.data.SimpleStore({
												fields: ['type'],
												data:[
													["CASCADE"],
													["SET NULL"],
													["SET DEFAULT"],
													["NO ACTION"]
												]
											}),
											displayField:'type',
											typeAhead: true,
											mode: 'local',
											triggerAction: 'all',
											emptyText:'',
											selectOnFocus:true,
											editable:true,
											allowBlank:false
										})
								}],
								autoExpandColumn:0,
								sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
								loadMask: true,
								clicksToEdit:1,
								listeners: {
									beforerender:function(grid){
										Ext.StoreMgr.get("key_grid_store"+tabId).load({
											callback:function(){
												var store = grid.getStore();
												if (!store.getCount()){
													
													store.loadData([{
														key_name:"",
														type:"",
														columns:"",
														forign_table:"",
														foreign_column:"",
														on_delete:"CASCADE",
														on_update:"CASCADE"
													}],true);
													grid.startEditing(0, 0)
												}
												config.table_changed();
											}
										});
										
									},
									beforeedit:function(e){
										//e = {grid,record,field,value,row,column,cancel}
										//debug_window(e)
										switch(e.field){
											case "foreign_column":
												if (e.record.data.type != "Foreign"){
													e.cancel=true;
													Ext.Msg.alert("Error","Foreign Column is only applicable to foreign keys");
													return;
												}
												if (e.record.data.foreign_table == ""){
													e.cancel=true;
													Ext.Msg.alert("Error","Please select Foreign Table before selecting Foreign Column");
													return;
												}
												var combo = Ext.getCmp("key_foreign_column" + tabId); 
												combo.store.baseParams={
													ds:C.currentDs,
													node:"table:" + e.record.data.foreign_table
												}		
												combo.store.reload()
											break;
											case "foreign_table":
												if (e.record.data.type != "Foreign"){
													e.cancel=true;
													Ext.Msg.alert("Error","Foreign Table is only applicable to foreign keys");
													return;
												}
											break;
											case "on_update":
												if (e.record.data.type != "Foreign"){
													e.cancel=true;
													Ext.Msg.alert("Error","On Update is only applicable to foreign keys");
													return;
												}
											break;
											case "on_delete":
												if (e.record.data.type != "Foreign"){
													e.cancel=true;
													Ext.Msg.alert("Error","On Delete is only applicable to foreign keys");
													return;
												}
											break;
										}
											
									},
									afteredit:function(e){
										/* "e" properties: 
										 * grid - This grid
										 * record - The record being edited
										 * field - The field name being edited
										 * value - The value being set
										 * originalValue - The original value for the field, before the edit.
										 * row - The grid row index
										 * column - The grid column index
										*/
										var store = e.grid.getStore();
										store.isModified =true;
										if (e.row == store.getCount()-1){
											store.loadData([{
												key_name:"",
												type:"",
												columns:"",
												forign_table:"",
												foreign_column:"",
												on_delete:"CASCADE",
												on_update:"CASCADE"
											}],true);
										}
									}
								}
							}]
						/*},{
							title:"Indexes" */
						},{
						/* Myna Code */
							title:"Myna Code",
							layout:"fit",
							id:"myna_code" + tabId,
							xtype:"textarea"
						},{
						/* SQL Code */
							title:"SQL Code",
							layout:"fit",
							id:"sql_code" + tabId,
							xtype:"textarea"
						}]
					}]
				}],
				buttonAlign:"center",
				buttons:[{
					text:"Apply",
					disabled:true,
					id:"apply" + tabId,
					handler:function(){
						table_changed();
						var table_name = Ext.getCmp("fld_table_name" + tabId).getValue();
						if (!table_name.length) {
							Ext.Msg.alert("Error:","Please enter a table name")
							return;
						}
						var sql_array = Ext.getCmp("sql_code" + tabId).getValue().split(/;/);
						var column_store = Ext.StoreMgr.get("desc_grid_store" +tabId);
						var key_store = Ext.StoreMgr.get("key_grid_store" +tabId);
						var waitWin = Ext.Msg.wait("Commiting Changes...");
						var exec_sql = function(){
							if (!sql_array.length) {
								var table_name = Ext.getCmp("fld_table_name" + tabId).getValue();
								Ext.getCmp("center_tabs").remove(tabId);
								C.edit_table(table_name);
								waitWin.hide();
								C.infoMsg("Changes Commited")
								
									
									
								
								return;
							}
							var sql =sql_array.shift();
							
							if (sql.trim().length){
								Ext.Ajax.request({
									url:"?fuseaction=execute_query",
									params:{
										ds:C.currentDs,
										sql:sql
									},
									//waitMsg:"Comiting changes...",
									callback:C.cbHandler(function(result){
										if (result.success || sql.left(4) == "DROP"){
											exec_sql();
										} else {
											waitWin.hide();
											return false;
										}
									})
								})	
							} else exec_sql();	
						}
						exec_sql();
					}
				},{
					text:"Cancel",
					handler:function(){
						Ext.getCmp("center_tabs").remove(tabId);	
					}
				}],
				listeners:{
					beforerender:function(panel){
						//panel.ownerCt.doLayout();
					}	
				}
			}
			
			C.addTab(center_tabs,config);
			
			center_tabs.activate(tabId)
		}  else center_tabs.activate(tabId)
	}
