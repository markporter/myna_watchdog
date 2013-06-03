/* ---------- init ---------------------------------------------------------- */
	function init(){
		this.applyBehavior("ModelSearchList",{
			searchFields:[
				"login",
				"type"
			],
			resultFields:[
				"user_login_id",
				"user_id",
				"login",
				"type" 
			],
			pageSizeParam:"limit",
			defaultSort:[{
				property:"login",
				direction:"asc"
			},{
				property:"type",
				direction:"asc"
			}],
			baseQuery:<ejs>
				select
					user_login_id,
					user_id,
					login,
					type
				from user_logins
				where user_id ={user_id}

			</ejs>
		})
	}

/* ---------- save ---------------------------------------------------------- */
	function save(params){
		var bean = this.model.get(params);
		var result = bean.save()
		result.data = bean.data
		return result;
	}
/* ---------- searchByAuthType ---------------------------------------------------------- */
	function searchByAuthType(params){
		var authType = params.type.replace(/[^\w\.\-]/g,"");
		var adapter = Myna.Permissions.getAuthAdapter(authType)

		return adapter.searchUsers(params.search.replace(/[^\w\.\-\ '"]/g,""));
	}
/* ---------- remove ---------------------------------------------------------- */
	function remove(params){
		var result = new Myna.ValidationResult
		try{
			this.model.forceDelete(params.user_login_id);
		} catch(e){
			result.addError(
				"Unable to remove login, Error code {0}".format(
					params.user_login_id.right(4)
				)
			)
			Myna.log(
				"error",
				"code {0}: {1}".format(
					params.user_login_id.right(4),
					Stirng(e)
				),
				Myna.formatError(e)
			);
		}
		return result;
	}


/* ---------- getAuthTypes ---------------------------------------------------------- */
	function getAuthTypes(params){
		
		return Myna.Permissions.getAuthTypes()
			.filter(function (type) {
				return type!="server_admin"
			})
			.map(function (type) {
				var adapterConfig = new Myna.File("/WEB-INF/myna/auth_types/"+type)
					.readString().parseJson()
				return adapterConfig
			})
	}