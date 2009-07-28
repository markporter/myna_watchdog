var type="ldap"

//check the config file for needed values
this.config.checkRequired([
   "server",
   "search_columns",
   "map"   
])
this.config.map.checkRequired([
    "login",
    "first_name",
    "last_name"
])

var ldap;
if (this.config.username){
   ldap = new Myna.Ldap(this.config.server, this.config.username,this.config.password);
} else {
   ldap = new Myna.Ldap(this.config.server);  
}


function userExists(username){
   var searchString="("+this.config.map.login+"="+username+")";
	return !!ldap.search(searchString).length;
}

function getDN(username){
   var searchString="(cn="+username+")";
   var users = ldap.search(searchString);
   if (users.length == 1) return users[0].name
   if (users.length > 1) {
      Myna.log("warning","Auth type '"  + this.config.auth_type+ "': duplicate DN for username '"+username+"'",Myna.dump($req.data));
   }
   return null;
}

function isCorrectPassword(username,password){
   var dn = this.getDN(username);
   if (!dn) return false;
   //try to auth against the ldap server, and serch for this dn
   try {
      new Myna.Ldap(this.config.server, dn, password);
      return true;
   } catch(e){return false}
}

function searchUsers(search){
   var $this = this;
   var qry ="(|";
   
   $this.config.search_columns.split(/,/).forEach(function(col){
       qry +="("+col+"=*" + search +"*)"
   })
   
   qry +=")";
   
   if ($this.config.filter){
        qry = "(&" + $this.config.filter + qry + ")"
   }
   
   var attributes="cn";
   $this.config.map.forEach(function(v,p){
      attributes = attributes.listAppend(v);
   })
   
   return new Myna.DataSet({
      data:$this.ldap.search(qry,attributes).map(function(row){
         var result = {
            login:"",
            first_name:"",
            last_name:"",
            middle_name:"",
            title:""
         }
         $this.config.map.forEach(function(ldap_attribute,myna_attribute){
             if (ldap_attribute in row.attributes){
                result[myna_attribute] = row.attributes[ldap_attribute][0];
             }
         })
         if (result.login.length) return result
               
      }),
		columns:"login,first_name,last_name,middle_name,title"
   })
   
}



function getUserByLogin(login){
   var $this = this;
   var qry ="("+ $this.config.map.login+ "="+login+")";
      
   if ($this.config.filter){
        qry = "(&" + $this.config.filter + qry + ")"
   }
        
   return $this.ldap.search(qry).map(function(row){
     var result = {
        login:"",
        first_name:"",
        last_name:"",
        middle_name:"",
        title:""
     }
     $this.config.map.forEach(function(ldap_attribute,myna_attribute){
         if (ldap_attribute in row.attributes){
            result[myna_attribute] = row.attributes[ldap_attribute][0];
         }
     })
     if (result.login.length) return result
  })[0];
   
}