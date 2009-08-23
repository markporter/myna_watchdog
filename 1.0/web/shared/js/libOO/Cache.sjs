/* 
	Class: Myna.Cache
	Creates and manages cached objects
	
	This class can cache both generated output and generated values. This works 
	best for time consuming tasks whose output changes infrequently. 
	
	Here is an example:
	(code)
	Myna.println("This line is not cached");
	var result = new Myna.Cache({
		name:"test",
		tags:"test,query,output",
		refreshInterval:Date.getInterval(Date.MINUTE,3),
		code:function(sleepTime){
			//an artificially long process
			Myna.sleep(Date.getInterval("s",sleepTime));
			Myna.print("this line is cached: " + new Date())
		}
	}).call(10)
	(end)
*/
/* Property: code
	The cache function. This is function that will generate cached values and 
	page output
*/
/* Property: name
	*Optional* Unique name for this cache object
*/
/* Property: tags
	*Optional* A comma separated list of strings associated with this cache object.
*/
/* Property: refreshInterval
	*Optional, default 1 hour*
	Cache values older than this interval will be 
	refreshed when accessed. See <Date.getInterval>. 
	A value of -1 will disable refreshing.
*/
/* Property: maxIdleInterval
	*Optional, default 24 hours* 
	Interval that a cached object can be 
	idle (not accessed) before being deleted. See 
	<Date.getInterval>. A value of -1 means the cache 
	never expires, it is only refreshed. Note that if 
	_maxIdleInterval_ is less than _interval_, it 
	will effectively become the refresh interval 
	during periods of infrequent access
*/
/* Property: allowBackgroundRefresh
	*Optional, default true*
	if true, and a cached value is available, then 
	cache refreshes happen in a background thread 
	and the current cached value is returned. Note 
	that if _maxIdleInterval_ is set, background 
	refreshes will only happen if _interval_ has 
	been exceeded but _maxIdleInterval_ has not.
*/
if (!Myna) var Myna={}
/* Constructor: Cache
	Creates a new Cache Object 
	
	Parameters:
		options		-	an object representing cache options. See below.
		
	Options Object:
		code					-		A function to cache. All parameters used by the 
										function will need to be passed in because _code_
										will be executed in a separate thread.
		name					-		*Optional, default code.toSource()*
										A name to associate with all the caches for this 
										cache object. Used to find this cache object from 
										other threads.
		tags					-		*Optional, default null*
										an array or a comma separated list of strings to 
										associate with this cache object. Used to find 
										multiple cache objects from other threads. If 
										$application.appName is defined, it is 
										automatically added as a tag. 
		refreshInterval		-		*Optional, default 1 hour*
										Cache values older than this interval will be 
										refreshed when accessed. See <Date.getInterval>. 
										A value of -1 will disable refreshing. 
		maxIdleInterval		-		*Optional, default 24 hours* 
										Interval that a cached object can be 
										idle (not accessed) before being deleted. See 
										<Date.getInterval>. A value of -1 means the cache 
										never expires, it is only refreshed. Note that if 
										_maxIdleInterval_ is less than _interval_, it 
										will effectively become the refresh interval 
										during periods of infrequent access 
		allowBackgroundRefresh	-	*Optional, default true*
											if true, and a cached value is available, then 
											cache refreshes happen in a background thread 
											and the current cached value is returned. Note 
											that if _maxIdleInterval_ is set, background 
											refreshes will only happen if _interval_ has 
											been exceeded but _maxIdleInterval_ has not.
	*/
	Myna.Cache = function CacheConstructor(options){
		var $this = this;
		this.setDefaultProperties(options);
		this.setDefaultProperties({
			params:{},
			tags:"",
			allowBackgroundRefresh:true,
			name:this.code.toSource(),
			maxIdleInterval:Date.getInterval("h",24),
			refreshInterval:Date.getInterval("h",1),
		})
		if (this.tags instanceof Array) this.tags = this.tags.join();
		if ("appName" in $application) {
			this.tags.listAppendUniqueNoCase($application.appName);
		}
		this.checkRequired(["code"]);
		var cacheStore = $server.get("MYNA:cacheStore");
		if (!cacheStore){
			//create the cacheStore
			if (!Myna.lock("MYNA:cacheStore:create",10,function(){
				cacheStore = $server.get("MYNA:cacheStore");
				if (!cacheStore){
					cacheStore = new Myna.DataSet({
						columns:"name,tags,refreshInterval,maxIdleInterval",
						data:[]
					})	
					$server.set("MYNA:cacheStore", cacheStore)
				}
			})) throw new Error("Unable to lock cache store")
		}
		if (!Myna.lock("MYNA:cacheStore:update",10,function(){
			var row = cacheStore.findFirst("name",$this.name);
			if (row) {
				$this.applyTo(row,true);
				$this.cacheKeys = row.cacheKeys;
			} else{
				$this.cacheKeys ={}
				cacheStore.push($this);
			}
		})) throw new Error("Unable to lock cache store")
	}
