// WDDX Deserializer for JavaScript
// File: wddxDes.js
// Author: Nate Weiss (nweiss@icesinc.com) 
// Last Updated: 10/1/99
// See www.wddx.org for usage and updates

// Update history
// 10/1/99: Added support for <null> and <binary> elements


///////////////////////////////////////////
// Parses a simple WDDX value            //
// (string, number, dateTime, boolean)   //
// to appropriate Javascript object type //
///////////////////////////////////////////
function wddxDeserializer_parseSimpleType (Contents) { //hi

  // What WDDX-defined simple data type is it?
  var DataType = Contents.name;

  // Simple DataType: BOOLEAN
  if (DataType == 'boolean') {
     return (Contents.attributes["value"]=='true');

  } else {  

    // Value is the value between <string></string> or <number></number>, etc
    var Value = Contents.contents.length > 0 ? Contents.contents[0].value : '';

    // Simple DataType: STRING
    if (DataType == 'string') {
        if (Contents.contents.length > 1) {
          Value = '';
          for (StrItem = 0; StrItem < Contents.contents.length; StrItem++) {
            if (Contents.contents[StrItem].type == 'chardata')
              Value = Value + Contents.contents[StrItem].value;
            else if (Contents.contents[StrItem].name == 'char') {
              Code = Contents.contents[StrItem].attributes["code"];
              if      (Code == '0D') Value = Value + '\r';
              else if (Code == '0C') Value = Value + '\f';
              else if (Code == '0A') Value = Value + '\n';
						else if (Code == '09') Value = Value + '\t';
            }
          }
        }  
        return Value;
    }

    // Simple DataType: NUMBER
    else if (DataType == 'number') {
        return parseFloat(Value);
    }

    // Simple DataType: NULL  //{nmw 10/1/99}
    else if (DataType == 'null') {
      return null;
    }  

    // Simple DataType: DATE
    else if (DataType == 'dateTime') {
        // Split date string into component parts
        Value = splitAny(Value, 'T');
        var dtDateParts = splitAny(Value[0], '-');
        var NewDate;
        

        if ( (Value[1].indexOf('-') == -1) & (Value[1].indexOf('+') == -1) ) {
          // create native JS Date object
          var dtTimeParts = splitAny(Value[1], ':');
          NewDate = new Date(dtDateParts[0], dtDateParts[1]-1, dtDateParts[2], dtTimeParts[0], dtTimeParts[1], dtTimeParts[2]);
          
        } else {  
          
          // There is timezone info for this <dateTime></dateTime> element.
          // Get just the timezone info by getting everything after the "-" or "+"
          if (Value[1].indexOf('-') > -1) dtTimeTZParts = splitAny(Value[1], '-');
            else dtTimeTZParts = splitAny(Value[1], '+');
          dtTimeParts = splitAny(dtTimeTZParts[0], ':');

          // Create a new JS date object (no timezone offsetting has happened yet)
          NewDate = new Date(dtDateParts[0], dtDateParts[1]-1, dtDateParts[2], dtTimeParts[0], dtTimeParts[1], dtTimeParts[2]);

          // If we are supposed to do timezone offsetting
          if (this.useTimezoneInfo == true) {
            var dtTZParts = splitAny(dtTimeTZParts[1], ':');
            var dtOffsetHours = parseInt(dtTZParts[0]);
            var dtOffsetMins =  parseInt(dtTZParts[1]);
            if (Value[1].indexOf('-') > -1) {
              dtOffsetHours = this.timezoneOffsetHours - dtOffsetHours;
              dtOffsetMins  = this.timezoneOffsetMinutes - dtOffsetMins;
            } else {
              dtOffsetHours = this.timezoneOffsetHours + dtOffsetHours;
              dtOffsetMins  = this.timezoneOffsetMinutes + dtOffsetMins;
            }
            NewDate.setHours(NewDate.getHours() - dtOffsetHours);
            NewDate.setMinutes(NewDate.getMinutes() - dtOffsetMins);
          }  
          
        }
        return NewDate;

    }
  }
  return null;
}



