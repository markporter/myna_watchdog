/*
	 Ext JS Library 1.1.1
	 Copyright(c) 2006-2007, Ext JS, LLC.
	 licensing@extjs.com
	 
	 http://www.extjs.com/license
 */


/* Class: Date
	This date class was originally adapted from the EXT js library http://www.extjs.com. 	

	The date parsing and format syntax is a subset of
	PHP's date(http://www.php.net/date) function, and the formats that are
	supported will provide results equivalent to their PHP versions.
	
	Following is the list of all currently supported formats:
	(code)
Sample date:
'Wed Jan 10 2007 15:05:01 GMT-0600 (Central Standard Time)'

Format  Output      Description
------  ----------  --------------------------------------------------------------
  d      10         Day of the month, 2 digits with leading zeros
  D      Wed        A textual representation of a day, three letters
  j      10         Day of the month without leading zeros
  l      Wednesday  A full textual representation of the day of the week
  S      th         English ordinal day of month suffix, 2 chars (use with j)
  w      3          Numeric representation of the day of the week
  z      9          The julian date, or day of the year (0-365)
  W      01         ISO-8601 2-digit week number of year, weeks starting on Monday (00-52)
  F      January    A full textual representation of the month
  m      01         Numeric representation of a month, with leading zeros
  M      Jan        Month name abbreviation, three letters
  n      1          Numeric representation of a month, without leading zeros
  t      31         Number of days in the given month
  L      0          Whether it's a leap year (1 if it is a leap year, else 0)
  Y      2007       A full numeric representation of a year, 4 digits
  y      07         A two digit representation of a year
  a      pm         Lowercase Ante meridiem and Post meridiem
  A      PM         Uppercase Ante meridiem and Post meridiem
  g      3          12-hour format of an hour without leading zeros
  G      15         24-hour format of an hour without leading zeros
  h      03         12-hour format of an hour with leading zeros
  H      15         24-hour format of an hour with leading zeros
  i      05         Minutes with leading zeros
  s      01         Seconds, with leading zeros
  u      001 to 999 Milliseconds, with leading zeros                                          
  O      -0600      Difference to Greenwich time (GMT) in hours
  o      -06:00      Difference to Greenwich time (GMT) in hours:minutes
  T      CST        Timezone setting of the machine running the code
  Z      -21600     Timezone offset in seconds (negative if west of UTC, positive if east)
(end)
	
	 Example usage (note that you must escape format specifiers with '\\' to render them as character literals):
	 (code)
var dt = new Date('1/10/2007 03:05:01 PM GMT-0600');
Myna.println(dt.format('Y-m-d'));                         //2007-01-10
Myna.println(dt.format('F j, Y, g:i a'));                 //January 10, 2007, 3:05 pm
Myna.println(dt.format('l, \\t\\he dS of F Y h:i:s A'));  //Wednesday, the 10th of January 2007 03:05:01 PM
 (end)
	
	 Here are some standard date/time patterns that you might find helpful.  They
	 are not part of the source of Date.js, but to use them you can simply copy this
	 block of code into any script that is included after Date.js and they will also become
	 globally available on the Date object.  Feel free to add or remove patterns as needed in your code.
	 (code)
Date.patterns = {
    ISO8601Long:"Y-m-d H:i:s",
    ISO8601Short:"Y-m-d",
    ShortDate: "n/j/Y",
    LongDate: "l, F d, Y",
    FullDateTime: "l, F d, Y g:i:s A",
    MonthDay: "F d",
    ShortTime: "g:i A",
    LongTime: "g:i:s A",
    SortableDateTime: "Y-m-d\\TH:i:s",
    UniversalSortableDateTime: "Y-m-d H:i:sO",
    YearMonth: "F, Y"
};
(end)
	
	 Example usage:
	 (code)
var dt = new Date();
Myna.println(dt.format(Date.patterns.ShortDate));
 (end)
 */

/*
	 Most of the date-formatting functions below are the excellent work of Baron Schwartz.
	 They generate precompiled functions from date formats instead of parsing and
	 processing the pattern every time you format a date.  These functions are available
	 on every Date object (any javascript function).
	
	 The original article and download are here:
	 http://www.xaprb.com/blog/2005/12/12/javascript-closures-for-runtime-efficiency/
	
 */
