@echo off
REM ============== Configurable Settings: ======================================
set mem=256
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
set java={javahome}\bin\java.exe
set jdll={javahome}\bin\client\jvm.dll
set prunsrv_path=myna\procrun
REM for 64-bit systems, uncomment:
REM set prunsrv_path=myna\procrun\amd64

REM ============== Internal Settings (don't modify): ===========================
set webinf=%webroot%\WEB-INF
set prunsrv=%webinf%\%prunsrv_path%\prunsrv.exe

set cp=%webinf%\lib\*;%webinf%\classes\	
set controlClass=info.emptybrain.myna.MynaServer	
set start_params=-c#%context%#-sp#%ssl_port%#-ks#"%keystore%"#-ksp#"%ks_pass%"#-ksa#"%ks_alias%"#-p#%port%#-w#"%webroot%"#-l#"%logfile%"#--#-Xmx%mem%m	
set cmd=IS
sc query state= all | find /I "Myna App Server %server%"
if %ERRORLEVEL% EQU 0 set cmd=US
echo %prunsrv% "//%cmd%//%server%" --DisplayName="Myna App Server %server%"  --Install=%prunsrv% --Jvm=%jdll% --StartMode=jvm --StopMode=jvm  --Classpath=%cp%  --StartClass=%controlClass%  --StartParams=%start_params%  --StopClass=%controlClass% --StopMethod=prStop	
%prunsrv% "//%cmd%//%server%" --DisplayName="Myna App Server %server%"  --Install=%prunsrv% --Jvm=%jdll% --StartMode=jvm --StopMode=jvm  --Classpath=%cp%  --StartClass=%controlClass%  --StartParams=%start_params%  --StopClass=%controlClass% --StopMethod=prStop	

