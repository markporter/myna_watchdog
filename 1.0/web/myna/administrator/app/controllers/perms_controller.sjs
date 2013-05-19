/*jshint unused:false*/
/*global Myna $FP $application $server $req java
*/
function init(){
	this.applyBehavior("MynaAuth",{
		whitelist:[],
		providers:Myna.Permissions.getAuthTypes(),
		redirectParams:{}
	})
	
	
}

function index(params){
	this.$page.css =this.$page.css.concat([
		"extjs/resources/css/ext-all.css",
		"codemirror-3.0/lib/codemirror.css",
		"default.css"
	])
	this.$page.scripts =this.$page.scripts.concat([
		"extjs/ext-all-debug.js",
		"app/SupaGrid.js",
		"app/quickdrop.js",
		"app/Notification.js",
		$FP.helpers.Html.url({
			controller:"Direct",
			action:"api",
			params:{
				callback:"Ext.Direct.addProvider",
				namespace:"$FP"
			}
		}),
		$FP.helpers.Html.url({
			controller:"Main",
			action:"loadModels"
		})
	])
	
	var props=Myna.getGeneralProperties();
	params.setDefaultProperties({
		id:"myna_admin"
	})
	this.set("globalProperties",{
		title:this.$page.title="Permissions: " + params.id,
		app_name:params.id,
		appUrl:$FP.url,
		rootUrl:$server.rootUrl
	})
	
}
