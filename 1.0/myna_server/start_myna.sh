#!/bin/sh
#
# Myna Main instance Control Script
#

port=8180
myna_home=.
webroot=myna
jvm_args="-Xmx256m -Dsun.io.useCanonCaches=false -XX:MaxPermSize=128m -XX:+UseParallelGC -Djava.awt.headless=true"

args="--webroot=$webroot  --httpPort=$port"

#export JAVA_HOME=/usr/java/default/
#export JRE_HOME=/usr/java/default/jre/

echo 
echo "***********************************"
echo Starting Myna at http://localhost:8180 ... 
echo Press CTRL-C in this window to stop the server.
echo "***********************************"
java $jvm_args -jar $myna_home/winstone.jar $args