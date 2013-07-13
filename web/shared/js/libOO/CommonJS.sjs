/* 
	Class: Myna.CommonJS
		A library for interacting with a CommonJS environment 
		
		
		CommonJS is a standard for including and executing 
		JavaScript code across multiple JS platforms. CommonJS's primary 
		specification is the "require" function that allows you to include code 
		and execute programs using an abstract classpath like so:
		
		(code)
			//loading a JavaScript class
			var Twitter = require("TwitterAPI/Twitter");
			var tapi = new Twitter(... options ...);
		(end)
		
		It is up to the platform implementing CommonJS to translate the class path
		into a source string and include it. On Myna this is configured in the 
		Administrator under general settings. By default, Myna searches first in
		the <MynaPath> /shared/js/serveer_only/commonjs and then in /. As an 
		example these are valid locations for the fictional TwitterAPI:
		
		* /shared/js/server_only/commonjs/TwitterAPI/Twitter.js
		* /TwitterAPI/Twitter.sjs
		
		Be careful with location and extension. Paths are searched in the order 
		defined, and .sjs files are favored over .js files in case of conflict
		
		Writing a CommonJS module is simple:
		
		(code)
			//TwitterAPI/Twitter.js
			
			//load dependencies
			require("io/file");// "top-level" loads start with a pathname  
			require("io/http");// "top-level" loads start with a pathname
			
			// relative loads start with a . or ..
			// relative loads are relative to module.id when nested or relative to
			// $server.currentDir for the initial require() call
			require("./TwitterAuth"); 
			
			//constructor
			exports = function(options){
				//do stuff
			}		
			
			exports.prototype ={
				login:function(){
					... do stuff ..
				}
			}
			
			//body code is executed every time this file is require()d
			Myna.log(
				"debug",
				"Called " + module.id + " located at " + module.uri
			);
		(end)
		
		Within a CommonJS module there exists three local properties.
		
		CommonJS Properties:
			require	-	A require() function that knows about this module and can 
							load other modules
			module		-	An object that contains the properties "id" and "URI"
			exports	-	An object that will be returned fromthe require() function.
		
			
		
		For More information about CommonJS, see: <http://wiki.commonjs.org/wiki/CommonJS>
*/

if (!Myna) var Myna={}
   
Myna.CommonJS ={
	/* Function: getRequireFunction
		returns a custom CommonJS require function.
		
		Parameters:
			options	-	options object, see below
			
		Options:
			paths				-	*Optional, default []*
									An array of MynaPaths to search first for modules
			secondaryPaths	-	*Optional, default CommonJS paths as defined in Administrator*
									An array of MynaPaths to search first for modules
	*/
	getRequireFunction:function (options){
		if (!options) options={};
		options.setDefaultProperties({
			paths:[],
			secondaryPaths:Myna.getGeneralProperties().commonjs_paths.split(/,/)
		})
		var cx = $server_gateway.threadContext;
		var scope = $server_gateway.threadScope;
		
		return function(classpath){
			if (classpath.charAt(0) =="."){
				var parts = classpath.match(/((?:\.\.?\/)+)(.*)/)
				classpath =new Myna.File(parts[1]).toString()+parts[2];
				classpath = classpath.after($server.rootDir.length);
			}
			print = function(text){
				Myna.println(text);
				$res.flush();
			}
			var r =org.mozilla.javascript.commonjs.module.Require(
					cx, 
					scope, 
					new org.mozilla.javascript.commonjs.module.provider.StrongCachingModuleScriptProvider(
						new org.mozilla.javascript.commonjs.module.provider.ModuleSourceProvider({
							getModuleSource:function(classpath,paths,validator){
								var scriptPath="";
								var searchPaths =options.paths
									.concat(paths)
									.concat(options.secondaryPaths)
									.map(function(path){
										if (path.right(1) != "/") {
											return path +="/";
										} else {
											return path;	
										}
									})
								var passed=searchPaths
									.some(function(path){
										scriptPath = new Myna.File(path+classpath + ".sjs");
										//Myna.println("trying " + scriptPath)
										if (scriptPath.exists()) return true;
										scriptPath = new Myna.File(path+classpath + ".js");
										if (scriptPath.exists()) return true;
										return false
									})
								if (passed){
									//Myna.println("loading " + scriptPath)
									var reader = new java.io.FileReader(scriptPath.javaFile);
									var uri = new java.net.URI(scriptPath.javaFile);
									return new org.mozilla.javascript.commonjs.module.provider.ModuleSource(
										reader, 
										null, 
										uri,
										null
									)
								}
							}
						})
					), 
					null, 
					null, 
					false
			);
			return r(classpath);
		}
	}
}

var require = Myna.CommonJS.getRequireFunction();