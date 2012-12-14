/* Class:  Ext.ux.QuickDrop
	A simple combbox implementation for static lists
	
	Detail:
	This component takes all the normal ComboBox config options, except 
	
	* store
	* valueField
	* displayField
	* mode
	
	which are set internally. Instead you set a values property that is a JS 
	object of label:value pairs
	
	
	Topic: Example
	(code)
		...
		xtype:"quickdrop",
		name:"is_awesome",
		fieldLabel:"Are you Awesome?",
		values:{
			"Hell Ya!":1,
			"um, what?":0
		}
		
		...
	(end)
	You can also pass an array of objects
	(code)
		...
		xtype:"quickdrop",
		name:"is_awesome",
		fieldLabel:"Are you Awesome?",
		values:[
			{label:"Hell Ya!", value:1},
			{label:"um, what?",value:0}
		]
		
		...
	(end)

	Default Properties:
		editable		-	true,
		typeAhead		-	true,
		minChars		-	1,
		selectOnFocus	-	:true
			
		
*/
Ext.define('Ext.ux.QuickDrop', {
	extend: 'Ext.form.ComboBox',
	alias: 'widget.quickdrop',
	initComponent:function(){
		var data = []
		var config = this
		if (config.values instanceof Array){
			data = config.values
		}else{
			for (var p in config.values){
				if (typeof config.values[p] != "function"){
					data.push({
						label:p,
						value:config.values[p]
					})	
				}
			}
		}
		Ext.apply(config,{
			store:{
				fields:[
					"label",
					"value"
				],
				data:data
			},
			mode:"local",
			valueField:"value",
			displayField:"label"
		})
		Ext.applyIf(config,{
			editable:true,
			typeAhead:true,
			minChars:1,
			
			selectOnFocus:true
		})
		//console.log(this)
		this.callParent(arguments);
		
	}	
});