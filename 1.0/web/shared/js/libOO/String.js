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
	];
	
	
	String.regexEscapeChars=[
		",",
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
	];
/* Function: after 
	returns all the characters after the first _count_ characters
	 
	Parameters: 
		count 	-	number of characters to skip
 
	Example:
	(code)
		 
		var requestDir = $server.requestDir;
		//this is an example only. $server.requestUrl does this for you
		var requestUrl = requestDir.after($server.rootDir.length);
	(end)
	 
	 
	*/
	String.prototype.after=function(count){
		if (count<0 || count > this.length) return "";
		return this.slice(count);
	};
/* Function: before 
	returns all the characters before the last _count_ characters
	 
	Parameters: 
		count 	-	number of characters to remove from the end of the string
 
	Example:
	(code)
		var requestUrl = $server.requestUrl;
		var contextRelativeUrl = requestUrl.after($server.rootUrl.length);
		//this is an example only. $server.rootDir does this for you
		var rootDir = $server.requestDir.before(contextRelativeUrl.length);
	(end)
	 
	 
	*/
	String.prototype.before=function(count){
		if (count<0 || count > this.length) return "";
		return this.substr(0,this.length-count);
	};	
/* Function: charToHtmlEntity
	returns the HTML/XML entity of the supplied character in &#code; format where code is the decimal ASCII code
	
	Parameters:
		c - 1 character string to convert 
	
		*/	
	String.charToHtmlEntity = function(c){
		return "&#" + c.charCodeAt(0) + ";";
	};
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
		b = String(b);
		if(a > b){
			return 1;
		}
		if(a < b){
			return -1;
		}
		return 0;

	};
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
	};
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
		var 
			left,
			right,
			retVal,
			compare,
			x,
			rightPart,
			leftPart
		;
		left = String(a).toLowerCase().match(/(\D+|\d+)/g);
		right = String(b).toLowerCase().match(/(\D+|\d+)/g);
		if (left === undefined || left === null) {left=[];}
		if (right === undefined || right === null) {right=[];}
		retVal =0;
		
		//print("<hr> " + a +" to " + b + " <p>")
		
		compare = function(a,b){
			a = (parseInt(a,10) == a)?parseInt(a,10):a;
			b = (parseInt(b,10) == b)?parseInt(b,10):b;
			//print("comparing " + a + " to " + b +" <br>")
			if ( a < b) {
				return -1;
			}
			if ( a > b){
				return 1;	
			}
			return 0;
		};
		
		for (x=0;x < left.length;++x){
			rightPart = right[x];
			if (rightPart === undefined) {
				 retVal = 0;
				continue; 
			}
			leftPart = left[x];
			if (leftPart === undefined) {
				 retVal = 0;
				continue; 
			}
			
			retVal=compare(leftPart,rightPart);
			if (retVal !== 0) {break;}
		}
		if (retVal === 0) {retVal =compare(String(a),String(b));}
		//print("returning " + retVal)
		return retVal;
	};
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
	};
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
		b = parseFloat(b);
		if(a > b){
			return 1;
		}
		if(a < b){
			return -1;
		}
		return 0;

	};
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
	};
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
		var
			$this=this,
			new_string = [],
			c,
			x,
			escapeIndex
		;
		for (x=0; x < $this.length; ++x){
		c= $this.charAt(x);
		escapeIndex =String.htmlEscapeChars.indexOf(c);
		if (escapeIndex !== -1){
			new_string.push(String.charToHtmlEntity(c));
		} else {
			new_string.push(c);
		}
	}
	return new_string.join("");
	};
/* Function: escapeRegex 
	returns string with symbols that might be interpreted as regex escaped   
	 
	Detail:
		the purpose of this function is to prevent a string from being 
		interpreted as a regex string when using new RegExp 
		
	Returns: 
		converted string
	
	*/
	String.prototype.escapeRegex=function(string){
		return Array.parse(this,function(o,i){return o.charAt(i)}).map(function(c){
			if (String.regexEscapeChars.indexOf(c) !== -1){
				return "\\" + c;
			} else {
				return c;
			}
		}).join("");
		
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
	};

