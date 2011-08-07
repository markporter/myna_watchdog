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
				)
			),
			"application/pdf",
			filename
		);
		return false;
	}
}