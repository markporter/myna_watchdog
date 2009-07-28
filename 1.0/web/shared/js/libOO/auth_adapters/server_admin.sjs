var type="server_admin";

//only one user, 'admin'
function userExists(username){
	return username.toLowerCase() == 'admin';
}

function isCorrectPassword(username,password){
	return password.hashEquals(Myna.getGeneralProperties().admin_password)
}

function searchUsers(search){
	var admin = {
			login:"admin",
			first_name:"Myna",
			last_name:"Administrator",
			middle_name:"",
			title:""
		}
	return new Myna.DataSet({
		data:[admin],
		columns:admin
	})
}


function getUserByLogin(login){
	return {
		login:"admin",
		first_name:"Myna",
		last_name:"Administrator",
		middle_name:"",
		title:""
	}
}