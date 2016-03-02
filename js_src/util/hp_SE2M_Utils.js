if(typeof window.nhn == 'undefined') { window.nhn = {}; }
if(!nhn.husky) { nhn.husky = {}; }

nhn.husky.SE2M_UtilPlugin = jindo.$Class({
	name : "SE2M_UtilPlugin",

	$BEFORE_MSG_APP_READY : function(){
		this.oApp.exec("ADD_APP_PROPERTY", ["oAgent", jindo.$Agent()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["oNavigator", jindo.$Agent().navigator()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["oUtils", this]);
	},
	
	$ON_REGISTER_HOTKEY : function(sHotkey, sCMD, aArgs, elTarget) {
		this.oApp.exec("ADD_HOTKEY", [sHotkey, sCMD, aArgs, (elTarget || this.oApp.getWYSIWYGDocument())]);
	},

	$ON_SE2_ATTACH_HOVER_EVENTS : function(aElms){
		this.oApp.exec("ATTACH_HOVER_EVENTS", [aElms, {fnElmToSrc: this._elm2Src, fnElmToTarget: this._elm2Target}]);
	},
	
	_elm2Src : function(el){
		if(el.tagName == "LI" && el.firstChild && el.firstChild.tagName == "BUTTON"){
			return el.firstChild;
		}else{
			return el;
		}
	},
	
	_elm2Target : function(el){
		if(el.tagName == "BUTTON" && el.parentNode.tagName == "LI"){
			return el.parentNode;
		}else{
			return el;
		}
	},
	
	getScrollXY : function(){
		var scrollX,scrollY;
		var oAppWindow = this.oApp.getWYSIWYGWindow();
		if(typeof oAppWindow.scrollX == "undefined"){
			scrollX = oAppWindow.document.documentElement.scrollLeft;
			scrollY = oAppWindow.document.documentElement.scrollTop;
		}else{
			scrollX = oAppWindow.scrollX;
			scrollY = oAppWindow.scrollY;
		}
		
		return {x:scrollX, y:scrollY};
	}
});

nhn.husky.SE2M_Utils = {
	sURLPattern : '(http|https|ftp|mailto):(?:\\/\\/)?((:?\\w|-)+(:?\\.(:?\\w|-)+)+)([^ <>]+)?',
	
	/**
	 * 사용자 클래스 정보를 추출한다.
	 * @param {String} sStr	추출 String
	 * @param {rx} rxValue	rx type 형식의 값
	 * @param {String} sDivision	value의 split 형식
	 * @return {Array}
	 */
	getCustomCSS : function(sStr, rxValue, sDivision) {
		var ret = [];
		if('undefined' == typeof(sStr) || 'undefined' == typeof(rxValue) || !sStr || !rxValue) {
			return ret;
		}
		
		var aMatch = sStr.match(rxValue);		
		if(aMatch && aMatch[0]&&aMatch[1]) {
			if(sDivision) {
				ret = aMatch[1].split(sDivision);
			} else {
				ret[0] = aMatch[1];
			}	
		}
		
		return ret;
	},
	/**
	 * HashTable로 구성된 Array의 같은 프로퍼티를 sSeperator 로 구분된 String 값으로 변환
	 * @param {Object} v
	 * @param {Object} sKey
	 * @author senxation
	 * @example 
a = [{ b : "1" }, { b : "2" }]

toStringSamePropertiesOfArray(a, "b", ", ");
==> "1, 2"
	 */
	toStringSamePropertiesOfArray : function(v, sKey, sSeperator) {
		if (v instanceof Array) {
			var a = [];
			for (var i = 0; i < v.length; i++) {
				a.push(v[i][sKey]);
			}
			return a.join(",").replace(/,/g, sSeperator);
		}
		else {
			if (typeof v[sKey] == "undefined") {
				return "";
			}
			if (typeof v[sKey] == "string") {
				return v[sKey];
			}
		}
	},
	
	/**
	 * 단일 객체를 배열로 만들어줌
	 * @param {Object} v
	 * @return {Array}
	 * @author senxation
	 * @example
makeArray("test"); ==> ["test"]
	 */	
	makeArray : function(v) {
		if (v instanceof Array) {
			return v;
		}
		var a = [];
		a.push(v);
		return a;
	},
	
	/**
	 * 말줄임을 할때 줄일 내용과 컨테이너가 다를 경우 처리
	 * 컨테이너의 css white-space값이 "normal"이어야한다. (컨테이너보다 텍스트가 길면 여러행으로 표현되는 상태)
	 * @param {HTMLElement} elText 말줄임할 엘리먼트
	 * @param {HTMLElement} elContainer 말줄임할 엘리먼트를 감싸는 컨테이너
	 * @param {String} sStringTail 말줄임을 표현할 문자열 (미지정시 ...)
	 * @param {Number} nLine 최대 라인수 (미지정시 1)
	 * @author senxation
	 * @example
//div가 2줄 이하가 되도록 strong 내부의 내용을 줄임 
<div>
	<strong id="a">말줄임을적용할내용말줄임을적용할내용말줄임을적용할내용</strong><span>상세보기</span>
<div>
ellipsis(jindo.$("a"), jindo.$("a").parentNode, "...", 2);
	 */
	ellipsis : function(elText, elContainer, sStringTail, nLine) {
		sStringTail = sStringTail || "...";
		if (typeof nLine == "undefined") {
			nLine = 1;
		}
		var welText = jindo.$Element(elText);
		var welContainer = jindo.$Element(elContainer);
		
		var sText = welText.html();
		var nLength = sText.length;
		var nCurrentHeight = welContainer.height();
		var nIndex = 0;
		welText.html('A');
		var nHeight = welContainer.height();

		if (nCurrentHeight < nHeight * (nLine + 0.5)) {
			return welText.html(sText);
		}
	
		/**
		 * 지정된 라인보다 커질때까지 전체 남은 문자열의 절반을 더해나감
		 */
		nCurrentHeight = nHeight;
		while(nCurrentHeight < nHeight * (nLine + 0.5)) {
			nIndex += Math.max(Math.ceil((nLength - nIndex)/2), 1);
			welText.html(sText.substring(0, nIndex) + sStringTail);
			nCurrentHeight = welContainer.height();
		}
	
		/**
		 * 지정된 라인이 될때까지 한글자씩 잘라냄
		 */
		while(nCurrentHeight > nHeight * (nLine + 0.5)) {
			nIndex--;
			welText.html(sText.substring(0, nIndex) + sStringTail);
			nCurrentHeight = welContainer.height();
		}
	},
	
	/**
	 * 최대 가로사이즈를 지정하여 말줄임한다.
	 * elText의 css white-space값이 "nowrap"이어야한다. (컨테이너보다 텍스트가 길면 행변환되지않고 가로로 길게 표현되는 상태)
	 * @param {HTMLElement} elText 말줄임할 엘리먼트
	 * @param {String} sStringTail 말줄임을 표현할 문자열 (미지정시 ...)
	 * @param {Function} fCondition 조건 함수. 내부에서 true를 리턴하는 동안에만 말줄임을 진행한다.
	 * @author senxation
	 * @example
//150픽셀 이하가 되도록 strong 내부의 내용을 줄임 
<strong id="a">말줄임을적용할내용말줄임을적용할내용말줄임을적용할내용</strong>>
ellipsisByPixel(jindo.$("a"), "...", 150);
	 */
	ellipsisByPixel : function(elText, sStringTail, nPixel, fCondition) {
		sStringTail = sStringTail || "...";
		var welText = jindo.$Element(elText);
		var nCurrentWidth = welText.width();
		if (nCurrentWidth < nPixel) {
			return;
		}
		
		var sText = welText.html();
		var nLength = sText.length;

		var nIndex = 0;
		if (typeof fCondition == "undefined") {
			var nWidth = welText.html('A').width();
			nCurrentWidth = nWidth;
			
			while(nCurrentWidth < nPixel) {
				nIndex += Math.max(Math.ceil((nLength - nIndex)/2), 1);
				welText.html(sText.substring(0, nIndex) + sStringTail);
				nCurrentWidth = welText.width();
			}
			
			fCondition = function() {
				return true;
			};
		}
		
		nIndex = welText.html().length - sStringTail.length;
		
		while(nCurrentWidth > nPixel) {
			if (!fCondition()) {
				break;
			}
			nIndex--;
			welText.html(sText.substring(0, nIndex) + sStringTail);
			nCurrentWidth = welText.width();
		}
	},
	
	/**
	 * 여러개의 엘리먼트를 각각의 지정된 최대너비로 말줄임한다.
	 * 말줄임할 엘리먼트의 css white-space값이 "nowrap"이어야한다. (컨테이너보다 텍스트가 길면 행변환되지않고 가로로 길게 표현되는 상태)
	 * @param {Array} aElement 말줄임할 엘리먼트의 배열. 지정된 순서대로 말줄임한다.
	 * @param {String} sStringTail 말줄임을 표현할 문자열 (미지정시 ...)
	 * @param {Array} aMinWidth 말줄임할 너비의 배열.
	 * @param {Function} fCondition 조건 함수. 내부에서 true를 리턴하는 동안에만 말줄임을 진행한다.
	 * @example
//#a #b #c의 너비를 각각 100, 50, 50픽셀로 줄임 (div#parent 가 200픽셀 이하이면 중단)
//#c의 너비를 줄이는 동안 fCondition에서 false를 리턴하면 b, a는 말줄임 되지 않는다.  
<div id="parent">
	<strong id="a">말줄임을적용할내용</strong>
	<strong id="b">말줄임을적용할내용</strong>
	<strong id="c">말줄임을적용할내용</strong>
<div>
ellipsisElementsToDesinatedWidth([jindo.$("c"), jindo.$("b"), jindo.$("a")], "...", [100, 50, 50], function(){
	if (jindo.$Element("parent").width() > 200) {
		return true;
	} 
	return false;
});
	 */
	ellipsisElementsToDesinatedWidth : function(aElement, sStringTail, aMinWidth, fCondition) {
		jindo.$A(aElement).forEach(function(el, i){
			if (!el) {
				jindo.$A.Continue();
			}
			nhn.husky.SE2M_Utils.ellipsisByPixel(el, sStringTail, aMinWidth[i], fCondition);
		});
	},
	
	/**
	 * 숫자를 입력받아 정해진 길이만큼 앞에 "0"이 추가된 문자열을 구한다.
	 * @param {Number} nNumber
	 * @param {Number} nLength
	 * @return {String}
	 * @example
paddingZero(10, 5); ==> "00010" (String)
	 */
	paddingZero : function(nNumber, nLength) {
		var sResult = nNumber.toString();
		while (sResult.length < nLength) {
			sResult = ("0" + sResult);
		}
		return sResult;
	},
	
	/**
	 * string을 byte 단위로 짤라서 tail를 붙힌다.
	 * @param {String} sString
	 * @param {Number} nByte
	 * @param {String} sTail
	 * @example
	 cutStringToByte('일이삼사오육', 6, '...') ==> '일이삼...' (string)	 
	 */
	cutStringToByte : function(sString, nByte, sTail){
		if(sString === null || sString.length === 0) {
			return sString;
		}	
		
		sString = sString.replace(/  +/g, " ");
		if (!sTail && sTail != "") {
			sTail = "...";
		}
		
		var maxByte = nByte;
		var n=0;
		var nLen = sString.length;
		for(var i=0; i<nLen;i++){
			n += this.getCharByte(sString.charAt(i));			
			if(n == maxByte){ 
				if(i == nLen-1) {
					return sString;
				} else { 
					return sString.substring(0,i)+sTail;
				}	
			} else if( n > maxByte ) { 
				return sString.substring(0, i)+sTail; 
			} 		
		}		
		return sString;
	},
	
	/**
	 * 입력받은 문자의 byte 구한다.
	 * @param {String} ch
	 * 
	 */
	getCharByte : function(ch){
		if (ch === null || ch.length < 1) {
			return 0;
		}	
             
        var byteSize = 0;
        var str = escape(ch);
        
        if ( str.length == 1 ) {   // when English then 1byte
             byteSize ++;
        } else if ( str.indexOf("%u") != -1 ) {  // when Korean then 2byte
             byteSize += 2;
        } else if ( str.indexOf("%") != -1 ) {  // else 3byte
             byteSize += str.length/3;
        }           
        return byteSize;
	},
	
	/**
	 * Hash Table에서 원하는 키값만을 가지는 필터된 새로운 Hash Table을 구한다. 
	 * @param {HashTable} htUnfiltered
	 * @param {Array} aKey
	 * @return {HashTable}
	 * @author senxation
	 * @example
getFilteredHashTable({
	a : 1,
	b : 2,
	c : 3,
	d : 4
}, ["a", "c"]);
==> { a : 1, c : 3 }
	 */
	getFilteredHashTable : function(htUnfiltered, vKey) {
		if (!(vKey instanceof Array)) {
			return arguments.callee.call(this, htUnfiltered, [ vKey ]);
		}
		
		var waKey = jindo.$A(vKey);
		return jindo.$H(htUnfiltered).filter(function(vValue, sKey){
			if (waKey.has(sKey) && vValue) {
				return true;
			} else {
				return false;
			}
		}).$value();
	},
		
	isBlankNode : function(elNode){
		var isBlankTextNode = this.isBlankTextNode;
		
		var bEmptyContent = function(elNode){
			if(!elNode) {
				return true;
			}
			
			if(isBlankTextNode(elNode)){
				return true;
			}

			if(elNode.tagName == "BR") {
				return true;
			}
			
			if(elNode.innerHTML == "&nbsp;" || elNode.innerHTML == "") {
				return true;
			}
			
			return false;
		};
		var bEmptyP = function(elNode){
			if(bEmptyContent(elNode)){
				return true;
			}
			
			if(elNode.tagName == "P"){
				for(var i=elNode.childNodes.length-1; i>=0; i--){
					var elTmp = elNode.childNodes[i];
					if(isBlankTextNode(elTmp)){
						elTmp.parentNode.removeChild(elTmp);
					}
				}
				if(elNode.childNodes.length == 1 && bEmptyContent(elNode.firstChild)){
					return true;
				}
			}
			
			return false;
		};

		if(bEmptyP(elNode)){
			return true;
		}

		for(var i=0, nLen=elNode.childNodes.length; i<nLen; i++){
			var elTmp = elNode.childNodes[i];
			if(!bEmptyP(elTmp)){
				return false;
			}
		}

		return true;
	},
	
	isBlankTextNode : function(oNode){
		var sText;
		
		if(oNode.nodeType == 3){
			sText = oNode.nodeValue;
			sText = sText.replace(unescape("%uFEFF"), '');
		
			if(sText == "") {
				return true;
			}
		}
		
		return false;
	},
	
	/**
	 * elNode의 상위 노드 중 태그명이 sTagName과 일치하는 것이 있다면 반환.
	 * @param {String} sTagName 검색 할 태그명
	 * @param {HTMLElement} elNode 검색 시작점으로 사용 할 노드
	 * @return {HTMLElement} 부모 노드 중 태그명이 sTagName과 일치하는 노드. 없을 경우 null 반환 
	 */
	findAncestorByTagName : function(sTagName, elNode){
		while(elNode && elNode.tagName != sTagName) {
			elNode = elNode.parentNode;
		}
		
		return elNode;
	},

	loadCSS : function(url, fnCallback){
		var oDoc = document;
		var elHead = oDoc.getElementsByTagName("HEAD")[0]; 
		var elStyle = oDoc.createElement ("LINK"); 
		elStyle.setAttribute("type", "text/css");
		elStyle.setAttribute("rel", "stylesheet");
		elStyle.setAttribute("href", url);
		if(fnCallback){
			elStyle.onreadystatechange = function(){
				if(elStyle.readyState != "complete"){
					return;
				}
				
				// [SMARTEDITORSUS-308] [IE9] 응답이 304인 경우
				//	onreadystatechage 핸들러에서 readyState 가 complete 인 경우가 두 번 발생
				//	LINK 엘리먼트의 속성으로 콜백 실행 여부를 플래그로 남겨놓아 처리함
				if(elStyle.getAttribute("_complete")){
					return;
				}

				elStyle.setAttribute("_complete", true);
				
				fnCallback();
			};
		}
		elHead.appendChild (elStyle); 
	},

	getUniqueId : function(sPrefix) {
		return (sPrefix || '') + jindo.$Date().time() + (Math.random() * 100000).toFixed();
	},
	
	/**
	 * @param {Object} oSrc value copy할 object
	 * @return {Object}
	 * @example
	 *  var oSource = [1, 3, 4, { a:1, b:2, c: { a:1 }}];
		var oTarget = oSource; // call by reference	
		oTarget = nhn.husky.SE2M_Utils.clone(oSource);
		
		oTarget[1] = 2;
		oTarget[3].a = 100;
		console.log(oSource); // check for deep copy 
		console.log(oTarget, oTarget instanceof Object); // check instance type!
	 */
	clone : function(oSrc, oChange) {
		if ('undefined' != typeof(oSrc) && !!oSrc && (oSrc.constructor == Array || oSrc.constructor == Object)) {
			var oCopy = (oSrc.constructor == Array ? [] : {} );
			for (var property in oSrc) {
				if ('undefined' != typeof(oChange) && !!oChange[property]) {		
					oCopy[property] = arguments.callee(oChange[property]);
				} else {
					oCopy[property] = arguments.callee(oSrc[property]);
				}
			}
			
			return oCopy;
		}
		
		return oSrc;
	},
		
	getHtmlTagAttr : function(sHtmlTag, sAttr) {
		var rx = new RegExp('\\s' + sAttr + "=('([^']*)'|\"([^\"]*)\"|([^\"' >]*))", 'i');
		var aResult = rx.exec(sHtmlTag);
		
		if (!aResult) {
			return '';
		}
		
		var sAttrTmp = (aResult[1] || aResult[2] || aResult[3]); // for chrome 5.x bug!
		if (!!sAttrTmp) {
			sAttrTmp = sAttrTmp.replace(/[\"]/g, '');
		}
		
		return sAttrTmp;
	},
	
	
	/**
	 * iframe 영역의 aling 정보를 다시 세팅하는 부분.
	 * iframe 형태의 산출물을 에디터에 삽입 이후에 에디터 정렬기능을 추가 하였을때 ir_to_db 이전 시점에서 div태그에 정렬을 넣어주는 로직임.
	 * 브라우저 형태에 따라 정렬 태그가 iframe을 감싸는 div 혹은 p 태그에 정렬이 추가된다.
	 * @param {HTMLElement} el iframe의 parentNode
	 * @param {Document} oDoc  document
	 */
	// [COM-1151] SE2M_PreStringConverter 에서 수정하도록 변경
	iframeAlignConverter : function(el, oDoc){
		var sTagName = el.tagName.toUpperCase();
		
		if(sTagName == "DIV" || sTagName == 'P'){
			//irToDbDOM 에서 최상위 노드가 div 엘리먼트 이므로 parentNode가 없으면 최상의 div 노드 이므로 리턴한다.
			if(el.parentNode === null ){ 
				return;
			}
			var elWYSIWYGDoc = oDoc;
			var wel = jindo.$Element(el);
			var sHtml = wel.html();
			//현재 align을 얻어오기.
			var sAlign = jindo.$Element(el).attr('align') || jindo.$Element(el).css('text-align');
			//if(!sAlign){ //  P > DIV의 경우 문제 발생, 수정 화면에 들어 왔을 때 태그 깨짐
			//	return;
			//}
			//새로운 div 노드 생성한다.
			var welAfter = jindo.$Element(jindo.$('<div></div>', elWYSIWYGDoc));
			welAfter.html(sHtml).attr('align', sAlign);			
			wel.replace(welAfter);		
		}		
	},	
	
	/**
	 * jindo.$JSON.fromXML을 변환한 메서드.
	 * 소숫점이 있는 경우의 처리 시에 숫자로 변환하지 않도록 함(parseFloat 사용 안하도록 수정)
	 * 관련 BTS : [COM-1093]
	 * @param {String} sXML  XML 형태의 문자열
	 * @return {jindo.$JSON}
	 */
	getJsonDatafromXML : function(sXML) {
		var o  = {};
		var re = /\s*<(\/?[\w:\-]+)((?:\s+[\w:\-]+\s*=\s*(?:"(?:\\"|[^"])*"|'(?:\\'|[^'])*'))*)\s*((?:\/>)|(?:><\/\1>|\s*))|\s*<!\[CDATA\[([\w\W]*?)\]\]>\s*|\s*>?([^<]*)/ig;
		var re2= /^[0-9]+(?:\.[0-9]+)?$/;
		var ec = {"&amp;":"&","&nbsp;":" ","&quot;":"\"","&lt;":"<","&gt;":">"};
		var fg = {tags:["/"],stack:[o]};
		var es = function(s){ 
			if (typeof s == "undefined") {
				return "";
			}	
			return s.replace(/&[a-z]+;/g, function(m){ return (typeof ec[m] == "string")?ec[m]:m; });
		};
		var at = function(s,c) {
			s.replace(/([\w\:\-]+)\s*=\s*(?:"((?:\\"|[^"])*)"|'((?:\\'|[^'])*)')/g, function($0,$1,$2,$3) {
				c[$1] = es(($2?$2.replace(/\\"/g,'"'):undefined)||($3?$3.replace(/\\'/g,"'"):undefined));
			}); 
		};
		
		var em = function(o) {
			for(var x in o){
				if (o.hasOwnProperty(x)) {
					if(Object.prototype[x]) {
						continue;
					}	
					return false;
				}
			}
			return true;
		};
		
		// $0 : 전체 
		// $1 : 태그명
		// $2 : 속성문자열
		// $3 : 닫는태그
		// $4 : CDATA바디값
		// $5 : 그냥 바디값 
		var cb = function($0,$1,$2,$3,$4,$5) {
			var cur, cdata = "";
			var idx = fg.stack.length - 1;
			
			if (typeof $1 == "string" && $1) {
				if ($1.substr(0,1) != "/") {
					var has_attr = (typeof $2 == "string" && $2);
					var closed   = (typeof $3 == "string" && $3);
					var newobj   = (!has_attr && closed)?"":{};

					cur = fg.stack[idx];
					
					if (typeof cur[$1] == "undefined") {
						cur[$1] = newobj; 
						cur = fg.stack[idx+1] = cur[$1];
					} else if (cur[$1] instanceof Array) {
						var len = cur[$1].length;
						cur[$1][len] = newobj;
						cur = fg.stack[idx+1] = cur[$1][len];  
					} else {
						cur[$1] = [cur[$1], newobj];
						cur = fg.stack[idx+1] = cur[$1][1];
					}
					
					if (has_attr) {
						at($2,cur);
					}	

					fg.tags[idx+1] = $1;

					if (closed) {
						fg.tags.length--;
						fg.stack.length--;
					}
				} else {
					fg.tags.length--;
					fg.stack.length--;
				}
			} else if (typeof $4 == "string" && $4) {
				cdata = $4;
			} else if (typeof $5 == "string" && $5) {
				cdata = es($5);
			}
			
			if (cdata.length > 0) {
				var par = fg.stack[idx-1];
				var tag = fg.tags[idx];

				if (re2.test(cdata)) {
					//cdata = parseFloat(cdata);
				}else if (cdata == "true" || cdata == "false"){
					cdata = new Boolean(cdata);
				}

				if(typeof par =='undefined') {
					return;
				}	
				
				if (par[tag] instanceof Array) {
					var o = par[tag];
					if (typeof o[o.length-1] == "object" && !em(o[o.length-1])) {
						o[o.length-1].$cdata = cdata;
						o[o.length-1].toString = function(){ return cdata; };
					} else {
						o[o.length-1] = cdata;
					}
				} else {
					if (typeof par[tag] == "object" && !em(par[tag])) {
						par[tag].$cdata = cdata;
						par[tag].toString = function() { return cdata; };
					} else {
						par[tag] = cdata;
					}
				}
			}
		};
		
		sXML = sXML.replace(/<(\?|\!-)[^>]*>/g, "");
		sXML.replace(re, cb);
		
		return jindo.$Json(o);
	}
};

/**
 * 문자를 연결하는 '+' 대신에 java와 유사하게 처리하도록 문자열 처리하도록 만드는 object
 * @author nox
 * @example
 var sTmp1 = new StringBuffer();
 sTmp1.append('1').append('2').append('3');
 
 var sTmp2 = new StringBuffer('1');
 sTmp2.append('2').append('3');
 
 var sTmp3 = new StringBuffer('1').append('2').append('3');
 */
if ('undefined' != typeof(StringBuffer)) {
	StringBuffer = {};
}

StringBuffer = function(str) {
	this._aString = [];
	if ('undefined' != typeof(str)) {
		this.append(str);
	}
};

StringBuffer.prototype.append = function(str) {
    this._aString.push(str);
    return this;
};

StringBuffer.prototype.toString = function() {
    return this._aString.join('');
};

StringBuffer.prototype.setLength = function(nLen) {
    if('undefined' == typeof(nLen) || 0 >= nLen) {
    	this._aString.length = 0;
    } else {
    	this._aString.length = nLen;
    }
};

/**
 * Installed Font Detector
 * @author hooriza
 *
 * @see http://remysharp.com/2008/07/08/how-to-detect-if-a-font-is-installed-only-using-javascript/
 */

(function() {

	var oDummy = null;

	IsInstalledFont = function(sFont) {
	
		var sDefFont = sFont == 'Comic Sans MS' ? 'Courier New' : 'Comic Sans MS';
		if (!oDummy) {
			oDummy = document.createElement('div');
		}	
		
		var sStyle = 'position:absolute !important; font-size:200px !important; left:-9999px !important; top:-9999px !important;';
		oDummy.innerHTML = 'mmmmiiiii'+unescape('%uD55C%uAE00');
		oDummy.style.cssText = sStyle + 'font-family:"' + sDefFont + '" !important';
		
		var elBody = document.body || document.documentElement;
		if(elBody.firstChild){
			elBody.insertBefore(oDummy, elBody.firstChild);
		}else{
			document.body.appendChild(oDummy);
		}
		
		var sOrg = oDummy.offsetWidth + '-' + oDummy.offsetHeight;
		
		oDummy.style.cssText = sStyle + 'font-family:"' + sFont + '", "' + sDefFont + '" !important';
		
		var bInstalled = sOrg != (oDummy.offsetWidth + '-' + oDummy.offsetHeight);
		
		document.body.removeChild(oDummy);
		
		return bInstalled;
					
	};	
})();
