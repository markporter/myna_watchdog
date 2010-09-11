var thisDir =new Myna.File($server.requestDir)
if (
	thisDir.exists() 
	&& ($server.scriptName == "" || $server.scriptName == "_index")  
	&& $server.properties.instance_purpose.toLowerCase() == "dev"
	&& !/web-inf/i.test(thisDir.toString())
){
	
	var files=thisDir.listFiles();
	var compare;
	var sortCol =$req.data.sort || "fileName";
	if (!$req.data.asc || $req.data.asc == "true") {
		$req.data.asc=true
		
	}else{
		$req.data.asc=false
	}
		
	switch(sortCol){
		case "lastModified":
			if ($req.data.asc){
				compare=function(a,b){
					//Myna.println("got here 2")
					//return a.getTime()-b.getTime();
					return String.compareNumeric(a.getTime(),b.getTime()) 
				};
			} else {
				compare=function(a,b){
					//return b.getTime()-a.getTime();
					return String.compareNumericReverse(a.getTime(),b.getTime()) 
				};
			}
		break;
		default:
			if ($req.data.asc){
				compare=String.compareNatural;
			} else {
				compare=String.compareNaturalReverse;
			}
			
	}
	files.sortByCol(sortCol,compare);
	
	var setDir = function(colname){
		if (colname == sortCol){
			return !$req.data.asc;
		} else {
			return "true";
		}
	}

	Myna.print(<ejs>
		<style>
		table td, table th {
			font-family:sans-serif;
			font-size:10pt;
			padding-left:10px;
		}
		.alt_row td{
			background-color:linen;	
		}
		.directory td{
			font-weight:bold;
			font-style:italic; 
		}
		</style>
		<b>Directory Listing for <%=thisDir%></b><br>
		<b><i>To disable listings, set the instance purpose to something other than "dev"<i></b><br><br>
		<table style="width:100%" borders=0">
			<tr >
				<th><a href="?sort=fileName&asc=<%=setDir("fileName")%>">File Name</a></th>
				<th><a href="?sort=type&asc=<%=setDir("type")%>">Type</a></th>
				<th><a href="?sort=size&asc=<%=setDir("size")%>">Size</a></th>
				<th><a href="?sort=lastModified&asc=<%=setDir("lastModified")%>">Last Modified</a></th>
				<th>Age</th>
			</tr>
			<@loop array="files" element="row" index="rowNum">
			<% 
				var isDir = row.type == "directory"
				var fileName =row.fileName
				fileName+=(isDir?"/":"");
				var url= $server.requestUrl + fileName;
				var rowClass=(isDir?"directory":"") + " " +(rowNum%2==0?"alt_row":"");
			%>
				<tr class="<%=rowClass%>">
					<td><a href="<%=url%>"><%=fileName%></a></td>
					<td><%=row.type%></td>
					<td><%=Math.ceil(row.size/1024)%>k</td>
					<td><%=row.lastModified.dateFormat("m/d/Y H:i:s")%></td>
					<td><%=Date.formatInterval(new Date().getTime() - row.lastModified.getTime()).listFirst()%></td>
				</tr>
			</@loop>
		</table>
	</ejs>)
	//Myna.printDump(files)
} else {
	$application.onError404();	
}