/* Function: backgroundRefresh
	refresh this cache in a background thread.
	
	Parameters:
		Whatever parameters required for the cached function 

	Returns:
		Myna.Thread instance
	*/	
	Myna.Cache.prototype.backgroundRefresh = function CacheBackgroundRefresh(args){
		var $this = this;
		var c = org.apache.jcs.JCS.getInstance("value");
		var key = $this.name+ ":" +new java.lang.String(
			args.toJson()
		).hashCode();
		
		var time;
		if (c.get(key)) {
			time = c.getElementAttributes(key).getCreateTime()
		}
		
		return new Myna.Thread(function(cacheObj,args,key,time){
			var c = org.apache.jcs.JCS.getInstance("value");
			var cacheValue = c.get(key); 
			var gotLock =Myna.lock(key,0, function(){
				/* 
				Now that we have a lock, check if another thread has 
				updated the cache
				*/ 
				
				if (!cacheValue //no value
					||	c.getElementAttributes(key).getCreateTime() == time //value hasn't changed
				){
					cacheValue={
						value:cacheObj.code.apply(cacheObj,args),
						content:$res.clear()
					}
					
					var att = c.getDefaultElementAttributes();
					//set max idle time to  
					if (cacheObj.maxIdleInterval != -1){
						att.maxIdleTimeSeconds =(Math.floor(cacheObj.maxIdleInterval/1000));
					}
					c.put(key,cacheValue,att);
					
				} 
				
			})
			return cacheValue||c.get(key);
		},[$this,args,key,time])
	}
/* Function: refresh 
	refresh this cache and return cached value object;
	
	
	The cache value properties:
	value		-	value returned from cache function
	content	-	content generated from the cache function
	
	*/
	Myna.Cache.prototype.refresh = function CacheRefresh(args){
		var $this = this;
		var c = org.apache.jcs.JCS.getInstance("value");
		var key =$this.name+ ":" + new java.lang.String(
			args.toJson()
		).hashCode();
		
		var result = this.backgroundRefresh(args).join();
		return result
		//return c.get(key);
	}
/* Function: call
	Calls the cache function.
	
	Parameters:
		Whatever parameters required by the cache function
		
	Returns:
		cache function's returned value
		
	Detail:
		returns the return value of the cache function and prints any content 
		generated by the cache function. Separate cached values are generated for 
		each set of parameters passed to this function.
		
		If the cached value is still valid, the 
		cached value is used. If the cached value is invalid, and 
		<allowBackgroundRefresh> is true, a background thread is spawned to update the 
		cache, and the existing cache value is used. If <allowBackgroundRefresh> is 
		false or if there is not yet a cached value, the current thread is blocked
		until values can be generated. 
	*/	
	Myna.Cache.prototype.call = function CacheCall(){
		var $this = this;
		var c = org.apache.jcs.JCS.getInstance("value");
		var args = Array.parse(arguments); 
		var storeEntry  = $server.get("MYNA:cacheStore").findFirst("name",this.name);
		
		var key = $this.name+ ":" +new java.lang.String(
			args.toJson()
		).hashCode();
		$this.cacheKeys[key] = true;
		//make sure that only one thread checks the cache at a time
		var cacheObj = c.get(key);
		
		
		if (cacheObj) {
			if ("refreshInterval" in $this){
				var att = c.getElementAttributes(key)
				var time = att.getCreateTime();
				storeEntry.lastAccessed =new Date( att.getLastAccessTime()); 
				if (!$this.refreshInterval 
					|| time + $this.refreshInterval < new Date().getTime() 
				){
					if ($this.allowBackgroundRefresh){
						$this.backgroundRefresh(args);
					} else {
						cacheObj = $this.refresh(args);
					}
				} 
			} else {
				//no test defined, cache never expires	
			}
		} else {
			cacheObj = $this.refresh(args);
		}
		if (($server.memAvailable/$server.memMax) < .2){
			c.remove(key); //don't cache this result
			delete $this.cacheKeys[key]
		}
		//try to free memory in the background
			new Myna.Thread(function(){
				Myna.lock("MYNA:cacheFree",0,function(){
					while (true){
						if (
							($server.memAvailable/$server.memMax) > .2
							|| !c.freeMemoryElements(10)
						) break;
						(3).times(function(){
							java.lang.System.gc();
						})	
					}
				})
			},[])
		if (!cacheObj) {
			throw new Error("Unable to create or retrieve cache value for cache '" +this.name+ "'");
		}
		if (cacheObj.content) Myna.print(cacheObj.content)
		return cacheObj.value
	}