/* Function: getLineIterator
	returns java Iterator that produces a line at a time for this string
	
	Detail:
	   If you are working with large strings, split().forEach() may be
	   inefficient. This function produces a Java Iterator object that
	   can be used to efficiently loop over all the lines in this string.
	
	Example:
	(code)
	   //big text chunk
	   var text = qry.data[0].big_text_field;
	   for (var line in text.getLineIterator()){
			   ... do stuff with line...
	   }
	(end)
	
	
	See Also:
		<Myna.File.getLineIterator>
	*/
	String.prototype.getLineIterator = function(){
	   var r = new java.io.StringReader(this)
	   $application.addOpenObject(r);
	   return Iterator(new org.apache.commons.io.LineIterator(r));
	
	}


/* function: htmlEntityToChar
	returns the chatacter representation of the supplied HTML/XML entity
	
	Parameters:
		e - HTML/XML entity in &#code; format where code is the decimal ASCII code
		*/	
	String.htmlEntityToChar = function(e){
		var code =e.match(/^&#(\d+);$/);
		return String.fromCharCode(code[1]);
	};


/* Function: left 
	returns the left side of a string
	 
	Parameters: 
		count 	-	number of characters to return
 
	Returns: 
		The left _count_ characters of _string_
		
	 
	 
	*/
	String.prototype.left=function(count){
		return this.substr(0,count);
	};
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
		if (!delimiter) {delimiter =",";}
		if (!qualifier) {qualifier ="";}
		val = String(val);
		var result =String(this);
		if (delimiter.length && result.length && result.right(delimiter.length) !== delimiter){
			result += delimiter;
		}
		if (qualifier.length && val.charAt(0) !== qualifier){
			result += qualifier + val + qualifier;	
		} else {
			result += val;
		}
		return result;	
	};

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
			return  String(this);
		} else {
			return this.listAppend(val, delimiter,qualifier);	
		}
	};
	


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
			return  String(this);
		} else {
			return this.listAppendUnique(val, delimiter,qualifier);
		}
	};
/* Function: listAfter 
	returns this list minus the first element.
	 
	Parameters: 
		delimiter	- 	*Optional default ','*
						String delimiter between values 
		qualifier	-	*Optional, default null* 
						String that is on both sides of values in the string
	 
	*/
	String.prototype.listAfter=function(delimiter,qualifier){
		if (delimiter === undefined) {delimiter=",";}
		var a = this.listToArray(delimiter);
		if (a.length) {
			a.shift();
			return a.join(delimiter);
		} else {
			return "";
		}
	};
/* Function: listBefore 
	returns this list minus the last element.
	 
	Parameters: 
		delimiter	- 	*Optional default ','*
						String delimiter between values 
 
	 
	*/
	String.prototype.listBefore=function(delimiter){
		if (delimiter === undefined) {delimiter=",";}
		var a = this.listToArray(delimiter);
		if (a.length) {
			a.pop();
			return a.join(delimiter);
		} else {
			return "";
		}
	};
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
			});
		} else {
			return this.listFind(val,0,delimiter,qualifier) > -1;
		}
	};
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
			});
		} else {
			return this.listFindNoCase(val,0,delimiter,qualifier) > -1;
		}
	};

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
		var 
			arr,
			x
		;
		
		val = String(val);
		if (startFrom === undefined ) {startFrom = 0;}
		if (!delimiter) {delimiter =",";}
		if (!qualifier) {qualifier ="";}
		
		if (qualifier && qualifier.length && val.charAt(0) != qualifier){
			qualifier =String(qualifier);
			val = qualifier+val+qualifier;	
		} 	
		
		arr =this.listToArray(delimiter);
		for (x=startFrom; x < arr.length; ++x){
			if (val == arr[x]) {return x;}
			//else Myna.println(val +"!="+arr[x])
		}
		return -1;
	};
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
		return this.toLowerCase().listFind(String(val).toLowerCase(),startFrom,delimiter,qualifier);
	};

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
		if (delimiter === undefined) {delimiter=",";}
		if (qualifier === undefined) {qualifier="";}
		var a = this.listToArray(delimiter);
		
		if (a.length) {
			return a.shift().match(new RegExp(qualifier+"(.*)" + qualifier))[1];
		} else {
			return "";
		}
	};
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
		if (delimiter === undefined) {delimiter=",";}
		if (qualifier === undefined) {qualifier="";}
		var a = this.listToArray(delimiter);
		if (a.length) {
			return a.pop().match(new RegExp(qualifier+"(.*)" + qualifier))[1];
		} else {
			return "";
		}
	};
