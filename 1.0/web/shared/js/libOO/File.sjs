/* 
	Class: Myna.File
		A Javascript friendly proxy for java.io.File 
		
*/

if (!Myna) var Myna={}
   
/* Constructor: File
	Creates a new File Object from the supplied <MynaPath>
	
	Parameters:
		path - <MynaPath> to a file
	*/
	Myna.File =function (path){
		if (path instanceof Myna.File){
			path =path.javaFile.toURI();	
		}else if (path instanceof java.io.file){
			path = path.toURI();
		}
		
		/* Property: javaFile
			the underlying java.io.File object 
		*/
		this.javaFile = $server_gateway.getNormalizedFile(path)
      
      /* Property: size
			size in bytes of this file. Same result as <getSize()> 
		*/
      this.__defineGetter__("size",this.getSize);
      /* Property: lastModified
         the Date() this file was last modified, or null if this file does 
         not exist
		*/
      this.__defineGetter__("lastModified",this.getLastModified);
      /* Property: fileName
         the name of this file, not including it's path
      */
      this.__defineGetter__("fileName",this.getFileName);
      /* Property: directoryPath
         a <MynaPath> representing the parent directory of this <File>
      */
      this.__defineGetter__("directoryPath",this.getDirectoryPath);
      
      /* Property: type
         either "file" or "directory"
      */
      this.__defineGetter__("type",function(){
         if (this.isDirectory()){
            return "directory";
         } else{
            return "file"
         }
      });
      
	}
   Myna.File.Stream = function(){}
   
   Myna.File.InputStream = function(){}
   Myna.File.OutputStream = function(){}
   
 /* Function: appendBinary
	appends a strings to this file
	
	Parameters: 
		string 	- 	byte[] to append to the file, preserving any existing 
                  contents
	
	Note:
		The file does not have to exist, but the parent directory does.
	*/
	Myna.File.prototype.appendBinary = function(byteArray){
		var IOUtils = Packages.org.apache.commons.io.IOUtils;
      var stream = new java.io.FileWriter(this.javaFile,true);
		IOUtils.write(
			byteArray,
         stream
		);
      stream.close();
	}
/* Function: appendString
	appends a strings to this file
	
	Parameters: 
		string 	- 	String to append to the file, preserving any existing 
                  contents
	
	Note:
		The file does not have to exist, but the parent directory does.
	*/
	Myna.File.prototype.appendString = function(string){
		var IOUtils = Packages.org.apache.commons.io.IOUtils;
      var stream = new java.io.FileWriter(this.javaFile,true);
		IOUtils.write(
			string,
         stream
		);
      stream.close();
	}
/* Function: copyTo
	copies this file/directory to another location
	
	Parameters: 
		dest 	-	<MynaPath> or <File> representing the directory to copy to
 
	Returns: 
		void
		
	Detail: 
		Copies a file or whole directory to a new location preserving file dates.
	
		If this <File> is a file:
		- *If the destination is a file*, then the 
			directory holding the destination file is created, if neccesary and the
			destination file is overwritten, if it exists. 
		- *If the destination is a directory*, then the this <File> will by copied 
			into that directory 
		
		If this <File> is a directory:
		- This directory and all its child directories and files are copied to 
			the specified destination. 
		- The destination is the new location and name of the directory. 
		- The destination directory is created if it does not exist. 
		- If the destination directory did exist, then this method merges the 
			source with	the destination, with the source taking precedence. 
	 
	*/
	Myna.File.prototype.copyTo = function(dest){
		var FileUtils = Packages.org.apache.commons.io.FileUtils;
		/* make sure dest is a java.io.File object */
		if (dest instanceof Myna.File){
			dest = dest.javaFile;	
		} else { //assume MynaPath
			dest = new Myna.File(dest).javaFile;
		}
		var source = this.javaFile;
		/* first figure out if we are copying a file or directory */
		if (source.isDirectory()){
			/* now let's see what the destination is */
			if (!dest.exists() || dest.isDirectory()){
				FileUtils.copyDirectory(source,dest);
			} else {
				throw new Error("Cannot copy a directory to a file");	
			}
		} else if (source.isFile()){
			/* now let's see what the destination is */
			if (!dest.exists() || dest.isFile()){
				FileUtils.copyFile(source,dest);
			} else if (dest.isDirectory()){
				FileUtils.copyFileToDirectory(source,dest);
			} else {
				throw new Error("Cannot copy a directory to a file");	
			}
		} else {
			throw new Error("This File ("+this.toString()+") must represent a file or directory to copy");	
		}
		
	}
