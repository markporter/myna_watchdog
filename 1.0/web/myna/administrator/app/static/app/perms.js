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
							//iconCls:"icon_form_search",
							handler:function(c){
								var view=c.up("viewport");
								view.fireEvent("manage_users",{
									src:view
								});
							}
						},{
							text:"Manage User Groups",
							//iconCls:"icon_form_search",
							handler:function(c){
								var view=c.up("viewport");
								view.fireEvent("manage_user_groups",{
									src:view
								});
							}
						},{
							text:"Manage Rights",
							//iconCls:"icon_form_search",
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
		}
	}
/* =========== General View Components ====================================== */

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
			/*this.getController("Sql").openSql(
				U.beautifySql(
					'Select aa.answer_attachment_id, aa.request_id, aa.document, aa.filename, aa.title, aa.question_id, aa from "ORS"."ANSWER_ATTACHMENT" aa'
				)
			);*/

			
			
		}
		
	});	
