
package info.emptybrain.myna;

import org.apache.commons.httpclient.*;
import org.apache.commons.httpclient.methods.*;
import org.apache.commons.httpclient.params.HttpMethodParams;
import javax.servlet.*;
import javax.servlet.http.*;

import java.io.*;
import java.net.*;
import java.util.*;



public class CronThread {
	final static long MILLI = 1;
	final static long SECONDS = 1000;
	final static long MINUTES = 1000*60;
	final static long HOURS = 1000*60*60;
	final static long DAYS = 1000*60*60*24;
	final static long WEEKS = 1000*60*60*24*7;
	
	public static Hashtable timers= new Hashtable();
	public CronThread (){
		try {
			Properties cronProps = new Properties();
			Iterator runningTimers = timers.values().iterator();
			while( runningTimers.hasNext()){
					Timer oldTimer = (Timer) runningTimers.next();
					oldTimer.cancel();
					oldTimer.purge();
			}
			
			cronProps.load(getClass().getResourceAsStream("/cron.properties"));
			
			Enumeration keys = cronProps.keys();
			while (keys.hasMoreElements()){
					String name = (String) keys.nextElement();
					Timer curTimer =new java.util.Timer();
					timers.put(name,curTimer);
									
					long interval = CronThread.MINUTES/6;	
					String config = cronProps.getProperty(name);
					ScriptTimerTask curTask = new ScriptTimerTask();
					curTask.config = config;
					curTimer.schedule(curTask,new Date(),interval);
			}
		} catch (java.lang.NullPointerException missingFile){
			//ignore missing cron.properties	
		} catch(Exception e){
			java.lang.System.out.println("=============== Loading cron Error==============");
			java.lang.System.out.println(e);
			e.printStackTrace(System.out);
		}
	}
	
	public static class CronTimerTask extends java.util.TimerTask{
		public String url; 
		public HttpClient client = new HttpClient();
		public void CronTimerTask(String url){
			this.url = url;
		}
		public void run(){
			 // Create an instance of HttpClient.
			
	
			// Create a method instance.
			GetMethod method = new GetMethod(this.url);
			
			// Provide custom retry handler is necessary
			method.getParams().setParameter(HttpMethodParams.RETRY_HANDLER, 
					new DefaultHttpMethodRetryHandler(3, false));
	
			try {
				// Execute the method.
				int statusCode = this.client.executeMethod(method);
	
				if (statusCode != HttpStatus.SC_OK) {
					System.err.println("Method failed: " + method.getStatusLine());
				}
	
				// Read the response body.
				byte[] buffer = new byte[4096];
				InputStream instream = method.getResponseBodyAsStream();
				try{
					if (instream != null) {
						int l = 0;
						while ((l = instream.read(buffer)) != -1) {
						}
					}
				} finally{
					instream.close();
				}
	
			} catch (java.net.ConnectException e) {
				System.err.println("Failed connection to " + this.url);
			} catch (HttpException e) {
				System.err.println("Fatal protocol violation: " + e.getMessage());
				e.printStackTrace();
			} catch (IOException e) {
				System.err.println("Fatal transport error: " + e.getMessage());
				e.printStackTrace();
			} finally {
				// Release the connection.
				method.releaseConnection();
			}  
		}	
		
	}
	
	public static class ScriptTimerTask extends java.util.TimerTask{
		public String config; 
		public  void ScriptTimerTask(String config){
			this.config = config;
		}
		public void run(){
			try {
				MynaThread thread = new MynaThread();
				
				try{
					java.net.URI mynaRoot= JsCmd.class.getResource(".")
							.toURI().resolve("../../../../../");
					
					File jsFile = new File(
						mynaRoot
							.resolve("shared/js/libOO/run_cron.sjs")
					);
					
					
					thread.rootDir = mynaRoot.toString();
					thread.loadGeneralProperties();
					thread.environment.put("isCommandline",true);
					String[] args = {
						"",
						this.config
					};
					thread.environment.put("commandlineArguments",args);
					
					thread.handleRequest(jsFile.toURI().toString());
				} catch (Exception e){
					thread.handleError(e);
				}
				
			} catch (Exception e){
				System.err.println("============== Scheduled task error Error ============");
				System.err.println(e.toString());
				System.err.println("============== Stacktrace ============");
				e.printStackTrace(System.err);
				System.err.println("============== Config ============");
				System.err.println(this.config);
			}
			
				  
		}	
		
	}
	
	public static Properties parseCron(String json){
		Properties result = new Properties();
		String[] propPairs = json.split(",");
		for (int x = 0; x < propPairs.length; ++x){
			String[] propParts = propPairs[x].split("=");
			String name =propParts[0];
			String value =propParts[1]; 
			result.setProperty(name,value);
		}
		return result;
	}
	
}