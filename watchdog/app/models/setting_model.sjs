
/* ------------- init ------------------------------------------------------- */
	function init(){
		this.addFields([
			{ name:"adapter/auth_type", idField:true, type:"string", defaultValue:"watchdog"},
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
			{ name:"adapter/map/group_member", type:"string", defaultValue:"member"},
			{ name:"notification_email", type:"string", defaultValue:""},
			{ name:"ldap_users", type:"string", defaultValue:""},
			{ name:"ldap_groups", type:"string", defaultValue:"Domain Admins"}

			
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
	var settingsFile = new Myna.File($FP.dir,"settings.json")
	if (!settingsFile.exists()){
		settingsFile.writeString(JSON.stringify({
			"adapter/adapter": "ldap",
			"adapter/auth_type": "watchdog",
			"adapter/prettyName": "LDAP Login",
			"adapter/desc": "Login using your Active Directory domain credentials",
			"adapter/ad_domain": "",
			"adapter/server": "ldaps://domain.example.com/dc=domain,dc=example,dc=com",
			"adapter/filter": "(sAMAccountType=805306368)",
			"adapter/group_filter": "(objectCategory=group)",
			"adapter/search_columns": "cn,givenName,sn",
			"adapter/username": "",
			"adapter/password": "",
			"adapter/map/first_name": "givenName",
			"adapter/map/last_name": "sn",
			"adapter/map/middle_name": "initials",
			"adapter/map/login": "sAMAccountName",
			"adapter/map/title": "title",
			"adapter/map/email": "mail",
			"adapter/map/group_name": "cn",
			"adapter/map/group_member": "member",
			"notification_email": "",
			"ldap_users": "",
			"ldap_groups": "Domain Admins"
		},null,"    "))
	}
	var settings = settingsFile.readString().parseJson()
	var adapter = settings.getKeys()
		.filter(function (k) {
			return k.listFirst("/") == "adapter"
		})
		.reduce(function (obj,k) {
			var path = k.replace(/\//g,".").replace(/map/,"Map");
			var value = settings[k].split(/,/).map(function (i) {
				return i.trim()
			}).join()
			obj.setByPath(path,value)
			return obj
		},{}).adapter
	adapter.map = adapter.Map
	delete adapter.Map

	if (!/example/.test(adapter.server)){
		new Myna.File("/WEB-INF/myna/auth_types/watchdog").writeString(
			JSON.stringify(adapter,null,"    ")
		)
	}


	//Myna.printConsole("settings",Myna.dumpText(settings));
	//Myna.printConsole("adapter",Myna.dumpText(adapter));

	return settings
}
function forceDelete(name){
	return
}
function saveBeanField(bean,fieldName,oldval,newval){
	Myna.printConsole("bean", Myna.dumpText(bean));
	var v = bean.validate(fieldName);
	/* 
	Don't actually save. Bean instances of this model are always deferred and
	must be saved via "save" which eventually calls "create"
	*/
	return v
}

function query(pattern,options){
	var s = this.getSettings();
	return new Myna.DataSet({
		columns:pattern.select||this.fieldNames,
		data:[s]
	})
}


/*
	{
		"prettyName":"HEALTH Domain",
		"desc":"Login using your HEALTH AD credentials",
		"auth_type":"ldap_health",
		"adapter":"ldap",
		"server":"ldap://64.234.186.236/ou=employee,ou=accounts,ou=unmh,dc=health,dc=unm,dc=edu",
		"ad_domain":"health",
		"filter":"(ObjectClass=Person)",
		"search_columns":"cn,givenName,sn",
		"username":"ldaprd",
	    "password":"To67Look!",
		"map":{
			"first_name":"givenName",
			"last_name":"sn",
			"middle_name":"initials",
			"login":"cn",
			"title":"title",
			"email":"mail"
		}
	}
	{
		"adapter/prettyName": "Watchdog Login",
		"adapter/desc": "Login using your Active Directory domain credentials",
		"adapter/ad_domain": "",
		"adapter/server": "ldaps://domain.example.com/dc=domain,dc=example,dc=com",
		"adapter/filter": "(sAMAccountType=805306368)",
		"adapter/group_filter": "(objectCategory=group)",
		"adapter/search_columns": "cn,givenName,sn",
		"adapter/username": "",
		"adapter/password": "",
		"adapter/map/first_name": "givenName",
		"adapter/map/last_name": "sn",
		"adapter/map/middle_name": "initials",
		"adapter/map/login": "sAMAccountName",
		"adapter/map/title": "title",
		"adapter/map/email": "mail",
		"adapter/map/group_name": "cn",
		"adapter/map/group_member": "member",
		"notification_email": "",
		"ldap_users": "",
		"ldap_groups": "Domain Admins"
	}
*/

