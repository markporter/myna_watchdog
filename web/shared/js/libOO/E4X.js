/* Class: XML
	Rhino's E4X object
	
	ECMAScript for XML (E4X) is a programming language extension that adds native 
	XML support to JavaScript. It does this by providing access to the XML 
	document in a form that feels natural for ECMAScript programmers. The goal is 
	to provide an alternative, simpler syntax for accessing XML documents than 
	via DOM interfaces.

	See:
		* E4X Quickstart: http://wso2.org/project/mashup/0.2/docs/e4xquickstart.html
		* <Constructing XML>
		* <Accessing Nodes>
		* <Working With Namespaces>
		* <Common Issues>
		
	Myna Functions:
		* <String.toXml>
		* <Myna.HttpConnection.getResponseXml>
		* <Myna.xmlToObject>
	
	References:
		* https://developer.mozilla.org/en/E4X
		* https://developer.mozilla.org/En/E4X/Processing_XML_with_E4X
		* https://developer.mozilla.org/en/E4X_Tutorial
		* http://www.ecma-international.org/publications/standards/Ecma-357.htm
	
	*/

/* Topic: Constructing XML
	Methods for constructing an XML object
	
	
	*Implicit:* just inline some XML
	(code)
		var people = <people>
			<person>
				<name>bob</name>
			<person>
		</people>
	(end)
	
	You can also insert values into inline XML
	(code)
		var name ="bob"
		var kid = <kid>
			<name>Joe</name>
		</kid>
		var people = <people>
			<person>
				<name>{name}</name>
				<kids>{kid}</kids>
			<person>
		</people>
	(end)
	
	*URL:* load form a URL
	(code)
		var con = new Myna.HttpConnection({
			  url:'http://code.google.com/feeds/p/myna/updates/basic'
		}).connect();
		var xml=con.getResponseXml()
	(end)
	
	*String:* compile from a string
	(code)
		var xml = new Myna.File("path/to/file.xml").readString().toXml()
	(end)
	
	See Also:
		* <String.toXml>
		* <Myna.HttpConnection.getResponseXml>
		* <Myna.xmlToObject>
	*/

/* Topic: Accessing Nodes
	how to work with XML content
	
	(code)
		var c = <customer number="1721">
			 <name>
				  <first>John</first>
				  <last>Smith</last>
			 </name>
			 <phone type="mobile">888-555-1212</phone>
			 <phone type="office">888-555-2121</phone>
		</customer> ;
		var name = c.name.first + " " + c.name.last;
		var num = c.@number;
		var firstphone = c.phone[0];
	(end)
	
	(code)
		var person = <person>
		  <name>Bob Smith</name>
		  <likes>
			<os>Linux</os>
			<browser>Firefox</browser>
			<language>JavaScript</language>
			<language>Python</language>
		  </likes>
		</person>;
		 
		Myna.println(person.name); // Bob Smith
		Myna.println(person['name']); // Bob Smith
		Myna.println(person.likes.browser); // Firefox
		Myna.println(person['likes'].browser); // Firefox
		
		//a special construct is needed for looping over E4X XMLLists
		
		for each(var lang in person.language){
			Myna.println(lang)
		}
		
		//As a convenience, <Array.parse> understands XMLLists so you can use this 
		alternative:
		
		Array.parse(person.language).forEach(function(lang){
			Myna.println(lang);
		})
		
	(end)
	
	See:
		* https://developer.mozilla.org/En/E4X/Processing_XML_with_E4X
		* https://developer.mozilla.org/en/E4X_Tutorial/Accessing_XML_children
		* https://developer.mozilla.org/en/E4X_Tutorial/Descendants_and_Filters

	*/

