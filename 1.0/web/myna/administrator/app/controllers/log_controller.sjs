
/* ---------- list ---------------------------------------------------------- */
	function list(params){
		var $this = this;
		if (!params.sort){
			params.sort=[{
				property:"event_ts",
				direction:"desc"
			}];
			
		}
	
		var tokenCount=0,token,tokenKey;
		var criteria =params.toArray()
			.filter(function(tuple){
				var columnName = tuple.key;
				if ( $this.model.columnNames.contains(columnName) && tuple.value){
					tuple.plus=[];
					tuple.minus=[];
					tuple.or=[];
					tuple.value.trim().replace(/\s+/g," ").split(/\s/m).forEach(function (token) {
						if(token.startsWith("!")){
							token = token.after(1);
							tokenKey = "token{0}".format(++tokenCount);
							params[tokenKey] = "%{0}%".format(token.toLowerCase());
							tuple.minus.push(tokenKey);
						}else if (/\|/.test(token)){
							token.split(/\|/).forEach(function (token) {
								tokenKey = "token{0}".format(++tokenCount);
								params[tokenKey] = "%{0}%".format(token.toLowerCase());
								tuple.or.push(tokenKey);
							})
							
						}else{
							tokenKey = "token{0}".format(++tokenCount);
							params[tokenKey] = "%{0}%".format(token.toLowerCase());
							tuple.plus.push(tokenKey);
						}
					});
					return true;
				} 
				if (columnName.endsWith("_end")){
					tuple.col =columnName = tuple.key.listBefore("_");
					tuple.dateEnd = true;
				}
				if (columnName.endsWith("_start")){

					tuple.col =columnName = tuple.key.listBefore("_");
					tuple.dateStart = true;

				}
				if ( $this.model.columnNames.contains(columnName) && tuple.value){
					return true;
				} 
				return false;
			});

		var retVal =  new Myna.Query({
			ds:$FP.config.ds.log,
			sql:<ejs>
				select
				    log_id,
				    request_id,
				    instance_id,
				    hostname,
				    app_name,
				    type,
				    purpose,
				    label,
				    
				    event_ts,
				    request_elapsed,
				    log_elapsed
				from myna_log_general
				where 1=1
					<@loop array="criteria" element="tuple" index="i">
						<@if tuple.dateStart>
							and <%=tuple.col%> >= {<%=tuple.key%>:date}
						<@elseif tuple.dateEnd>
							and <%=tuple.col%> <= {<%=tuple.key%>:date}
						<@else>
							<@if tuple.plus.length>
							and(
								<%=tuple.plus.map(function (tokenKey) {
									return "lower({0}) like {{1}:varchar}".format(tuple.key,tokenKey);
								}).join(" AND ")%>
							)	
							</@if>
							<@if tuple.or.length>
							and(
								<%=tuple.or.map(function (tokenKey) {
									return "lower({0}) like {{1}:varchar}".format(tuple.key,tokenKey);
								}).join(" OR ")%>
							)	
							</@if>
							<@loop array="tuple.minus" element="tokenKey" index="i">
								and lower(<%=tuple.key%>) not like {<%=tokenKey%>:varchar}
							</@loop>
						</@if>
					</@loop>
				Order by
					<%=params.sort.map(function(def){
						return def.property + " " + def.direction;
					}).join()%>
			</ejs>,
			values:params,
			page:params.page,
			pageSize:params.limit
		});
		return retVal.result;
		
	}
/* ---------- list_orig ---------------------------------------------------------- */
	function list_orig(params){
		if (!params.sort){
			params.sort=[{
				property:"event_ts",
				direction:"desc"
			}]
			
		}
		
		var $this = this;
		var criteria = params.filter(function(v,k){
			if ( $this.model.columnNames.contains(k) && v){
				return true;
			}
		}).map(function(v,k){
			return "%" +String(v).toLowerCase()+"%"
		})
		
		
		//Handle the date ranges
			var where =["1=1"];
			[
				"event_ts"
			].forEach(function(f){
				if (params[f+"_start"]){
					criteria[f +" >="] = params[f+"_start"]
				}
				if (params[f+"_end"]){
					criteria[f +" <="] = params[f+"_end"]
				}
				
			})
		
		
		criteria.orderBy =params.sort.map(function(def){
			return def.property + " " + def.direction
		}).join()
		
		var meta = {
			page:params.page,
			pageSize:params.limit,
		}
		var beans=this.model.findBeans(criteria,meta)
		return {
			data:beans,
			totalRows:beans.totalRows
		} 
		
	}



/* ---------- detail ----------------------------------------------------- */
	function detail(params){
		this.set("bean",this.model.getById(params.id))
	}
/* ---------- columnValues ------------------------------------------------- */
	function columnValues(params){
		if ("instance_id,hostname,app_name,type,purpose".listContains(params.columnName)){
			return new Myna.Query({
				ds:this.model.ds,
				sql:<ejs>
					select distinct
						lower(<%=params.columnName%>) as "value"
					from myna_log_general
					order by lower(<%=params.columnName%>) asc 
				</ejs>,
				maxRows:5000,
				values:{}
			}).result.data
		} else {
			return []	
		}
	}
/* ---------- getLoggers ---------------------------------------------------- */
function getLoggers(data){
	return new Myna.File("/shared/js/libOO/loggers")
	.listFiles("sjs").map(function(f){
		var name=f.fileName.listBefore(".")
		return {
			label:name.replace(/_/g," ").titleCap(),
			value:name
		}
	})
}