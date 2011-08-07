/* Class: Model
	base model class. Extends <DataManager>.<ManagerObject>
*/
function Model(){}


/* Function: applyBehavior
	loads a behavior and applies it to this object
	
	Parameters:
		name		-	The ProperCased name of the behavior to load, or an array of these names
		
	Detail:
		Loads a behavior by name from app/behaviors/models/ or 
		framework/behaviors/models/, whichever is found first. Behaviors are 
		functions that are applied to the current object. <applyBehavior> should 
		be called from <init>
	
	Example:
	(code)
		//in some_model.sjs
		function init(){
			this.applyBehavior([
				"SomeBehavior",
				"SomeOtherBehavior"
			]);
		}
	(end)
	*/	
	Model.prototype.applyBehavior = function applyBehavior(name){
		if (!(name instanceof Array)){
			name = [name]
		}
		var $this= this;
		name.forEach(function(name){
			var b=new Myna.File($FP.dir,"app/behaviors/models",$FP.c2f(name)+".sjs")
			if (!b.exists()) {//check in framework
				b=new Myna.File($FP.dir,"framework/behaviors/models",$FP.c2f(name)+".sjs")
			}
			if (!b.exists()) throw new Error("Behavior '"+name + "' does not exist.");
				
			b=Myna.include(b,{});
			
			for (var p in b){
				if (p=="init") continue;
				$this[p] = b[p];
			}
			if ("init" in b) b.init.call($this)
		})
		
	}