/* Function: getCachedValues
	returns a <Myna.DataSet> of all currently cached values
	 
	*/	
	Myna.Cache.prototype.getCachedValues = function Cache_getCachedValues(){
		var $this = this;
		var c = org.apache.jcs.JCS.getInstance("value");
		var elements = Myna.JavaUtils.mapToObject(c.getMatchingCacheElements($this.name +":.*"))
		var key_list = elements.getKeys().join();
		return new Myna.DataSet({
			columns:"key,created,lastAccessed,maxLifeSeconds,idleSeconds,value",
			data:$this.cacheKeys.getKeys()
				.filter(function(key){
					if (key_list.listContains(key)){
						return true;
					}else{
						delete $this.cacheKeys[key];
						return false;
					}
				}).map(function(key){
					var att = elements[key].getElementAttributes()
					return {
						key:key,
						created: new Date(att.getCreateTime()),
						lastAccessed: new Date(att.getLastAccessTime()),
						maxLifeSeconds:att.getMaxLifeSeconds(),
						idleSeconds: att.getIdleTime(),
						value:c.get(key)
					}
				})
		}) 	
	}
/* Function: clear
	clears all cached values for this cache object 
	 
	Example:
	(code)
	var cacheObject = Myna.Cache.getByName("test");
	if (cacheObject) cacheObject.clear();
	(end)
	*/	
	Myna.Cache.prototype.clear = function Cache_clear(){
		var $this = this;
		var c = org.apache.jcs.JCS.getInstance("value");
		$this.cacheKeys.getKeys().forEach(function(key){
			c.remove(key);
			delete $this.cacheKeys[key];
		})
		 	
	}
/* Function: getByName 
	Static function that returns the cache object associated with the supplied 
	name, or null if not found
	
	Parameters:
	name	-	Name of cache object to retrieve. Case-sensitive.
	
	Example:
	(code)
	//clear all the cached values of the "test" cache
	var cacheObject = Myna.Cache.getByName("test")
	if (cacheObject) cacheObject.clear()
	
	(end)
	*/	
	Myna.Cache.getByName=function CacheGetByName(name){
		var cacheStore = $server.get("MYNA:cacheStore");
		if (!cacheStore) return null
		return cacheStore.findFirst("name",name)
	}
/* Function: getByTags 
	Static function that returns a <Myna.DataSet> of cache objects that match 
	all of the supplies tags 
	
	Parameters:
	tags		-	comma separated list of tags to match. Case-insensitive.
	
	Example:
	(code)
	var cacheObjects = Myna.Cache.getByTag("Query,table:orders")
	
	(end)
	*/	
	Myna.Cache.getByTags=function CacheGetByTags(tags){
		var cacheStore = $server.get("MYNA:cacheStore");
		if (!cacheStore) return null
		return cacheStore.findAll("tags",function(rowTags){
			return tags.split(/,/).every(function(tag){
				return rowTags.listContainsNoCase(tag)
			})
		})
	}	
/* Function: clearByTags 
	clears the cached values of all cache objects that match 
	all of the supplies tags 
	
	Parameters:
	tags		-	comma separated list of tags to match. Case-insensitive.
	
	Example:
	(code)
	Myna.Cache.clearByTag("Query,table:orders")
	
	(end)
	*/	
	Myna.Cache.clearByTags=function Cache_clearByTags(tags){
		var $this = this;
		var c = org.apache.jcs.JCS.getInstance("value");
		Myna.Cache.getByTags(tags).forEach(function(obj){
			obj.clear()
		})
	}