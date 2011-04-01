/* 
	Class: Myna.DataSet
		A normalized data structure for working with tabular data 
		
*/

if (!Myna) var Myna={}
/* Constructor: DataSet
	Creates a new DataSet Object 
	
	Parameters:
		options		-	Either an array to be converted to a DataSet, or and 
							object containing detailed options. If an array, the array 
							must contain at least one record, and the record should 
							have all the non-function properties expected in the 
							DataSet so that <DataSet.columns> can be inferred. If this 
							is an object it should conform to the Options Object 
							defined below.
		
	Options Object:
		data		-	*Optional default []*
						This is an array of initial data. May be empty.
		columns	-	*Optional default []*
						Either a comma separated list, an array of column names, or 
						an object whose non-function properties represent the column 
						names. These define the known properties of the objects in a 
						DataSet array. If _columns_ is not provided, but _data_ 
						contains at least one row, _columns_ will be calculated as all 
						the non-function properties of the first row.
		loader		-	*Optional default null*
						If provided, this will be the implementation of <DataSet.load>
						
	Detail:
		DataSet is an array of objects. This is treated much like the result set 
		of a query, but does not need to come from a query. DataSet's provide a 
		normalized way to represent any tabular data 
	*/
	Myna.DataSet =function (options){
		var ds = this;
		if (this == Myna) throw new SyntaxError("Myna.DataSet is an object contructor. Please use the  'new' operator");
		
		if (options instanceof Array){
			//shallowly copies the data on to this object
			options.forEach(function(element){
				ds.push(element)
			})
			if (options.length) this.columns = this[0].getKeys();
			
		} else if (options instanceof Object){
			/* initial data */
				if (options.data instanceof Array){
					options.data.forEach(function(element){
						ds.push(element)
					})
				}
			/* columns */
				if (typeof options.columns =="string"){
					ds.columns = options.columns.split(/,/) 
				} else if (options.columns instanceof Array){
					ds.columns = options.columns.applyTo([]);
				} else if (options.columns instanceof Object){
					ds.columns = options.columns.getKeys();
				}
				
			/* loader */
				if (options.loader instanceof Function){
					ds.loader = options.loader;
				}
		}
	}
	Myna.DataSet.prototype = [];
	Myna.DataSet.prototype.columns = [];
	Myna.DataSet.prototype.load = function(options){
		if (this.loader){
			options = options||{}
			options.maxRows = options.maxRows;
			options.startRow = options.startRow||1;
			this.length=0;
			var ds = this;
			this.loader(options).forEach(function(e){
				ds.push(e);
			})
		}
		
		return this;	
	};
/* Function: contains
	returns true if any row in the DataSet has a _column_ value that matches 
	_compare_
	
	Parameters:
		column			-	name of the column to search.
		compare		-	RegExp, string regular expresion, or function to compare. 
							if _compare_ is a function, it will be called with the 
							"Compare Function Arguments" below. The supplied compare
							function should return true if the current row should be 
							output
		
	Compare Function Arguments:
		columnValue	-	Value of _column_ in the current row,
		data			-	An object that represents all the columns in this row
		index			-	The index of the current row
		dataset		-	A reference to this dataset
		
	*/	
	Myna.DataSet.prototype.contains = function(column, compare){
		if (!column) throw new SyntaxError("column is required")
		if (!compare 
			|| (
				!(compare instanceof RegExp ) 
				&& !(typeof compare =="string") 
				&& !(compare instanceof Function)
			)
		) throw new SyntaxError("compare is required, and must be either a RegExp object,a string regular expression, or a function") 
		if (typeof compare  =="string") compare = new RegExp(compare);
		if (compare instanceof RegExp){
			var regex = compare;
			compare = function(columnValue){
				return regex.test(columnValue)
			}
		}
		for (var x=0; x < this.length; ++x){
			if (compare(this[x][column],this[x],x,this)){
				return true;
			}
		}
		return false;
	};
