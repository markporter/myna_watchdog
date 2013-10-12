/* Class:  Behavior: FormatPdf
	Applies filters that will automatically convert views into PDF documents
	
	This behavior uses a "afterRender" filter that listens for Action calls with 
	a "format" parameter that equals "pdf". When discovered, normal output is 
	suppressed and instead the content produced is converted to a PDF file and 
	served to the browser. 
	
	If params.filename is defined the pdf will be served for download with that 
	name.
	
	 
	
	(code)
		// in app/controllers/<name>_controller.sjs
		function init(){
			this.applyBehavior("FormatPdf")
		}
		
		// calling this with ?format=pdf will cause it to return an inline PDF document
		// containing the view output. 
		// Passing filename=output.pdf will cause the PDF with that name to be downloaded
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
	);
}

function _formatPdf(action, params){

	var filename=params.filename;
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
		/*this.renderContent(
			Myna.htmlToXhtml(
				$res.clear()
			),
			"text/xml"
		);*/
		
		return false;
	}
}