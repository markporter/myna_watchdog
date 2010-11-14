/* Class: Myna.Swing 
	Helper function for creating Swing based UI's   
	
	Overview:
	The Myna.Swing library contains functions for interacting with javax.swing.* 
	and java.awt.*. This is primarily intended for use with the Myna commandline.
	
	The core of this library is <Myna.Swing.build>. This function takes a config 
	object and returns a dynamically extended instance o f the requested class. 
	This allows for a more representative definition of the GUI hierarchy.
	
	Here is a quick example:
	
	
*/	
if (!Myna) var Myna={}
Myna.Swing={
	getColor:function(r,g,b){
		if (r = parseInt(r)) r= r/256;
		if (g = parseInt(g)) g= g/256;
		if (b = parseInt(b)) b= b/256;
		return new java.awt.Color(r,g,b);
	},
	BorderFactory:javax.swing.BorderFactory,
	getDimension:function(w,h){
		return new java.awt.Dimension(w,h);
	},
	_getClassName:function(name){
		if (typeof javax.swing[name] == "function") return "javax.swing."+name;
		if (typeof java.awt[name] == "function") return "java.awt."+name;
		
		throw new Error("Unabale to find '"+name+"' in javax.swing.* or java.awt.*")
	},
	getConst:function(name){
		var baseClass = Myna.Swing._getClassName(name.listFirst(".")).listBefore(".") +"."+ name;
		//Myna.println("baseclass = " + baseClass) 
		return baseClass.split(/\./).reduce(function(cls,prop){
			return cls[prop];
		},Packages)
	},
	_getSetterFName:function(property){
		return "set" 
			+ property.charAt(0).toUpperCase() 
			+ property.after(1)
	},
	alert:function(text,title,type){
		switch((type||"").toLowerCase()){
		case "error":
			type = G.getConst("JOptionPane.ERROR_MESSAGE");
			break;
		case "warning":
			type = G.getConst("JOptionPane.WARNING_MESSAGE");
			break;
		default:
			type = G.getConst("JOptionPane.INFORMATION_MESSAGE");
		}
		javax.swing.JOptionPane.showMessageDialog(null, text,title||"Alert", type);
		
	},
	getInput:function(prompt,options,defaultIndex){
		if (options){
			return javax.swing.JOptionPane.showInputDialog(
				null,
				prompt,
				"",
				G.getConst("JOptionPane.QUESTION_MESSAGE"), 
				null,
				options, 
				options[defaultIndex]
			);
		} else {
			return javax.swing.JOptionPane.showInputDialog(
				null,
				prompt,
				"",
				G.getConst("JOptionPane.QUESTION_MESSAGE")
				
			);
		}
	},
	confirm:function(prompt,options,defaultIndex){
		if (!options){
			options=["OK","Cancel"]	
		}
		if (defaultIndex === undefined) defaultIndex=0
		return javax.swing.JOptionPane.showOptionDialog(
			null,
			prompt,
			"",
			G.getConst("JOptionPane.OK_CANCEL_OPTION"),
			G.getConst("JOptionPane.QUESTION_MESSAGE"),
			null,
			options,
			options[defaultIndex] 
		) == G.getConst("JOptionPane.OK_OPTION");
		
	},
	build:function(config){
		var component;
		var hasItems=false;
		var className =Myna.Swing._getClassName(config.cls)
		var code = <ejs>
		component = new JavaAdapter(<%=className%>,{
				config:config,
				getCmp:function(name){
					var search = function(obj,name){
						var result= obj.getComponents().reduce(function(found,cmp){
							if (found) return found;
							if (cmp.getName() == name) return cmp
						},null)
						if (result) {
							return result;
						} else {
							return obj.getComponents().reduce(function(found,cmp){
								if (found) return found;
								return search(cmp,found)
							},null)
						}
					}
					return search(this,name)
					
				}
		})
		</ejs>
		//Myna.println(code)
		eval(code);
		
		/* component.getCmp=function(name){
			var search = function(obj,name){
				var result= obj.getComponents().reduce(function(found,cmp){
					if (found) return found;
					if (cmp.getName() == name) return cmp
				},null)
				if (result) {
					return result;
				} else {
					return obj.getComponents().reduce(function(found,cmp){
						if (found) return found;
						return search(cmp,found)
					},null)
				}
			}
			return search(this,name)
			
		} */
		
		config.getProperties().forEach(function(property){
			var value = config[property];
			switch(property){
			case "items":
				hasItems=true
				break;
			case "handler":
				component.addActionListener(new JavaAdapter(java.awt.event.ActionListener,{
					actionPerformed:value.bind(component)
				}))
				break;
			default:
				var setter = Myna.Swing._getSetterFName(property);
				if (setter in component){
					
					if (typeof value == "object" && "cls" in value){
						value = new Myna.Swing.build(value)
					}
					//Myna.print(setter +":")
					//Myna.println(value);
					component[setter](value);	
				} else {
					component[property] =value;
				}
			}
		})
		if (hasItems){
			var contentPane = component;
			if ("getContentPane" in component)  contentPane = component.getContentPane();
			config.items.forEach(function(item){
				//apply defaults
				if ("defaults" in config){
					var applyProperties = function(object,properties){
						for (var prop in properties){
							if (prop in object){
								if (object[prop] 
									&& typeof object[prop] =="object" 
									&& typeof properties[prop] == "object"
								){
									applyProperties(object[prop],properties[prop])
								}
							} else {
								object[prop] = properties[prop];	
							}
						}
					}
					applyProperties(item,config.defaults)
				}
				var layoutPos = item.layoutPos||null;
				if (layoutPos 
					&& typeof layoutPos == "object" 
					&& "cls" in layoutPos
				){
					layoutPos = new Myna.Swing.build(layoutPos)
				}
				if ("instance" in item){
					item = item.instance
				} else if ( "cls" in item){
					item = new Myna.Swing.build(item)
				} else {
					throw new Error("Component items must contain either a 'cls' property or an 'instance' property")	
				}
				if (layoutPos){
					contentPane.add(item, layoutPos);
				} else {
					contentPane.add(item);
				}
				//Myna.println("added " + item)
			})	
		}
		if ("pack" in component) component.pack();
		return component
	} 
}