///////////////////////////////////////////
// Desearializes WXXX Array by creating  //
// JS Array object & populating it with  //
// Deserialized simple values            //
///////////////////////////////////////////
function wddxDeserializer_parseArray(ArrayAsWDDX) {
  // JSArray is the new Javascript-style array to return
  // ArrayLength is the length of the WDDX-style array to parse
  var JSArray = new Array();
  var ArrayLength = parseInt(ArrayAsWDDX.attributes["length"]);

  // For each element in the WDDX array, set the corresponding
  // Element in the JS array to the WDDX element's parsed value  
  for (var Count = 0; Count < ArrayLength; Count++) { 
    JSArray[Count] = this.parseElement(ArrayAsWDDX.contents[Count]);
  }

  // Return the finished array
  return JSArray;
}



///////////////////////////////////////////
// Desearializes a Structure by creating //
// JS Array object & populating it with  //
// appropriately Deserialized values     //
///////////////////////////////////////////
function wddxDeserializer_parseStruct(StructAsWDDX) {
  // The JavaScript object that we're building right now
  var JSObject;

  // StructLength is the length of the WDDX-style structure to parse
  var StructLength = StructAsWDDX.contents.length;

  // JSObject is the new Javascript-style object to return
  // Call object constructor if a "type" attribute has been provided
  // for this <struct> element; otherwise, call generic Object constructor
  var bCustom = false;
  
  if (typeof(StructAsWDDX.attributes["type"]) == 'string') {
    var ConstructorTest = 'typeof(' +StructAsWDDX.attributes["type"]+ ')';
    if ( eval(ConstructorTest) == 'function' )
      bCustom = true;
  }

  if (bCustom) JSObject = eval('new '+ StructAsWDDX.attributes["type"]);
  else         JSObject = new Object;

  
  // For each element in the WDDX struct, set the corresponding
  // Element in the JS object to the WDDX element's parsed value.
  // StructIndex is the "name" of the stucture element, ie MyStruct["StuctIndex"]
  for (var Count = 0; Count < StructLength; Count++) { 
    var StructIndex = (this.preserveVarCase == true) ? StructAsWDDX.contents[Count].attributes["name"] : (this.varCaseToUpper == true) ? StructAsWDDX.contents[Count].attributes["name"].toUpperCase() : StructAsWDDX.contents[Count].attributes["name"].toLowerCase(); 
    JSObject[StructIndex] = this.parseElement(StructAsWDDX.contents[Count].contents[0]);
  }
  

  // Return the finished object
  return JSObject;
}



///////////////////////////////////////////
// Desearializes a recordset by creating //
// JS WDDXRecordset object & populating  //
// its cells with Deser'd simple values  //
///////////////////////////////////////////
function wddxDeserializer_parseRecordset(RSAsWDDX) {
  // RSInfo is the <recordset>...</recordset> part of the WDDX packet
  // RSCols is an array full of column names
  // RSRows is the number of rows in the recordset
  // ThisRS is an actual WddxRecordset object
  var RSInfo = RSAsWDDX;
  var RSColNames = RSInfo.attributes["fieldNames"].toLowerCase();
  var RSCols = splitAny(RSColNames, ',');
  var RSRows = parseInt(RSInfo.attributes["rowCount"]);
  var ThisRS = new WddxRecordset(RSCols, RSRows);  // Note dependency on external wddx.js source file

  // For each column in the recordset...
  // ThisCol is the current column name (as a string)
  // ColArray is an array of cells for column (going down in rows)
  for (var ColNo = 0; ColNo < RSCols.length; ColNo++) {
    ThisCol = RSCols[ColNo];
    ColArray = new Array();

    // For each row in the column, get value from WDDX packet
    for (var RowNo = 0; RowNo < RSRows; RowNo++) {
      ColArray[RowNo] = this.parseSimpleType(RSInfo.contents[ColNo].contents[RowNo]);
    }

    // Attach array of this column's values to recordset itself
    ThisRS[ThisCol] = ColArray;
  }

  // Return the recordset object
  return ThisRS;
}


