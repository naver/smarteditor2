/**
 * @pluginDesc Enter키 입력시에 현재 줄을 P 태그로 감거나 <br> 태그를 삽입한다.
 */
nhn.husky.SE_WYSIWYGEnterKey = jindo.$Class({
	name : "SE_WYSIWYGEnterKey",

	$init : function(sLineBreaker){
		if(sLineBreaker == "BR"){
			this.sLineBreaker = "BR";
		}else{
			this.sLineBreaker = "P";
		}
		
		this.htBrowser = jindo.$Agent().navigator();
		
		// [SMARTEDITORSUS-227] IE 인 경우에도 에디터 Enter 처리 로직을 사용하도록 수정
		if(this.htBrowser.opera && this.sLineBreaker == "P"){
			this.$ON_MSG_APP_READY = function(){};
		}

		/**
		 *	[SMARTEDITORSUS-230] 밑줄+색상변경 후, 엔터치면 스크립트 오류
		 *	[SMARTEDITORSUS-180] [IE9] 배경색 적용 후, 엔터키 2회이상 입력시 커서위치가 다음 라인으로 이동하지 않음
		 * 		오류 현상 : 	IE9 에서 엔터 후 생성된 P 태그가 "빈 SPAN 태그만 가지는 경우" P 태그 영역이 보이지 않거나 포커스가 위로 올라가 보임
		 *		해결 방법 : 	커서 홀더로 IE 이외에서는 <br> 을 사용
		 *						- IE 에서는 렌더링 시 <br> 부분에서 비정상적인 P 태그가 생성되어 [SMARTEDITORSUS-230] 오류 발생
		 *						unescape("%uFEFF") (BOM) 을 추가
		 *						- IE9 표준모드에서 [SMARTEDITORSUS-180] 의 문제가 발생함
		 *						(unescape("%u2028") (Line separator) 를 사용하면 P 가 보여지나 사이드이펙트가 우려되어 사용하지 않음)
		 *	IE 브라우저에서 Enter 처리 시, &nbsp; 를 넣어주므로 해당 방식을 그대로 사용하도록 수정함
		 */
		if(this.htBrowser.ie){
			this._addCursorHolder = this._addCursorHolderSpace;
			
			if(this.htBrowser.nativeVersion < 9 || document.documentMode < 9){
				this._addExtraCursorHolder = function(){};
				this._addBlankTextAllSpan = function(){};
			}
		}else{
			this._addExtraCursorHolder = function(){};
			this._addBlankText = function(){};
			this._addBlankTextAllSpan = function(){};
		}
	},
	
	$ON_MSG_APP_READY : function(){
		this.oSelection = this.oApp.getEmptySelection();
		this.tmpTextNode = this.oSelection._document.createTextNode(unescape("%u00A0"));	// 공백(&nbsp;) 추가 시 사용할 노드
		jindo.$Fn(this._onKeyDown, this).attach(this.oApp.getWYSIWYGDocument(), "keydown");
	},
	
	_onKeyDown : function(oEvent){
		var oKeyInfo = oEvent.key();
		
		if(oKeyInfo.shift){
			return;
		}
		
		if(oKeyInfo.enter){
			if(this.sLineBreaker == "BR"){
				this._insertBR(oEvent);
			}else{
				this._wrapBlock(oEvent);
			}
		}
	},
	
	// [IE] Selection 내의 노드를 가져와 빈 노드에 unescape("%uFEFF") (BOM) 을 추가
	_addBlankText : function(oSelection){
		var oNodes = oSelection.getNodes(),
			i, nLen, oNode, oNodeChild, tmpTextNode;
			
		for(i=0, nLen=oNodes.length; i<nLen; i++){
			oNode = oNodes[i];

			if(oNode.nodeType !== 1 || oNode.tagName !== "SPAN"){
				continue;
			}
			
			if(oNode.id.indexOf(oSelection.HUSKY_BOOMARK_START_ID_PREFIX) > -1 ||
				oNode.id.indexOf(oSelection.HUSKY_BOOMARK_END_ID_PREFIX) > -1){
				continue;
			}

			oNodeChild = oNode.firstChild;
			
			if(!oNodeChild ||
				(oNodeChild.nodeType == 3 && nhn.husky.SE2M_Utils.isBlankTextNode(oNodeChild)) ||
				(oNodeChild.nodeType == 1 && oNode.childNodes.length == 1 &&
					(oNodeChild.id.indexOf(oSelection.HUSKY_BOOMARK_START_ID_PREFIX) > -1 || oNodeChild.id.indexOf(oSelection.HUSKY_BOOMARK_END_ID_PREFIX) > -1))){
				tmpTextNode = oSelection._document.createTextNode(unescape("%uFEFF"));
				oNode.appendChild(tmpTextNode);
			}
		}
	},
	
	// [IE 이외] 빈 노드 내에 커서를 표시하기 위한 처리
	_addCursorHolder : function(elWrapper){
		var elStyleOnlyNode = elWrapper;
		
		if(elWrapper.innerHTML == "" || (elStyleOnlyNode = this._getStyleOnlyNode(elWrapper))){
			elStyleOnlyNode.innerHTML = "<br>";
		}
		
		if(!elStyleOnlyNode){
			elStyleOnlyNode = this._getStyleNode(elWrapper);
		}
		
		return elStyleOnlyNode;
	},
	
	// [IE] 빈 노드 내에 커서를 표시하기 위한 처리 (_addSpace 사용)
	_addCursorHolderSpace : function(elWrapper){
		var elStyleOnlyNode = this._getStyleOnlyNode(elWrapper);
		var elNode = this._addSpace(elWrapper);
		
		elNode = elStyleOnlyNode || elNode;
		
		if(elNode.innerHTML == ""){
			elNode.innerHTML = unescape("%uFEFF");
		}
		
		return elNode;
	},
	
	_wrapBlock : function(oEvent, sWrapperTagName){
		var oSelection = this.oApp.getSelection(),
			sBM = oSelection.placeStringBookmark(),
			oLineInfo = oSelection.getLineInfo(),
			oStart = oLineInfo.oStart,
			oEnd = oLineInfo.oEnd,
			oSWrapper,
			oEWrapper,
			elStyleOnlyNode;
		
		// line broke by sibling
		// or
		// the parent line breaker is just a block container
		if(!oStart.bParentBreak || oSelection.rxBlockContainer.test(oStart.oLineBreaker.tagName)){
			oEvent.stop();
			
			//	선택된 내용은 삭제
			oSelection.deleteContents();
			if(!!oStart.oNode.parentNode && oStart.oNode.parentNode.nodeType !== 11){
				//	LineBreaker 로 감싸서 분리		
				oSWrapper = this.oApp.getWYSIWYGDocument().createElement(this.sLineBreaker);
				oSelection.moveToBookmark(sBM);	//oSelection.moveToStringBookmark(sBM, true);
				oSelection.setStartBefore(oStart.oNode);
				this._addBlankText(oSelection);
				oSelection.surroundContents(oSWrapper);
				oSelection.collapseToEnd();
				
				oEWrapper = this.oApp.getWYSIWYGDocument().createElement(this.sLineBreaker);
				oSelection.setEndAfter(oEnd.oNode);
				this._addBlankText(oSelection);
				oSelection.surroundContents(oEWrapper);
				oSelection.moveToStringBookmark(sBM, true);	// [SMARTEDITORSUS-180] 포커스 리셋
				oSelection.collapseToEnd();					// [SMARTEDITORSUS-180] 포커스 리셋
				oSelection.removeStringBookmark(sBM);
				
				oSelection.select();
				
				//	Cursor Holder 추가	
				// insert a cursor holder(br) if there's an empty-styling-only-tag surrounding current cursor
				elStyleOnlyNode = this._addCursorHolder(oSWrapper);
				
				if(oEWrapper.lastChild !== null && oEWrapper.lastChild.tagName == "BR"){
					oEWrapper.removeChild(oEWrapper.lastChild);
				}
				
				elStyleOnlyNode = this._addCursorHolder(oEWrapper);
	
				if(oEWrapper.nextSibling && oEWrapper.nextSibling.tagName == "BR"){
					oEWrapper.parentNode.removeChild(oEWrapper.nextSibling);
				}
	
				oSelection.selectNodeContents(elStyleOnlyNode);
				oSelection.collapseToStart();
				oSelection.select();
				
				this.oApp.exec("CHECK_STYLE_CHANGE", []);
				
				sBM = oSelection.placeStringBookmark();
				setTimeout(jindo.$Fn(function(sBM){
					var elBookmark = oSelection.getStringBookmark(sBM);
					if(!elBookmark){return;}

					oSelection.moveToStringBookmark(sBM);
					oSelection.select();
					oSelection.removeStringBookmark(sBM);
				}, this).bind(sBM), 0);
				
				return;
			}
		}

		var elBookmark;
		
		// 아래는 기본적으로 브라우저 기본 기능에 맡겨서 처리함
		if(this.htBrowser.firefox){
			elBookmark = oSelection.getStringBookmark(sBM, true);
			
			if(elBookmark && elBookmark.nextSibling && elBookmark.nextSibling.tagName == "IFRAME"){
				setTimeout(jindo.$Fn(function(sBM){
					var elBookmark = oSelection.getStringBookmark(sBM);
					if(!elBookmark){return;}

					oSelection.moveToStringBookmark(sBM);
					oSelection.select();
					oSelection.removeStringBookmark(sBM);
				}, this).bind(sBM), 0);
			}else{
				oSelection.removeStringBookmark(sBM);
			}
		}else if(this.htBrowser.ie){
			elBookmark = oSelection.getStringBookmark(sBM, true);
			
			var elParentNode = elBookmark.parentNode,
				bAddUnderline = false,
				bAddLineThrough = false;

			if(!elBookmark || !elParentNode){// || elBookmark.nextSibling){
				oSelection.removeStringBookmark(sBM);
				return;
			}
		
			oSelection.removeStringBookmark(sBM);

			bAddUnderline = (elParentNode.tagName === "U" || nhn.husky.SE2M_Utils.findAncestorByTagName("U", elParentNode) !== null);
			bAddLineThrough = (elParentNode.tagName === "S" || elParentNode.tagName === "STRIKE" ||
							(nhn.husky.SE2M_Utils.findAncestorByTagName("S", elParentNode) !== null && nhn.husky.SE2M_Utils.findAncestorByTagName("STRIKE", elParentNode) !== null));
			
			// [SMARTEDITORSUS-26] Enter 후에 밑줄/취소선이 복사되지 않는 문제를 처리 (브라우저 Enter 처리 후 실행되도록 setTimeout 사용)
			if(bAddUnderline || bAddLineThrough){
				setTimeout(jindo.$Fn(this._addTextDecorationTag, this).bind(bAddUnderline, bAddLineThrough), 0);
				
				return;
			}

			// [SMARTEDITORSUS-180] 빈 SPAN 태그에 의해 엔터 후 엔터가 되지 않은 것으로 보이는 문제 (브라우저 Enter 처리 후 실행되도록 setTimeout 사용)
			setTimeout(jindo.$Fn(this._addExtraCursorHolder, this).bind(elParentNode), 0);
		}else{
			oSelection.removeStringBookmark(sBM);
		}
	},
	
	// [IE9 standard mode] 엔터 후의 상/하단 P 태그를 확인하여 BOM, 공백(&nbsp;) 추가
	_addExtraCursorHolder : function(elUpperNode){
		var oNodeChild,
			oPrevChild,
			elHtml;
		
		elUpperNode = this._getStyleOnlyNode(elUpperNode);
		
		// 엔터 후의 상단 SPAN 노드에 BOM 추가
		//if(!!elUpperNode && /^(B|EM|I|LABEL|SPAN|STRONG|SUB|SUP|U|STRIKE)$/.test(elUpperNode.tagName) === false){
		if(!!elUpperNode && elUpperNode.tagName === "SPAN"){ // SPAN 인 경우에만 발생함
			oNodeChild = elUpperNode.lastChild;
									
			while(!!oNodeChild){	// 빈 Text 제거
				oPrevChild = oNodeChild.previousSibling;
				
				if(oNodeChild.nodeType !== 3){
					oNodeChild = oPrevChild;
					continue;
				}
				
				if(nhn.husky.SE2M_Utils.isBlankTextNode(oNodeChild)){
					oNodeChild.parentNode.removeChild(oNodeChild);
				}
				
				oNodeChild = oPrevChild;
			}
			
			elHtml = elUpperNode.innerHTML;

			if(elHtml === "" || elHtml.replace(unescape("%uFEFF"), '') === ""){
				elUpperNode.innerHTML = unescape("%uFEFF");
			}
		}

		// 엔터 후에 비어있는 하단 SPAN 노드에 BOM 추가
		var oSelection = this.oApp.getSelection(),
			sBM,
			elLowerNode,
			elParent;

		if(!oSelection.collapsed){
			return;
		}

		oSelection.fixCommonAncestorContainer();
		elLowerNode = oSelection.commonAncestorContainer;
		
		if(!elLowerNode){
			return;
		}
		
		elLowerNode = oSelection._getVeryFirstRealChild(elLowerNode);
		
		if(elLowerNode.nodeType === 3){
			elLowerNode = elLowerNode.parentNode;
		}
		
		if(!elLowerNode || elLowerNode.tagName !== "SPAN"){
			return;
		}

		elHtml = elLowerNode.innerHTML;
		
		if(elHtml === "" || elHtml.replace(unescape("%uFEFF"), '') === ""){
			elLowerNode.innerHTML = unescape("%uFEFF");
		}
					
		elParent = nhn.husky.SE2M_Utils.findAncestorByTagName("P", elLowerNode);
		
		oSelection.selectNodeContents(elLowerNode);
		
		sBM = oSelection.placeStringBookmark();

		this._addSpace(elParent.previousSibling);	// 상단 P 노드에 공백문자 추가
		this._addSpace(elParent);					// 하단 P 노드에 공백문자 추가

		oSelection.moveToBookmark(sBM);		
		oSelection.selectNodeContents(elLowerNode);
		oSelection.collapseToStart();		
		oSelection.select();

		oSelection.removeStringBookmark(sBM);
	},
	
	// [IE] P 태그 가장 뒤 자식노드로 공백(&nbsp;)을 값으로 하는 텍스트 노드를 추가
	_addSpace : function(elNode){
		var tmpTextNode, sInnerHTML, elChild, elNextChild, bHasNBSP, aImgChild, elLastImg;

		if(!elNode){
			return;
		}
		
		if(elNode.nodeType === 3){
			return elNode.parentNode;
		}
		
		if(elNode.tagName !== "P"){
			return elNode;
		}
		
		aImgChild = jindo.$Element(elNode).child(function(v){  
			return (v.$value().nodeType === 1 && v.$value().tagName === "IMG");
		}, 1);
		
		if(aImgChild.length > 0){
			elLastImg = aImgChild[aImgChild.length - 1].$value();
			elChild = elLastImg.nextSibling;
			
			while(elChild){
				elNextChild = elChild.nextSibling;
				
				if (elChild.nodeType === 3 && (elChild.nodeValue === "&nbsp;" || elChild.nodeValue === unescape("%u00A0"))) {
					elNode.removeChild(elChild);
				}
			
				elChild = elNextChild;
			}
			return elNode;
		}

		sInnerHTML = elNode.innerHTML;

		elChild = elNode.firstChild;
		elNextChild = elChild;
		bHasNBSP = false;
		
		while(elChild){	// &nbsp;를 붙일꺼니까 P 바로 아래의 "%uFEFF"는 제거함
			elNextChild = elChild.nextSibling;
			
			if(elChild.nodeType === 3){
				if(elChild.nodeValue === unescape("%uFEFF")){
					elNode.removeChild(elChild);
				}
				
				if(!bHasNBSP && (elChild.nodeValue === "&nbsp;" || elChild.nodeValue === unescape("%u00A0"))){
					bHasNBSP = true;
				}
			}
			
			elChild = elNextChild;
		}
		
		if(!bHasNBSP){
			tmpTextNode = this.tmpTextNode.cloneNode();
			elNode.appendChild(tmpTextNode);
		}
		
		return elNode;	// [SMARTEDITORSUS-418] return 엘리먼트 추가
	},
	
	// [IE] 엔터 후에 취소선/밑줄 태그를 임의로 추가 (취소선/밑줄에 색상을 표시하기 위함)
	_addTextDecorationTag : function(bAddUnderline, bAddLineThrough){
		var oTargetNode, oNewNode,
			oSelection = this.oApp.getSelection();
			
		if(!oSelection.collapsed){
			return;
		}
					
		oTargetNode = oSelection.startContainer;

		while(oTargetNode){
			if(oTargetNode.nodeType === 3){
				oTargetNode = nhn.DOMFix.parentNode(oTargetNode);
				break;
			}
			
			if(!oTargetNode.childNodes || oTargetNode.childNodes.length === 0){
				oTargetNode.innerHTML = unescape("%uFEFF");
				break;
			}
			
			oTargetNode = oTargetNode.firstChild;	
		}
							
		if(!oTargetNode){
			return;
		}
		
		if(oTargetNode.tagName === "U" || oTargetNode.tagName === "S" || oTargetNode.tagName === "STRIKE"){
			return;
		}
		
		var elStyleOnlyNode;
		
		if(oTargetNode.innerHTML == "" || (elStyleOnlyNode = this._getStyleOnlyNode(oTargetNode))){	
			this._addSpace(elStyleOnlyNode, oTargetNode);
		}
		
		if(bAddUnderline){
			oNewNode = oSelection._document.createElement("U");
			oTargetNode.appendChild(oNewNode);
			oTargetNode = oNewNode;
		}

		if(bAddLineThrough){
			oNewNode = oSelection._document.createElement("STRIKE");
			oTargetNode.appendChild(oNewNode);
		}
		
		oNewNode.innerHTML = unescape("%uFEFF");
		oSelection.selectNodeContents(oNewNode);	
		oSelection.collapseToEnd(); // End 로 해야 새로 생성된 노드 안으로 Selection 이 들어감
		oSelection.select();
	},
	
	// [IE9 standard mode] _getStyleOnlyNode 에서 노드를 검색하 때 빈 노드가 있으면 BOM 추가 
	_addBlankTextAllSpan : function(elNode){
		var aSpanList,
			nSpanLen,
			sInnerHtml,
			i;
		
		if(!elNode){
			return;
		}
		
		aSpanList = jindo.$Element(elNode).child(function(v){
			return (v.$value().nodeType === 1 && v.$value().tagName === "SPAN");
		});
		
		nSpanLen = aSpanList.length;

		for(i=0; i<nSpanLen; i++){
			sInnerHtml = aSpanList[i].html();
			
			if(sInnerHtml === ""){
				aSpanList[i].html(unescape("%uFEFF"));
			}
		}
	},
	
	// returns inner-most styling node
	// -> returns span3 from <span1><span2><span3>aaa</span></span></span>
	_getStyleNode : function(elNode){			
		while(elNode.firstChild && this.oSelection._isBlankTextNode(elNode.firstChild)){
			elNode.removeChild(elNode.firstChild);
		}
		
		var elFirstChild = elNode.firstChild;

		if(!elFirstChild){
			return elNode;
		}
				
		if(elFirstChild.nodeType === 3 || 
			(elFirstChild.nodeType === 1 && 
				(elFirstChild.tagName == "IMG" || elFirstChild.tagName == "BR" || elFirstChild.tagName == "HR" || elFirstChild.tagName == "IFRAME"))){
			return elNode;
		}

		return this._getStyleNode(elNode.firstChild);
	},
	
	// returns inner-most styling only node if there's any.
	// -> returns span3 from <span1><span2><span3></span></span></span>
	_getStyleOnlyNode : function(elNode){
		if(!elNode){
			return null;
		}

		// the final styling node must allow appending children
		// -> this doesn't seem to work for FF
		if(!elNode.insertBefore){
			return null;
		}
		
		if(elNode.tagName == "IMG" || elNode.tagName == "BR" || elNode.tagName == "HR" || elNode.tagName == "IFRAME"){
			return null;
		}
	
		while(elNode.firstChild && this.oSelection._isBlankTextNode(elNode.firstChild)){
			elNode.removeChild(elNode.firstChild);
		}

		if(elNode.childNodes.length>1){
			return null;
		}

		if(!elNode.firstChild){
			return elNode;
		}
		
		// [SMARTEDITORSUS-227] TEXT_NODE 가 return 되는 문제를 수정함. IE 에서 TEXT_NODE 의 innrHTML 에 접근하면 오류 발생
		if(elNode.firstChild.nodeType === 3){
			return nhn.husky.SE2M_Utils.isBlankTextNode(elNode.firstChild) ? elNode : null;
			//return (elNode.firstChild.textContents === null || elNode.firstChild.textContents === "") ? elNode : null;
		}

		return this._getStyleOnlyNode(elNode.firstChild);
	},
	
	_insertBR : function(oEvent){
		oEvent.stop();

		var oSelection = this.oApp.getSelection();

		var elBR = this.oApp.getWYSIWYGDocument().createElement("BR");
		oSelection.insertNode(elBR);
		oSelection.selectNode(elBR);
		oSelection.collapseToEnd();
		
		if(!this.htBrowser.ie){
			var oLineInfo = oSelection.getLineInfo();
			var oEnd = oLineInfo.oEnd;

			// line break by Parent
			// <div> 1234<br></div>인경우, FF에서는 다음 라인으로 커서 이동이 안 일어남.
			// 그래서  <div> 1234<br><br type='_moz'/></div> 이와 같이 생성해주어야 에디터 상에 2줄로 되어 보임.
			if(oEnd.bParentBreak){
				while(oEnd.oNode && oEnd.oNode.nodeType == 3 && oEnd.oNode.nodeValue == ""){
					oEnd.oNode = oEnd.oNode.previousSibling;
				}

				var nTmp = 1;
				if(oEnd.oNode == elBR || oEnd.oNode.nextSibling == elBR){
					nTmp = 0;
				}

				if(nTmp === 0){
					oSelection.pasteHTML("<br type='_moz'/>");
					oSelection.collapseToEnd();
				}
			}
		}

		// the text cursor won't move to the next line without this
		oSelection.insertNode(this.oApp.getWYSIWYGDocument().createTextNode(""));
		oSelection.select();
	}
});
//}