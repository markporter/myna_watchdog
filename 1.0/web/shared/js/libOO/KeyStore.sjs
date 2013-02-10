
/* 
	Class: Myna.KeyStore
	Manages keys sets and encypts,decrypts,signs,and verfies data.
	
	
	A KeyStore is a named collection of encryption keys and metadata. KeyStores
	can be used for encryption/decryption (purpose:"crypt") or signing/verifying 
	data (purpose:"sign"). See <create> for more information.
	
	Any number of keys can be generated. Keys have the following statuses:
	
	PRIMARY	-	The currently active key that will be used for signing/encrypting.
					Only one key can be primary.
	ACTIVE	- 	means this key can be used to decrypt/verify cyphertext or a 
					signature a previously generated with this key. Any number of 
					keys can be active
	INACTIVE -  means this key can be used to decrypt/verify cyphertext or a 
					signature a previously generated with this key. Any number of 
					keys can be inactive
	
	You can use the <promote> and <demote> functions to alter the status of keys
	
	Encrypting/Signing String values produces String output
	Encrypting/Signing Binary (byte[]) values produces Binary(byte[]) output
	
	Example:
	(code)
		var ks = new Myna.KeyStore("test_crypt");
		ks.create(crypt); 
		ks.addKey("primary"); //version 1
		ks.addKey(); //status: ACTIVE, version 2
		ks.addKey(); //status: ACTIVE, version 3
		
		ks.demote(1); //makes key 1 ACTIVE, now there is no PRIMARY key 
		ks.promote(2); //makes key 2 PRIMARY, 
		
		var ct = ks.encrypt("Super secret type information")
		Myna.println("cypher = " +ct);
		ks.promote(3); // makes key 3 PRIMARY, key 2 is demoted to ACTIVE
		
		// this works because the key number is embedded in the cyphertext, so
		// KeyStore knows to use key2 for decryption
		var pt = ks.decrypt(ct); 
		Myna.println("plain = " +pt);
		Myna.printDump(ks.getKeyInfo())
		
		Myna.print("<h2>public key crypto test</h2>")
		var ks = new Myna.KeyStore("test_private");
		ks.create("crypt","default"); 
		ks.addKey("primary");
		
		var publicKeys = ks.exportPublicKeys()
		
		//this part is normally done on a seperate Myna instance, the "client"
		
		var pks = new Myna.KeyStore("test_public1");
		pks.importPublicKeys(publicKeys);
		
		//encrypt with public key
		var ct = pks.encrypt("woot!")
		Myna.println("cypher = " +ct);
		
		//decrypt with private key
		var pt = ks.decrypt(ct);
		Myna.println("plain = " +pt);  
		
	(end)
*/
if (!Myna) var Myna={}
/* Constructor: Myna.KeyStore
	Constructor function for KeyStore class
	
	Parameters:
		name		-	*Optional default null*
						A name for this keystore. This should be defined unless you 
						intend to <importPublicKeys>
	
*/
Myna.KeyStore = function(name){
	this.name = name;
	this.manager = new Myna.DataManager("myna_permissions").getManager("crypt_keys");
	this.exists = !!this.manager.find(this.name +":meta").length;
	if (this.exists) this.init();
}
/* Property: name
	name of this KeyStore
*/
/* Property: exists
	true if this keystore has been created.

	see:
	* <create>
	* <importPublicKeys>
*/
/* Function: init
	Initialized the keystore from the database.
	
	Should not be called directly
*/
Myna.KeyStore.prototype.init = function(){
	var $this = this;
	this.keys=[];
	
	new Myna.Query({
		ds:"myna_permissions",
		sql:<ejs>
			select
				 ck.name,
				 ck.key,
				 ck.created,
				 ck.type
			from CRYPT_KEYS ck
			where 
				type='keyczar' 
				and name like {name}	 
		</ejs>,
		values:{
			name:this.name +":%"	
		}
	}).data.forEach(function(row){
		var name = row.name.listAfter(":");
		if (name == "meta") {
			$this.meta = row.key;
		} else {
			$this.keys[name] = row.key	
		}
		
	})
	//Myna.printDump($this)
	if (!("meta" in this)){
		throw new Error("keystore '"+this.name+"' does not exist.")	
	}
	
	this.reader = new org.keyczar.interfaces.KeyczarReader ({
		getKey:function(version){
			if (version in $this.keys){
				return $this.keys[version];
			} else {
				throw new Error("invalid version " + version)	
			}
		},
		getMetadata:function(){
			return $this.meta	
		}
	})
}