///////////////////////////////////////////
// Called by the Deserializer function   //
// Basically decides if this element is  //
// Simple Type or Recordset or Structure //
///////////////////////////////////////////
function wddxDeserializer_parseElement(Element) {

  // WHAT KIND OF ELEMENT IS IT?
    // if it's a recordset
    if (Element.name == 'recordset') {
      return this.parseRecordset(Element);
    }

    // if it's an array
    else if (Element.name == 'array') { 
      return this.parseArray(Element);
    }
    

    // if it's a structure
    else if (Element.name == 'struct') {
      return this.parseStruct(Element);
    }
      
    // if it's a binary //{nmw 10/1/99}
    else if (Element.name == 'binary') {
      var Bin = new WddxBinary;
      Bin.encoding = (typeof(Element.attributes["encoding"]) == 'string') ? Element.attributes["encoding"] : 'base64';  
      
      if (this.preserveBinaryData) {
        Bin.data = (typeof(Element.contents[0].value) == 'string') ? Element.contents[0].value : '';         
      }
        
      return Bin;
    }  
    
    
    // if it's a simple element (string, number, dateTime, boolean)
    //if ((Element.name == 'boolean' || Element.name == 'null') || (Element.contents.length > 0 && Element.contents[0].type == 'chardata')) 
    else { 
      return this.parseSimpleType(Element);
    }
    
    
  // return nothing if none of supported WDDX types were found
  return '';
}



////////////////////////////////////////////
// This function will use the native split()
// function if available, and joinOld if not
////////////////////////////////////////////
function splitAny(String, Sep) {
  if (String.split) SplitArray = String.split(Sep);
  else SplitArray = splitOld(String, Sep);
  
  return SplitArray;
}

////////////////////////////////////////////
// This function will use the native join()
// function if available, and joinOld if not
////////////////////////////////////////////
function joinAny(theArray, Sep) {
  if (theArray.join) JoinedString = theArray.join(Sep);
  else JoinedString = joinOld(theArray, Sep);
  
  return JoinedString;
}


//////////////////////////////////////////////////////
// Main public function to deserialize any object   //
//////////////////////////////////////////////////////
function wddxDeserializer_deserialize(WDDXPacket) {

  // What's our default var case for struct elements?
  this.varCaseToUpper = (this.defaultVarCase.toLowerCase() != 'lower');

  // Set topLevelDatatype property to null by defalt
  this.topLevelDatatype = null;   

  // Calculate hours/minutes for this deserializer's timezoneOffset property
  this.timezoneOffsetHours   = Math.round(this.timezoneOffset/60);
  this.timezoneOffsetMinutes = (this.timezoneOffset % 60);

  // Use external Xparse XML parser to turn WDDX packet into an object structure
  _Xparse_count = 0;                 // "Resets" the Xparse parser
  var XMLRoot = Xparse(WDDXPacket);  // Returns XML object structure  
  WDDXPacket = '';                   // Discards WDDXPacket variable
  
  // FIND THE WDDX <data>..</data> OBJECT WITHIN JS OBJECT-TREE
  // For each element in the XML-object structure...
  // Examine this "leaf" of the XML-object structure
  // If "leaf" is <data>, then parse its first "child"
  for (var item = 0; item < XMLRoot.index.length; item++) {
    var ThisItem = XMLRoot.index[item];
    if (ThisItem.name == 'data') {
      this.topLevelDatatype = ThisItem.contents[0].name;
    
      // Return result to function
      if (this.parseActualData == true) {
        return this.parseElement(ThisItem.contents[0]);
        break;
      }   
    }
  }

  // Return NULL if no data found
  return null;
}