/* Function: listLen 
	returns the length of a list
	 
	Parameters: 
		delimiter	- 	*Optional default ','*
						String delimiter between values 
 
	Returns: 
		number of values in this string
	 
	 
	*/
	String.prototype.listLen=function(delimiter){
		if (!delimiter) {delimiter =",";}
		return this.listToArray(delimiter).length;
	};
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
		if (!delimiter) {delimiter=",";}
		
		this.listToArray(delimiter).forEach(function(item){
			newList = newList.listAppendUnique(item,delimiter);
		});
		
		return newList;
	};
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
	*/
	String.prototype.listMakeUniqueNoCase=function(delimiter){
		var newList = "";
		if (!delimiter) {delimiter=",";}
		
		this.listToArray(delimiter).forEach(function(item){
			newList = newList.listAppendUniqueNoCase(item, delimiter);
		});
		return newList;
	};
/* Function: listQualify 
	returns new list (string) with each item surrounded by a qualifying symbol
	 
	Parameters: 
		symbol		-	*Optional, default ' (single quote)*
		delimiter	-	*Optional, default ","* 
							The delimiter for this list
		qualifier	-	*Optional, default null* 
							Current qualifier for this list
	*/
	String.prototype.listQualify=function(symbol,delimiter,qualifier){
		var newList = "";
		if (!delimiter) {delimiter=",";}
		if (!qualifier) {qualifier="";}
		
		this.listToArray(delimiter,qualifier).forEach(function(item){
			newList = newList.listAppend(symbol +item +symbol, delimiter);
		});
		return newList;
	};	
/* Function: listSame 
	returns true if the provided list contains the smae elements as this list
	regardless of order. Both lists must use the same qualifier and delimiter
	 
	Parameters: 
		list		-	list to compare to this one
		delimiter	- 	*Optional default ','*
						String delimiter between values
		
	*/
	String.prototype.listSame=function(list,delimiter){
		list=String(list);
		if (!delimiter) {delimiter =",";}
		
		return this.listToArray(delimiter).sort().join(delimiter) 
			=== list.split(delimiter).sort().join(delimiter);
	};

/* Function: listSameNoCase
	returns true if the provided list contains the smae elements as this list
	regardless of order. Both lists must use the same qualifier and delimiter
	 
	Parameters: 
		list		-	list to compare to this one
		delimiter	- 	*Optional default ','*
						String delimiter between values
		
	*/
	String.prototype.listSameNoCase=function(list,delimiter){
		if (!delimiter) {delimiter =",";}
		
		return this.toLowerCase().split(delimiter).sort().join(delimiter) 
			=== list.toLowerCase().split(delimiter).sort().join(delimiter);
	};
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
		if (!delimiter) {delimiter =",";}
		if (!qualifier) {qualifier ="";}
		
		var array =this.listToArray(delimiter,qualifier);
		
		array.sort(sortFunc);
		
		if (qualifier.length){
			array = array.map(function(item){
				return qualifier+item+qualifier;
			});
		}
		return array.join(delimiter);
	};
/* Function: listToArray
	returns an array of the items in this list
	 
	Parameters: 
		delimiter	- 	*Optional default ','*
						String delimiter between values
		qualifier	-	*Optional, default null* 
						String remove from both sides of each item
	*/
	String.prototype.listToArray=function(delimiter,qualifier){
		var 
			array,
			matches,
			s
		;
		if (!delimiter) {delimiter =",";}
		if (!qualifier) {qualifier ="";}
		if (typeof delimiter === "string"){
			delimiter = delimiter.escapeRegex();
		}
		
		array =this.split(new RegExp(delimiter)).filter(function(item){
			return item && item.length;
		});
		
		s = this;
		if (qualifier && qualifier.length){
			array = array.map(function(item){
				matches=item.match(new RegExp(qualifier +"(.*?)"+qualifier));
				if (matches && matches.length ===2){
					return matches[1];
				} else {
					throw new Error("This list "+ s.left(15) +"... does not contain the supplied qualifier: " + qualifier);
				}
				
			});
		}
		return array;
	};
