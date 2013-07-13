@echo off
set port=8180
set myna_home=.
set webroot=myna
set jvm_args= -Xmx256m -Dsun.io.useCanonCaches=false -XX:MaxPermSize=128m -XX:+UseParallelGC -Djava.awt.headless=true

set args=--webroot=%webroot% --httpPort=%port% 

rem set these if you get java errors
rem SET JAVA_HOME=
rem SET JRE_HOME=


echo 
echo ***********************************
echo Starting Myna at http://localhost:8180 ... 
echo Press CTRL-C in this window to stop the server.
echo ***********************************
java %jvm_args% -jar %myna_home%/winstone.jar %args% 
