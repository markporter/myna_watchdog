/* Class: String 
	Additional functions on the JS String object    
	
	
*/

/* Property: htmlEscapeChars
	array of characters to be translated by <escapeHtml> and <unEscapeHtml>
	*/
	String.htmlEscapeChars=[
		";",
		"&",
		"#",
		"<",
		">",
		"'",
		"\"",
		"(",
		")",
		"%",
		"+",
		"-"
	]
	
	String.regexEscapeChars=[
		"\,",
		"/",
		"*", 
		"+",
		"?", 
		"|", 
		"{", 
		"[", 
		"(",
		")", 
		"^", 
		"$",
		".", 
		"#",
		"\\"
	]
	
/* function: charToHtmlEntity
	returns the HTML/XML entity of the supplied character in &#code; format where code is the decimal ASCII code
	
	Parameters:
		c - 1 character string to convert 
	
		*/	
	String.charToHtmlEntity = function(c){
		return "&#" + c.charCodeAt(0) + ";";
	}
/* Function: compareAlpha
	A static sort function that will compare two strings by lexigraphical order.
	
	Paramters:
		a	-	first string to compare
		b	-	second string to compare
		
	
	Returns:
		-1	-	if _a_ > _b_
		 0	-	if _a_ == _b_
		 1	-	if _a_ < _b_
		
	
		
	*/
	String.compareAlpha = function(a,b) {
		a = String(a);
		b = String(b)
		if(a > b)
			return 1;
		if(a < b)
			return -1;
		return 0;

	}
/* Function: compareAlphaReverse
	A descending version of <compareAlpha>.
	
	Paramters:
		a	-	first string to compare
		b	-	second string to compare
		
	
	Returns:
		-1	-	if _a_ < _b_
		 0	-	if _a_ == _b_
		 1	-	if _a_ > _b_
	
	see <compareAlpha>	
	*/
	String.compareAlphaReverse = function(a,b) {
		return String.compareAlpha(b,a);
	}
/* Function: compareNatural
	A static sort function that will compare two strings in a natural way.
	
	Paramters:
		a	-	first string to compare
		b	-	second string to compare
		
	
	Returns:
		-1	-	if _a_ > _b_
		 0	-	if _a_ == _b_
		 1	-	if _a_ < _b_
	
	Detail:
		The standard sort function does ASCII comparisons of the entire string. 
		Humans tend to sort based on parts of the string, applying numeric and
		alpha sorts as appropriate, and ignoring case. Take this list:
		
		(code)
			var stringArray="A8,a10,A11,a14c,a14b9,a14B10,A14B10,a14b10,a9".split(/,/);
		(end)
		
		Calling stringArray.sort() will result in
		
		(code)
			A11
			A14B10
			A8
			a10
			a14B10
			a14b10
			a14b9
			a14c
			a9
		(end)
		
		This is a valid ASCII sort, but doesn't look "right" to humans.
		Calling stringArray.sort(String.compareNatural) will result in 
		
		(code)
			A8
			a9
			a10
			A11
			a14b9
			A14B10
			a14B10
			a14b10
			a14c
		(end)
	
		
	*/
	String.compareNatural = function(a,b) {
		
		var left = String(a).toLowerCase().match(/(\D+|\d+)/g);
		var right = String(b).toLowerCase().match(/(\D+|\d+)/g);
		if (left === undefined || left === null) left=[];
		if (right === undefined || right === null) right=[];
		var retVal =0;
		
		//print("<hr> " + a +" to " + b + " <p>")
		
		var compare = function(a,b){
			a = (parseInt(a) == a)?parseInt(a):a
			b = (parseInt(b) == b)?parseInt(b):b
			//print("comparing " + a + " to " + b +" <br>")
			if ( a < b) {
				return -1;
			}
			if ( a > b){
				return 1;	
			}
			return 0;
		}
		
		for (var x=0;x < left.length;++x){
			var rightPart = right[x];
			if (rightPart === undefined) {
				 retVal = 0;
				continue; 
				rightPart="";
			}
			var leftPart = left[x];
			if (leftPart === undefined) {
				 retVal = 0;
				continue; 
				leftPath="";
			}
			
			retVal=compare(leftPart,rightPart);
			if (retVal != 0) break;
		}
		if (retVal == 0) retVal =compare(String(a),String(b))
		//print("returning " + retVal)
		return retVal;
	}
