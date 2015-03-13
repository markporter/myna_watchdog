function init() {
	if (this.modelName){
		var saveServices = function () {
			if (!$application._SERVICES_SAVED_){
				$application._SERVICES_SAVED_=true;
				//Myna.printConsole("scheduled service save");
				$application.addOpenObject({
					close:function () {
						//Myna.printConsole("saving JSON");
						$FP.getController("Service")._saveJson();
					}
				})
			}
		}

		this.after("afterSaveField",saveServices)
		this.after("afterRemove",saveServices)
	}
	
}