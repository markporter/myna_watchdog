/* 
	Class: Myna.Event
		Class for managing distributed events 
		
		Myna instances automatically cluster based on a shared myna_permissions
		datasource. Myna clusters have a distributed event system where arbitrary 
		events can be fired by name, and all cluster members may register 
		listeners to handle those events. All event handling is asynchronous and 
		cannot send any content back to the browser.
		
		
		
*/
	if (!Myna) var Myna={}
/* Constructor: Event
	Creates a new Event object for a particular event name
	
	Parameters:
		name		-	name of this event
	
	Example:
	(code)
		var event = new Myna.Event("MyEvent");
	(end)
	*/	
	Myna.Event=function(name){
		this.name 	= String(name).toLowerCase();
		this.hc 		= com.hazelcast.core.Hazelcast;
		this.topic 	= this.hc.getTopic(name);
	}
/* Function: fire
	fires this event
	
	Parameters:
		data		-	data to sent to event listeners. This data must be 
						serializable via Object.toJson()
	Example:
	(code)
		new Myna.Event("MyEvent").fire($req.data);
	(end)
	*/
	Myna.Event.prototype.fire = function(data){
		var props=Myna.getGeneralProperties();
		var packet ={
			id:Myna.createUuid(),
			ts:new Date(),
			server:$server.hostName.toLowerCase(),
			instance:props.instance_id.toLowerCase(),
			purpose:props.instance_purpose.toLowerCase(),
			name:this.name.toLowerCase(),
			data:data
		}
		var msg 
		try {
			msg = packet.toJson();	
		} catch(e){
			throw new Error("Unable to JSON encode data for event '"+this.name+"'" + Myna.dump(data))
		}
		if (msg){
			this.topic.publish(msg);
		}
	}
/* Function: listen
	registers a listener for this event
	
	Parameters:
		options	-	options object. see below
		
	Options:
		server			-	*Optional, default null*
							If defined, only listen to events from this server
		instance		-	*Optional, default null*
							If defined, only listen to events from this instance
		purpose		-	*Optional, default null*
							If defined, only listen to events from this purpose
		handler		-	*Optional, default null*
							Handler function. If defined, this will be called 
							with the event packet (see below) as its argument
		path			-	*Optional, default null*
							<MynaPath> to handler script. If defined, this will be 
							called included with the event packet (see below) as its 
							"this" scope
		url				-	*Optional, default null*
							URL of handler. If defined, this will be called via
							<Myna.HttpConnection> with the event packet (see below) as 
							its _parameters_. Before calling this URL, the event 
							packet's _data_ property will be converted to JSON
		username		-	*Optional, default null*
							if defined, this is used as the HTTP Basic Auth user for 
							the URL post.
		password		-	*Optional, default null*
							if defined, this is used as the HTTP Basic Auth password 
							for the URL post.
		isTemp			-	*Optional, default false*
							Normally listeners are registered with the server, and 
							reloaded during server startup. Set this to "true" to 
							disable behavior for one-use events
	Note:
		One of _handler_, _path_, or _url_ must be defined.
		
	Event Packet:
		name			-	The name of this event
		ts				-	Date object representing the time the event was fired
		server			-	host name of the server that fired this event:$server.hostName,
		instance		-	The id of then instance that fired this event
		purpose		-	The purpose of the instance that fired this event
		data			-	The data supplied to this event
		
		
	Example:
	(code)
		var event = new Myna.Event("MyEvent");
		//only listen to local events
		event.listen({
			server:$server.hostName,
			purpose:$server.purpose,
			instance:$server.instance_id,
			handler:function(event){
				Myna.log("debug","got event " + event.name ,Myna.dump(event));
			}
		})
		
		// reuse an existing page as an event listener, and listen for this event 
		// from any source
		event.listen({
			path:"/my_app/do_stuff.sjs"
		})
		
		//publish event to external source as a form post, with http authentication
		event.listen({
			url:"https://othersite.com/republish_myna_event.cfm",
			username:"myna",
			password:"xOAEZBGjsFy+L13KxciKvNipXb8YYxM2"
		})
	(end)
	*/
	Myna.Event.prototype.listen=function(options){
		if (options.server) options.server = options.server.toLowerCase();
		if (options.purpose) options.purpose = options.purpose.toLowerCase();
		if (options.instance) options.instance = options.instance.toLowerCase();
		if (options.path) options.path = new Myna.File(options.path).toString();
		options.name = this.name;
		//if (options.handler) options.handler = options.handler.toSource()
		
		var sig = options.applyTo({})
		if (sig.handler) sig.handler=sig.handler.toSource();
		sig = new java.lang.String(sig.toJson()).hashCode();
		
		var shouldExit = false;
		Myna.lock("event_listeners",0,function(){
			var listeners = $server.get("event_listeners")
		
			//skip duplicate event listeners
			if (sig in listeners) shouldExit = true;
			
			listeners[sig] = options;
			Myna.Event.persistListeners();
		})
		
		if (shouldExit) return;
		
		this.topic.addMessageListener(new com.hazelcast.core.MessageListener(options.applyTo({
			onMessage:function(msg){
				
				var event = String(msg).parseJson();
				//skip non-matching events
				if (this.purpose && this.purpose != event.purpose) return;
				if (this.server && this.server != event.server) return;
				if (this.instance && this.instance != event.instance) return;
				/* java.lang.System.out.println(" event " + event.name +" passed the tests " + this.handler)
				java.lang.System.out.println(" event " 
					+ event.name +" passed the tests " 
					+ typeof this.handler
				) */
				
				var success=true;
				var e={};
				if (this.handler){
					new Myna.Thread(function(event,obj){obj.handler(event)},[event,this])
					//this.handler(event)
				} else if (this.path){
					new Myna.Thread(function(event,path){
						Myna.include(path,event);
					},[event,this.path])
					
				} else if (this.url){
					event.data = event.data.toJson(); 
					event.conn= new Myna.HttpConnection({
						url:this.url,
						method:"POST",
						parameters:event,
						username:this.username,
						password:this.password
					})
					
					try {
						event.conn.connect();
						if (event.conn.getStatusCode() != 200){
							success=false;	
						}
					} catch(e){
						success=false;
					}
				}
				//java.lang.System.out.println("done event")
			},
		})));
	}
/* Function: persistListeners
	internal function to save registered listeners 
	
	*/
	Myna.Event.persistListeners = function(){
		new Myna.Thread(function(){
			var text = [];
			$server.get("event_listeners").forEach(function(l){
				if (!l.isTemp){
					text.push(<ejs>
						new Myna.Event("<%=l.name%>").listen({<@if l.path>
							path:"<%=l.path%>",</@if><@if l.url>
							url:"<%=l.url%>",</@if><@if l.username>
							username:"<%=l.username%>",</@if><@if l.password>
							password:"<%=l.password%>",</@if><@if l.handler>
							handler:<%=l.handler.toSource()%>,</@if><@if l.server>
							server:"<%=l.server%>",</@if><@if l.purpose>
							purpose:"<%=l.purpose%>",</@if><@if l.instance>
							instance:"<%=l.instance%>",</@if>
						});
					</ejs>)
				}
			})
			new Myna.File("/WEB-INF/myna/registered_listeners.sjs")
				.writeString(text.join(""))
		},[])
	}