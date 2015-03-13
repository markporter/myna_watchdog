/*global 
	Ext:true 
	title:true 
	version:false 
	appUrl:false 
	rootUrl:false 
	latestVersion:false 
	$FP:false 
	App:true 
	dbProperties:false 
	$O:false 
	console:false 
	hostName:false 
	instance_id:false 
	instance_purpose:false

*/

Ext.JSON.encodeDate = function(d) {
    return '"\/Date(' +d.getTime() +')\/"';
};
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
							text:"<div class='app_title'>{0} ({1})</div>".format(displayName,title)
						},{
							xtype:"tbfill"
						},{
							xtype:"tbtext",
							text:"&nbsp;".repeat(10)
						},{
							
							xtype:"tbfill"
						},{
							text:"Logout",
							iconCls:"icon_logout",
							handler:function(){
								location.href=appUrl+"main/logout";
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
								xtype:"tabpanel",
								autoDestroy:true,
								defaults:{
									iconCls:"icon_form"
								},
								items:[/*{
									xtype:"service_status_grid",
									title:"Service Status"
								},*/{
									xtype:"view_service_main",
									title:"Manage Services"
								},{
									xtype:"view_setting_main",
									title:"Manage Settings",
									iconCls:"icon_cog"
								}],
								listeners: {
								}
								
							}]
						
						}]
				}]
			});
			this.callParent(arguments);
		}
	});
