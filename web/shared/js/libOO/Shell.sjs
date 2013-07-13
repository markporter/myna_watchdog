
/* 
	Class: Myna.Shell
	runs an interactive shell
	
	Example:
	(code)
		
		shell = new Myna.Shell({
		    command:"ssh://mark@192.168.1.112",
		    timeout:3,
		})

		shell.sendLine("ls");
		shell.waitForPrompt()
		shell.sendLine("cd /tmp")
		shell.waitForPrompt()
		shell.sendLine("/bin/ls")
		shell.waitForPrompt()
		shell.sendLine("exit")
		shell.waitForClose();
		Myna.println(shell.getResponseText());
		Myna.println(shell.getErrorText());

	(end)
*/
if (!Myna) var Myna={}


/* Constructor: Myna.Shell
	Constructor function for Shell class
	
	Parameters:
		options		-	Object that describes the options for this shell.
							See below.
	Options:
		command		-	*String*
						Command to execute. May be ssh://user@host to initiate an
						ssh session. 


		timeout		-	*Optional default 30 seconds*
						*Integer*
						default number of seconds to wait for expected output

		prompt		-	*Optional default '>' on windows '$' on others*
						prompt to match via <waitForPrompt>

		escapeFn	-	*Optional, default <Myna.Shell.escapeCmd> on windows or 
							<Myna.Shell.escapeSh> on others*
						The escape function to use for replacements. See 
						<send> and <sendLine>

		privateKey	-	*Optional, default file://{homedir}/.ssh/id_rsa*
						path to private key for SSH sessions

		publicKey	-	*Optional, default {privateKey}.pub*
						path to public key for SSH sessions

		password	-	*Optional*
						If connecting via ssh, a password can be sent.  

	
	*/
	Myna.Shell = function(options){
		if (!options) options = {}
		options.checkRequired(["command"]);
		this.command = options.command
		this.timeout = options.timeout || 10;
		var e4j = Packages.expectj.ExpectJ(this.timeout);
		if (/^ssh:\/\//.test(this.command)){
			importPackage(com.jcraft.jsch)
			var [dummy,user,host] = this.command.match(/ssh:\/\/(.*?)@(.*)/);
			var jsch  = new JSch();
			jsch.setConfig("StrictHostKeyChecking","no")
			var homeDir = new Myna.File("file://" + java.lang.System.getProperty( "user.home" ))
			if (!options.privateKey) options.privateKey = homeDir.toString() + "/.ssh/id_rsa";
			if (!options.publicKey) options.publicKey = options.privateKey + ".pub";

			var privFile = new Myna.File(options.privateKey)
			var pubFile = new Myna.File(options.publicKey)
			if (privFile.exists() && pubFile.exists()){
				jsch.addIdentity(privFile.javaFile.toString(),pubFile.javaFile.toString())	;
			}
			var s = jsch.getSession(user,host,22)
			if (options.password){
				s.setPassword(options.password)
			}
			//s.setPassword("crapfuck")
			s.connect(30000)
			var channel=s.openChannel("shell");

			this._spawn = e4j.spawn(channel);
		} else this._spawn = e4j.spawn(this.command);
		
		if (!options.prompt){
			if (/windows/i.test($server.osName)){
				options.prompt = ">"
			} else options.prompt = "$"
		}
		this.prompt =  options.prompt;
		if (!options.escapeFn){
			if (/windows/i.test($server.osName)){
				options.escapeFn = Myna.Shell.escapeCmd
			} else options.escapeFn = Myna.Shell.escapeSh
		}
		this.escapeFn = options.escapeFn;

	}

/* Function: Myna.Shell.escapeSh
	Escapes a string to a quoted parameter for sh family shells

	Parameters:
		text

	Returns:
		_text_ formatted as an escaped, quoted string

	Example:
		This string is just a mess in bourne shell

		> $PATH bob!;echo `echo dude` sally's &

		This function will escape it to 

		> '$PATH bob!;echo `echo dude` sally'"'"'s &'

		which will cause it to be interpreted as a single string literal parameter

		
	*/
	Myna.Shell.prototype.escapeSh=function(text){
		return "'{0}'".format(text.replace(/'/g,"\'\"'\"\'"))
	}

/* Function: Myna.Shell.escapeCmd
	Escapes a string to a quoted parameter for windows cmd shell

	Parameters:
		text

	Returns:
		_text_ formatted as an escaped, quoted string

	Example:
		This string 

		> %PATH% > tmp

		becomes 

		> "^%PATH^% ^> tmp"

		which will cause it to be interpreted as a single string literal parameter
		
	*/
	Myna.Shell.prototype.escapeSh=function(text){
		return '"{0}"'.format(text.replace(/(\W)/g,"^$1"))
	}