/* Function: toFixedWidth 
	returns this string padded/truncated to the specified length
	 
	Parameters: 
		count 			-	number of characters to return. If this is 0 or negative an 
							empty string will be returned
		pad				-	*Optional, default " "*
							Character to add to the right side of the string to pad to 
							the fixed width
		placeHolder		-	*Optional, default undefined*
							If defined, this string will be used as the placeholder for 
							text removed to make the string fit the the fixed length. 
							The length of this string is subtracted from _count_ so that 
							the resulting string will not exceed _count_
		truncateFrom	-	*Opitional, default "end"*
							This sets where the placholder will be placed in the string 
							and from where characters will be removed. Valid values are
							"start", "middle" and "end"
							
 
	Returns: 
		returns a string forced to _count_ length, truncating or padding as 
		necessary 
		
	Example:
	(code)
		var delim = " | ";
		var str = "Description".toFixedWidth(15) + delim + "Price".toFixedWidth(5) + "\n";
		data.forEach(function(row){
			str += row.desc.toFixedWidth(15," ","...") + delim 
					+ "$" + String(row.price).toFixedWidth(4)
		})
	(end)
	 
	*/
	String.prototype.toFixedWidth=function(count,pad,placeHolder,truncateFrom){
		var s = new String(this);
		if (!pad) pad = " ";
		if (!placeHolder) placeHolder = "";
		if (!truncateFrom) truncateFrom = "end";
		if (count < 0) count=0;
		if (count ==0) return "";
		if (s.length == count) return new String(this);
		
		if (s.length > count){
			switch (truncateFrom.toLowerCase()){
			case "start":
				return placeHolder +s.right(count).after(placeHolder.length);
			case "middle":
				var half = (count - placeHolder.length)/2
				var left = Math.floor(half);
				var right = Math.ceil(half);
				return s.left(left)+ placeHolder + s.right(right);
			case "end":
				return s.left(count).before(placeHolder.length) + placeHolder;
			
			}
		} else {
			return s + " ".repeat(count -s.length);	
		}
	};

