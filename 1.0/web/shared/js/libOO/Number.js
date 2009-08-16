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
		(5).times(function(i){
			$res.print(i + "<br>")
		});
	(end)
*/
Number.prototype.times = function(func){
	for (var x=0; x < parseInt(this); ++x){
		func(x);	
	}
}