/* Function: createDirectory
	Creates a directory represented by this <File>, including parent directories 
	as necessary.
	
	Parameters: 
		fail_on_exist 	- 	*Optional default true* if true, an exception is 
							thrown if the file or directory already exists. If 
							false, no action is performed on the existing 
							directory
		
	Returns:
		true if successful 
	*/
	Myna.File.prototype.createDirectory = function(name){
		return this.javaFile.mkdirs();
	}
/* Function: createTempFile 
	(static) Creates a uniquely named file. 
	 
	Parameters: 
		prefix	-	*Optional* String prefix to the file name.
		suffix	- 	*Optional, default '.tmp'* String suffix to the filename
		path 	-	*Optional, default $server.tempDir
 
	Returns: 
		<MynaPath> to the created file
		
	Detail: 
		To create the new file, the prefix and the suffix may first be adjusted 
		to fit the limitations of the underlying platform. If the prefix is too 
		long then it will be truncated, but its first three characters will 
		always be preserved. If the suffix is too long then it too will be 
		truncated, but if it begins with a period character ('.') then the period 
		and the first three characters following it will always be preserved. 
		Once these adjustments have been made the name of the new file will be 
		generated by concatenating the prefix, five or more internally-generated 
		characters, and the suffix.
	 
	 
	*/
	Myna.File.createTempFile=function(prefix,suffix,path){
		if (!path) path=$server.tempDir;
		if (!suffix) suffix=".tmp";
		if (!prefix) prefix="tmp";
		
		return String(java.io.File.createTempFile(prefix,suffix,new Myna.File(path).javaFile).toURI());
	}

/* Function: exists
	returns true if the filepath this object reperesents currently exists
	
	*/
	Myna.File.prototype.exists = function(){
		var exists = false; 
		try {exists =this.javaFile.exists();} catch(e){} 
		return exists;
	}



/* Function: extractZip
	Tries to unzip this file into the supplied destination directory, and 
	returns array of file names
	
	Parameters:
		dest	-	<MynaPath> or <Myna.File> representing the destination 
					directory. The path does not have to exist, but if it 
					does, it must be a directory.
					
		Returns:
			Array of <MynaPath> entries representing the extracted files
	*/
	Myna.File.prototype.extractZip = function(dest){
		if (!dest) throw new SyntaxError("Parameter 'dest' is required");
		var FileUtils = Packages.org.apache.commons.io.FileUtils;
		var IOUtils = Packages.org.apache.commons.io.IOUtils;
		var zipFile = new java.util.zip.ZipFile(this.javaFile.toString());
		var entries =Myna.enumToArray(zipFile.entries());
		
		var destDir = new Myna.File(dest)
		destDir.createDirectory();
		
		var result= entries.map(function(entry){
			var outputFile = new Myna.File (destDir.toString()+"/"+entry.getName()).javaFile;
			if(entry.isDirectory()) {
				outputFile.mkdirs();
			} else{
				var os = FileUtils.openOutputStream(outputFile);
				var is = zipFile.getInputStream(entry);
				IOUtils.copyLarge(is,os);
				is.close();
				os.close();
			}
			return String(outputFile.toURI());
		});
		zipFile.close();
		return result;
	}
/* Function: forceDelete
	delete the filepath this object reperesents
	
	Detail: 
		If this file is a directory, its contents are recursively deleted as 
		well. Throws java exception if the file cannot be deleted.
		
	*/
	Myna.File.prototype.forceDelete = Myna.File.prototype.deleteFile = function(){
		var FileUtils = Packages.org.apache.commons.io.FileUtils;
		if (this.exists()){
			return FileUtils.forceDelete(this.javaFile);
		} else return true;
	}
/* Function: getChecksum
	returns a checksum for this file as a Java byte[]
	
	Parameters:
		type		-	*Optional, default "SHA-256"*
						Any valid digest algorithm, see below
						
	Sun Java Digest Algorithms (versions 5/6):
	* MD2
	* MD5
	* SHA-1
	* SHA-256
	* SHA-384
	* SHA-512
	
	Detail: 
		This function returns a Hex string representing the state of the file. 
		This can be validated via <Myna.File.isValidChecksum> to confirm that a 
		file has not been altered. 
		
	See:
		* <isValidChecksum>
	*/
	Myna.File.prototype.getChecksum = function(type){
		type=type||"SHA-256";
		var fis =  this.getInputStream();
		var buffer = Myna.JavaUtils.createByteArray(1024)
		var MessageDigest= java.security.MessageDigest;     
		var complete = MessageDigest.getInstance(type);
		var numRead;
		do {
			numRead = fis.read(buffer);
			if (numRead > 0) {
				complete.update(buffer, 0, numRead);
			}
		} while (numRead != -1);
		fis.close();
		var digest=complete.digest();
		
		return digest;
	}