/* Topic: Working With Namespaces 
		
	Namespaces can be defined via new Namespace("uri"). Tags can be referenced by 
	namespace by prepending nsInstance:: in front of the tag name like so:
	
	(code)
		var con = new Myna.HttpConnection({
			  url:'http://code.google.com/feeds/p/myna/updates/basic'
		})
		
		con.connect()
		var feed=con.getResponseXml()
		var atom = new Namespace("http://www.w3.org/2005/Atom")
		
		Myna.println("Feed title: " + feed.atom::title)
	(end)
	
	Wildcard Namespace:
		You can use "*" as a wildcard Namespace like so:
		
		(code)
			Myna.println("Feed title: " + feed.*::title)
		(end)
		
	Setting Default Namespace: 
		If all, or most, of your your elements us the same namespace, you can set 
		that as the current default.
		
		(code)
			default xml namespace = new Namespace("http://www.w3.org/2005/Atom")
			
			Myna.println("Feed title: " + feed.title)
			
		(end)
	
	Reading Namespace from an element:
		To extract the NS URI from an element use namespace()
		
		(code)
			default xml namespace = feed.namespace()
		(end)
	
	Multiple Namespaces:	
	
		When working with XML comprising multiple namespaces, such as SOAP packets, 
		it is best to pre-define those namespaces and use them like so:
		
		(code)
			var mynasoap 	= new Namespace("mynasoap","http://myna.emptybrain.info/xml-soap");
			var mynarpc 	= new Namespace("mynarpc","http://rpc.xml.myna");
			var impl 		= new Namespace("impl","http://DefaultNamespace");
			var wsdl 		= new Namespace("wsdl","http://schemas.xmlsoap.org/wsdl/");
			var wsdlsoap 	= new Namespace("wsdlsoap","http://schemas.xmlsoap.org/wsdl/soap/");
			var soapenc 	= new Namespace("soapenc","http://schemas.xmlsoap.org/soap/encoding/");
			var soapenv 	= new Namespace("soapenv","http://schemas.xmlsoap.org/soap/envelope/");
			var xsd 		= new Namespace("xsd","http://www.w3.org/2001/XMLSchema");
			var xsi		= new Namespace("xsi","http://www.w3.org/2001/XMLSchema-instance");
			
			var response =
				<soapenv:Envelope
					xmlns:mynasoap={mynasoap}
					xmlns:xsi={xsi}
					xmlns:soapenv={soapenv}
					xmlns:impl={impl}
					s:encodingStyle={soapenc}
				>  
					<soapenv:Body><impl:{"Response"} /></soapenv:Body>
				</soapenv:Envelope>
		(end)
	
	See:
		* https://developer.mozilla.org/en/E4X_Tutorial/Namespaces

	*/

/* Topic: Common Issues
	Common issues with XML objects:
	
	The <?xml ?> tag:
		There is a known bug in Rhino that E4X cannot parse XML content that 
		includes this header. <String.toXml> and <Myna.HttpConnection.getResponseXml>
		contain workarounds for this issue, so using on of those methods is 
		recommended vs. "new XML(string)" 
		
		See: https://bugzilla.mozilla.org/show_bug.cgi?id=336551
		
	Default Namespace:
		The default namespace is none. This means that if you load XML that 
		contains a namespace, such as an ATOM feed, then you will not be able to 
		refer to individual items by tag name. Here are some workarounds
		
		(code)
			var feed = <feed xmlns="http://www.w3.org/2005/Atom">
				 <updated>2010-12-08T21:52:20Z</updated>
				 <id>http://code.google.com/feeds/p/myna/updates/basic</id>
				 <title>myna project updates - Google Code</title>
			</feed>
 
			Myna.println("title=" + feed.title); //prints title=
			
			//use wildcard namespace
			Myna.println("title=" +feed.*::title); //prints title=myna project updates - Google Code
			
			//set default namespace to the ns of the top level element 
			default xml namespace = feed.namespace();
			Myna.println("title=" +feed.title); //prints title=myna project updates - Google Code
			
		(end)	
	

	*/

/* Property: addNameSpace 

	The addNamespace method adds a namespace declaration to the in scope 
	namespaces for this XML object and returns this XML object. If the in scope 
	namespaces for the XML object already contains a namespace with a prefix 
	matching that of the given parameter, the prefix of the existing namespace 
	is set to undefined.
	
	
	*/

/* Function: appendChild
	 Adds child as a new child of the element, after all other children.

	Parameters:
		child	-	XMLNode to append

	*/

/* Function: attribute
	 Returns the attribute of with the requested name.

	Parameters:
		attributeName - attribute to return

	*/

/* Function: attributes
	 Returns the attributes of this element.
	*/

