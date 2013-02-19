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
var controllers=[];

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
								hidden:true,
								xtype:"tabpanel",
								autoDestroy:true,
								listeners: {
								}
								
							}]
						
						},{//west
							region:"west",
							width:200,
							//autoWidth:true,
							border:false,
							xtype:"menu",
							/* bodyStyle:"padding:10px;", */
							bodyBorder:false,
							title:"Main Menu:",
							collapsible:true,
							frame:true,
							floating:false,
							defaults:{
								border:false,
								bodyStyle:"padding:5px",
								iconCls:"icon_form"
							},
							items:[{
								text:'General Settings',
								id:"main_menu_settings"
							},{
								text:'Data Sources',
								id:"main_menu_data_sources",
								iconCls:"icon_db"
							},{
								text:'View Running Requests',
								id:"main_menu_requests",
								iconCls:"icon_request"
							},{
								text:'View General Log',
								id:"main_menu_log",
								iconCls:"icon_log"
							},{
								text:'Upgrade Myna',
								iconCls:"icon_upgrade",
								menu:{
									
									items:[{
										text:'Install version "'+latestVersion+'" from the web',
										hidden:!latestVersion,
										id:"main_menu_upgrade_web",
										iconCls:"icon_upgrade_web"
									},{
										text:'Upload a .war file',
										id:"main_menu_upgrade_local",
										iconCls:"icon_upgrade_local"
									}]
								}
							},{
								text:'Scheduled Tasks',
								
								iconCls:"icon_cron",
								handler:function(m){
									var view = m.up("viewport");
									view.fireEvent("launchCron");
								}
							},{
								text:'Manage Permissions',
								
								iconCls:"icon_perms",
								handler:function(){
									window.open(appUrl + "main/manage_perms");
								}
								
							},{
								text:'Add/Update FlightPath App',
								
								iconCls:"icon_update_fp",
								handler:function(){
									var path = window.prompt("Path to update or create, relative to webroot");
									if (path){
										$FP.Main.updateFpApp({path:path},function (result) {
											U.infoMsg(result.message);
											console.log(result)
										})
									}
								} 
								
							},{
								text:'Manage Applications',
								iconCls:"icon_manage_apps",
								handler:function(m){
									var view = m.up("viewport");
									view.fireEvent("manageApplications");
								}
								
							},{
								text:'Change Admin Password',
								iconCls:"icon_perms",
								handler:function(){
									window.open(appUrl + "main/change_admin_password");
								}
								
								
							},{
								text:'Documentation',
								iconCls:"icon_documentation",
								handler:function(){
									window.open(rootUrl + 'shared/docs/index.html');
								}
							},{
								text:'Code Examples',
								handler:function(){
									window.open(rootUrl + 'examples/index.ejs');
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
				
/* =========== DS (DataSources) ============================================= */
	/* ----------- Controller ------------------------------------------------ */
		controllers.push("Ds");
		Ext.define('App.controller.Ds', {
			extend: 'Ext.app.Controller',
			init: function() {
				this.control({
					'#main_menu_data_sources': {
						click: this.showMain
					},
					'dsgrid': {
						manage_tables: this.manageTables
					},
					'dsgrid button[action="add_ds"]':{
						click:this.addDs
					},
					'dsedit':{
						beforegridload:function(p,record){
							p.loadRecord(record);
							p.matchLocation();
						},
						ds_save:function(event){
							var form = event.src.form;
							this.saveDsForm(event.model,function(result){
								if (result.success){
									form.updateRecord(form.currentRecord);
									form.close();	
								}else{
									
								}
							});
						}
					},
					'dsedit field':{
						change:this.updateUrl
					},
					'dsedit button[action="save"]':{
						click:this.saveDsForm
					},
					'dsedit button[action="delete"]':{
						click:this.deleteDs
					}
					
				});
			},
			
			
			addDs:function(button){
				//console.log(Array.parse(arguments))
				button.up("dsgrid").showEditForm();
			},
			
			deleteDs:function editDs(button){
				var fp = button.up("form");
				var form = fp.form;
				var name = form.findField("name").getValue();
				if (window.confirm("Remove data source '" + name +"'?")){
					
					$FP.Ds.remove({name:name},U.directMask(fp,"Removing DS", function(){
						U.infoMsg(name +" removed.");
						form.close();
						button.up("dsgrid").getStore().load();
						
						
					}));
				}
			},
			manageTables:function(name){
				window.open(appUrl+"db_manager/" + name);
			},
			saveDsForm:function(model,cb){
				$FP.Ds.save(
					model.data,
					function(result){
						if (result.success) {
							model.commit();
						} else {
							model.reject();
						}
						if (cb) cb(result);
					}
				);
				
			
			},	
			showMain:function(){
				App.addCenterTab({
					id:"data_sources",
					xtype:"dsmain",
					iconCls:"icon_db"
				});
			},
			
			updateUrl:function(f){
				if ("location,server,port,file,db".listContains(f.name) ){
					var fp =f.up("form");
					var form = fp.form;
					var data =form.getValues();
					var type = data.type||form.currentRecord.get("type");
					var url = new Ext.Template(dbProperties[type].url).apply(data);
					if (data.location=="file"){
						url = new Ext.Template(dbProperties[data.type].file_url).apply(data);
					}
					form.findField("url").setValue(url);
				}
			}
			
		});
	/* =========== Views ===================================================== */
		/* ----------- dsmain ------------------------------------------------- */
			Ext.define('App.view.ds.Main', {
				extend: 'Ext.panel.Panel',
				alias:'widget.dsmain',
				title:"Data Sources",
				layout:"fit",
				items:[{
					id:"ds_grid",
					xtype:"dsgrid"
				}],
				
				initComponent:function(){
					this.callParent(arguments);
				}
			});
		/* ----------- dsedit ------------------------------------------------- */
			Ext.define('App.view.ds.Edit', {
				extend: 'Ext.form.Panel',
				alias:'widget.dsedit',
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
				
				buttons:[{
					text:"Save",
					iconCls:"icon_save",
					handler:function(b){
						var view = b.up("dsedit");
						var form = view.form;
						if (form.isValid()){
							form.updateRecord(form.currentRecord);
							
							view.fireEvent("ds_save",{
								src:view,
								model:form.currentRecord
							});	
						}
					}
				},{
					text:"Delete",
					iconCls:"icon_delete",
					action:"delete"
				}],
				matchLocation:function(){
					var $this =this;
					
					if ($this.form.findField("location").getValue() == "file"){
						[
							"server",
							"port",
							"db"
						].forEach(function(f){
							$this.form.findField(f).hide();
						});
						$this.form.findField("file").show();
					} else {
						[
							"server",
							"port",
							"db"
						].forEach(function(f){
							$this.form.findField(f).show();
						});
						$this.form.findField("file").hide();
					}
				},
				initComponent:function(){
					var m =new App.model.Ds();
					this.items=[{
						name:"name",
						validator:function(val){
							var model  = this.up("form").form.currentRecord;
							if (model.phantom){
								var store = Ext.StoreMgr.get("ds_grid");
								if (store.findExact("name",val) !=-1) return "Name exists on a another DS.";
							}
							return true;
						}
					},{
						name:"type",
						xtype:"combo",
						displayField:"type",
						valueField:"type",
						editable:false,
						allowBlank:false,
						store:{
							fields:["type"],
							data:$O(dbProperties).getKeys().map(function(p){
								return {type:p};
							})	
						},
						listeners:{
							select:function(c,r){
								var fp =this.up("form");
								var form = fp.form;
								if (dbProperties[r[0].get("type")].file_url){
									form.findField("location").show();	
								}else{
									var loc = form.findField("location");
									loc.setValue("network");
									loc.hide();
									fp.matchLocation();
									form.findField("driver").setValue(dbProperties[r[0].get("type")].driver);
								}
							}	
						}
						
					},{
						name:"desc"
					},{
						name:"driver"
					},{
						name:"location",
						xtype:"combo",
						displayField:"location",
						valueField:"location",
						editable:false,
						allowBlank:false,
						store:{
							fields:["location"],
							data:[{location:"file"},{location:"network"}]	
						},
						listeners:{
							select:function(){this.up("dsedit").matchLocation();}	
						}
					},{
						name:"server"
					},{
						name:"port"
					},{
						name:"db"
					},{
						name:"file"
					},{
						name:"case_sensitive",
						xtype:"combo",
						displayField:"label",
						valueField:"value",
						editable:false,
						allowBlank:false,
						store:{
							fields:["label","value"],
							data:[{label:"Yes",value:1},{label:"No",value:0}]	
						}
					},{
						name:"username"
					},{
						name:"password"
					},{
						name:"url",
						minWidth:300
						//msgTarget:"under",
						//anchor:"-20"
					}].map(function(f){
						f.fieldLabel =m.getLabel(f.name);
						var originalValidator = f.validator||function(){return true;};
						f.validator = function(value){
							//console.log(f.name,typeof value)
							try{
								var allValues = this.up("form").form.getFieldValues();
								//allValues[f.name] = value
								var v = m.validation.validate(
									allValues,
									f.name
								);
								if (v.success){
									return originalValidator.call(this,value);
								} else {
									//console.log(v.errors[f.name])
									return v.errors[f.name];	
								}
							} catch(e){
								console.log(e);	
							}
						};
						
						return f;
					});	
					
					this.callParent(arguments);
					if (!this.current_record){
						this.current_record=m;
					}
					this.loadRecord(this.current_record);
					this.matchLocation();
					
				}
			});	
		/* ----------- dsgrid ------------------------------------------------- */
			Ext.define('App.view.ds.Grid', {
				extend: 'univnm.ext.SupaGrid',
				alias:'widget.dsgrid',
				stripeRows:true,
				store:{
					storeId:"ds_grid",
					autoLoad:true,
					type:"ds",
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
						text:"Add DS",
						iconCls:"icon_add",
						action:"add_ds"
				}],
				filterPosition:"top",
				filterMode:"local",
				filterSuppressTitle:true,
				editFormConfig:{
					xtype:"dsedit",
					editTriggerCol:"Name",
					position:"right"
				},
				loadMask: true,
				initComponent:function(){
					var m = new App.model.Ds();
					var er =function(val){
						return '<div class="link" title="Click to edit this datasource">'+val+'</div>';
					};
					var mtr =function(){
						return '<div class="link" title="Click to query the tables in this datasource">Query</div>';
					};
					this.columns=[
						{dataIndex:"name", width:200,renderer:er},
						{dataIndex:"name", header:" ",eventName:"manage_tables", renderer:mtr, filterable:false},
						{dataIndex:"type"},
						{dataIndex:"desc", flex:1 ,minWidth:100}
					].map(function(col){
						return $O(col).setDefaultProperties({
							header:m.getLabel(col.dataIndex),
							filterable:true,
							//id:col.dataIndex,
							flex:0
						});
					});
						
					this.callParent(arguments);
				}
			});
/* =========== Settings ===================================================== */
	/* ----------- Controller ------------------------------------------------ */
		controllers.push("Settings");
		Ext.define('App.controller.Settings', {
			extend: 'Ext.app.Controller',
			init: function() {
				
				this.control({
					'#main_menu_settings': {
						click: this.menuClick
					},
					'#settings_save': {
						click: this.saveGeneralSettings
						
					}
				});
			},
			saveGeneralSettings:function(){
				var formPanel = Ext.getCmp("settings_form");
				$FP.Setting.saveSettings(
					formPanel.form.getFieldValues(),
					U.directMask(formPanel,function(result){
						console.log(result);
						U.infoMsg("Settings Saved.");
					})
				);
			},
			menuClick:function(/*item, EventObject, eOpts*/){
				App.addCenterTab({
					id:"general_settings",
					//layout:"fit",
					iconCls:"icon_form",
					xtype:"settingsmain"
				});
			}
			
		});
	/* =========== Views ===================================================== */
		/* ----------- main --------------------------------------------------- */
			var settings_help_title,settings_help_loader;
			Ext.define('App.view.settings.Main', {
				extend: 'Ext.form.Panel',
				alias:'widget.settingsmain',
				title:"General Settings",
				layout: {
					type: 'border'
				},
				
				items:[{
					xtype:"form",
					id:"settings_form",
					region:"center",
					frame:true,
					autoScroll:true,
					fieldDefaults: {
						labelWidth: 200/*,
						anchor: '100%'*/
					},
					buttons:[{
						id:"settings_save",
						text:"Save",
						iconCls:"icon_save"
					}]
				},{
					region:"east",
					collapsible:true,
					resizable:true,
					title:settings_help_title="General Settings Help",
					width:300,
					autoScroll:true,
					loader:settings_help_loader={
						url: appUrl +'static/help/settings.html?dc=' + new Date().getTime(),
						autoLoad:true
					}
					
				}],
				initComponent:function(){
					$FP.Setting.getSettings({},function(result){
						var formPanel = Ext.getCmp("settings_form");
						var addControl = function (tuple) {
							var name = tuple.listFirst(":");
							var label = tuple.listLen(":") >1 
								? tuple.listLast(":")
								: name.replace(/_dot_|_/g," ").titleCap()
							if ([
								"administrator_email_on_error",
								"debug_parser_output",
								"enable_directory_listings",
								"strict_error_checking",
								"append_profiler_output"
							].join().listContains(name)){
								formPanel.add({
									xtype:"combo",
									fieldLabel:label,
									name:name,
									
									hiddenName:name,
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
									width:250,
									allowBlank:false,
									value:parseInt(result[name],10)
									
								});
							}else if (name == "log_engine"){
								formPanel.add({
									xtype:"combo",
									fieldLabel:label,
									name:name,
									
									hiddenName:name,
									store:{
										autoLoad:true,
										proxy:{
											type:"direct",
											directFn:$FP.Log.getLoggers,
											paramsAsHash:true,
											reader: {
												type: 'json',
												//totalProperty:'totalRows',
												//root:'data',
												idProperty:'value'
											}
										},
										fields:[
											"value",
											"label"
										]
									},
									displayField:'label',
									valueField:'value',
									mode: 'local',
									triggerAction: 'all',
									selectOnFocus:true,
									editable:false,
									width:400,
									allowBlank:false,
									value:result[name]
									
								});

							/*}else if (name == "optimization_dot_level"){
								formPanel.add({
									xtype:"combo",
									fieldLabel:label,
									name:name,
									
									hiddenName:name,
									store:new Ext.data.SimpleStore({
										fields: ['id','text'],
										data:[-1,0,1,2,3,4,5,6,7,8,9].map(function(e,x){
											return [(x-1),(x-1)];
										}) 
									}),
									displayField:'text',
									valueField:'id',
									mode: 'local',
									triggerAction: 'all',
									selectOnFocus:true,
									editable:false,
									allowBlank:false,
									value:parseInt(result[name],10)
								});*/
							} else if ([//numbers
								"max_running_threads",
								"background_thread_pool",	
								"request_timeout",	
								"watchdog_request_startup_delay",
								"watchdog_request_check_interval",
								"watchdog_request_timeout",
								"watchdog_request_failcount",
								"watchdog_request_mem_free_percent",
								"watchdog_request_mem_failcount"
							].join().listContains(name)){
								formPanel.add({
									xtype:"numberfield",
									fieldLabel:label,
									name:name,
									value:result[name],
									width:250
								});
							} else if ([//textfields
								"thread_whitelist",	
								"standard_libs",
								"server_start_scripts",
								"request_handler:Request Handler Script",
								"commonjs_paths:CommonJS Search Paths"
							].join().listContains(name)){
								formPanel.add({
									xtype:"textarea",
									fieldLabel:label,
									name:name,
									value:result[name],
									width:400
								});
							} else {
								formPanel.add({
									xtype:"textfield",
									fieldLabel:label,
									name:name,
									value:result[name],
									width:400
								});
							}

						};
						[
							"administrator_email",
							"instance_id:Instance Name",
							"instance_purpose",
							"administrator_email_on_error:Send email adminstrator on uncaught exceptions?",
							"log_engine",
							"enable_directory_listings",
							"max_running_threads:Max Requests",
							"background_thread_pool",
							"request_timeout:Default Request Timeout (seconds)",
							"thread_whitelist:Thread Management Whitelist",
							"standard_libs:Standard Libraries",
							"server_start_scripts",
							"request_handler:Request Handler Script",
							"commonjs_paths:CommonJS Search Paths",
							"strict_error_checking:Strict Syntax Warnings",
							"debug_parser_output:Save Parser Debug Output?",
							"append_profiler_output:Log Profiler Output",
							"smtp_host",
							//"datasource_directory",
							//"thread_history_size",
							"watchdog_request_startup_delay",
							"watchdog_request_check_interval",
							"watchdog_request_timeout",
							"watchdog_request_failcount",
							"watchdog_request_mem_free_percent",
							"watchdog_request_mem_failcount"
							
							
							
						].forEach(addControl)
							
					});	
					
					
					this.callParent(arguments);
				}
			});
/* =========== Log ========================================================== */
	/* ----------- Controller ------------------------------------------------ */
		controllers.push("Log");
		Ext.define('App.controller.Log', {
			extend: 'Ext.app.Controller',
			init: function() {
				this.control({
					'#main_menu_log': {
						click: this.showMain
					},
					'loggrid': {
						cellclick: this.cellClick,
						search_tips:this.searchTips
					}
					
				});
			},
			
			cellClick:function( 
				/* Ext.grid.View*/	view,
				/* HTMLElement*/	cell,
				/* Number*/	cellIndex,
				/* Ext.data.Model*/	record
				/* HTMLElement*/ //row,
				/* Number*/	//rowIndex,
				/* Ext.EventObject*/ //e
				){
				var col =view.headerCt.gridDataColumns[cellIndex];
				var value = record.get(col.dataIndex);
				var grid = view.up("grid");
				//var store = grid.getStore();
				
				switch(col.id){
					case "log_id":
						this.showDetail(record);
						break;
					case "label":
						break;
					default:
						var f = {};
						f[col.dataIndex] = value;
						//console.log(f)
						grid.applyFilter(f);
						break;
				}
			},
			searchTips:function () {
				Ext.widget({
					xtype:"window",
					autoShow:true,
					iconCls:"icon_help",
					title:"Log Search Tips",
					width:500,
					height:600,
					layout:"fit",
					items:[{
						bodyStyle:"padding:10px;",
						autoScroll:true,
						loader:{
							autoLoad:true,					
							url:  "{0}static/help/search.html?dc={1}".format(
								appUrl,
								new Date().getTime()
							)
						}
					}]
				})
			},
			showDetail:function(record){
				App.addCenterTab({
					title:record.get("label").toFixedWidth(20," ","..."),
					iconCls:"icon_log_detail",
					id:"log" + record.id,        
					//bodyStyle:"padding:10px;",
					autoScroll:true,
					html:new Ext.Template(
						'<iframe src="{url}" frameborder="no" height="100%" width="100%" scrolling="yes">\n',
					'').apply({
						url:appUrl +'log/detail/'+record.get("log_id")
					})
				});
				/* App.addCenterTab({
					title:record.get("label").toFixedWidth(20," ","..."),
					iconCls:"icon_log_detail",
					id:"log" + record.id,        
					bodyStyle:"padding:10px;",
					autoScroll:true,
					loader:{
						autoLoad:true,					
						url: appUrl +'log/detail/'+record.get("log_id")
					}
				}) */
				//window.open(appUrl +'log/detail/'+log_id)
			},
			showMain:function(){
				App.addCenterTab({
					xtype:"loggrid",
					title:"General Log",
					iconCls:"icon_log",
					id:"general_log_main"
				});
			}
			
		});
	/* =========== Views ===================================================== */
		/* ----------- logfiltercombo ----------------------------------------- */
			Ext.define('App.view.log.FilterCombo', {
				extend: 'Ext.form.field.ComboBox',
				alias:'widget.logfiltercombo',
				displayField:"value",
				valueField:"value",
				value:"",
				
				//queryMode:"local",
				initComponent:function(){
					this.store = {
						fields:["value"],
						proxy:{
							type:"direct",
							directFn:$FP.Log.columnValues,
							extraParams:{
								columnName:this.name
							}
						},
						reader:{
							type:"json"
						}
					};
					this.callParent(arguments);
				}
			});
		/* ----------- grid --------------------------------------------------- */
			Ext.define('App.view.log.Grid', {
				extend: 'univnm.ext.SupaGrid',
				alias:'widget.loggrid',
				stripeRows:true,
				store:{
					storeId:"general_log_grid",
					type:"log",
					remoteSort:true
				},
				selModel:{
					xtype:"cellmodel"
				},		
				filterPosition:"right",
				filterSuppressTitle:true,
				filterResetButtonText:"Reset",
				//filterAutoCollapse:true,
				paged:true,
				loadMask: true,
				tbar:[{
					text:"Enable Auto Refresh",
					enableToggle:true,
					iconCls:"icon_refresh",
					toggleHandler:function(btn,state){
						var grid = btn.up("loggrid");
						if (state){
							if (grid.timer ) return;
							grid.getStore().load();
							grid.timer = window.setInterval(function(){
								grid.getStore().load();
							},5000);	
							btn.setText("Disable Auto Refresh");
						}else{
							window.clearInterval(grid.timer);
							grid.timer=null;
							btn.setText("Enable Auto Refresh");
						}
						
					}
				},{
					text:"Search Tips",
					iconCls:"icon_help",
					handler:function (btn) {
						var view = btn.up("loggrid");
						view.fireEvent("search_tips",{src:view});
					}
				}],
				initComponent:function(){
					var m = new App.model.Log();
					var lr =function(val){
						return '<div class="link">'+val+'</div>';
					};
					this.columns=[
						{dataIndex:"event_ts",  /* xtype: 'datecolumn', 
							format:'m/d/Y H:i:s',*/  width:115, 
							renderer:Ext.util.Format.dateRenderer('m/d/Y H:i:s'),
							filterType:"date", 
							filterValueStart:new Date(), 
							filterValueEnd:""
						},
						{dataIndex:"log_id", header:"", width:50, filterable:false, renderer:function(){
							return '<div class="link">detail</div>';
						}},
						{dataIndex:"label", flex:1 ,minWidth:300, filterControl:"textarea"},
						
						
						{dataIndex:"type", renderer:lr},//, filterControl:"logfiltercombo" },
						{dataIndex:"app_name", renderer:lr},//, filterControl:"logfiltercombo" },
						{dataIndex:"request_id", width:225, renderer:lr},
						{dataIndex:"request_elapsed", filterable:false},
						{dataIndex:"log_elapsed", filterable:false },
						
						{dataIndex:"hostname", renderer:lr,/*, filterControl:"logfiltercombo",*/ filterValue:hostName},
						{dataIndex:"instance_id", renderer:lr,/*, filterControl:"logfiltercombo",*/ filterValue:instance_id},
						{dataIndex:"purpose", renderer:lr,/*, filterControl:"logfiltercombo",*/ filterValue:instance_purpose.toLowerCase()}
						
						
						
					].map(function(col){
						var c = $O(col).setDefaultProperties({
							header:m.getLabel(col.dataIndex),
							filterable:true,
							id:col.dataIndex,
							renderer:function(val,meta){
								meta.tdAttr ='data-qtip="{0}"'.format(val);
								return val;
							},
							flex:0
						});
						c.renderer =c.renderer.after(function(val,meta,record){
							meta.tdCls =(meta.tdCls||"") +" log_" +  record.get("type").toLowerCase();
							return arguments.callee.chain.lastReturn;
						});
						
						return c;
						
					});
						
					
					this.callParent(arguments);
					this.applyFilter();
				},
				listeners:{
				
				}
			});
			
/* =========== Request ====================================================== */
	/* ----------- Controller ------------------------------------------------ */
		controllers.push("Request");
		Ext.define('App.controller.Request', {
			extend: 'Ext.app.Controller',
			init: function() {
				this.control({
					'#main_menu_requests': {
						click: this.showMain
					},
					'requestgrid': {
						explore:function (value,record) {
							this.showThreadExplorer(record);
						},
						gc:function (event) {
							this.gc(function () {
								event.src.loadData();
							});
						}			
					}
					
				});
			},
			showMain:function(){
				App.addCenterTab({
					xtype:"requestgrid",
					title:"Running Requests",
					id:"request_main",
					iconCls:"icon_request"
				});
			},
			showThreadExplorer:function (requestRecord) {
				Ext.widget("thread_explorer",{requestRecord:requestRecord});
			},
			gc:function (cb) {
				$FP.Request.gc({},cb);
			}
			
			
		});
	/* =========== Views ===================================================== */
		/* ----------- ThreadExplorer --------------------------------------------------- */
			Ext.define('App.view.request.ThreadExplorer', {
				extend: 'Ext.window.Window',
				alias:'widget.thread_explorer',
				autoShow:true,
				width:800,
				height:600,
				maximizable:true,
				layout:{
					type:"hbox",
					align:"stretch"
				},
				requestRecord:null,
				initComponent:function () {
					var defaultCode="Myna.print($profiler.getSummaryHtml());";
					var r = this.requestRecord.data;
					this.title = "Exploring {url}".format(r);
					this.items=[{
						xtype:"form",
						width:350,
						frame:true,
						items:[
							{name:"thread_id" },
							{name:"url",labelAlign:"top"},
							{name:"started"},
							{name:"current_task",labelAlign:"top"},
							{name:"is_white_listed"},
							{name:"current_runtime"},
							{name:"runtime"},
							{name:"code", xtype:"textarea",value:defaultCode, anchor:"100% 100%", labelAlign:"top"}
						].map(function (f) {
							return Ext.applyIf(f,{
								xtype:"displayfield",
								fieldLabel:f.name.replace(/_/g," ").titleCap(),
								labelStyle:"font-weight:bold",
								labelAlign:"left"
							});
						}),
						buttons:[{
							text:"submit",
							handler:function (btn) {
								var form = btn.up("form").form;
								btn.up("thread_explorer").down("*[itemId=results]").getLoader().load({
									params:{
										code:form.findField("code").getValue(),
										thread_id:r.thread_id
									}
								})
							}
						}]
					},{
						xtype:"panel",
						itemId:"results",
						flex:1,
						autoScroll:true,
						loader:{
							url: appUrl +'request/explore',
							params:{
								code:defaultCode,
								thread_id:r.thread_id
							},
							ajaxOptions:{
								method:"post",
								disableCaching:true
							},
							autoLoad:true
						}
					}];
					this.callParent(arguments);
					r.current_runtime = Date.formatInterval(r.current_runtime);
					r.runtime = Date.formatInterval(r.runtime);
					this.down("form").form.setValues(r);
				}
			});
		/* ----------- grid --------------------------------------------------- */
			Ext.define('App.view.request.Grid', {
				extend: 'univnm.ext.SupaGrid',
				alias:'widget.requestgrid',
				stripeRows:true,
				store:{
					storeId:"request_grid",
					fields:[
						"rownum",
						"thread_id",
						"url",
						"started",
						"current_task",
						"is_white_listed",
						"current_runtime",
						"runtime"
					]
				},
				
				dockedItems:[{
					position:"top",
					xtype:"form",
					frame:true,
					layout:{
						type:"hbox",
						align:"stretch"
					},
					height:50,
					defaults:{
						xtype:"displayfield",
						flex:1,
						labelAlign:"top",
						labelStyle:"font-weight:bold"
					},
					items:[{
						fieldLabel:"Uptime",
						name:"uptime"
					},{
						fieldLabel:"Memory Used",
						name:"memUsed"
					},{
						fieldLabel:"Memory Free",
						name:"memFree"
					},{
						fieldLabel:"Running Threads",
						name:"runningThreads"
					},{
						fieldLabel:"Waiting Threads",
						name:"waitingThreads"
					},{
						xtype:"button",
						text:"GC",
						width:50,
						flex:0,
						tooltip:"Run garbage collection",
						handler:function (btn) {
							var view =btn.up("requestgrid");
							view.fireEvent("gc",{src:view});
						}
					}]
				}],

				columns:[
					{dataIndex:"thread_id", header:"Thread ID", renderer:U.link, eventName:"explore"},
					{dataIndex:"url", header:"URL",flex:1,renderer:function(val,meta){
						meta.tdAttr =" data-qtip='{0}'".format(val.replace(/'/g,""));
						return val;
					}},
					
					{dataIndex:"current_task", header:"Current Task",flex:1,renderer:function(val,meta){
						meta.tdAttr =" data-qtip='{0}'".format(val.replace(/'/g,""));
						return val;
					}},
					/* {dataIndex:"is_white_listed", header:"is_white_listed"}, */
					{dataIndex:"started",  header:"Started"},
					{dataIndex:"current_runtime", header:"Current Runtime",renderer:function(time){
								return Date.formatInterval(time);
							}},
					{dataIndex:"runtime", header:"Total Runtime",renderer:function(time){
								return Date.formatInterval(time);
							}}
					
				
				],
				loadMask:true,
				loadData:function(){
					var panel = this;
					$FP.Request.list({},function(result){
						panel.down("form").form.setValues(result);
						panel.getStore().loadRawData(result.threads);
						
					});
				},
				listeners:{
					activate:function(panel){
						if (panel.timer) return;
						var loadData = function () {panel.loadData();};
						loadData();
						panel.timer = window.setInterval(loadData,2000);
					},
					deactivate:function(panel){
						window.clearInterval(panel.timer);
						panel.timer=null;
					},
					destroy:function(panel){
						window.clearInterval(panel.timer);
						panel.timer=null;
					}
				},
				initComponent:function () {
					this.callParent(arguments);
					this.fireEvent("activate",this);
				}
			});
			
/* =========== Upgrade ====================================================== */
	/* ----------- Controller ------------------------------------------------ */
		controllers.push("Upgrade");
		Ext.define('App.controller.Upgrade', {
			extend: 'Ext.app.Controller',
			init: function() {
				this.control({
					'#main_menu_upgrade_web': {
						click: this.upgradeWeb
					},
					'#main_menu_upgrade_local': {
						click: this.upgradeLocal
					}
					
					
				});
			},
			displayResponse:function(content){
				new Ext.Window({
						width:800,
						height:600,
						layout:"fit",
						autoShow:true,
						items:[{
							autoScroll:true,
							frame:true,
							html:content
						}]
					});
			},
			upgradeWeb:function(){
				var $this= this;
				$FP.Upgrade.web({version:latestVersion},U.directMask(document.body,"Downloading and upgrading Myna<br>(This might take awhile)", function(result){
					$this.displayResponse(result);
				}));
			},
			upgradeLocal:function(){
				var $this= this;
				var win=new Ext.Window({
					autoShow:true,
					title:"Upload a new Myna version",
					modal:true,
					items:[{
						id:"uploadForm",
						xtype:"form",
						width:600,
						fileUpload: true,
						url:appUrl+"upgrade/local",
						frame: true,
						defaults:{
							xtype:"textfield"
						},
						items: [{
							inputType: 'file',
							name: 'file',
							anchor:"90%",
							allowBlank: false,
							width:400
						},{
							id:"uploadProgress",
							xtype:'progressbar'
							
						}],
						
						buttons:[{
							text:"Upload",
							handler:function(button){
								var formPanel = button.up("form");
								if(formPanel.getForm().isValid()){
									Ext.get(document.body).mask("Uploading and upgrading Myna<br>(This might take awhile)");
									formPanel.getForm().submit( {
										success:function(form,action){
											Ext.get(document.body).unmask();
											$this.displayResponse(action.result.message);
											
										}
									});
									var checkProgress = function(){
										$FP.Upgrade.uploadStatus({},function(obj){
											var progressBar = Ext.getCmp("uploadProgress");
											if (obj.message){
												progressBar.updateProgress(obj.percentComplete,obj.message);
											}
											
											if (obj.bytesRead != obj.totalBytes){
												//check again in 1 second
												window.setTimeout(checkProgress,1000);
											} else {
												progressBar.reset();
												win.close();
												
											}
										});
									};
									//first check in 1 second
									window.setTimeout(checkProgress,1000);
								}
							}
						}]
						
					}]
				});
			}
		});
	
/* =========== Cron (Scheduled Tasks) ======================================= */
	/* ----------- Controller ------------------------------------------------ */
		controllers.push("Cron");
		Ext.define('App.controller.Cron', {
			extend: 'Ext.app.Controller',
			init: function() {
				this.control({
					'viewport': {
						launchCron: this.showMain
					},
					'cronedit':{
						save_cron:function(event){
							var form = event.src.form;
							this.saveCron(event.model,function(result){
								if (result.success) {
									form.close();
								} else {
									form.markInvalid(result.errors);
									if (result.errorMessage.length || result.errorDetail.length){
										Ext.Msg.show({
											title:result.errorMessage,
											msg:result.errorDetail,
											buttons: Ext.Msg.OK,
											icon: Ext.Msg.ERROR
										});
	
									}
								}
							});
						},
						delete_cron:function(event){
							var form = event.src.form;
							this.deleteCron(event.model,function(){
								form.close();
							});
						},
						run_task_now:function (event) {
							U.infoMsg("Running task '{task}'. See general log for details.".format(event))
							this.runTask(event.task);
						}
						
					}
				});
			},
			saveCron:function(model,cb){
				$FP.Cron.save(
					model.data,
					function(result){
						if (result.success) {
							model.commit();
						} else {
							model.reject();
						}
						if (cb) cb(result);
					}
				);
					
			},
			deleteCron:function(model,cb){
				$FP.Cron.remove(
					model.data,
					function(result){
						model.stores.forEach(function(s){
							s.remove(model);
						});
						if (cb) cb(result);
					}
				);
					
			},
			runTask:function (name) {
				$FP.Request.run({name:name});
			},
			showMain:function(){
				App.addCenterTab({
					xtype:"crongrid",
					id:"CronMain",
					title:"ScheduledTasks",
					iconCls:"icon_cron"
				});
			}
		});
	/* =========== Views ===================================================== */
		/* ----------- crongrid ----------------------------------------------- */
			Ext.define('App.view.cron.Grid', {
				extend: 'univnm.ext.SupaGrid',
				alias:'widget.crongrid',
				stripeRows:true,
				store:{
					storeId:"general_cron_grid",
					autoLoad:true,
					type:"cron",
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
					text:"Add Task",
					iconCls:"icon_add",
					handler:function(){
						this.up("crongrid").showEditForm();
					}
				},{
					text:"Refresh Task List",
					iconCls:"icon_refresh",
					handler:function (btn) {
						btn.up("crongrid").getStore().load();
					}
				}],
				editFormConfig:{
					xtype:"cronedit",
					position:"right"
				},
				filterPosition:"top",
				filterSuppressTitle:true,
				filterMode:"local",
				//paged:true,
				loadMask: true,
				initComponent:function(){
					var m = new App.model.Cron();
					this.columns=[
						{dataIndex:"name", renderer:U.link,  width:250},
						{dataIndex:"description", renderer:U.tipRender, flex:1 },
						{dataIndex:"is_active", 
							filterable:true,
							filterControl:{xtype:"quickdrop",values:{"Yes":1,"No":"0"},editable:false}, 
							renderer:function(v){return v==1?"Yes":"No";}
						},
						{dataIndex:"type",filterable:false},
						{dataIndex:"lastRun", width:125, filterable:false, renderer:Ext.util.Format.dateRenderer('m/d/Y H:i:s')},
						{dataIndex:"nextRun", width:125, filterable:false, renderer:Ext.util.Format.dateRenderer('m/d/Y H:i:s')}
					].map(function(col){
						return $O(col).setDefaultProperties({
							text:m.getLabel(col.dataIndex),
							filterable:true,
							//id:col.dataIndex,
							flex:0
						});
					});
						
					
					this.callParent(arguments);
					this.applyFilter();
				}
			});
		/* ----------- cronedit ----------------------------------------------- */
			Ext.define('App.view.cron.Edit', {
				extend: 'Ext.form.Panel',
				alias:'widget.cronedit',
				//layout:"fit",
				/* Event:  */
				frame:true,
				autoScroll:true,
				width:450,
				fieldDefaults:{
					labelStyle:"font-weight:bold;",
					//labelAlign:"top",
					//labelWidth:200,
					anchor:"99%",
					labelAlign:"top",
					enableKeyEvents:true,
					msgTarget:"right"
					
				},	
				defaults:{
					xtype:"textfield"
				},
				buttons:[{
					text:"Run Now",
					iconCls:"icon_request",
					handler:function (btn) {
						var view = btn.up("cronedit");
						var name = view.form.findField("name").getValue();
						view.fireEvent("run_task_now",{
							src:view,
							task:name
						})
					}
				},{
					xtype:"tbfill"
				},{
					text:"Save",
					iconCls:"icon_save",
					action:"save",
					handler:function(btn){
						var view = btn.up("cronedit");
						var form = view.form;
						if (form.isValid()){
							form.updateRecord(form.currentRecord);
							[
								"daily_time",
								"weekly_time",
								"monthly_by_date_time",
								"monthly_by_weekday_time",
								"yearly_time"
							].forEach(function(name){
								var t =form.currentRecord.get(name); 
								if (t){
									form.currentRecord.set(name,t.format("H:i"));
								}
							});
							
							view.fireEvent("save_cron",{
								src:view,
								model:form.currentRecord
							});
						}
					}
				},{
					text:"Delete",
					iconCls:"icon_delete",
					action:"delete",
					handler:function(btn){
						var view = btn.up("cronedit");
						var form = view.form;
						var model =form.currentRecord;
						if (window.confirm("Delete task '{name}'".format(model.data))){
							form.updateRecord(form.currentRecord);
							view.fireEvent("delete_cron",{
								src:view,
								model:form.currentRecord
							});
						}
					}
				}],
				initComponent:function(){
					var m =App.model.Cron;
					var fm = function(f){
						if (!f.name) return f;
						
						f.fieldLabel =m.fields[f.name].label;
						f.validator = function(){
							//console.log(f.name,typeof value)
							try{
								var allValues = this.up("form").form.getFieldValues();
								//allValues[f.name] = value
								var v = m.validation.validate(
									allValues,
									f.name
								);
								//console.log(f.name,v)
								if (v.success || !(f.name in v.errors)){
									return true;
								} else {
									//console.log(v.errors[f.name])
									return v.errors[f.name];
								}
							} catch(e){
								console.log("error",e,e.stack);	
							}
						};
						
						return f;
					};
					
					this.items=[{
						name:"lastRun",
						xtype:"displayfield"
					},{
						name:"nextRun",
						xtype:"displayfield"
					},{
						name:"name",
						validator:function(val){
							var model  = this.up("form").form.currentRecord;
							if (model.phantom){
								var store = Ext.StoreMgr.get("cron_grid");
								if (store.findExact("name",val) !=-1) return "Name exists on a another Task.";
							}
							return true;
						}
					},{
						name:"description",
						xtype:"textarea"
					},{
						name:"script"
					},{
						xtype:"panel",
						height:225,
						border:false,
						defaults:{
							bodyCls:"x-panel-body-default-framed"
							//frame:true
						},
						layout:{
							type:"hbox",
							align:"stretch"
						},
						items:[{//left side
							flex:1,
							defaults:{
								width:200
							}, 
							items:[{
								name:"is_active",
								xtype:"quickdrop",
								editable:false,
								values:{
									"Yes":1,
									"No":0
								}
							},{
								name:"start_date",
								xtype:"datetime"
							
							},{
								name:"end_date",
								xtype:"datefield"
							}].map(fm)
						},{ //right side
							itemId:"typepanel",
							frame:true,
							layout:{
								type:"vbox",
								align:"stretch"
							},
							width:200,         
							flex:1,
							items:[{
								xtype:"quickdrop",
								name:"type",
								editable:false, 
								value:"Simple",
								values:{
									Simple:				"Simple",			
									Hourly:				"Hourly",				
									Daily:				"Daily",			
									Weekly:				"Weekly",	
									MonthlyByDate:		"MonthlyByDate",	
									MonthlyByWeekday:	"MonthlyByWeekday",	
									Yearly:				"Yearly"				
								},
								listeners:{
									/* select:f=function(combo,records){
										console.log(records)
										combo.up("*[itemId=typepanel]")
										.down("*[itemId=cards]").getLayout().setActiveItem(
												records[0].index
											)
									}, */
									change:function(combo,newVal){
										if (!newVal) return;
										window.setTimeout(function(){
										var index= combo.getStore().find("value",newVal);
										combo.up("*[itemId=typepanel]")
										.down("*[itemId=cards]").getLayout().setActiveItem(
											index
										);
										});
									}
								},
								height:45
							},{
								flex:1,
								itemId:"cards",
								bodyCls:"x-panel-body-default-framed",
								layout:{
									type:"card"
								},
								defaults:{
									xtype:"panel",
									bodyCls:"x-panel-body-default-framed"
								},
								items:[
									{xtype:"cron_simple"},
									{xtype:"cron_hourly"},
									{xtype:"cron_daily"},
									{xtype:"cron_weekly"},
									{xtype:"cron_monthly_by_date"},
									{xtype:"cron_monthly_by_weekday"},
									{xtype:"cron_yearly"}
								
								]
							}].map(fm)
						}]
						
					}].map(fm);	
					
					this.callParent(arguments);
				}
			});
		/* ----------- cron_simple -------------------------------------------- */
			Ext.define('App.view.cron.Simple', {
				extend: 'Ext.panel.Panel',
				alias:'widget.cron_simple',
				constructor:function(config){
					var m =App.model.Cron;
					var fm = function(f){
						if (!f.name) return f;
						
						f.fieldLabel =m.fields[f.name].label;
						f.validator = function(){
							//console.log(f.name,typeof value)
							try{
								var allValues = this.up("form").form.getFieldValues();
								//allValues[f.name] = value
								var v = m.validation.validate(
									allValues,
									f.name
								);
								//console.log(f.name,v)
								if (v.success || !(f.name in v.errors)){
									return true;
								} else {
									//console.log(v.errors[f.name])
									return v.errors[f.name];	
								}
							} catch(e){
								console.log("error",e);	
							}
						};
						
						return f;
					};
					Ext.apply(config,{
						items:[{
							name:"interval",
							xtype:"numberfield"
							
						},{
							name:"scale",
							xtype:"quickdrop",
							editable:false, 
							value:"Minutes",
							values:{
								Minutes:"minutes",
								Hours:"hours",
								Days:"days",
								Weeks:"weeks"
							}
						}].map(fm)
					});
					this.callParent(arguments);
				}
				
			});
		/* ----------- cron_hourly -------------------------------------------- */
			Ext.define('App.view.cron.Hourly', {
				extend: 'Ext.panel.Panel',
				alias:'widget.cron_hourly',
				constructor:function(config){
					var m =App.model.Cron;
					var fm = function(f){
						if (!f.name) return f;
						
						//f.fieldLabel =m.fields[f.name].label
						f.validator = function(){
							//console.log(f.name,typeof value)
							try{
								var allValues = this.up("form").form.getFieldValues();
								//allValues[f.name] = value
								var v = m.validation.validate(
									allValues,
									f.name
								);
								//console.log(f.name,v)
								if (v.success || !(f.name in v.errors)){
									return true;
								} else {
									//console.log(v.errors[f.name])
									return v.errors[f.name];	
								}
							} catch(e){
								console.log("error",e);	
							}
						};
						
						return f;
					};
					Ext.apply(config,{
						items:[{
							xtype:"label",
							text:"Repeat every"
						},{
							name:"hourly_repeat",
							xtype:"numberfield",
							width:40
							
						},{
							xtype:"label",
							text:"hours at"
						},{
							name:"hourly_minutes",
							xtype:"textfield",
							width:100,
							value:0
						},{
							xtype:"label",
							text:"minutes after the hour (comma separated)"
						}].map(fm)
					});
					this.callParent(arguments);
				}
				
			});
		/* ----------- cron_daily --------------------------------------------- */
			Ext.define('App.view.cron.Daily', {
				extend: 'Ext.panel.Panel',
				alias:'widget.cron_daily',
				constructor:function(config){
					var m =App.model.Cron;
					var fm = function(f){
						if (!f.name) return f;
						
						//f.fieldLabel =m.fields[f.name].label
						f.validator = function(){
							//console.log(f.name,typeof value)
							try{
								var allValues = this.up("form").form.getFieldValues();
								//allValues[f.name] = value
								var v = m.validation.validate(
									allValues,
									f.name
								);
								//console.log(f.name,v)
								if (v.success || !(f.name in v.errors)){
									return true;
								} else {
									//console.log(v.errors[f.name])
									return v.errors[f.name];	
								}
							} catch(e){
								console.log("error",e);	
							}
						};
						
						return f;
					};
					Ext.apply(config,{
						items:[{
							xtype:"label",
							text:"Repeat every"
						},{
							name:"daily_repeat",
							xtype:"numberfield",
							width:40
							
						},{
							xtype:"label",
							text:"days at"
						},{
							name:"daily_time",
							xtype:"timefield",
							width:75,
							value:0
						}].map(fm)
					});
					this.callParent(arguments);
				}
				
			});
		/* ----------- cron_weekly -------------------------------------------- */
			Ext.define('App.view.cron.Weekly', {
				extend: 'Ext.panel.Panel',
				alias:'widget.cron_weekly',
				constructor:function(config){
					var m =App.model.Cron;
					var fm = function(f){
						if (!f.name) return f;
						
						//f.fieldLabel =m.fields[f.name].label
						f.validator = function(){
							//console.log(f.name,typeof value)
							try{
								var allValues = this.up("form").form.getFieldValues();
								//allValues[f.name] = value
								var v = m.validation.validate(
									allValues,
									f.name
								);
								//console.log(f.name,v)
								if (v.success || !(f.name in v.errors)){
									return true;
								} else {
									//console.log(v.errors[f.name])
									return v.errors[f.name];	
								}
							} catch(e){
								console.log("error",e);	
							}
						};
						
						return f;
					};
					Ext.apply(config,{
						items:[{
							xtype:"label",
							text:"Repeat every"
						},{
							name:"weekly_repeat",
							xtype:"numberfield",
							width:50
							
						},{
							xtype:"label",
							text:"weeks on"
						},{
							xtype: 'checkboxgroup',
							style:"width:100%",
							columns: 4,
							//vertical: true,
							itemId:"weekly_days",
							items: [
								"Sun",
								"Mon",
								"Tue",
								"Wed",
								"Thu",
								"Fri",
								"Sat"
							
							].map(function(day,index){
								return { 
									boxLabel: day,
									boxLabelAlign:"before",
									name: 'days', 
									inputValue: String(index)
								};
							})
							
						},{
							xtype:"hidden",
							name:"weekly_days",
							getValue:function(){
								if (this.ownerCt){
									
									return this.ownerCt.down("*[itemId=weekly_days]").getValue().days;
								} 
							},
							setValue:function(val){
								if (this.ownerCt && (val||val=="0")){
									var cbg = this.ownerCt.down("*[itemId=weekly_days]");
									cbg.setValue({
										days:String(val).split(/,/).map(function (v) {return String(v)})
									});
								}
							}
						},{
							xtype:"label",
							text:"at"
						},{
							name:"weekly_time",
							xtype:"timefield",
							width:75,
							value:0
						}].map(fm)
					});
					this.callParent(arguments);
				}
				
			});
		/* ----------- cron_monthly_by_date ----------------------------------- */
			Ext.define('App.view.cron.MonthlyByDate', {
				extend: 'Ext.panel.Panel',
				alias:'widget.cron_monthly_by_date',
				constructor:function(config){
					var m =App.model.Cron;
					var fm = function(f){
						if (!f.name) return f;
						
						//f.fieldLabel =m.fields[f.name].label
						f.validator = function(){
							if (!this.up("form")) return true;
							//console.log(f.name,typeof value)
							try{
								var allValues = this.up("form").form.getFieldValues();
								//allValues[f.name] = value
								var v = m.validation.validate(
									allValues,
									f.name
								);
								//console.log(f.name,v)
								if (v.success || !(f.name in v.errors)){
									return true;
								} else {
									//console.log(v.errors[f.name])
									return v.errors[f.name];	
								}
							} catch(e){
								console.log("error",e,e.stack);	
							}
						};
						
						return f;
					};
					Ext.apply(config,{
						items:[{
							xtype:"label",
							text:"Repeat every"
						},{
							name:"monthly_by_date_repeat",
							xtype:"numberfield",
							width:40
							
						},{
							xtype:"label",
							text:"months on day"
						},{
							name:"monthly_by_date_day",
							xtype:"numberfield",
							maxValue:28,
							width:40
							
						},{
							xtype:"label",
							text:"at"
						},{
							name:"monthly_by_date_time",
							xtype:"timefield",
							width:75,
							value:"00:00"
						}].map(fm)
					});
					this.callParent(arguments);
				}
				
			});
		/* ----------- cron_monthly_by_weekday -------------------------------- */
			Ext.define('App.view.cron.MonthlyByWeekday', {
				extend: 'Ext.panel.Panel',
				alias:'widget.cron_monthly_by_weekday',
				constructor:function(config){
					var m =App.model.Cron;
					var fm = function(f){
						if (!f.name) return f;
						
						//f.fieldLabel =m.fields[f.name].label
						f.validator = function(){
							if (!this.up("form")) return true;
							//console.log(f.name,typeof value)
							try{
								var allValues = this.up("form").form.getFieldValues();
								//allValues[f.name] = value
								var v = m.validation.validate(
									allValues,
									f.name
								);
								//console.log(f.name,v)
								if (v.success || !(f.name in v.errors)){
									return true;
								} else {
									//console.log(v.errors[f.name])
									return v.errors[f.name];	
								}
							} catch(e){
								console.log("error",e);	
							}
						};
						
						return f;
					};
					Ext.apply(config,{
						items:[{
							xtype:"label",
							text:"Repeat every"
						},{
							name:"monthly_by_weekday_repeat",
							xtype:"numberfield",
							width:40
							
						},{
							xtype:"label",
							text:"months on the "
						},{
							xtype:"quickdrop",
							name:"monthly_by_weekday_daycount",
							values:{
								"First":1,
								"Second":2,
								"Third":3,
								"Fourth":4,
								"Fifth":5
							}
						},{
							xtype:"quickdrop",
							name:"monthly_by_weekday_day",
							values:{
								"Sunday":0,
								"Monday":1,
								"Tuesday":2,
								"Wednesday":3,
								"Thursday":4,
								"Friday":5,
								"Saturday":6
								
							}
						},{
							xtype:"label",
							text:"of the month at"
						},{
							name:"monthly_by_weekday_time",
							xtype:"timefield",
							width:75,
							value:"00:00"
						}].map(fm)
					});
					this.callParent(arguments);
				}
				
			});
		/* ----------- cron_yearly -------------------------------------------- */
			Ext.define('App.view.cron.Yearly', {
				extend: 'Ext.panel.Panel',
				alias:'widget.cron_yearly',
				constructor:function(config){
					var m =App.model.Cron;
					var fm = function(f){
						if (!f.name) return f;
						
						//f.fieldLabel =m.fields[f.name].label
						f.validator = function(){
							if (!this.up("form")) return true;
							//console.log(f.name,typeof value)
							try{
								var allValues = this.up("form").form.getFieldValues();
								//allValues[f.name] = value
								var v = m.validation.validate(
									allValues,
									f.name
								);
								//console.log(f.name,v)
								if (v.success || !(f.name in v.errors)){
									return true;
								} else {
									//console.log(v.errors[f.name])
									return v.errors[f.name];	
								}
							} catch(e){
								console.log("error",e);	
							}
						};
						
						return f;
					};
					Ext.apply(config,{
						items:[{
							xtype:"label",
							text:"Repeat every"
						},{
							name:"yearly_repeat",
							xtype:"numberfield",
							width:40
							
						},{
							xtype:"label",
							text:"years on"
						},{
							xtype:"datefield",
							name:"yearly_date",
							format:"m/d",
							width:75,
							getValue:function(){
								return this.getRawValue();
							},
							value:"01/01"
						},{
							xtype:"label",
							text:"at"
						},{
							name:"yearly_time",
							xtype:"timefield",
							width:75,
							value:"00:00"
						}].map(fm)
					});
					this.callParent(arguments);
				}
				
			});
/*  */
/*  */

/* ----------- Application definition: App ---------------------------------- */
	Ext.application({
		name: 'App',
		controllers:controllers,
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