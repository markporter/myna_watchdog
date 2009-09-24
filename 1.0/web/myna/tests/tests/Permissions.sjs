/* ----- CLASS: Permissions_MissingTests ------------------------------------ */
	function Permissions_MissingTests(name){
		TestCase.call( this, name );
		
	}
	
	Permissions_MissingTests.prototype = new TestCase();
	
	/* generate tests for missing tests */
		Myna.Permissions.getProperties().filter(function(name){
			if ([
				"User",
				"Right",
				"Role",
				"UserGroup",
				"addUsers"
			].join().listContains(name)) return false;
			return Myna.Permissions.hasOwnProperty(name); 
		}).forEach(function(name){
			Permissions_MissingTests.prototype["test_" + name]=function(){
				this.assertTrue("No test defined for Permissions::" +name,
					Permissions_General.prototype.hasOwnProperty("test_"+name)
				);
			}
		})
		
		Myna.Permissions.User.prototype.getProperties().filter(function(name){
			if ([
				"get_last_name",
				"set_last_name",
				"get_middle_name",
				"set_middle_name",
				"get_first_name",
				"set_first_name",
				"get_Title",
				"set_Title",
				"isActive",
				"getLoginList",
				"get_user_id",
				"qryRights",
				"hasRight"
			].join().listContains(name)) return false;
			
			return Myna.Permissions.User.prototype.hasOwnProperty(name); 
		}).forEach(function(name){
			Permissions_MissingTests.prototype["test_" + name]=function(){
				this.assertTrue("No test defined for Permissions.User::" +name,
					User_General.prototype.hasOwnProperty("test_"+name)
				);
			}
		})
		
		Myna.Permissions.UserGroup.prototype.getProperties().filter(function(name){
			if ([
				"addUsers",
				"qryUsers",
				"qryRights",
				"removeUsers",
			].join().listContains(name)) return false;
			
			return Myna.Permissions.UserGroup.prototype.hasOwnProperty(name); 
		}).forEach(function(name){
			Permissions_MissingTests.prototype["test_" + name]=function(){
				this.assertTrue("No test defined for Permissions.UserGroup::" +name,
					UserGroup_General.prototype.hasOwnProperty("test_"+name)
				);
			}
		})
