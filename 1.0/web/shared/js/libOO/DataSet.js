/* Class: DataSet
	A specialized array for working with tabular data 
*/
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
		columns		-	*Optional default []*
						Either a comma separated list, an array of column names, or 
						an object whose non-function properties represent the column 
						names. These define the known properties of the objects in a 
						DataSet array. If _columns_ is not provided, but _data_ 
						contains at least one row, _columns_ will be calculated as all 
						the non-function properties of the first row.
						
	Detail:
		DataSet is a wrapper for an array of objects. This is treated much like the result set 
		of a query, but does not need to come from a query. DataSet's provide a 
		normalized way to represent any tabular data 
	*/
	var DataSet =function DataSet(options){
		if (!options) return ObjectLib.applyTo(this,[],true)
		
		var ds
		if (! (this instanceof DataSet)) throw new SyntaxError("DataSet is an object contructor. Please use the  'new' operator");
		
		if (options instanceof Array){
			//shallowly copies the data on to this object
			ObjectLib.applyTo(this,options,true)
			ds = options
			
			if (options.length) ds.columns = ObjectLib.getKeys(ds[0]);
			
		} else if (options instanceof Object){
			/* initial data */
				if (options.data instanceof Array){
					ds = options.data
				} else {
					ds=[]	
				}
				ObjectLib.applyTo(this,ds,true)
			/* columns */
				if (typeof options.columns =="string"){
					ds.columns = options.columns.split(/,/) 
				} else if (options.columns instanceof Array){
					ds.columns = ObjectLib.applyTo(options.columns,[]);
					 
				} else if (options.columns instanceof Object){
					ds.columns = ObjectLib.getKeys(options.columns);
				}
				
			/* loader */
				if (options.loader instanceof Function){
					ds.loader = options.loader;
				}
		}
		return ds;
	}
	/* Property: columns
		Array of column names in this DataSet
	*/
	DataSet.prototype.columns = null;
	DataSet.prototype.load = function(options){
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

/* Function: containsByCol
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
	DataSet.prototype.containsByCol = function(column, compare){
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
/* Function: findFirstByCol
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
	DataSet.prototype.findFirstByCol = function DataSet_findFirst(column, compare){
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
/* Function: findAllByCol
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
	DataSet.prototype.findAllByCol = function DataSet_findAll(column, compare){
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
		return new DataSet({
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
	DataSet.prototype.valueArray=function(columnName){
		var name=columnName; 
		return Array.prototype.map.call(this,function(element){ return element[name]})	
	}
/* Function: map
	Creates a new DataSet with the results of calling a provided function on every element in this array.

	See:
		<Array.map>
	*/
	DataSet.prototype.map = function(func) {
		return new DataSet({
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
	DataSet.prototype.filter = function() {
	  var args = Array.prototype.slice.call(arguments,0);
	  return new DataSet({
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
	DataSet.prototype.concat = function(otherArray) {
		var data= []
		this.forEach(function(row){
			data.push(row)
		})
		otherArray.forEach(function(row){
			data.push(row)
		})
		return new DataSet({
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
	DataSet.prototype.slice = function() {
		var args = Array.prototype.slice.call(arguments,0);
		return new DataSet({
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
	DataSet.prototype.minByCol = function(column,compare) {
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
	DataSet.prototype.maxByCol = function(column,compare) {
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
	DataSet.prototype.sumByCol = function(column,accessor) {
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
	
		Example:
		(code)
			var files = new Myna.File("/").listFiles()
			files.sortByCol("fileName",String.compareNatural)
		(end)
						
	*/
	DataSet.prototype.sortByCol = function(column,compare) {
		if (!compare) compare=String.compareAlpha;
		this.sort(function(a,b){
			return compare(a[column],b[column])
		})
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
	DataSet.prototype.avgByCol = function(column,accessor) {
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
/* Function: toHtmlTable
	returns an HTML table of this dataset
	*/
	DataSet.prototype.toHtmlTable = function() {
		var columns =this.columns
		var ds = this
		var result =""
			+ '<table border="1" class="dataset-table" cellpading="2">'
			+ '<tr class="dataset-column-headrow">'
			+ columns.map(function(col){
					return '<th align="left" style="background-color:silver;padding:4px;">' + col + '</th>';
			}).join("") + '</tr>'
			+ ds.map(function(row,index){
					return '<tr class="dataset-column-datarow " >' 
					+ columns.map(function(col){
						return '<td align="left" style="'+(index%2?"background-color:silver;":"background-color:lightblue;")+'">' + row[col] + '</td>';
					}).join("") 
					+ '</tr>'
			}).join("")
			+"</table>";
		return result
	}
/* Function: pivot
	returns a new DataSet pivoted around a key, category, and value
	
	Parameters:
		keyField		-	Column name that contains the unique value for 
							every row in the result. Duplicate values for 
							calculated columns will overwrite, missing 
							values will be set to null
							
		categoryField 	-	Column name that contains the new columns that 
							should be created. These names will be cleaned 
							such that invalid characters are replaced with 
							"_" and the result is lower cased. If this would 
							result in a blank column (such as numeric 
							values) then "category_<value>" is used for the 
							column name. If that still doesn't work, then 
							"category__unknown" is used for the column name
							
		valueField		-	Column name that contains the values for each key
		
	Detail:
		The purpose of this function is to convert a data set that looks like 
		this
		
		(code)
			user  | category       | value
			----------------------------------
			bob   | Age            | 35
			sally | Age            | 25
			bob   | Favorite Color | blue
			sally | Favorite Color | yellow
			bob   | Start Date     | 01/01/2001
			sally | Start Date     | 05/16/1997
		(end)
		
		into something like this
		
		(code)
			user   | age | favorite_color | start _date
			--------------------------------------------
			bob    | 35  | blue           | 01/01/2001
			sally  | 25  | yellow         | 05/16/1997
		(end)
		
		The above transform would be accomplished with
		
		(code)
			ds.pivot("user","category","value")
		(end)
							
	*/
	DataSet.prototype.pivot = function(keyField,categoryField,valueField){
		var $this = this;
		var data = []
		var keyIndex={}
		
		var columns=$this.columns.filter(function(colName){
			return ![categoryField,valueField].contains(colName)
		});
		var calculated;
		function cleanFieldName(fieldName){
			var result = String(fieldName).replace(/^[\W\d_]+/,"").replace(/\W+/g,"_").replace(/[\W_]$/,"")
			if (!result) {
				result= cleanFieldName("category_"+fieldName);
				if (result == "category_") return "category__unknown"
			}
			return result.toLowerCase()
		}
		
		this.forEach(function(row){
			var key =row[keyField]
			
			if (!(key in keyIndex)) {
				var newRow = {}
				newRow[keyField] = key
				
				keyIndex[key] = data[data.push(newRow)-1] 
			}
			var category = cleanFieldName(row[categoryField]);
			if (!columns.contains(category)){
				columns.push(category)	
			}
			
			keyIndex[key][category] = row[valueField]
			$this.columns.filter(function(colName){
				return ![keyField,categoryField,valueField].contains(colName)
			}).forEach(function(colName){
				keyIndex[key][colName] = row[colName]
			})
		})
		data = data.map(function(row){
			columns.forEach(function(col){
				if (!(col in row)) row[col] = null
			})
			return row
		})
		var ds = new DataSet({
			columns:columns,
			data:data
		}) 
		return ds 
		
	}
/* Function: toStruct
	converts a DataSet into an hierarchical object
	
	Parameters:
		keyCols				-	Array of column names, in order of significance,
		remainingProperty	-	*Optional, default null*
								if keyCols does not uniquely identify every 
								row in the DataSet, and _remainingProperty_
								is defined, then the remain rows will be 
								added to this property as an array.
		full				-	*Optional, default false*
								If true, each level in the hierarchy contains 
								all the values of the first row of that branch, 
								and sub trees branch of the col name
								
	The purpose of this function is to convert flat result sets into a 
	structured hierarchy. This is best illustrated by examples
	
	Examples:
	(code)
	// Original Set 
		//	employee_id	| title					| position_code | department_name			 | department_code
		//	----------- | --------------------- | ------------- | -------------------------- | ---------------
		//	100000001	| Cp Tech-Mental Health	| 01021C		| MILAGRO					 | 01106550
		//	100000003	| Universal Interviewer	| 054700		| MED SPECIALTIES CLINIC B	 | 01017120
		//	100000075	| Clerk Outpt			| 054700		| MED SPECIALTIES CLINIC B	 | 01017120
		//	100001035	| Clerk Outpt			| 054700		| MED SPECIALTIES CLINIC B	 | 01017120
	
	var simple = original_set.toStruct(["position_code","department_code"])
		[ Object ]
		  +-[01021C] [ Object ]
		  | \-[01106550] [ Array ]
		  |   \-[0] [ Object ]
		  |     +-[department_code] 01106550
		  |     +-[department_name] MILAGRO
		  |     +-[employee_id] 100000001
		  |     +-[position_code] 01021C
		  |     \-[title] Cp Tech-Mental Health
		  \-[054700] [ Object ]
			\-[01017120] [ Array ]
			  +-[0] [ Object ]
			  | +-[department_code] 01017120
			  | +-[department_name] MED SPECIALTIES CLINIC B
			  | +-[employee_id] 100000003
			  | +-[position_code] 054700
			  | \-[title] Universal Interviewer
			  +-[1] [ Object ]
			  | +-[department_code] 01017120
			  | +-[department_name] MED SPECIALTIES CLINIC B
			  | +-[employee_id] 100000075
			  | +-[position_code] 054700
			  | \-[title] Clerk Outpt
			  \-[2] [ Object ]
				+-[department_code] 01017120
				+-[department_name] MED SPECIALTIES CLINIC B
				+-[employee_id] 100001035
				+-[position_code] 054700
				\-[title] Clerk Outpt
	var simple_with_rows = original_set.toStruct(["position_code","department_code"],"rows")
		[ Object ]
		  +-[01021C] [ Object ]
		  | \-[01106550] [ Object ]
		  |   \-[rows] [ Array ]
		  |     \-[0] [ Object ]
		  |       +-[department_code] 01106550
		  |       +-[department_name] MILAGRO
		  |       +-[employee_id] 100000001
		  |       +-[position_code] 01021C
		  |       \-[title] Cp Tech-Mental Health
		  \-[054700] [ Object ]
			\-[01017120] [ Object ]
			  \-[rows] [ Array ]
				+-[0] [ Object ]
				| +-[department_code] 01017120
				| +-[department_name] MED SPECIALTIES CLINIC B
				| +-[employee_id] 100000003
				| +-[position_code] 054700
				| \-[title] Universal Interviewer
				+-[1] [ Object ]
				| +-[department_code] 01017120
				| +-[department_name] MED SPECIALTIES CLINIC B
				| +-[employee_id] 100000075
				| +-[position_code] 054700
				| \-[title] Clerk Outpt
				\-[2] [ Object ]
				  +-[department_code] 01017120
				  +-[department_name] MED SPECIALTIES CLINIC B
				  +-[employee_id] 100001035
				  +-[position_code] 054700
				  \-[title] Clerk Outpt
	var full_with_rows = original_set.toStruct(["position_code","department_code"],"rows")
		[ Object ]
		  +-[department_code] 01106550
		  +-[department_name] MILAGRO
		  +-[employee_id] 100000001
		  +-[position_code] [ Object ]
		  | +-[01021C] [ Object ]
		  | | +-[department_code] [ Object ]
		  | | | \-[01106550] [ Object ]
		  | | |   +-[department_code] 01106550
		  | | |   +-[department_name] MILAGRO
		  | | |   +-[employee_id] 100000001
		  | | |   +-[position_code] 01021C
		  | | |   +-[rows] [ Array ]
		  | | |   | \-[0] [ Object ]
		  | | |   |   +-[department_code] 01106550
		  | | |   |   +-[department_name] MILAGRO
		  | | |   |   +-[employee_id] 100000001
		  | | |   |   +-[position_code] 01021C
		  | | |   |   \-[title] Cp Tech-Mental Health
		  | | |   \-[title] Cp Tech-Mental Health
		  | | +-[department_name] MILAGRO
		  | | +-[employee_id] 100000001
		  | | +-[position_code] 01021C
		  | | \-[title] Cp Tech-Mental Health
		  | \-[054700] [ Object ]
		  |   +-[department_code] [ Object ]
		  |   | \-[01017120] [ Object ]
		  |   |   +-[department_code] 01017120
		  |   |   +-[department_name] MED SPECIALTIES CLINIC B
		  |   |   +-[employee_id] 100000003
		  |   |   +-[position_code] 054700
		  |   |   +-[rows] [ Array ]
		  |   |   | +-[0] [ Object ]
		  |   |   | | +-[department_code] 01017120
		  |   |   | | +-[department_name] MED SPECIALTIES CLINIC B
		  |   |   | | +-[employee_id] 100000003
		  |   |   | | +-[position_code] 054700
		  |   |   | | \-[title] Universal Interviewer
		  |   |   | +-[1] [ Object ]
		  |   |   | | +-[department_code] 01017120
		  |   |   | | +-[department_name] MED SPECIALTIES CLINIC B
		  |   |   | | +-[employee_id] 100000075
		  |   |   | | +-[position_code] 054700
		  |   |   | | \-[title] Clerk Outpt
		  |   |   | \-[2] [ Object ]
		  |   |   |   +-[department_code] 01017120
		  |   |   |   +-[department_name] MED SPECIALTIES CLINIC B
		  |   |   |   +-[employee_id] 100001035
		  |   |   |   +-[position_code] 054700
		  |   |   |   \-[title] Clerk Outpt
		  |   |   \-[title] Universal Interviewer
		  |   +-[department_name] MED SPECIALTIES CLINIC B
		  |   +-[employee_id] 100000003
		  |   +-[position_code] 054700
		  |   \-[title] Universal Interviewer
		  \-[title] Cp Tech-Mental Health
	
	
	(end)	
	*/		
	DataSet.prototype.toStruct = function(keyCols, remainingProperty, full){
		if (!this.length) return {}
		var result =full?ObjectLib.applyTo(this[0],{}):{};
		var base =full?result[keyCols[0]] = {}:result;
		var $this = this;
		this.forEach(function(row,index){
			var path=""
			var curArray= keyCols.reduce(function(parent,colName,index){
				path+="."+colName
				//debug_window(path +" starting col  " + colName )
				var colVal = row[colName];
				//if (colVal == parseInt(colVal)) colVal = colName +"_"+colVal
				var curRow;
				if (!(colVal in parent)){
					//debug_window(path +" adding " + colName +" : " +colVal + " : " +index)
					var curRow = parent[colVal] =full?ObjectLib.applyTo(row,{}):{};
					
					//parent.push(parent[colVal])
					if (index < keyCols.length-1) {
						 if (full) curRow[keyCols[index +1]] ={}  
					} else if (remainingProperty){
						curRow[remainingProperty] =new DataSet({
							columns:$this.columns
						})
					} else if (!full){
						curRow = parent[colVal]  =new DataSet({
							columns:$this.columns
						})
					}
				} else {
					curRow =parent[colVal]	
				}
				
				if (index < keyCols.length-1) {
					//debug_window(path +" decending to " + keyCols[index +1],  parent[colVal][keyCols[index +1]])
					
					return full?curRow[keyCols[index +1]]:curRow;
				} else if (remainingProperty){
					return curRow[remainingProperty];
				} else if (!full){
					return curRow;
				} else {
					return parent
				}
					
				
			},base)
			if (remainingProperty ||!full){
				curArray.push(ObjectLib.applyTo(row,{}))	
			} 
			
		})
		return result;
	}
if (typeof Myna == "undefined") var Myna={}
Myna.DataSet = DataSet;