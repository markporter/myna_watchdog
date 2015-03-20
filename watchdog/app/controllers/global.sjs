/* ========== Internal Functions ============================================ */

	/* ---------- init ------------------------------------------------------ */
		function init(){
			this.applyBehavior("MynaAuth",{
				whitelist:[
					/changeAdminPassword/,
					/saveAdminPassword/,
					/runTests/,
					/logout/,
					/Direct.api/,
					/Direct.router/
				],
				redirectParams:{
					title:"Login: " + $application.displayName
				}
			});
			this.addFilter(this._fixEditUrls);
			
			this.$page.title = $application.displayName;
			this.$page.css.push($FP.helpers.Html.url({staticUrl:"default.css"}));
			this.$page.menu=[]
			
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