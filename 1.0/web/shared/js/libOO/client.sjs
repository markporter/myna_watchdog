[
	"Number.js",
	"Array.js",
	"ObjectLib.js",
	"String.js",
	"Function.js",
	"Date.js",
	"ValidationResult.js",
	"Profiler.js",
	"debug_window.js"
].forEach(function(element){
	$res.print(new Myna.File(element).readString()+"\n");
});
