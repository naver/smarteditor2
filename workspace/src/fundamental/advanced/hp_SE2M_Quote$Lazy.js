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
nhn.husky.HuskyCore.addLoadedFile("hp_SE2M_Quote$Lazy.js");
/**
 * @depends nhn.husky.SE2M_Quote
 * this.oApp.registerLazyMessage(["TOGGLE_BLOCKQUOTE_LAYER"], ["hp_SE2M_Quote$Lazy.js"]);
 */
nhn.husky.HuskyCore.mixin(nhn.husky.SE2M_Quote, {
	//@lazyload_js TOGGLE_BLOCKQUOTE_LAYER[
	$ON_TOGGLE_BLOCKQUOTE_LAYER : function(){
		this.oApp.exec("TOGGLE_TOOLBAR_ACTIVE_LAYER", [this.elDropdownLayer, null, "SELECT_UI", ["quote"], "DESELECT_UI", ["quote"]]);
		this.oApp.exec('MSG_NOTIFY_CLICKCR', ['quote']);
	},

	$ON_EVENT_SE2_BLOCKQUOTE_LAYER_CLICK : function(weEvent){
		var elButton = nhn.husky.SE2M_Utils.findAncestorByTagName("BUTTON", weEvent.element);

		if(!elButton || elButton.tagName != "BUTTON"){return;}
		
		var sClass = elButton.className;
		this.oApp.exec("APPLY_BLOCKQUOTE", [sClass]);
	},
	
	$ON_APPLY_BLOCKQUOTE : function(sClass){
		if(sClass.match(/(se2_quote[0-9]+)/)){
			this._wrapBlock("BLOCKQUOTE", RegExp.$1);
		}else{
			this._unwrapBlock("BLOCKQUOTE");
		}
		
		this.oApp.exec("HIDE_ACTIVE_LAYER", []);
	},

	/**
	 * 인용구의 중첩 가능한 최대 개수를 넘었는지 확인함
	 * 인용구 내부에서 인용구를 적용하면 중첩되지 않으므로 자식노드에 대해서만 확인함
	 */
	_isExceedMaxDepth : function(elNode){
		var countChildQuote = function(elNode){
			var elChild = elNode.firstChild;
			var nCount = 0;
			var nMaxCount = 0;
			
			if(!elChild){
				if(elNode.tagName && elNode.tagName === "BLOCKQUOTE"){
					return 1;
				}else{
					return 0;
				}
			}
			
			while(elChild){
				if(elChild.nodeType === 1){
					nCount = countChildQuote(elChild);
					
					if(elChild.tagName === "BLOCKQUOTE"){
						nCount += 1;
					}
				
					if(nMaxCount < nCount){
						nMaxCount = nCount;
					}
					
					if(nMaxCount >= this.nMaxLevel){
						return nMaxCount;
					}
				}
				
				elChild = elChild.nextSibling;
			}
			
			return nMaxCount;
		};
		
		return (countChildQuote(elNode) >= this.nMaxLevel);
	},
	
	_unwrapBlock : function(tag){
		var oSelection = this.oApp.getSelection();
		var elCommonAncestor = oSelection.commonAncestorContainer;

		while(elCommonAncestor && elCommonAncestor.tagName != tag){elCommonAncestor = elCommonAncestor.parentNode;}
		if(!elCommonAncestor){return;}

		this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["CANCEL BLOCK QUOTE", {sSaveTarget:"BODY"}]);

		// [SMARTEDITORSUS-1782] 인용구가 제거되기 전에 선택 영역안에 있는 마지막 텍스트노드를 미리 찾아둔다.
		var oLastTextNode = oSelection.commonAncestorContainer;
		if(oLastTextNode.nodeType !== 3){	// 텍스트노드가 아니면
			var aTextNodesInRange = oSelection.getTextNodes() || "",
				nLastIndex = aTextNodesInRange.length - 1;
			oLastTextNode = (nLastIndex > -1) ? aTextNodesInRange[nLastIndex] : null;
		}

		// 인용구내의 요소들을 바깥으로 모두 꺼낸 후 인용구요소를 제거 
		while(elCommonAncestor.firstChild){elCommonAncestor.parentNode.insertBefore(elCommonAncestor.firstChild, elCommonAncestor);}
		elCommonAncestor.parentNode.removeChild(elCommonAncestor);

		// [SMARTEDITORSUS-1782] 찾아둔 마지막 텍스트노드 끝으로 커서를 이동시킨다.
		if(oLastTextNode){
			oSelection.selectNodeContents(oLastTextNode);
			oSelection.collapseToEnd();
			oSelection.select();
		}
		
		this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["CANCEL BLOCK QUOTE", {sSaveTarget:"BODY"}]);
	},
	
	_wrapBlock : function(tag, className){
		var oSelection,
			oLineInfo,
			oStart, oEnd,
			rxDontUseAsWhole = /BODY|TD|LI/i,
			oStartNode, oEndNode, oNode,
			elCommonAncestor,
			elCommonNode,
			elParentQuote,
			elInsertBefore,
			oFormattingNode,
			elNextNode,
			elParentNode,
			aQuoteChild,
			aQuoteCloneChild,
			i, nLen, oP,
			sBookmarkID;
	
		this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["BLOCK QUOTE", {sSaveTarget:"BODY"}]);
		oSelection = this.oApp.getSelection();
