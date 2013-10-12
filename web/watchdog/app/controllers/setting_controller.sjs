/* ========== Internal Functions ============================================ */
	function init(){
		this.$page.scripts.push($FP.helpers.Html.url({staticUrl:"jquery-1.6.3.min.js"}));
	}
/* ========== Actions ======================================================= */
	/* ---------- edit ---------------------------------------------------- */	
		function edit(params){
			var bean=this.model.get({
				id:"global"
			})
			
			this.set("bean",bean);
			this.data.formData=($session.get(params.id)||bean.getData())
		}
	/* ---------- get ---------------------------------------------------- */	
		function get(params){
			var bean=this.model.get({
				id:"global"
			})
			
			return bean
		}
	/* ---------- save ---------------------------------------------------- */
		function save(params){
			var bean = this.model.get(params);
			var validation = bean.save();
			
			return validation
		}
	/* ---------- save ---------------------------------------------------- */
		function testLdap(params){
			var result={
				message:""
			}
			try {
				var adapter = Myna.Permissions.getAuthAdapter("watchdog")
				var settings = this.get()

				if (adapter.isCorrectPassword(adapter.config.login,adapter.config.password)){
					result.message +="Correct lookup password<br>"
				} else {
					result.message +='<p color="red">lookup account failed </p>'
				}
				if (
					settings.ldap_users.split(/,/).contains(params.username) 
					|| this._getGroupMembers().contains(params.username)
				){
					result.message +="'{username}' has access<br>".format(params)
				} else {
					result.message +="'{username}' does not have access<br>".format(params)
				}
				

			} catch(e){
				result.message = e.toString();
			}
			return result
		}
	/* ---------- index ---------------------------------------------------- */	
		function index(params){
			$FP.redirectTo({controller:"Service",action:"status"})	
		}
	/* ---------- list ---------------------------------------------------- */	
		function list(params){
			$FP.redirectTo({controller:"Service",action:"status"})	
		}