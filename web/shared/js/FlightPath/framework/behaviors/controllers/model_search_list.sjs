/* Class:  Behavior: ModelSearchList
	Applies a "list" function to this controller that will search members of its 
	model (only DB based models)
	
	
	Parameters:
		modelName		-	*Optional, default null*
							String model name appropriate for $FP.getModel(). 
							If not defined this controller's model property will 
							be used instead of calling $FP.getModel()

		defaultSort		-	*Optional, default []*
							Array of {property:"colname",direction:"asc|desc"} 
							objects in the order the list should be sorted. This 
							can be overridden via params as either params.sort.
							see <$req.data> <Object.setByPath> for details on 
							how to send and array of objects without javascript

		searchFields	-	*Optional, default [all fields in model]*
							What fields to search on

		resultFields	-	*Optional, default [all fields in model]*
							What fields to return

		pageSize		-	*Optional, default null*
							If set, limits the number of rows returned. Can be 
							overridden via params.pageSize

		pageSizeParam	-	*Optional, default "pageSize"*					
							Name of the parameter from the client that contains 
							the pageSize

		page			-	*Optional, default null*
							The 1-based page to retrieve from the model. Can be overridden 
							via params.page 

		pageParam		-	*Optional, default "page"*
							Name of the parameter from the client that contains 
							the page number

		search			-	*Optional, default null*
							Search query to apply. See Search Queries below. Can 
							be overridden  via params.search 

		searchParam		-	*Optional, default "search"*
							Name of the parameter from the client that contains 
							the search string

		baseQuery		-	*Optional, default "select resultFields from tablename where 1=1*
							base query to use for this search. The search's where
							clause criteria will be appended to this. The 
							underlying Myna.query will use "params" as its 
							"values" property, so these are available to baseQuery

	Search Queries:
		Search Queries are string that indicate case-insensitive partial string
		matches to apply to the _searchFields_. Spaces create an implicit "AND"
		operation, the pipe (|) implies "OR" and the bang (!) indicates "NOT". 
		Order does not matter

		Example:
		(code)

			"engineer bob|sally !bobby" 

			in SQL: 
				col like '%engineer%' 
				and  (
					col like '%bob%' 
					or col like '%sally%'
				) 
				and col not like '%bobby%'
		(end)

	Parameters available in views:
		page		-	page number
		pageSize	-	page size
		result		-	Myna.Query object with query result

	Detail:
		This behavior creates a "list" function on this controller that will 
		list the members of this controller's model. It supports optional paging.
		It can also search 

	Usage:
	(code)
		
		//app/controllers/myController.sjs
		function init(){
			this.applyBehavior("ModelSearchList",{
				searchFields:[
					"last_name",
					"first_name",
					"email",
					"job_title"
				],
				defaultSort:[{
					property:"hire_date",
					direction:"desc"
				},{
					property:"last_name",
					direction:"asc"
				}],
				
			})
		}

		//in a view
		<form action="<%=Html.url({action="list"})%>" method="get">
			Search: <input name="search" value="ex: engineer bob|sally !bobby"><br>
			Sort By:<select name="sort[0].property">
						<option value="last_name"> Last Name</option>
						<option value="first_name"> First Name</option>
					</select>
					<select name="sort[0].direction">
						<option value="asc"> A-Z</option>
						<option value="Desc"> Z-A</option>
					</select><br>

			Page Size: <input name="limit" value="25"><br>


		</form>

	(end)
*/

function init(options){
	if (!options) options = {};
	options.setDefaultProperties({
		pageParam:"page",
		pageSizeParam:"pageSize",
		searchParam:"search"
	})



	if (!this.list){
		this.list =	function list(params){
			var $this = this;
			var model = options.modelName?$FP.getModel(option.modelName):this.model;
			var ds=model.ds;
			var sort = params.sort 
				|| options.sort
				|| [];
			
			var page = params[options.pageParam];
			var pageSize = params[options.pageSizeParam];
			var tableName = model.table.sqlTableName;
			var baseQuery = options.baseQuery 
				|| "select * from {0} where 1=1\n".format(tableName);

			var search = params[options.searchParam]||""
			var resultFields = (options.resultFields || model.table.columnNames)
				.map(function (name) {
					return model.table.getSqlColumnName(name)
				})

			var searchFields = (options.searchFields || model.table.columnNames)
				.map(function (name) {
					return model.table.getSqlColumnName(name)
				})
			
			var criteria = {
				plus:[],
				minus:[],
				or:[]
			}

			var tokenCount=0,token,tokenKey;
			search.trim().replace(/\s+/g," ").split(/\s/m).forEach(function (token) {
				if (!token.length) return
				if(token.startsWith("!")){
					token = token.after(1);
					tokenKey = "token{0}".format(++tokenCount);
					params[tokenKey] = "%{0}%".format(token.toLowerCase());
					criteria.minus.push(tokenKey);
				}else if (/\|/.test(token)){
					token.split(/\|/).forEach(function (token) {
						tokenKey = "token{0}".format(++tokenCount);
						params[tokenKey] = "%{0}%".format(token.toLowerCase());
						criteria.or.push(tokenKey);
					})
					
				}else{
					tokenKey = "token{0}".format(++tokenCount);
					params[tokenKey] = "%{0}%".format(token.toLowerCase());
					criteria.plus.push(tokenKey);
				}
			});
			//Myna.printConsole(Myna.dumpText(criteria) + "\n"+Myna.dumpText(params));
			var searchLine = "lower({0})".format(
				searchFields.map(function (col) {
					return "CAST({0} as VARCHAR(4000))".format(col)
				}).join(model.table.db.concatOperator)
				)
			var sql;
			var retVal =  new Myna.Query({
				ds:ds,
				log:true,
				sql:sql=<ejs>
					<%=baseQuery%>
						<@if criteria.plus.length>
						and(
							<%=criteria.plus.map(function (tokenKey) {
								return "{0} like {{1}:varchar}".format(searchLine,tokenKey);
							}).join(" AND ")%>
						)	
						</@if>
						<@if criteria.or.length>
						and(
							<%=criteria.or.map(function (tokenKey) {
								return "{0} like {{1}:varchar}".format(searchLine,tokenKey);
							}).join(" OR ")%>
						)	
						</@if>
						<@loop array="criteria.minus" element="tokenKey" index="i">
							and <%=searchLine%> not like {<%=tokenKey%>:varchar}
						</@loop>
					
					<@if sort.length>
						Order by
						<%=sort.map(function(def){
							return def.property + " " + def.direction;
						}).join()%>	
					</@if>
					
				</ejs>,
				values:params,
				page:page,
				pageSize:pageSize
			});

			return retVal.result;
			
		}
	}
	
}