/* Function: send
	sends input to the shell

	Parameters:
		text			-	text to send to the process
		replacements		-	*Optional*
							*Array of strings or JS object*
							If defined, values will be sanitized via <escapeFn> 
							and then applied to _text_ as per <String.format>. 

	
	Note:
		This class can be easily exploited by passing system commands via web 
		forms. All user input should be checked for potential command injection 
		before bing passed to a shell

	Example:
	(code)
		shell.send("echo {body} | mail -s {subject} {userEmail}\n",$req.rawData);
		shell.waitForClose(10)
	(end)

	This will sanitize the "subject","body" and "userEmail" parameters before 
	merging them into test to send to the shell. This way if a user types 
	"&& rm -rf /" as the "body" parameter, this will be sent as the body of the 
	email rather than erasing the server's hard drive.

	returns this shell Object
	
	*/
	Myna.Shell.prototype.send=function(text,replacements){
		var $this =this;
		if (replacements) {
			replacements = replacements.map(function (v) {
				return $this.escapeFn(v);
			})
			text = text.format(replacements);
		}
		this._spawn.send(text)
		return this
	}
/* Function: sendLine
	sends input to the shell, including a hard return

	Parameters:
		text			-	text to send to the process
		replacements		-	*Optional*
							*Array of strings or JS object*
							If defined, values will be sanitized via <escapeFn> 
							and then applied to _text_ as per <String.format>. 

	
	Note:
		This class can be easily exploited by passing system commands via web 
		forms. All user input should be checked for potential command injection 
		before bing passed to a shell

	Example:
	(code)
		shell.send("echo {body} | mail -s {subject} {userEmail}",$req.rawData);
		shell.waitForClose(10)
	(end)

	This will sanitize the "subject","body" and "userEmail" parameters before 
	merging them into test to send to the shell. This way if a user types 
	"&& rm -rf /" as the "body" parameter, this will be sent as the body of the 
	email rather than erasing the server's hard drive.

	returns this Shell Object
	
	*/
	Myna.Shell.prototype.sendLine=function(text,replacements){
		var $this =this;
		if (replacements) {
			replacements = replacements.map(function (v) {
				return $this.escapeFn(v);
			})
			text = text.format(replacements);
		}
		this._spawn.send(text + "\n")
		return this;
	}		
/* Function: waitFor
	waits for a text response from the process, or until a timeout occurs

	Parameters:
		text	-	text to match
		timeout	-	*optional, default: shell timeout*
					Seconds to wait for a response. If a timeout occurs an 
					exception is thrown

	returns this Shell Object
	*/
	Myna.Shell.prototype.waitFor=function(text,timeout){
		if (!timeout) timeout = this.timeout;
		
		this._spawn.expect(text,timeout)

		return this;
	}

/* Function: waitForErr
	waits for a text response from the process on the error stream, or until a timeout occurs

	Parameters:
		text	-	text to match
		timeout	-	*optional, default: shell timeout*
					Seconds to wait for a response. If a timeout occurs an 
					exception is thrown

	returns this Shell Object
	*/
	Myna.Shell.prototype.waitForErr=function(text,timeout){
		if (!timeout) timeout = this.timeout;
		
		this._spawn.expectErr(text,timeout)

		return this;
	}

/* Function: waitForPrompt
	waits for a command prompt response from the process, or until a timeout occurs

	Parameters:
		timeout	-	*optional, default: shell timeout*
					Seconds to wait for a response. If a timeout occurs an 
					exception is thrown

	Note:
		the prompt expected is set in the constructor

	returns this Shell Object
	*/
	Myna.Shell.prototype.waitForPrompt=function(timeout){
		if (!timeout) timeout = this.timeout;
		
		this._spawn.expect(this.prompt,timeout)

		return this;
	}	

/* Function: waitForClose
	waits for a shell to close, or timeout

	Parameters:
		timeout	-	*optional, default: shell timeout*
					Seconds to wait for shell to end. If a timeout occurs an 
					exception is thrown

	
	returns this Shell Object
	*/
	Myna.Shell.prototype.waitForClose=function(timeout){
		if (!timeout) timeout = this.timeout;
		
		this._spawn.expectClose(timeout)

		return this;
	}	

/* Function: getExitValue
	returns exit value of the shell, or throws an exception if shell is still 
	running

	See <waitForClose>

	*/
	Myna.Shell.prototype.getExitValue=function(){
		return this._spawn.getExitValue();
	}	

/* Function: getResponseText()
	returns the current stdout text buffer

	*/
	Myna.Shell.prototype.getResponseText=function(){
		//give some time for buffering
		Myna.sleep(50)
		return this._spawn.getCurrentStandardOutContents();
	}	

/* Function: getErrorText()
	returns the current stderr text buffer
	
	*/
	Myna.Shell.prototype.getErrorText=function(){
		//give some time for buffering
		Myna.sleep(50)
		return this._spawn.getCurrentStandardErrContents();
	}	

	