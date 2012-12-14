function _upgrade(version){
	var osName 		= java.lang.System.getProperty("os.name").toLowerCase();
	var javaHome		= java.lang.System.getProperty("java.home");
	var pathSep 		= java.lang.System.getProperty("path.separator");
	var fileSep 		= java.lang.System.getProperty("file.separator");
	var hasWatchdog = java.lang.System.getProperty("myna.hasWatchdog") != null;
	var web_inf =new Myna.File("/WEB-INF").javaFile.toString() + fileSep;
	var webroot =new Myna.File("/").javaFile.toString() + fileSep;
	
	var cp = java.lang.System.getProperty("java.class.path");
	var
		runtime = java.lang.Runtime.getRuntime(),
		process, 		//holds java.lang.Process object returned by exec
		curLine,		// current line of process output
		reader,			//buffered reader for process output
		result={output:"",errors:"",exitCode:-1},		//output object to store output, errors, and exitCode
		scriptPath = Myna.File.createTempFile("shl");	//URI of script file
		
	
	var javaExe;
	if (osName.indexOf("windows") != -1){
		javaExe = javaHome + "\\bin\\java.exe ";
	} else {
		javaExe = javaHome + "/bin/java ";
	}
	
	
	
	var cmd =[
		javaExe,
		" -cp " + cp,
		" -jar " + web_inf + version + ".war",
		" -m upgrade ", 
		" -w "+ webroot
	].join(" ");
	
	
	//write the script to the temp file
	process = runtime.exec(cmd,null,new Myna.File("/WEB-INF").javaFile);
	result.inputStream = process.getInputStream();
	result.errorInputStream =process.getErrorStream();
	result.process = process;
	result.output = Myna.JavaUtils.streamToString(process.getInputStream());
	result.errors = Myna.JavaUtils.streamToString(process.getErrorStream());
	
	process.waitFor();
	result.exitCode = process.exitValue();
	if (result.exitCode ==0 && String(result.errors).length ==0){
		new Myna.File("/WEB-INF",version + ".war").forceDelete();
		if (java.lang.System.getProperty("myna.hasWatchdog")){
			new Myna.Thread(function(){
				Myna.sleep(1000);
				
					java.lang.System.exit(0);	
				
			},[])
		}
		return <ejs>
			<b>Myna Upgrade (<%=version%>) Complete</b>
			<h2>Server is restarting if watchdog is supported</h2>
			<pre><%=result.output%></pre>
		</ejs>
	} else {
		return <ejs>
			<b>Myna Upgrade (<%=version%>) Failed</b>
			<pre><%=result.errors%></pre><p>
			<pre><%=result.output%></pre><p>
		</ejs>
			
	}
	
	
	
}

function web(params){
	$req.timeout=0
	var con =new Myna.HttpConnection({
		url:"http://myna.googlecode.com/files/" + params.version +".war",
		method:"GET"
	});			
	con.connect()
	var f = new Myna.File("/WEB-INF/" + params.version +".war")
	Myna.JavaUtils.streamCopy(con.getResponseStream(),f.getOutputStream(),true)
	
	
	
	return this._upgrade(params.version)
}

function local(parms){
	Myna.log("debug","data",Myna.dump($req.data));
	var fileName = $req.data.file.stats.fileName.listLast("/")
	new Myna.File($req.data.file.stats.diskLocation).copyTo("/WEB-INF/" +fileName)
	
	this.renderContent({success:true,message:this._upgrade(fileName.listBefore("."))}.toJson())
}

function uploadStatus(){
	return $session.get("$uploadProgress")?$session.get("$uploadProgress"):{}
}
