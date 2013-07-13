/* ----- CLASS: Date_MissingTests ------------------------------------------ */
	function Date_MissingTests(name){
		TestCase.call( this, name );
		
	}
	
	Date_MissingTests.prototype = new TestCase();
	/* ----- testExists ---------------------------------------------------- */
		Date_MissingTests.prototype.testExists = function(testName){
			var classes=[Date_General]
			for (var class_idx=0; class_idx < classes.length; ++class_idx){
				if (classes[class_idx]
					.prototype
					.hasOwnProperty("test_"+testName)
				) return true;
			}
				
			return false;
		}
	/* genereate tests for missing tests */
		Date.prototype.getProperties().filter(function(name){
			return Date.prototype.hasOwnProperty(name); 
		}).forEach(function(name){
			Date_MissingTests.prototype["test_" + name]=function(){
				this.assertTrue("No test defined for Date::" +name,this.testExists(name));
			}
		})
/* ----- CLASS: Date_General ----------------------------------------------- */
	function Date_General(name){ TestCase.call( this, name );}
	Date_General.prototype = new TestCase();
	/* ------ toString ----------------------------------------------------- */
		Date_General.prototype.test_toString=function(){
			/* var rootPath = new Date("/").toString();
			var sharedPath = new Date("/shared").toString();
			var currentPath = new Date(".").toString();
			var spacePath  = new Date("this is a Wacky Date name.doc").toString();
			this.assertEquals("convert relative to absolute","Date:/",rootPath.left("Date:/".length))
			this.assertEquals("encode uri",currentPath +"this%20is%20a%20Wacky%20Date%20name.doc",spacePath)
			 */
		}
		
	