/* ----------- "U": local utility functions --------------------------------- */
	var U = {
		directMask:function(panel,text,func){
			var dom;
			var errorMsg = "App.directMask: " + String(panel) + " is not a valid panel";
			if (panel instanceof Ext.panel.Panel){
				dom = panel.getEl();
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
			dom.mask(text);
			return function(){
				dom.unmask();
				return func.apply(this,Array.parse(arguments));
			};
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
		//link renderer
		link:function(val,meta){
			meta.tdCls = "link";
			return val;
		},
		tipRender:function(val,meta){
			if (val || val === 0){
				meta.tdAttr ='data-qtip="{0}"'.format(val);
			}
			return val;
		},
		getUuid:function () {
			if (!this._UUID_GENERATOR_)	{
				this._UUID_GENERATOR_ = new Ext.data.UuidGenerator()
			}
			return this._UUID_GENERATOR_.generate()
		}
	};
/* =========== General View Components ====================================== */
	/* ----------- cronedit -------------------------------------------------- */
		Ext.define('Ext.ux.DateTime', {
			extend: 'Ext.form.FieldContainer',
			//extend: 'Ext.panel.Panel',
			alias:'widget.datetime',
			timeFormat:"h:i A",
			dateFormat:"m/d/Y",
			initComponent:function(){
				var comp = this;
				Ext.apply(this,{
					layout:{
						type:"hbox"
					},
					items:[{
						xtype:"hidden",
						name:this.name,
						setValue:function(date){
							if (typeof date == "string"){
								date = Date.parseDate(date,"{0} {1}".format(
									comp.dateFormat,
									comp.timeFormat
								));	
							}
							var d = comp.down("datefield");
							var t = comp.down("timefield");
							if (d&&t){
								d.setValue(date);
								if (date){
									t.setValue(date.format("H:i"));
								}
							}
						},
						getValue:function(){
							var d = comp.down("datefield").getValue();
							if (!d) return d;
							var t = comp.down("timefield").getRawValue();
							d= d.add(Date.HOURS,t.listFirst(":"));
							d= d.add(Date.MINUTES,t.listLast(":"));
							return d;
						}
					},{
						flex:1.5,
						xtype:"datefield",
						format:this.dateFormat,
						value:this.value?this.value.format(this.dateFormat):undefined
					},{
						style:"margin-left:2px",
						flex:1,
						xtype:"timefield",
						format:this.timeFormat,
						value:this.value?this.value.format(this.timeFormat):undefined
					}]
				});
				this.callParent(arguments);
			}
		});
/* =========== Setting ============================================= */
	/* ----------- Controller ------------------------------------------------ */
		Ext.define('App.controller.Setting', {
			extend: 'Ext.app.Controller',
			init: function() {
				this.control({
					view_setting_main:{
						save_settings:function (event) {
							this.saveSettings(event.model,function (result) {
								if (result.success){
									event.src.form.loadRecord(event.model)
									U.infoMsg("Settings Saved.");
								}else{
									event.src.form.markInvalid(result.errors);
									if (result.message) U.infoMsg("Error:" +result.message);
								}

							})
						},
						test_ldap:function (event) {
							var $this = this;
							this.saveSettings(event.model,function (result) {
								if (result.success){
									event.src.form.loadRecord(event.model)
									$this.testLdap(event.username,function (result) {
										U.infoMsg(result.message)
									})

								}else{
									event.src.form.markInvalid(result.errors);
									if (result.message) U.infoMsg("Error:" +result.message);
								}

							})
						}
					}
					
				});
			},
			saveSettings:function (model,cb) {
				$FP.Setting.save(model.data,cb)
			},
			testLdap:function (username,cb) {
				$FP.Setting.testLdap({
					username:username
				},cb)
			}
			
		});
	/* =========== Views ===================================================== */
		/* ----------- setting_main ------------------------------------------------- */
			Ext.define('App.view.setting.Main', {
				extend: 'Ext.form.Panel',
				alias:'widget.view_setting_main',
				title:"Data Sources",
				//layout:"fit",
				autoScroll:true,
				frame:true,
				
				
				initComponent:function(){
					Ext.apply(this,{

						items:[{
							xtype:"panel",
							border:false,
							//title:"LDAP/Active Directory Config",
							layout:{
								type:"hbox",
								align:"stretch"
							},
							defaults:{
								frame:true
							},
							items:[{//left col
								flex:1,
								title:"LDAP Settings",
								layout:{
									type:"vbox",
									align:"stretch"
								},
								defaults:{
									xtype:"textfield",
									labelAlign:"top",
									anchor:"95%"
								},
								items:[
									{
										xtype:"textfield",
										name:"adapter/prettyName",
										fieldLabel:"AuthType description",
										value:"Watchdog Login"
									},{
										xtype:"textfield",
										name:"adapter/desc",
										fieldLabel:"Login Prompt",
										value:"Login using your Active Directory domain credentials"
									},{
										xtype:"textfield",
										name:"adapter/ad_domain",
										labelAlign:"top",
										fieldLabel:"AD Domain (leave blank if not using Active Directory)"
									},{
										xtype:"textfield",
										name:"adapter/server",
										fieldLabel:"LDAP URL (use ldaps for secure)",
										value:"ldaps://domain.example.com/dc=domain,dc=example,dc=com"
									},{
										xtype:"textfield",
										name:"adapter/filter",
										fieldLabel:"User Filter (used to only match users)",
										value:"(sAMAccountType=805306368)"
									},{
										xtype:"textfield",
										name:"adapter/group_filter",
										fieldLabel:"Group Filter (used to only match only groups)",
										value:"(objectCategory=group)"
									},{
										xtype:"textfield",
										name:"adapter/search_columns",
										fieldLabel:"Search Attributes (used for finding users, comma separated)",
										value:"cn,givenName,sn"
									},{
										xtype:"textfield",
										name:"adapter/username",
										fieldLabel:"Username for searches"
									},{
										xtype:"textfield",
										inputType:"password",
										name:"adapter/password",
										fieldLabel:"Password for search user"
									},{
										xtype:"fieldset",
										title:"LDAP Attribute Map",
										width:300,
										defaults:{
											xtype:"textfield",
											labelAlign:"left",
											width:250
										},
										items:[
											{
												fieldLabel:"First Name",
												name:"adapter/map/first_name",
												value:"givenName"
											},{
												fieldLabel:"Last Name",
												name:"adapter/map/last_name",
												value:"sn"
											},{
												fieldLabel:"Middle Name",
												name:"adapter/map/middle_name",
												value:"initials"
											},{
												fieldLabel:"Username",
												name:"adapter/map/login",
												value:"sAMAccountName"
											},{
												fieldLabel:"Title",
												name:"adapter/map/title",
												value:"title"
											},{
												fieldLabel:"Email",
												name:"adapter/map/email",
												value:"mail"
											},{
												fieldLabel:"Group Name",
												name:"adapter/map/group_name",
												value:"cn"
											},{
												fieldLabel:"Group Member",
												name:"adapter/map/group_member",
												value:"member"
											}
										]
									}
								]
							},{//right col

								flex:1,
								layout:{
									type:"vbox",
									align:"stretch"
								},
								defaults:{
									frame:true,
									flex:true,
									labelAlign:"top"
								},
								items:[
									{
										xtype:"textarea",
										fieldLabel:"Notification Email Addresses (comma separated)",
										name:"notification_email"
									},{
										xtype:"textarea",
										fieldLabel:[
											"LDAP Usernames",
											"Users allowed access. These users will also be emailed.",
											"List usernames comma separated"
										].join("<br/>"),
										name:"ldap_users"
									},{
										xtype:"textarea",
										fieldLabel:"LDAP Group Names (comma separated)",
										value:"Domain Admins",
										name:"ldap_groups"
									}
								]

							}],
							buttons:[{
								iconCls:"icon_cog",
								text:"Test LDAP settings",
								handler:function(c){
									var view=c.up("view_setting_main");
									var form = view.form
									var model = form.getRecord();
									console.log(Ext.JSON.encode(form.getFieldValues()))
									if (form.isValid()){
										form.updateRecord(model)
										view.fireEvent("test_ldap",{
											src:view,
											model:model,
											username:prompt("enter username to test:")
										});
									}
									
								}
							},{
								text:"Save",
								iconCls:"icon_save",
								handler:function(c){
									var view=c.up("view_setting_main");
									var form = view.form
									var model = form.getRecord();
									
									if (form.isValid()){
										form.updateRecord(model)
										view.fireEvent("save_settings",{
											src:view,
											model:model
										});
									}
									
								}
							}]
								

						}]
							
					})
					this.callParent(arguments);
					var $this = this;
					App.model.Setting.load(
						"global",
						{
							success:function(r){
								$this.form.loadRecord(r)
							}
						}
					)
					
				}
			});
		
/* =========== Service ============================================= */
	/* ----------- Controller ------------------------------------------------ */
		Ext.define('App.controller.Service', {
			extend: 'Ext.app.Controller',
			init: function() {
				this.control({
					service_grid:{
						manage_service:function (event) {
							this.manageService(
								event.service_id, 
								event.action,
								function (result) {
									event.src.getStore().load()

								}
							)
						},
						service_add:function (event) {
							var win = new Ext.widget("view_service_picker",{owner:event.src})
							//var name = prompt("Enter a name for this Service");

							
						},
						service_save:function (event) {
							
							this.saveService(event.values,function (result) {

								if (result.success){
									event.src.store.add(result.model)
									event.src.showEditForm(result.model)
								} else {
									if (result.message) U.infoMsg("Error:" +result.message);
								}
							});
							
						},
						test_services:function (event) {
							this.testServices(function () {
								event.src.getStore().load()
							})
						},
						toggle_service_enabled:function (event) {
							var m = event.model;
							m.set("enabled",m.data.enabled?0:1)
							this.saveService(m);
						}
					},
					service_edit:{
						service_save:function (event) {
							this.saveService(event.model,function (result) {
								if (result.success){
									//U.infoMsg("Service Saved.")
									//event.src.form.loadRecord(result.model)
								}else{
									event.src.form.markInvalid(result.errors);
									if (result.message) U.infoMsg("Error:" +result.message);
								}
							});
						},
						service_remove:function (event) {
							var fp = event.src;
							var form = fp.form;
							var name = form.findField("name").getValue();
							if (window.confirm("Remove Service '{0}', and all tests and handlers?".format(name))){
								this.removeService(event.model,function (result) {
									U.infoMsg("Removed Service '{0}'".format(name))
								})
								form.close();
							}
						}
					},
					service_status_grid:{
						edit_service:function (event) {
							Ext.widget({
								xtype:"window",
								autoShow:true,
								width:400,
								items:[{
									xtype:"service_edit",
									model:event.model
								}]
							})
						}
					}
				});
			},
			
			
			manageService:function (service_id,action,cb) {
				$FP.Service.manageService({
					service_id:service_id,
					serviceAction:action
				},cb)
			},
			removeService:function editDs(model,cb){
				$FP.Service.remove({id:model.get("id")},function (result) {
					model.stores.forEach(function (store) {
						store.remove(model)
					})
					if (cb) cb(result);
				});
				
			},
			
			saveService:function(model,cb){
				var data;
				if (!model.isModel){
					data = model
					model = new App.model.Service(model);
				} else data =model.data

				$FP.Service.save(
					data,
					function(result){
						if (result.success) {
							model.set(result.data)
							model.commit();
							result.model = model
						} else {
							model.reject();
						}
						if (cb) cb(result);
					}
				);
			},
			testServices:function (cb) {
				$FP.Main.runTests({},cb);
			}
		});
	/* =========== Views ===================================================== */
		/* ----------- service_picker ------------------------------------------------- */
			Ext.define('App.view.service.Picker', {
				extend: 'Ext.window.Window',
				alias:'widget.view_service_picker',
				autoShow:true,
				width:320,
				hieght:240,
				model:true,
				title:"Add Service",
				items:[{
					xtype:"form",
					frame:true,
					items:[{
						fieldLabel:"Build from system service (optional)",
						labelAlign:"top",
						name:"system_name",
						xtype:"combo",
						editable:false,
						store:{
							type:"direct",
							directFn:$FP.Service.listSystemServices,
							fields:["service_name","service_path"]
						},
						valueField:"service_path",
						displayField:"service_name",
						listeners:{
							select:function (c,records) {
								var name = c.up("form").form.findField("name");
								if (!name.getValue().trim()) {
									name.setValue(
										records[0].get("service_name")
									);
								}
							}
						}

					},{
						fieldLabel:"Service Name",
						name:"name",
						labelAlign:"top",
						required:true,
						xtype:"textfield"
					}]
				}],
				buttons:[{
					text:"Save",
					handler:function(c){
						var view=c.up("window").owner;
						var form = c.up("window").down("form").form;
						if (form.isValid()){
							view.fireEvent("service_save",{
								src:view,
								values:form.getValues()
							});
							c.up("window").close();
						}
					}
				},{
					text:"Cancel",
					handler:function (btn) {
						btn.up("window").close();
					}
				}]
			})
		/* ----------- service_main ------------------------------------------------- */
			Ext.define('App.view.service.Main', {
				extend: 'Ext.panel.Panel',
				alias:'widget.view_service_main',
				title:"Data Sources",
				layout:"fit",
				items:[{
					xtype:"service_grid"
				}],
				
				initComponent:function(){
					this.callParent(arguments);
				}
			});
		/* ----------- service_grid ------------------------------------------------- */
			Ext.define('App.view.service.Grid', {
				extend: 'univnm.ext.SupaGrid',
				alias:'widget.service_grid',
				stripeRows:true,
				paged:true,
				store:{
					storeId:"service_grid",
					autoLoad:true,
					type:"service",
					remoteSort:false,
					sorters:[{
						property:"name",
						direction:"asc"
					}]
				},
				selModel:{
					xtype:"cellmodel"
				}, 
				tbar:[{
					text:"Add Service",
					iconCls:"icon_add",
					
					handler:function(c){
						var view=c.up("service_grid");
						view.fireEvent("service_add",{
							src:view,
							model:{}
						});
					}
				},{
					text:"Check Services Now",
					iconCls:"icon_cog_go",
					handler:function(c){
						var view=c.up("service_grid");
						view.fireEvent("test_services",{
							src:view
						});
					}
				},{
					text:"Export Services",
					iconCls:"icon_export",
					handler:function(){
						location.href=appUrl+"service/export_json";
					}
				}],
				filterPosition:"top",
				filterMode:"local",
				filterSuppressTitle:true,
				editFormConfig:{
					xtype:"service_edit",
					editTriggerCol:"Edit",
					position:"right",
					width:450
				},
				loadMask: true,
				initComponent:function(){
					var m = new App.model.Service();
					var er =function(val){
						return '<div class="link" title="Click to edit this Service">[ Edit ]</div>';
					};
					
					this.columns=[
						{dataIndex:"id", width:100,  hidden:true},
						{dataIndex:"name", filterable:true, width:200},
						{dataIndex:"name", text:"Edit",width:50, renderer:er},
						{dataIndex:"enabled", 
							filterable:true, 
							filterControl:{
								xtype:"quickdrop",
								editable:false,
								values:{
									Yes:"1",
									No:"0"
								}
							}, 
							width:50, 
							renderer:function (val) {
								return '<div class="link" title="Click to toggle">{0}</div>'.format(val?"[ Yes ]":"[ No ]")
							}
						},
						{dataIndex:"id", width:50, eventName:"service-stop", text:"",
							renderer:function (val,meta,record) {

								if (!record.get("service_manager")) return "";
								return '<div class="link" title="Click to stop">{0}</div>'.format("[ Stop ]")
							}
						},
						{dataIndex:"id", width:60, eventName:"service-restart", text:"",
							renderer:function (val,meta,record) {

								if (!record.get("service_manager")) return "";
								return '<div class="link" title="Click to restart">{0}</div>'.format("[ Restart ]")
							}
						},
						{dataIndex:"status", 
							width:70, 
							filterable:true, 
							renderer:function (val,mdd,record) {
								return record.data.enabled?val:"disabled"
							}
						},
						{dataIndex:"status", 
							text:"Test Status", 
							flex:1,
							filterable:true,
							filterControl:{
								xtype:"quickdrop",
								editable:false,
								values:[
									"pass",
									"fail",
									"restarting",
									"unknown"
								]
							}, 
							renderer:function (val,md,record) {
								if (!record.data.Tests) return ""
								var tests = record.data.Tests.map(function (t) {
									t = Ext.clone(t)
									if (typeof t.last_check == "string" && /Date/.test(t.last_check) ){
										t.last_check = new Date(
											parseInt(
												t.last_check.match(/Date\((\d+)\)/)[1],
												10
											)
										).format("m/d H:i")
										t.fail_messages = (t.fail_messages||"")
										t.fail_messages = t.fail_messages.left(t.fail_messages.indexOf("\n"))
									}
									return t
								})
								//console.log(tests)
								//width=\"100%\"
								return new Ext.XTemplate(
									"<table width=\"100%\">",
										"<tr><th width=\"150\">Test</th><th width=\"70\">Status</th><th width=\"30\">Last Checked</th><th >Reason</th></tr>",
										"<tpl for=\"Tests\">",
										"<tr><td>{script_name}</td><td>{status}</td><td>{last_check}</td><td>{fail_messages}</td></tr>",
										"</tpl>",
									"</table>"
								).apply({Tests:tests})
							}
						}
						
					].map(function(col){
						return $O(col).setDefaultProperties({
							text:m.getLabel(col.dataIndex),
							//id:col.dataIndex,
							flex:0
						});
					});
					this.viewConfig={
						getRowClass:function(record,rowIndex, rowParams, store){
							if (record.data.enabled){
								return "service-{0}".format(record.data.status||"unknown");
							} else return "service-disabled"
						}
					}	
					this.callParent(arguments);
					this.on(
						"enabled_cellclick",
						Ext.Function.createBuffered(function(value,record,col,grid){
							var view=grid;
							view.fireEvent("toggle_service_enabled",{
								src:view,
								model:record
							});
						},50)
					)
					this.on("service-restart",function (value,record,col,grid) {
						var view=grid
						view.fireEvent("manage_service",{
							src:view,
							service_id:value,
							action:"restart"
						});
					})
					this.on("service-stop",function (value,record,col,grid) {
						var view=grid
						view.fireEvent("manage_service",{
							src:view,
							service_id:value,
							action:"stop"
						});
					})
					var $this = this
					window.setInterval(function () {
						$this.getStore().load()
					},30000)
				}
			});
		/* ----------- service_edit ------------------------------------------------- */
			Ext.define('App.view.service.Edit', {
				extend: 'Ext.form.Panel',
				alias:'widget.service_edit',
				//layout:"fit",
				frame:true,
				autoScroll:true,
				//width:600,
				defaults:{
					labelStyle:"font-weight:bold;",
					//labelAlign:"top",
					//labelWidth:200,
					anchor:"99%",
					labelAlign:"top",
					xtype:"textfield",
					enableKeyEvents:true,
					msgTarget:"under"
					
				},	
				tools:[{
					type:'close',
					tooltip: 'Close edit panel',
					// hidden:true,
					handler: function(event, toolEl, panel){
						var view = panel.up("service_edit");
						var form = view.form;
						form.close();
					}
				}],
				buttons:[/*{
					text:"Save",
					iconCls:"icon_save",
					handler:function(b){
						var view = b.up("service_edit");
						var form = view.form;
						if (form.isValid()){
							form.updateRecord(form.currentRecord);
							
							view.fireEvent("service_save",{
								src:view,
								model:form.currentRecord
							});	
						}
					}
				},*/{
					text:"Delete",
					iconCls:"icon_delete",
					handler:function(c){
						var view=c.up("service_edit");
						view.fireEvent("service_remove",{
							src:view,
							model:view.form.currentRecord
						});
					}
				}],
				
				initComponent:function(){
					var m =new App.model.Service();
					this.items=[{
						name:"name",
						fieldLabel:m.getLabel("name"),
						enableKeyEvents:true,
						listeners:{
							keydown:Ext.Function.createBuffered(function(c){
								var view=c.up("service_edit");
								var form = view.form;
								if (form.isValid()){
									form.updateRecord(form.currentRecord);
									
									view.fireEvent("service_save",{
										src:view,
										model:form.currentRecord
									});	
								}
							},300)
						}
					},{
						xtype:"test_grid",
						title:"Service Tests",
						height:200
					},{
						xtype:"handler_grid",
						title:"Service Handlers",
						height:200
					},{
						xtype:"combo",
						store:"Handler",
						displayField:"parameters_text",
						valueField:"id",
						name:"service_manager",
						fieldLabel:m.getLabel("service_manager"),
						editable:false,
						listeners:{
							select:function (c) {
								var view=c.up("service_edit");
								var form = view.form;
								if (form.isValid()){
									form.updateRecord(form.currentRecord);
									
									view.fireEvent("service_save",{
										src:view,
										model:form.currentRecord
									});	
								}
							}
						}
						/*tpl: new Ext.XTemplate(
							<tpl for=".">,
								<div class="x-boundlist-item">
									<tpl for=>
								</div>,
							</tpl>
						),*/
					}];	
					
					this.callParent(arguments);
				
					this.addListener("beforeGridLoad",function (panel,model) {
						panel.down("test_grid").setParentModel(model);
					})
					this.addListener("beforeGridLoad",function (panel,model) {
						panel.down("handler_grid").setParentModel(model);
					})
					
						
					
				}

			});	
		
/* =========== Test ============================================= */
	/* ----------- Controller ------------------------------------------------ */
		Ext.define('App.controller.Test', {
			extend: 'Ext.app.Controller',
			init: function() {
				this.control({
					test_grid:{
						test_add:function (event) {
							event.src.showEditForm()
						}
					},
					test_edit:{
						test_save:function (event) {
							this.saveTest(event.model,function (result) {
								if (result.success){
									U.infoMsg("Test Saved.")
									event.src.form.close()
								}else{
									event.src.form.markInvalid(result.errors);
									if (result.message) U.infoMsg("Error:" +result.message);
								}
							});
						},
						test_remove:function (event) {
							var fp = event.src;
							var form = fp.form;
							var name = form.findField("script_name").getValue();
							if (window.confirm("Remove Test Script '{0}'?".format(name))){
								this.removeTest(event.model,function (result) {
									U.infoMsg("Removed Test Script '{0}'".format(name))
									form.close()
								})
							}
						}
					}
				});
			},
			
			
			
			removeTest:function editDs(model,cb){
				$FP.Test.remove({id:model.get("id")},function (result) {
					model.stores.forEach(function (store) {
						store.remove(model)
					})
					if (cb) cb(result);
				});
				
			},
			
			saveTest:function(model,cb){
				$FP.Test.save(
					model.data,
					function(result){
						if (result.success) {
							model.set(result.data);
							model.commit();
						} else {
							model.reject();
						}
						if (cb) cb(result);
					}
				);
			}
		});
	/* =========== Views ===================================================== */
		/* ----------- test_grid ------------------------------------------------- */
			Ext.define('App.view.test.Grid', {
				extend: 'univnm.ext.SupaGrid',
				alias:'widget.test_grid',
				stripeRows:true,
				store:{
					storeId:"test_grid",
					autoLoad:false,
					type:"test",
					remoteSort:false,
					sorters:[{
						property:"name",
						direction:"asc"
					}]
				},
				setParentModel:function (model) {
					this.parentModel = model;
					this.store.getProxy().extraParams={
						service_id:model.get("id")
					}
					this.store.load()
				},
				/*selModel:{
					xtype:"cellmodel"
				}, */
				tbar:[{
						text:"Add Test",
						iconCls:"icon_add",
						
						handler:function(c){
							var view=c.up("test_grid");
							view.fireEvent("test_add",{
								src:view,
								model:{}
							});
						}
				}],
				filterPosition:"top",
				filterMode:"local",
				filterSuppressTitle:true,
				editFormConfig:{
					xtype:"test_edit",
					//editTriggerCol:"Name",
					position:"popup",
					width:450
				},
				loadMask: true,
				initComponent:function(){
					var m = new App.model.Test();
					var er =function(val){
						return '<div class="link" title="Click to edit this Test">'+val+'</div>';
					};
					var mtr =function(){
						return '<div class="link" title="Click to query the tables in this datasource">Query</div>';
					};
					this.columns=[
						{dataIndex:"id", width:100, filterable:false, hidden:true},
						{dataIndex:"script_name", renderer:er},
						{dataIndex:"parameters_text", flex:1}/*,
						{dataIndex:"enabled", width:50},*/
					].map(function(col){
						return $O(col).setDefaultProperties({
							text:m.getLabel(col.dataIndex),
							//filterable:true,
							//id:col.dataIndex,
							flex:0
						});
					});
						
					this.callParent(arguments);
				}
			});
		/* ----------- test_edit ------------------------------------------------- */
			Ext.define('App.view.test.Edit', {
				extend: 'Ext.form.Panel',
				alias:'widget.test_edit',
				//layout:"fit",
				frame:true,
				autoScroll:true,
				showParameters:function (index) {
					var cards =this.down("panel[itemId=testParams]") 
					var scriptName;
					var panel
					if (index == parseInt(index,10)){
						scriptName = tests[index].name
						cards
							.getLayout()
							.setActiveItem(index)
						
					} else {
						scriptName = index;
						index = tests.reduce(function (result,test,index) {
							if (test.name == scriptName){
								result = index
							}
							return result
						},0);
						cards
							.getLayout()
							.setActiveItem(index)
					}
					panel = cards.items.getAt(index);
					var record = this.form.currentRecord;
					panel
						.query("field".format(scriptName))
						.filter(function (f) {
							return record.data.parameters
								&& record.data.parameters[scriptName]
						})
						.forEach(function (f) {
							f.setValue(record.data.parameters[scriptName][f.name])
						})
				},
				defaults:{
					labelStyle:"font-weight:bold;",
					//labelAlign:"top",
					//labelWidth:200,
					anchor:"99%",
					labelAlign:"top",
					xtype:"textfield",
					enableKeyEvents:true,
					msgTarget:"under"
					
				},	
				
				buttons:[{
					text:"Save",
					iconCls:"icon_save",
					handler:function(b){
						var view = b.up("test_edit");
						var form = view.form;
						if (form.isValid()){
							form.updateRecord(form.currentRecord);
							
							view.fireEvent("test_save",{
								src:view,
								model:form.currentRecord
							});	
						}
					}
				},{
					text:"Delete",
					iconCls:"icon_delete",
					handler:function(c){
						var view=c.up("test_edit");
						view.fireEvent("test_remove",{
							src:view,
							model:view.form.currentRecord
						});
					}
				}],
				
				initComponent:function(){
					var m =new App.model.Test();
					this.items=[{
							name:"script_name",
							xtype:"quickdrop",
							editable:false,
							values:tests.map(function (t) {
								return t.name
							}),
							listeners:{
								select:function(combo,records){
									combo
										.up("test_edit")
										.showParameters(records.first().get("value"))
								}
							}
						},{
							name:"fail_after",
							xtype:"numberfield",
							width:15
						},{
							name:"restart_grace",
							xtype:"numberfield",
							width:15
					}].map(function(f){
						f.fieldLabel =m.getLabel(f.name);
						return f;
					}).concat([{
						xtype:"panel",
						itemId:"testParams",
						layout:"card",
						height:200,
						autoScroll:true,
						frame:true,
						items:tests.map(function (t) {
							return {
								xtype:"fieldset",
								itemId:t.name,
								title:t.name +" Config",
								items:[{
									xtype:"label",
									text:t.description
								}].concat(t.config)
							}

						})
					}]);	
					
					this.callParent(arguments);
					var $this = this;
					ObjectLib.after(this.form,"updateRecord",function (record) {
						var chain = arguments.callee.chain;
						var paramsArray = $this.query("*[itemId={script_name}] field".format(record.data))
							.map(function (param) {
								return {
									id:"{0}-{1}-{2}".format(
										record.get("id"),
										record.get("script_name"),
										param.name
									),
									name:param.name,
									value:param.getValue(),
									test_id:record.get("id"),
									script_name:record.get("script_name")
								}
							})
						record.set("TestParameters",paramsArray)
						return chain.lastReturn;
					})
					this.on("beforeGridLoad",function (panel,record) {
						if (!record.get("service_id")){
							record.set("service_id",panel.supagrid.parentModel.get("id"))
						}
						if (!record.get("id")){
							record.set("id",U.getUuid())
						}
						if (!record.get("script_name")){
							record.set("script_name",tests.first().name)
						}
						panel.showParameters(record.get("script_name"))
						
					})
					
				}
			});	
		
/* =========== Handler ============================================= */
	/* ----------- Controller ------------------------------------------------ */
		Ext.define('App.controller.Handler', {
			extend: 'Ext.app.Controller',
			init: function() {
				this.control({
					handler_grid:{
						handler_add:function (event) {
							event.src.showEditForm()
						}
					},
					handler_edit:{
						handler_save:function (event) {
							this.saveHandler(event.model,function (result) {
								if (result.success){
									U.infoMsg("Handler Saved.")
									event.src.form.close()
								}else{
									event.src.form.markInvalid(result.errors);
									if (result.message) U.infoMsg("Error:" +result.message);
								}
							});
						},
						handler_remove:function (event) {
							var fp = event.src;
							var form = fp.form;
							var name = form.findField("script_name").getValue();
							if (window.confirm("Remove Handler Script '{0}'?".format(name))){
								this.removeHandler(event.model,function (result) {
									U.infoMsg("Removed Handler Script '{0}'".format(name))
									form.close()
								})
							}
						}
					}
				});
			},
			
			
			
			removeHandler:function editDs(model,cb){
				$FP.Handler.remove({id:model.get("id")},function (result) {
					model.stores.forEach(function (store) {
						store.remove(model)
					})
					if (cb) cb(result);
				});
				
			},
			
			saveHandler:function(model,cb){
				$FP.Handler.save(
					model.data,
					function(result){
						if (result.success) {
							model.set(result.data);
							model.commit();
						} else {
							model.reject();
						}
						if (cb) cb(result);
					}
				);
			}
		});
	/* =========== Views ===================================================== */
		/* ----------- handler_grid ------------------------------------------------- */
			Ext.define('App.view.handler.Grid', {
				extend: 'univnm.ext.SupaGrid',
				alias:'widget.handler_grid',
				stripeRows:true,
				store:"Handler",
				/*store:{
					storeId:"handler_grid",
					autoLoad:false,
					type:"handler",
					remoteSort:false,
					sorters:[{
						property:"name",
						direction:"asc"
					}]
				},*/
				setParentModel:function (model) {
					this.parentModel = model;
					this.store.getProxy().extraParams={
						service_id:model.get("id")
					}
					this.store.load()
				},
				/*selModel:{
					xtype:"cellmodel"
				}, */
				tbar:[{
						text:"Add Handler",
						iconCls:"icon_add",
						
						handler:function(c){
							var view=c.up("handler_grid");
							view.fireEvent("handler_add",{
								src:view,
								model:{}
							});
						}
				}],
				filterPosition:"top",
				filterMode:"local",
				filterSuppressTitle:true,
				editFormConfig:{
					xtype:"handler_edit",
					//editTriggerCol:"Name",
					position:"popup",
					width:450
				},
				loadMask: true,
				initComponent:function(){
					var m = new App.model.Handler();
					var er =function(val){
						return '<div class="link" title="Click to edit this Handler">'+val+'</div>';
					};
					var mtr =function(){
						return '<div class="link" title="Click to query the tables in this datasource">Query</div>';
					};
					this.columns=[
						{dataIndex:"id", width:100, filterable:false, hidden:true},
						{dataIndex:"script_name", renderer:er},
						{dataIndex:"parameters_text", flex:1}/*,
						{dataIndex:"enabled", width:50},*/
					].map(function(col){
						return $O(col).setDefaultProperties({
							text:m.getLabel(col.dataIndex),
							//filterable:true,
							//id:col.dataIndex,
							flex:0
						});
					});
						
					this.callParent(arguments);
				}
			});
		/* ----------- handler_edit ------------------------------------------------- */
			Ext.define('App.view.handler.Edit', {
				extend: 'Ext.form.Panel',
				alias:'widget.handler_edit',
				//layout:"fit",
				frame:true,
				autoScroll:true,
				showParameters:function (index) {
					var cards =this.down("panel[itemId=handlerParams]") 
					var scriptName;
					var panel
					if (index == parseInt(index,10)){
						scriptName = handlers[index].name
						cards
							.getLayout()
							.setActiveItem(index)
						
					} else {
						scriptName = index;
						index = handlers.reduce(function (result,handler,index) {
							if (handler.name == scriptName){
								result = index
							}
							return result
						},0);
						cards
							.getLayout()
							.setActiveItem(index)
					}
					panel = cards.items.getAt(index);
					var record = this.form.currentRecord;
					panel
						.query("field".format(scriptName))
						.filter(function (f) {
							return record.data.parameters
								&& record.data.parameters[scriptName]
						})
						.forEach(function (f) {
							f.setValue(record.data.parameters[scriptName][f.name])
						})
				},
				defaults:{
					labelStyle:"font-weight:bold;",
					//labelAlign:"top",
					//labelWidth:200,
					anchor:"99%",
					labelAlign:"top",
					xtype:"textfield",
					enableKeyEvents:true,
					msgTarget:"under"
					
				},	
				
				buttons:[{
					text:"Save",
					iconCls:"icon_save",
					handler:function(b){
						var view = b.up("handler_edit");
						var form = view.form;
						if (form.isValid()){
							form.updateRecord(form.currentRecord);
							
							view.fireEvent("handler_save",{
								src:view,
								model:form.currentRecord
							});	
						}
					}
				},{
					text:"Delete",
					iconCls:"icon_delete",
					handler:function(c){
						var view=c.up("handler_edit");
						view.fireEvent("handler_remove",{
							src:view,
							model:view.form.currentRecord
						});
					}
				}],
				
				initComponent:function(){
					var m =new App.model.Handler();
					this.items=[{
							name:"script_name",
							xtype:"quickdrop",
							editable:false,
							values:handlers.map(function (t) {
								return t.name
							}),
							listeners:{
								select:function(combo,records){
									combo
										.up("handler_edit")
										.showParameters(records.first().get("value"))
								}
							}
						
					}].map(function(f){
						f.fieldLabel =m.getLabel(f.name);
						return f;
					}).concat([{
						xtype:"panel",
						itemId:"handlerParams",
						layout:"card",
						height:200,
						
						frame:true,
						items:handlers.map(function (t) {
							return {
								xtype:"fieldset",
								itemId:t.name,
								title:t.name +" Config",
								autoScroll:true,
								items:[{
									xtype:"label",
									text:t.description
								}].concat(t.config)
							}

						})
					}]);	
					
					this.callParent(arguments);
					var $this = this;
					ObjectLib.after(this.form,"updateRecord",function (record) {
						var chain = arguments.callee.chain;
						var paramsArray = $this.query("*[itemId={script_name}] field".format(record.data))
							.map(function (param) {
								return {
									id:"{0}-{1}-{2}".format(
										record.get("id"),
										record.get("script_name"),
										param.name
									),
									name:param.name,
									value:param.getValue(),
									handler_id:record.get("id"),
									script_name:record.get("script_name")
								}
							})
						record.set("HandlerParameters",paramsArray)
						return chain.lastReturn;
					})
					this.on("beforeGridLoad",function (panel,record) {
						if (!record.get("service_id")){
							record.set("service_id",panel.supagrid.parentModel.get("id"))
						}
						if (!record.get("id")){
							record.set("id",U.getUuid())
						}
						if (!record.get("script_name")){
							record.set("script_name",handlers.first().name)
						}
						panel.showParameters(record.get("script_name"))
						
					})
					
				}
			});	
		
/*  */

/* ----------- Application definition: App ---------------------------------- */
	Ext.application({
		name: 'App',
		controllers:ObjectLib.getProperties(App.controller),
		stores:["Handler"],
		autoCreateViewport:true,
		launch:function(){
			Ext.apply(App,{
				addCenterTab:function(config,ordinal){
					Ext.apply(config,{
						closable:true
					});
					var tabPanel = Ext.getCmp("center_tabs");
					tabPanel.show();
					if (tabPanel.items.containsKey(config.id)){
						tabPanel.setActiveTab(config.id);
					}else {
						if (ordinal !== undefined){
							tabPanel.insert(ordinal,config);	
						} else {
							tabPanel.add(config);
						}
						tabPanel.setActiveTab(config.id);
					}
					
				}
			});
			
			/* new Ext.Window({
					autoShow:true,
					//height:300,
					items:[{
						xtype:"cronedit"
					}]
			}) */
			 
			//this.getController("Cron").showMain()
			
			/* App.model.Ds.load("test_ds",{
				success:function(model){
					$this.getController("Ds").editDs(model)
				}
			}) */
			
			
		}
		
	});	