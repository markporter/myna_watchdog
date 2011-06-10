if (!Myna) var Myna={}
/* Class: Myna.Inflector 
	Static class for converting English words to plural and singular forms 
	
	*/

Myna.Inflector={
	inflector_patterns:{
		plurals: [
		  {suffix:/$/,replacement:"s"},
		  {suffix:/s$/,replacement:"s"},
		  {suffix:/(ax|test)is$/,replacement:"$1es"},
		  {suffix:/(octop|vir)us$/,replacement:"$1i"},
		  {suffix:/(alias|status)$/,replacement:"$1es"},
		  {suffix:/(bu)s$/,replacement:"$1ses"},
		  {suffix:/(buffal|tomat)o$/,replacement:"$1oes"},
		  {suffix:/([ti])um$/,replacement:"$1a"},
		  {suffix:/sis$/,replacement:"ses"},
		  {suffix:/(?:([^f])fe|([lr])f)$/,replacement:"$1$2ves"},
		  {suffix:/(hive)$/,replacement:"$1s"},
		  {suffix:/([^aeiouy]|qu)y$/,replacement:"$1ies"},
		  {suffix:/(x|ch|ss|sh)$/,replacement:"$1es"}, 
		  {suffix:/(matr|vert|ind)(?:ix|ex)$/,replacement:"$1ices"},
		  {suffix:/([m|l])ouse$/,replacement:"$1ice"},
		  {suffix:/^(ox)$/,replacement:"$1en"},
		  {suffix:/(quiz)$/,replacement:"$1zes"},
		],
		singulars:[
		  {suffix:/s$/,replacement:""},
		  {suffix:/(n)ews$/,replacement:"$1ews"},
		  {suffix:/([ti])a$/,replacement:"$1um"},
		  {suffix:/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/,replacement:"$1sis"},
		  {suffix:/(^analy)ses$/,replacement:"$1sis"},
		  {suffix:/([^f])ves$/,replacement:"$1fe"},
		  {suffix:/(hive)s$/,replacement:"$1"},
		  {suffix:/(tive)s$/,replacement:"$1"},
		  {suffix:/([lr])ves$/,replacement:"$1f"},
		  {suffix:/([^aeiouy]|qu)ies$/,replacement:"$1y"},
		  {suffix:/(s)eries$/,replacement:"$1eries"},
		  {suffix:/(m)ovies$/,replacement:"$1ovie"},
		  {suffix:/(x|ch|ss|sh)es$/,replacement:"$1"},
		  {suffix:/([m|l])ice$/,replacement:"$1ouse"},
		  {suffix:/(bus)es$/,replacement:"$1"},
		  {suffix:/(o)es$/,replacement:"$1"},
		  {suffix:/(shoe)s$/,replacement:"$1"},
		  {suffix:/(cris|ax|test)es$/,replacement:"$1is"},
		  {suffix:/(octop|vir)i$/,replacement:"$1us"},
		  {suffix:/(alias|status)es$/,replacement:"$1"},
		  {suffix:/^(ox)en/,replacement:"$1"},
		  {suffix:/(vert|ind)ices$/,replacement:"$1ex"},
		  {suffix:/(matr)ices$/,replacement:"$1ix"},
		  {suffix:/(quiz)zes$/,replacement:"$1"},
		  {suffix:/(database)s$/,replacement:"$1"},
		],
		irregulars:[
		  {singular:"person",plural:"people"},
		  {singular:"man",plural:"men"},
		  {singular:"child",plural:"children"},
		  {singular:"sex",plural:"sexes"},
		  {singular:"move",plural:"moves"},
		  {singular:"goose",plural:"geese"},
		  {singular:"foot",plural:"feet"},
		  
		],
		uncountables:[
			"equipment", 
			"information", 
			"rice", 
			"money", 
			"species", 
			"series", 
			"moose",
			"elk",
			"fish", 
			"sheep",
		]
	},
	/* Function: pluralize
		returns the plural version of a word
		
		Parameters:
			word - string to pluralize
	*/
	pluralize:function (word){
		var result = false;
		var i,tuple,match;
		
		for (i = 0; i < this.inflector_patterns.uncountables.length; ++i){
			match = this.inflector_patterns.uncountables[i];
			if (match == word.toLowerCase()){
				return match;
			}
		}
		for (i = 0; i < this.inflector_patterns.irregulars.length; ++i){
			tuple = this.inflector_patterns.irregulars[i];
			if (tuple.singular == word.toLowerCase()){
				//Myna.printDump(tuple)
				return tuple.plural;
			}
		}
		for (i = this.inflector_patterns.plurals.length-1; i >= 0; --i){
			tuple = this.inflector_patterns.plurals[i];
			if (tuple.suffix.test(word.toLowerCase())){
				//Myna.printDump(tuple);
				return word.replace(tuple.suffix,tuple.replacement);
			}
		}
	 
		return word;
	},
	/* Function: singularize
		returns the singular version of a word
		
		Parameters:
			word - string to singularize
	*/
	singularize:function (word){
		var result = false;
		var i,tuple;
		for (i = 0; i < this.inflector_patterns.uncountables.length; ++i){
			var match = this.inflector_patterns.uncountables[i];
			if (match == word.toLowerCase()){
				return match;
			}
		}
		for (i = 0; i < this.inflector_patterns.irregulars.length; ++i){
			tuple = this.inflector_patterns.irregulars[i];
			if (tuple.plural == word.toLowerCase()){
				//Myna.printDump(tuple)
				return tuple.singular;
			}
		}
		for (i = this.inflector_patterns.singulars.length-1; i >= 0; --i){
			tuple = this.inflector_patterns.singulars[i];
			if (tuple.suffix.test(word.toLowerCase())){
				//Myna.printDump(tuple);
				return word.replace(tuple.suffix,tuple.replacement);
			}
		}
	 
		return word;
	}

}