/* Function: compareNaturalReverse
	A descending version of <compareNatural>.
	
	Paramters:
		a	-	first string to compare
		b	-	second string to compare
		
	
	Returns:
		-1	-	if _a_ < _b_
		 0	-	if _a_ == _b_
		 1	-	if _a_ > _b_
	
	see <compareNatural>	
	*/
	String.compareNaturalReverse = function(a,b) {
		return String.compareNatural(b,a);
	}
/* Function: compareNumeric
	A static sort function that will compare two strings by lexigraphical order.
	
	Paramters:
		a	-	first string to compare
		b	-	second string to compare
		
	
	Returns:
		-1	-	if _a_ > _b_
		 0	-	if _a_ == _b_
		 1	-	if _a_ < _b_
		
	
		
	*/
	String.compareNumeric = function(a,b) {
		a = parseFloat(a);
		b = parseFloat(b)
		if(a > b)
			return 1;
		if(a < b)
			return -1;
		return 0;

	}
/* Function: compareNumericReverse
	A descending version of <compareNumeric>.
	
	Paramters:
		a	-	first string to compare
		b	-	second string to compare
		
	
	Returns:
		-1	-	if _a_ < _b_
		 0	-	if _a_ == _b_
		 1	-	if _a_ > _b_
	
	see <compareNumeric>	
	*/
	String.compareNumericReverse = function(a,b) {
		return String.compareNumeric(b,a);
	}
/* Function: escapeHtml 
	replaces common symbols with their HTML entity equivalents  
	 
	Detail:
		the purpose of this function is to prevent a string from being 
		interpreted as HTML/Javascript when output on a webpage. Becasue nearly 
		all user supplied input wll eventually be displayed on a web page, this
		function is executed against all input be default. 
		
	Returns: 
		converted string
	
	Detail: 
		escapes the following symbols:
		(code)
		;	becomes &#59;
		&	becomes &#38;
		#	becomes &#35;
		<	becomes &#60;
		>	becomes &#62;
		'	becomes &#39;
		"	becomes &#34;
		(	becomes &#40;
		)	becomes &#41;
		%	becomes &#37;
		+	becomes &#43;
		-	becomes &#45;
		(end code)
	See:
		<$req.data>,<$req.rawData>,<unEscapeHtml> 
	*/
	String.prototype.escapeHtml=function(string){
		var new_string = ""
		for (var x=0; x < this.length; ++x){
			var c= this.charAt(x);
			var escapeIndex =String.htmlEscapeChars.indexOf(c);
			if (escapeIndex != -1){
				new_string+=String.charToHtmlEntity(c);
			} else {
				new_string+=c;
			}
		}
		return new_string;
	}
/* Function: escapeRegex 
	returns string with symbols that might be interpreted as regex escaped   
	 
	Detail:
		the purpose of this function is to prevent a string from being 
		interpreted as a regex string when using new RegExp 
		
	Returns: 
		converted string
	
	*/
	String.prototype.escapeRegex=function(string){
		return Array.parse(this).map(function(c){
			if (String.regexEscapeChars.indexOf(c) != -1){
				return "\\" + c;
			} else {
				return c;
			}
		}).join("")
		
		/* var new_string = ""
		this.length.times(function(x){
			var c= this.charAt(x);
			var escapeIndex =String.regexEscapeChars.indexOf(c);
			if (escapeIndex != -1){
				new_string+="\\" + c;
			} else {
				new_string+=c;
			}		
		})
		return new_string; */
	}



