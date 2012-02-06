/* Class: $flash
	A session-scoped object for passing messages to views.
*/
var $flash = {
	
/* Function: set
	sets a flash message
	
	Parameter Pattern 1:
		message	-	message to set as the "defaultMessage"
		
	Parameter Pattern 2:
		key		-	message key to set	
		message	-	message to set
	
	Parameter Pattern 2:
		messages	-	A JS object where each each key is a flash key and each 
		value is a flash message 
			
	*/
	set:function(options,value){
		if (typeof options =="string"){
			if (value){
				this.data[options]=value;
			} else {
				this.data.flashMessage=options;
			}
		} else {
			options.forEach(function(v,k){
				$flash.data[k] =v;
			})
		}
	},
/* Function: get
	returns a flash message
	
	Parameters:
		key	-	*Optional, default "defaultMessage"*
					flash key to return
					
	Note:
		"Get"ing a key erases that key.
	*/
	get:function(key){
		if (!key) key="defaultMessage"
			
		var message = this.data[key];
		delete this.data[key];
		return message;
	},
	
/* Function: getMessages
	returns an HTML string including all flash messages
	
	Also empties the flash
	*/
	getMessages:function(){
		
		return <ejs>
			
			<div class="flash_message_container">
				<@loop array="$flash.data.getKeys()" element="key" index="i">
					<% var v = $flash.get(key); %>
					<@if typeof v === "object" && "errors" in v>
						<div class="flash_<%=key%>">
							<div class="error_message"><%=v.errorMessage%></div>
							<div class="error_detail"><%=v.errorDetail%></div>
							<@loop array="v.errors.getKeys()" element="colname" index="i">
								<div class="error_<%=colname%>"><%=v.errors[colname]%></div>	
							</@loop>
							
						</div>
					<@else>
						<div class="flash_<%=key%>"><%=v%></div>	
					</@if>
					
				</@loop>
			</div>
		</ejs>
	},	
	
/* Property: data
	contains all the current flash messages
	*/
	data:$session.get("$flash")||{},
}

$application.addOpenObject({
	close:function(){
		$session.set("$flash",$flash.data)
	}	
}) 
