Ext.define('App.model.<%=modelName%>', {
	extend: 'Ext.data.Model',
	fields:$f=[
	<@loop array="model.fieldNames" element="name" index="i">
		<% var field= model.getField(name); %>
		{
			name:<%=JSON.stringify(field.name)%>,
			label:<%=JSON.stringify(model.getLabel(field.name))%>,
			jsType:<%=JSON.stringify(field.type)%>
			<@if field.defaultValue || field.defaultValue === 0.0>
			,defaultValue:<%=JSON.stringify(field.defaultValue)%>
			</@if>
			<@if field.type == "date">
			,convert:function(val){
				if (!(/\/Date\(\d+\)\//).test(val)) return val
				return new Date(parseInt(val.match(/Date\((\d+)\)/)[1]));
			}
			</@if>
		}<@if i < model.fieldNames.length-1>,</@if>
	</@loop>
	], 
	validation:$v =<%=model.validation.toCode()%>,
	statics:{
		fields:$f.toDataSet().toMap("name"),
		validation:$v,
		getValidator:$gv=function(fieldName){
			var m = this;
			return function(){
				if (!this.up("form")) return true;
				try{
					var allValues = this.up("form").form.getFieldValues();		
					var v = m.validation.validate(
						allValues,
						fieldName
					);
					if (v.success || !(fieldName in v.errors)){
						return true;
					} else {
						return v.errors[fieldName];	
					}
				} catch(e){
					if (typeof console != "undefined"){
						console.log("error",e,e.stack);	
					}
					return true
				}
			};
		}

	},
	idProperty:'<%=model.idField%>',
	getLabel:function (col){
		if (col in App.model.<%=modelName%>.fields){
		
			return App.model.<%=modelName%>.fields[col].label
		} else { 
			//console.log(App.model.<%=modelName%>.fields)
			return col
		}
	},
	proxy:{
		type:"direct",
		paramsAsHash:true,
		<@if controller>
		api:{
		<@if controller.save>
			create:$FP.<%=modelName%>.save,
			update:$FP.<%=modelName%>.save,
		</@if>
		<@if controller.get>	
			read:$FP.<%=modelName%>.get,
		</@if>
		<@if controller.remove>
			destroy:$FP.<%=modelName%>.remove,
		</@if>
			dummy:undefined
		},
		</@if>
		reader: {
			type: 'json',
			idProperty:'<%=model.idField%>'
		}
	},
	//override default validator 
	validate:function(){
		var errors  = Ext.create('Ext.data.Errors')
		var vr = this.validation.validate(this.data)
		$O(vr.errors).forEach(function(message,field){
			errors.add({
				field: field,
				message: message
			})
		})
		return errors;
	},
	validation:$v,
	getValidator:$gv
	
});

Ext.define('App.store.<%=modelName%>', {
	extend: 'Ext.data.Store',
	alias: 'store.<%=modelName.toLowerCase()%>',
	requires: ['Ext.data.proxy.Direct'],
	
	constructor : function(config){
		config = Ext.apply({}, config);
		if (!config.proxy) {
			var proxy = {
				type: 'direct',
				directFn:$FP.<%=modelName%>.list,
				
				paramsAsHash:true,
				reader: {
					type: 'json',
					totalProperty:'totalRows',
					root:'data',
					idProperty:'<%=model.idField%>'
				}
			};
			
			config.proxy = proxy;
			config.model=App.model.<%=modelName%>;
			
		}
		this.callParent([config]);
	}	
});