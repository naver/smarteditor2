if(typeof window.nhn=='undefined') window.nhn = {};

/**
 * @fileOverview This file contains a function that takes care of various operations related to find and replace
 * @name N_FindReplace.js
 */
nhn.FindReplace = jindo.$Class({
	sKeyword : "",
	window : null,
	document : null,
	bBrowserSupported : false,

	// true if End Of Contents is reached during last execution of find
	bEOC : false,
	
	$init : function(win){
		this.sInlineContainer = "SPAN|B|U|I|S|STRIKE";
		this.rxInlineContainer = new RegExp("^("+this.sInlineContainer+")$");

		this.window = win;
		this.document = this.window.document;

		if(this.document.domain != this.document.location.hostname){
			var oAgentInfo = jindo.$Agent();
			var oNavigatorInfo = oAgentInfo.navigator();

			if(oNavigatorInfo.firefox && oNavigatorInfo.version < 3){
				this.bBrowserSupported = false;
				this.find = function(){return 3};
				return;
			}
		}

		this.bBrowserSupported = true;
	},
	
	// 0: found
	// 1: not found
	// 2: keyword required
	// 3: browser not supported
	find : function(sKeyword, bCaseMatch, bBackwards, bWholeWord){
		var bSearchResult, bFreshSearch;

		this.window.focus();

		if(!sKeyword) return 2;

		// try find starting from current cursor position
		this.bEOC = false;
		bSearchResult = this.findNext(sKeyword, bCaseMatch, bBackwards, bWholeWord);
		if(bSearchResult) return 0;

		// end of the contents could have been reached so search again from the beginning
		this.bEOC = true;
		bSearchResult = this.findNew(sKeyword, bCaseMatch, bBackwards, bWholeWord);

		if(bSearchResult) return 0;
		
		return 1;
	},
	
	findNew : function (sKeyword, bCaseMatch, bBackwards, bWholeWord){
		this.findReset();
		return this.findNext(sKeyword, bCaseMatch, bBackwards, bWholeWord);
	},
	
	findNext : function(sKeyword, bCaseMatch, bBackwards, bWholeWord){
		var bSearchResult;
		bCaseMatch = bCaseMatch || false;
		bWholeWord = bWholeWord || false;
		bBackwards = bBackwards || false;

		if(this.window.find){
			var bWrapAround = false;
			return this.window.find(sKeyword, bCaseMatch, bBackwards, bWrapAround, bWholeWord);
		}
		
		// IE solution
		if(this.document.body.createTextRange){
			var iOption = 0;
			if(bBackwards) iOption += 1;
			if(bWholeWord) iOption += 2;
			if(bCaseMatch) iOption += 4;
			
			this.window.focus();
			this._range = this.document.selection.createRangeCollection().item(0);
			this._range.collapse(false);
			bSearchResult = this._range.findText(sKeyword, 1, iOption);

			this._range.select();
			return bSearchResult;
		}
		
		return false;
	},
	
	findReset : function() {
		if (this.window.find){
			this.window.getSelection().removeAllRanges();
			return;
		}

		// IE solution
		if(this.document.body.createTextRange){
			this._range = this.document.body.createTextRange();
			this._range.collapse(true);
			this._range.select();
		}
	},
	
	// 0: replaced & next word found
	// 1: replaced & next word not found
	// 2: not replaced & next word found
	// 3: not replaced & next word not found
	// 4: sOriginalWord required
	replace : function(sOriginalWord, Replacement, bCaseMatch, bBackwards, bWholeWord){
		if(!sOriginalWord) return 4;

		var oSelection = new nhn.HuskyRange(this.window);
		oSelection.setFromSelection();

		bCaseMatch = bCaseMatch || false;
		var bMatch, selectedText = oSelection.toString();
		if(bCaseMatch)
			bMatch = (selectedText == sOriginalWord);
		else
			bMatch = (selectedText.toLowerCase() == sOriginalWord.toLowerCase());
		
		if(!bMatch)
			return this.find(sOriginalWord, bCaseMatch, bBackwards, bWholeWord)+2;

		if(typeof Replacement == "function"){
			// the returned oSelection must contain the replacement 
			oSelection = Replacement(oSelection);
		}else{
			oSelection.pasteText(Replacement);
		}

		// force it to find the NEXT occurance of sOriginalWord
		oSelection.select();

		return this.find(sOriginalWord, bCaseMatch, bBackwards, bWholeWord);
	},

	// returns number of replaced words
	// -1 : if original word is not given
	replaceAll : function(sOriginalWord, Replacement, bCaseMatch, bWholeWord){
		if(!sOriginalWord) return -1;
		
		var bBackwards = false;

		var iReplaceResult;
		var iResult = 0;
		var win = this.window;

		if(this.find(sOriginalWord, bCaseMatch, bBackwards, bWholeWord) !== 0){
			return iResult;
		}
		
		var oSelection = new nhn.HuskyRange(this.window);
		oSelection.setFromSelection();

		// 시작점의 북마크가 지워지면서 시작점을 지나서 replace가 되는 현상 방지용
		// 첫 단어 앞쪽에 특수 문자 삽입 해서, replace와 함께 북마크가 사라지는 것 방지
		oSelection.collapseToStart();
		var oTmpNode = this.window.document.createElement("SPAN");
		oTmpNode.innerHTML = unescape("%uFEFF");
		oSelection.insertNode(oTmpNode);
		oSelection.select();
		var sBookmark = oSelection.placeStringBookmark();
		
		this.bEOC = false;
		while(!this.bEOC){
			iReplaceResult = this.replace(sOriginalWord, Replacement, bCaseMatch, bBackwards, bWholeWord);
			if(iReplaceResult == 0 || iReplaceResult == 1){
				iResult++;
			}
		}

		var startingPointReached = function(){
			var oCurSelection = new nhn.HuskyRange(win);
			oCurSelection.setFromSelection();

			oSelection.moveToBookmark(sBookmark);
			var pos = oSelection.compareBoundaryPoints(nhn.W3CDOMRange.START_TO_END, oCurSelection);

			if(pos == 1) return false;
			return true;
		}

		iReplaceResult = 0;
		this.bEOC = false;
		while(!startingPointReached() && iReplaceResult == 0 && !this.bEOC){
			iReplaceResult = this.replace(sOriginalWord, Replacement, bCaseMatch, bBackwards, bWholeWord);
			if(iReplaceResult == 0 || iReplaceResult == 1) iResult++;
		}
		
		oSelection.moveToBookmark(sBookmark);
		oSelection.select();
		oSelection.removeStringBookmark(sBookmark);

		// setTimeout 없이 바로 지우면 IE8 브라우저가 빈번하게 죽어버림
		setTimeout(function(){
			oTmpNode.parentNode.removeChild(oTmpNode);
		}, 0);
		
		return iResult;
	},

	_isBlankTextNode : function(oNode){
		if(oNode.nodeType == 3 && oNode.nodeValue == ""){return true;}
		return false;
	},

	_getNextNode : function(elNode, bDisconnected){
		if(!elNode || elNode.tagName == "BODY"){
			return {elNextNode: null, bDisconnected: false};
		}

		if(elNode.nextSibling){
			elNode = elNode.nextSibling;
			while(elNode.firstChild){
				if(elNode.tagName && !this.rxInlineContainer.test(elNode.tagName)){
					bDisconnected = true;
				}
				elNode = elNode.firstChild;
			}
			return {elNextNode: elNode, bDisconnected: bDisconnected};
		}
		
		return this._getNextNode(nhn.DOMFix.parentNode(elNode), bDisconnected);
	},

	_getNextTextNode : function(elNode, bDisconnected){
		var htNextNode, elNode;
		while(true){
			htNextNode = this._getNextNode(elNode, bDisconnected);
			elNode = htNextNode.elNextNode;
			bDisconnected = htNextNode.bDisconnected;

			if(elNode && elNode.nodeType != 3 && !this.rxInlineContainer.test(elNode.tagName)){
				bDisconnected = true;
			}
			
			if(!elNode || (elNode.nodeType==3 && !this._isBlankTextNode(elNode))){
				break;
			}
		}
	
		return {elNextText: elNode, bDisconnected: bDisconnected};
	},
	
	_getFirstTextNode : function(){
		// 문서에서 제일 앞쪽에 위치한 아무 노드 찾기
		var elFirstNode = this.document.body.firstChild;
		while(!!elFirstNode && elFirstNode.firstChild){
			elFirstNode = elFirstNode.firstChild;
		}
		
		// 문서에 아무 노드도 없음
		if(!elFirstNode){
			return null;
		}
		
		// 처음 노드가 텍스트 노드가 아니거나 bogus 노드라면 다음 텍스트 노드를 찾음
		if(elFirstNode.nodeType != 3 || this._isBlankTextNode(elFirstNode)){
			var htTmp = this._getNextTextNode(elFirstNode, false);
			elFirstNode = htTmp.elNextText;
		}
		
		return elFirstNode;
	},
	
	_addToTextMap : function(elNode, aTexts, aElTexts, nLen){
		var nStartPos = aTexts[nLen].length;
		for(var i=0, nTo=elNode.nodeValue.length; i<nTo; i++){
			aElTexts[nLen][nStartPos+i] = [elNode, i];
		}
		aTexts[nLen] += elNode.nodeValue;
	},
	
	_createTextMap : function(){
		var aTexts = [];
		var aElTexts = [];
		var nLen=-1;
		
		var elNode = this._getFirstTextNode();
		var htNextNode = {elNextText: elNode, bDisconnected: true};
		while(elNode){
			if(htNextNode.bDisconnected){
				nLen++;
				
				aTexts[nLen] = "";
				aElTexts[nLen] = [];
			}
			this._addToTextMap(htNextNode.elNextText, aTexts, aElTexts, nLen);
			
			htNextNode = this._getNextTextNode(elNode, false);
			elNode = htNextNode.elNextText;
		}

		return {aTexts: aTexts, aElTexts: aElTexts};
	},
	
	replaceAll_js : function(sOriginalWord, Replacement, bCaseMatch, bWholeWord){
		try{
			var t0 = new Date();
			
			var htTmp = this._createTextMap();
			
			var t1 = new Date();
			var aTexts = htTmp.aTexts;
			var aElTexts = htTmp.aElTexts;
	
//			console.log(sOriginalWord);
//			console.log(aTexts);
//			console.log(aElTexts);

			var nMatchCnt = 0;
			
			var nOriginLen = sOriginalWord.length;

			// 단어 한개씩 비교
			for(var i=0, niLen=aTexts.length; i<niLen; i++){
				var sText = aTexts[i];
				// 단어 안에 한글자씩 비교
				//for(var j=0, njLen=sText.length - nOriginLen; j<njLen; j++){
				for(var j=sText.length-nOriginLen; j>=0; j--){
					var sTmp = sText.substring(j, j+nOriginLen);
					if(bWholeWord && 
						(j > 0 && sText.charAt(j-1).match(/[a-zA-Z가-힣]/))
					){
						continue;
					}

					if(sTmp == sOriginalWord){
						nMatchCnt++;

						var oSelection = new nhn.HuskyRange(this.window);
						// 마지막 글자의 뒷부분 처리
						var elContainer, nOffset;
						if(j+nOriginLen < aElTexts[i].length){
							elContainer = aElTexts[i][j+nOriginLen][0];
							nOffset = aElTexts[i][j+nOriginLen][1];
						}else{
							elContainer = aElTexts[i][j+nOriginLen-1][0];
							nOffset = aElTexts[i][j+nOriginLen-1][1]+1;
						}
						oSelection.setEnd(elContainer, nOffset, true, true);
						oSelection.setStart(aElTexts[i][j][0], aElTexts[i][j][1], true);
						
						if(typeof Replacement == "function"){
							// the returned oSelection must contain the replacement 
							oSelection = Replacement(oSelection);
						}else{
							oSelection.pasteText(Replacement);
						}

						j -= nOriginLen;
					}
					continue;
				}
			}
			/*
			var t2 = new Date();
			console.log("OK");
			console.log(sOriginalWord);
			console.log("MC:"+(t1-t0));
			console.log("RP:"+(t2-t1));
			*/

			return nMatchCnt;
		}catch(e){
			/*
			console.log("ERROR");
			console.log(sOriginalWord);
			console.log(new Date()-t0);
			*/
			return nMatchCnt;
		}
	}
});
