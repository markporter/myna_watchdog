package bootstrap;

import org.apache.commons.cli.*;
import java.io.IOException;
import java.io.File;
 
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.webapp.WebAppContext;

import org.apache.commons.io.FileUtils; 
import org.apache.commons.io.IOUtils;
import java.util.zip.*;

import java.net.*;
import java.io.*;
import java.lang.reflect.*;

public class MynaServer extends Thread
{
	public static Server 	server;
	public static boolean 	hasWatchdog=false;
	public static String 	webctx 	="/";
	public static String	webroot	="./myna";
	public static String	logFile	=null;
	public static int		port	=8180;
	public static Process	p		=null;
	
	public static void restart() throws Exception
	{
		(new Thread() {
			public void run() {
				System.out.print("Stoping server...");
			try {
				server.stop();
				server.join();
				server.destroy();
				System.out.println("Stopped.");
			} catch(Exception e) {}
			}
		}).start();
		if (hasWatchdog) {
			System.exit(1);
		}
	}
	public void run() {
		if (MynaServer.p != null) p.destroy();
    }
	public static void main(String[] args) throws Exception
	{
		Thread.sleep(1000);
		String classUrl = MynaServer.class.getResource("MynaServer.class").toString();
		boolean isJar = (classUrl.indexOf("jar") == 0);
		
		CommandLineParser parser = new PosixParser();
	
		// create the Options
		Options options = new Options();
		options.addOption( "p", "port", true, "Webserver port. Default: " + port );
		options.addOption( "c", "context", true, "Webapp context. Must Start with \"/\" Default: " + webctx);
		options.addOption( "w", "webroot", true, "Webroot to use. Will be created if webroot/WEB-INF does not exist. Default: " + webroot );
		options.addOption( "l", "logfile", true, "Log file to use. Will be created if it does not exist. Default: ./<context>.log" );
		options.addOption( "h", "help", false, "Displays help." );
		HelpFormatter formatter = new HelpFormatter();
		java.util.List javaOpts = new java.util.ArrayList();
		String cmdSyntax = "MynaServer [options] [ -- [jvm arguments]]";
		try {
			
			CommandLine line = parser.parse( options, args );
			
			if( line.hasOption( "help" ) ) {
				formatter.printHelp(cmdSyntax, options);
				System.exit(0);
			}
			
			if( line.hasOption( "port" ) ) {
				port = Integer.parseInt(line.getOptionValue( "port" ));
			}
			if( line.hasOption( "context" ) ) {
				webctx=line.getOptionValue( "context" );
			}
			if( line.hasOption( "logfile" ) ) {
				logFile= line.getOptionValue( "logfile" );
			} else {
				logFile="."+webctx+".log";	
			}
			if( line.hasOption( "webroot" ) ) {
				webroot=line.getOptionValue( "webroot" );
			}
			javaOpts = line.getArgList();
		} 
		catch (ParseException exp ) {
			System.err.println( "Invalid Arguments.  Reason: " + exp.getMessage() );
			
			formatter.printHelp(cmdSyntax, options );
			System.exit(1);
		}
		File wrFile = new File(webroot);
		webroot= wrFile.toString();
		try {
			FileOutputStream fileOut = new FileOutputStream(logFile,true);
			PrintStream newOut= new PrintStream(fileOut,true);
			System.setOut(newOut);
			System.setErr(newOut);
			System.out.println("logging to: " + logFile);
		} catch(Exception logEx){
			System.out.println("Unable to log output to '" + logFile+"'. Make sure the path exists and is writable by this user.");	
		}
		
		hasWatchdog = System.getProperty("myna.hasWatchdog") != null;
		if (hasWatchdog){
			//unpack myna if necessary
			if (!wrFile.exists()){
				System.out.println("Unpacking Myna to '"+wrFile.toString()+"'...");
				wrFile.mkdirs();
				
				if (isJar){
					String jarFilePath = classUrl.substring(
						classUrl.indexOf(":")+1,
						classUrl.indexOf("!")
					);
					System.out.println("path = " + jarFilePath);
					File jarFile = new File(new java.net.URL(jarFilePath).toURI());
					System.out.println("java path = " + jarFile.toString());
					
					ZipFile zipFile= new ZipFile(jarFile);
					
					for (ZipEntry entry :  java.util.Collections.list(zipFile.entries())){
						File outputFile = new File(
							wrFile.toURI().resolve(java.net.URLEncoder.encode(entry.getName()))
						);
						if(entry.isDirectory()) {
							outputFile.mkdirs();
						} else {
							boolean isSame = false;
							
							java.io.InputStream is = zipFile.getInputStream(entry);
							java.io.OutputStream os = FileUtils.openOutputStream(outputFile);
							IOUtils.copyLarge(is,os);
							is.close();
							os.close();
						}
					}
					zipFile.close();
					System.out.println("Done unpacking. Launching Myna Server...");
				}
			}
		
			server = new Server(port);
			System.out.println(
				"Using web root: " +webroot
			);
			WebAppContext context = new WebAppContext();
			context.setDescriptor("/WEB-INF/web.xml");
			context.setResourceBase(webroot);
			context.setContextPath(webctx);
			context.setParentLoaderPriority(true);
			
			server.setHandler(context);
			
			server.start();
			server.join();
		} else {//run as watchdog and spawn a separate process
			java.lang.Runtime rt = java.lang.Runtime.getRuntime();
			rt.addShutdownHook(new MynaServer());
			String osName = System.getProperty("os.name").toLowerCase();
			String javaHome= System.getProperty("java.home");
			String pathSep = System.getProperty("path.separator");
			String cp = System.getProperty("java.class.path");
			
			File javaExe;
			if (osName.indexOf("windows") != -1){
				javaExe = new File(javaHome + "\\bin");
			} else {
				javaExe = new File(javaHome + "/bin");
			}
			
			
			String [] envp = {
				"PATH="+javaExe.toString(),
				"CLASSPATH="+cp
			};
			StringBuffer cmd =new StringBuffer("java ");
			for (Object option : javaOpts){
				cmd.append(option + " ");
			}
			cmd.append(
				" -Dmyna.hasWatchdog=true "+
				" bootstrap.MynaServer "+
				" -c "+ webctx+
				" -p "+ new Integer(port).toString()+
				" -w "+ webroot+
				" -l "+ logFile
			);
			;
			System.out.println("Starting " + cmd.toString());
			int retVal=1;
			
			do {
				try{
					p =rt.exec(cmd.toString(),envp,new File("."));
					p.waitFor();
					retVal = p.exitValue();
				} catch(Exception e){
					retVal=1;
				}
			} while (retVal != 0);
			
			System.exit(1);
		}
		
	}
}