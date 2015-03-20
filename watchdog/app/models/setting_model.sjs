
/* ------------- init ------------------------------------------------------- */
	function init(){
		this.addFields([
			/*{ name:"adapter/auth_type", idField:true, type:"string", defaultValue:"watchdog"},
			{ name:"adapter/adapter", type:"string", defaultValue:"ldap"},
			{ name:"adapter/prettyName", type:"string", defaultValue:"Watchdog Login"},
			{ name:"adapter/desc", type:"string", defaultValue:"Login using your Active Directory domain credentials"},
			{ name:"adapter/ad_domain", type:"string", defaultValue:""},
			{ name:"adapter/server", type:"string", defaultValue:"ldaps://domain.example.com/dc=domain,dc=example,dc=com"},
			{ name:"adapter/filter", type:"string", defaultValue:"(sAMAccountType=805306368)"},
			{ name:"adapter/group_filter", type:"string", defaultValue:"(objectCategory=group)"},
			{ name:"adapter/search_columns", type:"string", defaultValue:"cn,givenName,sn"},
			{ name:"adapter/username", type:"string", defaultValue:""},
			{ name:"adapter/password", type:"string", defaultValue:""},
			{ name:"adapter/map/first_name", type:"string", defaultValue:"givenName"},
			{ name:"adapter/map/last_name", type:"string", defaultValue:"sn"},
			{ name:"adapter/map/middle_name", type:"string", defaultValue:"initials"},
			{ name:"adapter/map/login", type:"string", defaultValue:"sAMAccountName"},
			{ name:"adapter/map/title", type:"string", defaultValue:"title"},
			{ name:"adapter/map/email", type:"string", defaultValue:"mail"},
			{ name:"adapter/map/group_name", type:"string", defaultValue:"cn"},
			{ name:"adapter/map/group_member", type:"string", defaultValue:"member"},*/
			{ name:"notification_email", type:"string", defaultValue:""},
			/*{ name:"ldap_users", type:"string", defaultValue:""},
			{ name:"ldap_groups", type:"string", defaultValue:"Domain Admins"}*/

			
		])
	
		
		this.deferred = true;
		
	}
/* ------------- Methods ---------------------------------------------------- */

function create(data){
	Myna.printConsole("creating ...",Myna.dumpText(data));
	var settingsFile = new Myna.File($FP.dir,"settings.json")
	settingsFile.writeString(JSON.stringify(data,null,"    "))
	return new this.beanClass(data,this)
	
}
function getSettings() {
	var settingsFile = new Myna.File($FP.dir,"settings.json");
	if (!settingsFile.exists()){
		settingsFile.writeString(JSON.stringify({
			
			"notification_email": ""
			
		},null,"    "));
	}
	var settings = settingsFile.readString().parseJson();
	

	return settings
}
function forceDelete(name){
	return
}
function saveBeanField(bean,fieldName,oldval,newval){
	
	var v = bean.validate(fieldName);
	/* 
	Don't actually save. Bean instances of this model are always deferred and
	must be saved via "save" which eventually calls "create"
	*/
	return v;
}

function query(pattern,options){
	var s = this.getSettings();
	return new Myna.DataSet({
		columns:pattern.select||this.fieldNames,
		data:[s]
	});
}