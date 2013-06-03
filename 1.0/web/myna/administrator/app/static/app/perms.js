/*jshint unused:false*/
/*global Ext $FP appVars App  console CodeMirror*/
/*Ext.override(Ext.view.AbstractView, { 
	onRender: function() 
	{ 
		var me = this; 
		this.callOverridden(); 
		if (me.loadMask && Ext.isObject(me.store)) { 
			me.setMaskBind(me.store); 
		} 
	} 
});*/

/* ---------------- stupid xtype fix ---------------------------------------- */
	Ext.ClassManager.instantiateByAlias=function() {
		var alias = arguments[0],
		args = Array.parse(arguments),
		className = this.getNameByAlias(alias);

		if (!className) {
			className = this.maps.aliasToName[alias];
			if (!className) {
				console.log(args[1],"Config Object")
				throw new Error("Unknown xtype: " + alias)
			}


			Ext.syncRequire(className);
		}

		args[0] = className;

		return this.instantiate.apply(this, args);
	}

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
							text:"Manage Apps",
							//iconCls:"icon_edit_form",
							handler:function(c){
								var view=c.up("viewport");
								view.fireEvent("manage_apps",{
									src:view
								})
							}
									
						},{
							text:"Manage Users",
							iconCls:"icon_manage_users",
							handler:function(c){
								var view=c.up("viewport");
								view.fireEvent("manage_users",{
									src:view
								});
							}
						},{
							text:"Manage User Groups",
							iconCls:"icon_manage_user_groups",
							handler:function(c){
								var view=c.up("viewport");
								view.fireEvent("manage_user_groups",{
									src:view
								});
							}
						},{
							text:"Manage Rights",
							iconCls:"icon_manage_rights",
							handler:function(c){
								var view=c.up("viewport");
								view.fireEvent("manage_rights",{
									src:view
								});
							}
						},{
							text:"Logout",
							iconCls:"icon_logout",
							handler:function(){
								location.href=appVars.appUrl+"main/logout"
							}
					}],
					items:[{//center
						//	xtype:"panel",
							region:"center",
							frame:false,
							layout:"fit",
							border:false,
																
							tbar:[],
							id:"center_tabs",
							hidden:true,
							xtype:"tabpanel",
							autoDestroy:true,
							listeners: {
							}
								
						
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
		},
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
				
			},
		linkRenderer:function(val,meta){
			meta.tdCls="link"
			return val;
		}
	}
