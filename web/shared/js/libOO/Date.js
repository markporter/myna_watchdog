/*
 * Copyright (C) 2004 Baron Schwartz <baron at sequent dot org>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
*/


/* Class: Date
	This date class adapted from http://code.google.com/p/flexible-js-formatting/. 	

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

Date.parseFunctions = {count:0};
Date.parseRegexes = [];
Date.formatFunctions = {count:0};

Date.prototype.dateFormat = function(format, ignore_offset) {
    if (Date.formatFunctions[format] == null) {
        Date.createNewFormat(format);
    }
    var func = Date.formatFunctions[format];
    if (ignore_offset || ! this.offset) {
      return this[func]();
    } else {
      return (new Date(this.valueOf() - this.offset))[func]();
    }
};
/* Function: format
	 Formats a date given the supplied format string
	 format - {String}The format string
	 
Returns: 
 {String} The formatted date
	 @method
 */
Date.prototype.format =Date.prototype.dateFormat  

Date.createNewFormat = function(format) {
    var funcName = "format" + Date.formatFunctions.count++;
    Date.formatFunctions[format] = funcName;
    var code = "Date.prototype." + funcName + " = function(){return ";
    var special = false;
    var ch = '';
    for (var i = 0; i < format.length; ++i) {
        ch = format.charAt(i);
        if (!special && ch == "\\") {
            special = true;
        }
        else if (special) {
            special = false;
            code += "'" + Date.escape(ch) + "' + ";
        }
        else {
            code += Date.getFormatCode(ch);
        }
    }
    eval(code.substring(0, code.length - 3) + ";}");
};

