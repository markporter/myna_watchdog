var type="myna"

function userExists(username){
	return Myna.Permissions.getUserByLogin("myna",username) != null;
}

function isCorrectPassword(username,password){
	var user = Myna.Permissions.getUserByLogin("myna",username)
	if (!user) return false
	return user.isCorrectPassword(username,password);
}

function searchUsers(search){
	var qry= new Myna.Query({
		dataSource:"myna_permissions",
		sql:<ejs>
			select
				login,
				COALESCE(u.first_name,'') as first_name,
				COALESCE(u.last_name,'') as last_name,
				COALESCE(u.middle_name,'') as middle_name,
				COALESCE(u.email,'') as email,
				COALESCE(u.title,'') as title
			from 
				user_logins ul,
				users u					
			where u.user_id = ul.user_id
			and type ='myna'
			<@if search.length>
				and (
					lower(user_login_id) = {searchExact}
					OR lower(login) = {searchExact}
					OR lower(u.user_id) = {searchExact}
					OR lower(first_name) like {searchFirst}
					OR lower(last_name) like {searchFirst}
					OR lower(email) like {search}
				)
			</@if>
			order by last_name,first_name,login 
		</ejs>,
		values:{
			searchFirst:"%" + search.toLowerCase(),
			searchExact:search.toLowerCase(),
			search:"%" + search.toLowerCase() + "%",
		},
	})
	Myna.log("debug","myna search ",Myna.dump(qry));
	return qry.data;
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