/* Function: create
	Creates this KeyStore and sets its type
	
	Parameters:
		purpose		-	"crypt" or "sign"
		asymmetric	-	*Optional, default false*
							If true, this creates a private/public keystore.
	
	
	See:
	* <exportPublicKeys>
	* <importPublicKeys>
*/
Myna.KeyStore.prototype.create = function(purpose,asymmetric){
	var KeyPurpose = org.keyczar.enums.KeyPurpose;
	var KeyMetadata = org.keyczar.KeyMetadata;
	var KeyType = org.keyczar.DefaultKeyType;
	
	//if (this.exists) throw new Error("a keystore named '"+this.name+"' already exists.")
	
	if (!purpose) throw new Error("purpose is required");
	if (!asymmetric) asymmetric="";
	var kmd = null;
	
	switch (purpose.toLowerCase()) {
		case "sign":
			if (asymmetric) {
				kmd = new KeyMetadata(this.name, KeyPurpose.SIGN_AND_VERIFY, KeyType.RSA_PRIV);
				/* if (asymmetric.toLowerCase() == "rsa") {
					kmd = new KeyMetadata(this.name, KeyPurpose.SIGN_AND_VERIFY,
						KeyType.RSA_PRIV);
				} else if (asymmetric.toLowerCase() =="ec") {
						kmd = new KeyMetadata(this.name, KeyPurpose.SIGN_AND_VERIFY,
							KeyType.EC_PRIV);
				} else { // Default to DSA 
					kmd = new KeyMetadata(this.name, KeyPurpose.SIGN_AND_VERIFY,
						KeyType.DSA_PRIV);
				} */
			} else { // HMAC-SHA1
				kmd = new KeyMetadata(this.name, KeyPurpose.SIGN_AND_VERIFY,
					KeyType.HMAC_SHA1);
			}
		break;
		case "crypt":
			if (asymmetric) { // Default to RSA
				kmd = new KeyMetadata(this.name, KeyPurpose.DECRYPT_AND_ENCRYPT,
					KeyType.RSA_PRIV);
			} else { // AES
				kmd = new KeyMetadata(this.name, KeyPurpose.DECRYPT_AND_ENCRYPT,
					KeyType.AES);
			}
		break;
	}
	if (kmd == null) {
		throw new Error("KeyStore.UnsupportedPurpose : "+ purpose);
	}
	//save to db
	this.manager.create({
		name:this.name + ":meta",
		type:"keyczar",
		created:new Date(),
		key:kmd.toString()
	})

	this.init();	
}

/* Function: addKey
	generate a new key in this keystore
	
	Parameters:
		status		-	*Optional, default ACTIVE*
							one of "primary","active","inactive"
							
	See:
	* <promote>
	* <demote>
	* <revoke>
*/
Myna.KeyStore.prototype.addKey = function(status){
	if (!status) status="active";
	
	var GenericKeyczar = org.keyczar.GenericKeyczar;
	var KeyStatus = org.keyczar.enums.KeyStatus;
	var genericKeyczar = new GenericKeyczar(this.reader)
			
	var statusFlag=KeyStatus.getStatus(status);
	genericKeyczar.addVersion(statusFlag);
	
	this.saveKeyczar(genericKeyczar);
}

/* Function: promote
	increase the status of a key
	
	INACTIVE - > ACTIVE -> PRIMARY
							
	
*/
Myna.KeyStore.prototype.promote = function(keyNum){
	var GenericKeyczar = org.keyczar.GenericKeyczar;
	if (!keyNum) {
		throw new Error("KeyStore.MissingVersion");
	}
	var genericKeyczar = new GenericKeyczar(this.reader)
	genericKeyczar.promote(keyNum);
	this.saveKeyczar(genericKeyczar);
}