/* function: htmlEntityToChar
	returns the chatacter representation of the supplied HTML/XML entity
	
	Parameters:
		e - HTML/XML entity in &#code; format where code is the decimal ASCII code
		*/	
	String.htmlEntityToChar = function(e){
		var code =e.match(/^&#(\d+);$/);
		return String.fromCharCode(code[1]);
	}


/* Function: left 
	returns the left side of a string
	 
	Parameters: 
		count 	-	number of characters to return
 
	Returns: 
		The left _count_ characters of _string_
		
	 
	 
	*/
	String.prototype.left=function(count){
		return this.substr(0,count);
	}
/* Function: listAppend 
	returns new list (string) with value appended (does not modify original string). 
	 
	Parameters: 
		val			-	String value to append 
		delimiter	-	*Optional, default ","* 
						String delimiter to append to 
						this string before _val_. If this string is empty, or 
						currently ends with _delimiter_, _delimiter_ will not be 
						appended. 
						returned string
		qualifier	-	*Optional, default null* 
						String to put before and after _val_
 
	Returns: 
		A new list with _val_ appended.  	 
	 
	*/
	String.prototype.listAppend=function(val, delimiter,qualifier){
		if (!delimiter) delimiter =",";
		if (!qualifier) qualifier ="";
		val = String(val);
		var result =new String(this);
		if (delimiter.length && result.length && result.right(delimiter.length) != delimiter){
			result += delimiter;
		}
		if (qualifier.length && val.charAt(0) != qualifier){
			result += qualifier + val + qualifier;	
		} else {
			result += val;
		}
		return result;	
	}

/* Function: listAppendUnique 
	returns new list (string) with value appended, if not already in list 
	 
	Parameters: 
		val			-	String value to append 
		delimiter	-	*Optional, default ","* 
						String delimiter to append to 
						this string before _val_. If this string is empty, or 
						currently ends with _delimiter_, _delimiter_ will not be 
						appended. 
						returned string
		qualifier	-	*Optional, default null* 
						String to put before and after _val_
 
	Returns: 
		A new list with _val_ appended.  	 
	 
	*/
	String.prototype.listAppendUnique=function(val, delimiter,qualifier){
		if (this.listContains(val, delimiter,qualifier)){
			return new String(this);
		} else {
			return this.listAppend(val, delimiter,qualifier);	
		}
	}
	


/* Function: listAppendUniqueNoCase 
	returns new list (string) with value appended, if not already in list, ignoring case 
	 
	Parameters: 
		val			-	String value to append 
		delimiter	-	*Optional, default ","* 
						String delimiter to append to 
						this string before _val_. If this string is empty, or 
						currently ends with _delimiter_, _delimiter_ will not be 
						appended. 
						returned string
		qualifier	-	*Optional, default null* 
						String to put before and after _val_
 
	
	 
	*/
	String.prototype.listAppendUniqueNoCase=function(val, delimiter,qualifier){
		if (this.listContainsNoCase(val, delimiter,qualifier)){
			return new String(this)
		} else {
			return this.listAppendUnique(val, delimiter,qualifier)	
		}
	}
/* Function: listAfter 
	returns this list minus the first element.
	 
	Parameters: 
		delimiter	- 	*Optional default ','*
						String delimiter between values 
		qualifier	-	*Optional, default null* 
						String that is on both sides of values in the string
	 
	*/
	String.prototype.listAfter=function(delimiter,qualifier){
		if (delimiter === undefined) delimiter=",";
		var a = this.listToArray(delimiter);
		if (a.length) {
			a.shift();
			return a.join(delimiter);
		} else {
			return "";
		}
	}
/* Function: listBefore 
	returns this list minus the last element.
	 
	Parameters: 
		delimiter	- 	*Optional default ','*
						String delimiter between values 
 
	 
	*/
	String.prototype.listBefore=function(delimiter){
		if (delimiter === undefined) delimiter=",";
		var a = this.listToArray(delimiter);
		if (a.length) {
			a.pop();
			return a.join(delimiter);
		} else {
			return "";
		}
	}
/* Function: listContains 
	returns true if list contains the value. 
	 
	Parameters: 
		val			-	String Value to search for. If _val_ is a list with the same 
						delimiter then all values in _val_ must also be in this string 
		delimiter	- 	*Optional default ','*
						String delimiter between values 
		qualifier	-	*Optional, default null* 
						String found before and after _val_
	Returns: 
		true if _val_ exists in this string
	 
	*/
	String.prototype.listContains=function(val, delimiter, qualifier){
		if (String(val).listLen(delimiter,qualifier) > 1){
			var $this = this;
			return String(val).listToArray(delimiter,qualifier).every(function(val){
				return $this.listFind(val,0,delimiter,qualifier) > -1;
			})
		} else {
			return this.listFind(val,0,delimiter,qualifier) > -1;
		}
	}
/* Function: listContainsNoCase
	returns true if list contains the value, ignoring case. 
	 
	Parameters: 
		val			-	String Value to search for. If _val_ is a list with the same 
						delimiter then all values in _val_ must also be in this string 
		delimiter	- 	*Optional default ','*
						String delimiter between values 
		qualifier	-	*Optional, default null* 
						String that is on both sides of values in the string
 
	Returns: 
		true if _val_ exists in _list_
	 
	*/
	String.prototype.listContainsNoCase=function(val, delimiter,qualifier){
		if (String(val).listLen(delimiter,qualifier) > 1){
			var $this = this;
			return String(val).listToArray(delimiter,qualifier).every(function(val){
				return $this.listFindNoCase(val,0,delimiter,qualifier) > -1;
			})
		} else {
			return this.listFindNoCase(val,0,delimiter,qualifier) > -1;
		}
	}

/* Function: listFind 
	returns the index of a value in a list 
	 
	Parameters: 
		val			- 	String value to search for
		
		startFrom	-	*Optional default 0*
						Index to start looking for a match
						
		delimiter	- 	*Optional default ','*
						String delimiter between values 
						
		qualifier	-	*Optional, default null* 
						String that is on both sides of values in the string
 
	Returns: 
		index of first found match, or -1 if no match
	 
	*/
	String.prototype.listFind=function(val,startFrom,delimiter,qualifier){
		if (startFrom == undefined ) startFrom = 0;
		if (!delimiter) delimiter =",";
		if (!qualifier) qualifier ="";
		val = String(val);
		if (qualifier.length && val.charAt(0) != qualifier){
			val = qualifier+val+qualifier;	
		} 	
		
		var arr =this.listToArray(delimiter)
		for (var x=startFrom; x < arr.length; ++x){
			if (val == arr[x]) return x;
		}
		return -1;
	}
/* Function: listFindNoCase 
	returns the index of a value in a list, ignoring case
	 
	Parameters: 
		
		val			- 	String value to search for
		
		startFrom	-	*Optional default 0*
						Index to start looking for a match
						
		delimiter	- 	*Optional default ','*
						String delimiter between values 
		qualifier	-	*Optional, default null* 
						String that is on both sides of values in the string
 
	Returns: 
		index of first found match, or -1 if no match
	 
	*/
	String.prototype.listFindNoCase=function(val,startFrom,delimiter,qualifier){
		return this.toLowerCase().listFind(String(val).toLowerCase(),startFrom,delimiter,qualifier)
	}

/* Function: listFirst 
	returns the first value of a list.
	 
	Parameters: 
		delimiter	- 	*Optional default ','*
						String delimiter between values 
		qualifier	-	*Optional, default null* 
						String that is on both sides of values in the string
						
	Returns: 
		the first value of _list_
	 
	 
	*/
	String.prototype.listFirst=function(delimiter,qualifier){
		if (delimiter === undefined) delimiter=",";
		if (qualifier === undefined) qualifier="";
		var a = this.listToArray(delimiter);
		
		if (a.length) {
			return a.shift().match(new RegExp(qualifier+"(.*)" + qualifier))[1];
		} else {
			return "";
		}
	}
/* Function: listLast 
	returns the last value of a list.
	 
	Parameters: 
		delimiter	- 	*Optional default ','*
						String delimiter between values 
		qualifier	-	*Optional, default null* 
						String that is on both sides of values in the string
	Returns: 
		the last value of _list_
	 
	 
	*/
	String.prototype.listLast=function(delimiter,qualifier){
		if (delimiter === undefined) delimiter=",";
		if (qualifier === undefined) qualifier="";
		var a = this.listToArray(delimiter);
		if (a.length) {
			return a.pop().match(new RegExp(qualifier+"(.*)" + qualifier))[1];
		} else {
			return "";
		}
	}
/* Function: listLen 
	returns the length of a list
	 
	Parameters: 
		delimiter	- 	*Optional default ','*
						String delimiter between values 
 
	Returns: 
		number of values in this string
	 
	 
	*/
	String.prototype.listLen=function(delimiter){
		if (!delimiter) delimiter =",";
		return this.listToArray(delimiter).length;
	}
/* Function: listMakeUnique 
	returns new list (string) with each item represented only once 
	 
	Parameters: 
		delimiter	-	*Optional, default ","* 
						String delimiter to append to 
						this string before _val_. If this string is empty, or 
						currently ends with _delimiter_, _delimiter_ will not be 
						appended. 
						returned string
	*/
	String.prototype.listMakeUnique=function( delimiter){
		var newList = "";
		if (!delimiter) delimiter=",";
		
		this.listToArray(delimiter).forEach(function(item){
			newList = newList.listAppendUnique(item,delimiter);
		});
		
		return newList;
	}
/* Function: listMakeUniqueNoCase 
	returns new list (string) with each item represented only once, regardless 
	of case. If an item appears more than once in different upper/lower case, 
	only the first occurance is kept.  
	 
	Parameters: 
		delimiter	-	*Optional, default ","* 
						String delimiter to append to 
						this string before _val_. If this string is empty, or 
						currently ends with _delimiter_, _delimiter_ will not be 
						appended. 
						returned string
	*/
	String.prototype.listMakeUniqueNoCase=function(delimiter){
		var newList = "";
		if (delimiter) delimiter=",";
		
		this.listToArray(delimiter).forEach(function(item){
			newList = newList.listAppendUniqueNoCase(item, delimiter);
		});
		return newList;
	}
/* Function: listSame 
	returns true if the provided list contains the smae elements as this list
	regardless of order. Both lists must use the same qualifier and delimiter
	 
	Parameters: 
		list		-	list to compare to this one
		delimiter	- 	*Optional default ','*
						String delimiter between values
		
	*/
	String.prototype.listSame=function(list,delimiter){
		if (!delimiter) delimiter =",";
		
		return this.listToArray(delimiter).sort().join(delimiter) 
			== list.split(delimiter).sort().join(delimiter)
	}

/* Function: listSameNoCase
	returns true if the provided list contains the smae elements as this list
	regardless of order. Both lists must use the same qualifier and delimiter
	 
	Parameters: 
		list		-	list to compare to this one
		delimiter	- 	*Optional default ','*
						String delimiter between values
		
	*/
	String.prototype.listSameNoCase=function(list,delimiter){
		if (!delimiter) delimiter =",";
		
		return this.toLowerCase().split(delimiter).sort().join(delimiter) 
			== list.toLowerCase().split(delimiter).sort().join(delimiter)
	}
/* Function: listSort
	returns a copy of this list sorted by the supplied sort function
	 
	Parameters:
		sortFun		-	*Optional, default String.compareAlpha*
						A function that takes two strings and 
						returns -1, 0, or 1. If null the default Array sort is
						used. This function will be passed to Array.sort(). The 
						String.compare* functions are easy plugins for this
		
		delimiter	- 	*Optional default ','*
						String delimiter between values
		qualifier	-	*Optional, default null* 
						String remove from both sides of each item
		
						
		Detail:
			This function converts the string list into an array of string items,
			sorts the array with _sortFunc_, and returns the array converted 
			back into a string list. 
			
		See:
		*	<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:sort>
		*	<String.compareAlpha>
		*	<String.compareAlphaReverse>
		*	<String.compareNumeric>
		*	<String.compareNumericReverse>
		*	<String.compareNatural>
		*	<String.compareNaturalReverse>
	*/
	String.prototype.listSort=function(sortFunc,delimiter,qualifier){
		if (!delimiter) delimiter =",";
		if (!qualifier) qualifier ="";
		
		var array =this.listToArray(delimiter,qualifier);
		
		array.sort(sortFunc);
		
		if (qualifier.length){
			array = array.map(function(item){
				return qualifier+item+qualifier
			})
		}
		return array.join(delimiter);
	}
/* Function: listToArray
	returns an array of the items in this list
	 
	Parameters: 
		delimiter	- 	*Optional default ','*
						String delimiter between values
		qualifier	-	*Optional, default null* 
						String remove from both sides of each item
	*/
	String.prototype.listToArray=function(delimiter,qualifier){
		if (!delimiter) delimiter =",";
		if (!qualifier) qualifier ="";
		if (typeof delimiter == "string"){
			delimiter = delimiter.escapeRegex();
		}
		
		var array =this.split(new RegExp(delimiter)).filter(function(item){
			return item && item.length;
		})
		
		var s = this;
		if (qualifier && qualifier.length){
			array = array.map(function(item){
				var matches=item.match(new RegExp(qualifier +"(.*?)"+qualifier));
				if (matches && matches.length ==2){
					return matches[1]
				} else throw new Error("This list "+ s.left(15) +"... does not contain the supplied qualifier: " + qualifier)
				
			})
		}
		return array;
	}

/* Function: parseJson 
	Converts a JSON (http://www.json.org) string into an object 
	 
	Returns: 
		Number String Array or Object contained in the JSON text
		
	Throws:
		*SyntaxError* if not properly formatted
	
	Detail: 
		Adapted from http://www.json.org/json.js
	 
		This function expects strings to be properly formatted. In particular 
		watch out for property names, they must be quoted.
		
		(code)
		Bad: 
		{name:"bob"}
		
		Good:
		{"name":"bob"}
		(end code)
	*/
	String.prototype.parseJson=function(){
		var j;
		var string = new String(this);
		// Parsing happens in three stages. In the first stage, we run the text against
		// a regular expression which looks for non-JSON characters. We are especially
		// concerned with '()' and 'new' because they can cause invocation, and '='
		// because it can cause mutation. But just to be safe, we will reject all
		// unexpected characters.
		
		// We split the first stage into 3 regexp operations in order to work around
		// crippling deficiencies in Safari's regexp engine. First we replace all
		// backslash pairs with '@' (a non-JSON character). Second we delete all of
		// the string literals. Third, we look to see if only JSON characters
		// remain. If so, then the text is safe for eval.
		var cleanText = string.replace(/\\./g, '@').replace(/\"[^\"\\\n\r]*\"/g, '');
		if (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/.test(cleanText)) {
		
			// In the second stage we use the eval function to compile the text into a
			// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
			// in JavaScript: it can begin a block or an object literal. We wrap the text
			// in parens to eliminate the ambiguity.
		
			j = eval('(' + string + ')');
		
			// In the optional third stage, we recursively walk the new structure, passing
			// each name/value pair to a filter function for possible transformation.
			return j;
		}
		
		// If the text is not JSON parseable, then a SyntaxError is thrown.
		
		throw new SyntaxError('Invalid JSON string: '+ cleanText);
	}
/* Function: right 
	returns the right side of a string
	 
	Parameters: 
		count 	-	number of characters to return
 
	Returns: 
		The right _count_ characters of _string_
	 
	*/
	String.prototype.right=function(count){
		return this.substring(this.length-count);
	}
/* Function: repeat 
	returns a copy of this string repeated _count_ times 
	 
	Parameters: 
		count 		-	number of times to copy the provided string
		delimiter	-	*Optional, default null* string to put between each copy
						of the string. This will not be placed at the ent of the 
						returned string
		qualifier	-	*Optional, default null* string to put before and after 
						each copy of the string
		
	*/
	String.prototype.repeat=function(count,delimiter,qualifier){
		if (!delimiter) delimiter ="";
		if (!qualifier) qualifier ="";
		var result ="";
		for (var x=0; x< count; ++x){
			result += qualifier + String(this) + qualifier;
			if (delimiter.length && x < count-1){
				result += delimiter;
			}	
		}
		return result;
	}
/* Function: titleCap 
	Capitalizes the first letter of every word in string
	
	Returns: 
		_text_ with the first letter of every word captialized.
		
	
	 
	*/
	String.prototype.titleCap=function(){
		return this.split(/ /).map(function(text){
			if (text.length){
				text=text.substr(0,1).toUpperCase() + text.substr(1).toLowerCase();
			}
			return text;
		}).join(" ");
	}
/* Function: trim 
	returns a new string with beginning and trailing whitespace removed
	*/
	String.prototype.trim=function(){
		return new String(this).replace(/^\s+|\s+$/g,"");
	}	
/* Function: unEscapeHtml 
	reverses the replacements in <escapeHtml>  
	 
	Parameters:
		chars		-	*Optional default <htmlEscapeChars>* string of characters to 
						restore. Leave this undefined to use the same set of 
						characters as <escapeHtml>  
	Returns: 
		converted string
	

	See:
		<$req.data>,<$req.rawData>,<escapeHtml> 
	*/
	String.prototype.unEscapeHtml=function(chars){
		if (!chars){ 
			chars = String.htmlEscapeChars;
		} else {
			chars = chars.match(/(.)/g);
		}
		
		return chars.reduce(function(string,c,index,list){
			var e = String.charToHtmlEntity(c);
			var regex = new RegExp(e,"g");
			var character = String.htmlEntityToChar(e);
			
			return string.replace(regex,character);
		},this)
	}
/* ======================= Myna-only functions ============================== */
if ("$server_gateway" in this){
	/* Function: hashEquals 
	Returns true if the plaintext password matches the encrypted password 
	 
	Parameters: 
		hash	-	hash previously created with <String.hash>
 
	Returns: 
		true if this string matches _hash_
		
	Detail:
		One way hashes like those created by <String.hash> cannot be decrypted. However, 
		you can encrypt a possible match and compare the hashes. Because of the salt in the hashes 
		produced by <String.hash>, equivalent hashes won't look the same, but this 
		function can compare them.
		
	
	See:
	*	<String.toHash>
	* 	<String.encrypt>
	*	<String.decrypt>
	*	http://www.jasypt.org/
	 
	*/
	String.prototype.hashEquals=function(hash){
		var plainPassword = this;
		var cryptTool = new Packages.org.jasypt.util.password.BasicPasswordEncryptor()
		return cryptTool.checkPassword(plainPassword,hash);
	}
/* Function: toHash 
	Returns a copy of this string encrypted with a strong one-way hash. 
	 
	 
	Returns: 
		Encrypted password string in only printable characters. 
		
	Detail:
		This function encrypts the supplied text with a one-way algorithm so that 
		it can never be converted back to the original text. This can be any text 
		but it makes the most sense for passwords. Although you can't tell what the 
		original text is, you can compare the encrypted string to a plaintext string 
		to see if they match. See <String.hashEquals>. 
		
		For extra security, each hash includes a salt; a string characters appended 
		to the text to force it to be unique. This way even if an attacker can figure 
		out that his/her password of "bob" =  "tUhTivKWsIKE4IwVX9s/wzg1JKXMPU+C", he 
		or she will not be able to tell if any of the other hashes equal "bob". This 
		makes a brute force dictionary attack much more difficult.  
		
	
	Example:
	(code)
		<%="bob".toHash()%><br>
		<%="bob".toHash()%><br>
		<%="bob".toHash()%><br>
		<%="bob".toHash()%><br>
	(end)
	
	..prints something like
	
	(code)
	tUhTivKWsIKE4IwVX9s/wzg1JKXMPU+C
	M0y5EgZVG3iW2N5k2ipHp7x7JtvJYGu5
	yRxnK/RlK9VeX89duVkrncQv4/vWyWGs
	ca4r3Qlt51wFk/y0pv+7YazkcFtRgkoS
	(end)
	 
	See: 
	*	<String.hashEquals> 
	*	<String.encrypt> 
	*	<String.decrypt>
	*	http://www.jasypt.org/
	 
	*/
	String.prototype.toHash=function(){
		var password = this;
		var cryptTool = new Packages.org.jasypt.util.password.BasicPasswordEncryptor()
		return cryptTool.encryptPassword(password);
	}
/* Function: decrypt 
	Returns the unencrypted string contained in this string
	 
	Parameters: 
		password 			-	Password used to orginally encrypt the string
 
	Returns: 
		The unencrypted string contained in this string
	
	See: 
	*	<String.toHash> 
	*	<String.hashEquals> 
	*	<String.encrypt>
	*	http://www.jasypt.org/
	
	*/
	String.prototype.decrypt=function(password){
			var encryptedString = this;
			var cryptTool = new Packages.org.jasypt.util.text.BasicTextEncryptor()
			cryptTool.setPassword(password);
			return cryptTool.decrypt(encryptedString);
	}
/* Function: encrypt 
	Encrypts this using a password.  
	 
	Parameters: 
		password 	-	password to use for encryption.
 
	Returns: 
		The encrypted string.
		
	Example:
	(code)
		<%="bob".encrypt("theSecretPassword")%><br>
		<%="bob".encrypt("theSecretPassword")%><br>
		<%="bob".encrypt("theSecretPassword")%><br>
		<%="bob".encrypt("theSecretPassword")%><br>
	(end)
	
	..prints
	
	(code)
	xeM5n1ncfX2KNTLUEjZHeg==
	AedyMQ5jA1rbOdQZMTq9Ag==
	+Zam3Jg4YqI/5QRkcokLcQ==
	LY2OAW8+xe3I5OJi/Hg+6A==
	(end)
	
	See:
	*	<String.decrypt> 
	*	<String.hashEquals> 
	*	<String.toHash>
	*	http://www.jasypt.org/
	 
	*/
	String.prototype.encrypt=function(password){
		var string = this;
		var cryptTool = new Packages.org.jasypt.util.text.BasicTextEncryptor()
		cryptTool.setPassword(password);
		return cryptTool.encrypt(string);
	}

/* Function: toXml 
	returns an E4X XML object from this string, or throws an exception if not 
	possible 
	 
	See:
	*	https://developer.mozilla.org/en/e4x
	*  http://www.faqts.com/knowledge_base/index.phtml/fid/1762
	
	*/
	String.prototype.toXml=function(){
		return new XML(String(this)
		.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, "") /* mozilla bug 336551*/
		.trim())
	}
/* Function: escapeUrl 
	returns a URL encoded version of this string 
	 
	
	
	*/
	String.prototype.escapeUrl=function(){
		return String(java.net.URLEncoder.encode(this,"UTF-8"));
	}		
}