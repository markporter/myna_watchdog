/* $lib.appendFunction */
add_test("$lib.appendFunction",function(){
	var result="";
	var obj={
		test:function(){
			result+="original"
		}
	}
	$lib.appendFunction(obj,"test",function(){result+=",new"});
	
	obj.test();
	if (result != "original,new") throw ("Expected 'original,new', got '" + result + "'");
})

/* $lib.checkObjectRequired */
add_test("$lib.checkObjectRequired",function(){
	var obj={
		
	}
	
	try {
		$lib.checkObjectRequired(obj,["bob"]);	
	} catch(e) {
		if (e["message"]) throw (e);
		if (/^Required property 'bob' undefined in/.test(e)) return;
		
	}
	throw "Failed to notice missing property" 
})

/* $lib.copyProperties */
add_test("$lib.copyProperties",function(){
	var obj={
		a:"a",
		b:function(){},
	}
	var obj2={a:"b"}
	$lib.copyProperties(obj,obj2,true)
	
	if (obj2.a != "a" || typeof obj2.b != 'function'){
		throw "failed copy (overwrite)";	
	}
	
	var obj3={a:"b"}
	$lib.copyProperties(obj,obj3)
	if (obj3.a != "b" || typeof obj2.b != 'function'){
		throw "failed copy (no overwrite)";
	}
	
	 
})

/* $lib.importLib */
add_test("$lib.importLib",function(){
	$lib.importLib($lib);
	
	if (!$server_gateway.threadScope["importLib"]) throw "failed $lib.importLib($lib);"
	$lib.importLib($lib,true);
	if (!$server_gateway.threadScope["dateFormat"]) throw "failed $lib.importLib($lib,true);"
	 
})

/* $lib.getKeys */
add_test("$lib.getKeys",function(){
	var obj={
		a:"a",
		b:function(){},
	}
	assertStringEqual(
		'a',
		$lib.getKeys(obj).join(',')
	);
	
	assertStringEqual(
		'a,b',
		$lib.getKeys(obj,true).join(',')
	);
})

/* $lib.setObjectDefaults */
add_test("$lib.setObjectDefaults",function(){
	var obj={
		a:"1",
		b:function(){},
		c:null,
		
	}
	$lib.setObjectDefaults(obj,{a:"a",b:"b",c:"c",d:"d"});
	var result = obj.toSource();
	assertStringEqual(
		'({c:null, d:"d", a:"1", b:(function () {})})',
		result
	);
})

/* $lib.typeOf */
add_test("$lib.typeOf",function(){
	
	assertStringEqual(
		'array',
		$lib.typeOf([])
	);
	
	assertStringEqual(
		'function',
		$lib.typeOf(function(){})
	);
	
	assertStringEqual(
		'null',
		$lib.typeOf(null)
	);
	
	assertStringEqual(
		'class',
		$lib.typeOf($server_gateway)
	);
	
	assertStringEqual(
		'date',
		$lib.typeOf(new Date())
	);
})