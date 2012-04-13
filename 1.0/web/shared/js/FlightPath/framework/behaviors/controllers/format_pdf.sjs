/* Class:  Behavior: FormatPdf
	Applies filters that will automatically convert views into PDF documents
	
	This behavior uses a "afterRender" filter that listens for Action calls with 
	a "format" parameter that equals "pdf". When discovered, normal output is 
	suppressed and instead the content produced is converted to a PDF file and 
	served to the browser. 
	
	If $page.title is defined the filename will be <$page.title>.pdf
	otherwise, the filename will be <controller name>.<action name>.pdf
	
	 
	
	(code)
		// in app/controllers/<name>_controller.sjs
		function init(){
			this.applyBehavior("FormatPdf")
		}
		
		// calling this with ?format=pdf will cause it to return a PDF document
		// containing the view output with the name "All Items.pdf"
		function list(params){
			this.$page.title = "All Items"
			this.set("rows",this.model.findBeans())
		}
	(end)
*/

function init(){
	this.addFilter(
		this._formatPdf,
		{
			when:"afterRender"
		}
	)
}

function _formatPdf(action, params){
	var filename= 
		params.filename
		|| (this.$page.title + ".pdf")
		|| (params.controller + "." + params.action  + ".pdf")
	if (params.format =="pdf"){
		this.rendered=false;
		this.renderContent(
			Myna.xmlToPdf(
				Myna.htmlToXhtml(
					$res.clear()
				),
				null,
				$server.serverUrl +$FP.url
			),
			"application/pdf",
			filename
		);
		return false;
	}
}