/* Function: child
	 Returns the child element with the given tag name, or if _propertyName_ is 
	 an integer, returns the child in that position.

	Parameters:
		propertyName	-	tag name or ordinal position of child element to return	

	*/

/* Function: childIndex
	 Returns the index of this element among its siblings.
	*/

/* Function: children
	 Returns an XMLNodeList all the children of this object.
	*/

/* Function: comments
	 Returns all the comments that are children of this XML object.
	*/


/* Function: copy
	 Returns a deep copy of the element. The parent property of the copy will be 
	 set to null.
	*/

/* Function: descendants
	 Returns the descendant elements (children, grandchildren, etc.). If a name 
	 is provided, only elements with that name are returned.

	Parameters:
		name	-	*Optional, default all*
					tagname to filter descendants.

	*/

/* Function: elements
	 Returns the direct child elements (not grandchildren). If a name is provided, 
	 only elements with that tag name are returned.

	Parameters:
		name	-	*Optional, default all*
					tagname to filter descendants.

	*/

/* Function: hasComplexContent
	 Returns true for elements with child elements, otherwise false.

	*/
	
/* Function: hasSimpleContent
	 Returns true for attributes, text nodes, or elements without child elements, otherwise false.

	*/

/* Function: inScopeNamespaces
	 Returns an array of Namespace objects representing the namespaces in scope for this object.
	*/

/* Function: insertChildAfter
	 Inserts child2 immediately after child1 in the XML object's children list.

	Parameters:
		child1	- existing child element
		child2	-	new element to be inserted

	*/

/* Function: insertChildBefore
	 Inserts child2 immediately prior to child1 in the XML object's children list.

	Parameters:
		child1	- existing child element
		child2	-	new element to be inserted

	*/

/* Function: length
	 Returns 1 for XML objects (allowing an XML object to be treated like an XML 
	 List with a single item.)
	*/
/* Function localName
	Returns the local (tag)name of this object.
	*/

/* Function: name
	 Returns the qualified name of this object.

	*/

/* Function: namespace
	 Returns the namespace associated with this object, or if a prefix is 
	 specified, an in-scope namespace with that prefix.

	Parameters:
		prefix	-	namespace alias 

	*/

/* Function: namespaceDeclarations
	 An array of Namespace objects representing the namespace declarations associated with this object.
	*/

/* Function: nodeKind
	 A string representing the kind of object this is (e.g. "element").
	*/

/* Function: normalize
	 Merge adjacent text nodes and eliminate empty ones.
	*/

/* Function: parent
	 The parent of this object. For an XML List object, this returns undefined unless all the items of the list have the same parent.
	*/

/* Function: processingInstructions
	 A list of all processing instructions that are children of this element. If 
	 a name is provided, only processing instructions matching this name will be 
	 returned.

	Parameters:
		name	-	tag name for filtering

	*/

/* Function: prependChild
	 Add a new child to an element, prior to all other children.

	Parameters:
		value	-	new element to add to this node

	*/

/* Function: removeNamespace
	 Removes a namespace from the in-scope namespaces of the element.

	Parameters:
		namespace	-	Namespace to remove

	*/

/* Function: replace
	 Replace a child with a new one.

	Parameters:
		propertyName	-	tagname or or ordinal position of element to replace, 
		value				-	new element to insert

	*/

/* Function: setChildren
	 Replace the children of the object with the value (typically an XML List).

	Parameters:
		value	-	XMList of child elements to replace current children 

	*/

/* Function: setLocalName
	 Sets the local name of the XML object to the requested value.

	Parameters:
		name	-	new tag name for the element

	*/

/* Function: setName
	 Sets the name of the XML object to the requested value (possibly qualified).

	Parameters:
		name	-	new tag name for the element 

	*/

/* Function: setNamespace
	 Sets the namespace of the XML object to the requested value.

	Parameters:
		ns	-	Namespace object to set

	*/

/* Function: text
	 Concatenation of all text node children.
	*/

/* Function: toString
	 For elements without element children, returns the values of the text node 
	 children. For elements with element children, returns same as toXMLString. 
	 For other kinds of objects, the value of the object.
	*/

/* Function: toXMLString
	 Serializes this XML object as parseable XML.
	*/

