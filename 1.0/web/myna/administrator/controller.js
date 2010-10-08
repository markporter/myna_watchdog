var viewport;
var C ={
	body:null,
	dSstore:null,
	msgCt:null,
	linkRenderer:function(val){
		return "<span class='link'>" + val + "</span>";	
	}
}



/* ---------------- init ---------------------------------------------------- */
	C.init=function(){
		C.body = Ext.get(document.body);
		C.msgCt = Ext.DomHelper.insertFirst(C.body, {id:'msg-div'}, true);
		var oldDecode = Ext.util.JSON.decode;
		Ext.decode = Ext.util.JSON.decode = function(text){
			try{
				console.dir(text.parseJson())
				return text.parseJson();
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
		Ext.data.JsonReader.prototype.read=function(response){
		  var json = response.responseText;
		  var o = json.parseJson();
		  if(!o) {
				throw {message: "JsonReader.read: Json object not found"};
		  }
		  return this.readRecords(o);
		},
		Ext.form.Field.prototype.msgTarget = 'under';
		//Provides attractive and customizable tooltips for any element.
		Ext.QuickTips.init();
		var buttons=[];
		
		var config={
			layout:"fit",
			items:[{
				layout:"border",
				tbar:[{
						xtype:"tbtext",
						text:"<div class='app_title'>Myna Adminstrator</div>"
					},{
						xtype:"tbfill"
					},{
						
						xtype:"tbtext",
						text:title
					},{
						xtype:"tbtext",
						text:"&nbsp;".repeat(10)
					},{
						xtype:"tbtext",
						text:'Version: ' +version
					},{
						text:"Logout",
						handler:function(){
							location.href="?fuseaction=logout"
						}
				}],
				items:[{//center
						xtype:"panel",
						region:"center",
						frame:false,
						layout:"fit",
						border:false,
						
						
						items:[{//center_tabs
							id:"center_tabs",
							hidden:true,
							xtype:"tabpanel",
							autoDestroy:true,
							listeners: {
							}		
						}]
					
					},{//west
						region:"west",
						width:150,
						border:false,
						xtype:"panel",
						/* bodyStyle:"padding:10px;", */
						bodyBorder:false,
						title:"Options:",
						collapsible:true,
						frame:true,
						defaults:{
							border:false,
							bodyStyle:"padding:5px"
						},
						items:[{
							html:'<span class="link" onclick="C.settings.main()">General Settings</span>'
						},{
							html:'<span class="link" onclick="C.ds.main()">Data Sources</span>'
						},{
							html:'<span class="link" onclick="C.threads.main()">Running Requests</span>'
						},{
							html:'<span class="link" onclick="C.log_general.main()">View General Log</span>'
							//html:'<a href="?fuseaction=view_log_general" class="link" target="myna_log_general">View General Log</span>'
						},{
							html:'<span class="link" onclick="C.upgrade.main()">Upgrade Myna</span>'
						},{
							html:'<span class="link" onclick="C.tasks.main()">Scheduled Tasks</span>'
						},{
							html:'<span class="link" onclick="C.launch_permissions()">Permissions</span>'
						},{
							/*html:'<b>Permissions:</b>'
						},{
							 html:'<li><span class="link" onclick="C.users.main()">Manage Users</span></li>'
						},{
							html:'<li><span class="link" onclick="C.rights.main()">Manage Rights</span></li>'
						},{
							html:'<li><span class="link" onclick="C.user_groups.main()">Manage User Groups</span></li>'
						},{ */
							html:'<span class="link" onclick="C.applications.main()">Manage Applications</span>'
							
						},{
							html:'<a href="?fuseaction=new_password_form" class="link" >Change Admin Password</a>'
						},{
							html:'<span class="link" onclick="window.open(\'' + rootUrl + 'shared/docs/index.html\')">Documentation</span>'
						},{
							html:'<span class="link" onclick="window.open(\'' + rootUrl + 'examples/index.ejs\')">Code Examples</span>'
						}]
					},{//south
						region:"south",
						height:20,
						layout:"fit",
						hidden:true,
						xtype:"toolbar",
						items:[{
								xtype:"tbfill"
							},
							C.body.createChild({
								id:"status_label",
								html:"status_label"
							}).dom,
							{
								xtype:"tbspacer"
							},{
								xtype:"tbspacer"
							},{
								xtype:"tbspacer"
						}]
				}]
			}]
				
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
		
		viewport = new Ext.Viewport(config);
		
		//C.applications.installEgg()
		//C.applications.exportApp("myna_admin");
		C.tasks.main();
	}
/* ================ helper functions ======================================== */
	/* ---------------- addTab ---------------------------------------------- */
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
			C.body.unmask();
		}
	/* ---------------- infoMsg --------------------------------------------- */
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
	/* ---------------- disableUnchanged ------------------------------------ */
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
	/* ---------------- createStore ----------------------------------------- */
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
	/* ---------------- getUuid --------------------------------------------- */
		/*	retrieves a UUID from the server and then calls the supplied callback 
			function with the UUID
		*/
		C.getUuid = function(callback){
			Ext.Ajax.request({
					url:"?fuseaction=create_uuid",
					callback:C.cbHandler(function(result){
						if (result.success){
							callback(result.value)
						} else return false
					})
			})
			
		}	
	/* ---------------- cbHandler ------------------------------------------- */
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
			try{
				var result = Ext.decode(responseText);
				if (result.errorMsg){
					if (!result.errorDetail){
						result.errorDetail =result.errorMsg;
						result.errorMsg = "Error:"
					}
					Ext.MessageBox.alert(result.errorMsg,result.errorDetail);
					return;
				} else if (result.errors){
					Ext.MessageBox.alert('Error:', "Error submitting data. Please see highlighted fields.");
					return;
				} else{
					Ext.MessageBox.alert('Error:', responseText);
					return;
				}
			} catch(e){
				Ext.MessageBox.alert('Error:', responseText);
				return;
			}
		}
	/* ---------------- renderControlField ---------------------------------- */
		C.renderControlField = function(form_id,control_type,name,label,value,pageId){
			if (!pageId) pageId=0;
			
			if (!value) value="";
			var options ={
				form_id:form_id,
				control_type:control_type,
				name:name,
				label:label,
				value:value,
				request_id:pageId
			}
			var control={
				name:name,
				fieldLabel:label,
				value:value,
				/* width:225, */
				xtype:"textfield"
			}
			var label_style="color:#15428B;";
			var field_table = "margin-top:10px;margin-bottom:5px;";
			switch(control_type){
				case "long":
					control.xtype="textarea";
					control.width=300;
					control.height=120;
					//control.grow=true;
					//control.growMin=45;
					//control.growMax=250;
					
					/* control.enableFont=false;
					control.enableFontSize=false;
					control.enableColors=false;
					control.enableLinks=false;
					control.enableSourceEdit=false; */
					
				break;	
				case "date":
					control.xtype="datefield";
					control.readOnly = true;
				break;
				case "right-single":
					control={
						xtype:"combo",
						store: new Ext.data.Store({
							proxy: new Ext.data.HttpProxy({
								url: '?fuseaction=qry_rights'
							}),
							reader: new Ext.data.JsonReader({
								root: 'data',
								id: 'right_id',
								totalProperty:'totalRows'
							}, [
								{name: 'right_id'},
								{name: 'name'},
								{name: 'appname'},
								{name: 'description'}
							])
						}),
						fieldLabel:label,
						displayField:'name',
						valueField:'right_id', 
						hiddenName:name,
						typeAhead: false,
						loadingText: 'Searching...',
						/* width: 207, */ 
						value:value,
						minChars:1,
						emptyText:'search...',
						queryParam:"search",
						triggerClass:"x-form-search-trigger",
						itemSelector: 'tr.search-item',
						tpl:new Ext.XTemplate(
							'<table class="combo_table" width="100%" height="" cellspacing="0" celpadding="0" border="0">',
								'<tr class="search-header">',
									'<td>',
										'Right Name',
									'</td>',
									'<td>',
										'App Name',
									'</td>',
									'<td>',
										'Description',
									'</td>',
								'</tr>',
								'<tpl for=".">',
								'<tr class="search-item">',
									'<td>',
										'{name}',
									'</td>',
									'<td>',
										'{appname}',
									'</td>',
									'<td>',
										'{description}',
									'</td>',
								'</tr>',
								'</tpl>',
							'</table>'
						),
						pageSize:15, 
						listWidth:500,
						forceSelection:true,
						allowBlank:true	,
						listeners:{}
					}
				break;
				case "user-single":
					control={
						xtype:"combo",
						store: new Ext.data.Store({
							proxy: new Ext.data.HttpProxy({
								url: '?fuseaction=qry_users'
							}),
							reader: new Ext.data.JsonReader({
								root: 'data',
								id: 'user_id',
								totalProperty:'totalRows'
							}, [
								{name: 'first_name'},
								{name: 'last_name'},
								{name: 'middle_name'},
								{name: 'logins'},
								{name: 'user_id'}
							])
						}),
						fieldLabel:label,
						displayField:'name',
						valueField:'user_id', 
						hiddenName:name,
						typeAhead: false,
						loadingText: 'Searching...',
						/* width: 207, */ 
						value:value,
						minChars:1,
						emptyText:'Type a name to search...',
						queryParam:"search",
						triggerClass:"x-form-search-trigger",
						itemSelector: 'tr.search-item',
						tpl:new Ext.XTemplate(
							'<table class="combo_table" width="100%" height="" cellspacing="0" celpadding="0" border="0">',
								'<tpl for=".">',
								'<tr class="search-item">',
									'<td>',
									'{first_name} {middle_name} {last_name}',
									'</td>',
									'<td>',
										'{logins}',
									'</td>',
								'</tr>',
								'</tpl>',
							'</table>'
						),
						pageSize:15, 
						listWidth:500,
						forceSelection:true,
						allowBlank:true	,
						listeners:{}
					}
				break;
				case "user-multiple":
					control={
						xtype:"panel",
						layout:'border',
						border:false,
						bodyStyle:"background-color:transparent;"+field_table,
						height:125,
						width:500,
						defaults: {
							// applied to each contained panel
							/* bodyStyle:'padding:20px */
							border:false
						},
						/* layoutConfig: {
							// The total column count must be specified here
							columns:2
						}, */
						items: [{
							xtype:"panel",
							region:"west",
							width:150,
							html:"<div class='x-form-item form_field'  style='" + label_style + "'>" +options.label+":</div>",
							bodyStyle:'background-color:transparent'
						},{
							xtype:"panel",
							region:"center",
							bodyStyle:'padding-left:8px;margin-bottom:8px;background-color:transparent',
							
							items:[{
								xtype:"hidden",
								name:options.name,
								id:"user_multiple_hidden" + options.name + pageId
							},{
								xtype:"combo",
								store: new Ext.data.Store({
									proxy: new Ext.data.HttpProxy({
										url: 'index_admin.cfm?fuseaction=qry_users'
									}),
									reader: new Ext.data.JsonReader({
										root: 'rows',
										id: 'userid',
										totalProperty:'total'
									}, [
										{name: 'name'},
										{name: 'ldapid'},
										{name: 'userid'}
									])
								}),
								displayField:'name',
								valueField:'userid', 
								typeAhead: false,
								listWidth:300,
								loadingText: 'Searching...',
								/* width: 207, */ 
								emptyText:'Type a name to search...',
								triggerClass:"x-form-search-trigger",
								itemSelector: 'tr.search-item',
								tpl:new Ext.XTemplate(
									'<table class="combo_table" width="100%" height="" cellspacing="0" celpadding="0" border="0">',
										'<tpl for=".">',
										'<tr class="search-item">',
											'<td>',
												'{name}',
											'</td>',
											'<td>',
												'{ldapid}',
											'</td>',
										'</tr>',
										'</tpl>',
									'</table>'
								),
								pageSize:10,
								forceSelection:true,
								allowBlank:true,
								listeners:{
									select:function( combo, record, index){
										var store = Ext.getCmp("user_multiple" + options.name + pageId).getStore();
										var f = Ext.getCmp("user_multiple_hidden" + options.name + pageId);
										
										//combo.clearValue();
										if (!f.getValue().listContains(record.id)){
											f.setValue(f.getValue().listAppendUnique(record.id))
											var form = f.findParentByType("form").form
											form.setValues(form.getValues());
											store.add([record]);
										}
										window.setTimeout(function(){
											combo.focus();
											combo.selectText();
										},100)
										
									}
								}
							},{
								xtype:"grid",
								width:300,
								frame:true,
								height:100,
								autoScroll:true,
								id:"user_multiple" + options.name + pageId,
								stripeRows:true,
								ds:new Ext.data.SimpleStore({
									storeid:"user_multiple" + options.name + pageId,
									id:2,
									fields: r= ['name','ldapid','userid'],
									data:[]
								}),
								record_spec:r,
								columns:[{
									header: "Name", 
									/* width: 200, */ 
									sortable: true,  
									dataIndex: 'name'
								},{
									header: "Ldapid", 
									width: 75, 
									sortable: true,  
									dataIndex: 'ldapid'
								},{
									header: "", 
									width: 75, 
									sortable: true,  
									dataIndex: 'userid',
									renderer:function(val){
										return "<div class='link'>remove<div>";	
									}
								}],
								autoExpandColumn:0,
								sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
								loadMask: true,
								listeners: {
									beforerender:function(grid){
										if (value && String(value).length){
											Ext.Ajax.request({
												url:"?fuseaction=qry_userids",
												params:{
													userid_list:value	
												},
												callback:C.cbHandler(function(result){
													var store = grid.getStore();
													var f = Ext.getCmp("user_multiple_hidden" + options.name + pageId);
													var R = Ext.data.Record.create(grid.record_spec);
													store.add(result.rows.map(function(row){
														return new R(row);
													}));
													f.setValue(value)
												})
											})	
										}
									},
									cellclick:function(grid, rowIndex, columnIndex, e){
										if (columnIndex==2){
											var store = grid.getStore();
											var f = Ext.getCmp("user_multiple_hidden" + options.name + pageId);
											var record = store.getAt(rowIndex)
											var value_array =f.getValue().split(/,/); 
											f.setValue(value_array.filter(function(userid){
												return userid != record.get("userid");
											}).join(","))
											store.remove(record);
											
													
										}
									},
									rowdblclick:function(grid,rowIndex,e){
										
									}
								}
							}]
							

						}]
					}
				break;
				
			}
			return control;
		}
/* ================ Settings ================================================ */
	C.settings={}
	/* ---------------- main ------------------------------------------------ */
		C.settings.main=function(){
			var center_tabs = Ext.getCmp("center_tabs");
			var tabId="settings_main";
			if (!center_tabs.findById(tabId)){
								C.body.mask("Loading Settings...");
				var config={
					id:tabId,
					title:"General Settings",
					closable:true,
					layout:"border",
					header:false,
					submitFn:submitFn=function(){
						var form = Ext.getCmp("general_settings_form").form;
						if (form.isValid()) {
							//disable unchaged fileds so they are not sent
							var undo = C.disableUnchanged(form);
							
							form.submit({
								waitMsg:'Saving...',
								success:undo,
								failure:undo 
							});
							
						}else{
							Ext.MessageBox.alert('Errors', 'Please fix the errors noted.');
						}
					},
					items:[{
						/* frame:true, */
						region:"center",
						id:"general_settings_form",
						autoScroll:true,
						title:"General Settings",
						trackResetOnLoad:true,
						xtype:"form",
						reader: new Ext.data.JsonReader({
						},[
							{name:"admin_password"},
							{name:"append_profiler_output"},
							{name:"datasource_directory"},
							{name:"optimization_dot_level"},
							/* {name:"request_end_scripts"}, */
							{name:"server_start_scripts"},
							/* {name:"request_start_scripts"}, */
							{name:"standard_libs"},
							{name:"instance_id"},
							{name:"instance_purpose"},
							{name:"administrator_email"},
							{name:"enable_directory_listings"},
							{name:"commonjs_paths"},
							{name:"administrator_email_on_error"},
							{name:"strict_error_checking"},
							{name:"debug_parser_output"},
							{name:"max_running_threads"},
							{name:"smtp_host"},
							{name:"request_timeout"},
							{name:"request_handler"},
							{name:"thread_whitelist"}
						]),
						url:'?fuseaction=settings_save',
						bodyStyle:"padding:10px",
						defaults:{
							labelStyle:"font-weight:bold;width:150px;",
							xtype:"textfield",
							grow:true,
							growMin:150
						},
						labelAlign:"top",
						labelPosition:"top",
						keys:{
							key: [10,13],
							fn: submitFn
						},
						frame:true,
						items:[{
							/* xtype:"textarea", */
							fieldLabel: 'Instance Name',
							name: 'instance_id',
							style:{width:"100%"} 
						},{
							/* xtype:"textarea", */
							fieldLabel: 'Instance Purpose',
							name: 'instance_purpose',
							style:{width:"100%"} 
						},{
							/* xtype:"textarea", */
							fieldLabel: 'Administrator Email',
							name: 'administrator_email'
							
						},{
							xtype:"combo",
							fieldLabel: 'Send email to adminstrator on uncaught exceptions?',
							hiddenName: 'administrator_email_on_error',
							store:new Ext.data.SimpleStore({
								fields: ['id','text'],
								data:[[0,"No"],[1,"Yes"]]
							}),
							displayField:'text',
							valueField:'id',
							mode: 'local',
							triggerAction: 'all',
							selectOnFocus:true,
							editable:false,
							width:50,
							allowBlank:false
						},{
							xtype:"combo",
							fieldLabel: 'Enable Directory Listings?',
							hiddenName: 'enable_directory_listings',
							store:new Ext.data.SimpleStore({
								fields: ['id','text'],
								data:[[0,"No"],[1,"Yes"]]
							}),
							displayField:'text',
							valueField:'id',
							mode: 'local',
							triggerAction: 'all',
							selectOnFocus:true,
							editable:false,
							width:50,
							allowBlank:false
						},{
							/* xtype:"textarea", */
							fieldLabel: 'Max Requests',
							name: 'max_running_threads',
							grow:false,
							width:30
						},{
							fieldLabel: 'Default Request Timeout (seconds)',
							name: 'request_timeout',
							grow:false,
							width:30
						},{
							/* xtype:"textarea", */
							fieldLabel: 'Thread Management Whitelist',
							name: 'thread_whitelist',
							style:{width:"100%"} 
						},{
							xtype:"combo",
							fieldLabel: 'Optimization Level',
							name: 'optimization_dot_level',
							store:new Ext.data.SimpleStore({
								fields: ['optlevel','desc'],
								data:[-1,0,1,2,3,4,5,6,7,8,9].map(function(e,x){
									return [(x-1),(x-1)];
								}) 
							}),
							displayField:'desc',
							typeAhead: true,
							mode: 'local',
							triggerAction: 'all',
							emptyText:'Select Optimization Level',
							selectOnFocus:true,
							editable:false,
							width:50,
							allowBlank:false
						},{
							/* xtype:"textarea", */
							fieldLabel: 'Standard Libraries',
							name: 'standard_libs',
							style:{width:"100%"} 
						},{
							/* xtype:"textarea", */
							fieldLabel: 'Server Start Scripts',
							name: 'server_start_scripts',
							style:{width:"100%"}
						},{
							/* xtype:"textarea", */
							fieldLabel: 'Request Handler Script',
							name: 'request_handler',
							style:{width:"100%"}
						},{
							/* xtype:"textarea", */
							fieldLabel: 'CommonJS Search Paths',
							name: 'commonjs_paths',
							style:{width:"100%"}
						},{
							xtype:"combo",
							fieldLabel: 'Strict Syntax Warnings',
							hiddenName: 'strict_error_checking',
							store: new Ext.data.SimpleStore({
								fields: ['text','value'],
								data : [['Yes',1],['No',0]]
							}),
							displayField:'text',
							valueField:'value',
							typeAhead: true,
							mode: 'local',
							triggerAction: 'all',
							/* emptyText:'Select Optimization Level', */
							selectOnFocus:true,
							editable:false,
							width:50,
							allowBlank:false
						},{
							xtype:"combo",
							fieldLabel: 'Save Parser Debug Output?',
							hiddenName: 'debug_parser_output',
							store: new Ext.data.SimpleStore({
								fields: ['text','value'],
								data : [['Yes',1],['No',0]]
							}),
							displayField:'text',
							valueField:'value',
							typeAhead: true,
							mode: 'local',
							triggerAction: 'all',
							/* emptyText:'Select Optimization Level', */
							selectOnFocus:true,
							editable:false,
							width:50,
							allowBlank:false
						},{
							xtype:"combo",
							fieldLabel: 'Log Profiler Output',
							hiddenName: 'append_profiler_output',
							store: new Ext.data.SimpleStore({
								fields: ['text','value'],
								data: [['Yes',1],['No',0]]
							}),
							displayField:'text',
							valueField:'value',
							typeAhead: true,
							mode: 'local',
							triggerAction: 'all',
							/* emptyText:'Select Optimization Level', */
							selectOnFocus:true,
							editable:false,
							width:50,
							allowBlank:false
						},{
							/* xtype:"textarea", */
							fieldLabel: 'SMTP Mail Host',
							name: 'smtp_host',
							style:{width:"100%"}
						}],
						buttons:[{
						/* Save */
							text:"Save General",
							handler:submitFn
						}],
						listeners:{
						/* beforerender */
							beforerender:function(){
								var form =Ext.getCmp("general_settings_form"); 
								form.load({
									url:"?fuseaction=get_settings",
									waitMsg:"Loading..."
								});  
							},
						/* actioncomplete */
							actioncomplete:function(form,action){
								if (action.type == "submit"){
									C.infoMsg("Settings saved.");
								}
								
							},
						/* actionfailed */
							actionfailed:C.defaultActionFailed
						}
				
					},{
						region:"east",
						title:"Help",
						autoLoad: {url: 'views/settings_help.html',nocache:true},
						collapsible:true,
						split:true,
						width:"300",
						autoScroll:true
					}]
				}
				C.addTab(center_tabs,config);
			}  
				
			center_tabs.activate(tabId)
		}
/* ================ data sources ============================================ */
	C.ds={}
	/* ---------------- main ------------------------------------------------ */
		C.ds.main=function(){
			var center_tabs = Ext.getCmp("center_tabs");
			var tabId="ds_main";
			if (!center_tabs.findById(tabId)){
				var submitFn =function(event){
					var form = Ext.getCmp('new_ds_form').form;
					if (form.isValid()){
						form.submit();	
					}
					
				}
				
				C.body.mask("Loading Data sources...");
								
				//grid Store
					C.dSstore = C.createStore({
						proxy: new Ext.data.HttpProxy({
							url: '?fuseaction=get_data_sources'
						}),
					
						reader: new Ext.data.JsonReader({
							root: "rows",                
							id: "name"            
						},
						[
							{name:'name'},
							{name:'desc'},
							{name:'type'},
							{name:'username'}
						]),
						remoteSort: false
					});
					C.dSstore.setDefaultSort('name', 'asc');
					C.dSstore.load();
					
				
				var config ={
					id:tabId,
					closable:true,
					title:"Data Sources",
					layout:"border",
					frame:true,
					items:[{
						region:"center",
						title:"Data Sources: &nbsp;&nbsp;&nbsp;&nbsp; (double-click to edit)",
						xtype:'grid',
						region:"center",
						stripeRows:true,
						ds: C.dSstore,
						
						columns:[
							{header: "Name", width: 160, sortable: true,  dataIndex: 'name'},
							{
								header:"", 
								width:50, 
								sortable:false,  
								dataIndex:'name', 
								renderer:function(val){
									var t = new Ext.Template(
										'<span ',
											'class="link" ',
											'onclick=C.ds.edit("{name}") ',
											'target="manage_{name}" ',
										'>Edit DS</span> '
									);
									return t.apply({
										name:val
									})
								}
							},
							{
								header:"", 
								width:70, 
								sortable:false, 
								id:"db_admin_link",
								dataIndex:'name', 
								renderer:function(val){
									var t = new Ext.Template(
										"<a href='../db_manager/index.sjs?fuseaction=main&ds={name}' target='manage_{name}'> DB Manager</a>"
									);
									return t.apply({name:val})
								}
							},
							{header: "Type", width: 75, sortable: true,  dataIndex: 'type'},
							{header: "Username", width: 75, sortable: true,  dataIndex: 'username'},
							{header: "Description", width: 75, sortable: true, dataIndex: 'desc'}
							
						],
						autoExpandColumn:5,
						sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
						loadMask: true,
						buttons:[{
							text:"Create New Data Source",
							id:"create_ds_button",
							handler:function(){
								var win;
								
								if(!win){
									win = new Ext.Window({
										layout:'fit',
										width:350,
										height:210,
										plain: true,
										modal:true,
										title:"Select name and type",
										bodyStyle:"padding:10px",
										items:[{
											xtype:"form",
											id:"new_ds_form",
											bodyStyle:"padding:5px",
											frame:true,
											url:"?fuseaction=ds_create",
											
											defaults:{
												xtype:"textfield",
												width:150
											},
											keys:{
												key: [10,13],
												fn: submitFn
											},
											
											labelAlign:"right",
											items:[{
												fieldLabel: 'Name',
												name: 'name',
												allowBlank:false
											},{
												xtype:"combo",
												fieldLabel: 'Database Type',
												name: 'type',
												store: new Ext.data.SimpleStore({
													fields: ['type'],
													data: ObjectLib.getKeys(dbProperties).map(function(key){return [key]})
												}),
												displayField:'type',
												typeAhead: true,
												mode: 'local',
												triggerAction: 'all',
												selectOnFocus:true,
												editable:false,
												
												allowBlank:false
											}],
											listeners:{
												actioncomplete:function(form,action){
													C.dSstore.reload();
													C.ds.edit(form.getValues().name);
													win.close();
												},
												actionfailed:C.defaultActionFailed	
											}
										}],
						
										buttons: [{
											text:'Create Datasource',
											handler: submitFn
										},{
											text: 'Cancel',
											handler: function(){
												win.close();
											}
										}]
									});
								}
								
								win.show(Ext.get('create_ds_button'),function(){
									var name =Ext.getCmp("new_ds_form").form.findField("name"); 
									name.focus.defer(10,name);
								});
								
							}
						}],
						buttonAlign:"center",
						listeners: {
							cellclick:function(grid,rowIndex,cellIndex,e){
								var cm = grid.getColumnModel();
								var record = grid.getStore().getAt(rowIndex);
								var value = record.get(cm.getDataIndex(cellIndex))
								switch(cm.getColumnId(cellIndex)){
									case "db_admin_link":
										Ext.Ajax.request({
											url:"?fuseaction=get_auth_token",
											callback:C.cbHandler(function(result){
												if (result.success){
													window.open("../db_manager/index.sjs?fuseaction=main&ds="
														+value+"&auth_token=" + encodeURIComponent(result.token),"manage_" + value);
												} else return false
											})
										})
									break;
								}
							},
							rowdblclick:function(grid,rowIndex,e){
								var row = grid.getStore().getAt(rowIndex);
								C.ds.edit(row.id);
							}
						}
					}]
				}
				C.addTab(center_tabs,config);

			}  
				
			center_tabs.activate(tabId)
		}
	/* ---------------- edit ------------------------------------------------ */
		C.ds.edit=function(name){
			var center_tabs = Ext.getCmp("center_tabs");
			var tabId="ds_edit_" + name;
			if (!center_tabs.findById(tabId)){
				var submitFn=function(){
					var form = Ext.getCmp("ds_form" + name).form;
					form.findField("url").enable()
					if (form.isValid()) {
						form.submit({
							waitMsg:'Saving...',
							callback:function(){
								updateUrl();
								C.dSstore.reload();
							}
						});
					}else{
						Ext.MessageBox.alert('Errors', 'Please fix the errors noted.');
					}
				}
				
				var updateUrl = function(){
					var form = config.ds.getForm();
					var values = form.getValues();
					var dsInfo = dbProperties[values.type];
					
					if (dsInfo && dsInfo.file_url){
						form.findField("location").show()
						form.findField("location").getEl().up('.x-form-item').setDisplayed(true)
					} else {
						form.findField("location").hide()
						form.findField("location").setValue("network")
						form.findField("location").getEl().up('.x-form-item').setDisplayed(false)
					}
					
					if (form.findField("location").getValue() == "file"){
						form.findField("server").hide()
						form.findField("server").getEl().up('.x-form-item').setDisplayed(false);
						form.findField("port").hide()
						form.findField("port").getEl().up('.x-form-item').setDisplayed(false);
						form.findField("db").hide()
						form.findField("db").getEl().up('.x-form-item').setDisplayed(false);
						form.findField("file").show()
						form.findField("file").getEl().up('.x-form-item').setDisplayed(true);
					} else {
						form.findField("server").show()
						form.findField("server").getEl().up('.x-form-item').setDisplayed(true);
						form.findField("port").show()
						form.findField("port").getEl().up('.x-form-item').setDisplayed(true);
						form.findField("db").show()
						form.findField("db").getEl().up('.x-form-item').setDisplayed(true);
						form.findField("file").hide()
						form.findField("file").getEl().up('.x-form-item').setDisplayed(false);
					}
					
					if (form.findField("type").getValue() == "other"){
						form.findField("server").hide()
						form.findField("server").getEl().up('.x-form-item').setDisplayed(false);
						form.findField("port").hide()
						form.findField("port").getEl().up('.x-form-item').setDisplayed(false);
						form.findField("db").hide()
						form.findField("db").getEl().up('.x-form-item').setDisplayed(false);
						form.findField("file").hide()
						form.findField("file").getEl().up('.x-form-item').setDisplayed(false);
					} 
					
					if (dsInfo && dsInfo.driver.length){
						form.findField("url").setDisabled(true);
						var location = form.findField("location").getValue();
						if (location == "file"){
							form.findField("url").setValue(
								new Ext.Template(dsInfo.file_url).apply(values)
							);
						} else {
							form.findField("url").setValue(
								new Ext.Template(dsInfo.url).apply(values)
							);	
						}
						
						ObjectLib.forEach(dsInfo,function(v,k){
							var f =form.findField(k) 
							if (f && !f.getValue()){
								f.setValue(v)	
							}
						})
						/* form.findField("driver").setValue(
							dsInfo.driver
						); */
					} else {
						form.findField("url").setDisabled(false)
					}
					
					
					
				}
				
				var config ={
					id:tabId,
					title:"Datasource  " + name,
					closable:true,
					layout:"border",
					/* functions */
						ds:{
							getFormPanel:function(){
								return Ext.getCmp("ds_form" + name);
							},
							getForm:function(){
								return this.getFormPanel().getForm();
							}
							
						},
					items:[{
					/* center */	
						region:"center",
						frame:false, 
						bodyStyle:"padding:3px;", 
						title:"Editing Datasource '" + name + "'",  
						header:true,
						layout:"fit",
						items:[{
							id:"ds_form" + name,
							trackResetOnLoad:true,
							xtype:"form",
							url:'?fuseaction=ds_save&name=' + name,
							bodyStyle:"padding:5px",
							/* layout:"fit", */
							defaults:{
								xtype:"textfield",
								style:{
									width:150
								}, 
								grow:true,
								growMin:150,
								listeners:{
									change:updateUrl
								}
							},
							labelAlign:"right",
							keys:{
								key: [10,13],
								fn: submitFn
							},
							items:[{
								xtype:"fieldset",
								title:"Copy/Rename",
								collapsible: true,
								collapsed:true,
								autoHeight:true,
								width: 300,
								defaultType: 'textfield',
								bodyStyle:"margin-bottom:10px;",
								items:[{
									fieldLabel: 'Copy to',
									name: 'copy_name',
									allowBlank:true
								},{	
									fieldLabel: 'Rename to',
									name: 'new_name',
									allowBlank:true
								}]	
						
							},{
								fieldLabel: 'Description',
								name: 'desc',
								allowBlank:true
							},{
								xtype:"combo",
								fieldLabel: 'Database Type',
								name: 'type',
								store: new Ext.data.SimpleStore({
									fields: ['type'],
									data: ObjectLib.getKeys(dbProperties).map(function(key){return [key]})
								}),
								displayField:'type',
								typeAhead: true,
								mode: 'local',
								triggerAction: 'all',
								selectOnFocus:true,
								editable:false,
								
								allowBlank:false,
								listeners:{
									select:function(combo,record,index){
										updateUrl();
									}
								}
							},{
								xtype:"combo",
								fieldLabel: 'Use case-sensitive names?',
								hiddenName: 'case_sensitive',
								store: new Ext.data.SimpleStore({
									fields: ['key','label'],
									data: [
										[0,"No"],
										[1,"Yes"]
									]
								}),
								displayField:'label',
								valueField:'key',
								typeAhead: true,
								mode: 'local',
								triggerAction: 'all',
								selectOnFocus:true,
								editable:false,
								allowBlank:false
							},{
								fieldLabel: 'Driver',
								name: 'driver',
								allowBlank:true
							},{
								xtype:"combo",
								fieldLabel: 'Location',
								name: 'location',
								store: new Ext.data.SimpleStore({
									fields: ['type'],
									data: [["file"],["network"]]
								}),
								displayField:'type',
								typeAhead: true,
								mode: 'local',
								triggerAction: 'all',
								selectOnFocus:true,
								editable:false,
								
								allowBlank:false,
								listeners:{
									select:function(combo,record,index){
										updateUrl();
									}
								}
							},{
								fieldLabel: 'Server',
								name: 'server',
								allowBlank:true
							},{
								fieldLabel: 'Port',
								name: 'port',
								allowBlank:true
							},{
								fieldLabel: 'Database',
								name: 'db',
								allowBlank:true
							},{
								fieldLabel: 'File',
								name: 'file',
								allowBlank:true
							},{
								fieldLabel: 'Username',
								name: 'username',
								allowBlank:true
							},{
								fieldLabel: 'Password',
								name: 'password',
								inputType:"password",
								allowBlank:true
							},{
								fieldLabel: 'URL',
								name: 'url',
								style:{
									width:"100%"
								},
								allowBlank:true
							}],
							buttons:[{
							/* Save */
								text:"Save",
								handler:submitFn
							},{
							/* delete */
								text:"Delete This Datasource",
								handler:function(){
									Ext.MessageBox.confirm("Warning","Delete this datsource '" + name +"'?",function(btn){
										if (btn == 'yes') {
											C.body.mask("Deleting datasource...");
											Ext.Ajax.request({
												url:'?fuseaction=ds_delete&name=' + name,
												callback:function(options,success,response){
													C.infoMsg("Datasource '" + name + "' deleted.");
													if (C.dSstore) C.dSstore.reload();
													Ext.getCmp("center_tabs").remove(Ext.getCmp(tabId));
													C.body.unmask();
												}
												
											})
											
										}
									})
								}
							}],
							listeners:{
								beforerender:function(){
									
									Ext.Ajax.request({
										url:"?fuseaction=get_ds&name=" + name,
										waitMsg:"Loading...",
										callback:C.cbHandler(function(result){
											if (result.success){
												if (!result.data.location){
													result.data.location="network";
												}
												config.ds.getForm().setValues(result.data);
												updateUrl();
											}
											return result.success;
										})
									})
								},
							/* actioncomplete */
								actioncomplete:function(form,action){
									if (action.type == "submit"){
										//C.infoMsg("Datasource " + name + " saved.");
										if (C.dSstore) C.dSstore.reload();
										if (action.result.name && name != action.result.name){
											C.ds.edit(action.result.name);
											Ext.getCmp("center_tabs").remove(Ext.getCmp(tabId));
										}
										if (action.result.copied){
											C.ds.edit(form.getValues().copy_name);
											form.setValues({copy_name:""});
											
										}
										if (action.result.message){
											C.infoMsg(action.result.message);	
										}
										
									}
									
								},
							/* actionfailed */
								actionfailed:C.defaultActionFailed
							}
						
						}]
					}]
				}
				
				C.addTab(center_tabs,config);
					var formPanel =Ext.getCmp("ds_form" + name); 
			
				
			}  
				
			center_tabs.activate(tabId)
		}
/* ================ log_general ============================================= */
	C.log_general={}
	/* ---------------- main ------------------------------------------------ */
		C.log_general.main=function(){
			var center_tabs = Ext.getCmp("center_tabs");
			var tabId="tab_log_general";
			if (!center_tabs.findById(tabId)){
				var config ={
					id:tabId,
					title:"General Log",
					closable:true,
					layout:"border",
					/* functions */
						click_log_id:function(log_id){
							var form = Ext.getCmp("general_log_search_form").form;
							form.findField("log_id").setValue(log_id);
							this.search();
						},
						click_request_id:function(request_id){
							var form = Ext.getCmp("general_log_search_form").form;
							form.findField("request_id").setValue(request_id);
							this.search();
						},
						click_instance_id:function(instance_id){
							var form = Ext.getCmp("general_log_search_form").form;
							form.findField("instance_id").setValue(instance_id);
							this.search();
						},
						click_hostname:function(hostname){
							var form = Ext.getCmp("general_log_search_form").form;
							form.findField("hostname").setValue(hostname);
							this.search();
						},
						click_app_name:function(app_name){
							var form = Ext.getCmp("general_log_search_form").form;
							form.findField("app_name").setValue(app_name);
							this.search();
						},
						click_purpose:function(purpose){
							var form = Ext.getCmp("general_log_search_form").form;
							form.findField("purpose").setValue(purpose);
							this.search();
						},
						click_type:function(type){
							var form = Ext.getCmp("general_log_search_form").form;
							form.findField("type").setValue(type);
							this.search();
						},
						search:search=function(){
							var formPanel = Ext.getCmp("general_log_search_form");
							var form = formPanel.form;
							var store = Ext.getCmp("general_log_grid").getStore();
							var pager = Ext.getCmp("general_log_pager");
							store.baseParams = form.getValues();
							pager.onClick("refresh")
							formPanel.collapse();
						},
					items:[{
					/* west - search pane */
						region:"west",
						width:200,
						xtype:"form",
						id:"general_log_search_form",
						frame:true,
						collapsible:true,
						title:"Search Log",
						/* labelWidth:100, */
						defaults:{
							xtype:"textfield",
							width:175
						},
						labelAlign:"top",
						items:[{
							fieldLabel:"Start Date",
							xtype:"datefield",
							format:"m/d/Y",
							name:"event_ts_start",
							value:new Date().format("m/d/Y")
							
						},{
							fieldLabel:"End Date",
							xtype:"datefield",
							format:"m/d/Y",
							name:"event_ts_end"
						},{
							xtype:"combo",
							fieldLabel: 'Type',
							hiddenName: 'type',
							store:new Ext.data.Store({
								storeId:"log_type_store",
								proxy: new Ext.data.HttpProxy({
									url: '?fuseaction=get_general_log_types'
								}),
							
								reader: new Ext.data.JsonReader({
									id: "type"            
								},
								[
									{name:'type'}
								])
							}),
							displayField:'type',
							typeAhead: false,
							mode: 'remote', /* change this to local if using simpleStore*/
							triggerAction: 'all',
							emptyText:'',
							selectOnFocus:true,
							editable:false,
							allowBlank:false
						},{	
							fieldLabel:"Minimum Log ID",
							name:"log_id"
						},{	
							fieldLabel:"Only Request ID",
							name:"request_id"
						},{
							fieldLabel:"Only Instance",
							name:"instance_id"
						},{
							fieldLabel:"Only host",
							name:"hostname"
						},{
							fieldLabel:"App Name",
							name:"app_name"
						},{	
							fieldLabel:"Server Purpose",
							name:"purpose"
						},{	
							fieldLabel:"Label contains",
							name:"label_contains"
						},{	
							fieldLabel:"Label DOES NOT contain",
							name:"label_not_contains"
						}],
						buttonAlign:"center",
						buttons:[{
							text:"Search",
							handler:search
						},{
							text:"Clear",
							handler:function(){
								var form = Ext.getCmp("general_log_search_form").form;
								var store = Ext.getCmp("general_log_grid").getStore();
								var pager = Ext.getCmp("general_log_pager");
								form.reset()
								store.baseParams = {}
								pager.onClick("refresh")
							}
						}]
					},{
					/* center - search grid*/	
						region:"center",
						frame:false, 
						header:true,
						title:"General Log",
						xtype:"grid",
						id:"general_log_grid",
						stripeRows:true,
						ds:new Ext.data.Store({
							storeId:"general_log_store",
							proxy: new Ext.data.HttpProxy({
								url: '?fuseaction=search_general_log'
							}),
						
							reader: new Ext.data.JsonReader({
								id: "log_id" ,
								root:"data",
								totalProperty:"totalRows"
							},
							[
								{name:'log_id'},
								{name:"instance_id"},
								{name:"hostname"},
								{name:"request_id"},
								{name:"app_name"},
								{name:"purpose"},
								{name:"type"},
								{name:"label"},
								{name:"detail"},
								{name:"event_ts"},
								{name:"request_elapsed"},
								{name:"log_elapsed"}
							]),
							remoteSort: true,
							sortInfo:{
								field:'event_ts',
								direction:'DESC'
							}
						}),
						columns:[{
							header:"Label",
							width:150,
							sortable:true,
							dataIndex:"label"
						},{
							header:"",
							width:50,
							sortable:false,
							renderer:function(val){
								var t = new Ext.Template(
									'<div ',
										'class="link"',
										'onclick="window.open(\'?fuseaction=get_general_log_detail&log_id={val}\')"',
									'>detail</div>'
								)
								return t.apply({val:val})
							},
							dataIndex:"log_id"
						},{
							header:"event_ts",
							width:90,
							sortable:true,
							dataIndex:"event_ts",
							renderer:Ext.util.Format.dateRenderer("m/d/y H:i:s")
						},{
							header:"App Name",
							width:75,
							sortable:true,
							dataIndex:"app_name",
							renderer:function(val){
								var t = new Ext.Template(
									'<div ',
										'class="link" ',
										'onclick=Ext.getCmp("{tabId}").click_app_name("{val}")',
									'>{val}</div>'
								);
								return t.apply({
									val:val,
									tabId:tabId
								})
							}
							
						},{
							header:"Purpose",
							width:50,
							sortable:true,
							dataIndex:"purpose",
							renderer:function(val){
								var t = new Ext.Template(
									'<div ',
										'class="link" ',
										'onclick=Ext.getCmp("{tabId}").click_purpose("{val}")',
									'>{val}</div>'
								);
								return t.apply({
									val:val,
									tabId:tabId
								})
							}
						},{
							header:"Type",
							width:50,
							sortable:true,
							dataIndex:"type",
							renderer:function(val){
								var t = new Ext.Template(
									'<div ',
										'class="link" ',
										'onclick=Ext.getCmp("{tabId}").click_type("{val}")',
									'>{val}</div>'
								);
								return t.apply({
									val:val,
									tabId:tabId
								})
							}
						},{
							header: "Log ID", 
							width: 75, 
							sortable: true,  
							dataIndex: 'log_id',
							renderer:function(val){
								var t = new Ext.Template(
									'<div ',
										'class="link" ',
										'onclick=Ext.getCmp("{tabId}").click_log_id("{val}")',
									'>{val}</div>'
								);
								return t.apply({
									val:val,
									tabId:tabId
								})
							}
						},{
							header:"Host",
							width:75,
							sortable:true,
							dataIndex:"hostname",
							renderer:function(val){
								var t = new Ext.Template(
									'<div ',
										'class="link" ',
										'onclick=Ext.getCmp("{tabId}").click_hostname("{val}")',
									'>{val}</div>'
								);
								return t.apply({
									val:val,
									tabId:tabId
								})
							}
						},{
							header:"Instance",
							width:75,
							sortable:true,
							dataIndex:"instance_id",
							renderer:function(val){
								var t = new Ext.Template(
									'<div ',
										'class="link" ',
										'onclick=Ext.getCmp("{tabId}").click_instance_id("{val}")',
									'>{val}</div>'
								);
								return t.apply({
									val:val,
									tabId:tabId
								})
							}
						},{
							header:"Request ID",
							width:75,
							sortable:true,
							dataIndex:"request_id",
							renderer:function(val){
								var t = new Ext.Template(
									'<div ',
										'class="link" ',
										'onclick=Ext.getCmp("{tabId}").click_request_id("{val}")',
									'>{val}</div>'
								);
								return t.apply({
									val:val,
									tabId:tabId
								})
							}
						},{
							header:"Request (ms)",
							width:50,
							sortable:true,
							dataIndex:"request_elapsed"
						},{
							header:"Log (ms)",
							width:50,
							sortable:true,
							dataIndex:"log_elapsed"
						}],
						autoExpandColumn:0,
						sm: new Ext.grid.CellSelectionModel(),
						//new Ext.grid.RowSelectionModel({singleSelect:true}),
						loadMask: true,
						bbar:new Ext.PagingToolbar({
							pageSize: 25,
							id:"general_log_pager",
							store: Ext.StoreMgr.get("general_log_store"),
							displayInfo: true,
							displayMsg: 'Displaying rows {0} - {1} of {2}',
							emptyMsg: "No rows to display"
						}),
						listeners: {
							beforerender:function(panel){
								//window.setTimeout(function(){config.search();},1000);
								var store =Ext.StoreMgr.get("general_log_store");
								store.baseParams={
									event_ts_start:new Date().format("m/d/Y")	
								}
								store.load()
							},
							rowclick:function(grid,rowIndex,e){
								return false
								
							},
							rowdblclick:function(grid,rowIndex,e){
								
							}
						}
					}]
				}
				
				C.addTab(center_tabs,config);
					var formPanel =Ext.getCmp("ds_form" + name); 
			
				
			}  
				
			center_tabs.activate(tabId)
		}
		
/* ================ threads ================================================= */
	C.threads={}
	/* ---------------- main ------------------------------------------------ */
		C.threads.main=function(){
			var center_tabs = Ext.getCmp("center_tabs");
			var tabId="threads_main";
			if (!center_tabs.findById(tabId)){
				
				var config={
					id:tabId,
					title:"Running Requests",
					closable:true,
					layout:"border",
					kill:function(thread_id,forceKill){
						var type = forceKill?"kill":"stop";
						var msg="Stop thread ID '"+ thread_id +"'?";
						if (type=="kill"){
							msg="Kill thread ID '"+ thread_id +"'?"
							+ "<br>This could cause memory leaks and/or corruption";
						}
						Ext.MessageBox.confirm("Warning",msg,function(btn){
							if (btn == 'yes') {
								Ext.Ajax.request({
									url:"?fuseaction=kill_thread&thread_id=" + thread_id + "&type=" + type,
									callback:function(options,success,response){
										C.infoMsg("Thread killed")
										Ext.StoreMgr.get("threads").reload();
									}
								})
							}
						})
						
					},
					explore:function(thread_id){
						var win = new Ext.Window({
							width:800,
							height:600,
							maximizable:true,
							title:"Exploring Thread " + thread_id,
							layout:"border",
							defaults:{
								bodyStyle:"padding:10px;"
							},
							items:[{
								region:"north",
								height:180,
								xtype:"form",
								labelAlign:"top",
								items:[{
									xtype:"textarea",
									id:"code" + thread_id,
									value:"Myna.print($profiler.getSummaryHtml())\nMyna.print(Myna.dump($req))",
									width:775,
									height:100,
									fieldLabel:"Code to execute against this thread's scope"
								}],
								bbar:[{
									text:"Execute Code",
									handler:function(){
										Ext.Ajax.request({
											url:"?fuseaction=exec_in_thread",
											waitMsg:"Executing code...",
											params:{
												thread_id:thread_id,
												code:Ext.getCmp("code" + thread_id).getValue()
											},
											callback:C.cbHandler(function(result){
												if (result.success){
													var output =  Ext.getCmp("result" + thread_id).getEl();
													
													output.dom.innerHTML=result.output
												} else return false
											})
										})
									}
								}]
							},{
								region:"center",
								autoScroll:true,
								items:[{
									id:"result" + thread_id
								}]
							}],
							buttonAlign:"center",
							buttons:[{
								text:"Close",
								handler:function(){
									win.close()	
								}
							}]
						})
						
						win.show()
					},
					items:[{
						xtype:"grid",
						region:"center",
						stripeRows:true,
						ds:C.createStore({
							storeId:"threads",
							proxy: new Ext.data.HttpProxy({
								url: '?fuseaction=get_running_requests'
							}),
						
							reader: new Ext.data.JsonReader({
								id: "thread_id"            
							},
							[
								{name:'thread_id'},
								{name:'url'},
								{name:'current_task'},
								{name:'started'},
								{name:'runtime'},
								{name:'current_runtime'},
								{name:'is_white_listed'}
							]),
							remoteSort: false
						}),
						columns:[{
							header: "Thread ID", 
							width: 75, 
							sortable: false,  
							dataIndex: 'thread_id'
						},{
							header: "Script", 
							width: 200, 
							sortable: true,  dataIndex: 'url'
						},{
							header: "Current Task", 
							width: 200, 
							sortable: true,  
							dataIndex: 'current_task'
						},{
							header: "", 
							width: 50, 
							sortable: false,
							renderer:function(value){
								var t = new Ext.Template([
								'<span class="link" onclick="Ext.getCmp({tabId}).explore({value})">',
								'explore',
								'</span>'
								]);
								return t.apply({
									tabId:"'" + tabId +"'",
									value:value
								})
							},
							dataIndex: 'thread_id'
						},{
							header: "Whitelisted?", 
							width: 75, 
							sortable: true,  
							dataIndex: 'is_white_listed'
							
						},{
							header: "Started", 
							width: 150, 
							sortable: true,  
							renderer:Ext.util.Format.dateRenderer("m/d/Y H:i:s"),
							dataIndex: 'started'
						},{
							header: "Current", 
							width: 50, 
							renderer:function(time){
								return time +"ms";
							},
							sortable: true, 
							dataIndex: 'current_runtime'
						},{
							header: "Total", 
							width: 50, 
							renderer:function(time){
								return time +"ms";
							},
							sortable: true, 
							dataIndex: 'runtime'
						},{
							header: "", 
							width: 50, 
							sortable: false,
							renderer:function(value){
								var t = new Ext.Template([
								'<span class="link" onclick="Ext.getCmp({tabId}).kill({value})">',
								'stop',
								'</span>'
								]);
								return t.apply({
									tabId:"'" + tabId +"'",
									value:value
								})
							},
							dataIndex: 'thread_id'
						},{
							header: "", 
							width: 50, 
							sortable: false,
							renderer:function(value){
								var t = new Ext.Template([
								'<span class="link" onclick="Ext.getCmp({tabId}).kill({value},true)">',
								'kill',
								'</span>'
								]);
								return t.apply({
									tabId:"'" + tabId +"'",
									value:value
								})
							},
							dataIndex: 'thread_id'
						}],
						autoExpandColumn:2,
						sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
						loadMask: false,	
						bbar:[{
							text:"Refresh",
							handler:function(){
								Ext.StoreMgr.get("threads").reload();	
							}
						}]
						
					},{
						region:"east",
						title:"Help",
						autoLoad: {url: 'views/running_requests_help.html',nocache:true},
						collapsible:true,
						width:"300",
						autoScroll:true
					}],
					listeners:{
						activate:function(panel){
							if (panel.timer) return;
							panel.timer = window.setInterval(function(){
								Ext.StoreMgr.get("threads").reload();
							},2000)
							Ext.StoreMgr.get("threads").reload();	
						},
						deactivate:function(panel){
							window.clearInterval(panel.timer);
							panel.timer=null;
						},
						destroy:function(panel){
							window.clearInterval(panel.timer);
							panel.timer=null;
						}
					}
				}
				C.addTab(center_tabs,config);
			}  
				
			center_tabs.activate(tabId)
		}
/* ================ upgrade ================================================= */
	C.upgrade={}
	/* ---------------- main ------------------------------------------------ */
		C.upgrade.main=function(){
			var center_tabs = Ext.getCmp("center_tabs");
			var tabId="upgrade_main";
			if (!center_tabs.findById(tabId)){
				var config={
					id:tabId,
					title:"Upgrade Myna",
					closable:true,
					layout:"border",
					header:false,
					items:[{
						/* frame:true, */
						region:"center",
						layout:"border",
						items:[{
							id:"upgrade_form",
							region:"center",
							/* height:150, */
							autoScroll:true,
							title:"Upgrade Myna",
							trackResetOnLoad:true,
							xtype:"form",
							fileUpload:true,
							url:'?fuseaction=upgrade_start',
							bodyStyle:"padding:10px,margin:10px;",
								labelWidth:150,
							defaults:{
								xtype:"textfield"
							
							},
							labelAlign:"top",
							labelPosition:"top",
							
							items:[{
								xtype:"textfield",
								fieldLabel: 'Upload myna.war',
								name: 'warfile',
								/* grow:true, */
								style:{width:"100%"},
								inputType: 'file',
								width:300,
								allowBlank:true
							}],
							buttons:[{
							/* Save */
								text:"Start Upgrade",
								handler:function(){
									var form = Ext.getCmp("upgrade_form").form;
									if (form.isValid()) {
										form.submit();
										
										var checkProgress = function(){
											var my = arguments.callee;
											if (!my.lastEntry) my.lastEntry=-1;
											
											Ext.Ajax.request({
												url:"?fuseaction=upgrade_progress&last_entry=" +checkProgress.lastEntry,
												callback:function(options,success,response){
													var obj;
													try{
														obj = response.responseText.parseJson();
													} catch(e){
														return;
													}
													/* expected format: 
														obj ={
															total_message:string,
															total_percentage:float between 0 and 1,
															current_message:string,
															current_percentage:float between 0 and 1,
															isComplete: true if upgrade is complete
														}
													*/
													if (obj.total_message){ //simple validity check
														var totalBar = Ext.getCmp("upgrade_total_progress");
														var currentBar = Ext.getCmp("upgrade_current_progress");
														
														//var logPane = Ext.getCmp("upgrade_total_progress");
														
														totalBar.updateProgress(obj.total_percentage,obj.total_message);
														currentBar.updateProgress(obj.current_percentage,obj.current_message);
														
													
														checkProgress.lastEntry = obj.start_id;
														if (!obj.isComplete){
															//check again in 1 second
															checkProgress.defer(1000);
														} else {
															totalBar.updateProgress(1,"All Tasks Complete");
															currentBar.updateProgress(1," ");
															//TODO: complete upgrade
														}
													} else {
														C.showAjaxError(response.responseText);
													}
												}
											})
										}
										//first check in 1 second
										checkProgress.defer(1000);
									}else{
										Ext.MessageBox.alert('Errors', 'Please fix the errors noted.');
									}
								}
							}],
							listeners:{
							/* actioncomplete */
								actioncomplete:function(form,action){
									if (action.type == "submit"){
										var totalBar = Ext.getCmp("upgrade_total_progress");
										var currentBar = Ext.getCmp("upgrade_current_progress");
										totalBar.updateProgress(1,"All Tasks Complete");
										currentBar.updateProgress(1," ");
														
										Ext.MessageBox.alert('Upgrade Complete', 
										[
											'The upgrade is complete. ',
											'Overwritten files are backed up to ' + action.result.backupDir,
											'',
											'Please restart your application server to ensure changes take effect.'
										].join("<br>"));
									}
									
								},
							/* actionfailed */
								actionfailed:C.defaultActionFailed
							}
						},{
							region:"south",
							height:40,
							layout:"form",
							items:[{
								id:"upgrade_total_progress",
								xtype:'progress'
							},{
								id:"upgrade_current_progress",
								xtype:'progress'
							}]
						}]
					},{
						region:"east",
						title:"Help",
						autoLoad: {url: 'views/upgrade_help.html',nocache:true},
						collapsible:true,
						width:"400",
						autoScroll:true
					}]
				}
				C.addTab(center_tabs,config);
			}  
				
			center_tabs.activate(tabId)
		}
/* ================ tasks =================================================== */
	C.tasks={}
	/* ---------------- main ------------------------------------------------ */
		C.tasks.main=function(){
			var center_tabs = Ext.getCmp("center_tabs");
			var tabId="tasks_main";
			var schedulePanels={}
			if (!center_tabs.findById(tabId)){
				var config ={
					id:tabId,
					closable:true,
					title:"Scheduled Tasks",
					layout:"border",
					/* local functions */
						task:{
							hideForm:function(){
								var formPanel = this.getFormPanel();
								this.getStore().reload();
								formPanel.form.reset();
								formPanel.hide();
								formPanel.ownerCt.doLayout();	
							},
							showForm:function(){
								var formPanel = this.getFormPanel();
								this.getStore().reload();
								formPanel.show();
								var cbArray = formPanel.findByType("checkbox")
								cbArray.forEach(function(cb){
									cb.setValue(false)
								})
								
								formPanel.ownerCt.doLayout();
							},
							getStore:function(){
								return Ext.StoreMgr.get("tasks");
							},
							getFormPanel:function(){
								return Ext.getCmp("task_form");
							},
							getForm:function(){
								return this.getFormPanel().form;
							}
						},
					items:[{
					/* center - grid and form */
						region:"center",
						layout:"border",
						frame:true,
						items:[{
						/* center - task Grid */
							region:"center",
							layout:"fit",
							title:"Click to edit",
							xtype:"grid",
							stripeRows:true,
							ds: C.createStore({
								storeId:"tasks",
								proxy: new Ext.data.HttpProxy({
									url: '?fuseaction=get_all_cron_jobs'
								}),
							
								reader: new Ext.data.JsonReader({
									id: 'name'
								}, [
									"daily_repeat",
									"daily_time",
									"description",
									"end_date",
									"hourly_minutes",
									"hourly_repeat",
									"is_active",
									"monthly_by_date_day",
									"monthly_by_date_repeat",
									"monthly_by_date_time",
									"monthly_by_weekday_day",
									"monthly_by_weekday_daycount",
									"monthly_by_weekday_repeat",
									"monthly_by_weekday_time",
									"name",
									"script",
									"scale",
									"interval",
									"start_date",
									"start_date_date",
									"start_date_time",
									"type",
									"weekly_days",
									"weekly_repeat",
									"weekly_time",
									"yearly_date",
									"yearly_repeat",
									"yearly_time"

								]),
								remoteSort: false
							}),
							columns:[{
								header: "Name",
								dataIndex: 'name',
								width:250,
								hidden:false,
								sortable:true
							},{
								header: "Description",
								dataIndex: 'description',
								width:300,
								sortable:true
							},{
								header: "Active?",
								dataIndex: 'is_active',
								width:100,
								renderer:function(value){
									return value=="1"?"Yes":"No";
								},
								sortable:true
							
							}],
							autoExpandColumn:1,
							sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
							loadMask: true,
							bbar:[
								{
									xtype:"tbspacer"
								},
								{
									xtype:"button",
									text:"Create new task",
									handler:function(){
										config.task.getForm().reset()
										/* setValues({
											name:"New Task",
											description:'',
											'is_active':1,
											'start_date_date':new Date().format("m/d/Y"),
											'start_date_time':"00:00:00",
											'interval':5,
											'scale':'hours',
											'script':''
										}); */
										config.task.showForm()
									}
								}
							],
							listeners: {
								beforerender:function(){
									Ext.StoreMgr.get("tasks").load();
								}, 
								
								rowclick:function(grid,rowIndex,e){
									var row = grid.getStore().getAt(rowIndex);
									var form = config.task.getForm();
										config.task.showForm();
										form.setValues(row.data)
										var cbArray = config.task.getFormPanel().findByType("checkbox")
										cbArray.forEach(function(cb){
											cb.setValue(!!(row.data.weekly_days.indexOf(cb.inputValue)+1))
										})
										//form.loadRecord(row);
										
								}
							}
						},{
						/* east - Component Form */
							region:"east",
							id:"task_form",
							xtype:"form",
							autoScroll:true,
							width:320,
							//hidden:true,
							labelAlign:"top",
							//bodyStyle:"padding:3px",
							frame:true,
							title:"Edit Task",
							//trackResetOnLoad:true,
							/* reader:new Ext.data.JsonReader({
							},[
								{name: 'name'},
								{name: 'description'},
								{name: 'is_active'},
								{name: 'start_date_date'},
								{name: 'start_date_time'},
								{name: 'interval'},
								{name: 'scale'},
								{name: 'script'}
							]), */
							defaults:{
								xtype:"textfield",
								width:100,
								defaults:{
									xtype:"textfield",
									width:100
								}
							},
							items:[{
							/* name */
								fieldLabel:"Name",
								maxLength:30,
								name:"name",
								value:"New Task",
								width:290
							},{
							/* desciption */
								xtype:"textarea",
								fieldLabel:"Description",
								maxLength:255,
								name:"description",
								value:"",
								grow:true,
								width:290,
								height:79
							},{
							/* script */
								fieldLabel:"URL",
								name:"script",
								value:"",
								width:290
							},{
								xtype:"panel",
								width:290,
								layout:"column",
								layoutConfig:{
									columns:2
								},
								defaults:{
									columnWidth:.5,
									width:130,
									layout:"form",
									defaults:{
										width:125,
										layout:"form",
										defaults:{
											xtype:"textfield",
											width:100
										}
									}
								},
								items:[{
									items:[{
									/* active */
										fieldLabel:"Active?",
										hiddenName:"is_active",
										name:"is_active",
										xtype:"combo",
											store: new Ext.data.SimpleStore({
											fields: ['label','value'],
											data:[
												["Yes",1],
												["No",0]
											] 
										}),
										displayField:'label',
										valueField:'value',
										value:1,
										mode: 'local',
										triggerAction: 'all',
										forceSelection:true
									},{
									/* start_date_date */
										fieldLabel:"Start Date",
										name:"start_date_date",
										xtype:"datefield",
										format:"m/d/Y",
										value:new Date().format("m/d/Y")
									},{
									/* start_date_time */
										fieldLabel:"Start Time",
										name:"start_date_time",
										xtype:"textfield",
										value:new Date().format("H:i:s")
									},{
									/* end_date_date */
										fieldLabel:"End Date",
										name:"end_date_date",
										xtype:"datefield",
										format:"m/d/Y"
									},{
									/* end_date_time */
										fieldLabel:"End Time",
										name:"end_date_time",
										xtype:"textfield"//,format:"H:i:s"
									}]
								},{
									items:[{
									/* type */
										hideLabel:false,
										fieldLabel:"Schedule Type",
										name:"type",
										xtype:"combo",
										store: new Ext.data.SimpleStore({
											fields: ['type'],
											data:[
												["Simple"],
												["Hourly"],
												["Daily"],
												["Weekly"],
												["MonthlyByDate"],
												["MonthlyByWeekday"],
												["Yearly"]
											] 
										}),
										displayField:'type',
										mode: 'local',
										triggerAction: 'all',
										forceSelection:true,
										editable:false,
										value:"Simple",
										listeners:{
											render:r=function(combo){
												[
													"Simple",
													"Hourly",
													"Daily",
													"Weekly",
													"MonthlyByDate",
													"MonthlyByWeekday",
													"Yearly"
												].forEach(function(type){
													var panel = Ext.getCmp("schedule" + type)
													if (combo.getValue() == type){
														panel.show()
													} else {
														panel.hide()
													}
												})
											},
											change:r,
											select:r
										},
										setValue:function(val){
											Ext.form.ComboBox.prototype.setValue.call(this,val)
											r(this)	
										}, 
									},{
									//Simple Panel
										xtype:"fieldset",
										id:"scheduleSimple",
										height:120,
										width:125,
										title:"Simple Schedule",
										layout:"form",
										items:[{
										/* interval */
											fieldLabel:"Run Every",
											name:"interval",
											value:1
										},{
										/* scale */
											hideLabel:true,
											name:"scale",
											xtype:"combo",
											width:80,
											store: new Ext.data.SimpleStore({
												fields: ['scale'],
												data:[
													["milliseconds"],
													["seconds"],
													["minutes"],
													["hours"],
													["days"],
													["weeks"]
												] 
											}),
											value:"hours",
											displayField:'scale',
											mode: 'local',
											editable:false,
											triggerAction: 'all',
											forceSelection:true
										}]
									},{
									//Hourly Panel
										xtype:"fieldset",
										id:"scheduleHourly",
										height:160,
										width:125,
										title:"Hourly Schedule",
										items:[{
											xtype:"panel",
											html:" Repeat every "
										},{	
										/* hourly_repeat */
											hideLabel:true,
											name:"hourly_repeat",
											value:1
										},{
											xtype:"panel",
											html:" hours at "
										},{
										/* hourly_minutes */
											hideLabel:true,
											name:"hourly_minutes",
											value:0
										},{
											xtype:"panel",
											html:" minutes after the hour "
										}]
									},{
									//Daily Panel
										xtype:"fieldset",
										id:"scheduleDaily",
										height:150,
										width:125,
										title:"Daily Schedule",
										items:[{
											xtype:"panel",
											html:" Repeat every "
										},{	

										/* daily_repeat */
											hideLabel:true,
											name:"daily_repeat",
											value:1
										},{
											xtype:"panel",
											html:" days at  "
										},{	
										/* daily_time */
											hideLabel:true,
											name:"daily_time",
											value:new Date().format("H:i")
										}]	
									},{
									//Weekly Panel
										xtype:"fieldset",
										id:"scheduleWeekly",
										height:190,
										width:125,
										title:"Weekly Schedule",
										items:[{
										
											xtype:"panel",
											html:" Repeat every "
										},{	
										/* weekly_repeat */
											hideLabel:true,
											name:"weekly_repeat",
											value:1
										},{
											xtype:"panel",
											html:" weeks on "
										},{
											xtype:"panel",
											layout:"table",
											layoutConfig:{
												columns:7	
											},
											defaults:{
												xtype:"panel",
												layout:"form",
												
												defaults:{
													labelSeparator:"",
													labelStyle:"padding-left:2px",
												}
											},
											items:[
												{items:[{
													xtype:"checkbox",
													name:"weekly_days",
													fieldLabel:"S",
													inputValue:0
												}]},{items:[{
													xtype:"checkbox",
													name:"weekly_days",
													fieldLabel:"M",
													inputValue:1
												}]},{items:[{
													xtype:"checkbox",
													name:"weekly_days",
													fieldLabel:"T",
													inputValue:2
												}]},{items:[{
													xtype:"checkbox",
													name:"weekly_days",
													fieldLabel:"W",
													inputValue:3
												}]},{items:[{
													xtype:"checkbox",
													name:"weekly_days",
													fieldLabel:"T",
													inputValue:4
												}]},{items:[{
													xtype:"checkbox",
													name:"weekly_days",
													fieldLabel:"F",
													inputValue:5
												}]},{items:[{
													xtype:"checkbox",
													name:"weekly_days",
													fieldLabel:"S",
													inputValue:6
												}]}
											]
											
													
										},{
											xtype:"panel",
											html:" at "	
										},{	
										/* weekly_time */
											hideLabel:true,
											name:"weekly_time",
											value:new Date().format("H:i")
										}]
									},{
									//MonthlyByDate Panel
										xtype:"fieldset",
										id:"scheduleMonthlyByDate",
										height:190,
										width:125,
										title:"Monthly By Date",
										items:[{
											xtype:"panel",
											html:" Repeat every "
										},{	

										/* monthly_by_date_repeat */
											hideLabel:true,
											name:"monthly_by_date_repeat",
											value:1
										},{
											xtype:"panel",
											html:" months on the "
										},{	
										/* monthly_by_date_day */
											hideLabel:true,
											name:"monthly_by_date_day",
											value:new Date().format("d")
										},{
											xtype:"panel",
											html:" day of the month at "
										},{	
										/* monthly_by_date_time */
											hideLabel:true,
											name:"monthly_by_date_time",
											value:new Date().format("H:i")
										}]
									},{
									//MonthlyByWeekday Panel
										xtype:"fieldset",
										id:"scheduleMonthlyByWeekday",
										height:200,
										width:125,
										title:"Monthly By Weekday",
										items:[{
											xtype:"panel",
											html:" Repeat every "
										},{	

										/* monthly_by_weekday_repeat */
											hideLabel:true,
											name:"monthly_by_weekday_repeat",
											value:1
										},{
											xtype:"panel",
											html:" months on the "
										},{
										/* monthly_by_weekday_daycount */
											hideLabel:true,
											hiddenName:"monthly_by_weekday_daycount",
											xtype:"combo",
											width:80,
											store: new Ext.data.SimpleStore({
												fields: ['key','value'],
												data:[
													["First",1],
													["Second",2],
													["Third",3],
													["Fourth",4],
													["Fifth",5]
												] 
											}),
											displayField:'key',
											valueField:'value',
											mode: 'local',
											triggerAction: 'all',
											editable:false,
											value:parseInt(new Date().getDate()/7),
											forceSelection:true
										},{
										/* monthly_by_weekday_day */
											hideLabel:true,
											hiddenName:"monthly_by_weekday_day",
											xtype:"combo",
											width:80,
											store: new Ext.data.SimpleStore({
												fields: ['key','value'],
												data:[
													["Sunday",0],
													["Monday",1],
													["Tuesday",2],
													["Wednesday",3],
													["Thursday",4],
													["Friday",5],
													["Saturday",6],
												] 
											}),
											displayField:'key',
											valueField:'value',
											mode: 'local',
											triggerAction: 'all',
											editable:false,
											value:new Date().format("w"),
											forceSelection:true
										},{	
											xtype:"panel",
											html:" of the month at "
										},{
										/* monthly_by_date_time */
											hideLabel:true,
											name:"monthly_by_weekday_time",
											value:new Date().format("H:i")
										}]
									},{
									//Yearly Panel
										xtype:"fieldset",
										id:"scheduleYearly",
										height:190,
										width:125,
										title:"Yearly Schedule",
										items:[{
											xtype:"panel",
											html:" Repeat every "
										},{	

										/* yearly_repeat */
											hideLabel:true,
											name:"yearly_repeat",
											value:1
										},{
											xtype:"panel",
											html:" years on "
										},{	
										/* yearly_date */
											hideLabel:true,
											name:"yearly_date",
											value:new Date().format("m/d")
										},{
											xtype:"panel",
											html:" at "
										},{
										/* yearly_time */
											hideLabel:true,
											name:"yearly_time",
											value:new Date().format("H:i")
										}]	
									}]
								}]
							}],
							buttons:[{
								text:"Save",
								handler:function(){
									/* debug_window(config.task.getForm().getValues())
									return */
									config.task.getForm().submit({
										url:"?fuseaction=save_cron_job",
										waitMsg:"Saving...",
										success:function(form){
											config.task.getStore().reload()
											C.infoMsg("Task Saved.")
										}
									})
								}
							},{
								text:"Cancel",
								handler:function(){
									config.task.hideForm();
								}
							},{
								text:"Delete",
								handler:function(){
									var form = config.task.getForm();
									var name = form.getValues().name;
									
									Ext.MessageBox.confirm("Warning","Delete this task '" + name +"'?",function(btn){
										if (btn == 'yes') {
											C.body.mask("Deleting task...");
											Ext.Ajax.request({
												url:'?fuseaction=delete_cron_job&name=' + name,
												callback:function(options,success,response){
													var result = Ext.decode(response.responseText);
													if (result.success){
														C.body.unmask();
														C.infoMsg("Task '" + name + "' deleted.");
														config.task.hideForm();
													} else {
														C.showAjaxError(response.responseText);	
													}
												}
											})
										}
									})
								}
							}],
							listeners:{
							/* actioncomplete */
								actioncomplete:function(form,action){
									
								},
								actionfailed:C.defaultActionFailed
							}
						}]
					},{
					/* east - help */
						region:"east",
						title:"Help",
						autoLoad: {url: 'views/scheduled_tasks_help.html',nocache:true},
						collapsible:true,
						width:"300",
						autoScroll:true
					}]
					
				}
				C.addTab(center_tabs,config);

			}  
				
			center_tabs.activate(tabId)
		}
/* ================ applications ============================================ */
	C.applications={}
	/* ---------------- main ------------------------------------------------ */
		C.applications.main=function(){
			var center_tabs = Ext.getCmp("center_tabs");
			var tabId="applications_main";
			if (!center_tabs.findById(tabId)){
				var config={
					id:tabId,
					title:"Manage Applications",
					closable:true,
					layout:"border",
					header:false,
					items:[{
						/* frame:true, */
						region:"center",
						layout:"fit",
						items:[C.applications.main.cmp_app_grid(tabId)]
					},{
						region:"east",
						hidden:true,
						width:"400",
						autoScroll:true
					}]
				}
				C.addTab(center_tabs,config);
			}  
				
			center_tabs.activate(tabId)
		}
		/* ---------------- cmp_app_grid ------------------------------------ */
			C.applications.main.cmp_app_grid=function(tabId){
				var thisPanel = function(){
					return Ext.getCmp("app_grid");	
				}
				return {
					xtype:"grid",
					id:"app_grid",
					/* functions */
					stripeRows:true,
					ds:new Ext.data.Store({
						storeId:"app_grid",
						autoLoad:true,
						proxy: new Ext.data.HttpProxy({
							url: "?fuseaction=get_installed_apps"
						}),
					
						reader: new Ext.data.JsonReader({
							root: "data",            
							totalProperty: "totalRows",            
							id: "appname"            
						},
						[
							 "appname",
							 "displayname",
							 "description",
							 "author",
							 "authoremail",
							 "website",
							 "version",
							 "minmynaversion",
							 "postinstallurl",
							 "installdate",
							 "installpath"
						]),
						remoteSort: false,
						sortInfo:{
							field:'appname',
							direction:'ASC'
						}
					}),
					
					columns:[
						{header:"appname", width: 100, sortable: true, dataIndex: 'appname', id:'appname'},
						{
							header:"", width: 100, sortable: true, dataIndex: 'appname',id:'export', 
							renderer:function(){
								return "<span class='link'>export</span>";	
							}
						},
						
						{header:"Display Name", width: 100, sortable: true, dataIndex:"displayname"},
						{header:"Description", width: 100, sortable: true, dataIndex:"description"},
						{header:"Version", width: 100, sortable: true, dataIndex:"version"},
						{header:"Author", width: 100, sortable: true, dataIndex:"author"},
						{header:"Email", width: 100, sortable: true, dataIndex:"authoremail"},
						{header:"Website", width: 100, sortable: true, dataIndex:"website"},
						
						{header:"Minimum Myna Version", width: 100, sortable: true, dataIndex:"minmynaversion"},
						
						{header:"Install Date", width: 100, sortable: true, dataIndex:"installdate"},
						{header:"Install Path", width: 100, sortable: true, dataIndex:"installpath"}
					],
					autoExpandColumn:0,
					sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
					loadMask: true,
					tbar:[{
							xtype:"button",
							text:"Import App",
							iconCls:"icon_add",
							tooltip:"Import an application that is already in the web root",
							handler:function(){
								C.applications.importApp();	
							}
					},{
							xtype:"button",
							text:"Install Egg",
							iconCls:"icon_add",
							tooltip:"Installs an application (Myna Egg) from a directory on the server",
							handler:function(){
								C.applications.installEgg();	
							}
					}],
					bbar:new Ext.PagingToolbar({
						pageSize: 25,
						store: Ext.StoreMgr.get("app_grid"),
						displayInfo: true,
						displayMsg: 'Displaying rows {0} - {1} of {2}',
						emptyMsg: "No rows to display"/* ,
						items:[{
							
						}] */
					}),
					listeners: {
						cellclick:function(grid,rowIndex,cellIndex,e){
							var cm = grid.getColumnModel();
							var record = grid.getStore().getAt(rowIndex);
							var value = record.get(cm.getDataIndex(cellIndex))
							switch(cm.getColumnId(cellIndex)){
								case "export":
									C.applications.exportApp(value);
								break;
							}
						},
						rowclick:function(grid,rowIndex,e){
							var record = grid.getStore().getAt(rowIndex);
						},
						rowdblclick:function(grid,rowIndex,e){
							
						}
					}
					
				}
			}
	/* ---------------- importApp ----------------------------------------- */		
		C.applications.importApp=function(){
			Ext.Msg.prompt(
				"Importing Application",
				"Enter the directory where the application resides, relative to web root",
				function(button,folder){
					if (button == "ok")
					{
						Ext.Ajax.request(
							{
								url:"?fuseaction=import_app",
								params:{
									folder:folder
								},
								waitMsg:"Importing " + folder +" ...",
								callback:C.cbHandler(
									function(result)
									{
										if (result.success)
										{
											var store = Ext.StoreMgr.get("app_grid");
											if (store) {
												
												store.reload();
											}
											C.infoMsg("Imported " + folder)
											C.applications.main();
										} else return false;
									}
								)
							}
						)
					}
					//console.dir(Array.parse(arguments))	
				}
			)
		}
	/* ---------------- installEgg ---------------------------------------- */		
		C.applications.installEgg=function(){
			var win = new Ext.Window({
				title:"Install a Myna Egg",
				width:600,
				height:240,
				frame:true,
				layout:"fit",
				modal:true,
				items:[{
					xtype:"form",
					fileUpload:true,
					url:'?fuseaction=install_egg',
					frame:true,
					id:"install_egg_form",
					labelAlign:"top",
					defaults:{
						width:570
					},
					items:[
						{//eggfile
							xtype:"textfield",
							fieldLabel: 'Upload .egg file',
							name: 'eggfile',
							/* grow:true, */
							//style:{width:"100%"},
							inputType: 'file',
							allowBlank:false
						},{//checksum
							xtype:"textfield",
							fieldLabel: '<b>Optional</b> Checksum',
							name: 'checksum',
							/* grow:true, */
							//style:{width:"100%"},
							allowBlank:true
						},{//progress
							id:"install_egg_progress",
							xtype:'progress'
							
						}
					],
					buttons:[
						{//install
							text:"Install Egg",
							handler:function(){
								var form = Ext.getCmp("install_egg_form").form;
								if (!form.isValid()) return;
								form.submit();
								form.timer=null;
								var checkProgress = function(){
									Ext.Ajax.request({
										url:"?fuseaction=install_egg_progress",
										success:function(response){
											//alert(response.responseText)
											try{
												var obj = Ext.decode(response.responseText);
											} catch(e){
												alert(response.responseText)
											}
											var progressBar = Ext.getCmp("install_egg_progress");
											if (!progressBar) return;
											if (obj.message){
												progressBar.updateProgress(obj.percentComplete,obj.message);
											}
											if (obj.isComplete) {
												C.infoMsg("Installation Complete.")
												window.clearInterval(form.timer);
												win.close();
											}
											if (obj.hasError) window.clearInterval(form.timer);
										}
									})
									
								}
								//window.setTimeout(function(){
									form.timer = window.setInterval(checkProgress,500)	
								//},100)
							}
							
						},{
							text:"Cancel",
							handler:function(){
								win.close();
							}
						}
					]
					
				}]
			});
			win.show();
			/* Ext.Msg.prompt(
				"Installing Application",
				"Enter the path to the .egg file, relative to web root",
				function(button,folder){
					if (button == "ok")
					{
						Ext.Ajax.request(
							{
								url:"?fuseaction=install_egg",
								params:{
									path:path
								},
								waitMsg:"Installing " + path +" ...",
								callback:C.cbHandler(
									function(result)
									{
										if (result.success)
										{
											var store = Ext.StoreMgr.get("app_grid");
											if (store) {
												
												store.reload();
											}
											C.infoMsg("Installed " + path)
											C.applications.main();
										} else return false;
									}
								)
							}
						)
					}
					//console.dir(Array.parse(arguments))	
				}
			) */
		}
	/* ---------------- exportApp ----------------------------------------- */		
		C.applications.exportApp=function(appname){
			Ext.Msg.prompt(
				"Exporting Application",
				"Enter the directory where the application package should be exported",
				function(button,folder){
					if (button == "ok")
					{
						Ext.Ajax.request(
							{
								url:"?fuseaction=export_app",
								params:{
									folder:folder,
									appname:appname
								},
								waitMsg:"Exporting " + appname +" ...",
								callback:C.cbHandler(
									function(result)
									{
										if (result.success)
										{
											C.infoMsg(result.message)
											C.applications.main();
											
										} else return false;
									}
								)
							}
						)
					}
					//console.dir(Array.parse(arguments))	
				},
				null,
				null,
				rootDir
			)
		}
/* ================ Permissions ============================================= */
	/* ================ Rights ============================================== */
		C.rights={}
		/* ---------------- main -------------------------------------------- */
			C.rights.main=function(){
				var center_tabs = Ext.getCmp("center_tabs");
			var tabId="manage_rights_main";
			if (!center_tabs.findById(tabId)){
				var config ={
					id:tabId,
					closable:true,
					title:"Manage Rights",
					layout:"border",
					items:[{
						region:"center",
						xtype:"grid",
						id:"manage_rights_grid",
						functions:{
							search:function(){
								var field = Ext.getCmp("manage_rights_search")
								var store = Ext.StoreMgr.get("manage_rights_grid")
								var tb = Ext.getCmp("manage_rights_grid").getBottomToolbar()
								store.baseParams.search=field.getValue();
								store.baseParams.start=0;
								tb.onClick("refresh");
							}
						},
						stripeRows:true,
						ds:new Ext.data.Store({
							storeId:"manage_rights_grid",
							proxy: new Ext.data.HttpProxy({
								url: "?fuseaction=qry_rights"
							}),
						
							reader: new Ext.data.JsonReader({
								root: "data",            
								totalProperty: "totalRows",            
								id: "right_id"            
							},
							[
								{name:'right_id'},
								{name:'appname'},
								{name:'description'},
								{name:'name'}	
							]),
							remoteSort: true
						}),
						columns:[
							{id:"right_id", header: "right_id", width: 150, sortable: true, renderer:C.linkRenderer, dataIndex: 'right_id'},
							{id:"appname", header: "Appname", dataIndex:'appname', width: 100, sortable: true},
							{id:"name", header: "Name", dataIndex:'name', width: 100, sortable: true},
							{id:"description", header: "Description", dataIndex:'description', width: 100, sortable: true}
							
						],
						autoExpandColumn:0,
						sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
						loadMask: true,
						tbar:[{
							xtype:"tbspacer"
						},{
							xtype:"textfield",
							id:"manage_rights_search",
							enableKeyEvents: true,
							listeners:{
								keydown:function(f,e){
									if ("10,13".listContains(e.getKey()))
									Ext.getCmp("manage_rights_grid").functions.search()
								}
							}
						},{
							xtype:"tbspacer"
						},{
							text:"Search", 
							iconCls:"icon_search",
							handler:function(){
								Ext.getCmp("manage_rights_grid").functions.search()
							}
						},{
								xtype:"tbseparator"
							},{
								text:"Add Right",
								iconCls:"icon_add",
								handler:function(){
									var formPanel = Ext.getCmp("form" + tabId);
									formPanel.functions.loadForm()
								}
							},{
							xtype:"tbfill"
						},{
							text:"Help",
							iconCls:"icon_help",
							handler:function(){
								C.showHelp("permissions_rights_help")
							}
						}],
						bbar:new Ext.PagingToolbar({
							pageSize: 25,
							store: Ext.StoreMgr.get("manage_rights_grid"),
							displayInfo: true,
							displayMsg: 'Displaying rows {0} - {1} of {2}',
							emptyMsg: "No rows to display"
						}),
						listeners: {
							beforerender:function(){
								Ext.StoreMgr.get("manage_rights_grid").load();
							},
							cellclick:function(grid,rowIndex,cellIndex,e){
								var cm = grid.getColumnModel();
								var record = grid.getStore().getAt(rowIndex);
								var value = record.get(cm.getDataIndex(cellIndex))
								switch(cm.getColumnId(cellIndex)){
									case "right_id":
										var formPanel = Ext.getCmp("form" + tabId);
										formPanel.functions.loadForm(value)
									break;
								}
							},
							rowclick:function(grid,rowIndex,e){
								var record = grid.getStore().getAt(rowIndex);
							},
							rowdblclick:function(grid,rowIndex,e){
								
							}
						}
					},{
						region:"east",
						width:300,
						title:"Edit Details",
						tools:[{
							id:"close",
							handler:function(e,t,panel){
								panel.functions.close();
							}
						}],
						id:"form" + tabId,
						frame:true,
						autoScroll:true,
						functions:{
							loadForm:function(right_id){
								Ext.Ajax.request({
									url:"?fuseaction=get_right_data",
									params:{right_id:right_id||0},
									waitMsg:"Loading User",
									callback:C.cbHandler(function(result){
										if (result.success){
											var formPanel = Ext.getCmp("form" + tabId);
											var form = formPanel.form;
											form.setValues(result.data)
											
											formPanel.show();
											formPanel.ownerCt.doLayout();
										} else return false;
									})
								})
							},
							save:function(){
								var formPanel = Ext.getCmp("form" + tabId);
								var form = formPanel.form;
								
								if (form.isValid()){
									var data = form.getValues();
									Ext.Ajax.request({
										url:"?fuseaction=save_right_data",
										params:data,
										waitMsg:"Saving...",
										callback:C.cbHandler(function(result){
											if (result.success){
												Ext.StoreMgr.get("manage_rights_grid").reload();
												formPanel.functions.close();
											} else if (result.errors){
												form.markInvalid(errors)
											} else return false
										})
												
									})
								}
							},
							remove:function(){
								Ext.MessageBox.confirm("Warning","Delete this object?",function(btn){
									if (btn == 'yes') {
										var formPanel = Ext.getCmp("form" + tabId);
										var form = formPanel.form;
										
										var data = form.getValues();
										Ext.Ajax.request({
											url:"?fuseaction=delete_right",
											params:{
												right_id:data.right_id											},
											waitMsg:"Removing...",
											callback:C.cbHandler(function(result){
												if (result.success){
													Ext.StoreMgr.get("manage_rights_grid").reload();
													formPanel.functions.close();
												} else return false
											})
													
										})										
									}
								})
								
								
							},
							close:function(){
								var formPanel = Ext.getCmp("form" + tabId);
								formPanel.hide();
								formPanel.ownerCt.doLayout();
							}
						},
						xtype:"form",
						labelAlign:"top",
						hidden:true,
						trackResetOnLoad:true,
						defaults:{
							xtype:"textfield",
							labelStyle:"font-weight:bold"
						},
						bodyStyle:"padding:10px;",
						items:[
							{name:"right_id", width:250, fieldLabel:"Right Id", readOnly:true, cls:"key_field" },
							{name:"appname", width:250,  fieldLabel:"Appname", maxLength:255,  id:"appname" + tabId },
							{name:"name", width:250,  fieldLabel:"Name", maxLength:255,  id:"name" + tabId },
							{name:"description", width:250,  fieldLabel:"Description", maxLength:255,  id:"description" + tabId }
							
						],
						buttons:[{
							text:"Save",
							iconCls:"icon_save",
							handler:function(){
								Ext.getCmp("form" + tabId).functions.save();
								
							}
						},{
							text:"Delete",
							iconCls:"icon_delete",
							handler:function(){
								Ext.getCmp("form" + tabId).functions.remove();
							}
						}]
					}],
					listeners:{
						activate:function(){
							Ext.StoreMgr.get("manage_rights_grid").reload();
						}	
					}
					
					
				}
				C.addTab(center_tabs,config);

			}  
				
			center_tabs.activate(tabId)
			}
		


	/* ================ Users =============================================== */
		C.users={}
		/* ---------------- main -------------------------------------------- */
			C.users.main=function(){
				var center_tabs = Ext.getCmp("center_tabs");
			var tabId="manage_users_main";
			if (!center_tabs.findById(tabId)){
				var config ={
					id:tabId,
					closable:true,
					title:"Manage Users",
					layout:"border",
					items:[{
						region:"center",
						xtype:"grid",
						id:"manage_users_grid",
						functions:{
							search:function(){
								var field = Ext.getCmp("manage_users_search")
								var tb = Ext.getCmp("manage_users_grid").getBottomToolbar()
								var store = Ext.StoreMgr.get("manage_users_grid")
								store.baseParams.search=field.getValue();
								store.baseParams.start=0;
								tb.onClick("refresh");
							}
						},
						stripeRows:true,
						ds:new Ext.data.Store({
							storeId:"manage_users_grid",
							proxy: new Ext.data.HttpProxy({
								url: "?fuseaction=qry_users"
							}),
						
							reader: new Ext.data.JsonReader({
								root: "data",            
								totalProperty: "totalRows",            
								id: "user_id"            
							},
							[
								{name:'user_id'},
								{name:'created'},
								{name:'first_name'},
								{name:'last_login'},
								{name:'last_name'},
								{name:'middle_name'},
								{name:'title'},
								{name:'logins'}
							]),
							remoteSort: true
						}),
						columns:[
							{id:"user_id", header: "user_id", width: 150, sortable: true, renderer:C.linkRenderer, dataIndex: 'user_id'},
							{id:"last_name", header: "Last Name", dataIndex:'last_name', width: 100, sortable: true},
							{id:"first_name", header: "First Name", dataIndex:'first_name', width: 100, sortable: true},
							{id:"middle_name", header: "Middle Name", dataIndex:'middle_name', width: 20, sortable: true},
							{id:"title", header: "Title", dataIndex:'title', width: 20, sortable: true},
							{id:"logins", header: "Login Names", dataIndex:'logins', width: 300, sortable: true},
							{id:"created", header: "Created", dataIndex:'created', width: 100, sortable: true},
							{id:"last_login", header: "Last Login", dataIndex:'last_login', width: 100, sortable: true}
							
						],
						autoExpandColumn:0,
						sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
						loadMask: true,
						tbar:[{
							xtype:"tbspacer"
						},{
							xtype:"textfield",
							id:"manage_users_search",
							enableKeyEvents: true,
							listeners:{
								keydown:function(f,e){
									if ("10,13".listContains(e.getKey()))
									Ext.getCmp("manage_users_grid").functions.search()
								}
							}
						},{
							xtype:"tbspacer"
						},{
							text:"Search", 
							iconCls:"icon_search",
							handler:function(){
								Ext.getCmp("manage_users_grid").functions.search()
							}
						},{
							xtype:"tbseparator"
						},{
							text:"Add User",
							iconCls:"icon_add",
							handler:function(){
								var formPanel = Ext.getCmp("form" + tabId);
								formPanel.functions.loadForm()
							}
						},{
							xtype:"tbfill"
						},{
							text:"Help",
							iconCls:"icon_help",
							handler:function(){
								C.showHelp("permissions_users_help")
							}
						}],
						bbar:new Ext.PagingToolbar({
							pageSize: 25,
							store: Ext.StoreMgr.get("manage_users_grid"),
							displayInfo: true,
							displayMsg: 'Displaying rows {0} - {1} of {2}',
							emptyMsg: "No rows to display"
						}),
						listeners: {
							beforerender:function(){
								Ext.StoreMgr.get("manage_users_grid").load();
							},
							cellclick:function(grid,rowIndex,cellIndex,e){
								var cm = grid.getColumnModel();
								var record = grid.getStore().getAt(rowIndex);
								var value = record.get(cm.getDataIndex(cellIndex))
								switch(cm.getColumnId(cellIndex)){
									case "user_id":
										var formPanel = Ext.getCmp("form" + tabId);
										formPanel.functions.loadForm(value)
									break;
								}
							},
							rowclick:function(grid,rowIndex,e){
								var record = grid.getStore().getAt(rowIndex);
							},
							rowdblclick:function(grid,rowIndex,e){
								
							}
						}
					},{
						region:"east",
						width:300,
						title:"Edit Details",
						tools:[{
							id:"close",
							handler:function(e,t,panel){
								panel.functions.close();
							}
						}],
						id:"form" + tabId,
						frame:true,
						autoScroll:true,
						functions:{
							loadForm:function(user_id){
								Ext.Ajax.request({
									url:"?fuseaction=get_user_data",
									params:{user_id:user_id||0},
									waitMsg:"Loading User",
									callback:C.cbHandler(function(result){
										if (result.success){
											var formPanel = Ext.getCmp("form" + tabId);
											var form = formPanel.form;
											form.setValues(result.data)
											
											formPanel.show();
											formPanel.ownerCt.doLayout();
										} else return false;
									})
								})
							},
							save:function(){
								var formPanel = Ext.getCmp("form" + tabId);
								var form = formPanel.form;
								
								if (form.isValid()){
									var data = form.getValues();
									/* delete data.created;
									delete data.created; */
									Ext.Ajax.request({
										url:"?fuseaction=save_user_data",
										params:data,
										waitMsg:"Saving...",
										callback:C.cbHandler(function(result){
											if (result.success){
												Ext.StoreMgr.get("manage_users_grid").reload();
												formPanel.functions.close();
											} else return false
										})
												
									})
								}
							},
							remove:function(){
								Ext.MessageBox.confirm("Warning","Delete this object?",function(btn){
									if (btn == 'yes') {
										var formPanel = Ext.getCmp("form" + tabId);
										var form = formPanel.form;
										
										var data = form.getValues();
										Ext.Ajax.request({
											url:"?fuseaction=delete_user",
											params:{
												user_id:data.user_id											},
											waitMsg:"Removing...",
											callback:C.cbHandler(function(result){
												if (result.success){
													Ext.StoreMgr.get("manage_users_grid").reload();
													formPanel.functions.close();
												} else return false
											})
													
										})										
									}
								})
								
								
							},
							close:function(){
								var formPanel = Ext.getCmp("form" + tabId);
								formPanel.hide();
								formPanel.ownerCt.doLayout();
							}
						},
						xtype:"form",
						labelAlign:"top",
						hidden:true,
						trackResetOnLoad:true,
						defaults:{
							xtype:"textfield",
							labelStyle:"font-weight:bold"
						},
						bodyStyle:"padding:10px;",
						items:[
							{name:"user_id", width:250, fieldLabel:"User Id", readOnly:true, cls:"key_field" },
							{name:"created", width:250, disabled:true, fieldLabel:"Created", readOnly:true, cls:"readonly_field", maxLength:23,  id:"created" + tabId },
							{name:"last_login", width:250, disabled:true, fieldLabel:"Last Login", readOnly:true, cls:"readonly_field", maxLength:23,  id:"last_login" + tabId },
							{name:"title", width:250,  fieldLabel:"Title", maxLength:255,  id:"title" + tabId },
							{name:"first_name", width:250,  fieldLabel:"First Name", maxLength:255,  id:"first_name" + tabId },
							{name:"middle_name", width:250,  fieldLabel:"Middle Name", maxLength:255,  id:"middle_name" + tabId },
							{name:"last_name", width:250,  fieldLabel:"Last Name", maxLength:255,  id:"last_name" + tabId },
							{name:"logins", xtype:"textarea", disabled:true, width:250,   fieldLabel:"Logins",  readOnly:true, cls:"readonly_field",  id:"logins" + tabId }
						],
						buttons:[{
							text:"Save",
							iconCls:"icon_save",
							handler:function(){
								Ext.getCmp("form" + tabId).functions.save();
								
							}
						},{
							text:"Edit Logins",
							iconCls:"icon_edit_form",
							handler:function(){
								var formPanel = Ext.getCmp("form" + tabId);
								formPanel.functions.close();
								C.user_logins.main(formPanel.form.findField("user_id").getValue());
							}
						},{
							text:"Delete",
							iconCls:"icon_delete",
							handler:function(){
								Ext.getCmp("form" + tabId).functions.remove();
							}
						}]
					}],
					listeners:{
						activate:function(){
							Ext.StoreMgr.get("manage_users_grid").reload();
						}	
					}
					
					
				}
				C.addTab(center_tabs,config);

			}  
				
			center_tabs.activate(tabId)
			}
		

	/* ================ User Logins ========================================= */
		C.user_logins={}
		/* ---------------- main -------------------------------------------- */
			C.user_logins.main=function(user_id){
				var center_tabs = Ext.getCmp("center_tabs");
				var tabId="manage_user_logins_main";
				if (!center_tabs.findById(tabId)){
					var config ={
						id:tabId,
						closable:true,
						title:"Manage User Logins",
						layout:"border",
						items:[{
							region:"center",
							xtype:"grid",
							id:"manage_user_logins_grid",
							functions:{
								search:function(){
									var field = Ext.getCmp("manage_user_logins_search")
									var tb = Ext.getCmp("manage_user_logins_grid").getBottomToolbar()
									var store = Ext.StoreMgr.get("manage_user_logins_grid")
									store.baseParams.search=field.getValue();
									store.baseParams.start=0;
									tb.onClick("refresh");
								}
							},
							stripeRows:true,
							ds:new Ext.data.Store({
								storeId:"manage_user_logins_grid",
								proxy: new Ext.data.HttpProxy({
									url: "?fuseaction=qry_user_logins&user_id=" + user_id
								}),
								reader: new Ext.data.JsonReader({
									root: "data",            
									totalProperty: "totalRows",            
									id: "user_login_id"            
								},
								[
									{name:'user_login_id'},
									{name:'login'},
									{name:'password'},
									{name:'user_name'},
									{name:'type'},
									{name:'user_id'}	
								]),
								remoteSort: true
							}),
							columns:[
								{id:"user_login_id", header: "user_login_id", width: 150, sortable: true, renderer:C.linkRenderer, dataIndex: 'user_login_id'},
								{id:"login", header: "Login", dataIndex:'login', width: 100, sortable: true},
								{id:"type", header: "Type", dataIndex:'type', width: 100, sortable: true},
								{id:"user_name", header: "User Name", dataIndex:'user_name', width: 100, sortable: true},
								{id:"user_id", header: "User Id", dataIndex:'user_id', width: 100, sortable: true}
							],
							autoExpandColumn:0,
							sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
							loadMask: true,
							tbar:[{
								xtype:"tbspacer"
							},{
								xtype:"textfield",
								id:"manage_user_logins_search",
								enableKeyEvents: true,
								listeners:{
									keydown:function(f,e){
										if ("10,13".listContains(e.getKey()))
										Ext.getCmp("manage_user_logins_grid").functions.search()
									}
								}
							},{
								xtype:"tbspacer"
							},{
								text:"Search", 
								iconCls:"icon_search",
								handler:function(){
									Ext.getCmp("manage_user_logins_grid").functions.search()
								}
							},{
								xtype:"tbseparator"
							},{
								text:"Add User Login",
								iconCls:"icon_add",
								handler:function(){
									var formPanel = Ext.getCmp("form" + tabId);
									formPanel.functions.loadForm()
								}
								
							},{
									xtype:"tbfill"
							},{
								text:"Help",
								iconCls:"icon_help",
								handler:function(){
									C.showHelp("permissions_user_logins_help")
								}
							}],
							bbar:new Ext.PagingToolbar({
								pageSize: 25,
								store: Ext.StoreMgr.get("manage_user_logins_grid"),
								displayInfo: true,
								displayMsg: 'Displaying rows {0} - {1} of {2}',
								emptyMsg: "No rows to display"
							}),
							listeners: {
								beforerender:function(){
									Ext.StoreMgr.get("manage_user_logins_grid").load();
								},
								cellclick:function(grid,rowIndex,cellIndex,e){
									var cm = grid.getColumnModel();
									var record = grid.getStore().getAt(rowIndex);
									var value = record.get(cm.getDataIndex(cellIndex))
									switch(cm.getColumnId(cellIndex)){
										case "user_login_id":
											var formPanel = Ext.getCmp("form" + tabId);
											formPanel.functions.loadForm(value)
										break;
									}
								},
								rowclick:function(grid,rowIndex,e){
									var record = grid.getStore().getAt(rowIndex);
								},
								rowdblclick:function(grid,rowIndex,e){
									
								}
							}
						},{
							region:"east",
							width:300,
							title:"Edit Details",
							tools:[{
								id:"close",
								handler:function(e,t,panel){
									panel.functions.close();
								}
							}],
							id:"form" + tabId,
							frame:true,
							autoScroll:true,
							functions:{
								loadForm:function(user_login_id){
									Ext.Ajax.request({
										url:"?fuseaction=get_user_login_data",
										params:{user_login_id:user_login_id||0},
										waitMsg:"Loading User",
										callback:C.cbHandler(function(result){
											if (result.success){
												var formPanel = Ext.getCmp("form" + tabId);
												var form = formPanel.form;
												if (!("user_id" in result.data) || !result.data.user_id.length){
													result.data.user_id = user_id
												}
												
												
												
												formPanel.show();
												formPanel.ownerCt.doLayout();
												form.setValues(result.data);
												
												
											} else return false;
										})
									})
								},
								save:function(){
									var formPanel = Ext.getCmp("form" + tabId);
									var form = formPanel.form;
									
									if (form.isValid()){
										var data = form.getValues();
										Ext.Ajax.request({
											url:"?fuseaction=save_user_login_data",
											params:data,
											waitMsg:"Saving...",
											callback:C.cbHandler(function(result){
												if (result.success){
													Ext.StoreMgr.get("manage_user_logins_grid").reload();
													formPanel.functions.close();
												} else return false
											})
													
										})
									}
								},
								remove:function(){
									Ext.MessageBox.confirm("Warning","Delete this object?",function(btn){
										if (btn == 'yes') {
											var formPanel = Ext.getCmp("form" + tabId);
											var form = formPanel.form;
											
											var data = form.getValues();
											Ext.Ajax.request({
												url:"?fuseaction=delete_user_login",
												params:{
													user_login_id:data.user_login_id											},
												waitMsg:"Removing...",
												callback:C.cbHandler(function(result){
													if (result.success){
														Ext.StoreMgr.get("manage_user_logins_grid").reload();
														formPanel.functions.close();
													} else return false
												})
														
											})										
										}
									})
									
									
								},
								close:function(){
									var formPanel = Ext.getCmp("form" + tabId);
									formPanel.hide();
									formPanel.ownerCt.doLayout();
								}
							},
							xtype:"form",
							labelAlign:"top",
							hidden:true,
							trackResetOnLoad:true,
							defaults:{
								xtype:"textfield",
								labelStyle:"font-weight:bold"
							},
							bodyStyle:"padding:10px;",
							items:[
								{name:"user_login_id", width:250, fieldLabel:"User Login Id", readOnly:true, cls:"key_field" },
								{name:"type", width:250,  fieldLabel:"Auth Type", maxLength:255,  id:"type" + tabId },
								{name:"login", width:250,  fieldLabel:"Login", maxLength:255,  id:"login" + tabId },
								{name:"password", width:250,  allowBlank:false, fieldLabel:"Password", maxLength:255,  inputType:"password", id:"password1" + tabId },
								{name:"password2", width:250,  allowBlank:false, fieldLabel:"Password (again)", maxLength:255,  inputType:"password", id:"password2" + tabId, 
									validator:function(pw2){
										var pw1 = Ext.getCmp("password1" + tabId).getValue();
										if (pw1 == pw2) {
											return true
										} else {
											return "Passwords do not match, please try again"
										}
									}
								},
								
								{name:"user_id", width:250,  fieldLabel:"User Id", readOnly:true,  cls:"readonly_field", maxLength:255,  id:"user_id" + tabId }
							],
							buttons:[{
								text:"Save",
								iconCls:"icon_save",
								handler:function(){
									Ext.getCmp("form" + tabId).functions.save();
									
								}
							},{
								text:"Delete",
								iconCls:"icon_delete",
								handler:function(){
									Ext.getCmp("form" + tabId).functions.remove();
								}
							}]
						}],
						listeners:{
							activate:function(){
								Ext.StoreMgr.get("manage_user_logins_grid").reload();
							}	
						}
						
						
					}
					C.addTab(center_tabs,config);
	
				}  
					
				center_tabs.activate(tabId)
			}
		

	/* ================ User Groups ========================================= */
		C.user_groups={}
		/* ---------------- main -------------------------------------------- */
			C.user_groups.main=function(){
				var center_tabs = Ext.getCmp("center_tabs");
			var tabId="manage_user_groups_main";
			if (!center_tabs.findById(tabId)){
				var config ={
					id:tabId,
					closable:true,
					title:"Manage User Groups",
					layout:"border",
					items:[{
						region:"center",
						xtype:"grid",
						id:"manage_user_groups_grid",
						functions:{
							search:function(){
								var field = Ext.getCmp("manage_user_groups_search")
								var tb = Ext.getCmp("manage_user_groups_grid").getBottomToolbar()
								var store = Ext.StoreMgr.get("manage_user_groups_grid")
								store.baseParams.search=field.getValue();
								store.baseParams.start=0;
								tb.onClick("refresh");
							}
						},
						stripeRows:true,
						ds:new Ext.data.Store({
							storeId:"manage_user_groups_grid",
							proxy: new Ext.data.HttpProxy({
								url: "?fuseaction=qry_user_groups"
							}),
						
							reader: new Ext.data.JsonReader({
								root: "data",            
								totalProperty: "totalRows",            
								id: "user_group_id"            
							},
							[
								{name:'user_group_id'},
								{name:'appname'},
								{name:'description'},
								{name:'name'}	
							]),
							remoteSort: true
						}),
						columns:[
							{id:"user_group_id", header: "user_group_id", width: 150, sortable: true, renderer:C.linkRenderer, dataIndex: 'user_group_id'},
							{id:"appname", header: "Appname", dataIndex:'appname', width: 100, sortable: true},
							{id:"description", header: "Description", dataIndex:'description', width: 100, sortable: true},
							{id:"name", header: "Name", dataIndex:'name', width: 100, sortable: true}
						],
						autoExpandColumn:0,
						sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
						loadMask: true,
						tbar:[{
								xtype:"tbspacer"
							},{
								xtype:"textfield",
								id:"manage_user_groups_search",
								enableKeyEvents: true,
								listeners:{
									keydown:function(f,e){
										if ("10,13".listContains(e.getKey()))
										Ext.getCmp("manage_user_groups_grid").functions.search()
									}
								}
							},{
								xtype:"tbspacer"
							},{
								text:"Search", 
								iconCls:"icon_search",
								handler:function(){
									Ext.getCmp("manage_user_groups_grid").functions.search()
								}
							},{
								xtype:"tbseparator"
							},{
								text:"Add User Group",
								iconCls:"icon_add",
								handler:function(){
									var formPanel = Ext.getCmp("form" + tabId);
									formPanel.functions.loadForm()
								}
							},{
								xtype:"tbfill"
							},{
								text:"Help",
								iconCls:"icon_help",
								handler:function(){
									C.showHelp("permissions_user_groups_help")
								}
						}],
						bbar:new Ext.PagingToolbar({
							pageSize: 25,
							store: Ext.StoreMgr.get("manage_user_groups_grid"),
							displayInfo: true,
							displayMsg: 'Displaying rows {0} - {1} of {2}',
							emptyMsg: "No rows to display"
						}),
						listeners: {
							beforerender:function(){
								Ext.StoreMgr.get("manage_user_groups_grid").load();
							},
							cellclick:function(grid,rowIndex,cellIndex,e){
								var cm = grid.getColumnModel();
								var record = grid.getStore().getAt(rowIndex);
								var value = record.get(cm.getDataIndex(cellIndex))
								switch(cm.getColumnId(cellIndex)){
									case "user_group_id":
										var formPanel = Ext.getCmp("form" + tabId);
										formPanel.functions.loadForm(value)
									break;
								}
							},
							rowclick:function(grid,rowIndex,e){
								var record = grid.getStore().getAt(rowIndex);
							},
							rowdblclick:function(grid,rowIndex,e){
								
							}
						}
					},{
						region:"east",
						id:"east_panel" + tabId,
						width:600,
						title:"Edit Details",
						tools:[{
							id:"close",
							handler:function(e,t,panel){
								panel.functions.close();
							}
						}],
						frame:true,
						autoScroll:true,
						functions:{
							close:function(){
								var eastPanel = Ext.getCmp("east_panel" + tabId);
								eastPanel.hide();
								eastPanel.ownerCt.doLayout();
							}
						},
						hidden:true,
						layout:"fit",
						items:[{
							xtype:"tabpanel",
							activeTab:0,
						
							items:[{
							// group general
								title:"General",
								frame:true,
								xtype:"form",
								id:"form" + tabId,
								labelAlign:"top",
								trackResetOnLoad:true,
								functions:{
									loadForm:function(user_group_id){
										Ext.Ajax.request({
											url:"?fuseaction=get_user_group_data",
											params:{user_group_id:user_group_id||0},
											waitMsg:"Loading User",
											callback:C.cbHandler(function(result){
												if (result.success){
													var eastPanel = Ext.getCmp("east_panel" + tabId);
													var form = Ext.getCmp("form" + tabId).form;
													form.setValues(result.data);
													
													eastPanel.show();
													eastPanel.ownerCt.doLayout();
												} else return false;
											})
										})
									},
									save:function(){
										var formPanel = Ext.getCmp("form" + tabId);
										var eastPanel = Ext.getCmp("east_panel" + tabId);
										var form = formPanel.form;
										
										if (form.isValid()){
											var data = form.getValues();
											Ext.Ajax.request({
												url:"?fuseaction=save_user_group_data",
												params:data,
												waitMsg:"Saving...",
												callback:C.cbHandler(function(result){
													if (result.success){
														Ext.StoreMgr.get("manage_user_groups_grid").reload();
														eastPanel.functions.close();
													} else if (result.errors){
														form.markInvalid(errors)
													} else return false
												})
														
											})
										}
									},
									remove:function(){
										Ext.MessageBox.confirm("Warning","Delete this object?",function(btn){
											if (btn == 'yes') {
												var formPanel = Ext.getCmp("form" + tabId);
												var eastPanel = Ext.getCmp("east_panel" + tabId);
												var form = formPanel.form;
												
												var data = form.getValues();
												Ext.Ajax.request({
													url:"?fuseaction=delete_user_group",
													params:{
														user_group_id:data.user_group_id											},
													waitMsg:"Removing...",
													callback:C.cbHandler(function(result){
														if (result.success){
															Ext.StoreMgr.get("manage_user_groups_grid").reload();
															eastPanel.functions.close();
														} else return false
													})
															
												})										
											}
										})
										
										
									}
									
								},
								defaults:{
									xtype:"textfield",
									labelStyle:"font-weight:bold"
								},
								bodyStyle:"padding:10px;",
								items:[
									{name:"user_group_id", width:250, fieldLabel:"User Group Id", readOnly:true, cls:"key_field" },
									{name:"appname", width:250,  fieldLabel:"Appname", maxLength:255,  id:"appname" + tabId },
									{name:"description", width:250,  fieldLabel:"Description", maxLength:255,  id:"description" + tabId },
									{name:"name", width:250,  fieldLabel:"Name", maxLength:255,  id:"name" + tabId }
								],
								buttons:[{
									text:"Save",
									iconCls:"icon_save",
									handler:function(){
										Ext.getCmp("form" + tabId).functions.save();
										
									}
								},{
									text:"Delete",
									iconCls:"icon_delete",
									handler:function(){
										Ext.getCmp("form" + tabId).functions.remove();
									}
								}]
							},{
							// manage users
								xtype:"grid",
								title:"Users",
								width:350,
								height:300,
								//width:300,
								id:"manage_user_group_members_grid",
								functions:{
									search:function(){
										var field = Ext.getCmp("manage_user_group_members_search")
										var store = Ext.StoreMgr.get("manage_user_group_members_grid")
										
										var tb = Ext.getCmp("manage_user_group_members_grid").getBottomToolbar()
										store.baseParams.search=field.getValue();
										store.baseParams.start=0;
										tb.onClick("refresh");
									},
									add:function(user_id){
										var form = Ext.getCmp("form" + tabId).form;
										Ext.Ajax.request({
											url:"?fuseaction=add_user_group_member",
											params:{
												user_id:user_id,
												user_group_id:form.findField("user_group_id").getValue()
											},
											callback:C.cbHandler(function(result){
												if (result.success){
													var grid = Ext.getCmp("manage_user_group_members_grid")
													grid.getStore().reload();
													C.infoMsg("User Added.")
												}
											})
										})
									},
									remove:function(record){
										var name = record.get("user_name");
										Ext.MessageBox.confirm("Warning","Remove '"+name+"' from this group?",function(btn){
											if (btn == 'yes') {
												C.body.mask("working...");
												Ext.Ajax.request({
													url:'?fuseaction=delete_user_group_member',
													params:{
														user_group_member_id:record.id
													},
													callback:C.cbHandler(function(result){
														if (result.success){
															C.body.unmask();
															C.infoMsg("removed '" + name + "'");
															Ext.getCmp("manage_user_group_members_grid")
																.getBottomToolbar().onClick("refresh")
														} else return false
													})
												})
											}
										})
									}
								},
								stripeRows:true,
								ds:new Ext.data.Store({
									storeId:"manage_user_group_members_grid",
									proxy: new Ext.data.HttpProxy({
										url: "?fuseaction=qry_user_group_members"
									}),
								
									reader: new Ext.data.JsonReader({
										root: "data",            
										totalProperty: "totalRows",            
										id: "user_group_member_id"            
									},
									[
										{name:'user_group_member_id'},
										{name:'user_group_id'},
										{name:'user_id'},
										{name:'user_name'}
									]),
									remoteSort: true
								}),
								columns:[
									{
										id:"user_group_member_id", 
										header: "", 
										width: 75, 
										sortable: true, 
										renderer:function(val){
											return "<span class=link>remove</span>"
										}, 
										dataIndex: 'user_group_member_id'
									},
									
									{id:"user_name", header: "User Name", dataIndex:'user_name', width: 150, sortable: true},
									{id:"user_id", header: "User Id", dataIndex:'user_id', width: 100, sortable: true}
								],
								autoExpandColumn:0,
								sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
								loadMask: true,
								tbar:[{
										xtype:"tbspacer"
									},{
										xtype:"textfield",
										id:"manage_user_group_members_search",
										enableKeyEvents: true,
										listeners:{
											keydown:function(f,e){
												if ("10,13".listContains(e.getKey()))
												Ext.getCmp("manage_user_group_members_grid").functions.search()
											}
										}
									},{
										xtype:"tbspacer"
									},{
										text:"Find in Group", 
										iconCls:"icon_search",
										handler:function(){
											Ext.getCmp("manage_user_group_members_grid").functions.search()
										}
									},{
										xtype:"tbspacer"
									},{
										xtype:"tbtext",
										text:"Add A User"
									},
										function(){
											var control =C.renderControlField("manage_user_group_members_grid","user-single","add_user","","",tabId);
											control.listeners.select =function(combo,record,index){
												var grid = Ext.getCmp("manage_user_group_members_grid")
												grid.functions.add(record.id)
											}
											return control;
										}(),
									{
										xtype:"tbfill"
									},{
										text:"Help",
										iconCls:"icon_help",
										handler:function(){
											C.showHelp("permissions_user_group_members_help")
										}
								}],
								bbar:new Ext.PagingToolbar({
									pageSize: 25,
									store: Ext.StoreMgr.get("manage_user_group_members_grid"),
									displayInfo: true,
									displayMsg: 'Displaying rows {0} - {1} of {2}',
									emptyMsg: "No rows to display"
									
								}),
								listeners: {
									beforerender:function(){
										Ext.StoreMgr.get("manage_user_group_members_grid").load();
									},
									cellclick:function(grid,rowIndex,cellIndex,e){
										var cm = grid.getColumnModel();
										var record = grid.getStore().getAt(rowIndex);
										var value = record.get(cm.getDataIndex(cellIndex))
										switch(cm.getColumnId(cellIndex)){
											case "user_group_member_id":
												grid.functions.remove(record)
											break;
										}
									},
									rowclick:function(grid,rowIndex,e){
										var record = grid.getStore().getAt(rowIndex);
									},
									rowdblclick:function(grid,rowIndex,e){
										
									}
								}	
							},{
							// manage assigned rights
								xtype:"grid",
								title:"Assigned Rights",
								width:350,
								height:300,
								//width:300,
								id:"manage_assigned_rights_grid",
								functions:{
									search:function(){
										var field = Ext.getCmp("manage_assigned_rights_search")
										var store = Ext.StoreMgr.get("manage_assigned_rights_grid")
										
										var tb = Ext.getCmp("manage_assigned_rights_grid").getBottomToolbar()
										store.baseParams.search=field.getValue();
										store.baseParams.start=0;
										tb.onClick("refresh");
									},
									add:function(right_id){
										var form = Ext.getCmp("form" + tabId).form;
										Ext.Ajax.request({
											url:"?fuseaction=add_assigned_right",
											params:{
												right_id:right_id,
												user_group_id:form.findField("user_group_id").getValue()
											},
											callback:C.cbHandler(function(result){
												if (result.success){
													var grid = Ext.getCmp("manage_assigned_rights_grid")
													grid.getStore().reload();
													C.infoMsg("Right Added.")
												}
											})
										})
									},
									remove:function(record){
										var name = record.get("name");
										Ext.MessageBox.confirm("Warning","Remove right '"+name+"' from this group?",function(btn){
											if (btn == 'yes') {
												C.body.mask("working...");
												Ext.Ajax.request({
													url:'?fuseaction=delete_assigned_right',
													params:{
														assigned_right_id:record.id
													},
													callback:C.cbHandler(function(result){
														if (result.success){
															C.body.unmask();
															C.infoMsg("Removed '" + name + "'");
															Ext.getCmp("manage_assigned_rights_grid")
																.getBottomToolbar().onClick("refresh")
														} else return false
													})
												})
											}
										})
									}
								},
								stripeRows:true,
								ds:new Ext.data.Store({
									storeId:"manage_assigned_rights_grid",
									proxy: new Ext.data.HttpProxy({
										url: "?fuseaction=qry_assigned_rights"
									}),
								
									reader: new Ext.data.JsonReader({
										root: "data",            
										totalProperty: "totalRows",            
										id: "assigned_right_id"            
									},
									[
										{name:'assigned_right_id'},
										{name:'right_id'},
										{name:'appname'},
										{name:'name'},
										{name:'description'},
										{name:'user_group_id'}
									]),
									remoteSort: true
								}),
								columns:[
									{
										id:"user_group_member_id", 
										header: "", 
										width: 75, 
										sortable: true, 
										renderer:function(val){
											return "<span class=link>remove</span>"
										}, 
										dataIndex: 'user_group_member_id'
									},
									
									{id:"name", header: "Right Name", dataIndex:'name', width: 150, sortable: true},
									{id:"appname", header: "App Name", dataIndex:'appname', width: 150, sortable: true},
									{id:"description", header: "Description", dataIndex:'description', width: 150, sortable: true}
									
								],
								autoExpandColumn:0,
								sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
								loadMask: true,
								tbar:[{
										xtype:"tbspacer"
									},{
										xtype:"textfield",
										id:"manage_assigned_rights_search",
										enableKeyEvents: true,
										listeners:{
											keydown:function(f,e){
												if ("10,13".listContains(e.getKey()))
												Ext.getCmp("manage_assigned_rights_grid").functions.search()
											}
										}
									},{
										xtype:"tbspacer"
									},{
										text:"Find in Group", 
										iconCls:"icon_search",
										handler:function(){
											Ext.getCmp("manage_assigned_rights_grid").functions.search()
										}
									},{
										xtype:"tbspacer"
									},{
										xtype:"tbtext",
										text:"Add A Right"
									},
										function(){
											var control =C.renderControlField("manage_assigned_rights_grid","right-single","add_user","","",tabId);
											control.listeners.select =function(combo,record,index){
												var grid = Ext.getCmp("manage_assigned_rights_grid")
												grid.functions.add(record.id)
											}
											return control;
										}(),
									{
										xtype:"tbfill"
									},{
										text:"Help",
										iconCls:"icon_help",
										handler:function(){
											C.showHelp("permissions_assigned_rights_help")
										}
								}],
								bbar:new Ext.PagingToolbar({
									pageSize: 25,
									store: Ext.StoreMgr.get("manage_assigned_rights_grid"),
									displayInfo: true,
									displayMsg: 'Displaying rows {0} - {1} of {2}',
									emptyMsg: "No rows to display"
								}),
								listeners: {
									beforerender:function(){
										Ext.StoreMgr.get("manage_assigned_rights_grid").load();
									},
									cellclick:function(grid,rowIndex,cellIndex,e){
										var cm = grid.getColumnModel();
										var record = grid.getStore().getAt(rowIndex);
										var value = record.get(cm.getDataIndex(cellIndex))
										switch(cm.getColumnId(cellIndex)){
											case "user_group_member_id":
												grid.functions.remove(record)
											break;
										}
									},
									rowclick:function(grid,rowIndex,e){
										var record = grid.getStore().getAt(rowIndex);
									},
									rowdblclick:function(grid,rowIndex,e){
										
									}
								}	
							}]
						}]
					}],
					listeners:{
						activate:function(){
							Ext.StoreMgr.get("manage_user_groups_grid").reload();
						}	
					}
					
					
				}
				C.addTab(center_tabs,config);

			}  
				
			center_tabs.activate(tabId)
			}
		


/* ---------------- launch_permissions -------------------------------------- */
	C.launch_permissions = function(){
		Ext.Ajax.request({
			url:"?fuseaction=get_auth_token",
			callback:C.cbHandler(function(result){
				if (result.success){
					window.open("../permissions/index.ejs?auth_token=" + encodeURIComponent(result.token));
				} else return false
			})
		})
	}
/*  */