/* Function: parseJson 
	Converts a JSON (http://www.json.org) string into an object 
	 
	Parameters:
		reviver		-	*Option, default date parser*
							If specified, this function will be called called with 
							(key,value) for every value	in the generated object. This
							can be used to "revive" custom serialized values embedded
							in JSON. The default reviver restores dates in this 
							format: "\/Date(1269727815826)\/" format, which is the 
							format <Object.toJson> uses.
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
	//LICENSE and Original Documentation
		// This source code is free for use in the public domain.
		// NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
		
		// http://code.google.com/p/json-sans-eval/
		
		/**
		 * Parses a string of well-formed JSON text.
		 *
		 * If the input is not well-formed, then behavior is undefined, but it is
		 * deterministic and is guaranteed not to modify any object other than its
		 * return value.
		 *
		 * This does not use `eval` so is less likely to have obscure security bugs than
		 * json2.js.
		 * It is optimized for speed, so is much faster than json_parse.js.
		 *
		 * This library should be used whenever security is a concern (when JSON may
		 * come from an untrusted source), speed is a concern, and erroring on malformed
		 * JSON is *not* a concern.
		 *
		 *                      Pros                   Cons
		 *                    +-----------------------+-----------------------+
		 * json_sans_eval.js  | Fast, secure          | Not validating        |
		 *                    +-----------------------+-----------------------+
		 * json_parse.js      | Validating, secure    | Slow                  |
		 *                    +-----------------------+-----------------------+
		 * json2.js           | Fast, some validation | Potentially insecure  |
		 *                    +-----------------------+-----------------------+
		 *
		 * json2.js is very fast, but potentially insecure since it calls `eval` to
		 * parse JSON data, so an attacker might be able to supply strange JS that
		 * looks like JSON, but that executes arbitrary javascript.
		 * If you do have to use json2.js with untrusted data, make sure you keep
		 * your version of json2.js up to date so that you get patches as they're
		 * released.
		 *
		 * @param {string} json per RFC 4627
		 * @param {function (this:Object, string, *):*} opt_reviver optional function
		 *     that reworks JSON objects post-parse per Chapter 15.12 of EcmaScript3.1.
		 *     If supplied, the function is called with a string key, and a value.
		 *     The value is the property of 'this'.  The reviver should return
		 *     the value to use in its place.  So if dates were serialized as
		 *     {@code { "type": "Date", "time": 1234 }}, then a reviver might look like
		 *     {@code
		 *     function (key, value) {
		 *       if (value && typeof value === 'object' && 'Date' === value.type) {
		 *         return new Date(value.time);
		 *       } else {
		 *         return value;
		 *       }
		 *     }}.
		 *     If the reviver returns {@code undefined} then the property named by key
		 *     will be deleted from its container.
		 *     {@code this} is bound to the object containing the specified property.
		 * @return {Object|Array}
		 * @author Mike Samuel <mikesamuel@gmail.com>
		 */
	String.prototype.parseJson= (function () {
		var number
				= '(?:-?\\b(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\\b)';
		var oneChar = '(?:[^\\0-\\x08\\x0a-\\x1f\"\\\\]'
				+ '|\\\\(?:[\"/\\\\bfnrt]|u[0-9A-Fa-f]{4}))';
		var string = '(?:\"' + oneChar + '*\")';
	
		// Will match a value in a well-formed JSON file.
		// If the input is not well-formed, may match strangely, but not in an unsafe
		// way.
		// Since this only matches value tokens, it does not match whitespace, colons,
		// or commas.
		var jsonToken = new RegExp(
				'(?:false|true|null|[\\{\\}\\[\\]]'
				+ '|' + number
				+ '|' + string
				+ ')', 'g');
	
		// Matches escape sequences in a string literal
		var escapeSequence = new RegExp('\\\\(?:([^u])|u(.{4}))', 'g');
	
		// Decodes escape sequences in object literals
		var escapes = {
			'"': '"',
			'/': '/',
			'\\': '\\',
			'b': '\b',
			'f': '\f',
			'n': '\n',
			'r': '\r',
			't': '\t'
		};
		function unescapeOne(_, ch, hex) {
			return ch ? escapes[ch] : String.fromCharCode(parseInt(hex, 16));
		}
	
		// A non-falsy value that coerces to the empty string when used as a key.
		var EMPTY_STRING = new String('');
		var SLASH = '\\';
	
		// Constructor to use based on an open token.
		var firstTokenCtors = { '{': Object, '[': Array };
	
		var hop = Object.hasOwnProperty;
	
		return function (opt_reviver) {
			var json = this
			if (!opt_reviver){
				opt_reviver=function(key,value){
					if (value && typeof value === "string"){
						var parts =value.match(/^\/Date\((\d+)\)\/$/); 
						if (parts){
							return new Date(parseInt(parts[1])) 
						} else return value;
					} else return value
				}
			}
			
			// Split into tokens
			var toks = json.match(jsonToken);
			// Construct the object to return
			var result;
			var tok = toks[0];
			var topLevelPrimitive = false;
			if ('{' === tok) {
				result = {};
			} else if ('[' === tok) {
				result = [];
			} else {
				// The RFC only allows arrays or objects at the top level, but the JSON.parse
				// defined by the EcmaScript 5 draft does allow strings, booleans, numbers, and null
				// at the top level.
				result = [];
				topLevelPrimitive = true;
			}
	
			// If undefined, the key in an object key/value record to use for the next
			// value parsed.
			var key;
			// Loop over remaining tokens maintaining a stack of uncompleted objects and
			// arrays.
			var stack = [result];
			for (var i = 1 - topLevelPrimitive, n = toks.length; i < n; ++i) {
				tok = toks[i];
	
				var cont;
				switch (tok.charCodeAt(0)) {
					default:	// sign or digit
						cont = stack[0];
						cont[key || cont.length] = +(tok);
						key = void 0;
						break;
					case 0x22:	// '"'
						tok = tok.substring(1, tok.length - 1);
						if (tok.indexOf(SLASH) !== -1) {
							tok = tok.replace(escapeSequence, unescapeOne);
						}
						cont = stack[0];
						if (!key) {
							if (cont instanceof Array) {
								key = cont.length;
							} else {
								key = tok || EMPTY_STRING;	// Use as key for next value seen.
								break;
							}
						}
						cont[key] = tok;
						key = void 0;
						break;
					case 0x5b:	// '['
						cont = stack[0];
						stack.unshift(cont[key || cont.length] = []);
						key = void 0;
						break;
					case 0x5d:	// ']'
						stack.shift();
						break;
					case 0x66:	// 'f'
						cont = stack[0];
						cont[key || cont.length] = false;
						key = void 0;
						break;
					case 0x6e:	// 'n'
						cont = stack[0];
						cont[key || cont.length] = null;
						key = void 0;
						break;
					case 0x74:	// 't'
						cont = stack[0];
						cont[key || cont.length] = true;
						key = void 0;
						break;
					case 0x7b:	// '{'
						cont = stack[0];
						stack.unshift(cont[key || cont.length] = {});
						key = void 0;
						break;
					case 0x7d:	// '}'
						stack.shift();
						break;
				}
			}
			// Fail if we've got an uncompleted object.
			if (topLevelPrimitive) {
				if (stack.length !== 1) { throw new Error(); }
				result = result[0];
			} else {
				if (stack.length) { throw new Error(); }
			}
	
			if (opt_reviver) {
				// Based on walk as implemented in http://www.json.org/json2.js
				var walk = function (holder, key) {
					var value = holder[key];
					if (value && typeof value === 'object') {
						var toDelete = null;
						for (var k in value) {
							if (hop.call(value, k) && value !== holder) {
								// Recurse to properties first.	This has the effect of causing
								// the reviver to be called on the object graph depth-first.
	
								// Since 'this' is bound to the holder of the property, the
								// reviver can access sibling properties of k including ones
								// that have not yet been revived.
	
								// The value returned by the reviver is used in place of the
								// current value of property k.
								// If it returns undefined then the property is deleted.
								var v = walk(value, k);
								if (v !== void 0) {
									value[k] = v;
								} else {
									// Deleting properties inside the loop has vaguely defined
									// semantics in ES3 and ES3.1.
									if (!toDelete) { toDelete = []; }
									toDelete.push(k);
								}
							}
						}
						if (toDelete) {
							for (var i = toDelete.length; --i >= 0;) {
								delete value[toDelete[i]];
							}
						}
					}
					return opt_reviver.call(holder, key, value);
				};
				result = walk({ '': result }, '');
			}
	
			return result;
		};
	})();
	
		
	
	String.prototype.parseJsonOrig=function(){
		var 
			j,
			cleanText,
			string = String(this)
		;
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
		cleanText = string.replace(/\\./g,'@').replace(/\"[^\"\\\n\r]*\"/g, '');
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
	};
/* Function: right 
	returns the right side of a string
	 
	Parameters: 
		count 	-	number of characters to return
 
	Returns: 
		The right _count_ characters of _string_
	 
	*/
	String.prototype.right=function(count){
		return this.substring(this.length-count);
	};
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
		var
			result,
			x
		;
		if (!delimiter) {delimiter ="";}
		if (!qualifier) {qualifier ="";}
		result ="";
		for (x=0; x< count; ++x){
			result += qualifier + String(this) + qualifier;
			if (delimiter.length && x < count-1){
				result += delimiter;
			}	
		}
		return result;
	};
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
	};
