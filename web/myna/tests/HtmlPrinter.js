/**
 * Class to print the result of a TextTestRunner.
 * @ctor
 * Constructor.
 * @tparam PrinterWriter writer The writer for the report.
 * Initialization of the HtmlPrinter. If no \a writer is provided the 
 * instance uses the SystemWriter.
 */
function HtmlPrinter( writer )
{
    this.setWriter( writer );
    this.mColumn = 0;
}
/**
 * Implementation of TestListener.
 * @tparam Test test The test that had an error.
 * @tparam Error except The thrown error.
 */
HtmlPrinter.prototype.addError =function( test, except )
{
    this.getWriter().print( "E" );
}
/**
 * Implementation of TestListener.
 * @tparam Test test The test that had a failure.
 * @tparam AssertionFailedError afe The thrown failure.
 */
HtmlPrinter.prototype.addFailure =function( test, afe )
{
    this.getWriter().print( "F" );
}
/**
 * Returns the elapsed time in seconds as String.
 * @tparam Number runTime The elapsed time in ms.
 * @type String
 */
HtmlPrinter.prototype.elapsedTimeAsString =function( runTime )
{
    return new String( runTime / 1000 );
}
/**
 * Implementation of TestListener.
 * @tparam Test test The test that ends.
 */
HtmlPrinter.prototype.endTest =function( test )
{
}
/**
 * Returns the associated writer to this instance.
 * @type PrinterWriter
 */
HtmlPrinter.prototype.getWriter =function()
{
    return this.mWriter;
}
/**
 * Print the complete test result.
 * @tparam TestResult result The complete test result.
 * @tparam Number runTime The elapsed time in ms.
 */
HtmlPrinter.prototype.print =function( result, runTime )
{
    this.printHeader( runTime );
    this.printErrors( result );
    this.printFailures( result );
    this.printFooter( result );
}
/**
 * Print a defect of the test result.
 * @tparam TestFailure defect The defect to print.
 * @tparam Number count The counter for this defect type.
 */
HtmlPrinter.prototype.printDefect =function( defect, count )
{
    this.printDefectHeader( defect, count );
    this.printDefectTrace( defect );
    this.getWriter().println();
}
/**
 * \internal
 */
HtmlPrinter.prototype.printDefectHeader =function( defect, count )
{
	var string = defect.toString()
	var arr = string.match(/Test (.*?)\.(.*?) (?:.*?): (.*?): (.*)/)
	if (arr){
		arr = arr.map(function(item){
			return item.escapeHtml();
		})
		arr.shift();
		string = arr.join("</td><td>");
	} 
	
    this.getWriter().print( "<td>"+count + "</td><td>" + string +"</td>") ;
}
/**
 * Print the defects of a special type of the test result.
 * @tparam Array<TestFailure> array The array with the defects.
 * @tparam String type The type of the defects.
 */
HtmlPrinter.prototype.printDefects =function( array, type )
{
	this.getWriter().println("<tr><td>")
    if( array.length == 0 )
        return;
    if( array.length == 1 )
        this.getWriter().println( "There was 1 " + type + ":" );
    else
        this.getWriter().println( 
            "There were " + array.length + " " + type + "s:" );
	this.getWriter().println("</td></tr>")
	this.getWriter().println('<table class="jsunit_error_table" width="100%" height="1" cellpadding="0" cellspacing="0" border="0" >')
    for( var i = 0; i < array.length; ){
		this.getWriter().print("<tr class='")
		if (i % 2 ==0){
			this.getWriter().print(" alt_row ")	
		} else {
			this.getWriter().print("  ")	
		}
		this.getWriter().println("'>")
		this.printDefect( array[i], ++i );
		this.getWriter().println("</tr>")
	}
	this.getWriter().println('</table>')
	
}
/**
 * \internal
 */
HtmlPrinter.prototype.printDefectTrace =function( defect )
{
    var trace = defect.trace();
    if( trace )
    {
        this.getWriter().println();
        this.getWriter().println( trace );
    }
}
/**
 * Print the errors of the test result.
 * @tparam TestResult result The complete test result.
 */
HtmlPrinter.prototype.printErrors =function( result )
{
    this.printDefects( result.mErrors, "error" );
}
/**
 * Print the failures of the test result.
 * @tparam TestResult result The complete test result.
 */
HtmlPrinter.prototype.printFailures =function( result )
{
    this.printDefects( result.mFailures, "failure" );
}
/**
 * Print the footer of the test result.
 * @tparam TestResult result The complete test result.
 */
HtmlPrinter.prototype.printFooter =function( result )
{
	var writer = this.getWriter();
	writer.println("<tr><td>");
    if( result.wasSuccessful())
    {
        var count = result.runCount();
        writer.println();
        writer.print( "OK" );
        writer.println( 
            " (" + count + " test" + ( count == 1 ? "" : "s" ) + ")" );
    }
    else
    {
        writer.println();
        writer.println( "FAILURES!!!" );
        writer.println( "Tests run: " + result.runCount()
            + ", Failures: " + result.failureCount()
            + ", Errors: " + result.errorCount());
    }
	writer.println("</td></tr>");
    writer.println("</table>");
}
/**
 * Print the header of the test result.
 * @tparam Number runTime The elapsed time in ms.
 */
HtmlPrinter.prototype.printHeader =function( runTime )
{
    var writer = this.getWriter();
    writer.println();
    writer.println( "Time: " + this.elapsedTimeAsString( runTime ));
	writer.println([
		'<table class="jsunit_general_table" width="100%" height="1" cellpadding="0" cellspacing="0" border="0" >\n'
	].join("\n"));
}
/**
 * Sets the PrinterWriter.
 * @note This is an enhancement to JUnit 3.8
 * @tparam PrinterWriter writer The writer for the report.
 * Initialization of the HtmlPrinter. If no \a writer is provided the 
 * instance uses the SystemWriter.
 */
HtmlPrinter.prototype.setWriter =function( writer )
{
    this.mWriter = writer ? writer : JsUtil.prototype.getSystemWriter();
}
/**
 * Implementation of TestListener.
 * @tparam Test test The test that starts.
 */
HtmlPrinter.prototype.startTest =function( test )
{
    if( !( test instanceof TestSuite ))
    {
        this.getWriter().print( "." );
        if( this.mColumn++ >= 39 )
        {
            this.getWriter().println();
            this.mColumn = 0;
        }
    }
}
