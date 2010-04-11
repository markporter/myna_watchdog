{
	onReuestStart:function(){
		Myna.includeOnce("/shared/js/jsunit/lib/JsUtil.js",$server.globalScope );
		$req.timeout=0;
	}
}