function wddxDeserializer_deserializeUrl(url) {
  var i, pipe, result, packet, posStart, posEnd;
  var tokStart = '<wddxPacket';
  var tokEnd = '</wddxPacket>';
  
  // If URL does not start with "http", 
  // Assume a path based on current folder
  if (url.indexOf('http') != 0) {
    var ThisURL = window.location.href;
    var BaseURL = ThisURL.substring(0, ThisURL.lastIndexOf('/'));
    url = BaseURL + '/' + url;
  }  

  for (i = 0; i < document.applets.length; i++) {

    if ( (typeof document.applets[i].getClass != 'undefined') && (document.applets[i].getClass() == 'class urlPipe') ) {
      pipe = document.applets[i];
      pipe.catchPage = true;

      // add parameters from urlData object-property
      bAdded = false;
      if (typeof(this.urlData) == 'object') {
        for (prop in this.urlData) {
          pipe.addParam( escape(prop.toString()), escape(this.urlData[prop].toString()) );
          bAdded = true;
        }
      }
      // make sure at least one param has been added, or urlPipe may freeze up
      if (bAdded == false) pipe.addParam('dummyParam', 1);

      pipe.post( url );  
      packet = new String(pipe.getPage());
      posStart = packet.indexOf(tokStart);
      posEnd = packet.indexOf(tokEnd, posStart);
//alert(packet);     // uncomment this line to view recieved packet
      if (posEnd > posStart) {
        packet = packet.substring( posStart, (posEnd + tokEnd.length) );      
        result = this.deserialize(packet);
      }
      
      // Reset urlData to emtpy
      this.urlData = new Object;

      break;
    }
  }

  return result;
}




function WddxDeserializer() {
  // By default, do not preserve case of "name" 
  // attributes in <var> tags
  this.preserveVarCase = false;
  this.defaultVarCase  = 'upper';
  
  // By default, don't get the DATA from <binary> elements 
  this.preserveBinaryData = true;
  
  // By default, ignore timezone info
  this.useTimezoneInfo = false;

  // Use current timezone as default when deserializing  
  // (relevant only if useTimezoneInfo gets set to true)  
  var TempDate = new Date;
  this.timezoneOffset = TempDate.getTimezoneOffset();
  
  // Set topLevelDatatype property to null by defalt
  this.topLevelDatatype = null;
  this.parseActualData  = true;

  // urlData should be empty at the outset
  this.urlData = new Object;

  // Add the "helper" (private) deserializer functions
  this.parseElement    = wddxDeserializer_parseElement;
  this.parseSimpleType = wddxDeserializer_parseSimpleType;
  this.parseArray      = wddxDeserializer_parseArray;
  this.parseStruct     = wddxDeserializer_parseStruct;
  this.parseRecordset  = wddxDeserializer_parseRecordset;

  // Add the main (public) deserializer function
  this.deserialize     = wddxDeserializer_deserialize;
  this.deserializeUrl  = wddxDeserializer_deserializeUrl;

  // Set implementation flag      
  this.implementation = 'JS';
}  


// Provide "standalone" WDDXDeserialize function for backwards 
// compatibility with previous versions of the deserializer.
// This function should be considered "depreciated"  
function WDDXDeserialize(Packet) {
  var Deser = new WddxDeserializer;
  return Deser.deserialize(Packet);
}










// ***** The code that follows is known as "Xparse".  It has 
// ***** been slightly modified by Nate Weiss, and included 
// ***** here with permission from Jeremie.  Thanks, Jer! :)   



// Ver .91 Feb 21 1998
//////////////////////////////////////////////////////////////
//
//	Copyright 1998 Jeremie
//	Free for public non-commercial use and modification
//	as long as this header is kept intact and unmodified.
//	Please see http://www.jeremie.com for more information
//	or email jer@jeremie.com with questions/suggestions.
//
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
////////// Simple XML Processing Library //////////////////////
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
////   Fully complies to the XML 1.0 spec 
////   as a well-formed processor, with the
////   exception of full error reporting and
////   the document type declaration(and it's
////   related features, internal entities, etc).
///////////////////////////////////////////////////////////////


//// ***** This file modified by Nate Weiss 10/98 ****


/////////////////////////
//// the object constructors for the hybrid DOM

