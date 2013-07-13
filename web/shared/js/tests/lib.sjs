/* $lib.beanToObject */
add_test("$lib.beanToObject",function(){
	
	assertStringEqual(
		"({bytes:[98, 111, 98], 'class':class java.lang.String, empty:false})",
		$lib.beanToObject(new java.lang.String("bob")).toSource()
	);
	
	
})