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
				
			}
	}
/* =========== General View Components ====================================== */
/* =========== User ======================================================== */
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
									event.src.form.close();
								}
							})
						}
					}

					
				});
			},
			showUsers:function () {
				U.addCenterTab({
					id:"vUsersGrid",
					xtype:"user_grid",
					title:"Manage Users"
				})
			},
			saveUser:function (model,cb) {
				model
			}
		})
	/* =========== Views ==================================================== */
		/* ----------- user_grid ----------------------------------------- */
			Ext.define('App.view.UserGrid', {
				extend: 'univnm.ext.SupaGrid',
				alias:'widget.user_grid',
				
				initComponent:function () {
					Ext.apply(this,{
						iconCls:"icon_manage_users",
						store:{
							type:"user"
						},
						columns:[
							{dataIndex:"user_id"},
							{dataIndex:"first_name", filterable:true },
							{dataIndex:"middle_name", filterable:true },
							{dataIndex:"last_name", filterable:true },
							{dataIndex:"title" },
							{dataIndex:"dob" },
							{dataIndex:"country" },
							{dataIndex:"email", filterable:true },
							{dataIndex:"gender" },
							{dataIndex:"language" },
							{dataIndex:"nickname" },
							{dataIndex:"postcode" },
							{dataIndex:"timezone" },
							{dataIndex:"created" },
							{dataIndex:"inactive_ts" }
						].map(function (row) {
							return Ext.applyIf(row,{
								text:App.model.User.fields[row.dataIndex].label
								
							})
						}),
						filterAutoLoad:true,
						filterSuppressTitle:true,
						tbar:[{
							text:"Add User",
							iconCls:"icon_add",
							handler:function (btn) {
								var view = btn.up("user_grid")
								view.showEditForm()
							}
						}],
						editFormConfig:{
							xtype:"user_form",
							position:"right"
						}
					})
					this.callParent(arguments);
				}
			})
		/* ----------- user_form ----------------------------------------- */
			Ext.define('App.view.UserForm', {
				extend: 'Ext.form.Panel',
				alias:'widget.user_form',
				
				initComponent:function () {
					Ext.apply(this,{
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
							{ name:"created", xtype:"displayfield" },
							{ name:"inactive_ts", xtype:"displayfield" }
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
						}),
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
								var model = view.form.currentRecord;
								view.fireEvent("",{
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