/* ----- CLASS: Permissions_General ----------------------------------------- */
	function Permissions_General(name){ TestCase.call( this, name );}
	Permissions_General.prototype = new TestCase();
	Permissions_General.prototype.setUp = function(){
		this.user = Myna.Permissions.addUser({
			first_name:"Test",
			middle_name:"A.",
			last_name:"User",
			title:"Mr"
		});
		
		this.user2 = Myna.Permissions.addUser({
			first_name:"Test2",
			middle_name:"A.",
			last_name:"User2",
			title:"Mrs"
		});
		
		this.user3 = Myna.Permissions.addUser({
			first_name:"Test3",
			middle_name:"A.",
			last_name:"User3",
			title:"Lady"
		});
	}
	Permissions_General.prototype.tearDown = function(){
		try {
			
			new Myna.Query({
				ds:"myna_permissions",
				sql:<ejs>
					delete from users where first_name like 'Test%'
						and last_name like 'User%'
				</ejs>
			})
			new Myna.Query({
				ds:"myna_permissions",
				sql:<ejs>
					delete from user_groups where appname = 'test'
				</ejs>
			})
			new Myna.Query({
				ds:"myna_permissions",
				sql:<ejs>
					delete from rights where appname = 'test'
				</ejs>
			})
			
		} catch(e){
			Myna.log("error","permissions_general tearDown error", Myna.formatError(e));	
		}
	};
	
	/* ------ main ----------------------------------------------------------- */
		Permissions_General.prototype.test_main=function(){
			var ug = Myna.Permissions.addUserGroup({
				name:"TestGroup",
				appname:"test"
			})
			
			ug.addUsers([
				this.user.get_user_id(),
				this.user2.get_user_id(),
				this.user3.get_user_id(),
			])
			
			var qry = ug.qryUsers();
			this.assertEquals("user group should have 3 members",3,qry.data.length);
			
			ug.removeUsers(this.user3.get_user_id());
			qry = ug.qryUsers();
			this.assertEquals("user group should have 2 members",2,qry.data.length);
			
			var right_list = Array.dim(3).map(function(e,index){
				var right = Myna.Permissions.addRight({
					name:"right" + index,
					appname:"test",
					description:"A test right #" + index
				});
				return right.get_right_id();
			})
			ug.addRights(right_list);
			qry = ug.qryRights();
			this.assertEquals("user group should have 3 rights",3,qry.data.length);
			qry = this.user.qryRights();
			this.assertEquals("user should have 3 rights",3,qry.data.length);
			
			this.assertTrue("user should have right1 right",this.user.hasRight("test","right1"));
		
		}
	/* ------ addUser -------------------------------------------------------- */
		Permissions_General.prototype.test_addUser=function(){
			var user = Myna.Permissions.addUser({
				first_name:"Test",
				middle_name:"A.",
				last_name:"User",
				title:"Mr"
			});
			this.assertEquals(user.get_first_name(),"Test");
		}
		

	/* ------ addRight ------------------------------------------------------- */
		Permissions_General.prototype.test_addRight=function(){
			//Myna.log("debug","permissions",Myna.dump(Myna.Permissions.getProperties()));
			var right = Myna.Permissions.addRight({
				name:"TestRight",
				appname:"test",
				description:"A test right"
			});
			this.assertEquals(right.get_name(),"TestRight");
		}
	/* ------ getRightById ------------------------------------------------------- */
		Permissions_General.prototype.test_getRightById=function(){
			//Myna.log("debug","permissions",Myna.dump(Myna.Permissions.getProperties()));
			var right = Myna.Permissions.addRight({
				name:"TestRight",
				appname:"test",
				description:"A test right"
			});
			this.assertEquals(Myna.Permissions.getRightById(right.get_right_id()).get_right_id(),right.get_right_id());
		}	
	
	/* ------ deleteRight ------------------------------------------------------- */
		Permissions_General.prototype.test_deleteRight=function(){
			//Myna.log("debug","permissions",Myna.dump(Myna.Permissions.getProperties()));
			var right = Myna.Permissions.addRight({
				name:"TestRight",
				appname:"test",
				description:"A test right"
			});
			var right_id = right.get_right_id();
			Myna.Permissions.deleteRight(right_id)
			this.assertEquals("right should not exist",Myna.Permissions.getRightById(right_id),null);
		}
		
	/* ------ deleteUserGroup --------------------------------------------------- */
		Permissions_General.prototype.test_deleteUserGroup=function(){
			//Myna.log("debug","permissions",Myna.dump(Myna.Permissions.getProperties()));
			var user_group = Myna.Permissions.addUserGroup({
				name:"TestUserGroup",
				appname:"test",
				description:"A test user group"
			});
			var id = user_group.get_user_group_id();
			Myna.Permissions.deleteUserGroup(id);
			this.assertEquals(Myna.Permissions.getUserGroupById(id),null);
		}
	/* ------ getUserGroupById ---------------------------------------------------- */
		Permissions_General.prototype.test_getUserGroupById=function(){
			var UserGroup = Myna.Permissions.addUserGroup({
				name:"TestUserGroup",
				appname:"test",
				description:"A test user group"
			});
			this.assertEquals(Myna.Permissions.getUserGroupById(UserGroup.get_user_group_id()).get_name(),"TestUserGroup");
		}
	/* ------ addUserGroup --------------------------------------------------- */
		Permissions_General.prototype.test_addUserGroup=function(){
			//Myna.log("debug","permissions",Myna.dump(Myna.Permissions.getProperties()));
			var user_group = Myna.Permissions.addUserGroup({
				name:"TestUserGroup",
				appname:"test",
				description:"A test user group"
			});
			this.assertEquals(user_group.get_name(),"TestUserGroup");
		}
	/* ------ getUserById ---------------------------------------------------- */
		Permissions_General.prototype.test_getUserById=function(){
			var user = Myna.Permissions.addUser({
				first_name:"Test",
				middle_name:"A.",
				last_name:"User",
				title:"Mr"
			});
			this.assertEquals(Myna.Permissions.getUserById(user.get_user_id()).get_first_name(),"Test");
			this.assertEquals(Myna.Permissions.getUserById("ksdjhfkj sdflhsadlfkjhasdf"),null);
		}
	
	/* ------ getUserByLogin ------------------------------------------------- */
		Permissions_General.prototype.test_getUserByLogin=function(){
			var user = Myna.Permissions.addUser({
				first_name:"Test",
				middle_name:"A.",
				last_name:"User",
				title:"Mr"
			});
			var login = Myna.createUuid();
			user.setLogin({type:"test",login:login});
			this.assertEquals(Myna.Permissions.getUserByLogin("test",login).get_first_name(),"Test");
			this.assertEquals(Myna.Permissions.getUserByLogin("ksdjhfkj","sdflhsadlfkjhasdf"),null);
		}
	/* ------ getAuthKey ------------------------------------------------- */
		Permissions_General.prototype.test_getAuthKey=function(){
			
			this.assertTrue(Myna.Permissions.getAuthKey("test").length);
		}
	/* ------ getAuthToken ------------------------------------------------- */
		Permissions_General.prototype.test_getAuthToken=function(){
			
			this.assertTrue(Myna.Permissions.getAuthToken("test").length);
		}
	/* ------ consumeAuthToken ------------------------------------------------- */
		Permissions_General.prototype.test_consumeAuthToken=function(){
			var token = Myna.Permissions.getAuthToken("test")
			this.assertEquals(Myna.Permissions.consumeAuthToken(token),"test");
			this.assertEquals("second call with same token",Myna.Permissions.consumeAuthToken(token),null);
			
		}
	