function _element()
{
	this.type = "element";
	this.name = new String();
	this.attributes = new Array();
	this.contents = new Array();
	this.uid = _Xparse_count++;
	_Xparse_index[this.uid]=this;
}

function _chardata()
{
	this.type = "chardata";
	this.value = new String();
}

function _pi()
{
	this.type = "pi";
	this.value = new String();
}

function _comment()
{
	this.type = "comment";
	this.value = new String();
}

// an internal fragment that is passed between functions
function _frag()
{
	this.str = new String();
	this.ary = new Array();
	this.end = new String();
}

/////////////////////////


// global vars to track element UID's for the index
var _Xparse_count = 0;
var _Xparse_index = new Array();

// Global var which is true if the JS1.1 split() and join() functions are supported by the browser
var _Xparse_isSplitSupported = ('Testing'.split && _Xparse_index.join);
var _Xparse_isFromCharCodeSupported = ('Testing'.fromCharCode == 'function');
//var _Xparse_isSplitSupported = false;

/////////////////////////
//// Main public function that is called to 
//// parse the XML string and return a root element object

function Xparse(src)
{
	var frag = new _frag();

	// remove bad \r characters and the prolog
	frag.str = _prolog(src);

	// create a root element to contain the document
	var root = new _element();
	root.name="ROOT";

	// main recursive function to process the xml
	frag = _compile(frag);

	// all done, lets return the root element + index + document
	root.contents = frag.ary;
	root.index = _Xparse_index;
	_Xparse_index = new Array();
	return root;
}

/////////////////////////


/////////////////////////
//// transforms raw text input into a multilevel array
function _compile(frag)
{
	// keep circling and eating the str
	while(1)
	{
		// when the str is empty, return the fragment
		if(frag.str.length == 0)
		{
			return frag;
		}

		var TagStart = frag.str.indexOf("<");

		if(TagStart != 0)
		{
			// theres a chunk of characters here, store it and go on
			var thisary = frag.ary.length;
			frag.ary[thisary] = new _chardata();
			if(TagStart == -1)
			{
				frag.ary[thisary].value = _entity(frag.str);
				frag.str = "";
			}
			else
			{
				frag.ary[thisary].value = _entity(frag.str.substring(0,TagStart));
				frag.str = frag.str.substring(TagStart,frag.str.length);
			}
		}
		else
		{
			// determine what the next section is, and process it
			if(frag.str.substring(1,2) == "?")
			{
				frag = _tag_pi(frag);
			}
			else
			{
				if(frag.str.substring(1,4) == "!--")
				{
					frag = _tag_comment(frag);
				}
				else
				{
					if(frag.str.substring(1,9) == "![CDATA[")
					{
						frag = _tag_cdata(frag);
					}
					else
					{
						if(frag.str.substring(1,frag.end.length + 3) == "/" + frag.end + ">" || _strip(frag.str.substring(1,frag.end.length + 3)) == "/" + frag.end)
						{
							// found the end of the current tag, end the recursive process and return
							frag.str = frag.str.substring(frag.end.length + 3,frag.str.length);
							frag.end = "";
							return frag;
						}
						else
						{
							frag = _tag_element(frag);
						}
					}
				}
			}

		}
	}
	return "";
}
///////////////////////


///////////////////////
//// functions to process different tags

function _tag_element(frag)
{
	// initialize some temporary variables for manipulating the tag
	var close = frag.str.indexOf(">");
	var empty = (frag.str.substring(close - 1,close) == "/");
	if(empty)
	{
		close -= 1;
	}

	// splitAny up the name and attributes
	var starttag = _normalize(frag.str.substring(1,close));
	var nextspace = starttag.indexOf(" ");
	var attribs = new String();
	var name = new String();
	if(nextspace != -1)
	{
		name = starttag.substring(0,nextspace);
		attribs = starttag.substring(nextspace + 1,starttag.length);
	}
	else
	{
		name = starttag;
	}

	var thisary = frag.ary.length;
	frag.ary[thisary] = new _element();
	frag.ary[thisary].name = _strip(name);
	if(attribs.length > 0)
	{
		frag.ary[thisary].attributes = _attribution(attribs);
	}
	if(!empty)
	{
		// !!!! important, 
		// take the contents of the tag and parse them
		var contents = new _frag();
		contents.str = frag.str.substring(close + 1,frag.str.length);
		contents.end = name;
		contents = _compile(contents);
		frag.ary[thisary].contents = contents.ary;
		frag.str = contents.str;
	}
	else
	{
		frag.str = frag.str.substring(close + 2,frag.str.length);
	}
	return frag;
}