/* Function: findFirst
	returns the first row in the DataSet whose _column_ value matches _compare_, or 
	null if no matches
	
	Parameters:
		column			-	name of the column to search.
		compare		-	RegExp, string regular expresion, or function to compare. 
							if _compare_ is a function, it will be called with the 
							"Compare Function Arguments" below. The supplied compare
							function should return true if the current row should be 
							output
		
	Compare Function Arguments:
		columnValue	-	Value of _column_ in the current row,
		data			-	An object that represents all the columns in this row
		index			-	The index of the current row
		dataset		-	A reference to this dataset
		
	*/	
	Myna.DataSet.prototype.findFirst = function DataSet_findFirst(column, compare){
		if (!column) throw new SyntaxError("column is required")
		if (!compare 
			|| (
				!(compare instanceof RegExp ) 
				&& !(typeof compare  =="string") 
				&& !(compare instanceof Function)
			)
		) throw new SyntaxError("compare is required, and must be either a RegExp object,a string regular expression, or a function") 
		if (typeof compare=="string") compare = new RegExp("^"+compare.escapeRegex()+"$");
		if (compare instanceof RegExp){
			var regex = compare;
			compare = function(columnValue){
				return regex.test(columnValue)
			}
		}
		for (var x=0; x < this.length; ++x){
			if (compare(this[x][column],this[x],x,this)){
				return this[x];
			}
		}
		return null;
	};
/* Function: findAll
	returns a new DataSet of all the rows in this DataSet whose _column_ value 
	matches _compare_
	
	Parameters:
		column			-	name of the column to search.
		compare		-	RegExp, string regular expression, or function to compare. 
							if _compare_ is a function, it will be called with the 
							"Compare Function Arguments" below. The supplied compare
							function should return true if the current row should be 
							output
		
	Compare Function Arguments:
		columnValue	-	Value of _column_ in the current row,
		data			-	An object that represents all the columns in this row
		index			-	The index of the current row
		dataset		-	A reference to this DataSet
		
	*/	
	Myna.DataSet.prototype.findAll = function DataSet_findAll(column, compare){
		var $this = this;
		if (!column) throw new SyntaxError("column is required")
		if (!compare 
			|| (
				!(compare instanceof RegExp ) 
				&& !(typeof compare  =="string") 
				&& !(compare instanceof Function)
			)
		) throw new SyntaxError("compare is required, and must be either a RegExp object,a string regular expression, or a function") 
		if (typeof compare  =="string") compare = new RegExp("^"+compare.escapeRegex()+"$");
		if (compare instanceof RegExp){
			var regex = compare;
			compare = function(columnValue){
				return regex.test(columnValue)
			}
		}
		return new Myna.DataSet({
			columns:$this.columns,
			data:$this.filter(function(row,index,dataset){
				return compare(row[column],index,row,dataset)
			})
		})
		
	};

/* Function: valueArray
	returns an array of the values of a column.
	
	Parameters:
		columnName		-	String Column name to return
	*/
	Myna.DataSet.prototype.valueArray=function(columnName){
		var name=columnName; 
		return Array.prototype.map.call(this,function(element){ return element[name]})	
	}
/* Function: map
	Creates a new DataSet with the results of calling a provided function on every element in this array.

	See:
		<Array.map>
    */
    Myna.DataSet.prototype.map = function(func) {
        return new Myna.DataSet({
            data:Array.prototype.map.call(this,func),
            columns:this.columns
        })
    }
/* Function: filter
	Performs Array.filter, but returns a new DataSet with the same columns as 
	this one

	See:
		<Array.filter>
    */
	Myna.DataSet.prototype.filter = function() {
	  var args = Array.prototype.slice.call(arguments,0);
	  return new Myna.DataSet({
			data:Array.prototype.filter.apply(this,args),
			columns:this.columns
	  })
	}
/* Function: concat
	Performs Array.concat, but returns a new DataSet with the same columns as 
	this one

	See:
		<Array.concat>
    */
	Myna.DataSet.prototype.concat = function(otherArray) {
		var data= []
		this.forEach(function(row){
			data.push(row)
		})
		otherArray.forEach(function(row){
			data.push(row)
		})
		return new Myna.DataSet({
			data:data,
			columns:this.columns
		})
	}
/* Function: slice
	Performs Array.slice, but returns a new DataSet with the same columns as 
	this one

	See:
		<Array.slice>
    */
	Myna.DataSet.prototype.slice = function() {
		var args = Array.prototype.slice.call(arguments,0);
		return new Myna.DataSet({
			data:Array.prototype.slice.apply(this,args),
			columns:this.columns
		})
	}	
	
/* Function: minByCol
	returns the "smallest" value of a column.
	
	Parameters:
		column		-	column to compare
		compare	-	*Optiional, default: function(a,b){return a < b}*
						A compare function like sort() uses to determine the minimum
						value
	
	*/
	Myna.DataSet.prototype.minByCol = function(column,compare) {
		if (!compare) compare = function(a,b){return a < b}
		return this.reduce(function(result,e){
			if (result === null ||compare(e[column],result)) {
				return e[column];
			} else return result;
		},null);
	}
