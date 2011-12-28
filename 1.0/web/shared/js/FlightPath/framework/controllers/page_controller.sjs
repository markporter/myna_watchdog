/* Class: Controller: Page
	Framework controller class for serving simple pages out of the app/views folder
	
	use by passing 
	
	Stored in framework/controller/page_controller.sjs
	
	See:
	* http://www.sencha.com/products/extjs/extdirect
*/
function display(params){
	if (new Myna.File($FP.dir,"views",params.page).exists()){
		this.render(params.page)
	} else {
		$application._onError404()
	}
	
}