function _tag_pi(frag)
{
	var close = frag.str.indexOf("?>");
	var val = frag.str.substring(2,close);
	var thisary = frag.ary.length;
	frag.ary[thisary] = new _pi();
	frag.ary[thisary].value = val;
	frag.str = frag.str.substring(close + 2,frag.str.length);
	return frag;
}

function _tag_comment(frag)
{
	var close = frag.str.indexOf("-->");
	var val = frag.str.substring(4,close);
	var thisary = frag.ary.length;
	frag.ary[thisary] = new _comment();
	frag.ary[thisary].value = val;
	frag.str = frag.str.substring(close + 3,frag.str.length);
	return frag;
}

function _tag_cdata(frag)
{
	var close = frag.str.indexOf("]]>");
	var val = frag.str.substring(9,close);
	var thisary = frag.ary.length;
	frag.ary[thisary] = new _chardata();
	frag.ary[thisary].value = val;
	frag.str = frag.str.substring(close + 3,frag.str.length);
	return frag;
}

/////////////////////////


//////////////////
//// util for element attribute parsing
//// returns an array of all of the keys = values
function _attribution(str)
{
	var all = new Array();
	while(1)
	{
		var eq = str.indexOf("=");
		if(str.length == 0 || eq == -1)
		{
			return all;
		}

		var id1 = str.indexOf("\'");
		var id2 = str.indexOf("\"");
		var ids = new Number();
		var id = new String();
		if((id1 < id2 && id1 != -1) || id2 == -1)
		{
			ids = id1;
			id = "\'";
		}
		if((id2 < id1 || id1 == -1) && id2 != -1)
		{
			ids = id2;
			id = "\"";
		}
		var nextid = str.indexOf(id,ids + 1);
		var val = str.substring(ids + 1,nextid);

		var name = _strip(str.substring(0,eq));
		all[name] = _entity(val);
		str = str.substring(nextid + 1,str.length);
	}
	return "";
}
////////////////////


//////////////////////
//// util to remove \r characters from input string
//// and return xml string without a prolog
function _prolog(str)
{
	var A = new Array();

  if (_Xparse_isSplitSupported) {
  	A = str.split("\r\n");
  	str = A.join("\n");
  	A = str.split("\r");
  	str = A.join("\n");
  } else {
  	A = splitOld(str, "\r\n");
  	str = joinOld(A, "\n");
  	A = splitOld(str, "\r");
  	str = joinOld(A, "\n");
  }

	var start = str.indexOf("<");
	if(str.substring(start,start + 3) == "<?x" || str.substring(start,start + 3) == "<?X" )
	{
		var close = str.indexOf("?>");
		str = str.substring(close + 2,str.length);
	}
	start = str.indexOf("<!DOCTYPE");
	if(start != -1)
	{
		close = str.indexOf(">",start) + 1;
		var dp = str.indexOf("[",start);
		if(dp < close && dp != -1)
		{
			close = str.indexOf("]>",start) + 2;
		}
		str = str.substring(close,str.length);
	}
	return str;
}
//////////////////


//////////////////////
//// util to remove white characters from input string
function _strip(str)
{
	var A = new Array();

  if (_Xparse_isSplitSupported) {
  	A = str.split("\n");
  	str = A.join("");
  	A = str.split(" ");
  	str = A.join("");
  	A = str.split("\t");
  	str = A.join("");
  } else {
  	A = splitOld(str, "\n");
  	str = joinOld(A, "");
  	A = splitOld(str, " ");
  	str = joinOld(A, "");
  	A = splitOld(str, "\t");
  	str = joinOld(A, "");
  }

	return str;
}
//////////////////


