/* Class: Myna.Mail 
	Email Object   
	
	
	Example:
	(code)
	new Myna.Mail({
		to:"no-one@nowhere.info",
		from:"some-one@nowhere.info",
		subject:"Mail test",
		isHtml:true,
		body:<ejs>
			<table  border="1" >
				<tr>
					<th >
						this..
					</th>
					<td> is HTML</td>
				</tr>
			</table>
		</ejs>,
		attachments:[
			new Myna.File("/application.sjs"),
			"/myna/ext/resources/images/default/editor/tb-sprite.gif"
		]	
	}).send()
	(end)
		
*/
if (!Myna) var Myna={}
/* 	Constructor: Myna.Mail 
	Construct a Mail object
	
	Parameters:
		options 	- 	An Options Object that contains configuration information
						for this mail object. See below
		
	Options:
		from				-	"From" email address
		to					-	Comma separated list of "to" email addresses 
		cc					-	*Optional default ''* Comma separated list of 
								"cc" email addresses 	
		bcc					-	*Optional default ''* Comma separated list of 
								"bcc" email addresses
		subject				-	*Optional default ''* email subject
		body				- 	*Optional default ''* email body. If this is
								html, be sure to set _isHtml_ to true
		isHtml				-	*Optional default false* If true, body will be 
								interpreted as html
		attachments			-	*Optional default []* Optional array of 
								<Myna.File> objects or <MynaPath> strings that 
								represent files to attach to this email 
*/
Myna.Mail = function (options){
	options.applyTo(this);
	var defaults={
		/* from:"", */
		/* to:"", */
		cc:"",
		bcc:"",
		subject:"",
		body:"",
		isHtml:false,
		attachments:[]
	}
	defaults.applyTo(this); 
}

/* Function: send
	send this email
*/
Myna.Mail.prototype.send=function(){
	this.checkRequired(["to","from"])
	var mail = Packages.javax.mail;
	var internet = mail.internet;
	var activation = Packages.javax.activation;
	var props = new java.util.Properties;
	props.put("mail.smtp.host",$server_gateway.generalProperties.getProperty("smtp_host"));
	props.put("mail.debug", "true");
	
	var session = mail.Session.getInstance(props);
	var transport = session.getTransport("smtp");
	var msg = new internet.MimeMessage(session);
	
	msg.setFrom(new internet.InternetAddress(this.from));
	msg.setRecipients(
		mail.Message.RecipientType.TO,
		internet.InternetAddress.parse(this.to,false)
	);
	if (this.cc.length){
		msg.setRecipients(
			mail.Message.RecipientType.CC,
			internet.InternetAddress.parse(this.cc,false)
		);	
	}
	if (this.bcc.length){
		msg.setRecipients(
			mail.Message.RecipientType.BCC,
			internet.InternetAddress.parse(this.bcc,false)
		);	
	}
	msg.setSubject(this.subject);
	msg.setSentDate(new Date());
	
	var mp = new internet.MimeMultipart();
	var msgPart = new internet.MimeBodyPart();
	
	if (this.isHtml){
		var html = new java.lang.String(this.body)
		var htmlHandler=activation.DataSource({
			getContentType:function() {
				return "text/html";
			},
			getInputStream:function() {
				return new java.io.ByteArrayInputStream(html.getBytes());
			},
			getOutputStream:function() {
			},
			getName:function() {
				return "JAF text/html dataSource to send e-mail only";
			}
			
		})
		msgPart.setDataHandler(new activation.DataHandler(htmlHandler))
	} else {
		msgPart.setText(this.body)
	}
	mp.addBodyPart(msgPart);
	
	this.attachments.forEach(function(file){
		if (typeof file ==  "string") file = new Myna.File(file);
		var filePart = new internet.MimeBodyPart();
		var fds = new activation.FileDataSource(file.javaFile);
        filePart.setDataHandler(new activation.DataHandler(fds));
        filePart.setFileName(fds.getName());
		mp.addBodyPart(filePart);
	});
	
	msg.setContent(mp);
	transport.send(msg)
	
}

