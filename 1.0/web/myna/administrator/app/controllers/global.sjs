function init(){
	this.addFilter(
		function(){
			var props=Myna.getGeneralProperties();
			if (!props.admin_password){
				$FP.redirectTo({
					controller:"Main",
					action:"changeAdminPassword"
				});
				//unnecessary, because redirectTo halts processing, but good practice
				return false; //cancels action
			}
		},
		{
			except:["changeAdminPassword"]
		}
	);

	this.applyBehavior("MynaAuth",{
		whitelist:[
			/Main.changeAdminPassword/,
			/Main.logout/,
			/Direct.api/,
			/Direct.router/
		],
		providers:Myna.Permissions.getAuthTypes(),
		redirectParams:{
			title:"Login: " + $application.displayName
		}
	});
}