/* Function: getDirectory 
	Returns a <File> representing the parent directory of this <File>
	 
	Returns: 
	 a <File> representing the parent directory of this <File>
	*/
	Myna.File.prototype.getDirectory=function(){
		return new Myna.File(this.javaFile.getParentFile().toURI());
	}
/* Function: getDirectoryPath
	Returns a <MynaPath> representing the parent directory of this <File>
	 
	Returns: 
	 a <MynaPath> representing the parent directory of this <File>
	*/
	Myna.File.prototype.getDirectoryPath=function(){
		return String(this.javaFile.getParentFile().toURI());
	}
/* Function: getFileName 
	Returns the name of this file, not including it's path 
	
	*/
	Myna.File.prototype.getFileName=function(){
		return String(this.javaFile.getName());
	}
/* Function: getInputStream 
	Returns a java.io.InputStream for this object.
	
	If this stream is not explicitly closed, then it will be closed at the end of 
	the request.
	
	*/
	Myna.File.prototype.getInputStream=function(){
		var s= org.apache.commons.io.FileUtils.openInputStream(this.javaFile);
		$application.addOpenObject(s);
		return s;
	}	
/* Function: getOutputStream 
	Returns a java.io.OutputStream for this object.
	
	If this stream is not explicitly closed, then it will be closed at the end of 
	the request.
	
	*/
	Myna.File.prototype.getOutputStream=function(){
		var s= org.apache.commons.io.FileUtils.openOutputStream(this.javaFile);
		$application.addOpenObject(s);
		return s;
	}	

/* Function: getLastModified
		returns the Date() this file was last modified, or null if this file does 
		not exist
		
	*/
	Myna.File.prototype.getLastModified = function(){
		var lm = this.javaFile.lastModified(); 
		return lm?new Date(lm):Date.parseDate("01/01/1900 00:00:00","m/d/Y H:i:s")
	}
   
/* Function: getLineIterator
      returns an interator object for looping one line at a time over the 
      file without loading the entire file into memory. This will lock the file 
      until the end of the request unless to call close() on the returned 
      iterator when finished with it.
      
      Example:
      (code)
         var file = new Myna.File("path/to/file");
         for (line in file.getLineIterator()) {
            Myna.print(line+"<br>");
         }
      (end)
   */
   Myna.File.prototype.getLineIterator= function(){
        var FileUtils = Packages.org.apache.commons.io.FileUtils;
        var iterator = FileUtils.lineIterator(this.javaFile);
        $application.addOpenObject(iterator);
        return Iterator(iterator);
    };
/* Function: getSize
		returns the size in bytes of this file
		
	*/
	Myna.File.prototype.getSize = function(){
		
		return this.javaFile.length();
	}	
/* Function: isDirectory
	returns true if this file exists and represents a directory
	
	*/
	Myna.File.prototype.isDirectory = function(name){
		return this.javaFile.isDirectory();
	}
/* Function: isValidChecksum
	returns true if the supplied hex checksum matchs this file 
	
	Parameters:
		checksum	-	java byte[] representing a checksum
		type		-	*Optional, default "SHA-256"*
						Any valid digest algorithm, see below
						
	Sun Java Digest Algorithms (versions 5/6):
	* MD2
	* MD5
	* SHA-1
	* SHA-256
	* SHA-384
	* SHA-512
	
	Detail: 
		This function returns a Hex string representing the state of the file. 
		This can be validated via <Myna.File.isValidChecksum> to confirm that a 
		file has not been altered. 
		
	See:
		* <isValidChecksum>
	*/
	Myna.File.prototype.isValidChecksum = function(checksum,type){
		type=type||"SHA-256";
		checksum = Myna.JavaUtils.byteArrayToHex(checksum)
		return Myna.JavaUtils.byteArrayToHex(this.getChecksum(type)) == checksum;
	}
