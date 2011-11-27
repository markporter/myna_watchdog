package info.emptybrain.myna;


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
import java.util.*;
import java.lang.reflect.*;

public class MynaServer 
{
	public static boolean isJar;
	public static String classUrl = MynaServer.class.getResource("MynaServer.class").toString();
	public static void main(String[] args) throws Exception
	{
		isJar = (classUrl.indexOf("jar") == 0);
				
		
		String 	webctx ="/";
		String 	mode ="server";
		String	webroot="./myna";
		Vector	modeOptions= new Vector();
		modeOptions.add("server");
		modeOptions.add("upgrade");
				
		int		port	=8180;
		
		
		CommandLineParser parser = new PosixParser();
	
		// create the Options
		Options options = new Options();
		options.addOption( "m", "mode", true, "Mode: one of "+modeOptions.toString()+". Default: \""+mode+"\" \n"+
			"*server:	 unpacks to webroot and launches  Myna Server\n"+
			"*upgrade: upgrades myna installation in webroot and exits"
		);
		options.addOption( "p", "port", true, "Webserver port. Default: " + port );
		options.addOption( "c", "context", true, "Webapp context. Must Start with \"/\" Default: " + webctx);
		options.addOption( "w", "webroot", true, "Webroot to use. Will be created if webroot/WEB-INF does not exist. Default: " + webroot );
		options.addOption( "h", "help", false, "Displays help." );
		HelpFormatter formatter = new HelpFormatter();
		try {
			if (args.length == 0){
				formatter.printHelp( "MynaServer", options );
				System.exit(1);	
			}
			CommandLine line = parser.parse( options, args );
			
			if( line.hasOption( "help" ) ) {
				formatter.printHelp( "MynaServer", options );
				System.exit(0);
			}
			
			if( line.hasOption( "mode" ) ) {
				mode = line.getOptionValue( "mode" );
				if (!modeOptions.contains(mode)){
					System.err.println( "Invalid Arguments.  Reason: Mode must be in " + modeOptions.toString());
					formatter.printHelp( "MynaServer", options );
					System.exit(0);
				}
				
			}
			
			if( line.hasOption( "port" ) ) {
				port = Integer.parseInt(line.getOptionValue( "port" ));
			}
			if( line.hasOption( "context" ) ) {
				webctx=line.getOptionValue( "context" );
			}
			if( line.hasOption( "webroot" ) ) {
				webroot=line.getOptionValue( "webroot" );
			} 
		} 
		catch (ParseException exp ) {
			System.err.println( "Invalid Arguments.  Reason: " + exp.getMessage() );
			
			formatter.printHelp( "MynaServer", options );
			System.exit(1);
		}
		File wrFile = new File(webroot);
		webroot= wrFile.toString();
		
		//unpack myna if necessary
		if (!wrFile.exists() || mode.equals("upgrade")){
			upgrade(wrFile);
		}
    
		Server server = new Server(port);
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
		
		
	}
	public static void upgrade(File wrFile) throws Exception
	{
		System.out.println("Installing/upgrading Myna in '"+wrFile.toString()+"'...");
		wrFile.mkdirs();
		File web_inf =  new File(wrFile.toURI().resolve("WEB-INF"));
		boolean isUpgrade = false;
		File backupDir = null;
		if (web_inf.exists()){
			
			String dateString = new java.text.SimpleDateFormat("MM-dd-yyyy_HH.mm.ss.S").format(new Date());
			String backupBase = 	"WEB-INF/upgrade_backups/backup_" + dateString;
			backupDir = new File(wrFile.toURI().resolve(backupBase));
			backupDir.mkdirs();
			isUpgrade=true;
		}
		
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
				File backupFile = new File(
					backupDir.toURI().resolve(java.net.URLEncoder.encode(entry.getName()))
				);
				if(entry.isDirectory()) {
					outputFile.mkdirs();
					if (isUpgrade) backupFile.mkdirs();
				} else {
					if (isUpgrade){
						
						java.io.InputStream sourceIS = zipFile.getInputStream(entry);
						java.io.InputStream targetIS = FileUtils.openInputStream(outputFile);
						boolean isSame =IOUtils.contentEquals(sourceIS,targetIS);
						sourceIS.close();
						targetIS.close();
						
						if (isSame){
							System.out.println("skipping same file: " + outputFile);
						
							continue;
						} else { 
							//outputFile.copyTo(backupFile);
							//fusebox.upgradeLog("Backup: " + backupFile);
						}
						
						
					} 
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
}