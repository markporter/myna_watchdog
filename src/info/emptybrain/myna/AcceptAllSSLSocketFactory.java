package info.emptybrain.myna;

import javax.net.ssl.*;
import java.security.SecureRandom;
import java.net.*;
import javax.net.SocketFactory;
import java.io.*;
import java.security.cert.*;
import org.apache.commons.httpclient.*;
import org.apache.commons.httpclient.protocol.SecureProtocolSocketFactory;
import org.apache.commons.httpclient.params.HttpConnectionParams;

public class AcceptAllSSLSocketFactory extends SocketFactory implements SecureProtocolSocketFactory
{
	static class DummyTrustmanager implements X509TrustManager {
		public void checkClientTrusted(X509Certificate[] xcs, String string) throws CertificateException
		{
			// do nothing
		}
		public void checkServerTrusted(X509Certificate[] xcs, String string) throws CertificateException
		{
			// do nothing
		}
		public X509Certificate[] getAcceptedIssuers()
		{
			return new java.security.cert.X509Certificate[0];
		}
	}

	private SSLSocketFactory socketFactory;
	public AcceptAllSSLSocketFactory()
	{
		try {
			SSLContext ctx = SSLContext.getInstance("TLS");
			ctx.init(null, new TrustManager[]{ new DummyTrustmanager()}, new SecureRandom());
			socketFactory = ctx.getSocketFactory();
		} catch ( Exception ex ){ ex.printStackTrace(System.err);	/* handle exception */ }
	}
	public static SocketFactory getDefault(){
		return new AcceptAllSSLSocketFactory();
	}
	
	public String[] getDefaultCipherSuites()
	{
		return socketFactory.getDefaultCipherSuites();
	}
	
	public String[] getSupportedCipherSuites()
	{
		return socketFactory.getSupportedCipherSuites();
	}
	@Override
	public Socket createSocket(Socket socket, String string, int i, boolean bln) throws IOException
	{
		return socketFactory.createSocket(socket, string, i, bln);
	}
	@Override
	public Socket createSocket(String string, int i) throws IOException, UnknownHostException
	{
		return socketFactory.createSocket(string, i);
	}
	@Override
	public Socket createSocket(String string, int i, InetAddress ia, int i1) throws IOException, UnknownHostException
	{
		return socketFactory.createSocket(string, i, ia, i1);
	}
	@Override
	public Socket createSocket(InetAddress ia, int i) throws IOException
	{
		return socketFactory.createSocket(ia, i);
	}
	@Override
	public Socket createSocket(InetAddress ia, int i, InetAddress ia1, int i1) throws IOException
	{
		return socketFactory.createSocket(ia, i, ia1, i1);
	}
	
	public Socket createSocket(
			final String host,
			final int port,
			final InetAddress localAddress,
			final int localPort,
			final HttpConnectionParams params
	) throws IOException, UnknownHostException, ConnectTimeoutException 
	{
		if (params == null) {
			throw new IllegalArgumentException("Parameters may not be null");
		}
		int timeout = params.getConnectionTimeout();
		if (timeout == 0) {
			return socketFactory.createSocket(host, port, localAddress, localPort);
		} else {
			Socket socket = socketFactory.createSocket();
			SocketAddress localaddr = new InetSocketAddress(localAddress, localPort);
			SocketAddress remoteaddr = new InetSocketAddress(host, port);
			socket.bind(localaddr);
			socket.connect(remoteaddr, timeout);
			return socket;
		}
	}
}