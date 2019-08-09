/*
Copyright (C) NAVER corp.  

This library is free software; you can redistribute it and/or  
modify it under the terms of the GNU Lesser General Public  
License as published by the Free Software Foundation; either  
version 2.1 of the License, or (at your option) any later version.  

This library is distributed in the hope that it will be useful,  
but WITHOUT ANY WARRANTY; without even the implied warranty of  
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU  
Lesser General Public License for more details.  

You should have received a copy of the GNU Lesser General Public  
License along with this library; if not, write to the Free Software  
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA  
*/
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
			
			//[SMARTEDITORSUS-1652] 글자크기 지정후 엔터를 치면 빈SPAN으로 감싸지는데 IE에서 빈SPAN은 높이값을 갖지 않아 커서가 올라가 보이게 됨
			// 따라서, IE의 경우 브라우저모드와 상관없이 다음라인의 SPAN에 무조건 ExtraCursorHolder 를 넣어주도록 코멘트처리함
//			if(this.htBrowser.nativeVersion < 9 || document.documentMode < 9){
//				this._addExtraCursorHolder = function(){};
//			}
		}else{
			this._addExtraCursorHolder = function(){};
			this._addBlankText = function(){};
		}
	},
	
	$ON_MSG_APP_READY : function(){
		this.oApp.exec("ADD_APP_PROPERTY", ["sLineBreaker", this.sLineBreaker]);
		
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
	
	/**
	 * [SMARTEDITORSUS-950] 에디터 적용 페이지의 Compatible meta IE=edge 설정 시 줄간격 벌어짐 이슈 (<BR>)
	 */
	$ON_REGISTER_CONVERTERS : function(){
		this.oApp.exec("ADD_CONVERTER", ["IR_TO_DB", jindo.$Fn(this.onIrToDB, this).bind()]);
	},
	
	/**
	 * IR_TO_DB 변환기 처리
	 */
	onIrToDB : function(sHTML){
		var sContents = sHTML,
			rxEmptyP = /(<p[^>]*>)(?:\s*)(<\/p>)/gi;
			
		// [SMARTEDITORSUS-2258] 글작성시 보여지는 그대로 저장이 될 수 있도록 브라우저에 따라 빈 P 태그에 대해 구분처리
		if(this.htBrowser.ie && this.htBrowser.version < 11){
			// IE10이하 인 경우 빈 P 태그는 공백을 넣어준다.
			sContents = sContents.replace(rxEmptyP, "$1&nbsp;$2");
		}else{
			// 모던브라우저는 빈 P 태그가 높이값을 갖지 않기 때문에 제거해준다.
			sContents = sContents.replace(rxEmptyP, "");
		}
		
		return sContents;
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
		var elNode;
		
		this._addSpace(elWrapper);
		
		elNode = this._getStyleNode(elWrapper);
		
		if(elNode.innerHTML == "" && elNode.nodeName.toLowerCase() != "param"){
			try{
				elNode.innerHTML = unescape("%uFEFF");
			}catch(e){/**/}
		}
		
		return elNode;
	},

	/**
	 * [SMARTEDITORSUS-1513] 시작노드와 끝노드 사이에 첫번째 BR을 찾는다. BR이 없는 경우 끝노드를 반환한다.
	 * @param {Node} oStart 검사할 시작노드
	 * @param {Node} oEnd 검사할 끝노드
	 * @return {Node} 첫번째 BR 혹은 끝노드를 반환한다.
	 */
	_getBlockEndNode : function(oStart, oEnd){
		if(!oStart){
			return oEnd;
		}else if(oStart.nodeName === "BR"){
			return oStart;
		}else if(oStart === oEnd){
			return oEnd;
		}else{
			return this._getBlockEndNode(oStart.nextSibling, oEnd);
		}
	},

	/**
	 * [SMARTEDITORSUS-1797] 북마크 다음노드가가 텍스트노드인 경우, 문자열 앞쪽의 공백문자(\u0020)를 &nbsp;(\u00A0) 문자로 변환한다.
	 * @param {Node} oNode 변환할 텍스트노드 
	 */
	_convertHeadSpace : function(oNode){
		if(oNode && oNode.nodeType === 3){
			var sText = oNode.nodeValue, sSpaces = "";
			for(var i = 0, ch;(ch = sText[i]); i++){
				if(ch !== "\u0020"){
					break;
				}
				sSpaces += "\u00A0";
			}
			if(i > 0){
				oNode.nodeValue = sSpaces + sText.substring(i);
			}
		}
	},
	
	/**
	 * 기준요소의 nextSibling을 찾는데 빈텍스트요소이면 그 다음 nextSibling을 찾는다.
	 * @param {Node} oNode nextSibling을 찾을 기준요소
	 * @returns {Node} 빈텍스트가 아닌 nextSibling 을 반환한다.
	 */
	_getValidNextSibling : function(oNode){
		var oNext = oNode.nextSibling;
		if(!oNext){
			return null;
		}else if(oNext.nodeType == 3 && oNext.nodeValue == ""){
			return arguments.callee(oNext);
		}
		return oNext;
	},

	_wrapBlock : function(oEvent){
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
				oSelection.surroundContents(oSWrapper);
				oSelection.collapseToEnd();
				
				oEWrapper = this.oApp.getWYSIWYGDocument().createElement(this.sLineBreaker);
				// [SMARTEDITORSUS-1513] oStart.oNode와 oEnd.oNode 사이에 BR이 있는 경우, 다음 엔터시 스타일이 비정상으로 복사되기 때문에 중간에 BR이 있으면 BR까지만 잘라서 세팅한다.
				var oEndNode = this._getBlockEndNode(oStart.oNode, oEnd.oNode);
				// [SMARTEDITORSUS-1743] oStart.oNode가 BR인 경우, setStartBefore와 setEndAfter에 모두 oStart.oNode로 세팅을 시도하기 때문에 스크립트 오류가 발생한다.
				// 따라서, _getBlockEndNode 메서드를 통해 찾은 BR이 oStart.oNode인 경우, oEnd.oNode 를 세팅한다.
				if(oEndNode === oStart.oNode){
					oEndNode = oEnd.oNode;
				}
				oSelection.setEndAfter(oEndNode);
				this._addBlankText(oSelection);
				oSelection.surroundContents(oEWrapper);
				oSelection.moveToStringBookmark(sBM, true);	// [SMARTEDITORSUS-180] 포커스 리셋
				oSelection.collapseToEnd();					// [SMARTEDITORSUS-180] 포커스 리셋
				oSelection.removeStringBookmark(sBM);
				oSelection.select();

				// [SMARTEDITORSUS-2312] 위쪽 P에 커서홀더가 없으면 추가 (북마크가 지워진 후에 해야함)
				this._addCursorHolder(oSWrapper);

				// P로 분리했기 때문에 BR이 들어있으면 제거한다.
				if(oEWrapper.lastChild !== null && oEWrapper.lastChild.tagName == "BR"){
					oEWrapper.removeChild(oEWrapper.lastChild);
				}

				//	Cursor Holder 추가
				// insert a cursor holder(br) if there's an empty-styling-only-tag surrounding current cursor
				elStyleOnlyNode = this._addCursorHolder(oEWrapper);

				if(oEWrapper.nextSibling && oEWrapper.nextSibling.tagName == "BR"){
					oEWrapper.parentNode.removeChild(oEWrapper.nextSibling);
				}
	
				oSelection.selectNodeContents(elStyleOnlyNode);
				oSelection.collapseToStart();
				oSelection.select();
				
				this.oApp.exec("CHECK_STYLE_CHANGE");
				
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

		var elBookmark = oSelection.getStringBookmark(sBM, true);
		
		// 아래는 기본적으로 브라우저 기본 기능에 맡겨서 처리함
		if(this.htBrowser.firefox){
			if(elBookmark && elBookmark.nextSibling && elBookmark.nextSibling.tagName == "IFRAME"){
				// [WOEDITOR-1603] FF에서 본문에 글감 삽입 후 엔터키 입력하면 글감이 복사되는 문제
				setTimeout(jindo.$Fn(function(sBM){
					var elBookmark = oSelection.getStringBookmark(sBM);
					if(!elBookmark){return;}

					oSelection.moveToStringBookmark(sBM);
					oSelection.select();
					oSelection.removeStringBookmark(sBM);
				}, this).bind(sBM), 0);
			}else{
				// [SMARTEDITORSUS-1797] 엔터시 공백문자를 &nbsp; 로 변환
				// FF의 경우 2번이상 엔터치면 앞쪽공백이 사라져서 setTimeout으로 처리
				setTimeout(jindo.$Fn(function(elNext){
					this._convertHeadSpace(elNext);
				}, this).bind(elBookmark.nextSibling), 0);
				// [SMARTEDITORSUS-2070] 북마크를 setTimeout 으로 지우면 연속 엔터시 글꼴이 풀리기 때문에 SMARTEDITORSUS-1797 이슈 처리 로직과 분리
				oSelection.removeStringBookmark(sBM);
			}
		}else if(this.htBrowser.ie){
			var elParentNode = elBookmark.parentNode,
				bAddUnderline = false,
				bAddLineThrough = false;

			// [SMARTEDITORSUS-2190] 첫번째 자식노드로 BR 노드가 있으면 블럭라인으로 변환처리 
			this._firstBR2Line(elParentNode, oSelection, oEnd.oLineBreaker);

			if(!elBookmark || !elParentNode){// || elBookmark.nextSibling){
				oSelection.removeStringBookmark(sBM);
				return;
			}

			// [SMARTEDITORSUS-1973] 북마크를 바로 제거하면 커서 위치가 잘못되어 정렬이 풀리기 때문에 setTimeout 으로 제거
			setTimeout(jindo.$Fn(function(){
				this.oApp.getSelection().removeStringBookmark(sBM);
			},this).bind(sBM),0);

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
			elParentNode = elBookmark.parentNode;
			var oNextSibling = this._getValidNextSibling(elBookmark);

			/*
			 * [SMARTEDITORSUS-2046] 크롬에서 span으로 감싸있고 다음요소가 br 인 경우
			 * 커서 앞에 내용이 없으면 br로 line-break가 발생하고
			 * 커서 앞에 내용이 있으면 상위 p태그로 line-break가 발생하는데 p태그가 쪼개지지 않고 그냥 다음 라인에 p태그가 생긴다.
			 * 때문에 span으로 쌓여있고 br태그가 근접해있는 경우 브라우저자체 엔터처리를 막고 강제로 p태그를 쪼개주도록 처리함
			 * [SMARTEDITORSUS-2070] span 에 감싸진 br 뒤에 다른요소가 있는 경우만 해당 로직을 타도록 조건 추가
			 */
			if(elParentNode.tagName == "SPAN" && oNextSibling && oNextSibling.nodeName == "BR" && oNextSibling.nextSibling){
				// 현재 선택된 요소들을 먼저 제거한다.
				oSelection.deleteContents();
				// 셀렉션을 커서부터 라인 끝까지 확장한다.
				oSelection.setEndNodes(elBookmark, oEnd.oLineBreaker);
				// 확장된 셀렉션(즉, 커서 뒷부분)을 잘라낸다.
				var oNextContents = oSelection.extractContents(),
					elNextP = oNextContents.firstChild;	// oNextContents 는 fragment 이므로 나중에 커서를 위치시키기 위해 firstChild를 미리 할당해 둔다.

				// 잘라낸 부분을 다음 라인으로 삽입한다.
				elParentNode = oStart.oLineBreaker.parentNode;	// 커서가 속한 p의 parent
				oNextSibling = oStart.oLineBreaker.nextSibling;	// 커서가 속한 p의 다음요소
				if(oNextSibling){
					elParentNode.insertBefore(oNextContents, oNextSibling);
				}else{
					elParentNode.appendChild(oNextContents);
				}

				// 삽입된 라인의 앞쪽에 커서를 위치시킨다.
				oSelection.selectNodeContents(elNextP);
				oSelection.collapseToStart();
				oSelection.select();

				oSelection.removeStringBookmark(sBM);
				oEvent.stop();	// 브라우저의 엔터처리를 막는다.
			}else{
				// [SMARTEDITORSUS-1797] 엔터시 공백문자를 &nbsp; 로 변환
				this._convertHeadSpace(elBookmark.nextSibling);
				oSelection.removeStringBookmark(sBM);
			}
		}
	},

	/**
	 * [SMARTEDITORSUS-2190] IE8이하에서 P > SPAN > BR 이 첫번째에 있으면 엔터시 SPAN 역전현상(IE버그)이 발생한다.
	 * 이 SPAN 역전현상은 잘못된 태그 구조이기 때문에 다음 엔터시 HuskyRange 에서 오류를 유발한다.
	 * 따라서 P태그 안쪽에 BR 이 첫번째노드로 존재하면 엔터가 동작하기 전에 미리 BR 를 빈 P태그로 변환해두어야 한다.
	 * 
	 * @param {Element}		elParentNode	검사할 노드
	 * @param {HuskyRange}	oSelection		허스키레인지
	 * @param {Element}		oLineBreaker	검사할 노드가 포함된 블럭노드
	 */
	_firstBR2Line : function(elParentNode, oSelection, oLineBreaker){
		while(elParentNode.firstChild && elParentNode.firstChild.nodeName === "BR"){
			// 커서홀더노드를 만들어 미리 BR과 교체해둔다.
			var oCursorHolder = oSelection._document.createTextNode('\u200B');
			elParentNode.replaceChild(oCursorHolder, elParentNode.firstChild);
			// P에서 커서홀더노드 까지를 추출하여 앞 라인으로 붙여넣는다. (P이하에 감싸진 SPAN이나 다른 태그들을 온전히 복사하기 위해 추출하여 삽입하는 방식을 사용함)
			oSelection.setStartBefore(oLineBreaker);
			oSelection.setEndAfter(oCursorHolder);
			oLineBreaker.parentNode.insertBefore(oSelection.extractContents(), oLineBreaker);
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

			while(oNodeChild){	// 빈 Text 제거
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

			if(elHtml.replace("\u200B","").replace("\uFEFF","") === ""){
				elUpperNode.innerHTML = "\u200B";
			}
		}

		// 엔터 후에 비어있는 하단 SPAN 노드에 BOM 추가
		var oSelection = this.oApp.getSelection(),
			elLowerNode;

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
		
		if(elHtml.replace("\u200B","").replace("\uFEFF","") === ""){
			elLowerNode.innerHTML = "\u200B";
		}

		// 백스페이스시 커서가 움직이지 않도록 커서를 커서홀더 앞쪽으로 옮긴다.
		oSelection.selectNodeContents(elLowerNode);
		oSelection.collapseToStart();		
		oSelection.select();
	},
	
	// [IE] P 태그 가장 뒤 자식노드로 공백(&nbsp;)을 값으로 하는 텍스트 노드를 추가
	_addSpace : function(elNode){
		var tmpTextNode, elChild, elNextChild, bHasNBSP, aImgChild, elLastImg;

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
				
				if (elChild.nodeType === 3 && (elChild.nodeValue === "&nbsp;" || elChild.nodeValue === unescape("%u00A0") || elChild.nodeValue === "\u200B")) {
					elNode.removeChild(elChild);
				}
			
				elChild = elNextChild;
			}
			return elNode;
		}
		
		elChild = elNode.firstChild;
		elNextChild = elChild;
		bHasNBSP = false;
		
		while(elChild){	// &nbsp;를 붙일꺼니까 P 바로 아래의 "%uFEFF"는 제거함
			elNextChild = elChild.nextSibling;
			
			if(elChild.nodeType === 3){
				if(elChild.nodeValue === unescape("%uFEFF")){
					elNode.removeChild(elChild);
				}
				
				if(!bHasNBSP && (elChild.nodeValue === "&nbsp;" || elChild.nodeValue === unescape("%u00A0") || elChild.nodeValue === "\u200B")){
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
//				oTargetNode.innerHTML = "\u200B";
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
		
		if(bAddUnderline){
			oNewNode = oSelection._document.createElement("U");
			oTargetNode.appendChild(oNewNode);
			oTargetNode = oNewNode;
		}

		if(bAddLineThrough){
			oNewNode = oSelection._document.createElement("STRIKE");
			oTargetNode.appendChild(oNewNode);
		}
		
		oNewNode.innerHTML = "\u200B";
		oSelection.selectNodeContents(oNewNode);	
		oSelection.collapseToEnd(); // End 로 해야 새로 생성된 노드 안으로 Selection 이 들어감
		oSelection.select();
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