/* Function: maxByCol
	returns the "largest" value of a column.
	
	Parameters:
		column		-	column to compare
		compare	-	*Optiional, default: function(a,b){return a > b}*
						A compare function like sort() uses to determaxe the maximum
						value
	
	*/
	Myna.DataSet.prototype.maxByCol = function(column,compare) {
		if (!compare) compare = function(a,b){return a > b}
		return this.reduce(function(result,e){
			if (result === null ||compare(e[column],result)) {
				return e[column];
			} else return result;
		},null);
	}
/* Function: sumByCol
	returns a sum of the values of a column.
	
	Parameters:
		column		-	column to sum
		accessor	-	*Optional, default: function(element){return element}*
						A function that takes an element of the column and returns a
						value to be summed. This is useful to force integer math or 
						to sum a property of the objects in the column rather than
						the objects themselves.
	
	*/
	Myna.DataSet.prototype.sumByCol = function(column,accessor) {
		if (!accessor) accessor = function(element){return element}
		return this.reduce(function(result,e){
			return result + accessor(e[column]);
		},0);
	}
/* Function: sortByCol
	sorts the DataSet by the supplied column and compare function.
	
	Parameters:
		column		-	column to sort
		compare	-	*Optiional, default: String.compareAlpha*
						A compare function that takes 2 elements and returns either
						1, 0, or -1 
	
		Returns:
			this DataSet
		
		Example:
		(code)
			var files = new Myna.File("/").listFiles()
			files.sortByCol("fileName",String.compareNatural)
		(end)
						
	*/
	Myna.DataSet.prototype.sortByCol = function(column,compare) {
		if (!compare) compare=String.compareAlpha;
		this.sort(function(a,b){
			return compare(a[column],b[column])
		})
		return this
	}
/* Function: avgByCol
	returns an average of the column.
	
	Parameters:
		column		-	column to average
		accessor	-	*Optional, default: function(element){return element}*
						A function that takes an element of the column and returns a
						value to be averaged. This is useful to force integer math 
						or to average a property of the objects in the column rather 
						than the objects themselves.
	
	Note: 
		null values are ignored. If you want to count nulls as 0, use this 
		_accessor_
		
		(code)
			function(element){
				return element===null?0:element;
			}
		(end)
	*/
	Myna.DataSet.prototype.avgByCol = function(column,accessor) {
		if (!accessor) accessor = function(element){return element}
		return this.filter(function(e){
			return accessor(e[column]) !== null;
		}).reduce(function(result,e,index,array){
			if (index < array.length -1){
				return result + accessor(e[column]);
			} else {
				result += accessor(e[column]);
				return result / array.length + " : " + array.length;
			}
		},0);
	}



	
if (typeof $server_gateway != "undefined"){
	/* Function: getDs
	returns a java DataSource object that can be used as the "ds" option in queries
	
	Detail:
		This will create an in-memory H2 database containing a single table "data"
		which contains the contents of this DataSet. The return value will be a 
		DataSource that can be used to query this table
		
	
	*/	
	Myna.DataSet.prototype.getDs =function(){
		var bds = new Packages.org.apache.commons.dbcp.BasicDataSource();
		bds.setDriverClassName("org.h2.Driver");
		bds.setUrl("jdbc:h2:mem:" + Myna.createUuid());
		var db = new Myna.Database(bds);
		var $this = this;
		db.getTable("data").create({
			columns:[{
				name:"dataset_row_number",
				type:"BIGINT",
				isPrimaryKey:true
			}].concat(
				$this.columns.map(function(colname){
					return {
						name:colname,
						type:"VARCHAR", 
						maxLength:32000
					}
				})
			)
		})
		var sql=<ejs>
			insert into data(dataset_row_number,<%=$this.columns.join()%>) 
			values ({dataset_row_number:BIGINT},
			<% 
				$this.columns.forEach(function(colName,index, columnArray){
					Myna.print("{" +colName+":VARCHAR}")
					if (index < columnArray.length -1) Myna.print(",")
				});
				
			%>
			)
		
		</ejs>
		$this.forEach(function(row,index){
			row.dataset_row_number = index;
			new Myna.Query({
				ds:bds,
				sql:sql,
				values:row
			})
		});	
		
		return bds;
	} 
/* Function: query
	queries this DataSet as a table named "data", and returns a <Myna.Query> 
	object
	
	Detail:
		This will create an in-memory H2 database containing a single table "data"
		which contains the contents of this DataSet. This function takes the same 
		options as <Myna.Query>, except that the ds/dataSource parameter is 
		ignored
		
	
	*/	
	Myna.DataSet.prototype.query =function(options){
		options.ds = this.getDs();
		return new Myna.Query(options);	
	}
	
	  
}	