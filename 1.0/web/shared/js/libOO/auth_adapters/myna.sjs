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
				u.first_name,
				u.middle_name,
				u.last_name,
				u.title
			from 
				user_logins ul,
				users u					
			where u.user_id = ul.user_id
			and type ='myna'
			<@if data.search.length>
				and lower(user_login_id || login  || u.user_id ) like {search}
			</@if>
			order by last_name,first_name,login 
		</ejs>,
		values:{
			search:"%" + search.toLowerCase() + "%",
		},
	})
	return qry.data;
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