/* Function: trim 
	returns a new string with beginning and trailing whitespace removed
	*/
	String.prototype.trim=function(){
		return  String(this).replace(/^\s+|\s+$/g,"");
	};
/* Function: trimIndent
	returns a new string with the initial white space on each line trimmed
	
	This is useful for out-denting the entire string in situations where every
	line starts with the same unwanted whitespace. This is automatically applied 
	to ejs blocks so that they can be indented with the code without adding 
	unwanted whitespace to the string.
	
	Note: 
		The string must start with an initial return (\n)  followed by the regular
		whitespace (spaces and tabs) to replace.
	
	Example:
	
	(code)
		var offsetString = "\n\t\tline1\n\t\tline2\n\t\t\tsubline a\n\t\tline3";
		Myna.print("before<br><pre>" + offsetString + "</pre>")
		Myna.print("after<br><pre>" + offsetString.trimIndent() + "</pre>")
	(end)
	*/
	String.prototype.trimIndent=function(){
		var string = this;
		//initial white space
		var iws = string.match(/^\n([ \t]+)/)
		if (!iws) return string;
		iws = new RegExp("\n" +iws[1],"g");
	
		return string.replace(iws,"\n");
	};
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
		var 
			e,
			regex,
			character
		;
		if (!chars){ 
			chars = String.htmlEscapeChars;
		} else {
			chars = chars.match(/(.)/g);
		}
		
		return chars.reduce(function(string,c,index,list){
			e = String.charToHtmlEntity(c);
			regex = new RegExp(e,"g");
			character = String.htmlEntityToChar(e);
			
			return string.replace(regex,character);
		},this);
	};
