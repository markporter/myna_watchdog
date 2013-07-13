/* ----- CLASS: File_MissingTests ------------------------------------------ */
	function File_MissingTests(name){
		TestCase.call( this, name );
		
	}
	
	File_MissingTests.prototype = new TestCase();
	/* ----- testExists ---------------------------------------------------- */
		File_MissingTests.prototype.testExists = function(testName){
			var classes=[File_General]
			for (var class_idx=0; class_idx < classes.length; ++class_idx){
				if (classes[class_idx]
					.prototype
					.hasOwnProperty("test_"+testName)
				) return true;
			}
				
			return false;
		}
	/* genereate tests for missing tests */
		Myna.File.prototype.getProperties().filter(function(name){
			return Myna.File.prototype.hasOwnProperty(name); 
		}).forEach(function(name){
			File_MissingTests.prototype["test_" + name]=function(){
				this.assertTrue("No test defined for Myna.File::" +name,this.testExists(name));
			}
		})
/* ----- CLASS: File_General ----------------------------------------------- */
	function File_General(name){ TestCase.call( this, name );}
	File_General.prototype = new TestCase();
	/* ------ toString ----------------------------------------------------- */
		File_General.prototype.test_toString=function(){
			var rootPath = new Myna.File("/").toString();
			var sharedPath = new Myna.File("/shared").toString();
			var currentPath = new Myna.File(".").toString();
			var spacePath  = new Myna.File("this is a Wacky File name.doc").toString();
			this.assertEquals("convert relative to absolute","file:/",rootPath.left("file:/".length))
			this.assertEquals("encode uri",currentPath +"this%20is%20a%20Wacky%20File%20name.doc",spacePath)
			
		}
		
	/* ------ exists ------------------------------------------------------- */
		File_General.prototype.test_exists=function(){
			this.assertTrue("Should Exist",new Myna.File("/WEB-INF").exists());
			this.assertFalse("Should Not Exist",new Myna.File("/Womp the snoffle").exists());
		}

	/* ------ forceDelete/deleteFile---------------------------------------- */
		File_General.prototype.test_forceDelete=function(){
			var dir =new Myna.File($server.tempDir +"/some_dir")
			dir.createDirectory();
			var subDir =new Myna.File(dir.toString() +"/some_sub_dir");
			subDir.createDirectory();
			var file = new Myna.File(subDir.toString() +"/some_file");
			file.writeString("blah")
			
			dir.forceDelete();
			this.assertFalse(file +" Should Not Exist",file.exists());
		}
		File_General.prototype.test_deleteFile=function(){}
	/* ------ readBinary/writeBinary --------------------------------------- */
		File_General.prototype.test_readBinary=function(){
			var src = new Myna.File("/WEB-INF/lib/js.jar")
			var dest = new Myna.File("/WEB-INF/lib/js.jar")
			var src_array =src.readBinary()
			dest.writeBinary(src_array);
			var dest_array =dest.readBinary()
			
			var result = src_array.filter(function(b,index){
				return b != dest_array[index];
			})
			
			
			this.assertTrue("binary copy does not match",result.length == 0);
		}
		// see test_readBinary
		File_General.prototype.test_writeBinary=function(){}
		
	/* ------ readString/writeString --------------------------------------- */
		File_General.prototype.test_readString=function(){
			var src = new Myna.File($server.currentDir + $server.scriptName);
			var dest = new Myna.File($server.tempDir + $server.scriptName);
			var src_string =src.readString()
			dest.writeString(src_string);
			var dest_string =dest.readString()
			
			this.assertSame("string copy does not match",src_string,dest_string);
		}
		// see test_readString
		File_General.prototype.test_writeString=function(){}	
		
	/* ------ createDirectory ---------------------------------------------- */
		//see forceDelete
		File_General.prototype.test_createDirectory=function(){}	
	
	/* ------ getDirectory ------------------------------------------------- */
		File_General.prototype.test_getDirectory=function(){
			var index = new Myna.File("./index.sjs")
			var currentDir = new Myna.File("./index.sjs").getDirectory();
			
			
			this.assertSame("string copy does not match",currentDir + "index.sjs",index.toString());
		}
	/* ------ getDirectoryPath --------------------------------------------- */
		File_General.prototype.test_getDirectoryPath=function(){
			var index = new Myna.File("./index.sjs")
			var currentDir = new Myna.File("./index.sjs").getDirectoryPath();
			
			
			this.assertSame("string copy does not match",currentDir + "index.sjs",index.toString());
		}
	/* ------ getFileName -------------------------------------------------- */
		File_General.prototype.test_getFileName=function(){
			var index = new Myna.File("./index.sjs")
			
			
			this.assertSame("string copy does not match","index.sjs",index.getFileName());
		}
	/* ------ readLines --------------------------------------------------- */
		File_General.prototype.test_readLines=function(){
			var lines = "1,2,3,4,5";
			var file = new Myna.File($server.tempDir + "/linesTest")
			file.writeString(lines.split(/,/).join("\n"));
			
			
			this.assertSame("readLines",lines,file.readLines().join(","));
		}	
	/* ------ listFiles ---------------------------------------------------- */
		File_General.prototype.test_listFiles=function(){
			var dir = new Myna.File($server.tempDir + "/listTests")
			dir.createDirectory();
			new Myna.File(String(dir) + "/test1.doc").writeString("test")
			new Myna.File(String(dir) + "/test2.doc").writeString("test")
			new Myna.File(String(dir) + "/test3.js").writeString("test")
			var subDir = new Myna.File(String(dir) + "/sub_dir")
			subDir.createDirectory();
			new Myna.File(String(subDir) + "/test4.doc").writeString("test")
			new Myna.File(String(subDir) + "/test5.js").writeString("test")
			
			var defaultList = dir.listFiles().map(function(file){
				return file.getFileName();
			}).sort().join(",")
			
			var defaultListRecursive = dir.listFiles(null,true).map(function(file){
				return file.getFileName();
			}).sort().join(",")
			
			var extList = dir.listFiles("js,sql").map(function(file){
				return file.getFileName();
			}).sort().join(",")
			
			var extListRecursive = dir.listFiles("js,sql",true).map(function(file){
				return file.getFileName();
			}).sort().join(",")
			
			this.assertEquals("default listFiles","test1.doc,test2.doc,test3.js",defaultList);
			this.assertEquals("default listFiles recursive","test1.doc,test2.doc,test3.js,test4.doc,test5.js",defaultListRecursive);
			this.assertEquals("default listFiles recursive","test3.js",extList);
			this.assertEquals("default listFiles recursive","test3.js,test5.js",extListRecursive);
		}
		
	/* ------ extractZip --------------------------------------------------- */
		File_General.prototype.test_extractZip=function(){
			var dir = new Myna.File($server.tempDir + "/copyTests")
			dir.forceDelete();
			dir.createDirectory();
			var files = new Myna.File("/WEB-INF/lib/js.jar").extractZip(dir);
			
			var test = this;
			files.forEach(function(path){
				test.assertTrue(path + " should exist",new Myna.File(path).exists());
			})
		}
	/* ------ copyTo ---------------------------------------------------- */
		File_General.prototype.test_copyTo=function(){
			var dir = new Myna.File($server.tempDir + "/copyTests")
			dir.forceDelete();
			dir.createDirectory();
			var file1 =new Myna.File(String(dir) + "/test1.doc");
			file1.writeString("test");
			new Myna.File(String(dir) + "/test2.doc").writeString("test")
			new Myna.File(String(dir) + "/test3.js").writeString("test")
			var subDir = new Myna.File(String(dir) + "/sub_dir")
			subDir.createDirectory();
			new Myna.File(String(subDir) + "/test4.doc").writeString("test")
			new Myna.File(String(subDir) + "/test5.js").writeString("test")
			
			
			var newDir  = new Myna.File($server.tempDir + "/copyTests_new");
			newDir.forceDelete();
			file1.copyTo(newDir+"/test_copy.doc");
			this.assertTrue("copy file to file, creating directory",new Myna.File(newDir+"/test_copy.doc").exists())
			file1.copyTo(newDir);
			this.assertTrue("copy file to dir",new Myna.File(newDir+"/test1.doc").exists())
			dir.copyTo(newDir);
			this.assertTrue("copy dir to dir",new Myna.File(newDir+"/sub_dir/test5.js").exists())
		}
	/* ------ renameTo ----------------------------------------------------- */
		File_General.prototype.test_renameTo=function(){
			var temp = new Myna.File($server.tempDir + "/rename_me");
			temp.writeString("text")
			var new_name= new Myna.File($server.tempDir + "/new_name");
			new_name.deleteFile();
			this.assertFalse("File should not exist: " + new_name,new_name.exists());
			temp.renameTo("new_name");
			this.assertTrue("File should exist: " + new_name,new_name.exists());
		}
		
		