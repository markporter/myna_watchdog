/* Function: times
	Executes the supplied function parseInt(this) times.
	
	Parameters:
		func	-	a function to execute. This function will eb called with the 
					current index
			
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