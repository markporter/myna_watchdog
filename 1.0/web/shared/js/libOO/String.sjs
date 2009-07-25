/* Class: String 
	Additional Myna specific functions on the JS String object    
	
	 
*/

/* Function: hashEquals 
	Returns true if the plaintext password matches the encrypted password 
	 
	Parameters: 
		hash	-	hash previously created with <String.hash>
 
	Returns: 
		true if this string matches _hash_
		
	Detail:
		One way hashes like those created by <String.hash> cannot be decrypted. However, 
		you can encrypt a possible match and compare the hashes. Because of the salt in the hashes 
		produced by <String.hash>, equivalent hashes won't look the same, but this 
		function can compare them.
		
	
	See:
	*	<String.toHash>
	* 	<String.encrypt>
	*	<String.decrypt>
	*	http://www.jasypt.org/
	 
	*/
	String.prototype.hashEquals=function(hash){
		var plainPassword = this;
		var cryptTool = new Packages.org.jasypt.util.password.BasicPasswordEncryptor()
		return cryptTool.checkPassword(plainPassword,hash);
	}
/* Function: toHash 
	Returns a copy of this string encrypted with a strong one-way hash. 
	 
	 
	Returns: 
		Encrypted password string in only printable characters. 
		
	Detail:
		This function encrypts the supplied text with a one-way algorithm so that 
		it can never be converted back to the original text. This can be any text 
		but it makes the most sense for passwords. Although you can't tell what the 
		original text is, you can compare the encrypted string to a plaintext string 
		to see if they match. See <String.hashEquals>. 
		
		For extra security, each hash includes a salt; a string characters appended 
		to the text to force it to be unique. This way even if an attacker can figure 
		out that his/her password of "bob" =  "tUhTivKWsIKE4IwVX9s/wzg1JKXMPU+C", he 
		or she will not be able to tell if any of the other hashes equal "bob". This 
		makes a brute force dictionary attack much more difficult.  
		
	
	Example:
	(code)
		<%="bob".toHash()%><br>
		<%="bob".toHash()%><br>
		<%="bob".toHash()%><br>
		<%="bob".toHash()%><br>
	(end)
	
	..prints something like
	
	(code)
	tUhTivKWsIKE4IwVX9s/wzg1JKXMPU+C
	M0y5EgZVG3iW2N5k2ipHp7x7JtvJYGu5
	yRxnK/RlK9VeX89duVkrncQv4/vWyWGs
	ca4r3Qlt51wFk/y0pv+7YazkcFtRgkoS
	(end)
	 
	See: 
	*	<String.hashEquals> 
	*	<String.encrypt> 
	*	<String.decrypt>
	*	http://www.jasypt.org/
	 
	*/
	String.prototype.toHash=function(){
		var password = this;
		var cryptTool = new Packages.org.jasypt.util.password.BasicPasswordEncryptor()
		return cryptTool.encryptPassword(password);
	}
/* Function: decrypt 
	Returns the unencrypted string contained in this string
	 
	Parameters: 
		password 			-	Password used to orginally encrypt the string
 
	Returns: 
		The unencrypted string contained in this string
	
	See: 
	*	<String.toHash> 
	*	<String.hashEquals> 
	*	<String.encrypt>
	*	http://www.jasypt.org/
	
	*/
	String.prototype.decrypt=function(password){
			var encryptedString = this;
			var cryptTool = new Packages.org.jasypt.util.text.BasicTextEncryptor()
			cryptTool.setPassword(password);
			return cryptTool.decrypt(encryptedString);
	}
/* Function: encrypt 
	Encrypts this using a password.  
	 
	Parameters: 
		password 	-	password to use for encryption.
 
	Returns: 
		The encrypted string.
		
	Example:
	(code)
		<%="bob".encrypt("theSecretPassword")%><br>
		<%="bob".encrypt("theSecretPassword")%><br>
		<%="bob".encrypt("theSecretPassword")%><br>
		<%="bob".encrypt("theSecretPassword")%><br>
	(end)
	
	..prints
	
	(code)
	xeM5n1ncfX2KNTLUEjZHeg==
	AedyMQ5jA1rbOdQZMTq9Ag==
	+Zam3Jg4YqI/5QRkcokLcQ==
	LY2OAW8+xe3I5OJi/Hg+6A==
	(end)
	
	See:
	*	<String.decrypt> 
	*	<String.hashEquals> 
	*	<String.toHash>
	*	http://www.jasypt.org/
	 
	*/
	String.prototype.encrypt=function(password){
		var string = this;
		var cryptTool = new Packages.org.jasypt.util.text.BasicTextEncryptor()
		cryptTool.setPassword(password);
		return cryptTool.encrypt(string);
	}

/* Function: toXml 
	returns an E4X XML object from this string, or throws an exception if not 
	possible 
	 
	See:
	*	https://developer.mozilla.org/en/e4x
	*  http://www.faqts.com/knowledge_base/index.phtml/fid/1762
	
	*/
	String.prototype.toXml=function(){
		return new XML(String(this)
		.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, "") /* mozilla bug 336551*/
		.trim())
	}
	