/* ======================= Myna-only functions ============================== */
if ("$server_gateway" in this){
/* Function: hashCode
		returns java.lang.String.hasCode() for this string
		
		Detail:
			The Java String object provides a method for quickly creating 
			a unique numeric hash value. This is useful for creating hash keys for 
			lookup or equality comparisons or any other non-cryptographic uses.
			
		for cryptographic uses see <toHash>
	*/
	String.prototype.hashCode=function(){
		return new java.lang.String(this).hashCode();	
	}
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
		if (/[\.-_]/.test(hash)){
			hash = hash
				.replace(/-/g,"+")
				.replace(/_/g,"/")
				.replace(/\./g,"=")	
		}
		var 
			plainPassword = this,
			cryptTool = new Packages.org.jasypt.util.password.BasicPasswordEncryptor()
		;
		return cryptTool.checkPassword(plainPassword,hash);
	};
/* Function: toHash 
	Returns a copy of this string encrypted with a strong one-way hash in base64 
	format. 
	 
	Parameters:
		urlSafe	-	*Optional, default false*
						If true, then the characters + and / and = will be replaced with 
						- and _ and . respectively. <String.hashEquals> will 
						automatically detect this format
							
	 
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
	String.prototype.toHash=function(urlSafe){
		var 
			password = this,
			cryptTool = new Packages.org.jasypt.util.password.BasicPasswordEncryptor()
		;
		var b64 = cryptTool.encryptPassword(password);
		
		if (urlSafe){
			b64 = b64
				.replace(/\+/g,"-")
				.replace(/\//g,"_")
				.replace(/=/g,".")
		}
		return b64;
	};
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
			var 
				encryptedString = this,
				cryptTool = new Packages.org.jasypt.util.text.BasicTextEncryptor()
			;
			cryptTool.setPassword(password);
			return cryptTool.decrypt(encryptedString);
	};
/* Function: encrypt 
	Encrypts this string using a password.  
	 
	Parameters: 
		password 	-	password to use for encryption.
 
	Detail:
		This function provides simple password-based encryption of string values.
		For more secure encryption using rotating database-backed keys see 
		<Myna.KeyStore>
	
	Returns: 
		The encrypted string.
		
	Example:
	(code)
		<%="bob".encrypt("theSecretPassword")%><br>
		<%="bob".encrypt("theSecretPassword")%><br>
		<%="bob".encrypt("theSecretPassword")%><br>
		<%="bob".encrypt("theSecretPassword")%><br>
	(end)
	
	.. might print:
	
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
	*	<Myna.KeyStore>
	*	http://www.jasypt.org/
	 
	*/
	String.prototype.encrypt=function(password){
		var 
			string = this,
			cryptTool = new Packages.org.jasypt.util.text.BasicTextEncryptor()
		;
		cryptTool.setPassword(password);
		return cryptTool.encrypt(string);
	};

/* Function: toJava 
	returns a new java.lang.String of this string
	
	*/
	String.prototype.toJava=function(){
		return new java.lang.String(this);
	};
/* Function: toXml 
	returns an E4X XML object from this string, or throws an exception if not 
	possible 
	 
	See:
	*	https://developer.mozilla.org/en/e4x
	*  http://www.faqts.com/knowledge_base/index.phtml/fid/1762
	
	*/
	String.prototype.toXml=function(){
		var xml = String(this);
		for (var i=0; !/<[^\?!]/.test(xml.substr(i,2)) ;++i){}
		if (i) xml = xml.substr(i);
		
		return new XML(xml);
	};
/* Function: escapeUrl 
	returns a URL encoded version of this string 
	 
	
	
	*/
	String.prototype.escapeUrl=function(){
		return String(java.net.URLEncoder.encode(this,"UTF-8"));
	};		
}