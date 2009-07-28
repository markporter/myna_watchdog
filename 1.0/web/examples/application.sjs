if (!$req.authPassword.length){
   $res.requestBasicAuth("Enter Admin and the administrator password");
   Myna.abort();
}