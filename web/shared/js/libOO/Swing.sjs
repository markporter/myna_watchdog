/* Class: Myna.Swing 
	Helper function for creating Swing based UI's   
	
	Overview:
	The Myna.Swing library contains functions for interacting with javax.swing.* 
	and java.awt.*. This is primarily intended for use with the Myna commandline.
	
	The core of this library is <Myna.Swing.build>. This function takes a config 
	object and returns a dynamically extended instance of the requested class. 
	This allows for a more representative definition of the GUI hierarchy.
*/	
if (!Myna) var Myna={}
Myna.Swing={
	/* Function: getColor
		returns a java.awt.Color object from an RGB value
		
		Parameters:
			r	-	integer "red" value
			b	-	integer "blue" value
			g	-	integer "green" value
			
		
		*/
		getColor:function(r,g,b){
			if (r == parseInt(r)) r= r/256;
			if (g == parseInt(g)) g= g/256;
			if (b == parseInt(b)) b= b/256;
			return new java.awt.Color(r,g,b);
		},
	/* Function: getDimension
		returns a java.awt.Dimension object from a width,height value
		
		Parameters:
			w	-	integer "width" value in pixels
			h	-	integer "heigth" value in pixels
			
			
		
		*/
		getDimension:function(w,h){
			return new java.awt.Dimension(w,h);
		},
	_getClassName:function(name){
		if (typeof javax.swing[name] == "function") return "javax.swing."+name;
		if (typeof java.awt[name] == "function") return "java.awt."+name;
		
		
		throw new Error("Unabale to find '"+name+"' in javax.swing.* or java.awt.*")
	},
	/* Function: getConst
		returns the value of the passed AWT/Swing constant Value.
		
		Parameters: 
			name 	-	name of AWT/Swing constant
			
		Example:
		(code)
			var MS = Myna.Swing;
			...
				layoutPos:{
					anchor:MS.getConst("GridBagConstraints.WEST"),
					gridwidth:MS.getConst("GridBagConstraints.REMAINDER"),     //end row
					fill:MS.getConst("GridBagConstraints.HORIZONTAL"),	//expand horizontally
					weightx:1.0, // expand to fill extra space
				},
			...
		(end)
		*/
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
	/* Function: alert
		Creates an alert dialog
		
		Parameters:
			text		-	Text to display in the alert box
			title		-	*Optional, default "Alert"*
							Title of the alert window
			type		-	*Optional, default "info"
							The possible types are "info","warning", and "error". This 
							selects the icon displayed next to _text_
		
		*/
		alert:function(text,title,type){
			switch((type||"").toLowerCase()){
			case "error":
				type = Myna.Swing.getConst("JOptionPane.ERROR_MESSAGE");
				break;
			case "warning":
				type = Myna.Swing.getConst("JOptionPane.WARNING_MESSAGE");
				break;
			case "info":
			default:
				type = Myna.Swing.getConst("JOptionPane.INFORMATION_MESSAGE");
			}
			javax.swing.JOptionPane.showMessageDialog(null, text,title||"Alert", type);
			
		},
	/* Function: getInput
		Displays an input dialog, similar to window.prompt() in the browser
		
		Parameters:
			prompt				-	Text to display above the input control
			options				-	*Optional, default ""*
										Either a string, or Array of string values to 
										display. If Array, a drop down or scrolling select 
										box will be displayed, depending on the number of 
										items in this array. If this is a string, this 
										will be the initial value of the text box
			defaultIndex		-	*Optional, default 0*
										Only applies when _options_ is an Array. This is 
										the option in the array to pre-select
			
		Returns:
			text selected/entered by the user, or null if the dialog is canceled
		*/
		getInput:function(prompt,options,defaultIndex){
			if (options){
				if (options instanceof Array){
					return javax.swing.JOptionPane.showInputDialog(
						null,
						prompt,
						"",
						Myna.Swing.getConst("JOptionPane.QUESTION_MESSAGE"), 
						null,
						options, 
						options[defaultIndex]
					);
				} else {
					return javax.swing.JOptionPane.showInputDialog(
						null,
						prompt,
						options 
					);
				}
			} else {
				return javax.swing.JOptionPane.showInputDialog(
					null,
					prompt,
					"",
					Myna.Swing.getConst("JOptionPane.QUESTION_MESSAGE")
					
				);
			}
		},
	/* Function: confirm
		Displays a confirmation dialog, similar to window.confirm() in the browser
		
		Parameters:
			prompt				-	Text to display 
			buttons				-	*Optional, default ["OK","Cancel"]*
										Array of text button labels to display.
			defaultIndex		-	*Optional, default 0*
										Button to make the default option
			
		Returns:
			True, if the "OK" button is pressed false, if canceled
			
		*/
		confirm:function(prompt,buttons,defaultIndex){
			if (!buttons){
				buttons=["OK","Cancel"]	
			}
			if (defaultIndex === undefined) defaultIndex=0
			return javax.swing.JOptionPane.showOptionDialog(
				null,
				prompt,
				"",
				Myna.Swing.getConst("JOptionPane.OK_CANCEL_OPTION"),
				Myna.Swing.getConst("JOptionPane.QUESTION_MESSAGE"),
				null,
				buttons,
				buttons[defaultIndex] 
			) == Myna.Swing.getConst("JOptionPane.OK_OPTION");
			
		},
	/* Function: showDialog 
		Creates a dialog with arbitrary fields
		
		Parameters:
			fields			-	Array of field configuration objects. See <build>
			title				-	*Optional, default ""*
									Title of dialog
			buttonLabels	-	*Optional, default ["OK","Cancel"]*
			defaultIndex	-	*Optional, default 0*
									Button to make the default option
		
		Returns:
			Array of generated fields, or null if canceled. If the config objects 
			in _fields_ include the _name_ property, then a property of that name 
			will also be in the returned array. This means that fields can be 
			referenced by name or index 
			
		Example:
		(code)
			var result = showDialog([{
				cls:"JLabel",
				text:"Username:"
			},{
				cls:"JTextField",
				name:"username"
			},{	
				cls:"JLabel",
				text:"Password:"
			},{
				cls:"JPasswordField",
				name:"password"
			}],"SVN Authentication")
			
			if (result){
				p.username = result.username.getText()
				//getPassword returns a char[], so we filter it through a native Java string
				p.password = new java.lang.String(result.password.getPassword()).toString()
				svn = new WebSvn().connect(p.username,p.password);		
			}
		(end)
			
		*/
		showDialog:function(fields,buttonLabels,defaultIndex){
			if (!buttonLabels){
				buttonLabels=["OK","Cancel"]	
			}
			if (defaultIndex === undefined) defaultIndex=-1
			var fArray = Myna.JavaUtils.createClassArray("java.lang.Object",fields.length);
			result =[]
			fields.forEach(function(f,i){
				result.push(fArray[i] = MS.build(f))
				if (f.name) result[f.name] =result[result.length-1]
			})
			
			var jop = new javax.swing.JOptionPane(fArray,
			  MS.getConst("JOptionPane.QUESTION_MESSAGE"),
			  MS.getConst("JOptionPane.OK_CANCEL_OPTION"),
			  null,
			  buttonLabels,
			  defaultIndex > -1?buttonLabels[defaultIndex]:0
			);
			
			var dialog = jop.createDialog(title||"")
			/* dialog.addComponentListener(
				java.awt.event.ComponentAdapter({
					componentShown:function(e){
						fArray[1].requestFocusInWindow()
					}
				})
			); */
			dialog.setVisible(true);
			
			if (jop.getValue() != MS.getConst("JOptionPane.OK_OPTION")) return false;
			return result;
		},
	/* Function: build
		Creates Swing component from an object config
		
		Parameters:
			config		-	Object configuration, see "Config" below. This config 
								object will be stored in a "config" property in the
								returned object
			
		Config:
			cls			-	String name of a class in Swing or AWT, like "JLabel" or 
								"JTextField"
			items			-	*Optional, default []*
								An array of component configs that represent children of 
								this component
			defaults		-	*Optional, default {}*
								An object representing a template for objects in _items_. 
								Every property in this object will be applied to each item 
								unless that property is already defined. if _defaults_ 
								appears as a property in _defaults_ then that will apply to 
								the grandchildren items, etc. This is useful for setting 
								default properties for a group of fields
			handler		-	*Optional*
								Function that handles the default action for this component.
								This will create an ActionListener to this component
			listeners	-	*Optional, default {}*
								Allows the creation of component listeners for this 
								component, by defining an event property and function 
								handler. The following events can be monitored: 
								*componentResized*, *componentShown*, *componentHidden*, and
								*componentMoved*. See http://download.oracle.com/javase/6/docs/api/java/awt/event/ComponentListener.html
			layoutPos	-	*Optional*
								A Java options object appropriate to use as the second 
								parameter to java.awt.Contrainer.add(). See http://download.oracle.com/javase/1.5.0/docs/api/java/awt/Container.html#add%28java.awt.Component%2C%20java.lang.Object%29
								Alternatively, this can be a _config_ object that 
								describes an options object.
			[*]			-	*Optional*
								Any other property. If this property has a match as a 
								setter in _cls_ then that setter will be called with the 
								value of this property. If the calue of this property 
								has a _cls_ property, build() will be called against it 
								before passing it to the setter 
		
								
		Returns:
			An extended instance of _cls_ with these extra properties:
			
			config	-	The original _config_ object
			getCmp	-	A function that takes a component name and searches this 
							component and all child components and returns a reference 
							to the named component, or null if not found
							
		Example:
		(code)
		var MS = Myna.Swing;
		var config = {
			//Special Property: Swing class to create
			cls:"JFrame",
			//any property that has setter is set on the resulting object
			title:"HelloWorldSwing",
			//getConst returns the value of the passed constant Value.
			defaultCloseOperation:$server.isCommandline?MS.getConst("JFrame.EXIT_ON_CLOSE"):MS.getConst("WindowConstants.DISPOSE_ON_CLOSE"),
			//any property not already defined by the class, will be added to the resulting object
			center:function(){
				this.setLocationRelativeTo(null)
			},
			//Special Property: elements to add to this Swing object
			items:[{
				cls:"JPanel",
				
				//Special Property: layout specific positioning hint for this control
				layoutPos:MS.getConst("BorderLayout.CENTER"),
				
				//this is equivalent to setLayout(new java.awt.GridBagLayout()) 
				layout:{
					cls:"GridBagLayout"
				},
				//MS.BorderFactory is a shortcut to java.swing.BorderFactory
				border:MS.BorderFactory.createCompoundBorder(
					MS.BorderFactory.createTitledBorder("Text Fields"),
					MS.BorderFactory.createEmptyBorder(5,5,5,5)
				),
				//Special Property: properties of "defaults" are copied to each item in "items". 
				//Nested "defaults" will applied to nested "items"
				defaults:{
					cls:"JLabel",
					layoutPos:{
						cls:"GridBagConstraints",
						anchor:MS.getConst("GridBagConstraints.WEST"),
						gridwidth:MS.getConst("GridBagConstraints.RELATIVE"), //next-to-last
						fill:MS.getConst("GridBagConstraints.NONE"),      //reset to default
						weightx:0, // don't expand to fill space   
					}
				},
				items:[{
					//all other properties are coming from "defaults" above
					text:"JTextField:"
				},{
					cls:"JTextField",
					preferredSize:MS.getDimension(100,22),
					layoutPos:{
						anchor:MS.getConst("GridBagConstraints.EAST"),
						gridwidth:MS.getConst("GridBagConstraints.REMAINDER"),     //end row
						fill:MS.getConst("GridBagConstraints.HORIZONTAL"),	//expand horizontally
						weightx:1.0, // expand to fill extra space
					},
					handler:function(event){
						var src =event.getSource(); 
						//getCmp is custom extension for each component that searches 
						// recusively through its children looking for a component by name
						src.getParent().getCmp("OutputField").setText("JTextField set to: " + src.getText())
					}
				},{
					text:"JPasswordField:",
				},{
					cls:"JPasswordField",
					layoutPos:{
						anchor:MS.getConst("GridBagConstraints.EAST"),
						gridwidth:MS.getConst("GridBagConstraints.REMAINDER"),     //end row
						fill:MS.getConst("GridBagConstraints.HORIZONTAL"),	//expand horizontally
						weightx:1.0, // expand to fill extra space
					},
					handler:function(event){
						var src =event.getSource(); 
						src.getParent().getCmp("OutputField").setText("JPasswordField set to: " + src.getText())
					}
				},{
					text:"JFormattedTextField:",
				},{
					cls:"JFormattedTextField",
					value:new java.util.Date(new Date().getTime()),
					layoutPos:{
						anchor:MS.getConst("GridBagConstraints.EAST"),
						gridwidth:MS.getConst("GridBagConstraints.REMAINDER"),     //end row
						fill:MS.getConst("GridBagConstraints.HORIZONTAL"),	//expand horizontally
						weightx:1.0, // expand to fill extra space
					},
					//Special Property: automatically adds an ActionListener for this component
					handler:function(event){
						var src =event.getSource(); 
						
						src.getParent().getCmp("OutputField").setText("JFormattedTextField set to: " + src.getText())
					}
				},{
					text:"Type text in a field and press Enter.",
					border:MS.BorderFactory.createEmptyBorder(10,0,0,0),
					name:"OutputField",//this is how we find this component later with getCmp(name)
					layoutPos:{
						anchor:MS.getConst("GridBagConstraints.WEST"),
						gridwidth:MS.getConst("GridBagConstraints.REMAINDER"),     //end row
						fill:MS.getConst("GridBagConstraints.HORIZONTAL"),	//expand horizontally
						weightx:1.0, // expand to fill extra space
					},
				}]
			}]
				
		
		}
		
		var panel = new MS.build(config);
		
		panel.center();
		panel.show()
		(end)
		*/
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
				case "listeners":
					value.forEach(function(handler,eventName){
						var componentListener={}
						componentListener[eventName] = handler.bind(component)
						component.addComponentListener(
							java.awt.event.ComponentAdapter(componentListener)
						)
					})
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
					if (("getCmp" in item) && typeof item.getCmp == "function"){
						//do nothing, we already have a component
					} else if ( "cls" in item){
						item = new Myna.Swing.build(item)
					} else {
						throw new Error("Component items must contain either a 'cls' property or be a previously constructed component")	
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
		},
	/* Property: BorderFactory
		shortcut to the javax.swing.BorderFactory class
	*/
	BorderFactory:javax.swing.BorderFactory,
}