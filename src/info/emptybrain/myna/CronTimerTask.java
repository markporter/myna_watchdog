
package info.emptybrain.myna;

import org.apache.commons.httpclient.*;
import org.apache.commons.httpclient.methods.*;
import org.apache.commons.httpclient.params.HttpMethodParams;
import javax.servlet.*;
import javax.servlet.http.*;
import java.util.concurrent.*;

import java.io.*;
import java.net.*;
import java.util.*;


public class CronTimerTask extends java.util.TimerTask{
	public void run(){
		try {
			/* boolean gotPermit =threadPermit.tryAcquire((long)10,TimeUnit.SECONDS);
			if (!gotPermit) throw new Exception("Too Many Threads: Unable to gain thread permit after 10 seconds."); */
			
			MynaThread thread = new MynaThread();
			
			try{
				java.net.URI mynaRoot= JsCmd.class.getResource("/general.properties")
						.toURI().resolve("../../");
				File jsFile = new File(
					mynaRoot
						.resolve("shared/js/libOO/run_cron_thread.sjs")
				);
				
				
				thread.rootDir = mynaRoot.toString();
				thread.loadGeneralProperties();
				thread.environment.put("isCommandline",true);
				thread.isWhiteListedThread=true;
				
				thread.handleRequest(jsFile.toURI().toString());
			} catch (Exception e){
				thread.handleError(e);
			}	
			
		} catch (Exception e){
			System.err.println("============== Scheduled task error Error ============");
			System.err.println(e.toString());
			System.err.println("============== Stacktrace ============");
			e.printStackTrace(System.err);
		} 
		
			  
	}	
	
}
