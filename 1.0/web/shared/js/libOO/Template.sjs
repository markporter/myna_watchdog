/* Class: Myna.Template
	Create a text template with placeholders that can be merged with data at runtime
	
	Adapted from the Ext library (http://extjs.com)
	
	See <Myna.XTemplate> for more flexible template processing
	
	
	
*/
/*
 * Ext JS Library 2.0
 * Copyright(c) 2006-2007, Ext JS, LLC.
 * licensing@extjs.com
 * 
 * http://extjs.com/license
 */
 
/* Constructor: Template 
	Creates a new template from the supplied string or array of strings
	
	Parameters:
		text*		-	a string or array of strings, or several string 
						arguments that represent the template. See the examples below
						
						
	Examples:
	(code)
		//single string
		var t = new Myna.Template("My name is {name}");
				
		//array of strings
		var t = new Myna.Template([
			"My",
			" name",
			" is ",
			"{name}"
		]);
		
		//several string parameters
		var t = new Myna.Template(
			"My",
			" name",
			" is ",
			"{name}"
		);
	(end)
*/
if (!Myna) var Myna ={}
Myna.Template = function(text){
	if (!text) text='';
    var a = arguments;
    if(text instanceof Array){
        text = text.join("");
    }else if(a.length > 1){
        var buf = [];
        for(var i = 0, len = a.length; i < len; i++){
            if(typeof a[i] == 'object'){
                continue; //we'll ignore config objects
            }else{
                buf[buf.length] = a[i];
            }
        }
        text = buf.join('');
    }
    /**@private*/
    this.text = text;
    if(this.compiled){
        this.compile();   
    }
};
Myna.Template.prototype = {
    /**
     * Returns an HTML fragment of this template with the specified values applied.
     * @param {Object/Array} values The template values. Can be an array if your params are numeric (i.e. {0}) or an object (i.e. {foo: 'bar'})
     * @return {String} The HTML fragment
     */
    applyTemplate: function(values){
        if(this.compiled){
            return this.compiled(values);
        }
        var  tpl = this;
        var fn = function(m, name){
			return values[name] !== undefined ? values[name] : "";
        };
        return String(this.text).replace(this.re, fn);
    },
    
    /**
     * Sets the HTML used as the template and optionally compiles it.
     * @param {String} text
     * @param {Boolean} compile (optional) True to compile the template (defaults to undefined)
     * @return {Ext.Template} this
     */
    set: function(text, compile){
        this.text = text;
        this.compiled = null;
        if(compile){
            this.compile();
        }
        return this;
    },
    
    /**
    * The regular expression used to match template variables 
    * @type RegExp
    * @property 
    */
    re: /\{([\w-]+)(?:\:([\w\.]*)(?:\((.*?)?\))?)?\}/g,
    
    /**
     * Compiles the template into an internal function, eliminating the RegEx overhead.
     * @return {Ext.Template} this
     */
    compile: function(){
        var sep = "+";
        var fn = function(m, name, format, args){
			args= '';
			format = "(values['" + name + "'] == undefined ? '' : ";
            return "'"+ sep + format + "values['" + name + "']" + args + ")"+sep+"'";
        };
        var body;
        // branched to use + in gecko and [].join() in others
		body = "this.compiled = function(values){ return '" +
			   this.text.replace(/\\/g, '\\\\').replace(/(\r\n|\n)/g, '\\n').replace(/'/g, "\\'").replace(this.re, fn) +
				"';};";
        
        eval(body);
        return this;
    },
    
    // private function used to call members
    call : function(fnName, value, allValues){
        return this[fnName](value, allValues);
    },
};
/* Function: apply 
	Merges this template with the supplied data.  
	
	Parameters:
		values		-	{Object/Array} values The template values. Can be an 
						array if your params are numeric (i.e. {0}) 
						or an object (i.e. {foo: 'bar'})
						
			
	Returns:
		Merged string
	
	Examples:
	(code)
		//single string
		var t = new Myna.Template("My name is {0}").apply(["Bob"]);
		
		var t = new Myna.Template("My name is {name}").apply({name:"bob"});
				
	
	(end)
*/
Myna.Template.prototype.apply = Myna.Template.prototype.applyTemplate;


/* Class: Myna.XTemplate
	An extention of <Myna.Template> that supports looping and conditional operations
	

	XTemplate supports many special tags and built-in operators that aren't 
	defined as part of the API, but are  supported in the templates that can be 
	created.  The following examples demonstrate all of the supported features.
	
	
	This is the data object used for reference in each code example
	(code)
	var data = {
		name: 'Jack Slocum',
		title: 'Lead Developer',
		company: 'Ext JS, LLC',
		email: 'jack@extjs.com',
		address: '4 Red Bulls Drive',
		city: 'Cleveland',
		state: 'Ohio',
		zip: '44102',
		drinks: ['Red Bull', 'Coffee', 'Water'],
		kids: [{
			name: 'Sara Grace',
			age:3
		},{
			name: 'Zachary',
			age:2
		},{
			name: 'John James',
			age:0
		}]
	};
	(end)
	
	Auto filling of arrays and scope switching:
	
	Using the _tpl_ tag and the _for_ operator, you can switch to the scope of 
	the object specified by _for_ and access its members to populate the template.
	If the variable in _for_ is an array, it will auto-fill, repeating the 
	template block inside the _tpl_ tag for each item in the array
	
	 (code)
	var tpl = new Ext.XTemplate(
		'<p>Name: {name}</p>',
		'<p>Title: {title}</p>',
		'<p>Company: {company}</p>',
		'<p>Kids: ',
		'<tpl for="kids">',
			'<p>{name}</p>',
		'</tpl></p>'
	);
	$res.print(tpl.apply(data));
	(end)

	Access to parent object from within sub-template scope:
	
	When processing a sub-template, for example while
	looping through a child array, you can access the parent object's members 
	via the _parent_ object
	
	(code)
	var tpl = new Ext.XTemplate(
		'<p>Name: {name}</p>',
		'<p>Kids: ',
		'<tpl for="kids">',
			'<tpl if="age &gt; 1">',
				'<p>{name}</p>',
				'<p>Dad: {parent.name}</p>',
			'</tpl>',
		'</tpl></p>'
	);
	$res.print(tpl.apply(data));
	(end)

	
	Array item index and basic math support:
	
	While processing an array, the special variable _{#}_  will provide the 
	current array index + 1 (starts at 1, not 0). Templates also support the 
	basic math operators + -  and / that can be applied directly on numeric 
	data values:
	
	(code)
	var tpl = new Ext.XTemplate(
		'<p>Name: {name}</p>',
		'<p>Kids: ',
		'<tpl for="kids">',
			'<tpl if="age &gt; 1">',
				'<p>{#}: {name}</p>',  // <-- Auto-number each item
				'<p>In 5 Years: {age+5}</p>',  // <-- Basic math
				'<p>Dad: {parent.name}</p>',
			'</tpl>',
		'</tpl></p>'
	);
	$res.print(tpl.apply(data));
	(end)

	Auto-rendering of flat arrays:
	
	Flat arrays that contain values (and not objects) can be auto-rendered using 
	the special _{.}_ variable inside a loop.  This variable will represent the 
	value of the array at the current index:
	
	(code)
	var tpl = new Ext.XTemplate(
		'<p>{name}\'s favorite beverages:</p>',
		'<tpl for="drinks">',
		   '<div> - {.}</div>',
		'</tpl>'
	);
	$res.print(tpl.apply(data));
	(end)

	Basic conditional logic:
	
	Using the _tpl_ tag and the _if_
	operator you can provide conditional checks for deciding whether or not to 
	render specific parts of the template. Note that there is no _else_ operator 
	-- if needed, you should use two opposite _if_ statements. Properly-encoded 
	attributes are required as seen in the following example:
	
	(code)
	var tpl = new Ext.XTemplate(
		'<p>Name: {name}</p>',
		'<p>Kids: ',
		'<tpl for="kids">',
			'<tpl if="age &amp;gt; 1">',  // <-- Note that the > is encoded
				'<p>{name}</p>',
			'</tpl>',
		'</tpl></p>'
	);
	$res.print(tpl.apply(data));
	(end)

	Ability to execute arbitrary inline code:
	
	In an XTemplate, anything between {[ ... ]}  is considered code to be 
	executed in the scope of the template. There are some special variables 
	available in that code:
	
	values 	-  	The values in the current scope. If you are using scope changing 
				sub-templates, youcan change what _values_ is.
	parent 	-  	The scope (values) of the ancestor template.
	xindex 	-  	If you are in a looping template, the index of the loop you are 
				in (1-based).
	xcount 	-  	If you are in a looping template, the total length of the array 
				you are looping.
				
	This example demonstrates basic row striping using an inline code block and the _xindex_ variable:</p>
	(code)
	var tpl = new Ext.XTemplate(
		'<p>Name: {name}</p>',
		'<p>Company: {[company.toUpperCase() + ', ' + title]}</p>',
		'<p>Kids: ',
		'<tpl for="kids">',
		   '<div class="{[xindex % 2 === 0 ? "even" : "odd"]}">,
			'{name}',
			'</div>',
		'</tpl></p>'
	);
	$res.print(tpl.apply(data));
	(end)

	Template member functions:
	
	One or more member functions can be defined directly on the config
	object passed into the XTemplate constructor for more complex processing:
	
	(code)
	var tpl = new Ext.XTemplate(
		'<p>Name: {name}</p>',
		'<p>Kids: ',
		'<tpl for="kids">',
			'<tpl if="this.isGirl(name)">',
				'<p>Girl: {name} - {age}</p>',
			'</tpl>',
			'<tpl if="this.isGirl(name) == false">',
				'<p>Boy: {name} - {age}</p>',
			'</tpl>',
			'<tpl if="this.isBaby(age)">',
				'<p>{name} is a baby!</p>',
			'</tpl>',
		'</tpl></p>', {
		 isGirl: function(name){
			 return name == 'Sara Grace';
		 },
		 isBaby: function(age){
			return age < 1;
		 }
	});
	$res.print(tpl.apply(data));
	(end)
*/

/* Constructor: XTemplate
Creates a new template from the supplied string or array of strings
	
	Parameters:
		text*		-	a string or array of strings, or several string 
						arguments that represent the template. See the examples below
						
						
	Examples:
	(code)
		//single string
		var t = new Myna.XTemplate("My name is {name}");
				
		//array of strings
		var t = new Myna.XTemplate([
			"My",
			" name",
			" is ",
			"{name}"
		]);
		
		//several string parameters
		var t = new Myna.XTemplate(
			"My",
			" name",
			" is ",
			"{name}"
		);
	(end)
*/
Myna.XTemplate = function(){
    Myna.Template.apply(this, arguments);
    var s = this.text;

    s = ['<tpl>', s, '</tpl>'].join('');

    var re = /<tpl\b[^>]*>((?:(?=([^<]+))\2|<(?!tpl\b[^>]*>))*?)<\/tpl>/;

    var nameRe = /^<tpl\b[^>]*?for="(.*?)"/;
    var ifRe = /^<tpl\b[^>]*?if="(.*?)"/;
    var execRe = /^<tpl\b[^>]*?exec="(.*?)"/;
    var m, id = 0;
    var tpls = [];

    while( (m = s.match(re)) ){
       var m2 = m[0].match(nameRe);
       var m3 = m[0].match(ifRe);
       var m4 = m[0].match(execRe);
       var exp = null, fn = null, exec = null;
       var name = m2 && m2[1] ? m2[1] : '';
       if(m3){
           exp = m3 && m3[1] ? m3[1] : null;
           if(exp){
               fn = new Function('values', 'parent', 'xindex', 'xcount', 'with(values){ return '+(String(exp).unEscapeHtml())+'; }');
           }
       }
       if(m4){
           exp = m4 && m4[1] ? m4[1] : null;
           if(exp){
               exec = new Function('values', 'parent', 'xindex', 'xcount', 'with(values){ '+(String(exp).unEscapeHtml())+'; }');
           }
       }
       if(name){
           switch(name){
               case '.': name = new Function('values', 'parent', 'with(values){ return values; }'); break;
               case '..': name = new Function('values', 'parent', 'with(values){ return parent; }'); break;
               default: name = new Function('values', 'parent', 'with(values){ return '+name+'; }');
           }
       }
       tpls.push({
            id: id,
            target: name,
            exec: exec,
            test: fn,
            body: m[1]||''
        });
       s = s.replace(m[0], '{xtpl'+ id + '}');
       ++id;
    }
    for(var i = tpls.length-1; i >= 0; --i){
        this.compileTpl(tpls[i]);
    }
    this.master = tpls[tpls.length-1];
    this.tpls = tpls;
};
Myna.XTemplate.prototype = new Myna.Template();
// private
Myna.XTemplate.prototype.re = /\{([\w-\.\#]+)(?:\:([\w\.]*)(?:\((.*?)?\))?)?(\s?[\+\-\*\\]\s?[\d\.\+\-\*\\\(\)]+)?\}/g;
// private
Myna.XTemplate.prototype.codeRe = /\{\[((?:\\\]|.|\n)*?)\]\}/g;

// private
Myna.XTemplate.prototype.applySubTemplate = function(id, values, parent, xindex, xcount){
	var t = this.tpls[id];
	if(t.test && !t.test.call(this, values, parent, xindex, xcount)){
		return '';
	}
	if(t.exec && t.exec.call(this, values, parent, xindex, xcount)){
		return '';
	}
	var vs = t.target ? t.target.call(this, values, parent) : values;
	parent = t.target ? values : parent;
	if(t.target && vs instanceof Array){
		var buf = [];
		for(var i = 0, len = vs.length; i < len; i++){
			buf[buf.length] = t.compiled.call(this, vs[i], parent, i+1, len);
		}
		return buf.join('');
	}
	return t.compiled.call(this, vs, parent, xindex, xcount);
}

// private
Myna.XTemplate.prototype.compileTpl = function(tpl){
	var sep =  "+";
	var fn = function(m, name, format, args, math){
		if(name.substr(0, 4) == 'xtpl'){
			return "'"+ sep +'this.applySubTemplate('+name.substr(4)+', values, parent, xindex, xcount)'+sep+"'";
		}
		var v;
		if(name === '.'){
			v = 'values';
		}else if(name === '#'){
			v = 'xindex';
		}else if(name.indexOf('.') != -1){
			v = name;
		}else{
			v = "values['" + name + "']";
		}
		if(math){
			v = '(' + v + math + ')';
		}
		
		args= ''; format = "("+v+" === undefined ? '' : ";
		
		return "'"+ sep + format + v + args + ")"+sep+"'";
	};
	var codeFn = function(m, code){
		return "'"+ sep +'('+code+')'+sep+"'";
	};

	var body;
	// branched to use + in gecko and [].join() in others
	
	body = "tpl.compiled = function(values, parent, xindex, xcount){ return '" +
		tpl.body.replace(/(\r\n|\n)/g, '\\n').replace(/'/g, "\\'").replace(this.re, fn).replace(this.codeRe, codeFn) +
				"';};";
	
	eval(body);
	return this;
}

/*	Function: Apply
	Merges this template with the supplied data.  
	
	Parameters:
		values		-	{Object/Array} values The template values. Can be an 
						array if your params are numeric (i.e. {0}) 
						or an object (i.e. {foo: 'bar'})
						
			
	Returns:
		Merged string
	
 */
Myna.XTemplate.prototype.apply = function(values){
	return this.master.compiled.call(this, values, {}, 1, 1);
}

/**
 * Returns an HTML fragment of this template with the specified values applied.
 * @param {Object} values The template values. Can be an array if your params are numeric (i.e. {0}) or an object (i.e. {foo: 'bar'})
 * @return {String} The HTML fragment
 */
Myna.XTemplate.prototype.applyTemplate = function(values){
	return this.master.compiled.call(this, values, {}, 1, 1);
}

/**
 * Compile the template to a function for optimized performance.  Recommended if the template will be used frequently.
 * @return {Function} The compiled function
 */
Myna.XTemplate.prototype.compile= function(){return this;}
