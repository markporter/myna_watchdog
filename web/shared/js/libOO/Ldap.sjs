/*    Class: Myna.Ldap
        Represents a connection to an LDAP server
   
*/
if (!Myna) Myna={}

/* Constructor: Ldap
    Contructs a new Ldap connection
   
    Parameters:
        server          		-	*REQUIRED* Server and initial subtree to connect to.
                        		 		> ldap://server.yourdomain.com:389/o=top,ou=people
                        		 		> ldaps://server.yourdomain.com:636/o=top,ou=people
        username        		-	Optional default null* 
        							Fully qualified username to log in as
                        		 		> cn=name,ou=department,o=ldap_root
        password        		-	*Optional default null* 
        							password for user
        acceptSelfSignedCerts	-	*Optional default true* 
        							By default secure ldap connections will 
        							accept self-signed certs. Set this to false 
        							to throw an exception. 
    */
    Myna.Ldap = function(server,username,password,acceptSelfSignedCerts){
    	if (acceptSelfSignedCerts === undefined) acceptSelfSignedCerts=true;
        this.server = server;
        this.user = username;
        this.password = password;
        
        var Context = Packages.javax.naming.Context;
        var directory = Packages.javax.naming.directory;
       
        var env = new java.util.Hashtable();
        //env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
        env.put(Context.PROVIDER_URL, this.server);
        if (acceptSelfSignedCerts && /^ldaps/i.test(server)){
			env.put("java.naming.ldap.factory.socket", "info.emptybrain.myna.AcceptAllSSLSocketFactory");
		}
       
        
        env.put(Context.REFERRAL, "follow");

        if (this.user){
           env.put(Context.SECURITY_AUTHENTICATION, "simple");
            env.put(Context.SECURITY_PRINCIPAL, this.user);
            env.put(Context.SECURITY_CREDENTIALS, this.password);
        } else {
            env.put(Context.SECURITY_AUTHENTICATION, "none");  
        }
       
        // Create the initial context
        //var ctx = new directory.InitialDirContext(env);
        this.ctx = new Packages.com.sun.jndi.ldap.LdapCtxFactory.getLdapCtxInstance(this.server,env);
		  $application.addOpenObject(this.ctx);
        this.env = env
    }
   
/* Function: search
    Searches an LDAP repository
   
    Parameters:
        searchString    -     *REQUIRED* search to perform
                            > (cn=mporter)
                            > (&(orgcode=01018346)(positioncode=80569))
        attributes        -    *Optional default null* a comma separated list of attributes to
                            retrieve from the ldap server. If not specified, all attributes
                            are returned
    Returns:
        An array of ldap results that looks like this
        (code)
            result = (Array)
            |
            +--[0] = (Object)
                |
                +-- name = (String) fully qualified name of result node
                |
                +-- attributes = (Object)
                    |
                    +--<attribute name> = (Array)
                        |
                        +--[0] = (String)
        (end)
     
    */
    Myna.Ldap.prototype.search=function(searchString,attributes){
        if (!attributes || !attributes.length) attributes =null
   
       
        if (typeof attributes == "string"){
            attributes = attributes.split(/,/);
        }
       
        var Context = Packages.javax.naming.Context;
        var directory = Packages.javax.naming.directory;
        var ctx = this.ctx;
        var env = this.env;
        var ctls = new directory.SearchControls();
        ctls.setReturningAttributes(attributes);
        ctls.setSearchScope(directory.SearchControls.SUBTREE_SCOPE);
       
        var namingEnum = ctx.search("", searchString, ctls);
       
        var result=[];
   
        while (namingEnum.hasMoreElements()){
            var curObj = namingEnum.next();
           
            result.push({
                name:String(curObj.getName()),
                attributes:function(curObj){
                    var attributesArray=Myna.enumToArray(curObj.getAll());
                    var attributesObject ={}
                    for (var x = 0; x < attributesArray.length; ++x ){
                        var array = Myna.enumToArray(attributesArray[x].getAll());
                       
                        attributesObject[attributesArray[x].getID()] = array.map(function(element){
                            return String(element);
                        });
                    }
                    return attributesObject;
                }(curObj.getAttributes())
            })   
        }
        return result;
    }