/* Function: demote
	decrease the status of a key
	
	PRIMARY -> ACTIVE -> INACTIVE  
	
*/
Myna.KeyStore.prototype.demote = function(keyNum){
	var GenericKeyczar = org.keyczar.GenericKeyczar;
	if (!keyNum) {
		throw new Error("KeyStore.MissingVersion");
	}
	var genericKeyczar = new GenericKeyczar(this.reader)
	genericKeyczar.demote(keyNum);
	this.saveKeyczar(genericKeyczar);
}

/* Function: revoke
	permanently removes a key
	
	Use this only for compromised keys! Any data encrypted with this key will be 
	lost!
	
*/
Myna.KeyStore.prototype.revoke = function(keyNum){
	var $this=this;
	var GenericKeyczar = org.keyczar.GenericKeyczar;
	if (!keyNum) {
		throw new Error("KeyStore.MissingVersion");
	}
	var genericKeyczar = new GenericKeyczar(this.reader)
	genericKeyczar.revoke(keyNum);
	this.saveKeyczar(genericKeyczar);
	this.keys[keyNum] = "REVOKED|" +this.keys[keyNum]; 
	$this.manager.create({
		name:$this.name + ":" + keyNum,
		type:"keyczar",
		created:new Date(),
		key:this.keys[keyNum]
	})
}

/* Function: importPublicKeys
	import a public keystore as generated by <exportPublicKeys>
	
	Parameters:
	pkjson		-	a JSON string containing a set of public keys generated by
						<exportPublicKeys>
						
	This function should only be called in a new KeyStore object  
	
*/
Myna.KeyStore.prototype.importPublicKeys = function(pkjson){
	var KeyPurpose = org.keyczar.enums.KeyPurpose;
	var KeyMetadata = org.keyczar.KeyMetadata;
	var KeyType = org.keyczar.DefaultKeyType;
	var KeyczarKey = org.keyczar.KeyczarKey;
	var KeyVersion = org.keyczar.KeyVersion;
	var GenericKeyczar = org.keyczar.GenericKeyczar;
	
	var $this =this;
	var ks = pkjson.parseJson();
	if (!this.name) this.name = ks.name;
	
	//lets just re-create
	/*if (this.manager.find(this.name+":meta").length){
		throw new Error("A keystore named '"+this.name+"' already exists")	
	}*/
	
	
	var md = ks.meta.key.parseJson();
	var kmd = new KeyMetadata(this.name, KeyPurpose[md.purpose],
							KeyType[md.type]);
	this.manager.create({
		name:this.name + ":meta",
		type:"keyczar",
		created:new Date(),
		key:kmd.toString()
	})
	this.init();
	
	var genericKeyczar = new GenericKeyczar(this.reader)
	
	ks.keys.forEach(function(row){
		var keyMeta =row.key.parseJson();
		//Myna.printDump("key meta ="+ key.toString())
		var key = KeyczarKey.readKey(KeyType[md.type],row.key)
		genericKeyczar.addKey(KeyVersion.read(row.version),key);
		Myna.println("key ="+ key.toString())
	})	
	this.saveKeyczar(genericKeyczar);
}

