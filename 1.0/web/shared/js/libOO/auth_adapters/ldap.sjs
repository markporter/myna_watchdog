var type="ldap"

//check the config file for needed values
this.config.checkRequired([
   "server",
   "search_columns"   
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
      Myna.log("warning","Auth type '"  + this.config.auth_type+ "': duplicate DN for username '"+usernam+"'",Myna.dump($req.data));
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
   var qry ="(|";
   
   this.config.search_columns.split(/,/).forEach(function(col){
       qry +="("+col+"=*" + search +"*)"
   })
   
   qry +=")";
   
   var attributes="cn";
   this.config.map.forEach(function(v,p){
      attributes = attributes.listAppend(v);
   })
   
   Myna.print(qry + "|" + attributes)
   var $this = this;
	return new Myna.DataSet({
      data:ldap.search(qry,attributes).map(function(row){
         var result = {
            login:"",
            first_name:"",
            last_name:"",
            middle_name:"",
            title:""
         }
         Myna.print(Myna.dump(row))
         $this.config.map.forEach(function(v,p){
            result[p] = row.attributes[v][0];
         })
               
         return result
               
      }),
		columns:"login,first_name,last_name,middle_name,title"
	})
   
}

function getUserId(login){
	return Myna.Permissions.getUserByLogin("myna",username).get_user_id()
}

function getUserByLogin(login){
	var qry= new Myna.Query({
		dataSource:"myna_permissions",
		sql:<ejs>
			select
				login,
				u.first_name,
				u.middle_name,
				u.last_name,
				u.title
			from 
				user_logins ul,
				users u					
			where u.user_id = ul.user_id
			and type ='myna'
			and login ={login}
		</ejs>,
		values:{
			login:login,
		},
	})
	return qry.data.length?qry.data[0]:null;
}