Date.getFormatCode = function(character) {
    switch (character) {
    case "d":
        return "Date.leftPad(this.getDate(), 2, '0') + ";
    case "D":
        return "Date.dayNames[this.getDay()].substring(0, 3) + ";
    case "j":
        return "this.getDate() + ";
    case "l":
        return "Date.dayNames[this.getDay()] + ";
    case "S":
        return "this.getSuffix() + ";
    case "w":
        return "this.getDay() + ";
    case "z":
        return "this.getDayOfYear() + ";
    case "W":
        return "this.getWeekOfYear() + ";
    case "F":
        return "Date.monthNames[this.getMonth()] + ";
    case "m":
        return "Date.leftPad(this.getMonth() + 1, 2, '0') + ";
    case "M":
        return "Date.monthNames[this.getMonth()].substring(0, 3) + ";
    case "n":
        return "(this.getMonth() + 1) + ";
    case "t":
        return "this.getDaysInMonth() + ";
    case "L":
        return "(this.isLeapYear() ? 1 : 0) + ";
    case "Y":
        return "this.getFullYear() + ";
    case "y":
        return "('' + this.getFullYear()).substring(2, 4) + ";
    case "a":
        return "(this.getHours() < 12 ? 'am' : 'pm') + ";
    case "A":
        return "(this.getHours() < 12 ? 'AM' : 'PM') + ";
    case "g":
        return "((this.getHours() %12) ? this.getHours() % 12 : 12) + ";
    case "G":
        return "this.getHours() + ";
    case "h":
        return "Date.leftPad((this.getHours() %12) ? this.getHours() % 12 : 12, 2, '0') + ";
    case "H":
        return "Date.leftPad(this.getHours(), 2, '0') + ";
    case "i":
        return "Date.leftPad(this.getMinutes(), 2, '0') + ";
    case "s":
        return "Date.leftPad(this.getSeconds(), 2, '0') + ";
    case "O":
        return "this.getGMTOffset() + ";
    case "T":
        return "this.getTimezone() + ";
    case "Z":
        return "(this.getTimezoneOffset() * -60) + ";
    default:
        return "'" + Date.escape(character) + "' + ";
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
    var func = Date.parseFunctions[format];
    return Date[func](input);
};

Date.createParser = function(format) {
    var funcName = "parse" + Date.parseFunctions.count++;
    var regexNum = Date.parseRegexes.length;
    var currentGroup = 1;
    Date.parseFunctions[format] = funcName;

    var code = "Date." + funcName + " = function(input){\n"
        + "var y = -1, m = -1, d = -1, h = -1, i = -1, s = -1, z = 0;\n"
        + "d = new Date();\n"
        + "y = d.getFullYear();\n"
        + "m = d.getMonth();\n"
        + "d = d.getDate();\n"
        + "var results = input.match(Date.parseRegexes[" + regexNum + "]);\n"
        + "if (results && results.length > 0) {" ;
    var regex = "";

    var special = false;
    var ch = '';
    for (var i = 0; i < format.length; ++i) {
        ch = format.charAt(i);
        if (!special && ch == "\\") {
            special = true;
        }
        else if (special) {
            special = false;
            regex += Date.escape(ch);
        }
        else {
            var obj = Date.formatCodeToRegex(ch, currentGroup);
            currentGroup += obj.g;
            regex += obj.s;
            if (obj.g && obj.c) {
                code += obj.c;
            }
        }
    }

    code += "if (y > 0 && m >= 0 && d > 0 && h >= 0 && i >= 0 && s >= 0)\n"
        + "{return new Date(y, m, d, h, i, s).applyOffset(z);}\n"
        + "else if (y > 0 && m >= 0 && d > 0 && h >= 0 && i >= 0)\n"
        + "{return new Date(y, m, d, h, i).applyOffset(z);}\n"
        + "else if (y > 0 && m >= 0 && d > 0 && h >= 0)\n"
        + "{return new Date(y, m, d, h).applyOffset(z);}\n"
        + "else if (y > 0 && m >= 0 && d > 0)\n"
        + "{return new Date(y, m, d).applyOffset(z);}\n"
        + "else if (y > 0 && m >= 0)\n"
        + "{return new Date(y, m).applyOffset(z);}\n"
        + "else if (y > 0)\n"
        + "{return new Date(y).applyOffset(z);}\n"
        + "}return null;}";

    Date.parseRegexes[regexNum] = new RegExp("^" + regex + "$");
    eval(code);
};

Date.formatCodeToRegex = function(character, currentGroup) {
    switch (character) {
    case "D":
        return {g:0,
        c:null,
        s:"(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)"};
    case "j":
    case "d":
        return {g:1,
            c:"d = parseInt(results[" + currentGroup + "], 10);\n",
            s:"(\\d{1,2})"};
    case "l":
        return {g:0,
            c:null,
            s:"(?:" + Date.dayNames.join("|") + ")"};
    case "S":
        return {g:0,
            c:null,
            s:"(?:st|nd|rd|th)"};
    case "w":
        return {g:0,
            c:null,
            s:"\\d"};
    case "z":
        return {g:0,
            c:null,
            s:"(?:\\d{1,3})"};
    case "W":
        return {g:0,
            c:null,
            s:"(?:\\d{2})"};
    case "F":
        return {g:1,
            c:"m = parseInt(Date.monthNumbers[results[" + currentGroup + "].substring(0, 3)], 10);\n",
            s:"(" + Date.monthNames.join("|") + ")"};
    case "M":
        return {g:1,
            c:"m = parseInt(Date.monthNumbers[results[" + currentGroup + "]], 10);\n",
            s:"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"};
    case "n":
    case "m":
        return {g:1,
            c:"m = parseInt(results[" + currentGroup + "], 10) - 1;\n",
            s:"(\\d{1,2})"};
    case "t":
        return {g:0,
            c:null,
            s:"\\d{1,2}"};
    case "L":
        return {g:0,
            c:null,
            s:"(?:1|0)"};
    case "Y":
        return {g:1,
            c:"y = parseInt(results[" + currentGroup + "], 10);\n",
            s:"(\\d{4})"};
    case "y":
        return {g:1,
            c:"var ty = parseInt(results[" + currentGroup + "], 10);\n"
                + "y = ty > Date.y2kYear ? 1900 + ty : 2000 + ty;\n",
            s:"(\\d{1,2})"};
    case "a":
        return {g:1,
            c:"if (results[" + currentGroup + "] == 'am') {\n"
                + "if (h == 12) { h = 0; }\n"
                + "} else { if (h < 12) { h += 12; }}",
            s:"(am|pm)"};
    case "A":
        return {g:1,
            c:"if (results[" + currentGroup + "] == 'AM') {\n"
                + "if (h == 12) { h = 0; }\n"
                + "} else { if (h < 12) { h += 12; }}",
            s:"(AM|PM)"};
    case "g":
    case "G":
    case "h":
    case "H":
        return {g:1,
            c:"h = parseInt(results[" + currentGroup + "], 10);\n",
            s:"(\\d{1,2})"};
    case "i":
        return {g:1,
            c:"i = parseInt(results[" + currentGroup + "], 10);\n",
            s:"(\\d{2})"};
    case "s":
        return {g:1,
            c:"s = parseInt(results[" + currentGroup + "], 10);\n",
            s:"(\\d{2})"};
    case "O":
    case "P":
        return {g:1,
            c:"z = Date.parseOffset(results[" + currentGroup + "], 10);\n",
            s:"(Z|[+-]\\d{2}:?\\d{2})"}; // "Z", "+05:00", "+0500" all acceptable.
    case "T":
        return {g:0,
            c:null,
            s:"[A-Z]{3}"};
    case "Z":
        return {g:1,
            c:"s = parseInt(results[" + currentGroup + "], 10);\n",
            s:"([+-]\\d{1,5})"};
    default:
        return {g:0,
            c:null,
            s:Date.escape(character)};
    }
};


Date.parseOffset = function(str) {
  if (str == "Z") { return 0 ; } // UTC, no offset.
  var seconds ;
  seconds = parseInt(str[0] + str[1] + str[2]) * 3600 ; // e.g., "+05" or "-08"
  if (str[3] == ":") {            // "+HH:MM" is preferred iso8601 format ("O")
    seconds += parseInt(str[4] + str[5]) * 60;
  } else {                      // "+HHMM" is frequently used, though. ("P")
    seconds += parseInt(str[3] + str[4]) * 60;
  }
  return seconds ;
};

// convert the parsed date into UTC, but store the offset so we can optionally use it in dateFormat()
Date.prototype.applyOffset = function(offset_seconds) {
  this.offset = offset_seconds * 1000 ;
  this.setTime(this.valueOf() + this.offset);
  return this ;
};
/* function: getTimezone
	 Get the timezone abbreviation of the current date (equivalent to the format specifier 'T').
	 
Returns: 
 {String} The abbreviated timezone name (e.g. 'CST')
 */
Date.prototype.getTimezone = function() {
    return this.toString().replace(
        /^.*? ([A-Z]{3}) [0-9]{4}.*$/, "$1").replace(
        /^.*?\(([A-Z])[a-z]+ ([A-Z])[a-z]+ ([A-Z])[a-z]+\)$/, "$1$2$3").replace(
        /^.*?[0-9]{4} \(([A-Z]{3})\)/, "$1");
};

/* Function: getGMTOffset
	 Get the offset from GMT of the current date (equivalent to the format specifier 'O').
	 
Returns: 
 {String} The 4-character offset string prefixed with + or - (e.g. '-0600')
 */
Date.prototype.getGMTOffset = function() {
    return (this.getTimezoneOffset() > 0 ? "-" : "+")
        + Date.leftPad(Math.floor(this.getTimezoneOffset() / 60), 2, "0")
        + Date.leftPad(this.getTimezoneOffset() % 60, 2, "0");
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
    document.write(then);
    return Date.leftPad(((now - then) / 7) + 1, 2, "0");
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

Date.escape = function(string) {
    return string.replace(/('|\\)/g, "\\$1");
};

Date.leftPad = function (val, size, ch) {
    var result = new String(val);
    if (ch == null) {
        ch = " ";
    }
    while (result.length < size) {
        result = ch + result;
    }
    return result;
};

Date.daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
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
Date.dayNames =
   ["Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"];
Date.y2kYear = 50;
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
Date.patterns = {
    ISO8601LongPattern: "Y\\-m\\-d\\TH\\:i\\:sO",
    ISO8601ShortPattern: "Y\\-m\\-d",
    ShortDatePattern: "n/j/Y",
    LongDatePattern: "l, F d, Y",
    FullDateTimePattern: "l, F d, Y g:i:s A",
    MonthDayPattern: "F d",
    ShortTimePattern: "g:i A",
    LongTimePattern: "g:i:s A",
    SortableDateTimePattern: "Y-m-d\\TH:i:s",
    UniversalSortableDateTimePattern: "Y-m-d H:i:sO",
    YearMonthPattern: "F, Y"};

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
      d.setMonth(this.getMonth() + value,1);

      if(day > 28){
          var thisDay = this.clone()
          thisDay.setMonth(this.getMonth() + value,1)
        
          day = Math.min(day, d.getDaysInMonth());
      }
      d.setDate(day);
      
      break;
    case Date.YEAR:
      d.setFullYear(this.getFullYear() + value);
      break;
  }
  return d;
};
	 
/*
 * Copyright (C) 2009 Mark Porter <mark@porterpeople.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
*/


/* Function: diff
	 returns returns the time between two date objects
	 
	 Parameters:
		d1		-	First date if less than _d2_ result will be positive
		d2		-	Second date
		scale	-	*Optional, default Date.MILLI*
					The result will be divided by this interval to produce 
					a result in this scale
					
	 Example:
	 (code)
		//return the difference in the d1 and d2 to the nearest week
		Myna.println("Age: " + Math.round(Date.diff(create_date,new Date(),Date.WEEK)) );
		
	 (end)
 */
Date.diff=function(d1,d2,scale){
	if (!scale) scale = Date.MILLI
	return (d2.getTime() -d1.getTime())/Date.getInterval(scale) 
};
/* Function: getInterval
	 returns a time interval in milliseconds. This can be used with <Date.add>
	 instead of specifying the type and length
	 
	Parameters:
		interval		-	Either a Date Interval Type (see below) or a time in 
							milliseconds to add to this date (see <Date.getInterval>). 
							If this is a negative time, it will be subtracted
		count			-	*Optional default 1*
							Number of _interval_ values to return 
	
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
Date.getInterval = function(interval, count){
	if (!count) count=1;
	if (!interval) return 0;
	switch(interval.toLowerCase()){
	case Date.MILLI:
		return count
	case Date.SECOND:
		return count * 1000;
	case Date.MINUTE:
		return count * 1000 * 60;
	case Date.HOUR:
		return count * 1000 * 60 *60;
	case Date.DAY:
		return count * 1000 * 60 *60 *24;
	case Date.MONTH:
		return count * 1000 * 60 *60 *24*30;
	case Date.YEAR:
		return count * 1000 * 60 *60 *24*365;
	}
  return 0;
};
/* Function: parseInterval
	 returns an object with a breakdown of the units in an interval  
	 
	Parameters:
		interval		-	an interval in milliseconds to format
		
	returned object properties:
	* milliSeconds
	* seconds
	* minutes
	* hours
	* days
	* weeks
	* years	
	
 */
Date.parseInterval = function(interval){
	
	var second = 1000;
	var minute = second*60;
	var hour = minute*60;
	var day = hour*24;
	var week = day*7;
	var year = day*365;
	var result={}
	
	result.years = Math.floor(interval/year);
	interval = interval % year;
	
	result.weeks = Math.floor(interval/week);
	interval = interval % week;
	
	
	result.days = Math.floor(interval/day);
	interval = interval % day;
	
	result.hours = Math.floor(interval/hour);
	interval = interval % hour;
	
	result.minutes = Math.floor(interval/minute);
	interval = interval % minute;
	
	result.seconds = Math.floor(interval/second);
	interval = interval % second;
	
	result.milliseconds = interval;
	
	return result
} 
/* Function: formatInterval
	 returns an interval in milliseconds as human readable string.
	 
	Parameters:
		interval		-	an interval in milliseconds to format
		options			-	formating options, see *Options* below
	
	Options:
		precision 		-	*Optional, default Date.MILLI*
							Level of precision to use. This defines the smallest 
							unit to be returned
		scale			-	*Optional, default null*
							Integer. If defined, this is the number of places 
							from the left to return. This will ignore empty 
							places if _removeEmpty_ is true
		removeEmpty		-	*Optional, default true*
							Boolean. if true, 0 valuse will be stripped from the 
							result.
		sep				-	*Optional, default ', '*
							String. Separator to use between time parts
		style			-	*Optional, default 'long'*
							Output style. See *Styles* below
							
	Styles:
		long		-	Example: 1 year, 1 week, 4 days, 10 hours, 8 minutes, 3 seconds, 667 milliseconds
		short		-	Example: 1y, 1w, 4d, 10h, 8m, 31s, 125ms
		none		-	Example: 1, 1, 4, 10, 9, 1, 642
		
	Example:
	(code)
		var interval = new Date().getTime() - new Date().add(Date.DAY,-376).clearTime()
		
		Myna.println(Date.formatInterval(interval))
		//prints: 1 year, 1 week, 4 days, 10 hours, 11 minutes, 17 seconds, 332 milliseconds
		
		Myna.println(Date.formatInterval(interval,{
			precision: Date.SECOND,
			scale:2,
			removeEmpty:false,
			sep:":",
			style:"none" 
		}))
		//prints (year:weeks): 1:1
		
	(end)
 */
Date.formatInterval = function(interval,options){
	if (!options) options={}
	ObjectLib.setDefaultProperties(options,{
		precision: Date.MILLI,
		scale:null,
		removeEmpty:true,
		sep:", ",
		style:"long"
	})
	 
		
	interval = Math.floor(interval/Date.getInterval(options.precision))
				* Date.getInterval(options.precision);
	
	var result=[]
	
	var parts={}
	
	var parts = Date.parseInterval(interval)
	
	$O(parts)
	.filter(function(v,k,i){
		return v || !options.removeEmpty
	})
	.filter(function(v,k,i){
		return !options.scale || i < options.scale
	})
	.forEach(function(v,k,i){
		switch (options.style){
		case "none":
			result.push(v);
			break;
		case "short":
			result.push("{0}{1}".format(
				v,
				k=="milliseconds"?"ms":k.left(1)
			))
			break;
		case "long":
		default:
			result.push("{0} {1}".format(
				v,
				v==0 ||v > 1?k:k.before(1)
			))
			break;
		
		}
	})
	return result.join(options.sep)
	
	
};
/* Function: monthsBetween
	 [static] returns the number of whole calendar months between two dates   
	 
	Parameters:
		d1		-	first date
		d2		-	second date
		
	Note:
		if d1 > d2 the answer will be negative
	
 */
Date.monthsBetween = function(d1,d2){
	var coefficient=1
	if (d1 > d2) {
		[d1,d2] =[d2,d1];
		coefficient=-1
	}
	var count =0
	Myna.println(d1.getMonth()+" < "+d2.getMonth())
	while (d1.getYear() < d2.getYear()){
		d1 = d1.add("y",1)
		count+=12
	}
	while (d1.getMonth() < d2.getMonth()){
		d1 = d1.add("mo",1)
		count++
	}
	return coefficient *count;
}

Date.prototype.toJSON=function(){
	return '\/Date(' +this.getTime() +')\/'
}