/* ------------- init ------------------------------------------------------- */
	function	init(){
		this.addFields([																												
			{	name:"name",			idField:true,	type:"string",		defaultValue:""	},
			{	name:"start_date",						type:"date",		defaultValue:function(){return	new	Date()}	},
			{	name:"description",						type:"string",		defaultValue:""	},	
			{	name:"script",		type:"string",		defaultValue:"",	label:"Script or URL"},			
			{	name:"type",							type:"string",		defaultValue:"Simple"	,		label:"Schedule Type"},											
			{	name:"is_active",						type:"numeric",		defaultValue:1	,		label:"Active?"},					
			{	name:"end_date",						type:"date",		defaultValue:null	},											
			{	name:"remove_on_expire",				type:"numeric",		defaultValue:0	,					label:"Remove When Expired?"},
			{	name:"interval",						type:"numeric",		defaultValue:1	},
			{	name:"scale",							type:"string",		defaultValue:"Hours"	},
			{	name:"hourly_repeat",					type:"numeric",		defaultValue:1	},
			{	name:"hourly_minutes",					type:"string",		defaultValue:"0",			label:"Minutes after the hour"},
			{	name:"daily_repeat",					type:"numeric",		defaultValue:1	},
			{	name:"daily_time",						type:"string",		defaultValue:"00:00"	},
			{	name:"weekly_repeat",					type:"numeric",		defaultValue:1	},
			{	name:"weekly_days",						type:"string",		defaultValue:[1]	},
			{	name:"weekly_time",						type:"string",		defaultValue:"00:00"	},
			{	name:"monthly_by_date_repeat",			type:"numeric",		defaultValue:1	},
			{	name:"monthly_by_date_time",			type:"string",		defaultValue:"00:00"	},
			{	name:"monthly_by_date_day",				type:"string",		defaultValue:1	},
			{	name:"monthly_by_weekday_repeat",		type:"numeric",		defaultValue:1	},
			{	name:"monthly_by_weekday_daycount",		type:"numeric",		defaultValue:1	},
			{	name:"monthly_by_weekday_day",			type:"string",		defaultValue:1	},
			{	name:"monthly_by_weekday_time",			type:"string",		defaultValue:"00:00"	},
			{	name:"yearly_repeat",					type:"numeric",		defaultValue:1	},
			{	name:"yearly_date",						type:"string",		defaultValue:"01/01"	},
			{	name:"yearly_time",						type:"string",		defaultValue:"00:00"	},
			{	name:"lastRun",		label:"Last Run",	type:"date",		defaultValue:function(){return	new	Date()}	},
			{	name:"nextRun",		label:"Next Run",	type:"date",		defaultValue:function(){return	new	Date()}	}
		])
		
		this.deferred = true;
		this.validation = Myna.Admin.task.taskValidation.clone()
		
		
	}
/* ------------- Methods ---------------------------------------------------- */

function create(task){
	var vr =Myna.Admin.task.save(task);
	if (vr.success){
		return this.getById(task.name)
	} else throw vr
	
}
function forceDelete(name){
	Myna.Admin.task.remove(name)
}
function saveBeanField(bean,fieldName,oldval,newval){
	var v = bean.validate(fieldName);
	/* 
	Don't actually save. Bean instances of this model are always deferred and
	must be saved via "save" which eventually calls "create"
	*/
	return v
}

function query(pattern,options){
	var $this = this;
	if (!pattern) pattern={}
	if (pattern.select == "*") delete pattern.select
	if (pattern.select) pattern.select = pattern.select.replace(/\s*/g,"")
	var criteria = pattern.filter(function(v,k){
		return !"select,where,orderBy".listContains(k)
	})

	
	var result= Myna.Admin.task.getAll().toArray()
	.filter(function(tuple){
		var task =tuple.value
		if (!criteria.getKeys().length) return true
		var ret= 
			criteria.getKeys()
			.every(function(key){
				if (typeof criteria[key] == "string"){
					return new RegExp(criteria[key],"i").test(task[key]||"")
				} else {
					return criteria[key] == task[key]
				}
			})
		return ret
	}).map(function(tuple){
		var row = tuple.value
		if (!pattern.select) return row
					
		return row.filter(function(v,k){
			return pattern.select.listContains(k)
		})
	})
	//Myna.printDump(result,"result")
	return new Myna.DataSet({
		columns:pattern.select||this.fieldNames,
		data:result
	})
}
