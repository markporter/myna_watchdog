/* ---------- init ---------------------------------------------------------- */
	function init(){
		this.applyBehavior("ModelSearchList",{
			searchFields:[
				"first_name",
				"last_name",
				"email",
				"user_id"
			],
			/*resultFields:[
				"user_login_id",
				"user_id",
				"login",
				"type" 
			],*/
			pageSizeParam:"limit",
			defaultSort:[{
				property:"last_name",
				direction:"asc"
			},{
				property:"first_name",
				direction:"asc"
			}]
		})
	}

/* ---------- addUserFromAdapter ---------------------------------------------------------- */
	function addUserFromAdapter(params){
		params.checkRequired("type","login")
		var authType = params.type.replace(/[^\w\.\-]/g,"");
		var adapter = Myna.Permissions.getAuthAdapter(authType)
		var account  = adapter.getUserByLogin(params.login)

		//search for existing user by email
		var user =this.model.findBeans({
			email:account.email
		}).first(false)

		if (!user){
			user = this.model.create(account)
		}
		user.setLogin({
			type:authType,
			login:account.login
		})

		return {
			success:true,
			user:user.data
		}
	}
/* ---------- deactivate ---------------------------------------------------------- */
	function deactivate(params){
		params.checkRequired("user_id")
		var bean = this.model.getById(params.user_id);
		bean.set_inactive_ts(new Date());
		var result = bean.save()
		return result
	}
/* ---------- reactivate ---------------------------------------------------------- */
	function reactivate(params){
		params.checkRequired("user_id")
		var bean = this.model.getById(params.user_id);
		bean.set_inactive_ts(null);
		var result = bean.save()
		return result
	}
/* ---------- save ---------------------------------------------------------- */
	function save(params){
		var bean = this.model.get(params);
		var result = bean.save()
		result.data = bean.data
		return result
	}