//////////////////////
//// util to replace white characters in input string
function _normalize(str)
{
	var A = new Array();

  if (_Xparse_isSplitSupported) {
  	A = str.split("\n");
  	str = A.join(" ");
  	A = str.split("\t");
  	str = A.join(" ");
  } else {
  	A = splitOld(str, "\n");
  	str = joinOld(A, " ");
  	A = splitOld(str, "\t");
  	str = joinOld(A, " ");
  }
  
  
	return str;
}
//////////////////


//////////////////////
//// util to replace internal entities in input string
function _entity(str)
{
	var A = new Array();

    
  if (_Xparse_isSplitSupported) {
  	A = str.split("&lt;");
  	str = A.join("<");
  	A = str.split("&gt;");
  	str = A.join(">");
  	A = str.split("&quot;");
  	str = A.join("\"");
  	A = str.split("&apos;");
  	str = A.join("\'");
  	A = str.split("&amp;");
  	str = A.join("&");

    // Handle accented characters, etc
    while (str.indexOf('&#') > -1) {
      var pos1 = str.indexOf('&#');
      var pos2 = str.indexOf(';', pos1);
      var ent = str.substring(pos1, pos2+1);
      var charNum = parseInt('0' + ent.substring(2));
      
      if (charNum.valueOf() > 0) {
        if (_Xparse_isFromCharCodeSupported) 
          thisChar = String.fromCharCode(charNum);
        else 
          thisChar = '                                  !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ'.charAt(charNum);
      }
      
      A = str.split(ent);
      str = A.join(thisChar);
    }

  } else {
  	A = splitOld(str, "&lt;");
  	str = joinOld(A, "<");
  	A = splitOld(str, "&gt;");
  	str = joinOld(A, ">");
  	A = splitOld(str, "&quot;");
  	str = joinOld(A, "\"");
  	A = splitOld(str, "&apos;");
  	str = joinOld(A, "\'");
  	A = splitOld(str, "&amp;");
  	str = joinOld(A, "&");
    
    // Handle accented characters, etc
    while (str.indexOf('&#') > -1) {
      pos1 = str.indexOf('&#');
      pos2 = str.indexOf(';', pos1);
      ent = str.substring(pos1, pos2+1);
      charNum = parseInt('0' + ent.substring(2));

      if (charNum.valueOf() > 0) {
        if (_Xparse_isFromCharCodeSupported) 
          thisChar = String.fromCharCode(charNum);
        else 
          thisChar = '                                  !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ'.charAt(charNum);
      }
      
      A = splitOld(str, ent);
      str = joinOld(str, thisChar);
    }    
  }
  
	return str;
}
//////////////////


//////////////////////////////////////////////
// This function emulates the behavior of
// the Javascript 1.1 string.split() function
//////////////////////////////////////////////
function splitOld(String, Sep) {
  var NewArray = new Array;
  var Chunk = String;
  Sep = Sep.substring(0, 1);
  
  while (Chunk.indexOf(Sep) > -1) {
    NextSep = Chunk.indexOf(Sep);
    NewArray[NewArray.length] = Chunk.substring(0, NextSep);
    Chunk = Chunk.substring(NextSep+1);
  }

  NewArray[NewArray.length] = Chunk;  
  return NewArray;
}


////////////////////////////////////////////
// This function emulates the behavior of
// the Javascript 1.1 array.join() function
////////////////////////////////////////////
function joinOld(theArray, Sep) {
  Sep = Sep.substring(0, 1);
  
  if (theArray.length == 0) 
    NewString = '';
  else 
    NewString = theArray[0];
  
  for (var i = 1; i < theArray.length; i++) {
    NewString = NewString + Sep + theArray[i];
  }
  
  return NewString;
}