/* =========== General View Components ====================================== */
/* =========== User ========================================================= */
	/* ----------- Controller ----------------------------------------------- */
		controllers.push("User");
		Ext.define('App.controller.User', {
			extend: 'Ext.app.Controller',
			init: function() {
				this.control({
					viewport:{
						manage_users:function () {
							this.showUsers();
						}
					},
					user_form:{
						save_user:function (event) {
							this.saveUser(event.model,function (result) {
								if (!result.success){
									event.src.form.markInvalid(result.errors);
								} else {
									U.infoMsg("User saved.")
									event.src.form.loadRecord(event.model);
									event.src.down("user_login_grid")
										.setUserId(event.model.get("user_id"))
								}
							})
						},
						reactivate_user:function (event) {
							this.reactivateUser(event.model.get("user_id"),function (result) {
								if (result.success){
									U.infoMsg("User reactivated.")
								} else {
									alert(result.errorDetail)
								}
								event.src.form.close();
								event.src.supagrid.getStore().load()
							})
						},
						deactivate_user:function (event) {
							this.deactivateUser(event.model.get("user_id"),function (result) {
								if (result.success){
									U.infoMsg("User deactivated.")
								} else {
									alert(result.errorDetail)
								}
								event.src.form.close();
								event.src.supagrid.getStore().load()
							})
						},

					},
					user_grid:{
						add_user:function (event) {
							this.showAddLogin(event)
						},
						search:function (event) {
							var store= event.src.getStore();
							if (!store.getProxy.extraParams) store.getProxy.extraParams = {}
							store.getProxy().extraParams.search =event.value
							event.src.loadFirstPage();
						}
					},
					user_login_grid:{
						add_login:function (event) {
							this.showAddLogin(event)
						}
					},
					user_login_form:{
						
						save_login:function (event) {
							this.saveUserLogin(event.model,function (result) {
								if (!result.success){
									event.src.form.markInvalid(result.errors);
								} else {
									U.infoMsg("Login saved.")
									event.src.form.close();
								}
							})
						},
						remove_login:function (event) {
							this.removeUserLogin(event.model,function (result) {
								if (!result.success){
									alert(result.detail)
								} else {
									U.infoMsg("Login removed.")
									event.src.form.close();
								}
							})
						}
					},
					user_login_add:{
						add_user:function (event) {
							this.addUserFromAdapter(event);
						},
						search:function (event) {
							var grid =event.src.down("supagrid")
							var store = grid.getStore();
							/*var proxy = store.getProxy();
							proxy.extraParams = {
								
							}*/
							store.load({
								params:{
									type:event.src.auth_type,
									search:event.value
								}
							})
						}
					}

					
				});
			},
			addUserFromAdapter:function (event) {
				var vp = Ext.ComponentQuery.query("viewport").first();
				var userGrid = vp.down("supagrid[itemId=users]")
				$FP.User.addUserFromAdapter({
					type:event.type,
					login:event.login
				},function (result) {
					if (result.success){
						userGrid.fireEvent("search",{
							src:userGrid,
							value:result.user.user_id
						})
						U.infoMsg("User/Login added")
						event.src.close()
					} else alert(result.detail)
				})
			},
			showAddLogin:function (event) {
				/*if (event.type == "server_admin") {
					U.infoMsg("Assigning Myna Server Admin login is not allowed")
				} else */
				if (event.type == "myna") {
					if (event.user_id){
						event.src.showEditForm({user_id:event.user_id,type:"myna"})
					} else {
						event.src.showEditForm()
					}

				} else {
					Ext.widget("user_login_add",{auth_type:event.type})
				}

			},
			showUsers:function () {
				U.addCenterTab({
					id:"vUsersGrid",
					xtype:"user_grid",
					title:"Manage Users"
				})
			},
			saveUser:function (model,cb) {
				$FP.User.save(model.data,function (result) {
					if (result.success){
						model.set(result.data);
						model.commit();

					} else{
						model.reject();
					}
					cb(result)
				})
			},
			deactivateUser:function (user_id,cb) {
				$FP.User.deactivate({user_id:user_id},cb);
			},
			reactivateUser:function (user_id,cb) {
				$FP.User.reactivate({user_id:user_id},cb);
			},
			saveUserLogin:function (model,cb) {
				$FP.UserLogin.save(model.data,function (result) {
					if (result.success){
						model.set(result.data);
						model.commit();

					} else{
						model.reject();
					}
					cb(result)
				})
			},
			removeUserLogin:function (model,cb) {
				$FP.UserLogin.remove(model.data,function (result) {
					if (result.success){
						model.stores.forEach(function (store) {
							store.remove(model)
						})
					}
					cb(result)
				})
			},
		})
	/* =========== Views ==================================================== */
		/* ----------- user_grid ----------------------------------------- */
			Ext.define('App.view.UserGrid', {
				extend: 'univnm.ext.SupaGrid',
				alias:'widget.user_grid',
				
				initComponent:function () {
					var fireSearchEvent = function (trigger) {
						var view = trigger.up("user_grid")
						view.fireEvent("search",{
							src:view,
							value:trigger.getValue()
						})
					}
					Ext.apply(this,{
						itemId:"users",
						iconCls:"icon_manage_users",
						store:{
							type:"user"
						},
						viewConfig: {
							//Return CSS class to apply to rows depending upon data values
							getRowClass: function(record, index) {
								if (record.get("inactive_ts")){
									return "row_inactive"
								} else {
									return ""
								}
							}
						},
						columns:[
							{dataIndex:"user_id", renderer:U.linkRenderer},
							{dataIndex:"first_name" },
							{dataIndex:"middle_name" },
							{dataIndex:"last_name" },
							{dataIndex:"title" },
							{dataIndex:"dob" },
							{dataIndex:"country" },
							{dataIndex:"email"},
							{dataIndex:"gender" },
							{dataIndex:"language" },
							{dataIndex:"nickname" },
							{dataIndex:"postcode" },
							{dataIndex:"timezone" },
							{dataIndex:"created" },
							{dataIndex:"inactive_ts",
								renderer:function(val,meta){

								} 
							}
						].map(function (row) {
							return Ext.applyIf(row,{
								text:App.model.User.fields[row.dataIndex].label
								
							})
						}),
						//filterAutoLoad:true,
						//filterSuppressTitle:true,
						paged:true,
						tbar:[{
							xtype:"trigger",
							fieldLabel:"Search Users",
							onTriggerClick:function () {
								fireSearchEvent(this);
							},
							triggerBaseCls:"x-form-search-trigger x-form-trigger",
							enableKeyEvents:true,
							listeners:{
								keydown:function (trigger,e) {
									if (e.keyCode == 13){
										fireSearchEvent(trigger);			
									}
								}
							}
						},/*{
							text:"Add User",
							iconCls:"icon_add",
							handler:function (btn) {
								var view = btn.up("user_grid")
								view.showEditForm()
							}
						}*/
						{
								xtype:"combo",
								fieldLabel:"Add User",
								labelWidth:60,
								width:250,
								store:{
									type:"direct",
									directFn:$FP.UserLogin.getAuthTypes,
									fields:[
										"auth_type",
										"prettyName"
									],
									autoLoad:true
								},
								displayField:"prettyName",
								valueField:"auth_type",
								queryMode:"local",
								editable:false,
								listeners:{
									select:function (combo, records) {
										if (!records.length) return;
										var type = records[0].get("auth_type");
										var view = combo.up("user_grid")
										view.fireEvent("add_user",{
											src:view,
											type:type
										})
										combo.setValue("")
									}
								}
							}],
						editFormConfig:{
							xtype:"user_form",
							position:"right"
						}
					})
					this.callParent(arguments);
					this.loadFirstPage()
				}
			})
		/* ----------- user_form ----------------------------------------- */
			Ext.define('App.view.UserForm', {
				extend: 'Ext.form.Panel',
				alias:'widget.user_form',

				initComponent:function () {
					Ext.apply(this,{
						xtype:"tabpanel",
						autoScroll:true,
						iconCls:"icon_manage_users",
						frame:true,
						items:[
							{ name:"user_id", xtype:"displayfield" },
							{ name:"first_name" },
							{ name:"middle_name" },
							{ name:"last_name" },
							{ name:"title" },
							{ name:"dob" },
							{ name:"country" },
							{ name:"email" },
							{ name:"gender" },
							{ name:"language" },
							{ name:"nickname" },
							{ name:"postcode" },
							{ name:"timezone" },
							{ name:"created", 
								xtype:"displayfield", 
								setValue:function (date){
									if (!date) return
									console.log(date)
									this.setRawValue(
										date.format("m/d/Y H:i:s")
									)
								}
							},
							{ name:"inactive_ts", 
								xtype:"displayfield",
								setValue:function (date){
									if (!date) return
									console.log(date)
									this.setRawValue(
										date.format("m/d/Y H:i:s")
									)
								}
							}
						].map(function (row) {
							var f = App.model.User.fields[row.name];
							return Ext.applyIf(row,{
								fieldLabel:f.label,
								xtype:(f.jsType == "date")
									?"datefield"
									:(f.jsType == "numeric")
										?"numberfield"
										:"textfield"
								
							})
						}).concat([{
							xtype:"user_login_grid",
							title:"Logins:",
							user_id:"--------------------",
							height:250,
							width:260
						}]),
						buttons:[{
							text:"Save",
							iconCls:"icon_save",
							handler:function (btn) {
								var view = btn.up("user_form")
								var form = view.form;
								if (!form.isValid()) return;
								var model = view.form.currentRecord;
								form.updateRecord(model);

								view.fireEvent("save_user",{
									src:view,
									model:model
								})
							}
						},{
							text:"Deactivate",
							itemId:"deactivate_button",
							iconCls:"icon_delete",
							handler:function (btn) {
								var view = btn.up("user_form");
								var form = view.form;
								
								var model = view.form.currentRecord;
								if (confirm("Deactivate this user?")){
									view.fireEvent("deactivate_user",{
										src:view,
										model:model
									})	
								}
								
							}
						},{
							text:"Reactivate",
							itemId:"reactivate_button",
							iconCls:"icon_add",
							handler:function (btn) {
								var view = btn.up("user_form")
								var form = view.form;
								
								var model = view.form.currentRecord;
								view.fireEvent("reactivate_user",{
									src:view,
									model:model
								})
							}
						},{
							text:"Cancel",
							iconCls:"icon_cancel",
							handler:function (btn) {
								var form = btn.up("user_form").form
								//if inside supagrid
								if (form.close) form.close();
							}
						}]
					})
					this.callParent(arguments);
					var $this=this;
					
					this.addListener("beforegridload",function (fp,record) {

						this.down("user_login_grid").setUserId(record.get("user_id"));

						if (record.get("inactive_ts")){
							fp.down("*[itemId=reactivate_button]").show();
							fp.down("*[itemId=deactivate_button]").hide();
						} else {
							fp.down("*[itemId=reactivate_button]").hide();
							fp.down("*[itemId=deactivate_button]").show();
						}
					})
				}
			})
		/* ----------- user_login_grid ----------------------------------------- */
			Ext.define('App.view.UserLoginGrid', {
				extend: 'univnm.ext.SupaGrid',
				alias:'widget.user_login_grid',
				
				initComponent:function () {
					var $this = this;
					
					Ext.apply(this,{
						iconCls:"icon_manage_users",
						store:{
							type:"userlogin"
						},
						columns:[
							{dataIndex:"user_id",hidden:true},
							{dataIndex:"user_login_id", hidden:true},
							{dataIndex:"login"},
							{dataIndex:"type"}
						].map(function (row) {
							return Ext.applyIf(row,{
								text:App.model.UserLogin.fields[row.dataIndex].label
								
							})
						}),
						//filterAutoLoad:true,
						//filterSuppressTitle:true,
						//paged:true,
						tbar:[{
								xtype:"combo",
								fieldLabel:"Add Login",
								width:250,
								labelWidth:60,
								store:{
									type:"direct",
									directFn:$FP.UserLogin.getAuthTypes,
									fields:[
										"auth_type",
										"prettyName"
									],
									autoLoad:true
								},
								displayField:"prettyName",
								valueField:"auth_type",
								queryMode:"local",
								editable:false,
								listeners:{
									select:function (combo, records) {
										if (!records.length) return;
										var type = records[0].get("auth_type");
										var view = combo.up("user_login_grid")
										view.fireEvent("add_login",{
											src:view,
											user_id:$this.user_id,
											type:type
										})
										combo.setValue("")
									}
								}
							}],
						editFormConfig:{
							title:"Edit Login",
							xtype:"user_login_form"/*,
							position:"bottom"*/
						}
					})
					
					this.callParent(arguments);
					this.setUserId = function (user_id) {
						if (!user_id) return;
						this.user_id = user_id;
						this.getStore().getProxy().extraParams={
							user_id:user_id
						}
						//this.loadFirstPage();
						this.getStore().load();
					}
					
				}

			})
		/* ----------- user_login_form ----------------------------------------- */
			Ext.define('App.view.UserLoginForm', {
				extend: 'Ext.form.Panel',
				alias:'widget.user_login_form',
				
				initComponent:function () {
					Ext.apply(this,{
						autoScroll:true,
						iconCls:"icon_manage_users",
						frame:true,
						items:[
							//{name:"user_id", xtype:"displayfield"},
							//{name:"user_login_id", xtype:"displayfield"},
							{name:"login"},
							{name:"password", inputType: 'password', emptyText:"Password Hidden"},

							{name:"type", 
								xtype:"combo",
								disabled:true,
								store:{
									type:"direct",
									directFn:$FP.UserLogin.getAuthTypes,
									fields:[
										"auth_type",
										"prettyName"
									],
									autoLoad:true
								},
								displayField:"prettyName",
								valueField:"auth_type",
								queryMode:"local",
								editable:false
							}/*,
							{xtype:"displayfield", 
								fieldLabel:"Note",
								value:"LDAP and Myna Server Administrator <br> logins do not use the password field"
							}*/
						].map(function (row) {
							if (!row.name) return row
							var f = App.model.UserLogin.fields[row.name];
							return Ext.applyIf(row,{
								fieldLabel:f.label,
								xtype:(f.jsType == "date")
									?"datefield"
									:(f.jsType == "numeric")
										?"numberfield"
										:"textfield"
								
							})
						}),
						buttons:[{
							text:"Save",
							iconCls:"icon_save",
							handler:function (btn) {
								var view = btn.up("user_login_form")
								var form = view.form;
								if (!form.isValid()) return;
								var model = view.form.currentRecord;
								form.updateRecord(model);

								view.fireEvent("save_login",{
									src:view,
									model:model
								})
							}
						},{
							text:"Delete",
							iconCls:"icon_delete",
							handler:function (btn) {
								var view = btn.up("user_login_form");
								var model = view.form.currentRecord;
								if (confirm("Delete this login?")){
									view.fireEvent("remove_login",{
										src:view,
										model:model
									})	
								}
								
							}
						},{
							text:"Cancel",
							iconCls:"icon_cancel",
							handler:function (btn) {
								var form = btn.up("user_login_form").form
								//if inside supagrid
								if (form.close) form.close();
							}
						}]
					})
					this.callParent(arguments);
					var $this=this;
					this.addListener("beforegridload",function (fp,record) {
						if(record.get("type") != "myna") {
							fp.form.findField("password").hide();
						}
						if(record.get("type") == "server_admin") {
							U.infoMsg("Myna Server Admin logins are not editable")
							setTimeout(function () {fp.close()},0)
						}
					})
				}
			})
		/* ----------- user_login_add ----------------------------------------- */
			Ext.define('App.view.UserLoginAdd', {
				extend: 'Ext.window.Window',
				alias:'widget.user_login_add',
				title:"Add Login",
				autoShow:true,
				width:800,
				height:600,
				layout:"fit",
				//modal:true,
				initComponent:function () {
					var fireSearchEvent = function (trigger) {
						var view = trigger.up("user_login_add")
						view.fireEvent("search",{
							src:view,
							value:trigger.getValue()
						})
					}
					Ext.apply(this,{
						//frame:true,
						items:[{
							//xtype::"form",
							xtype:"supagrid",
							store:{
								type:"direct",
								directFn:$FP.UserLogin.searchByAuthType,
								fields:[
									"login",
									"first_name",
									"last_name",
									"middle_name",
									"email",
									"title"
								]
							},
							loadMask:true,
							columns:[

								{dataIndex:"login", renderer:U.linkRenderer},
								{dataIndex:"first_name"},
								{dataIndex:"last_name"},
								{dataIndex:"middle_name"},
								{dataIndex:"email"},
								{dataIndex:"title"}
							].map(function (row) {
								row.text = row.dataIndex.replace(/_/g," ").titleCap()
								return row
							}),
							tbar:[{
								xtype:"trigger",
								fieldLabel:"Search for login",
								onTriggerClick:function () {
									fireSearchEvent(this);
								},
								triggerBaseCls:"x-form-search-trigger x-form-trigger",
								enableKeyEvents:true,
								listeners:{
									keydown:function (trigger,e) {
										if (e.keyCode == 13){
											fireSearchEvent(trigger);			
										}
									}
								}
							}],
							listeners:{
								itemclick:function (grid, record) {
									var view= grid.up("user_login_add");
									view.fireEvent("add_user",{
										src:view,
										type:view.auth_type,
										login:record.get("login")
									})
								}
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
				
			})
			/*this.getController("Sql").openSql(
				U.beautifySql(
					'Select aa.answer_attachment_id, aa.request_id, aa.document, aa.filename, aa.title, aa.question_id, aa from "ORS"."ANSWER_ATTACHMENT" aa'
				)
			);*/

			
			
		}
		
	});	
