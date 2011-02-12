Ext.Ajax.timeout = 5*60*1000
var viewport;
var C ={
	body:null,
	dSstore:null,
	msgCt:null,
	currentDs:"",
	currentDbType:"other",
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
				if (text.trim().length == 0) return "";
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
		
		var oldGetValues = Ext.form.BasicForm.prototype.getValues; 
		Ext.form.BasicForm.prototype.getValues = function(asString){
			var data = oldGetValues.call(this,asString);
			if (asString){
				return data
			} else {
				var result ={}
				
				for (var fname in data) {
					result[fname] = this.findField(fname).getValue(); 
				}
				
				return result
			}
				
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
		
		Ext.Ajax.request({
			url:'permissions.ws?json-myna&method=has_active_session&appname=' + appname,
			
			waitMsg:"Authorizing...",
			callback:C.cbHandler(function(result){
				if (result.success){
					C.main();	
				} else { 
					if ("message" in result) alert(result.message);
					var url = rootUrl+"myna/auth/auth.sjs?"+[
						"fuseaction=login",
						"callback=" +String(location.href).listFirst("?"),
						"title=" +escape("Myna Permissions Login")
					].join("&")
					location.href=url
				}
			})
		})	
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
	/* ---------------- defaultActionFailed ---------------------------------- */
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
				url:"permissions.ws?json-myna&method=save",
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
	/* ---------------- showAjaxError ---------------------------------------- */
		C.showAjaxError = function(responseText){
			var text ="";
			var title ="Error: ";
			
			try{
				var result = Ext.decode(responseText);
				
				if ("message" in result){
					if (!result.detail){
						text += result.message
					} else title += result.message
					text+= result.detail
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
				title:title.left(100),
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
	/* ---------------- parseNode -------------------------------------------- */
		C.parseNode=function(nodeDesc){
			ObjectLib.setDefaultProperties(nodeDesc,{
				expanded:true
			})
			var newNode = new Ext.tree.TreeNode(nodeDesc)
			
			if (nodeDesc.children){
				newNode.leaf=false;
				nodeDesc.children.forEach(function(childDesc){
					newNode.appendChild(C.parseNode(childDesc))
				})
			} else{
				//newNode.leaf=true;
			}
			return newNode;
		}
	/* ---------------- showHelp --------------------------------------------- */
		C.showHelp=function(type){
			var win = new Ext.Window({
				width:620,
				height:240,
				closable:true,
				//frame:false,
				layout:"fit",
				title:type.replace(/_/g," ").titleCap(),
				items:[{
					frame:true,
					autoScroll:true,
					autoLoad:{url:"views/hlp_" + type + ".html"}
				}]
			})
			win.show();
		}
	/* ---------------- showWinText ------------------------------------------ */
		C.showWinText=function(title,text){
			C.showWin(title,{
				autoScroll:true,
				html:"<pre>" + text.escapeHtml() + "</pre>"
			})
			
		}
	/* ---------------- showWin ---------------------------------------------- */
		C.showWin=function(title,config){
			var body = Ext.get(document.body);
			var win=new Ext.Window({
				title:title,
				width:Math.min(body.getWidth(1)-100,800),
				height:body.getHeight(1)-100,
				closeable:true,
				layout:"fit",
				
				items:[config]
			})
			win.show()
		}
	/* ---------------- renderControl ---------------------------------------- */
		C.renderControl=function(o){
			ObjectLib.setDefaultProperties(o,{
				size:20,
				required:false,
				valid_values:null,
				label:"",
				name:"",
				search:null,
				tabId:null
			})
			
			
			var f = { 
				fieldLabel:o.label,
				xtype:"textfield",
				name:o.name,
				size:Math.min(o.size*10,150),
				maxLength:o.size,
				allowBlank:!o.required
				
			}
			if (o.isBool){
				f ={
					xtype:"combo",
					fieldLabel: o.label,
					id: o.name + o.tabId,
					hiddenName: o.name,
					
					store:new Ext.data.SimpleStore({
						fields: ['value','label'],
						data:[
							["",""],
							[1,"Yes"],
							[0,"No"]
						]
					}),
					width:50,
					displayField:'label',
					valueField:'value',
					typeAhead: false,
					mode: 'local', /* change this to local if using simpleStore*/
					triggerAction: 'all',
					emptyText:'',
					selectOnFocus:true,
					editable:false,
					allowBlank:true
				}
				
			}
			if (f.name == "detail" || f.name == "custom"){
				f.xtype="textarea";
				f.width=180;
				f.height=150;
			}
			if (o.valid_values){
				f.valid_values =o.valid_values;
				f.validator=function(val){
					if (this.valid_values.toLowerCase().listContains(String(val).toLowerCase())){
						return true;
					} else {
						return "<div style:'whitespace:nowrap'>"+this.fieldLabel + " must be one of '" + this.valid_values + "'</div>"
					}
				}
			}
			if (o.search){
				var name_col;
				switch (o.search){
					case "service":
						name_col ="service_description"
					break;
					default:
						name_col = o.search+"_name"
				}
				f = {
					xtype:"panel",
					
					width:210,
					defaults:{
						labelStyle:"font-weight:bold",
						width:180,
						xtype:"textfield"
					},
					items:[{
						xtype:"panel",
						bodyStyle:"font-weight:bold",
						html:o.name.titleCap()
					},{ 
						xtype:"combo",
						id: o.search +"_lookup" + o.name +o.tabId,
						queryParam:"search",
						store:new Ext.data.Store({
							storeId:o.search +"_lookup" + o.name +o.tabId,
							proxy: new Ext.data.HttpProxy({
								url: 'permissions.ws?json-myna&method=qry_' +o.search 
							}),
						
							reader: new Ext.data.JsonReader({
								id: o.search +"_id" ,
								root:"data",
								totalProperty:"totalRows"
							},
							[
								{name:o.search +'_id'},
								{name:name_col}
							])
						}),
						minChars:1,
						displayField:name_col,
						triggerClass:"icon_search",
						valueField:o.search +'_id',
						typeAhead: false,
						mode: 'remote', 
						listWidth:250,
						triggerAction: 'all',
						emptyText:'Find/Add  a ' +o.search,
						selectOnFocus:true,
						editable:true,
						allowBlank:true,
						tabId:o.tabId,
						obj_type:o.search,
						listeners:{
							select:function(combo,record,index){
								var f = Ext.getCmp(o.name + this.tabId);
								var cur_val =f.getValue();
								cur_val = cur_val.listAppendUniqueNoCase(record.get(name_col));
								f.setValue(cur_val);
								//combo.clearValue();
								window.setTimeout(function(){combo. selectText()},100)
							}
						}
					},{
						/* xtype:"hidden",
						id:o.name + o.tabId,
						o.name + o.tabId
					},{ */
						xtype:"textarea",
						fieldLabel:o.name,
						name:o.name,
						height:150,
						setValue:function(value){
							value = value.split(/,/);
							value = value.sort();
							value = value.join("\n");
							
							this.setRawValue(value);
						},
						getValue:function(value){
							return this.getRawValue().replace(/\s*\n+\s*/g,",");
						},
						id:o.name + o.tabId 
						
					}]
							
				}
			}
			return f;
			
		}
	/* ---------------- renderControlField ----------------------------------- */
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
								url: 'permissions.ws?json-myna&method=qry_rights&appname=' + appname
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
						selectOnFocus:true,
						/* width: 207, */ 
						value:value,
						minChars:1,
						allQuery:"%",
						triggerAction:"all",
						emptyText:'search...',
						queryParam:"search",
						//triggerClass:"x-form-search-trigger",
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
								url: 'permissions.ws?json-myna&method=search_users&providers=' + providers
							}),
							reader: new Ext.data.JsonReader({
								root:"data",
								totalProperty:'totalRows'
							}, [
								{name: 'first_name'},
								{name: 'last_name'},
								{name: 'middle_name'},
								{name: 'login'},
								{name: 'email'},
								{name: 'type'}
							])
						}),
						fieldLabel:label,
						displayField:'name',
						valueField:'login', 
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
								'<tr class="search-header">',
									'<td>',
									'Name',
									'</td>',
									'<td>',
										'Type',
									'</td>',
									'<td>',
										'Username',
									'</td>',
									'<td>',
										'email',
									'</td>',
								'</tr>',
								'<tpl for=".">',
								'<tr class="search-item">',
									'<td>',
									'{first_name} {middle_name} {last_name}',
									'</td>',
									'<td>',
										'{type}',
									'</td>',
									'<td>',
										'{login}',
									'</td>',
									'<td>',
										'{email}',
									'</td>',
								'</tr>',
								'</tpl>',
							'</table>'
						),
						/* pageSize:15, */ 
						listWidth:800,
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
										url: 'permissions.ws?json-myna&method=search_users'
									}),
									reader: new Ext.data.JsonReader({
										id: 'userid'
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
												url:"permissions.ws?json-myna&method=qry_userids",
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
/* ---------------- login --------------------------------------------------- */
	C.login=function(){
		var win=new Ext.Window({
			layout:'fit',
			width:300,
			height:180,
			closeAction:'hide',
			closable:false,
			plain: true,
			title: prettyName +' Login',
			items:[{
				xtype:"form",
				labelWidth: 75, // label settings here cascade unless overridden
				frame:true,
				id:"login_form",
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
							url:'permissions.ws?json-myna&method=auth',
							params:{
								appname:appname,
								username:Ext.getCmp("username").getValue(),
								password:Ext.getCmp("password").getValue()
							},
							waitMsg:"Authenticating...",
							callback:C.cbHandler(function(result){
								if (result.success){
									win.hide();
									C.main();
								} else {
									Ext.getCmp("login_form").form.markInvalid(result.errors)	
								}
							})
						})
					}
				},
				//floating:true,
				items: [{
					fieldLabel: 'Username',
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
			var pwd =Ext.getCmp("username")
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
				layout:"border",
				border:false,
				/* tbar:[{
					xtype:"tbtext",
					text:prettyName
					},{
						
						xtype:"tbfill"
					},function(){
						if (appname=="myna_admin") return {
							text:"Manage Apps",
							handler:C.apps_main
						}
						else return {
							xtype:"tbspacer"
							
						}
					}(),function(){
						if (appname=="myna_admin") return {
							text:"Manage Users",
							handler:C.edit_users
						}
						else return {
							xtype:"tbspacer"
							
						}
					}()
					,{
						text:"Manage User Groups",
						handler:C.user_groups_main
					},function(){
						if (appname=="myna_admin") return {
							text:"Manage Rights",
							handler:C.rights_main
						}
						else return {
							xtype:"tbspacer"	
						}
					}(),{
					text:"logout",
					handler:function(){
						Ext.Ajax.request({
							url:'permissions.ws?json-myna&method=logout',
							waitMsg:"Logging out...",
							callback:function(){
								location.href=location.href;
							}
						})	
					}
				}], */
				items:[{
					region:"center",
					id:"center_tabs",
					hidden:true,
					plain:"true",
					enableTabScroll:true,
					xtype:"tabpanel",
					deferredRender:false,
					layoutOnTabChange:true,
					autoDestroy:true
					
				}]
				
			},{
				/* north titlebar*/
				region:"north",
				height:40,
				//autoHeight:true,
				frame:true,
				layout:{
					type:"hbox",
					defaultMargins:"2",//{top:0, right:2, bottom:0, left:2}
				},
				defaults:{
					xtype:"button",
					border:false,
					bodyStyle:"padding:2px"
				},
				items:[{
						xtype:"panel",
						html:prettyName,
						bodyStyle:{
							"font-weight":"bold",
							"font-style":"italic",
							"font-size":"14pt"
						},
						flex:1
					},function(){
						if (appname=="myna_admin") return {
							text:"Manage Apps",
							handler:C.apps_main
						}
						else return {
							xtype:"tbspacer"
							
						}
					}(),function(){
						if (appname=="myna_admin") return {
							text:"Manage Users",
							handler:C.edit_users
						}
						else return {
							xtype:"tbspacer"
							
						}
					}()
					,{
						text:"Manage User Groups",
						handler:C.user_groups_main
					},function(){
						if (appname=="myna_admin") return {
							text:"Manage Rights",
							handler:C.rights_main
						}
						else return {
							xtype:"tbspacer"	
						}
					}(),{
					text:"logout",
					handler:function(){
						Ext.Ajax.request({
							url:'permissions.ws?json-myna&method=logout',
							waitMsg:"Logging out...",
							callback:function(){
								location.href=location.href;
							}
						})	
					}
				}]
			}]
		}
		viewport = new Ext.Viewport(config);	
		
	}
/* ---------------- apps_main --------------------------------------------- */
	C.apps_main=function(){
		var center_tabs = Ext.getCmp("center_tabs");
		var tabId="manage_apps_main";
		if (!center_tabs.findById(tabId)){
			var config ={
				id:tabId,
				closable:true,
				title:"Manage Apps",
				layout:"border",
				items:[{
					region:"center",
					xtype:"grid",
					id:"manage_apps_grid",
					functions:{
						search:function(){
							var field = Ext.getCmp("manage_apps_search")
							var store = Ext.StoreMgr.get("manage_apps_grid")
							var tb = Ext.getCmp("manage_apps_grid").getBottomToolbar()
							store.baseParams.search=field.getValue();
							store.baseParams.start=0;
							tb.onClick("refresh");
						}
					},
					stripeRows:true,
					ds:new Ext.data.Store({
						storeId:"manage_apps_grid",
						proxy: new Ext.data.HttpProxy({
							url: "permissions.ws?json-myna&method=qry_apps"
						}),
					
						reader: new Ext.data.JsonReader({
							root: "data",            
							totalProperty: "totalRows",            
							id: "appname"            
						},
						[
							{name:'appname'},
							{name:'description'},
							{name:'inactive_ts'},
							{name:'display_name'}	
						]),
						remoteSort: true
					}),
					columns:[
						{id:"appname", header: "Appname", dataIndex:'appname', width: 100, sortable: true, renderer:C.linkRenderer},
						{id:"display_name", header: "Display Name", dataIndex:'display_name', width: 100, sortable: true},
						{id:"description", header: "Description", dataIndex:'description', width: 100, sortable: true},
						{id:"inactive_ts", header: "Inactive Date", dataIndex:'inactive_ts', width: 100, sortable: true}
					],
					autoExpandColumn:0,
					sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
					loadMask: true,
					tbar:[{
						xtype:"tbspacer"
					},{
						xtype:"textfield",
						id:"manage_apps_search",
						enableKeyEvents: true,
						listeners:{
							keydown:function(f,e){
								if ("10,13".listContains(e.getKey()))
								Ext.getCmp("manage_apps_grid").functions.search()
							}
						}
					},{
						xtype:"tbspacer"
					},{
						text:"Search", 
						iconCls:"icon_search",
						handler:function(){
							Ext.getCmp("manage_apps_grid").functions.search()
						}
					},{
						xtype:"tbseparator"
					},{
						text:"Add App",
						iconCls:"icon_add",
						handler:function(){
							var formPanel = Ext.getCmp("form" + tabId);
							formPanel.functions.loadForm()
						}
					},{
						xtype:"tbfill"
					}/* ,{
						text:"Help",
						iconCls:"icon_help",
						handler:function(){
							C.showHelp("permissions_apps_help")
						}
					} */],
					bbar:new Ext.PagingToolbar({
						pageSize: 25,
						store: Ext.StoreMgr.get("manage_apps_grid"),
						displayInfo: true,
						displayMsg: 'Displaying rows {0} - {1} of {2}',
						emptyMsg: "No rows to display"
					}),
					listeners: {
						beforerender:function(){
							Ext.StoreMgr.get("manage_apps_grid").load();
						},
						cellclick:function(grid,rowIndex,cellIndex,e){
							var cm = grid.getColumnModel();
							var record = grid.getStore().getAt(rowIndex);
							var value = record.get(cm.getDataIndex(cellIndex))
							switch(cm.getColumnId(cellIndex)){
								case "appname":
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
						loadForm:function(appname){
							Ext.Ajax.request({
								url:"permissions.ws?json-myna&method=get_app_data",
								params:{appname:appname||""},
								waitMsg:"Loading...",
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
									url:"permissions.ws?json-myna&method=save_app_data",
									params:data,
									waitMsg:"Saving...",
									callback:C.cbHandler(function(result){
										if (result.success){
											Ext.StoreMgr.get("manage_apps_grid").reload();
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
										url:"permissions.ws?json-myna&method=delete_app",
										params:{
											appname:data.appname											},
										waitMsg:"Removing...",
										callback:C.cbHandler(function(result){
											if (result.success){
												Ext.StoreMgr.get("manage_apps_grid").reload();
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
						{name:"appname", width:250,  fieldLabel:"Appname", maxLength:255,  id:"appname" + tabId },
						{name:"display_name", width:250,  fieldLabel:"Display Name", maxLength:255,  id:"display_name" + tabId },
						{name:"description", xtype:"textarea", width:250,  fieldLabel:"Description", maxLength:255,  id:"description" + tabId }
						
					],
					buttons:[{
						text:"Save/Reactivate",
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
						Ext.StoreMgr.get("manage_apps_grid").reload();
					}	
				}
				
				
			}
			C.addTab(center_tabs,config);
	
		}  
			
		center_tabs.activate(tabId)
	}
/* ---------------- edit_users ---------------------------------------------- */
	C.edit_users=function(){
		var tabId="manage_users_main";
		var center_tabs = Ext.getCmp("center_tabs");
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
							url: "permissions.ws?json-myna&method=qry_users"
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
							{
								name:'inactive_ts',
								type:"date",
								dateFormat:"m/d/Y H:i:s"
							},
							{name:'last_name'},
							{name:'middle_name'},
							{name:'title'},
							
							{name:'country'},
							{name:'created'},
							{name:'dob'},
							{name:'email'},
							{name:'gender'},
							{name:'language'},
							{name:'nickname'},
							{name:'postcode'},
							{name:'timezone'},
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
						{id:"country", header: "Country", dataIndex:'country', width: 20, sortable: true},
						
						{id:"dob", header: "DOB", dataIndex:'dob', width: 40, sortable: true},
						{id:"email", header: "Email", dataIndex:'email', width: 40, sortable: true},
						{id:"gender", header: "Gender", dataIndex:'gender', width: 20, sortable: true},
						{id:"language", header: "Language", dataIndex:'language', width: 20, sortable: true},
						{id:"nickname", header: "Nickname", dataIndex:'nickname', width: 50, sortable: true},
						{id:"postcode", header: "Postcode", dataIndex:'postcode', width: 30, sortable: true},
						{id:"timezone", header: "Timezone", dataIndex:'timezone', width: 30, sortable: true},
						{id:"logins", header: "Login Names", dataIndex:'logins', width: 300, sortable: true},
						{id:"created", header: "Created", dataIndex:'created', width: 100, sortable: true},
						{id:"inactive_ts", renderer:Ext.util.Format.dateRenderer("m/d/Y H:i:s"), header: "Inactive Date", dataIndex:'inactive_ts', width: 100, sortable: true}
						
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
					}/* ,{
						text:"Help",
						iconCls:"icon_help",
						handler:function(){
							C.showHelp("permissions_users_help")
						}
					} */],
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
								url:"permissions.ws?json-myna&method=get_user_data",
								params:{user_id:user_id||0},
								waitMsg:"Loading...",
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
						save:function(callback){
							var formPanel = Ext.getCmp("form" + tabId);
							var form = formPanel.form;
							
							if (form.isValid()){
								var data = form.getValues();
								/* delete data.created;
								delete data.created; */
								Ext.Ajax.request({
									url:"permissions.ws?json-myna&method=save_user_data",
									params:data,
									waitMsg:"Saving...",
									callback:C.cbHandler(function(result){
										if (result.success){
											Ext.StoreMgr.get("manage_users_grid").reload();
											formPanel.functions.close();
											if (callback) callback();
										} else return false
									})
											
								})
							}
						},
						remove:function(){
							Ext.MessageBox.confirm("Warning","Inactivate this user?",function(btn){
								if (btn == 'yes') {
									var formPanel = Ext.getCmp("form" + tabId);
									var form = formPanel.form;
									
									var data = form.getValues();
									Ext.Ajax.request({
										url:"permissions.ws?json-myna&method=delete_user",
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
						{name:"inactive_ts", width:250, disabled:true, fieldLabel:"Inactive Date", readOnly:true, cls:"readonly_field", maxLength:23,  id:"inactive_ts" + tabId },
						{name:"title", width:250,  fieldLabel:"Title", maxLength:255,  id:"title" + tabId },
						{name:"first_name", width:250,  fieldLabel:"First Name", maxLength:255,  id:"first_name" + tabId },
						{name:"middle_name", width:250,  fieldLabel:"Middle Name", maxLength:255,  id:"middle_name" + tabId },
						{name:"last_name", width:250,  fieldLabel:"Last Name", maxLength:255,  id:"last_name" + tabId },
						{name:"country", width:250,  fieldLabel:"Country", maxLength:255,  id:"country" + tabId },
						{name:"dob", width:250,  xtype:"datefield", fieldLabel:"DOB", maxLength:255,  id:"dob" + tabId },
						{name:"email", width:250,  fieldLabel:"Email", maxLength:255,  id:"email" + tabId },
						{name:"gender", width:250,  fieldLabel:"Gender", maxLength:255,  id:"gender" + tabId },
						{name:"language", width:250,  fieldLabel:"Language", maxLength:255,  id:"language" + tabId },
						{name:"nickname", width:250,  fieldLabel:"Nickname", maxLength:255,  id:"nickname" + tabId },
						{name:"postcode", width:250,  fieldLabel:"Postcode", maxLength:255,  id:"postcode" + tabId },
						{name:"timezone", width:250,  fieldLabel:"Timezone", maxLength:255,  id:"timezone" + tabId },
						
						{name:"logins", xtype:"textarea", disabled:true, width:250,   fieldLabel:"Logins",  readOnly:true, cls:"readonly_field",  id:"logins" + tabId }
					],
					buttons:[{
						text:"Save/Reactivate",
						iconCls:"icon_save",
						handler:function(){
							Ext.getCmp("form" + tabId).functions.save();
							
						}
					},{
						text:"Edit Logins",
						iconCls:"icon_edit_form",
						handler:function(){
							var formPanel = Ext.getCmp("form" + tabId);
							formPanel.functions.save(function(){
								C.user_logins_main(formPanel.form.getValues());
							});
							//formPanel.functions.close();
							
						}
					},{
						text:"Inactivate",
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

/* ---------------- user_logins_main ---------------------------------------- */
	C.user_logins_main=function(user){
		var user_id = user.user_id;
		var center_tabs = Ext.getCmp("center_tabs");
		var tabId="manage_user_logins_main" + user.user_id;
		if (!center_tabs.findById(tabId)){
			var config ={
				id:tabId,
				closable:true,
				title:"Logins for " + user.first_name + " " + user.last_name,
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
							url: "permissions.ws?json-myna&method=qry_user_logins&user_id=" + user_id
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
							{name:'first_name'},
							{name:'middle_name'},
							{name:'last_name'},
							{name:'type'},
							{name:'user_id'}	
						]),
						remoteSort: true
					}),
					columns:[
						{id:"user_login_id", header: "user_login_id", width: 150, sortable: true, renderer:C.linkRenderer, dataIndex: 'user_login_id'},
						{id:"login", header: "Login", dataIndex:'login', width: 100, sortable: true},
						{id:"type", header: "Type", dataIndex:'type', width: 100, sortable: true},
						{id:"first_name", header: "First Name", dataIndex:'first_name', width: 50, sortable: true},
						{id:"middle_name", header: "Middle Name", dataIndex:'middle_name', width: 30, sortable: true},
						{id:"last_name", header: "Last Name", dataIndex:'last_name', width: 100, sortable: true},
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
					}/* ,{
						text:"Help",
						iconCls:"icon_help",
						handler:function(){
							C.showHelp("permissions_user_logins_help")
						}
					} */],
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
								url:"permissions.ws?json-myna&method=get_user_login_data",
								params:{user_login_id:user_login_id||0},
								waitMsg:"Loading...",
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
									url:"permissions.ws?json-myna&method=save_user_login_data",
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
										url:"permissions.ws?json-myna&method=delete_user_login",
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
						//{name:"type", width:250,  fieldLabel:"Auth Type", maxLength:255,  id:"type" + tabId },
						{
							xtype:"combo",
							fieldLabel: "Auth Type",
							id: "type",
							name: "type",
							store:new Ext.data.SimpleStore({
								fields: ['value'],
								data:authTypes.map(function(type){
									return [type];
								})
							}),
							width:150,
							listWidth:150,
							displayField:'value',
							valueField:'value', 
							typeAhead: false,
							mode: 'local',
							triggerAction: 'all',
							emptyText:'',
							selectOnFocus:true,
							editable:false,
							allowBlank:false
						},
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
/* ---------------- user_groups_main ---------------------------------------- */
	C.user_groups_main=function(){
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
							url: "permissions.ws?json-myna&method=qry_user_groups&appname=" + appname
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
						{id:"appname", hidden:appname!="myna_admin", header: "Appname", dataIndex:'appname', width: 100, sortable: true},
						{id:"name", header: "Name", dataIndex:'name', width: 100, sortable: true},
						{id:"description", header: "Description", dataIndex:'description', width: 300, sortable: true}
						
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
						}/* ,{
							text:"Help",
							iconCls:"icon_help",
							handler:function(){
								C.showHelp("permissions_user_groups_help")
							}
					} */],
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
						id:"user_group_tab_panel",
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
										url:"permissions.ws?json-myna&method=get_user_group_data&appname=" + appname,
										params:{user_group_id:user_group_id||0},
										waitMsg:"Loading...",
										callback:C.cbHandler(function(result){
											if (result.success){
												var eastPanel = Ext.getCmp("east_panel" + tabId);
												var form = Ext.getCmp("form" + tabId).form;
												form.setValues(result.data);
												
												eastPanel.show();
												eastPanel.ownerCt.doLayout();
												Ext.getCmp("user_group_tab_panel").activate(0);
											} else return false;
										})
									})
								},
								save:function(){
									var eastPanel = Ext.getCmp("east_panel" + tabId);
									var wait = Ext.Msg.wait("Saving...")
									this.quickSave(function(){
										eastPanel.functions.close()
										wait.hide();
									})
								},
								quickSave:function(callback){
									var formPanel = Ext.getCmp("form" + tabId);
									var eastPanel = Ext.getCmp("east_panel" + tabId);
									var form = formPanel.form;
									
									if (form.isValid()){
										var data = form.getValues();
										Ext.Ajax.request({
											url:"permissions.ws?json-myna&method=save_user_group_data",
											params:data,
											
											callback:C.cbHandler(function(result){
												if (result.success){
													Ext.StoreMgr.get("manage_user_groups_grid").reload();
													if (callback) callback();
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
												url:"permissions.ws?json-myna&method=delete_user_group",
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
								labelStyle:"font-weight:bold",
								listeners:{
									change:function(){
										Ext.getCmp("form" + tabId).functions.quickSave();
									}
								}
							},
							bodyStyle:"padding:10px;",
							items:[
								{name:"user_group_id", width:250, id:"user_group_id" + tabId, fieldLabel:"User Group Id", readOnly:true, cls:"key_field" },
								{name:"appname", width:250, allowBlank:false, fieldLabel:"Appname", maxLength:255,  id:"appname" + tabId },
								{name:"name", width:250, allowBlank:false, fieldLabel:"Name", maxLength:255,  id:"name" + tabId },
								{name:"description", width:250, xtype:"textarea",  fieldLabel:"Description", maxLength:255,  id:"description" + tabId }
								
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
								add:function(record){
									var form = Ext.getCmp("form" + tabId).form;
									var data = record.data;
									data.user_group_id=form.findField("user_group_id").getValue();
									Ext.Ajax.request({
										url:"permissions.ws?json-myna&method=add_user_group_member&appname=" + appname,
										params:record.data,
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
												url:'permissions.ws?json-myna&method=delete_user_group_member',
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
								},
								loadStore:function(){
									var user_group_id =Ext.getCmp("user_group_id" + tabId).getValue();
									var store = Ext.StoreMgr.get("manage_user_group_members_grid");
									store.baseParams={
										user_group_id:user_group_id
									}
									store.load();
								}
							},
							stripeRows:true,
							ds:new Ext.data.Store({
								storeId:"manage_user_group_members_grid",
								proxy: new Ext.data.HttpProxy({
									url: "permissions.ws?json-myna&method=qry_user_group_members" 
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
									{name:'user_name'},
									{name:'first_name'},
									{name:'middle_name'},
									{name:'last_name'},
									{name:'logins'}
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
								
								{id:"first_name", header: "First Name", dataIndex:'first_name', width: 50, sortable: true},
								{id:"middle_name", header: "Middle Name", dataIndex:'middle_name', width: 30, sortable: true},
								{id:"last_name", header: "Last Name", dataIndex:'last_name', width: 100, sortable: true},
								{id:"logins", header: "Logins", dataIndex:'logins', width: 250, sortable: false},
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
											grid.functions.add(record)
										}
										return control;
									}(),
								{
									xtype:"tbfill"
								}/* ,{
									text:"Help",
									iconCls:"icon_help",
									handler:function(){
										C.showHelp("permissions_user_group_members_help")
									}
							} */],
							bbar:new Ext.PagingToolbar({
								pageSize: 25,
								store: Ext.StoreMgr.get("manage_user_group_members_grid"),
								displayInfo: true,
								displayMsg: 'Displaying rows {0} - {1} of {2}',
								emptyMsg: "No rows to display"
								
							}),
							listeners: {
								activate:function(grid){
									Ext.getCmp("form" + tabId).functions.quickSave();
									grid.functions.loadStore();
								},
								beforerender:function(grid){
									grid.functions.loadStore();
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
										url:"permissions.ws?json-myna&method=add_assigned_right&appname=" + appname,
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
												url:'permissions.ws?json-myna&method=delete_assigned_right',
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
									url: "permissions.ws?json-myna&method=qry_assigned_rights"
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
								
								{id:"name", header: "Right Name", dataIndex:'name', width: 100, sortable: true},
								{id:"appname", header: "App Name", dataIndex:'appname', width: 75, sortable: true},
								{id:"description", header: "Description", dataIndex:'description', width: 250, sortable: true}
								
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
								}/* ,{
									text:"Help",
									iconCls:"icon_help",
									handler:function(){
										C.showHelp("permissions_assigned_rights_help")
									}
							} */],
							bbar:new Ext.PagingToolbar({
								pageSize: 25,
								store: Ext.StoreMgr.get("manage_assigned_rights_grid"),
								displayInfo: true,
								displayMsg: 'Displaying rows {0} - {1} of {2}',
								emptyMsg: "No rows to display"
							}),
							listeners: {
								activate:function(){
									Ext.getCmp("form" + tabId).functions.quickSave();
									var user_group_id=Ext.getCmp("user_group_id" + tabId).getValue();
									var store =Ext.StoreMgr.get("manage_assigned_rights_grid");
									store.baseParams={
										user_group_id:user_group_id
									}
									store.load();
								},
								beforerender:function(){
									
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
/* ---------------- rights_main --------------------------------------------- */
	C.rights_main=function(){
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
							url: "permissions.ws?json-myna&method=qry_rights"
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
					}/* ,{
						text:"Help",
						iconCls:"icon_help",
						handler:function(){
							C.showHelp("permissions_rights_help")
						}
					} */],
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
								url:"permissions.ws?json-myna&method=get_right_data&appname=" + appname,
								params:{right_id:right_id||0},
								waitMsg:"Loading...",
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
									url:"permissions.ws?json-myna&method=save_right_data",
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
										url:"permissions.ws?json-myna&method=delete_right",
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
						{name:"description", xtype:"textarea", width:250,  fieldLabel:"Description", maxLength:255,  id:"description" + tabId }
						
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
	
/* */