/* Function: exportPublicKeys
	export a set of public keys that match this keystore
	
	This function is only valid on asymmetric KeyStores  
	
*/
Myna.KeyStore.prototype.exportPublicKeys = function(){
	var KeyPurpose = org.keyczar.enums.KeyPurpose;
	var KeyMetadata = org.keyczar.KeyMetadata;
	var KeyType = org.keyczar.DefaultKeyType;
	var GenericKeyczar = org.keyczar.GenericKeyczar;
	var genericKeyczar = new GenericKeyczar(this.reader)
	
	kmd = genericKeyczar.getMetadata();
	// Can only export if type is DSA_PRIV and purpose is SIGN_AND_VERIFY
	var publicKmd = null;
	switch(kmd.getType()) {
		case KeyType.DSA_PRIV: // DSA Private Key
			if (kmd.getPurpose() == KeyPurpose.SIGN_AND_VERIFY) {
				publicKmd = new KeyMetadata(kmd.getName() + "_pubkey", KeyPurpose.VERIFY,
						KeyType.DSA_PUB);
			}
			break;
		case KeyType.RSA_PRIV: // RSA Private Key
			switch(kmd.getPurpose()) {
				case KeyPurpose.DECRYPT_AND_ENCRYPT:
					publicKmd = new KeyMetadata(kmd.getName() + "_pubkey", KeyPurpose.ENCRYPT,
							KeyType.RSA_PUB);
					break;
				case KeyPurpose.SIGN_AND_VERIFY:
					publicKmd = new KeyMetadata(kmd.getName() + "_pubkey", KeyPurpose.VERIFY,
							KeyType.RSA_PUB);
					break;
			}
			break;
	}
	if (publicKmd == null) {
		throw new Error("KeyczarTool.CannotExportPubKey type=" + kmd.getType() +", purpose=", kmd.getPurpose());
	}

	var result ={
		name:publicKmd.getName(),
		meta:{
			name:"meta",
			type:"keyczar",
			key:publicKmd.toString()
		},
		//primary:String(genericKeyczar.primaryVersion).parseJson().versionNumber,
		keys:[]
	};
	
	genericKeyczar.getVersions().toArray().forEach(function(key){
		result.keys.push({
			name:key.getVersionNumber(),
			type:"keyczar",
			version:key.toString(),
			key:genericKeyczar.getKey(key).getPublic().toString()
		})
	})

	return result.toJson();
}

/* Function: getKeyInfo
	returns an object containing metadata for this KeyStore
	
*/
Myna.KeyStore.prototype.getKeyInfo = function(){
	var GenericKeyczar = org.keyczar.GenericKeyczar;
	var genericKeyczar = new GenericKeyczar(this.reader)
	return genericKeyczar.getMetadata().toString().parseJson();
}

/* internal function for saving ketyczar data back to the DB
	
*/
Myna.KeyStore.prototype.saveKeyczar = function(genericKeyczar){
	var $this =this;
	//update metadata
	this.manager.getById(this.name+":meta").set_key(
		genericKeyczar.getMetadata().toString()
	)
	
	//updateKeys
	genericKeyczar.getVersions().toArray().forEach(function(key){
		$this.manager.create({
			name:$this.name + ":" + key.getVersionNumber(),
			type:"keyczar",
			created:new Date(),
			key:genericKeyczar.getKey(key).toString()
		})
	})
	this.init();
}

/* Function: encrypt
	encrypts data with this KeyStore
	
	Parameters:
	data	-	data to encrypt. Can be either a String or a byte array. The output 
				will be the same type as the input
	
	This function is only valid on "crypt" KeyStores.
	
*/
Myna.KeyStore.prototype.encrypt=function(data){
	return new org.keyczar.Encrypter(this.reader).encrypt(data);
}

/* Function: decrypt
	decrypts data with this KeyStore
	
	Parameters:
	data	-	data to decrypt. Can be either a String or a byte array. The output 
				will be the same type as the input
	
	This function is only valid on "crypt" KeyStores.
	
*/
Myna.KeyStore.prototype.decrypt=function(cypherText){
	return new org.keyczar.Crypter(this.reader).decrypt(cypherText);
}

/* Function: sign
	signs data with this KeyStore
	
	Parameters:
	data	-	data to sign. Can be either a String or a byte array. The output 
				will be the same type as the input
	
	This function is only valid on "sign" KeyStores.
	
*/
Myna.KeyStore.prototype.sign=function(data){
	return new org.keyczar.Signer(this.reader).sign(data);
}

/* Function: verify
	verifies that _data_ matches _sig_ with this KeyStore
	
	Parameters:
	data	-	data to verify. Can be either a String or a byte array, but must 
				match _sig_. 
	sig	-	signature to verify. Can be either a String or a byte array, but 
				must match _data_. 
	
	This function is only valid on "sign" KeyStores.
	
*/
Myna.KeyStore.prototype.verify=function(data,sig){
	return new org.keyczar.Verifier(this.reader).verify(data,sig);
}