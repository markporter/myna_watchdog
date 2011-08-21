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

public class MynaServer 
{
	public static Server server;
	public static boolean restart = false;
	public static void main(String[] args) throws Exception
	{
		String classUrl = MynaServer.class.getResource("MynaServer.class").toString();
		boolean isJar = (classUrl.indexOf("jar") == 0);
				
		
		String 	webctx ="/";
		String	webroot="./myna";
		int		port	=8180;
		
		
		CommandLineParser parser = new PosixParser();
	
		// create the Options
		Options options = new Options();
		options.addOption( "p", "port", true, "Webserver port. Default: " + port );
		options.addOption( "c", "context", true, "Webapp context. Must Start with \"/\" Default: " + webctx);
		options.addOption( "w", "webroot", true, "Webroot to use. Will be created if webroot/WEB-INF does not exist. Default: " + webroot );
		options.addOption( "h", "help", false, "Displays help." );
		HelpFormatter formatter = new HelpFormatter();
		try {
			
			CommandLine line = parser.parse( options, args );
			
			if( line.hasOption( "help" ) ) {
				formatter.printHelp( "MynaServer", options );
				System.exit(0);
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
		//server.join();
		while (true){
			Thread.sleep(1000);
			if (MynaServer.restart){
				MynaServer.restart = false;
				System.out.println("restarting");
				server.stop();
				server.join();
				server.destroy();
				server = new Server(port);
				context = new WebAppContext();
				context.setDescriptor("/WEB-INF/web.xml");
				context.setResourceBase(webroot);
				context.setContextPath(webctx);
				context.setParentLoaderPriority(true);
				
				server.setHandler(context);
				
				server.start();
			}
		}
		
		
	}
}