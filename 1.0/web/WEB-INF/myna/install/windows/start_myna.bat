@echo off
REM this is max memory to use. 
set mem=128

set server={server}
set context={webctx}
set port={port}
set webroot={webroot}
set logfile={logfile}

cd %webroot%\WEB-INF
set java={javahome}\bin\java.exe

set watchdog_jvm_args=-Dmyna.name=%server% -Xmx20m -server -cp .\lib\*;.\classes\
set server_jvm_args=-Dmyna.name=%server% -Xmx%mem%m -server
set myna_args=-c %context% -p %port% -w "%webroot%" -l "%logfile%" -- %server_jvm_args%

"%java%"  %watchdog_jvm_args%  info.emptybrain.myna.MynaServer %myna_args% 


