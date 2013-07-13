/*  
	This is an example of a global application property.
	Unless overridden, every application will see tha same value
	for $application.appPurpose. You can set any property you 
	like here, but it is really useful for server or instance 
	specific properties, such as appPurpose, or hostname.
	
	Consider using these values for appPurpose:
		* DEV 	- Development instance
		* TEST	- Test instance
		* TRAIN	- Training instance
		* PROD	- Production instance
	
	See myna/adminitrator/application.sjs for an example of using application.sjs
	in an application.
*/
$application.appPurpose = "DEV"; 