package info.emptybrain.myna;


import org.apache.commons.cli.*;
import java.io.IOException;
import java.io.File;
 
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.webapp.WebAppContext;

 
public class MynaServer 
{
	public static void main(String[] args) throws Exception
	{
		
		String 	webctx ="/";
		int		port	=8180;
		
		
		CommandLineParser parser = new PosixParser();
	
		// create the Options
		Options options = new Options();
		options.addOption( "p", "port", true, "Webserver port. Default:8180" );
		options.addOption( "c", "context", true, "Webapp context. Default: /" );
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
		} 
		catch (ParseException exp ) {
			System.err.println( "Invalid Arguments.  Reason: " + exp.getMessage() );
			
			formatter.printHelp( "MynaServer", options );
			System.exit(1);
		}
		
		
		
    
		Server server = new Server(port);
		String webroot = new File(
			MynaServer.class.getResource(".").toURI()
				.resolve("../../../../../")
				
		).toString(); 
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
}