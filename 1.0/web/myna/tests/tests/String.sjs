/* ----- CLASS: String_MissingTests ---------------------------------------- */
	function String_MissingTests(name){
		TestCase.call( this, name );
		
	}
	
	String_MissingTests.prototype = new TestCase();
	/* ----- testExists ---------------------------------------------------- */
		String_MissingTests.prototype.testExists = function(testName){
			var classes=[String_General,String_List]
			for (var class_idx=0; class_idx < classes.length; ++class_idx){
				if (classes[class_idx]
					.prototype
					.hasOwnProperty("test_"+testName)
				) return true;
			}
				
			return false;
		}
	/* genereate tests for missing tests */
		String.prototype.getProperties().filter(function(name){
			return String.prototype.hasOwnProperty(name); 
		}).forEach(function(name){
			String_MissingTests.prototype["test_" + name]=function(){
				this.assertTrue("No test defined for String::" +name,this.testExists(name));
			}
		})
/* ----- CLASS: String_General --------------------------------------------- */
	function String_General(name){ TestCase.call( this, name );}
	String_General.prototype = new TestCase();
	
	/* ------ charToHtmlEntity --------------------------------------------- */
		String_General.prototype.test_CharToHtmlEntity=function(){
			this.assertEquals("&#59;&#38;&#35;&#60;&#62;&#39;&#34;&#40;&#41;&#37;&#43;&#45;",";&#<>'\"()%+-".escapeHtml());
		}
	/* ------ compareNatural/compareNaturalReverse ----------------------------------------------- */
		String_General.prototype.test_compareNatural=function(){
			var list=[
				"xul10",
				"13",
				"index_2_alpha_2",
				"index_10_alpha_1",
				"index_10_alpha_2"
				
			]
			var result = list.sort(String.compareNatural).join(",");
			this.assertEquals(result,"13,index_2_alpha_2,index_10_alpha_1,index_10_alpha_2,xul10");
			
			result = list.sort(String.compareNaturalReverse).join(",");
			this.assertEquals(result,"xul10,index_10_alpha_2,index_10_alpha_1,index_2_alpha_2,13");
		}
	/* ------ compareAlpha/compareAlphaReverse ----------------------------------------------- */
		String_General.prototype.test_compareAlpha=function(){
			var list=[
				"a",
				"b",
				"c",
				"d",
				"e"
				
			]
			var result = list.sort(String.compareAlpha).join(",");
			this.assertEquals(result,"a,b,c,d,e");
			
			result = list.sort(String.compareAlphaReverse).join(",");
			this.assertEquals(result,"e,d,c,b,a");
		}
	/* ------ compareNumeric/compareNumericReverse ----------------------------------------------- */
		String_General.prototype.test_compareNumeric=function(){
			var list=[
				"100",
				"20",
				"3",
				"40",
				"5"
				
			]
			var result = list.sort(String.compareNumeric).join(",");
			this.assertEquals(result,"3,5,20,40,100");
			
			result = list.sort(String.compareNumericReverse).join(",");
			this.assertEquals(result,"100,40,20,5,3");
		}
	/* ------ escapeHtml --------------------------------------------------- */
		String_General.prototype.test_escapeHtml=function(){
			var html = '<script>alert("dude!")</script>';
			var result = html.escapeHtml();
			
			this.assertEquals(result,'&#60;script&#62;alert&#40;&#34;dude!&#34;&#41;&#60;/script&#62;');
		}
	/* ------ unEscapeHtml ------------------------------------------------- */
		String_General.prototype.test_unEscapeHtml=function(){
			var html = '&#60;script&#62;alert&#40;&#34;dude!&#34;&#41;&#60;/script&#62;';
			var result = html.unEscapeHtml();
			
			this.assertEquals(result,'<script>alert("dude!")</script>');
		}
	/* ------ left --------------------------------------------------------- */
		String_General.prototype.test_left=function(){
			var text = '700monkeys';
			var result = text.left(3);
			
			this.assertEquals(result,"700");
		}
	/* ------ right -------------------------------------------------------- */
		String_General.prototype.test_right=function(){
			var text = '700monkeys';
			var result = text.right(7);
			
			this.assertEquals(result,"monkeys");
		}
	/* ------ trim --------------------------------------------------------- */
		String_General.prototype.test_trim=function(){
			var text = '\n\t   700monkeys  \t\t \n';
			var result = text.trim();
			
			this.assertEquals(result,"700monkeys");
		}	
	/* ------ titleCap ----------------------------------------------------- */
		String_General.prototype.test_titleCap=function(){
			var text = 'thE CRazY wEaSEl';
			var result = text.titleCap();
			
			this.assertEquals("The Crazy Weasel",result);
		}	
	/* ------ repeat ------------------------------------------------------- */
		String_General.prototype.test_repeat=function(){
			var text = 'thE CRazY wEaSEl';
			var result1 = "bob".repeat(3);
			var result2 = "bob".repeat(3,"|");
			var result3 = "bob".repeat(3,"|","'");
			
			this.assertEquals("default","bobbobbob",result1);
			this.assertEquals("pipe","bob|bob|bob",result2);
			this.assertEquals("pipe-apos","'bob'|'bob'|'bob'",result3);
		}
	/* ------ hashEquals --------------------------------------------------- */
		String_General.prototype.test_hashEquals=function(){
			var text = 'thE CRazY wEaSEl';
			var hash = text.toHash();
			
			this.assertTrue("good hash",text.hashEquals(hash));
			this.assertFalse("bad hash",(text+"bob").hashEquals(hash));
		}
	/* ------ toHash ------------------------------------------------------- */
		String_General.prototype.test_toHash=function(){
			var text = 'thE CRazY wEaSEl';
			var hash1 = text.toHash();
			var hash2 = text.toHash();
			
			this.assertNotSame("hashs should be unique",hash1,hash2);
		}
	/* ------ parseJson ---------------------------------------------------- */
		String_General.prototype.test_parseJson=function(){
			var bad1 = '{bob:[a,b,c]}';
			var bad2 = 'this.should_not_exist=true';
			var good = '{"bob":["a","b","c"]}';
			try{
				var obj = bad1.parseJson();
				this.fail("badly formed json should fail");
			} catch(e){
				this.assertTrue("badly formed json should fail",e instanceof SyntaxError);
			}
			
			try{
				obj = bad2.parseJson();
				this.fail("javascript evaluation should fail");
			} catch(e){
				this.assertTrue("javascript evaluation",e instanceof SyntaxError);
			}
			
			obj = good.parseJson();
			this.assertTrue(obj.bob[1] == "b");
		}
	/* ------ encrypt ------------------------------------------------------ */
		String_General.prototype.test_encrypt=function(){
			var text = 'thE CRazY wEaSEl';
			var hash1 = text.encrypt("bob");
			var hash2 = text.encrypt("bob");
			
			this.assertNotSame("encrypted should be unique",hash1,hash2);
		}
	/* ------ decrypt ------------------------------------------------------ */
		String_General.prototype.test_decrypt=function(){
			var text = 'thE CRazY wEaSEl';
			var hash = text.encrypt("bob");
			
			this.assertEquals(text,hash.decrypt("bob"));
		}
