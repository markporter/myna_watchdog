Myna Watchdog
=============

Myna Watchdog: a service for monitoring and restarting local processes

To download and install on a Linux system:
-----------
execute:

    wget https://raw.githubusercontent.com/markporter/myna_watchdog/master/WatchdogLinuxInstaller.bash
    bash WatchdogLinuxInstaller.bash


-----------------------------------------------------------------------------------------

Release Name: 1.2.0
============================
Notes: 
New memory based DB, bug fixes

* **[ADD]**         Linux Installer
* **[CHANGE]**      removed embedded Myna server, now downloads and installs from Myna repo
* **[CHANGE]**      removed embedded Active Directory support, now uses Myna's AD authorization
* **[FIX]**         better startup managment


----------------------------------------------------------

Release Name: 1.1.0
============================
Notes: 
New memory based DB, bug fixes

* **[ADD]**         export functionality on services tab
* **[CHANGE]**      Now runs DB in memory. Each service change is written to $FP.dir/services.json. This file will be imported on startup
* **[CHANGE]**      Now uses "watchdog" ds instead of myna_instance
* **[CHANGE]**      more sensitive watchdog restart properties
* **[FIX]**         won't try to use watchdog auth type before it exists


----------------------------------------------------------
Release Name: 1.0.0
============================
Notes: initial Build



----------------------------------------------------------
