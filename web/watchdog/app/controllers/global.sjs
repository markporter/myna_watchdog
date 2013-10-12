/* ========== Internal Functions ============================================ */
	/* ---------- init ------------------------------------------------------ */
		function init(){
			this.addFilter(this._auth);
			this._auth.options={
				whitelist:[
					"runTests",
					"login",
					"logout"
				],
				redirectParams:{
					providers:"watchdog"	
				}
				
			}
			this.addFilter(this._fixEditUrls);
			
			this.$page.title = $application.displayName;
			this.$page.css.push($FP.helpers.Html.url({staticUrl:"default.css"}));
			this.$page.menu=[]
			
		}

	/* ---------- _getGroupMembers ----------------------------------------------------- */
		function _getGroupMembers(){
			var settings = $FP.getModel("Setting").getById("global");
			var adapter = Myna.Permissions.getAuthAdapter("watchdog")

			var ldap = adapter.getLdap()
			
			Myna.printConsole(Myna.dumpText(adapter));
			var groupName = adapter.config.map.group_name;
			var groupMember = adapter.config.map.group_member;

			var groups=settings.ldap_groups.split(/,/)
			var members;
			for (var i = 0; i < groups.length; ++i) {
				var search = "(&({2})({0}={1}))".format(
					groupName,
					groups[i].trim(),
					adapter.config.group_filter
				)
				members =ldap.search(search)
				members=members.first()
					.attributes[groupMember]
					.filter(function (dn) {
						if (dn.split(",")[1].listLast("=") == "Group"){
							if (!groups.contains(dn)){
								groups.push(dn.split(",")[0].listLast("="))
							}
							return false
						} else return true
					})
					.map(function(dn){
						return dn.split(",")[0].listLast("=").toLowerCase()
						
					})
				
			}
			return members
		}

	/* ---------- _hasAccess ----------------------------------------------------- */
		function _hasAccess() {
			var settings = $FP.getModel("Setting").getById("global");
			var login =  $cookie.getAuthUser().UserLogins()
				.filter(function(login){
					return login.type == "watchdog"
				}).first().login.toLowerCase()

			return settings.ldap_users.split(/,/).contains(login) 
				|| this._getGroupMembers().contains(login)
		}
	/* ---------- _auth ----------------------------------------------------- */
		function _auth(action, param){
			var my = arguments.callee;
			if (!my.options.userFunction) my.options.userFunction = $cookie.getAuthUser;
			var right = this.name + "." + action;
			var isWhitelisted = my.options.whitelist.some(function(item){
				if (!(item instanceof RegExp)){
					item = new RegExp("^" +String(item).replace(/\./,"\\.") +"$")
				}
				return item.test(right)	
			})
			var user;
			
			if (!isWhitelisted){
				
				var cookie_user_id = $cookie.getAuthUserId()
				if (!cookie_user_id){
					if ($cookie.get("myna_auth_cookie")){
						var passHash = (String($req.authUser)+String($req.authPassword)).toHash();

						if ($req.authUser && $req.authPassword && passHash != $session.get("myna_auth_last_pass")){
							$session.set("myna_auth_last_pass", passHash);
							user = Myna.Permissions.getUserByAuth($req.authUser,$req.authPassword,my.options.providers);
							if (user){
								$cookie.setAuthUserId( (cookie_user_id = user.id) );
							} else {

								$res.requestBasicAuth($application.displayName + " (Admin User: myna_admin)");
								cookie_user_id = null;
							}
						}else{
							$res.requestBasicAuth($application.displayName + " (Admin User: myna_admin)");
							return false;
						}
						
					}
					if (cookie_user_id === null){
						if ($FP.config.debug){
							Myna.log(
								"debug",
								"Action " + right + " not whitelisted, redirecting to login",
								Myna.dump(my.options.whitelist, "MynaAuth whitelist")
							);	
						}
						var redirectParams = ({
							callbackUrl:$FP.helpers.Html.url({
								controller:this.name,
								action:action,
								id:params.id,
								params:params
							})
							
						}).setDefaultProperties(my.options.redirectParams)
						$res.redirectLogin(redirectParams)
						//unnecessary, but good practice
						return false; //cancels action
					}

				}
				if (cookie_user_id){
					var isAnyUser = (my.options.anyUserList||[]).some(function(item){
						if (!(item instanceof RegExp)){
							item = new RegExp("^" +String(item).replace(/\./,"\\.") +"$")
						}
						return item.test(right)	
					})
					
					if (!isAnyUser){
						var appname= $application.appname;
							
						if (this._hasAccess()) return;
						if ($FP.config.debug){
							user = my.options.userFunction(this,my.options);
							Myna.log(
								"debug",
								"Auth fail for Action " + right + ", User " + user.first_name +" "+ user.last_name,
								Myna.dump(my.options.whitelist, "MynaAuth whitelist")
							);	
						}
						if (hasRight(appname,"full_admin_access")) return;
						if (hasRight("myna_admin","full_admin_access")) return;
					
						
						
						user = my.options.userFunction(this,my.options);
						//if we got here shouldn't have
						if (user){
							Myna.log(
								"auth",
								<ejs>
									User '<%=user.first_name%> <%=user.last_name%>' does not have access to <%=right%>
								</ejs>
							);
						}
						throw new Error("You do not have access to that feature")
					}
				}
			}
		}
	/* ---------- _fixEditUrls ---------------------------------------------- */
		function _fixEditUrls(action,params){
			if (action=="edit"){
				//fix the URL
				if (!params.id && params.id != 0){
					$FP.redirectTo({
						action:"list",
						route:"default",
						error:"ID Required"
					})
				}
				if (params.id == "new"){
					$FP.redirectTo({
						id:this.model.genKey(),
						action:"edit",
						params:params,
						route:"default",
					})
				}
			}
		}
	
/* ========== Actions ======================================================= */
	/* ---------- index ----------------------------------------------------- */
		function index(params){
			Myna.abort("global index")
			$FP.redirectTo({action:"list"})
		}		