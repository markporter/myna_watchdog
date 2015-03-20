#!/bin/bash

#TODO intro

if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

if ! type -P git >/dev/null 2>&1 ; then
    echo "Please install \"git\" before continuing."
    exit 1
fi
if ! type -P java >/dev/null 2>&1; then
    echo "Please install \"java\" before continuing."
    exit 1
fi

if ! type -P wget >/dev/null 2>&1; then
    echo "Please install \"wget\" before continuing."
    exit 1
fi

wget -O /tmp/myna_installer.jar "https://sourceforge.net/projects/myna/files/latest/download"
/etc/init.d/myna_watchdog stop > /dev/null 2>&1
java -jar /tmp/myna_installer.jar -m install -l /var/log/myna_watchdog -p 0 -sp 2814 -s myna_watchdog -u root -w /opt/myna_watchdog/
echo "\<META HTTP-EQUIV=\"refresh\" content=\"0; url=watchdog\"\>" > /opt/myna_watchdog/index.html
if -f /opt/myna_watchdog/.git; then
  cd /opt/myna_watchdog/
  git pull origin master
else
  cd /opt/myna_watchdog/
  git init
  git remote add origin https://github.com/markporter/myna_watchdog.git
  git fetch
  git checkout -t origin/master
  #git clone https://github.com/markporter/myna_watchdog.git /opt/myna_watchdog/
fi
#rm -rf /opt/myna_watchdog/watchdog &&  mkdir /opt/myna_watchdog/watchdog && rsync -a ~mark/watchdog/watchdog/ /opt/myna_watchdog/watchdog/
echo 

/sbin/chkconfig --add myna_watchdog > /dev/null 2>&1
retval=$?
if [ $retval != 0 ]; then 
	update-rc.d myna_watchdog defaults > /dev/null 2>&1
	retval=$?
fi

if [ $retval = 0 ]; then 
	echo "Installed Myna Watchdog, and added to your server startup"	
else
	echo "Installed Myna Watchdog. Please add /etc/init.d/myna_watchdog to your server startup"
fi

/etc/init.d/myna_watchdog start

echo ========================== 
echo   Myna Watchdog Starting
echo   Connect to https://`cat /etc/hostname`:2814/
echo ========================== 