// private escape function for Ext
var escape = function(string) {
	return string.replace(/('|\\)/g, "\\$1");
}
var leftPad = function (val,size, ch) {
	var result = new String(val);
	if(ch === null || ch === undefined || ch === '') {
		ch = " ";
	}
	while (result.length < size) {
		result = ch + result;
	}
	return result;
}
Date.patterns = {
    ISO8601Long:"Y-m-d\\TH:i:s",
    ISO8601Short:"Y-m-d",
    ShortDate: "n/j/Y",
    LongDate: "l, F d, Y",
    FullDateTime: "l, F d, Y g:i:s A",
    MonthDay: "F d",
    ShortTime: "g:i A",
    LongTime: "g:i:s A",
    SortableDateTime: "Y-m-d\\TH:i:s",
    UniversalSortableDateTime: "Y-m-d H:i:sO",
    YearMonth: "F, Y"
}
// private
Date.parseFunctions = {count:0};
// private
Date.parseRegexes = [];
// private
Date.formatFunctions = {count:0};

// private
Date.prototype.dateFormat = function(format) {
    if (Date.prototype["formatFunction"+format] == null) {
        Date.createNewFormat(format);
    }
    return this["formatFunction"+format]();
};


/* Function: format
	 Formats a date given the supplied format string
	 format - {String}The format string
	 
Returns: 
 {String} The formatted date
	 @method
 */
Date.prototype.format = Date.prototype.dateFormat;

// private
Date.createNewFormat = function(format) {
	var formatFunction;
	Date.prototype["formatFunction"+format] =formatFunction= function(){
		var my = arguments.callee;
		var theDate = this;
		return my.formatters.reduce(function(result, formatter){
			return result + formatter.apply(theDate);
		},"")
	}
	formatFunction.formatters=[];
    var special = false;
    var ch = '';
    for (var i = 0; i < format.length; ++i) {
        ch = format.charAt(i);
        if (!special && ch == "\\") {
            special = true;
        }
        else if (!special){
			special = false;
			
            formatFunction.formatters.push(Date.getFormatCode(ch));
        }
		else {
			special = false;
			var c = ch;
			formatFunction.formatters.push(function(){return c});
		}
    }
    //eval(code.substring(0, code.length - 3) + ";}");
};

// private
Date.getFormatCode = function(character) {
    switch (character) {
    case "d":
	return function(){return leftPad(this.getDate(), 2, '0')};
    case "D":
        return function(){ return Date.dayNames[this.getDay()].substring(0, 3) };
    case "j":
        return function(){ return this.getDate() };
    case "l":
        return function(){ return Date.dayNames[this.getDay()] };
    case "S":
	
        return function(){ return this.getSuffix() };
    case "w":
        return function(){ return this.getDay() };
    case "z":
        return function(){ return this.getDayOfYear() };
    case "W":
        return function(){ return this.getWeekOfYear() };
    case "F":
        return function(){ return Date.monthNames[this.getMonth()] };
    case "m":
        return function(){ return leftPad(this.getMonth() + 1, 2, '0') };
    case "M":
        return function(){ return Date.monthNames[this.getMonth()].substring(0, 3) };
    case "n":
        return function(){ return (this.getMonth() + 1) };
    case "t":
        return function(){ return this.getDaysInMonth() };
    case "L":
        return function(){ return (this.isLeapYear() ? 1 : 0) };
    case "Y":
        return function(){ return this.getFullYear() };
    case "y":
        return function(){ return ('' + this.getFullYear()).substring(2, 4) };
    case "a":
        return function(){ return (this.getHours() < 12 ? 'am' : 'pm') };
    case "A":
        return function(){ return (this.getHours() < 12 ? 'AM' : 'PM') };
    case "g":
        return function(){ return ((this.getHours() % 12) ? this.getHours() % 12 : 12) };
    case "G":
        return function(){ return this.getHours() };
    case "h":
        return function(){ return leftPad((this.getHours() % 12) ? this.getHours() % 12 : 12, 2, '0') };
    case "H":
        return function(){ return leftPad(this.getHours(), 2, '0') };
    case "i":
        return function(){ return leftPad(this.getMinutes(), 2, '0') };
    case "s":
        return function(){ return leftPad(this.getSeconds(), 2, '0') };
	case "u":
        return function(){ return leftPad(this.getMilliseconds(), 3, '0') };	
    case "o":
        return function(){ var o = String(this.getGMTOffset()); return o.left(3)+":" +o.right(2)};
	case "O":
        return function(){ return this.getGMTOffset() };
    case "T":
        return function(){ return this.getTimezone() };
    case "Z":
        return function(){ return (this.getTimezoneOffset()	 -60) };
    default:
		var f = function(){ return arguments.callee.charVal };
		f.charVal=escape(character);
        return f
    }
};

/* function: parseDate
	 Parses the passed string using the specified format. Note that this function expects dates in normal calendar
	 format, meaning that months are 1-based (1 = January) and not zero-based like in JavaScript dates.  Any part of
	 the date format that is not specified will default to the current date value for that part.  Time parts can also
	 be specified, but default to 0.  Keep in mind that the input date string must precisely match the specified format
	 string or the parse operation will fail.
	 Example Usage:
(code)
//dt = Fri May 25 2007 (current date)
var dt = new Date();

//dt = Thu May 25 2006 (today's month/day in 2006)
dt = Date.parseDate("2006", "Y");

//dt = Sun Jan 15 2006 (all date parts specified)
dt = Date.parseDate("2006-1-15", "Y-m-d");

//dt = Sun Jan 15 2006 15:20:01 GMT-0600 (CST)
dt = Date.parseDate("2006-1-15 3:20:01 PM", "Y-m-d h:i:s A" );
(end)
	 input - {String}The unparsed date as a string
	 format - {String}The format the date is in
	 
Returns: 
 {Date} The parsed date
	 @static
 */
Date.parseDate = function(input, format) {
    if (Date.parseFunctions[format] == null) {
        Date.createParser(format);
    }
    return Date.parseFunctions[format](input);
};

// private
Date.createParser = function(format) {
   	var parser;
    Date.parseFunctions[format] = parser =function(input){
		var my = arguments.callee;
		var v = new Date();
        var dateVars ={
			y:v.getFullYear(), 
			m:v.getMonth(), 
			d:v.getDate(), 
			h: 0, 
			i: 0, 
			ms:0,
			s: 0, 
			o:null, 
			z:null
		};
       
        var results = input.match(my.regex);
		
        if (results && results.length) {
			results.forEach(function(match,index){
				if (index == 0) return; //skip the zero match
				my.matchFunctions[index-1](match,dateVars);
			})
			for (var key in dateVars){
				switch(key){
					case 'y':
						if (dateVars[key] >= 0) v.setFullYear(dateVars[key]);
						break;
					case 'm':
						if (dateVars[key] >= 0) v.setMonth(dateVars[key]);
						break;
					case 'd':
						if (dateVars[key] >= 0) v.setDate(dateVars[key]);
						break;
					case 'h':
						if (dateVars[key] >= 0) v.setHours(dateVars[key]);
						break;
					case 'i':
						if (dateVars[key] >= 0) v.setMinutes(dateVars[key]);
						break;
					case 's':
						if (dateVars[key] >= 0) v.setSeconds(dateVars[key]);
						break;
					case 'ms':
						if (dateVars[key] >= 0) v.setMilliseconds(dateVars[key]);
						break;
				}
			}
			return (v && (dateVars.z || dateVars.o))? // favour UTC offset over GMT offset
				((dateVars.z)? v.add(Date.SECOND, (v.getTimezoneOffset() * 60) + (dateVars.z*1)) : // reset to UTC, then add offset
					v.add(Date.HOUR, (v.getGMTOffset() / 100) + (dateVars.o / -100))) : v // reset to GMT, then add offset
			;
		} else{
			throw new SyntaxError("Pattern '" + my.format +"' does not match '" + input +"'")
		}
		
	};
   
    parser.regex = "";
	parser.matchFunctions = [];
	parser.format = format;
    var special = false;
    var ch = '';
    for (var i = 0; i < format.length; ++i) {
        ch = format.charAt(i);
        if (!special && ch == "\\") {
            special = true;
        }
        else if (special) {
            special = false;
            parser.regex += escape(ch);
        }
        else {
            var obj = Date.formatCodeToRegex(ch);
            parser.regex += obj.s;
            if (obj.g && obj.f) {
				parser.matchFunctions.push(obj.f);
            }
        }
    }

};

// private
Date.formatCodeToRegex = function(character) {
    switch (character) {
    case "D":
        return {g:0,
		f:null,
        s:"(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)"};
    case "j":
        return {g:1,
			f:function(match,dateVars){dateVars.d = parseInt(match, 10)},
            s:"(\\d{1,2})"}; // day of month without leading zeroes
    case "d":
        return {g:1,
			f:function(match,dateVars){dateVars.d = parseInt(match, 10)},
            s:"(\\d{2})"}; // day of month with leading zeroes
    case "l":
        return {g:0,
			f:null,
            s:"(?:" + Date.dayNames.join("|") + ")"};
    case "S":
        return {g:0,
			f:null,
            s:"(?:st|nd|rd|th)"};
    case "w":
        return {g:0,
			f:null,
            s:"\\d"};
    case "z":
        return {g:0,
			f:null,
            s:"(?:\\d{1,3})"};
    case "W":
        return {g:0,
			f:null,
            s:"(?:\\d{2})"};
    case "F":
        return {g:1,
			f:function(match,dateVars){dateVars.m = parseInt(Date.monthNumbers[match.substring(0, 3)], 10)},
            s:"(" + Date.monthNames.join("|") + ")"};
    case "M":
        return {g:1,
			f:function(match,dateVars){dateVars.m = parseInt(Date.monthNumbers[match], 10)},
            s:"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"};
    case "n":
        return {g:1,
			f:function(match,dateVars){dateVars.m = parseInt(match, 10)-1},
            s:"(\\d{1,2})"}; // Numeric representation of a month, without leading zeros
    case "m":
        return {g:1,
			f:function(match,dateVars){dateVars.m = parseInt(match, 10)-1},
            s:"(\\d{2})"}; // Numeric representation of a month, with leading zeros
    case "t":
        return {g:0,
			f:null,
            s:"\\d{1,2}"};
    case "L":
        return {g:0,
			f:null,
            s:"(?:1|0)"};
    case "Y":
        return {g:1,
			f:function(match,dateVars){dateVars.y = parseInt(match, 10)},
            s:"(\\d{4})"};
    case "y":
        return {g:1,
			f:function(match,dateVars){
				var ty = parseInt(match, 10);
                dateVars.y = ty > Date.y2kYear ? 1900 + ty : 2000 + ty;
			},
            s:"(\\d{1,2})"};
    case "a":
        return {g:1,
			f:function(match,dateVars){
				if (match == 'am') {
					if (dateVars.h == 12) { 
						dateVars.h = 0; 
					} else if (dateVars.h < 12) { 
						dateVars.h += 12; 
					}
				}
			},
            s:"(am|pm)"};
    case "A":
        return {g:1,
			f:function(match,dateVars){
				if (match == 'AM') {
					if (dateVars.h == 12) { 
						dateVars.h = 0; 
					} else if (dateVars.h < 12) { 
						dateVars.h += 12; 
					}
				}
			},
            s:"(AM|PM)"};
    case "g":
    case "G":
        return {g:1,
			f:function(match,dateVars){ dateVars.h = parseInt(match,10);},
            s:"(\\d{1,2})"}; // 12/24-hr format  format of an hour without leading zeroes
    case "h":
    case "H":
        return {g:1,
			f:function(match,dateVars){ dateVars.h = parseInt(match,10);},
            s:"(\\d{2})"}; //  12/24-hr format  format of an hour with leading zeroes
    case "i":
        return {g:1,
			f:function(match,dateVars){ dateVars.i = parseInt(match,10);},
            s:"(\\d{2})"};
    case "s":
        return {g:1,
			f:function(match,dateVars){ dateVars.s = parseInt(match,10);},
            s:"(\\d{2})"};
	case "u":
        return {g:1,
			f:function(match,dateVars){ dateVars.ms = parseInt(match,10);},
            s:"(\\d{3})"};
    case "O":
        return {g:1,
			f:function(match,dateVars){
				dateVars.o = match;
			},
            s:"([+\-]\\d{4})"};
	case "o":
        return {g:1,
			f:function(match,dateVars){
				dateVars.o = match;
				var o = dateVars.o;
				var sn;
				var hr;
				var mn;
				if (match == "Z"){
					dateVars.o="0000"
					
				} else {
					sn = o.substring(0,1); // get + / - sign
					hr = o.substring(1,3)*1 + Math.floor(o.substring(4,6) / 60); // get hours (performs minutes-to-hour conversion also)
					mn = o.substring(4,6) % 60; // get minutes
				}
			},
		s:"([+\-]\\d{2}:\\d{2}|Z)"};
    case "T":
        return {g:0,
			f:null,
            s:"[A-Z]{1,4}"}; // timezone abbrev. may be between 1 - 4 chars
    case "Z":
        return {g:1,
			f:function(match,dateVars){
				dateVars.z = (-43200 <= match*1 && match*1 <= 50400)? match : null;
			},
            s:"([+\-]?\\d{1,5})"}; // leading '+' sign is optional for UTC offset
    default:
        return {g:0,
			f:null,
            s:escape(character)};
    }
};

/* function: getTimezone
	 Get the timezone abbreviation of the current date (equivalent to the format specifier 'T').
	 
Returns: 
 {String} The abbreviated timezone name (e.g. 'CST')
 */
Date.prototype.getTimezone = function() {
    return this.toString().replace(/^.*? ([A-Z]{1,4})[\-+][0-9]{4} .*$/, "$1");
};

/* Function: getGMTOffset
	 Get the offset from GMT of the current date (equivalent to the format specifier 'O').
	 
Returns: 
 {String} The 4-character offset string prefixed with + or - (e.g. '-0600')
 */
Date.prototype.getGMTOffset = function() {
    return (this.getTimezoneOffset() > 0 ? "-" : "+")
        + leftPad(Math.abs(Math.floor(this.getTimezoneOffset() / 60)), 2, "0")
        + leftPad(this.getTimezoneOffset() % 60, 2, "0");
};

/* Function: getDayOfYear
	 Get the numeric day number of the year, adjusted for leap year.
	 
Returns: 
 {Number} 0 through 364 (365 in leap years)
 */
Date.prototype.getDayOfYear = function() {
    var num = 0;
    Date.daysInMonth[1] = this.isLeapYear() ? 29 : 28;
    for (var i = 0; i < this.getMonth(); ++i) {
        num += Date.daysInMonth[i];
    }
    return num + this.getDate() - 1;
};

/* Function: getWeekOfYear
	 Get the string representation of the numeric week number of the year
	 (equivalent to the format specifier 'W').
	 
Returns: 
 {String} '00' through '52'
 */
Date.prototype.getWeekOfYear = function() {
    // Skip to Thursday of this week
    var now = this.getDayOfYear() + (4 - this.getDay());
    // Find the first Thursday of the year
    var jan1 = new Date(this.getFullYear(), 0, 1);
    var then = (7 - jan1.getDay() + 4);
    return leftPad(((now - then) / 7) + 1, 2, "0");
};

/* Function: 
	 Whether or not the current date is in a leap year.
	 
Returns: isLeapYear
 {Boolean} True if the current date is in a leap year, else false
 */
Date.prototype.isLeapYear = function() {
    var year = this.getFullYear();
    return ((year & 3) == 0 && (year % 100 || (year % 400 == 0 && year)));
};

/* Function: getFirstDayOfMonth
	 Get the first day of the current month, adjusted for leap year.  The returned value
	 is the numeric day index within the week (0-6) which can be used in conjunction with
	 the {@link #monthNames} array to retrieve the textual day name.
	 Example:
	(code)
var dt = new Date('1/10/2007');
Myna.println(Date.dayNames[dt.getFirstDayOfMonth()]); //output: 'Monday'
(end)
	 
Returns: 
 {Number} The day number (0-6)
 */
Date.prototype.getFirstDayOfMonth = function() {
    var day = (this.getDay() - (this.getDate() - 1)) % 7;
    return (day < 0) ? (day + 7) : day;
};

/* Function: getLastDayOfMonth
	 Get the last day of the current month, adjusted for leap year.  The returned value
	 is the numeric day index within the week (0-6) which can be used in conjunction with
	 the {@link #monthNames} array to retrieve the textual day name.
	 Example:
	(code)
var dt = new Date('1/10/2007');
Myna.println(Date.dayNames[dt.getLastDayOfMonth()]); //output: 'Wednesday'
(end)
	 
Returns: 
 {Number} The day number (0-6)
 */
Date.prototype.getLastDayOfMonth = function() {
    var day = (this.getDay() + (Date.daysInMonth[this.getMonth()] - this.getDate())) % 7;
    return (day < 0) ? (day + 7) : day;
};


/* Function: getFirstDateOfMonth
	 Get the first date of this date's month
	 
Returns: 
 {Date}
 */
Date.prototype.getFirstDateOfMonth = function() {
    return new Date(this.getFullYear(), this.getMonth(), 1);
};

/* Function: getLastDateOfMonth
	 Get the last date of this date's month
	 
Returns: 
 {Date}
 */
Date.prototype.getLastDateOfMonth = function() {
    return new Date(this.getFullYear(), this.getMonth(), this.getDaysInMonth());
};
/* Function: getDaysInMonth
	 Get the number of days in the current month, adjusted for leap year.
	 
Returns: 
 {Number} The number of days in the month
 */
Date.prototype.getDaysInMonth = function() {
    Date.daysInMonth[1] = this.isLeapYear() ? 29 : 28;
    return Date.daysInMonth[this.getMonth()];
};

/* Function: getSuffix
	 Get the English ordinal suffix of the current day (equivalent to the format specifier 'S').
	 
Returns: 
 {String} 'st, 'nd', 'rd' or 'th'
 */
Date.prototype.getSuffix = function() {
    switch (this.getDate()) {
        case 1:
        case 21:
        case 31:
            return "st";
        case 2:
        case 22:
            return "nd";
        case 3:
        case 23:
            return "rd";
        default:
            return "th";
    }
};

// private
Date.daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];

/*  
	 An array of textual month names.
	 Override these values for international dates, for example...
	 Date.monthNames = ['JanInYourLang', 'FebInYourLang', ...];
	 @type Array
	 @static
 */
Date.monthNames =
   ["January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"];

/*  
	 An array of textual day names.
	 Override these values for international dates, for example...
	 Date.dayNames = ['SundayInYourLang', 'MondayInYourLang', ...];
	 @type Array
	 @static
 */
Date.dayNames =
   ["Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"];

// private
Date.y2kYear = 50;
// private
Date.monthNumbers = {
    Jan:0,
    Feb:1,
    Mar:2,
    Apr:3,
    May:4,
    Jun:5,
    Jul:6,
    Aug:7,
    Sep:8,
    Oct:9,
    Nov:10,
    Dec:11};

/* Function: clone
	 Creates and returns a new Date instance with the exact same date value as the called instance.
	 Dates are copied and passed by reference, so if a copied date variable is modified later, the original
	 variable will also be changed.  When the intention is to create a new variable that will not
	 modify the original instance, you should create a clone.
	
	 Example of correctly cloning a date:
	 (code)
//wrong way:
var orig = new Date('10/1/2006');
var copy = orig;
copy.setDate(5);
Myna.println(orig);  //returns 'Thu Oct 05 2006'!

//correct way:
var orig = new Date('10/1/2006');
var copy = orig.clone();
copy.setDate(5);
Myna.println(orig);  //returns 'Thu Oct 01 2006'
(end)
	 
Returns: 
 {Date} The new Date instance
 */
Date.prototype.clone = function() {
	return new Date(this.getTime());
};

/* Function: clearTime
	 Clears any time information from this date
 clone - {Boolean}true to create a clone of this date, clear the time and return it
 
Returns: 
 {Date} this or the clone
 */
Date.prototype.clearTime = function(clone){
    if(clone){
        return this.clone().clearTime();
    }
    this.setHours(0);
    this.setMinutes(0);
    this.setSeconds(0);
    this.setMilliseconds(0);
    return this;
};


/*   Date interval constant @static @type String */
Date.MILLI = "ms";
/*   Date interval constant @static @type String */
Date.SECOND = "s";
/*   Date interval constant @static @type String */
Date.MINUTE = "mi";
/*   Date interval constant @static @type String */
Date.HOUR = "h";
/*   Date interval constant @static @type String */
Date.DAY = "d";
/*   Date interval constant @static @type String */
Date.MONTH = "mo";
/*   Date interval constant @static @type String */
Date.YEAR = "y";

/* Function: add
	 Provides a convenient method of performing basic date arithmetic.  This method
	 does not modify the Date instance being called - it creates and returns
	 a new Date instance containing the resulting date value.
	
	 Parameters:
	 interval			-	Either a Date Interval Type (see below) or a time in 
	 						milliseconds to add to this date (see <Date.getInterval>). 
							If this is a negative time, it will be subtracted
	 value				-	*Optional default 0*
							This is only necessary if _interval_ is a Date Interval 
							Type (see below). In that case this the number of units to 
							add. If this is a negative value it will be subtracted 
	 
	Date Interval Types:
		Date.MILLI 	-	"ms"
		Date.SECOND 	-	"s"
		Date.MINUTE 	-	"mi"
		Date.HOUR 	-	"h"
		Date.DAY 		-	"d"
		Date.MONTH	-	"mo"
		Date.YEAR		-	"y"
		
	Returns: 
		The new Date instance
		
	Examples:
	(code)
	//Basic usage:
	var dt = new Date('10/29/2006').add(Date.DAY, 5);
	Myna.println(dt); //returns 'Fri Oct 06 2006 00:00:00'
	
	//can also use string codes:
	var dt = new Date('10/29/2006').add("d", 5);
	Myna.println(dt); //returns 'Fri Oct 06 2006 00:00:00'
	
	//Or use an interval for applying to multiple dates
	var interval = Date.getInterval("d",7) //one week
	//add a week to all the dates in the 'preDefinedDates' array
	var modifiedDates =preDefinedDates.map(function(date){
		return date.add(interval);
	})
	
	
	//Negative values will subtract correctly:
	var dt2 = new Date('10/1/2006').add(Date.DAY, -5);
	Myna.println(dt2); //returns 'Tue Sep 26 2006 00:00:00'
	
	//You can even chain several calls together in one line!
	var dt3 = new Date('10/1/2006').add(Date.DAY, 5).add(Date.HOUR, 8).add(Date.MINUTE, -30);
	Myna.println(dt3); //returns 'Fri Oct 06 2006 07:30:00'
	(end)
 */
Date.prototype.add = function(interval, value){
  var d = this.clone();
  if (!interval || value === 0) return d;
  //if we have a numeric interval
  if (parseInt(interval) == interval) {
	  d.setMilliseconds(this.getMilliseconds() + interval);
	  return d;
  }
  switch(interval.toLowerCase()){
    case Date.MILLI:
      d.setMilliseconds(this.getMilliseconds() + value);
      break;
    case Date.SECOND:
      d.setSeconds(this.getSeconds() + value);
      break;
    case Date.MINUTE:
      d.setMinutes(this.getMinutes() + value);
      break;
    case Date.HOUR:
      d.setHours(this.getHours() + value);
      break;
    case Date.DAY:
      d.setDate(this.getDate() + value);
      break;
    case Date.MONTH:
      var day = this.getDate();
      if(day > 28){
          day = Math.min(day, this.getFirstDateOfMonth().add('mo', value).getLastDateOfMonth().getDate());
      }
      d.setDate(day);
      d.setMonth(this.getMonth() + value);
      break;
    case Date.YEAR:
      d.setFullYear(this.getFullYear() + value);
      break;
  }
  return d;
};
/* Function: getInterval
	 returns a time interval in milliseconds. This can be used with <Date.add>
	 instead of specifying the type and length
	 
	Parameters:
		interval		-	Either a Date Interval Type (see below) or a time in 
							milliseconds to add to this date (see <Date.getInterval>). 
							If this is a negative time, it will be subtracted
		value			-	*Optional default 0*
							This is only necessary if _interval_ is a Date Interval 
							Type (see below). In that case this the number of units to 
							add. If this is a negative value it will be subtracted 
	
	Date Interval Types:
		Date.MILLI 	-	"ms"
		Date.SECOND 	-	"s"
		Date.MINUTE 	-	"mi"
		Date.HOUR 	-	"h"
		Date.DAY 		-	"d"
		Date.MONTH	-	"mo"
		Date.YEAR		-	"y"
	
	Note: 
		* Date.MONTH is always 30 days
		* Date.YEAR is always 365 days
		
	
		
	Example:
	(code)
	var interval = Date.getInterval("d",7) //one week
	//add a week to all the dates in the 'preDefinedDates' array
	var modifiedDates = preDefinedDates.map(function(date){
		return date.add(interval);
	})
	
	(end)
 */
Date.getInterval = function(interval, value){
	if (!interval || !value) return 0;
	switch(interval.toLowerCase()){
	case Date.MILLI:
		return value
	case Date.SECOND:
		return value * 1000;
	case Date.MINUTE:
		return value * 1000 * 60;
	case Date.HOUR:
		return value * 1000 * 60 *60;
	case Date.DAY:
		return value * 1000 * 60 *60 *24;
	case Date.MONTH:
		return value * 1000 * 60 *60 *24*30;
	case Date.YEAR:
		return value * 1000 * 60 *60 *24*365;
	}
  return 0;
};