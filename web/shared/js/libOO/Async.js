/* Class: Async
	Web browser asynchronous function utilities
	
	
	Detail:
		The purpose of the Async library is to execute a group of asynchronous 
		functions, with a single callback when they are complete. <marshal> 
		executes the functions all at the same time, and <sequence> executes 
		them in the order defined. Both of these functions return an async handle object 
		that keeps track of the progress. To execute a function when all the 
		async functions are complete, call "then(somefunction)" on the returned 
		handle object.
		
		See:
		* <marshal>
		* <sequence>
		
		Note:
			both <marshal> and <sequence> recognize the returned async handle object, 
			so these handle objects can be used to nest multiple sets of callbacks like 
			so
			
		(code)
			var firstSet = Async.sequence(f1,f2,..fn);
			var secondSet = Async.sequence(f1,f2,..fn);
			//at this point both sets are executing their sequences in parallel
			Async.marshal(
				firstSet,
				secondSet
			).then(function(){
				alert("both sets done!")
			})
			
		(end)
	*/
	var Async = {
		/* Function: marshal
			Executes multiple async functions and then a single handler when done
				
			Parameters:
				one or more async functions that accept a function as their first 
				parameter, or an array of such functions. You can use the returned 
				handle from <marshal> or <sequence>
				
			returns:
				handle object with a "then" function. Call this with a function 
				to execute when all async functions are complete
				
			Example:
			(code)
				Async.marshal(
					function(done){
						window.setTimeout(function(){
							console.log(1)
							done()
						},100)
					},
					function(done){
						window.setTimeout(function(){
							console.log(2)
							done()
						},200)
					},
					function(done){
						window.setTimeout(function(){
							console.log(3)
							done()
						},50)
					}
				).then(function(){
					//this runs when all callbacks are done
					console.log("all done!")
				})
				
			This outputs:
				3
				1
				2
				all done!
				
			(end)
			
			You can also delay the final handler until a later time by saving 
			the handle object and calling then() when you are ready
			
			(code)
			<script>
				
				var allCallbacks = Async.marshal(
					function(done){
						ajax1(done);
					},
					function(done){
						ajax2(done);
					},
					function(done){
						ajax3(done);
					},
				)
				window.onload = function(){
					//this will execute immediately if all the callbacks are done, 
					otherwise it will wait until they are all done before executing 
					allCallbacks.then(function(){
						alert("Yippie! all done!")
					})
				}
			</script>
			(end)
			
		*/
		marshal:function(){
			var args= Array.parse(arguments)
			if (args.first({}) instanceof Array) args = args.first()
			args = args.map(function(arg){
				if (typeof arg == "function") {
					return arg;
				} else {
					return function(done){
						arg.then(done)
					}	
				}
			})
			var handle ={
				count:args.length,
				then:function(f){
					if (!f) return this;
					if (!handle.count) {
						f();
					}else {
						this.then=f
						
					}
					return this
				}
			}
			var done =function(){
				if(!--handle.count){
					handle.then()	
				}
			} 
			args.forEach(function(f){
				try{
					f(done);
				} catch (e){
					if (typeof console != "undefined") console.log(e)
					done()
				}
			})
			return handle;
		},
		/* Function: sequence
			Executes multiple async functions, one after the other, and then a 
			single handler when done
				
			Parameters:
				one or more async functions that accept a function as their first 
				parameter, or an array of such functions. You can use the returned 
				handle from <marshal> or <sequence>
				
			returns:
				handle object with a "then" function. Call this with a function 
				to execute when all async functions are complete
				
			Example:
			(code)
				Async.sequence(
					function(done){
						window.setTimeout(function(){
							console.log(1)
							done()
						},100)
					},
					function(done){
						window.setTimeout(function(){
							console.log(2)
							done()
						},200)
					},
					function(done){
						window.setTimeout(function(){
							console.log(3)
							done()
						},50)
					}
				).then(function(){
					//this runs when all callbacks are done
					console.log("all done!")
				})
				
			This outputs:
				1
				2
				3
				all done!
				
			(end)
			
			You can also delay the final handler until a later time by saving 
			the handle object and calling then() when you are ready
			
			(code)
			<script>
				
				var allCallbacks = Async.sequence(
					function(done){
						ajax1(done);
					},
					function(done){
						ajax2(done);
					},
					function(done){
						ajax3(done);
					},
				)
				window.onload = function(){
					//this will execute immediately if all the callbacks are done, 
					otherwise it will wait until they are all done before executing 
					allCallbacks.then(function(){
						alert("Yippie! all done!")
					})
				}
			</script>
			(end)
			
		*/
		sequence:function(){
			var args= Array.parse(arguments)
			if (args.first({}) instanceof Array) args = args.first()
			args = args.map(function(arg){
				if (typeof arg == "function") {
					return arg;
				} else {
					return function(done){
						arg.then(done)
					}	
				}
			})
			var handle ={
				then:function(f){
					if (!f) return this;
					if (!args.length) {
						f();
					}else {
						this.then=f
						
					}
					return this
				}
			}
			var done =function(){
				args.shift();
				if(args.length){
					runFunction(args.first());	
				} else {
					handle.then();
						
				}
			} 
			var runFunction = function(f){
				try{
					f(done);
				} catch (e){
					if (typeof console != "undefined") console.log(e)
					done()
				}
			}
			//first function or dummy return if no functions
			runFunction(args.first(function(done){done()}));
			
			return handle;
		}
	}