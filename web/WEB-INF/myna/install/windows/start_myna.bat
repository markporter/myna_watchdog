@echo off
REM this is max memory to use. 
set mem=128

set server={server}
set context={webctx}
REM set this to 0 to disable http 
set port={port}
set webroot={webroot}
set logfile={logfile}

REM SSL settings
REM set this to something non-zero to enable https
set ssl_port={sslPort}
set keystore={keystore}
set ks_pass={ksPass}
set ks_alias={ksAlias}

cd %webroot%\WEB-INF
set java={javahome}\bin\java.exe


set watchdog_jvm_args=-Dmyna.name=%server% -Xmx20m -server -cp .\lib\*;.\classes\
set server_jvm_args=-Dmyna.name=%server% -Xmx%mem%m -server
set myna_args=-c %context% -sp %ssl_port% -ks "%keystore%" -ksp "%ks_pass%" -ksa "%ks_alias%" -p %port% -w "%webroot%" -l "%logfile%" -- %server_jvm_args%

"%java%"  %watchdog_jvm_args%  info.emptybrain.myna.MynaServer %myna_args% 


