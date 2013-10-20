Myna Watchdog
=============

Myna Watchdog: a service for monitoring and restarting local processes

Download the Binary installer from [SourceForge]




To install:
-----------
execute:

    java -jar myna_watchdog-x.x.x.jar -m install


[SourceForge]:https://sourceforge.net/projects/mynawatchdog/files/latest/download

-----------------------------------------------------------------------------------------Release Name: 1.1.0
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
