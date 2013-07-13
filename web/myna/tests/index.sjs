

Myna.includeOnce("HtmlPrinter.js",$server.globalScope);


//Myna.print(Myna.dump(new Myna.File("tests").listFiles()))
function AllTests(){
    TestSuite.call( this, "AllTests" );
}
function AllTests_suite(){
	
    var suite = new AllTests();
	new Myna.File("tests").listFiles("sjs").forEach(function(file){
		//Myna.print(file)
		var local_suites={}
		
		
		if (!$req.data.file || $req.data.file == file.getFileName()){
			Myna.include(file.toString(),local_suites);
			local_suites.getProperties().filter(function(suiteName){
				return local_suites.hasOwnProperty(suiteName);
			}).forEach(function(suiteName){
				suite.addTestSuite(local_suites[suiteName]);		
				$res.print("adding test '" + suiteName +"'<br>")
				$res.flush();
			})
		} 
		//else Myna.print(!$req.data.file + " || " +$req.data.file +" == " +file.getFileName()+"<p>")
	})
    
    return suite;
}
AllTests.prototype = new TestSuite();
AllTests.prototype.suite = AllTests_suite;


Myna.print(<ejs>
<style>
	body, .jsunit_general_table td, .jsunit_error_table td{
		font-family:sans-serif;
		font-size:9pt;
		
	}
	.jsunit_general_table, .jsunit_error_table{
		border:1px solid silver;
	}
	.jsunit_error_table td{
		border-bottom:1px solid silver;
		border-left:1px solid #AAAAAA;
		padding-right:5px;
		padding-left:5px;
	}
	.jsunit_error_table .alt_row td{
		background-color:#DDDDDD;
		
		
	}
</style>

</ejs>)


var writer = new HTMLWriterFilter(JsUtil.prototype.getSystemWriter() );
var printer = new HtmlPrinter( JsUtil.prototype.getSystemWriter());


var runner = new EmbeddedTextTestRunner( printer );
var collector = new TestCaseCollector( this );
runner.run( collector.collectTests());