//		var sBookmarkID = oSelection.placeStringBookmark();

		// [SMARTEDITORSUS-430] 문자를 입력하고 Enter 후 인용구를 적용할 때 위의 문자들이 인용구 안에 들어가는 문제
		// [SMARTEDITORSUS-1323] 사진 첨부 후 인용구 적용 시 첨부한 사진이 삭제되는 현상
		if(oSelection.startContainer === oSelection.endContainer && 
			oSelection.startContainer.nodeType === 1 &&
			oSelection.startContainer.tagName === "P"){
				if(nhn.husky.SE2M_Utils.isBlankNode(oSelection.startContainer) ||
						nhn.husky.SE2M_Utils.isFirstChildOfNode("IMG", oSelection.startContainer.tagName, oSelection.startContainer) ||
						nhn.husky.SE2M_Utils.isFirstChildOfNode("IFRAME", oSelection.startContainer.tagName, oSelection.startContainer)){
					oLineInfo = oSelection.getLineInfo(true);
				}else{
					oLineInfo = oSelection.getLineInfo(false);
				}
		}else{
			oLineInfo = oSelection.getLineInfo(false);
		}
		
		oStart = oLineInfo.oStart;
		oEnd = oLineInfo.oEnd;
		
		if(oStart.bParentBreak && !rxDontUseAsWhole.test(oStart.oLineBreaker.tagName)){
			oStartNode = oStart.oNode.parentNode;
		}else{
			oStartNode = oStart.oNode;
		}

		if(oEnd.bParentBreak && !rxDontUseAsWhole.test(oEnd.oLineBreaker.tagName)){
			oEndNode = oEnd.oNode.parentNode;
		}else{
			oEndNode = oEnd.oNode;
		}

		oSelection.setStartBefore(oStartNode);
		oSelection.setEndAfter(oEndNode);

		oNode = this._expandToTableStart(oSelection, oEndNode);
		if(oNode){
			oEndNode = oNode;
			oSelection.setEndAfter(oNode);
		}

		oNode = this._expandToTableStart(oSelection, oStartNode);
		if(oNode){
			oStartNode = oNode;
			oSelection.setStartBefore(oNode);
		}

		oNode = oStartNode;
		// IE에서는 commonAncestorContainer 자체는 select 가능하지 않고, 하위에 commonAncestorContainer를 대체 하더라도 똑같은 영역이 셀렉트 되어 보이는 
		// 노드가 있을 경우 하위 노드가 commonAncestorContainer로 반환됨.
		// 그래서, 스크립트로 commonAncestorContainer 계산 하도록 함.
		// 예)
		// <P><SPAN>TEST</SPAN></p>를 선택 할 경우, <SPAN>TEST</SPAN>가 commonAncestorContainer로 잡힘
		oSelection.fixCommonAncestorContainer();
		elCommonAncestor = oSelection.commonAncestorContainer;

		if(oSelection.startContainer == oSelection.endContainer && oSelection.endOffset-oSelection.startOffset == 1){
			elCommonNode = oSelection.startContainer.childNodes[oSelection.startOffset];
		}else{
			elCommonNode = oSelection.commonAncestorContainer;
		}
		
		elParentQuote = this._findParentQuote(elCommonNode);

		if(elParentQuote){
			elParentQuote.className = className;
			
			// [SMARTEDITORSUS-1239] blockquote 태그교체시 style 적용
			this._setStyle(elParentQuote, this.htQuoteStyles_view[className]);
			// --[SMARTEDITORSUS-1239]
			return;
		}

		while(!elCommonAncestor.tagName || (elCommonAncestor.tagName && elCommonAncestor.tagName.match(/UL|OL|LI|IMG|IFRAME/))){
			elCommonAncestor = elCommonAncestor.parentNode;
		}

		// find the insertion position for the formatting tag right beneath the common ancestor container
		while(oNode && oNode != elCommonAncestor && oNode.parentNode != elCommonAncestor){oNode = oNode.parentNode;}

		if(oNode == elCommonAncestor){
			elInsertBefore = elCommonAncestor.firstChild;
		}else{
			elInsertBefore = oNode;
		}
		
		oFormattingNode = oSelection._document.createElement(tag);
		if(className){
			oFormattingNode.className = className;
			// [SMARTEDITORSUS-1239] 에디터에서 인용구 5개이상 상입 시 에디터를 뚫고 노출되는 현상
			// [SMARTEDITORSUS-1229] 인용구 여러 개 중첩하면 에디터 본문 영역을 벗어나는 현상 
			// blockquate style 적용
			this._setStyle(oFormattingNode, this.htQuoteStyles_view[className]);
		}

		elCommonAncestor.insertBefore(oFormattingNode, elInsertBefore);

		oSelection.setStartAfter(oFormattingNode);

		oSelection.setEndAfter(oEndNode);
		oSelection.surroundContents(oFormattingNode);
				
		if(this._isExceedMaxDepth(oFormattingNode)){
			alert(this.oApp.$MSG("SE2M_Quote.exceedMaxCount").replace("#MaxCount#", (this.nMaxLevel + 1)));
			
			this.oApp.exec("HIDE_ACTIVE_LAYER", []);
			
			elNextNode = oFormattingNode.nextSibling;
			elParentNode = oFormattingNode.parentNode;
			aQuoteChild = oFormattingNode.childNodes;
			aQuoteCloneChild = [];
			
			jindo.$Element(oFormattingNode).leave();
			for(i = 0, nLen = aQuoteChild.length; i < nLen; i++){
				aQuoteCloneChild[i] = aQuoteChild[i];
			}
			for(i = 0, nLen = aQuoteCloneChild.length; i < nLen; i++){
				if(elNextNode){
					jindo.$Element(elNextNode).before(aQuoteCloneChild[i]);
				}else{
					jindo.$Element(elParentNode).append(aQuoteCloneChild[i]);
				}
			}
			
			return;
		}

		oSelection.selectNodeContents(oFormattingNode);

		// insert an empty line below, so the text cursor can move there
		if(oFormattingNode && oFormattingNode.parentNode && oFormattingNode.parentNode.tagName == "BODY" && !oFormattingNode.nextSibling){
			oP = oSelection._document.createElement("P");
			//oP.innerHTML = unescape("<br/>");
			oP.innerHTML = "&nbsp;";
			oFormattingNode.parentNode.insertBefore(oP, oFormattingNode.nextSibling);
		}

		//		oSelection.removeStringBookmark(sBookmarkID);
		// Insert an empty line inside the blockquote if it's empty.
		// This is done to position the cursor correctly when the contents of the blockquote is empty in Chrome.
		if(nhn.husky.SE2M_Utils.isBlankNode(oFormattingNode)){
			// [SMARTEDITORSUS-1751] 현재 undo/redo 기능을 사용하지 않고 ie7은 주요브라우저에서 제외되었기 때문에 다른 이슈들 처리시 복잡도를 줄이기 위해 코멘트처리함  
			// [SMARTEDITORSUS-645] 편집영역 포커스 없이 인용구 추가했을 때 IE7에서 박스가 늘어나는 문제
			//oFormattingNode.innerHTML = "&nbsp;";

			// [SMARTEDITORSUS-1567] P 태그로 감싸주지 않으면 크롬에서 blockquote 태그에 정렬이 적용되는데 IR_TO_DB 컨버터에서 style을 리셋하고 있기 때문에 저장되는 시점에 정렬이 제거된다. 
			// [SMARTEDITORSUS-1229] 인용구 여러 개 중첩하면 에디터 본문 영역을 벗어나는 현상
			oFormattingNode.innerHTML = "&nbsp;";
			// [SMARTEDITORSUS-1741] 커서가 p태그 안으로 들어가도록 세팅
			oSelection.selectNodeContents(oFormattingNode.firstChild);
			oSelection.collapseToStart();
			oSelection.select();
		}

		//oSelection.select();
		setTimeout(jindo.$Fn(function(oSelection){
			sBookmarkID = oSelection.placeStringBookmark();
			
			oSelection.select();
			oSelection.removeStringBookmark(sBookmarkID);
			
			this.oApp.exec("FOCUS");	// [SMARTEDITORSUS-469] [SMARTEDITORSUS-434] 에디터 로드 후 최초 삽입한 인용구 안에 포커스가 가지 않는 문제
		},this).bind(oSelection), 0);

		this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["BLOCK QUOTE", {sSaveTarget:"BODY"}]);
		
		return oFormattingNode;
	},

	_expandToTableStart : function(oSelection, oNode){
		var elCommonAncestor = oSelection.commonAncestorContainer;
		var oResultNode = null;

		var bLastIteration = false;
		while(oNode && !bLastIteration){
			if(oNode == elCommonAncestor){bLastIteration = true;}

			if(/TBODY|TFOOT|THEAD|TR/i.test(oNode.tagName)){
				oResultNode = this._getTableRoot(oNode);
				break;
			}
			oNode = oNode.parentNode;
		}
		
		return oResultNode;
	},
	
	_getTableRoot : function(oNode){
		while(oNode && oNode.tagName != "TABLE"){oNode = oNode.parentNode;}
		
		return oNode;
	},
	
	_setStyle : function(el, sStyle) {
		el.setAttribute("style", sStyle);
		el.style.cssText = sStyle;
	}
	//@lazyload_js]
});