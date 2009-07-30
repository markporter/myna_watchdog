/* Class: Myna.JavaUtils
	Collection of static functions for working with Java objects
	
	
 */
 
if (!Myna) var Myna={}
if (!("JavaUtils" in Myna)) Myna.JavaUtils={}
/* Function: beanToObject 
	Attempts to convert a JavaBean in to JavaScript object 
	 
	Parameters: 
		bean - Java object to convert  
 
	Returns: 
		JavaScript Object 
		
	Detail: 
		This function examines _bean_ and looks for functions that start with "get" 
		followed by at least one other character. These functions are executed and 
		their values are returned as a Javascript object where the property names 
		are the get functions minus the "get" and the following character lower cased. 
		Functions that start with "is" are treated similarly, except the "is" is kept 
		in the proerty name
		
		(code)
		*EXAMPLE*
		
		this class...
		
		public class PersonBean implements java.io.Serializable {
			private name="bob";
			private deceased=true;
			...
			public String getName() {
				return this.name;
			}
			
			public boolean isDeceased() {
				return this.deceased;
			}
		}
		
		would become...
		
		{
			name:"bob",
			isDeceased:true
		}
		(end)
	 
	*/
	Myna.JavaUtils.beanToObject=function(bean){
		var 
			result={}, // object with get properties
			property,	// 
			x;		// loop counter
			
		for (x in bean){
			if (/^get./.test(x)){
				try{ 
					property=x.replace(/^get/,"");
					property=property.substr(0,1).toLowerCase() + property.substr(1);
					result[property] = bean[x]();
					if (result[property] instanceof java.lang.String){
						result[property] = result[property];
					}
					
				}catch(e){} 
			}
			if (/^is./.test(x)){
				try{ 
					property=x.replace(/^is/,"");
					property=property.substr(0,1).toLowerCase() + property.substr(1);
					result[property] = bean[x]();
					if (result[property] instanceof java.lang.String){
						result[property] = Boolean(result[property]);
					}
					
				}catch(e){} 
			}
		}
		return result;
	}
/* Function: createSyncFunction 
	returns a thread-safe version of a javascript function  
	 
	Parameters: 
		functionObject - JavaScript Function object to synchronize 
 
	Returns: 
		a thread-safe version _functionObject_, similar to synchronized 
		keyword for Java functions
	 
	 
	*/
	Myna.JavaUtils.createSyncFunction=function(functionObject){	
		return new Packages.org.mozilla.javascript.Synchronizer(functionObject)
	}
/* Function: createByteArray 
	returns a java Byte array of the supplied size 
		
	Paramters:
		size	-	initial size of array
		
	Detail: 
		When working with binary data or streams it is often necessary to pass 
		a Byte array to java functions as a buffer. This function will create 
		this buffer for you 
	*/
	Myna.JavaUtils.createByteArray=function(size){
		return new java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE,size);	
	}
/* Function: createClassArray 
	returns a java Byte array of the supplied size 
		
	Paramters:
        className     - full classname to instantiate, e.g. java.lang.String   
		size	      -	initial size of array
		
	Detail: 
		creates an array of a particular class 
	*/
	Myna.JavaUtils.createClassArray=function(className,size){
        var type = className.split(/\./).reduce(function(current,subName){
            return current[subName];
        },Packages)
        if ("TYPE" in type){
            return new java.lang.reflect.Array.newInstance(type.TYPE,size);
        } else {
             return new java.lang.reflect.Array.newInstance(type,size);
        }
	}    
/* Function: createCharArray 
	returns a java Character array of the supplied size 
		
	Detail: 
		When working with striong data or streams it is often necessary to pass 
		a Character array to java functions as a buffer. This function will 
		create this buffer for you 
	*/
	Myna.JavaUtils.createCharArray=function(size){
		return new java.lang.reflect.Array.newInstance(java.lang.Character.TYPE,size);	
	}

/* Function: enumToArray 
	Converts a Java enumeration into a JavaScript Array.
		
	Parameters: 
		enumeration - Java enumeration to iterate over
 
	Returns: 
		JS Array object
		
	*/
	Myna.JavaUtils.enumToArray=function(enumeration){
		var element,
			result=[];
		while (enumeration.hasMoreElements()) {
			element = enumeration.nextElement()
			result.push(element);
			
		}
		return result;
	}
	

/* Function: mapToObject 
	returns a Java Map as a JavaScript Object
	 
	Parameters: 
		map - Java Map (or subclass/implementation) 
 
	Returns: 
	 	a Java Map as a JavaScript Object
		
	Detail: 
		This function loops through all of the entries in the map and
		creates a property on the returned object for each key and sets
		it equal to the entry's value.
	 
	*/
	Myna.JavaUtils.mapToObject=function(map){
		var keyValueArray = map.entrySet().toArray();
		var result={}
		for (var x=0; x < keyValueArray.length; ++x){
			var property = keyValueArray[x].getKey();
			result[property] = keyValueArray[x].getValue();
			if (result[property] instanceof java.lang.String){
				result[property] = String(result[property]);
			}
		}
		return result;
	}
/* Function: readerToString 
	returns a JavaScript String containing the entire contents off the supplied 
	Java Reader.
	 
	Parameters: 
		reader - Java Reader (or subclass/implementation)
		
	*/
	Myna.JavaUtils.readerToString=function(reader){
		var IOUtils = Packages.org.apache.commons.io.IOUtils;
		var javaString = java.lang.String;
		var charArray = IOUtils.toCharArray(reader);
		return String(new javaString(charArray));
	}
/* Function: streamToString 
	returns a JavaScript String containing the entire contents off the supplied 
	Java InputStream.
	 
	Parameters: 
		stream - Java InputStream (or subclass/implementation) 
	 
	*/
	Myna.JavaUtils.streamToString=function(stream){
		var IOUtils = Packages.org.apache.commons.io.IOUtils;
		var javaString = java.lang.String;
		var charArray = IOUtils.toCharArray(stream);
		return String(new javaString(charArray));
	}
/* Function: streamToByteArray 
	returns a Java  byte[] containing the entire contents off the supplied 
	Java InputStream.
	 
	Parameters: 
		stream - Java InputStream (or subclass/implementation) 
	*/
	Myna.JavaUtils.streamToByteArray=function(stream){
		var IOUtils = Packages.org.apache.commons.io.IOUtils;
		return IOUtils.toByteArray(stream);
	}
	
/* Function: readerToByteArray 
	returns a Java  byte[] containing the entire contents off the supplied 
	Java Reader.
	 
	Parameters: 
		reader - Java InputStream (or subclass/implementation) 
	*/
	Myna.JavaUtils.readerToByteArray=function(reader){
		var IOUtils = Packages.org.apache.commons.io.IOUtils;
		return IOUtils.toByteArray(reader);
	}	