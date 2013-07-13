/* Class: Number
	Myna extensions to the JavaScript Number object

*/

/* Function: times
	Executes the supplied function parseInt(this) times.
	
	Parameters:
		func	-	a function to execute. This function will be called with the 
					current 0-based index
			
	Example:
	(code)
		//extra dot forces 5 to be a number object
		5..times(function(i){
			$res.print(i + "<br>")
		});
	(end)
*/
Number.prototype.times = function(func){
	for (var x=0; x < parseInt(this,10); ++x){
		func(x);	
	}
};


/* Function: format
	Formats this number as a string

	Parameters:
		formatString	-	String pattern for output.


	About format strings:	
	* The number of digits after the decimal  specifies the number of
		decimal places in the resulting string.
	* The presence of a thousand separator in the format string specifies that
        a thousand separator is inserted separating thousand groups.
	* Any other characters will will be copied to output

    Examples (123456.789):
    (code)
	123456.789.format("0")			- (123457) show only digits, no precision, rounding
	123456.789.format("0.00")		- (123456.79) show only digits, 2 precision, rounding
	123456.789.format("0.0000")		- (123456.7890) show only digits, 4 precision
	123456.789.format("$0,000")		- ($123,457) show comma and digits, no precision, rounding
	123456.789.format("0,000.00")	- (123,456.79) show comma and digits, 2 precision, rounding
	123456.789.format("0,0.00")		- (123,456.79) shortcut method, show comma and digits, 2 precision, rounding
	(end)

	Adapted from Sencha ExtJS v4 Ext.util.Format.number()
	*/
Number.prototype.format =   function(formatString) {
	var 
		v				= this,
		// A RegExp to remove from a number format string, all characters except digits and '.'
		formatCleanRe	= /[^\d\.]/g
	;
	if (String(v) != parseFloat(v)){
		return "";
	}
	if (!formatString) {
		return String(v);
	}
	

	var comma = ",",
		dec   = ".",
		i18n  = false,
		neg   = v < 0,
		hasComma,
		psplit,
		fnum,
		cnum,
		parr,
		j,
		m,
		n,
		i;

	v = Math.abs(v);
		hasComma = formatString.indexOf(',') != -1;
		psplit = formatString.replace(formatCleanRe, '').split('.');

	if (psplit.length > 2) {
		throw  new Error("Invalid number format, should have no more than 1 decimal");
	} else if (psplit.length > 1) {
		v = v.toFixed(psplit[1].length);
	} else {
		v = v.toFixed(0);
	}

	fnum = v.toString();

	psplit = fnum.split('.');

	if (hasComma) {
		cnum = psplit[0];
		parr = [];
		j = cnum.length;
		m = Math.floor(j / 3);
		n = cnum.length % 3 || 3;

		for (i = 0; i < j; i += n) {
			if (i !== 0) {
				n = 3;
			}

			parr[parr.length] = cnum.substr(i, n);
			m -= 1;
		}
		fnum = parr.join(comma);
		if (psplit[1]) {
			fnum += dec + psplit[1];
		}
	} else {
		if (psplit[1]) {
			fnum = psplit[0] + dec + psplit[1];
		}
	}

	if (neg) {
		/*
		 * Edge case. If we have a very small negative number it will get rounded to 0,
		 * however the initial check at the top will still report as negative. Replace
		 * everything but 1-9 and check if the string is empty to determine a 0 value.
		 */
		neg = fnum.replace(/[^1-9]/g, '') !== '';
	}

	return (neg ? '-' : '') + formatString.replace(/[\d,?\.?]+/, fnum);
};
