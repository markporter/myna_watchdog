/* ========== Internal Functions ============================================ */
	function init(){
		this.$page.scripts.push($FP.helpers.Html.url({staticUrl:"jquery-1.6.3.min.js"}));
	}
/* ========== Actions ======================================================= */
	/* ---------- edit ---------------------------------------------------- */	
		function edit(params){
			var bean=this.model.get(params)
			if (!(params.service_id||bean.service_id)) {
				$FP.redirectTo({
					action:"list",
					controller:"Service",
					message:"Pick a service to view tests"
				})
			}
			this.set("bean",bean);
			this.data.formData=($session.get(params.id)||bean.getData())
			this.data.service = $FP.getModel("Service").getById(params.service_id||bean.service_id)
			var name;
			this.set("testList",
				new Myna.File($FP.dir,"tests").listFiles("sjs")
					.map(function(f){
						var name=f.fileName.listBefore(".")
						var func =Myna.include(f,{})[name]
						var params=[]
						if (func && "params" in func) params= func.params;
						
						return {
							name:name,
							params:params
						}
					})
			)
			
		}
	/* ---------- list ---------------------------------------------------- */	
		function list(params){
			if (!params.service_id){
				/*$FP.redirectTo({
					action:"list",
					controller:"Service",
					message:"Pick a service to view tests"
				})*/
			}
			var searchParams={
				orderBy:"enabled desc, script_name asc"
			}
			this.model.columnNames.forEach(function(name){
				if (name in params 
					&& params[name] 
					&& !"id,controller,action,$inline".listContains(name)
				){
					searchParams[name]=params[name];
				}
			});
			
			this.data.service = $FP.getModel("Service").getById(params.service_id);
			
			this.set("beans",this.model.findBeans(searchParams))
			return this.data.beans.map(function (bean) {
				var row = bean.getData()
				//row.parameters_text = bean.parameters_text
				/*TestParameters().map(function (tp) {
					return "{name} = {value}".format(tp) 
				}).join("<br>")*/
				
				/*row.parameters = bean.TestParameters().reduce(function (result,tp) {
					result[tp.script_name] = tp.data
					return result
				},{})*/
				return row
			})
		}
	/* ---------- save ---------------------------------------------------- */
		function save(params){
			delete params.parameters_text
			var bean = this.model.get(params);

			var validation = bean.save();
			
			/*if (validation.success) {
				$session.set(params.id,false)
				$FP.redirectTo({
					action:"list",
					params:{
						service_id:params.service_id
					},
					success:"Record Saved." 
				})
			} else {
				$session.set(params.id,params)
				$FP.redirectTo({
					action:"edit",
					id:params.id,
					error:validation
				})
			}*/
			validation.data=bean
			return validation
		}
	/* ---------- remove ---------------------------------------------------- */
		function remove(params){
			var bean = this.model.get(params);
			if (bean.exists) {
				
				this.model.remove(bean.id)
				$FP.redirectTo({
					action:"list",
					params:{
						service_id:bean.service_id
					},
					success:this.name +" Removed." 
				})
			}
		}