/* ----- CLASS: String_List ------------------------------------------------ */
	function String_List(name){ TestCase.call( this, name );}
	String_List.prototype = new TestCase();
	
	/* ----- setUp --------------------------------------------------------- */
		String_List.prototype.setUp = function(){
			this.original_list1 = '4,1,2,3,4';
			this.original_list2 = '4|1|2|3|4';
			this.original_list3 = '"c","a","b","c"';
			
			this.original_list4 = '4,2,3,1,4';
			this.original_list5 = '4|2|3|1|4';
			this.original_list6 = '"c","b","a","c"';
			this.original_list7 = '"c","B","a","C"';
		}
		
	/* ----- listContains -------------------------------------------------- */
		String_List.prototype.test_listContains=function(){
			this.assertTrue("default",this.original_list1.listContains(4));
			this.assertTrue("pipe",this.original_list2.listContains(4,'|'));
			this.assertTrue("quote",this.original_list3.listContains("c",",",'"'));
			
			this.assertFalse("default-not contains",this.original_list1.listContains(14));
			this.assertFalse("pipe-not contains",this.original_list2.listContains(14,'|'));
			this.assertFalse("quote-not contains",this.original_list3.listContains("q",",",'"'));
		}
	/* ----- listContainsNoCase -------------------------------------------- */
		String_List.prototype.test_listContainsNoCase=function(){
			this.assertTrue("quote",this.original_list3.listContainsNoCase("C",",",'"'));
			
			this.assertFalse("quote-not contains",this.original_list3.listContainsNoCase("q",",",'"'));
		}
		
	/* ----- listLen ------------------------------------------------------- */
		String_List.prototype.test_listLen=function(){
			this.assertEquals("default",5,this.original_list1.listLen());
			this.assertEquals("pipe",5,this.original_list2.listLen("|"));
		}
	/* ----- listSort ------------------------------------------------------- */
		String_List.prototype.test_listSort=function(){
			this.assertEquals("default","1,2,3,4,4",this.original_list1.listSort());
			this.assertEquals("default","4,4,3,2,1",this.original_list1.listSort(String.compareNumericReverse,null,null));
			
			this.assertEquals("pipe","1|2|3|4|4",this.original_list2.listSort(String.compareNumeric,"|"));
			this.assertEquals("pipe","4|4|3|2|1",this.original_list2.listSort(String.compareNumericReverse,"|",null));
			
			
			this.assertEquals("quote",'"a","b","c","c"',this.original_list3.listSort(String.compareAlpha,",",'"'));
			this.assertEquals("quote",'"c","c","b","a"',this.original_list3.listSort(String.compareAlphaReverse,",",'"'));
		}	
	/* ----- listAfter ----------------------------------------------------- */
		String_List.prototype.test_listAfter=function(){
			this.assertEquals("default",'1,2,3,4',this.original_list1.listAfter());
			this.assertEquals("pipe",'1|2|3|4',this.original_list2.listAfter("|"));
			this.assertEquals("quote",'"a","b","c"',this.original_list3.listAfter(",",'"'));	
		}
		
	/* ----- listBefore ---------------------------------------------------- */
		String_List.prototype.test_listBefore=function(){
			this.assertEquals("default",'4,1,2,3',this.original_list1.listBefore());
			this.assertEquals("pipe",'4|1|2|3',this.original_list2.listBefore("|"));
			this.assertEquals("quote",'"c","a","b"',this.original_list3.listBefore(",",'"'));	
		}	
	/* ----- listFirst ----------------------------------------------------- */
		String_List.prototype.test_listFirst=function(){
			this.assertEquals("default",4,this.original_list1.listFirst());
			this.assertEquals("pipe",4,this.original_list2.listFirst("|"));
			this.assertEquals("quote","c",this.original_list3.listFirst(",",'"'));	
		}
		
	/* ----- listLast ------------------------------------------------------ */
		String_List.prototype.test_listLast=function(){
			this.assertEquals("default",4,this.original_list1.listLast());
			this.assertEquals("pipe",4,this.original_list2.listLast("|"));
			this.assertEquals("quote","c",this.original_list3.listLast(",",'"'));	
		}
		
	/* ----- listFind ------------------------------------------------------ */
		String_List.prototype.test_listFind=function(){
			this.assertEquals("notFound",-1,this.original_list1.listFind("goat"));
			
			this.assertEquals("default-firstpos",0,this.original_list1.listFind(4));
			this.assertEquals("pipe-firstpos",0,this.original_list2.listFind(4,0,"|"));
			this.assertEquals("quote-firstpos",0,this.original_list3.listFind("c",0,",",'"'));
			
			this.assertEquals("default-secondpos",4,this.original_list1.listFind(4,1));
			this.assertEquals("pipe-secondpos",4,this.original_list2.listFind(4,1,"|"));
			this.assertEquals("quote-secondpos",3,this.original_list3.listFind("c",1,",",'"'));
		}
	/* ----- listFindNoCase ------------------------------------------------ */
		String_List.prototype.test_listFindNoCase=function(){
			this.assertEquals("notFound",-1,this.original_list1.listFind("goat"));
			
			this.assertEquals("quote-firstpos",0,this.original_list3.listFindNoCase("C",0,",",'"'));
			this.assertEquals("quote-secondpos",3,this.original_list3.listFindNoCase("C",1,",",'"'));
		}
	/* ----- listMakeUnique ------------------------------------------------ */
		String_List.prototype.test_listMakeUnique=function(){
			this.assertEquals("default","4,1,2,3",this.original_list1.listMakeUnique());
			this.assertEquals("pipe","4|1|2|3",this.original_list2.listMakeUnique("|"));
			this.assertEquals("quote",'"c","a","b"',this.original_list3.listMakeUnique(",",'"'));
		}
	/* ----- listMakeUniqueNoCase ------------------------------------------ */
		String_List.prototype.test_listMakeUniqueNoCase=function(){
			this.assertEquals("quote",'"c","B","a"',this.original_list7.listMakeUniqueNoCase(",",'"'));
		}
	/* ----- listAppend ---------------------------------------------------- */
		String_List.prototype.test_listAppend=function(){
			this.assertEquals("default","4,1,2,3,4,5",this.original_list1.listAppend(5));
			this.assertEquals("pipe","4|1|2|3|4|5",this.original_list2.listAppend(5,"|"));
			this.assertEquals("quote",'"c","a","b","c","d"',this.original_list3.listAppend("d",",",'"'));
		}
		
	/* ----- listSame ------------------------------------------------------ */
		String_List.prototype.test_listSame=function(){
			this.assertTrue("default-should be same",this.original_list1.listSame(this.original_list4));
			this.assertFalse("default-should NOT be same",this.original_list1.listSame(this.original_list4+",5"));
			
			this.assertTrue("pipe-should be same",this.original_list2.listSame(this.original_list5,"|"));
			this.assertFalse("pipe-should NOT be same",this.original_list2.listSame(this.original_list5+"|5","|"));
			
			
			this.assertTrue("quote-should be same",this.original_list3.listSame(this.original_list6,",",'"'));
			this.assertFalse("quote-should NOT be same",this.original_list3.listSame(this.original_list6+',"5"',",",'"'));
		}
	/* ----- listSameNoCase ------------------------------------------------ */
		String_List.prototype.test_listSameNoCase=function(){
			this.assertTrue("quote-should be same",this.original_list7.listSameNoCase(this.original_list6,","));
		}
		
	/* ----- listAppendUnique ---------------------------------------------- */
		String_List.prototype.test_listAppendUnique=function(){
			this.assertEquals("default, shouldn't append",this.original_list1,this.original_list1.listAppendUnique(4));
			this.assertEquals("pipe, shouldn't append",this.original_list2,this.original_list2.listAppendUnique(4,"|"));
			this.assertEquals("quote, shouldn't append",this.original_list3,this.original_list3.listAppendUnique("c",",",'"'));
			
			this.assertEquals("default, should append",this.original_list1+",14",this.original_list1.listAppendUnique(14));
			this.assertEquals("pipe, should append",this.original_list2+"|14",this.original_list2.listAppendUnique(14,"|"));
			this.assertEquals("quote, should append",this.original_list3+',"14c"',this.original_list3.listAppendUnique("14c",",",'"'));
		}
	/* ----- listAppendUniqueNoCase ---------------------------------------- */
		String_List.prototype.test_listAppendUniqueNoCase=function(){
			this.assertEquals("quote, shouldn't append",this.original_list3,this.original_list3.listAppendUniqueNoCase("C",",",'"'));
			this.assertEquals("quote, should append",this.original_list3+',"14C"',this.original_list3.listAppendUniqueNoCase("14C",",",'"'));
		}
	/* ----- listToArray ------------------------------------------------------ */
		String_List.prototype.test_listToArray=function(){
			this.assertEquals("default-last item",4,this.original_list1.listToArray()[4]);
			this.assertEquals("pipe-last item",4,this.original_list2.listToArray("|")[4]);
			this.assertEquals("quote-last item","c",this.original_list3.listToArray(",",'"')[3]);
		}
		
		
		