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
 * @fileOverview This file contains Husky plugin that takes care of the operations related to hyperlink
 * @name hp_SE_Hyperlink.js
 */
nhn.husky.SE2M_Hyperlink = jindo.$Class({
	name : "SE2M_Hyperlink",
	sATagMarker : "HTTP://HUSKY_TMP.MARKER/",
	
	_assignHTMLElements : function(elAppContainer){
		this.oHyperlinkButton = jindo.$$.getSingle("li.husky_seditor_ui_hyperlink", elAppContainer);
		this.oHyperlinkLayer = jindo.$$.getSingle("div.se2_layer", this.oHyperlinkButton);
		this.oLinkInput = jindo.$$.getSingle("INPUT[type=text]", this.oHyperlinkLayer);
		
		this.oBtnConfirm = jindo.$$.getSingle("button.se2_apply", this.oHyperlinkLayer);
		this.oBtnCancel = jindo.$$.getSingle("button.se2_cancel", this.oHyperlinkLayer);
		
		this.oCbNewWin = jindo.$$.getSingle("INPUT[type=checkbox]", this.oHyperlinkLayer) || null;
	},

	_generateAutoLink : function(sAll, sBreaker, sURL, sWWWURL, sHTTPURL) {
		sBreaker = sBreaker || "";

		var sResult;
		if (sWWWURL){
			sResult = '<a href="http://'+sWWWURL+'">'+sURL+'</a>';
		} else {
			sResult = '<a href="'+sHTTPURL+'">'+sURL+'</a>';
		}
		
		return sBreaker+sResult;
	},

	/**
	 * [SMARTEDITORSUS-1405] 자동링크 비활성화 옵션을 체크해서 처리한다.
	 * $ON_REGISTER_CONVERTERS 메시지가 SE_EditingAreaManager.$ON_MSG_APP_READY 에서 수행되므로 먼저 처리한다.
	 */
	$BEFORE_MSG_APP_READY : function(){
		var htOptions = nhn.husky.SE2M_Configuration.SE2M_Hyperlink;
		if(htOptions && htOptions.bAutolink === false){
			// 자동링크 컨버터 비활성화 
			this.$ON_REGISTER_CONVERTERS = null;
			// UI enable/disable 처리 제외 
			this.$ON_DISABLE_MESSAGE = null;
			this.$ON_ENABLE_MESSAGE = null;
			// 브라우저의 자동링크기능 비활성화 
			try{ this.oApp.getWYSIWYGDocument().execCommand("AutoUrlDetect", false, false); } catch(e){/**/}
		}
	},

	$ON_MSG_APP_READY : function(){
		this.bLayerShown = false;

		// [SMARTEDITORSUS-2260] 메일 > Mac에서 ctrl 조합 단축키 모두 meta 조합으로 변경
		if (jindo.$Agent().os().mac) {
			this.oApp.exec("REGISTER_HOTKEY", ["meta+k", "TOGGLE_HYPERLINK_LAYER", []]);
		} else {
			this.oApp.exec("REGISTER_HOTKEY", ["ctrl+k", "TOGGLE_HYPERLINK_LAYER", []]);
		}

		this.oApp.exec("REGISTER_UI_EVENT", ["hyperlink", "click", "TOGGLE_HYPERLINK_LAYER"]);
		this.oApp.registerLazyMessage(["TOGGLE_HYPERLINK_LAYER", "APPLY_HYPERLINK"], ["hp_SE2M_Hyperlink$Lazy.js"]);
	},
	
	$ON_REGISTER_CONVERTERS : function(){
		this.oApp.exec("ADD_CONVERTER_DOM", ["IR_TO_DB", jindo.$Fn(this.irToDb, this).bind()]);
	},
	
	$LOCAL_BEFORE_FIRST : function(sMsg){
		if(sMsg.match(/(REGISTER_CONVERTERS)/)){
			this.oApp.acceptLocalBeforeFirstAgain(this, true);
			return true;
		}

		this._assignHTMLElements(this.oApp.htOptions.elAppContainer);
		this.sRXATagMarker = this.sATagMarker.replace(/\//g, "\\/").replace(/\./g, "\\.");
		this.oApp.registerBrowserEvent(this.oBtnConfirm, "click", "APPLY_HYPERLINK");
		this.oApp.registerBrowserEvent(this.oBtnCancel, "click", "HIDE_ACTIVE_LAYER");
		this.oApp.registerBrowserEvent(this.oLinkInput, "keydown", "EVENT_HYPERLINK_KEYDOWN");
	},
	
	$ON_EVENT_HYPERLINK_KEYDOWN : function(oEvent){
		if (oEvent.key().enter){
			this.oApp.exec("APPLY_HYPERLINK");
			oEvent.stop();
		}
	},

	/**
	 * [MUG-1265] 버튼이 사용불가 상태이면 자동변환기능을 막는다.
	 * @see http://stackoverflow.com/questions/7556007/avoid-transformation-text-to-link-ie-contenteditable-mode
	 * IE9 이전 버전은 AutoURlDetect을 사용할 수 없어 오류 발생되기 때문에, try catch로 블럭 처리(http://msdn.microsoft.com/en-us/library/aa769893%28VS.85%29.aspx)
	 */
	$ON_DISABLE_MESSAGE : function(sCmd) {
		if(sCmd !== "TOGGLE_HYPERLINK_LAYER"){
			return;
		}
		try{ this.oApp.getWYSIWYGDocument().execCommand("AutoUrlDetect", false, false); } catch(e){/**/}
		this._bDisabled = true;
	},

	/**
	 * [MUG-1265] 버튼이 사용가능 상태이면 자동변환기능을 복원해준다.
	 */
	$ON_ENABLE_MESSAGE : function(sCmd) {
		if(sCmd !== "TOGGLE_HYPERLINK_LAYER"){
			return;
		}
		try{ this.oApp.getWYSIWYGDocument().execCommand("AutoUrlDetect", false, true); } catch(e){/**/}
		this._bDisabled = false;
	},

	irToDb : function(oTmpNode){
		if(this._bDisabled){	// [MUG-1265] 버튼이 사용불가 상태이면 자동변환하지 않는다.
			return;
		}
		//저장 시점에 자동 링크를 위한 함수.
		//[SMARTEDITORSUS-1207][IE][메일] object 삽입 후 글을 저장하면 IE 브라우저가 죽어버리는 현상   
		//원인 : 확인 불가. IE 저작권 관련 이슈로 추정
		//해결 : contents를 가지고 있는 div 태그를 이 함수 내부에서 복사하여 수정 후 call by reference로 넘어온 변수의 innerHTML을 변경	
		var oCopyNode = oTmpNode.cloneNode(true);
		try{
			oCopyNode.innerHTML;
		}catch(e) {
			oCopyNode = jindo.$(oTmpNode.outerHTML);
		}

		var oTmpRange = this.oApp.getEmptySelection();
		var elFirstNode = oTmpRange._getFirstRealChild(oCopyNode);
		var elLastNode = oTmpRange._getLastRealChild(oCopyNode);
		var waAllNodes = jindo.$A(oTmpRange._getNodesBetween(elFirstNode, elLastNode));
		var aAllTextNodes = waAllNodes.filter(function(elNode){return (elNode && elNode.nodeType === 3);}).$value();
		var a = aAllTextNodes;
		
		/*
		// 텍스트 검색이 용이 하도록 끊어진 텍스트 노드가 있으면 합쳐줌. (화면상으로 ABC라고 보이나 상황에 따라 실제 2개의 텍스트 A, BC로 이루어져 있을 수 있음. 이를 ABC 하나의 노드로 만들어 줌.)
		// 문제 발생 가능성에 비해서 퍼포먼스나 사이드 이펙트 가능성 높아 일단 주석
		var aCleanTextNodes = [];
		for(var i=0, nLen=aAllTextNodes.length; i<nLen; i++){
			if(a[i].nextSibling && a[i].nextSibling.nodeType === 3){
				a[i].nextSibling.nodeValue += a[i].nodeValue;
				a[i].parentNode.removeChild(a[i]);
			}else{
				aCleanTextNodes[aCleanTextNodes.length] = a[i];
			}
		}
		*/
		
		// IE에서 PRE를 제외한 다른 태그 하위에 있는 텍스트 노드는 줄바꿈 등의 값을 변질시킴
		var elTmpDiv = this.oApp.getWYSIWYGDocument().createElement("DIV");
		var elParent, bAnchorFound;
		var sTmpStr = "@"+(new Date()).getTime()+"@";
		var rxTmpStr = new RegExp(sTmpStr, "g");
		for(var i=0, nLen=aAllTextNodes.length; i<nLen; i++){
			// Anchor가 이미 걸려 있는 텍스트이면 링크를 다시 걸지 않음.
			elParent = a[i].parentNode;
			bAnchorFound = false;
			while(elParent){
				if(elParent.tagName === "A" || elParent.tagName === "PRE"){
					bAnchorFound = true;
					break;
				}
				elParent = elParent.parentNode;
			}
			if(bAnchorFound){
				continue;
			}
			// www.또는 http://으로 시작하는 텍스트에 링크 걸어 줌
			// IE에서 텍스트 노드 앞쪽의 스페이스나 주석등이 사라지는 현상이 있어 sTmpStr을 앞에 붙여줌.
			elTmpDiv.innerHTML = "";
			
			try {
				elTmpDiv.appendChild(a[i].cloneNode(true));

				// IE에서 innerHTML를 이용 해 직접 텍스트 노드 값을 할당 할 경우 줄바꿈등이 깨질 수 있어, 텍스트 노드로 만들어서 이를 바로 append 시켜줌
				// [SMARTEDITORSUS-1649] https:// URL을 입력한 경우에도 자동링크 지원
				//elTmpDiv.innerHTML = (sTmpStr+elTmpDiv.innerHTML).replace(/(&nbsp|\s)?(((?!http:\/\/)www\.(?:(?!\&nbsp;|\s|"|').)+)|(http:\/\/(?:(?!&nbsp;|\s|"|').)+))/ig, this._generateAutoLink);
				elTmpDiv.innerHTML = (sTmpStr+elTmpDiv.innerHTML).replace(/(&nbsp|\s)?(((?!http[s]?:\/\/)www\.(?:(?!&nbsp;|\s|"|').)+)|(http[s]?:\/\/(?:(?!&nbsp;|\s|"|').)+))/ig, this._generateAutoLink);
				// --[SMARTEDITORSUS-1649]
				
				// innerHTML 내에 텍스트가 있을 경우 insert 시에 주변 텍스트 노드와 합쳐지는 현상이 있어 div로 위치를 먼저 잡고 하나씩 삽입
				a[i].parentNode.insertBefore(elTmpDiv, a[i]);
				a[i].parentNode.removeChild(a[i]);
			} catch(e1) {
				// console.warn(e);
			}
			
			while(elTmpDiv.firstChild){
				elTmpDiv.parentNode.insertBefore(elTmpDiv.firstChild, elTmpDiv);
			}
			elTmpDiv.parentNode.removeChild(elTmpDiv);
//			alert(a[i].nodeValue);
		}
		elTmpDiv = oTmpRange = elFirstNode = elLastNode = waAllNodes = aAllTextNodes = a = elParent = null;
		oCopyNode.innerHTML = oCopyNode.innerHTML.replace(rxTmpStr, "");
		oTmpNode.innerHTML = oCopyNode.innerHTML;
		oCopyNode = null;
//alert(oTmpNode.innerHTML);
	}
});