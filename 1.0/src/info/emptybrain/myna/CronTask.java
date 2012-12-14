
package info.emptybrain.myna;


public class CronTask implements Comparable
{
	public String name;
	public long nextRun;

	public CronTask(String name, long nextRun)
	{
		this.name = name;
		this.nextRun = nextRun;
	}
	public int compareTo(Object O){
		CronTask t = (CronTask)O;
		if (nextRun > t.nextRun ) return 1;
		if (nextRun < t.nextRun ) return -1;
		return 0;
	}
	public String toString(){
		return this.name + ":" + new java.util.Date(this.nextRun);
	}
}
