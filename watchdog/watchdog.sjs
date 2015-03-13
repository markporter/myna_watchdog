/* $req.timeout=0;
var loopCount=0 */
//Myna.include("functions.sjs");
var config = $server.get("watchdog_config");
if (!config){
	var config =new Myna.File("config.json").readString().parseJson()
	.setDefaultProperties({
		checkInterval:60000,
		timeout:10
	})
	$server.set("watchdog_config",config);
}
//Myna.printConsole("done config")
// main test loop
/* while (true) {
	 loopCount++ */
//	Myna.printConsole("starting loop " + loopCount)
	var started = new Date().getTime();
//fire test threads
	config.services.forEach(function(serviceConfig,name){
		serviceConfig.setDefaultProperties({
			status:"unknown",
			testStatus:"pending"
		})
		serviceConfig.tests.forEach(function(testConfig){
			testConfig.setDefaultProperties({
				status:"unknown",
				failCount:0,
				failMessage:function(msg){
					this.failMessages.push(this.test +": " + msg);
				}
			});
			testConfig.status="pending";
			testConfig.failMessages=[],
			testConfig.lastCheck = new Date();
			testConfig.curThread = new Myna.Thread(function(config,testConfig){
				$profiler.mark("testing " + testConfig.test)
				try{
					Myna.include("tests/" + testConfig.test +".sjs",this)
					var passed = this[testConfig.test](testConfig);
					$profiler.mark("done testing " + testConfig.test)
					//see if we already timed out
					if (testConfig.status =="fail") return;
					testConfig.status=passed?"pass":"fail";
					if (passed){
						testConfig.status="pass";
						testConfig.failMessages=[];
						testConfig.failCount =0;
					} else {
						testConfig.failCount++;
						testConfig.status="fail";
					}
					
				} catch (e) {
					testConfig.failMessage("<br>" +Myna.formatError(e));	
				}
				delete testConfig.curThread;//we are done here
			},[config,testConfig]);
			testConfig.curThread.releaseOnJoin =true;
			testConfig.curThread.deleteOnJoin =true;
			testConfig.curThread.captureOutput =false;
		})
	})	
//Myna.printConsole("done testThreads")
Myna.Thread.joinAll(30000,true,true);
// wait for results
	while (true){
		Myna.sleep(100)
		var done=true;//unless something is still pending
		//Myna.printConsole("result loop")
	// check for timeout
		var now = new Date().getTime();
		var elapsed = now-started;
		
		if (elapsed > 30000){
		Myna.printConsole("Timeout after " + Date.formatInterval(elapsed))
		//fail any pending tests
			config.services.forEach(function(serviceConfig,name){
				serviceConfig.tests
				.filter(function(testConfig){
					return testConfig.status="pending"
				})
				.forEach(function(testConfig){
					if (serviceConfig.testStatus == "pending"){
						serviceConfig.testStatus="fail";
						serviceConfig.status="fail";
					}
					testConfig.failCount++;
					testConfig.status="fail";
					testConfig.failMessage("timeout after " + Date.formatInterval(elapsed))
					
					if (testConfig.curThread && testConfig.curThread.javaThread.isAlive()){
						testConfig.curThread.javaThread.interrupt();
						Myna.sleep(1000);
						testConfig.curThread.javaThread.stop();	
					}
					delete testConfig.curThread
				})
			});
		} 
	// check for completed services 	
		config.services
		.forEach(function(serviceConfig,name){
			var testsComplete =serviceConfig.tests.every(function(testConfig){
				//Myna.printConsole(testConfig.test + ":" + testConfig.status)
				return testConfig.status != "pending"
			})
			
			if (testsComplete){
				serviceConfig.testStatus="complete";
				var allPassed = serviceConfig.tests.every(function(testConfig){
					if (testConfig.status=="fail" && testConfig.failCount >= (testConfig.failAfter||0)){
						return false;
					} else {
						return true;	
					}
				})
				if (allPassed){
					serviceConfig.status="pass";	
				} else {
					serviceConfig.status="fail"
					serviceConfig.tests.every(function(testConfig){
						testConfig.failCount=-1;
					})
					serviceConfig.onFail.forEach(function(handler){
						Myna.printConsole("failed " + name +", handler:" +handler)
						
						new Myna.Thread(function(service,handler,name){
							var code = new Myna.File("handlers/" + handler +".sjs")
							if (code.exists()){
								Myna.include(code,this)
								Myna.printConsole("handler " + handler)
								this[handler](service,name);
							} else {
								Myna.executeShell("/bin/bash",". /etc/profile\n" +handler)	
							}
						},[serviceConfig,handler,name])
					})
				}
				
			}
			
			if (serviceConfig.testStatus=="pending") done=false;
		});
		java.lang.Runtime.getRuntime().gc();
		if (done) break // results loop;
		
	}
//}
/* Myna.sleep(config.checkInterval);
//debug, only one loop
//if (loopCount >=2)break;
}
Myna.printDump(config,"config",15) */

Myna.println("Done!")