/* ----- CLASS: User_General ------------------------------------------------ */
	function User_General(name){ TestCase.call( this, name );}
	User_General.prototype = new TestCase();
	User_General.prototype.setUp = function(){
		this.user = Myna.Permissions.addUser({
			first_name:"Test",
			middle_name:"A.",
			last_name:"User",
			title:"Mr"
		});
		
		this.user2 = Myna.Permissions.addUser({
			first_name:"Test2",
			middle_name:"A.",
			last_name:"User2",
			title:"Mrs"
		});
		
		this.user3 = Myna.Permissions.addUser({
			first_name:"Test3",
			middle_name:"A.",
			last_name:"User3",
			title:"Lady"
		});
	}
	User_General.prototype.tearDown = function(){
		try {
			
			new Myna.Query({
				ds:"myna_permissions",
				sql:<ejs>
					delete from users where first_name like 'Test%'
						and last_name like 'User%'
				</ejs>
			})
			new Myna.Query({
				ds:"myna_permissions",
				sql:<ejs>
					delete from user_groups where appname = 'test'
				</ejs>
			})
			new Myna.Query({
				ds:"myna_permissions",
				sql:<ejs>
					delete from rights where appname = 'test'
				</ejs>
			})
			
		} catch(e){
			Myna.log("error","permissions_general tearDown error", Myna.formatError(e));	
		}
	};
	/* ------ main ----------------------------------------------------------- */
		User_General.prototype.test_main=function(){
			this.user.setLogin({type:"myna",login:"tuser",password:"test"})
			
			this.assertTrue("logins do not contain 'tuser'",
				this.user.getLoginList().listContains("myna:tuser")
			);
			this.assertTrue("password is wrong",
				this.user.isCorrectPassword("tuser","test")
			);
		}
	/* ------ isCorrectPassword ---------------------------------------------- */
		User_General.prototype.test_isCorrectPassword=function(){
			var user = Myna.Permissions.addUser({
				first_name:"Test",
				middle_name:"A.",
				last_name:"User",
				title:"Mr"
			});
			var login = Myna.createUuid();
			user.setLogin({type:"myna",login:login,password:"bob"});
			this.assertTrue(user.isCorrectPassword(login,"bob"),"Test");
		}
	/* ------ inactivate ---------------------------------------------- */
		User_General.prototype.test_inactivate=function(){
			var user = Myna.Permissions.addUser({
				first_name:"Test",
				middle_name:"A.",
				last_name:"User",
				title:"Mr"
			});
			user.inactivate();
			var dbUser = new Myna.DataManager("myna_permissions").getManager("users").getById(user.get_user_id());
			this.assertTrue(dbUser.get_inactive_ts() instanceof Date);
			this.assertFalse(user.isActive());
		}
	/* ------ inactivate ---------------------------------------------- */
		User_General.prototype.test_reactivate=function(){
			var user = Myna.Permissions.addUser({
				first_name:"Test",
				middle_name:"A.",
				last_name:"User",
				title:"Mr"
			});
			user.inactivate();
			user.reactivate();
			var dbUser = new Myna.DataManager("myna_permissions").getManager("users").getById(user.get_user_id());
			this.assertTrue(!dbUser.get_inactive_ts());
			this.assertTrue(user.isActive());
		}
	/* ------ setLogin ------------------------------------------------------- */
		User_General.prototype.test_setLogin=function(){
			this.user.setLogin({type:"myna",login:"bdobb",password:"slack"})
			var qry = new Myna.Query({
					ds:this.user.dao.ds,
					sql:<ejs>
						select * 
						from user_logins 
						where 
							user_id = {user_id} 
							and login = {login}
							and type= {type}
					</ejs>,
					values:{
						type:"myna",
						login:"bdobb",
						user_id:this.user.get_user_id()
					}
			})
			
			this.assertEquals(qry.data[0].login,"bdobb");
		}
	/* ------ getLogins ----------------------------------------------------- */
		User_General.prototype.test_getLogins=function(){
			this.user.setLogin({type:"myna",login:"bdobb",password:"slack"})
			this.assertTrue("logins do not contain 'bdobb'",
				this.user.getLoginList().listContains("myna:bdobb")
			);
		}
/* ----- CLASS: UserGroup_General ------------------------------------------- */
	function UserGroup_General(name){ TestCase.call( this, name );}
	UserGroup_General.prototype = new TestCase();
	UserGroup_General.prototype.tearDown = function(){
		try {
			
			new Myna.Query({
				ds:"myna_permissions",
				sql:<ejs>
					delete from users where first_name like 'Test%'
						and last_name like 'User%'
				</ejs>
			})
			new Myna.Query({
				ds:"myna_permissions",
				sql:<ejs>
					delete from user_groups where appname = 'test'
				</ejs>
			})
			new Myna.Query({
				ds:"myna_permissions",
				sql:<ejs>
					delete from rights where appname = 'test'
				</ejs>
			})
			
		} catch(e){
			Myna.log("error","permissions_general tearDown error", Myna.formatError(e));	
		}
	};
	/* ------ main ----------------------------------------------------------- */
		UserGroup_General.prototype.test_main=function(){
			
		}
	/* ------ addRights ------------------------------------------------------ */
		UserGroup_General.prototype.test_addRights=function(){
			
		}