/* Function: listFiles
	Returns a <Myna.DataSet> of <File> objects contained in this directory.
	 
	Parameters:
		filter		-	*Optional, default: null* 
							Either a comma separated list of file extensions to list, 
							ex: "css,js", OR a filter function. If null all files are 
                     returned.
      recursive   -  *Optional, default: false* 
							If true, all sub-directories will be searched 
							as well
	Examples:
	(code)
		//Find all the files and directories, but not sub-directories in the Myna root:
		var files = new Myna.File("/").listFiles();
		
		//Find all the code files in the current directory, or lower
		var files = new Myna.File(".").listFiles("sjs,ejs,ws",true);
		
		//Find all files in the tmp directory older than 30 days
		var files = new Myna.File("file:/tmp").listFiles(function(f){
			var isOld =f.lastModified < new Date().add(Date.DAY,-30);
			return isOld && !f.isDirectory();
		},true);
	(end)
	
	See:
	* <function.filter>
	
	*/
	Myna.File.prototype.listFiles=function(filter,recursive){
		if (!filter){
			filter = function(){return true}
		}
		if (typeof filter === "string"){
			
			var extentions = filter.toLowerCase().split(/,/);
			filter = function(f){
				return extentions.some(function(ext){
					var exp = new RegExp("\\."+ext +"$");
					return exp.test(f.fileName.toLowerCase());
				})
			}
		}
		recursive = !!recursive; //force a boolean value
		
		/* make sure this file exists */
		if (!this.exists){
			throw new Error(String(this) +" does not exist");
		}
		/* make sure this is a directory */
		if (!this.javaFile.isDirectory){
			throw new Error("Can only list files for directories")
		} 
		
		var result=new Myna.DataSet({
			data:[],
			columns:"directoryPath,fileName,type,size,lastModified"
		});
		var subDirs=[];
		this.javaFile.listFiles()
			.map(function(jf){
				var f = new Myna.File(jf.toURI());
				if (recursive && f.isDirectory()){
					subDirs.push(f)
				}
				return f
			})
			.filter(filter)
			.forEach(function(f){
				result.push(f)
			})
		subDirs.forEach(function(f){
			f.listFiles(filter,true).forEach(function(subf){
				result.push(subf);
			})
		})
		return result;
	}
/* Function: readBinary
	returns the contents of this file as a java byte[] array
	
	*/
	Myna.File.prototype.readBinary = function(){
		var FileUtils = Packages.org.apache.commons.io.FileUtils;
		return FileUtils.readFileToByteArray(this.javaFile);
	}
/* Function: readLines
	returns the contents of this file as an array of strings representing each line
	
	*/
	Myna.File.prototype.readLines = function(){
		var FileUtils = Packages.org.apache.commons.io.FileUtils;
		return FileUtils.readLines(this.javaFile).toArray()
		.map(function(line){
			return String(line);
		});
	}
/* Function: readString
	returns the text contents of this file
	
	Returns: 
		text contents of this file
	*/
	Myna.File.prototype.readString = function(){
		var FileUtils = Packages.org.apache.commons.io.FileUtils;
		return String(FileUtils.readFileToString(this.javaFile));
	}
/* Function: renameTo
	Gives this file a new name
	
	Parameters: 
		name 	- 	New name for the file, not including directory
		
	Returns:
		true if successful 
	*/
	Myna.File.prototype.renameTo = function(name){
		var sFile =this.javaFile,
			dFile = new java.io.File(sFile.getParentFile(),name);
		var success = sFile.renameTo(dFile);
		if (success) this.javaFile = dFile;
		return success;
	}
/* Function: toString
	returns the full <MynaPath> represented by this <File>
	
	*/
	Myna.File.prototype.toString = function(){
		return String(this.javaFile.toURI());
	}
/* Function: writeBinary
	write a java byteArray to this file
	
	Parameters: 
		data 	- 	java byte[] array to write to the file, overwriting any existing contents
	
	Note:
		The file does not have to exist, but the parent directory does.
	*/
	Myna.File.prototype.writeBinary = function(data){
		var FileUtils = Packages.org.apache.commons.io.FileUtils;
		FileUtils.writeByteArrayToFile(
			this.javaFile,
			data
		);
	}
	

/* Function: writeString
	write a strings to this file
	
	Parameters: 
		string 	- 	String to write to the file, overwriting any existing contents
	
	Note:
		The file does not have to exist, but the parent directory does.
	*/
	Myna.File.prototype.writeString = function(string){
		var FileUtils = Packages.org.apache.commons.io.FileUtils;
		FileUtils.writeStringToFile(
			this.javaFile,
			string
		);
	}


	
	
	
	
	
	
	
	
	