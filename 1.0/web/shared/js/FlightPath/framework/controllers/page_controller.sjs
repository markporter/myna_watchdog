/* Class: Controller: Page
	Framework controller class for serving simple pages out of the 
	app/views folder.
	
	Use by passing "page/path/to/page_minus_extension in the URL
	
	Example:
	> page/home
	
	These pages should be .ejs pages and they will be wrapped in the default 
	layout. This feature is intended for very simple pages that are not 
	associated with a controller. 
	
	Stored in framework/controller/page_controller.sjs
	
	See:
	* <Layouts>
*/
function display(params){
	if (new Myna.File($FP.dir,"app/views",params.page +".ejs").exists()){
		this.render(params.page)
	} else {
		$application._onError404()
	}
	
}