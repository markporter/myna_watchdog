package bootstrap;

import java.io.*;
public  class OutputHandler extends Thread
	{
		 InputStream is;
		 String prefix;
		 
		 OutputHandler(InputStream is, String prefix)
		 {
			  this.is = is;
			  this.prefix = prefix;
		 }
		 
		 public void run()
		 {
			  try
			  {
					InputStreamReader isr = new InputStreamReader(is);
					BufferedReader br = new BufferedReader(isr);
					String line=null;
					while ( (line = br.readLine()) != null)
						 System.out.println(prefix + "> " + line);    
					} catch (IOException ioe)
					  {
						 ioe.printStackTrace();  
					  }
		 }
	}