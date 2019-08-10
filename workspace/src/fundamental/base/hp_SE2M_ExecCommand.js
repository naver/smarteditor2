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
//{
/**
 * @fileOverview This file contains Husky plugin that takes care of the basic editor commands
 * @name hp_SE_ExecCommand.js
 */
nhn.husky.SE2M_ExecCommand = jindo.$Class({
	name : "SE2M_ExecCommand",
	oEditingArea : null,
	oUndoOption : null,
	_rxCmdInline : /^(?:bold|underline|italic|strikethrough|superscript|subscript)$/i,	// inline element 가 생성되는 command 

	$init : function(oEditingArea){
		this.oEditingArea = oEditingArea;
		this.nIndentSpacing = 40;
		
		this.rxClickCr = new RegExp('^bold|underline|italic|strikethrough|justifyleft|justifycenter|justifyright|justifyfull|insertorderedlist|insertunorderedlist|outdent|indent$', 'i');
	},

	$BEFORE_MSG_APP_READY : function(){
		// the right document will be available only when the src is completely loaded
		if(this.oEditingArea && this.oEditingArea.tagName == "IFRAME"){
			this.oEditingArea = this.oEditingArea.contentWindow.document;
		}
	},

	$ON_MSG_APP_READY : function(){
		// [SMARTEDITORSUS-2260] 메일 > Mac에서 ctrl 조합 단축키 모두 meta 조합으로 변경
		if (jindo.$Agent().os().mac) {
			this.oApp.exec("REGISTER_HOTKEY", ["meta+b", "EXECCOMMAND", ["bold", false, false]]);
			this.oApp.exec("REGISTER_HOTKEY", ["meta+u", "EXECCOMMAND", ["underline", false, false]]);
			this.oApp.exec("REGISTER_HOTKEY", ["meta+i", "EXECCOMMAND", ["italic", false, false]]);
			this.oApp.exec("REGISTER_HOTKEY", ["meta+d", "EXECCOMMAND", ["strikethrough", false, false]]);
		} else {
			this.oApp.exec("REGISTER_HOTKEY", ["ctrl+b", "EXECCOMMAND", ["bold", false, false]]);
			this.oApp.exec("REGISTER_HOTKEY", ["ctrl+u", "EXECCOMMAND", ["underline", false, false]]);
			this.oApp.exec("REGISTER_HOTKEY", ["ctrl+i", "EXECCOMMAND", ["italic", false, false]]);
			this.oApp.exec("REGISTER_HOTKEY", ["ctrl+d", "EXECCOMMAND", ["strikethrough", false, false]]);
		}

        this.oApp.exec("REGISTER_HOTKEY", ["tab", "INDENT"]);
		this.oApp.exec("REGISTER_HOTKEY", ["shift+tab", "OUTDENT"]);
		//this.oApp.exec("REGISTER_HOTKEY", ["tab", "EXECCOMMAND", ["indent", false, false]]);
		//this.oApp.exec("REGISTER_HOTKEY", ["shift+tab", "EXECCOMMAND", ["outdent", false, false]]);

		this.oApp.exec("REGISTER_UI_EVENT", ["bold", "click", "EXECCOMMAND", ["bold", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["underline", "click", "EXECCOMMAND", ["underline", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["italic", "click", "EXECCOMMAND", ["italic", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["lineThrough", "click", "EXECCOMMAND", ["strikethrough", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["superscript", "click", "EXECCOMMAND", ["superscript", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["subscript", "click", "EXECCOMMAND", ["subscript", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["justifyleft", "click", "EXECCOMMAND", ["justifyleft", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["justifycenter", "click", "EXECCOMMAND", ["justifycenter", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["justifyright", "click", "EXECCOMMAND", ["justifyright", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["justifyfull", "click", "EXECCOMMAND", ["justifyfull", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["orderedlist", "click", "EXECCOMMAND", ["insertorderedlist", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["unorderedlist", "click", "EXECCOMMAND", ["insertunorderedlist", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["outdent", "click", "EXECCOMMAND", ["outdent", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["indent", "click", "EXECCOMMAND", ["indent", false, false]]);

//		this.oApp.exec("REGISTER_UI_EVENT", ["styleRemover", "click", "EXECCOMMAND", ["RemoveFormat", false, false]]);

		this.oNavigator = jindo.$Agent().navigator();

		if(!this.oNavigator.safari && !this.oNavigator.chrome){
			this._getDocumentBR = function(){};
			this._fixDocumentBR	= function(){};
		}
		
		if(!this.oNavigator.ie){
			this._fixCorruptedBlockQuote = function(){};
			
			if(!this.oNavigator.safari && !this.oNavigator.chrome){
				this._insertBlankLine = function(){};
			}
		}

		if(!this.oNavigator.firefox){
			this._extendBlock = function(){};
		}
	},

	$ON_INDENT : function(){
		this.oApp.delayedExec("EXECCOMMAND", ["indent", false, false], 0);
	},
	
	$ON_OUTDENT : function(){
		this.oApp.delayedExec("EXECCOMMAND", ["outdent", false, false], 0);
	},

	$BEFORE_EXECCOMMAND : function(sCommand, bUserInterface, vValue, htOptions){
		var oSelection;
		
		//본문에 전혀 클릭이 한번도 안 일어난 상태에서 크롬과 IE에서 EXECCOMMAND가 정상적으로 안 먹히는 현상. 
		this.oApp.exec("FOCUS");
		this._bOnlyCursorChanged = false;
		oSelection = this.oApp.getSelection();
		// [SMARTEDITORSUS-1584] IE에서 테이블관련 태그 사이의 텍스트노드가 포함된 채로 execCommand 가 실행되면 
		// 테이블 태그들 사이에 더미 P 태그가 추가된다. 
		// 테이블관련 태그 사이에 태그가 있으면 문법에 어긋나기 때문에 getContents 시 이 더미 P 태그들이 밖으로 빠져나가게 된다.
		// 때문에 execCommand 실행되기 전에 셀렉션에 테이블관련 태그 사이의 텍스트노드를 찾아내 지워준다.
		for(var i = 0, aNodes = oSelection.getNodes(), oNode;(oNode = aNodes[i]); i++){
			nhn.husky.SE2M_Utils.removeInvalidNodeInTable(oNode);
		}

		if(/^insertorderedlist|insertunorderedlist$/i.test(sCommand)){
			this._getDocumentBR();
			
			// [SMARTEDITORSUS-985][SMARTEDITORSUS-1740] 
			this._checkBlockQuoteCondition_IE();
			// --[SMARTEDITORSUS-985][SMARTEDITORSUS-1740] 
		}
		
		if(/^justify*/i.test(sCommand)){
			// [SMARTEDITORSUS-704][SMARTEDITORSUS-2050] 메서드 통합
			this._removeElementAlign('span');
		}

		if(this._rxCmdInline.test(sCommand)){
			this.oUndoOption = {bMustBlockElement:true};
			
			if(nhn.CurrentSelection.isCollapsed()){
				this._bOnlyCursorChanged = true;
			}			
		}

		if(sCommand == "indent" || sCommand == "outdent"){
			if(!htOptions){htOptions = {};}
			htOptions["bDontAddUndoHistory"] = true;
		}
		if((!htOptions || !htOptions["bDontAddUndoHistory"]) && !this._bOnlyCursorChanged){
			if(/^justify*/i.test(sCommand)){
				this.oUndoOption = {sSaveTarget:"BODY"};
			}else if(sCommand === "insertorderedlist" || sCommand === "insertunorderedlist"){
				this.oUndoOption = {bMustBlockContainer:true};
			}
			
			this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", [sCommand, this.oUndoOption]);
		}
		if(this.oNavigator.ie && this.oApp.getWYSIWYGDocument().selection){
			if(this.oApp.getWYSIWYGDocument().selection.type === "Control"){
				oSelection = this.oApp.getSelection();
				oSelection.select();
			}
		}
		
		if(sCommand == "insertorderedlist" || sCommand == "insertunorderedlist"){
			this._insertBlankLine();
		}
	},

	/**
	 * [SMARTEDITORSUS-985][SMARTEDITORSUS-1740][SMARTEDITORSUS-1798][SMARTEDITORSUS-2157]
	 * [Win XP - IE 8][IE 9~11][IE edge] 인용구 안에서 번호매기기, 글머리기호를 적용할 때 필요한 조치이다.
	 * 
	 * 인용구 안의 선택한 영역을 기준으로,
	 * 
	 * 선택한 영역이 없는 경우에는 해당 줄을 제외했을 때,
	 * 선택한 영역이 있는 경우에는 선택한 줄을 제외했을 때
	 * 
	 * 더 이상의 <P>가 없는 경우
	 * execCommand("insertorderedlist"), execCommand("insertunorderedlist")가 오동작한다.
	 * 
	 * 이러한 오동작을 방지하기 위해
	 * 인용구 안에서 번호매기기, 글머리기호를 삽입할 때는
	 * execCommand() 실행 전에 빈 <P>를 삽입해 주고,
	 * execCommand() 실행 후 빈 <P>를 제거해 준다.
	 * */
	_checkBlockQuoteCondition_IE : function(){
		var htBrowser = jindo.$Agent().navigator();
		var bProcess = false;
		var elBlockquote;
		
		if((htBrowser.ie && (htBrowser.nativeVersion >= 9 && htBrowser.nativeVersion <= 11) && (htBrowser.version >= 9 && htBrowser.version <= 11))
			|| (this.oApp.oAgent.os().winxp && htBrowser.ie && htBrowser.nativeVersion <= 8) || htBrowser.edge){
			var oSelection = this.oApp.getSelection();
			var elCommonAncestorContainer = oSelection.commonAncestorContainer;
			var htAncestor_blockquote = nhn.husky.SE2M_Utils.findAncestorByTagNameWithCount("BLOCKQUOTE", elCommonAncestorContainer);
			elBlockquote = htAncestor_blockquote.elNode;
			
			if(elBlockquote){
				var htAncestor_cell = nhn.husky.SE2M_Utils.findClosestAncestorAmongTagNamesWithCount(["td", "th"], elCommonAncestorContainer);
				if(htAncestor_cell.elNode){
					if(htAncestor_cell.nRecursiveCount > htAncestor_blockquote.nRecursiveCount){
						// blockquote가 cell 안에서 생성된 경우
						bProcess = true;
					}
				}else{
					// blockquote가 cell 안에서 생성되지 않은 경우
					bProcess = true;
				}
			}
		}
		
		if(bProcess){
			this._insertDummyParagraph_IE(elBlockquote);
		}
	},
	
	/**
	 * [SMARTEDITORSUS-985][SMARTEDITORSUS-1740]
	 * [IE 9~10] 대상 엘리먼트에 빈 <P>를 삽입
	 * */
	_insertDummyParagraph_IE : function(el){
		this._elDummyParagraph = document.createElement("P");
		el.appendChild(this._elDummyParagraph);
	},
	
	/**
	 * [SMARTEDITORSUS-985][SMARTEDITORSUS-1740] 
	 * [IE 9~10] 빈 <P>를 제거
	 * */
	_removeDummyParagraph_IE : function(){
		if(this._elDummyParagraph && this._elDummyParagraph.parentNode){
			this._elDummyParagraph.parentNode.removeChild(this._elDummyParagraph);
		}
	},
	
	$ON_EXECCOMMAND : function(sCommand, bUserInterface, vValue){
		var bSelectedBlock = false;
		var htSelectedTDs = {};
		var oSelection = this.oApp.getSelection();
				
		bUserInterface = (bUserInterface == "" || bUserInterface)?bUserInterface:false;
		vValue = (vValue == "" || vValue)?vValue:false;
		
		this.oApp.exec("IS_SELECTED_TD_BLOCK",['bIsSelectedTd',htSelectedTDs]);
		bSelectedBlock = htSelectedTDs.bIsSelectedTd;

		if( bSelectedBlock){
			if(sCommand == "indent"){
				this.oApp.exec("SET_LINE_BLOCK_STYLE", [null, jindo.$Fn(this._indentMargin, this).bind()]);
			}else if(sCommand == "outdent"){
				this.oApp.exec("SET_LINE_BLOCK_STYLE", [null, jindo.$Fn(this._outdentMargin, this).bind()]);
			}else{ 
				this._setBlockExecCommand(sCommand, bUserInterface, vValue);
			}
		} else {
			switch(sCommand){
			case "indent":
			case "outdent":
				this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", [sCommand]);

				// bookmark 설정
				var sBookmark = oSelection.placeStringBookmark();

				if(sCommand === "indent"){
					this.oApp.exec("SET_LINE_STYLE", [null, jindo.$Fn(this._indentMargin, this).bind(), {bDoNotSelect : true, bDontAddUndoHistory : true}]);
				}else{
					this.oApp.exec("SET_LINE_STYLE", [null, jindo.$Fn(this._outdentMargin, this).bind(), {bDoNotSelect : true, bDontAddUndoHistory : true}]);
				}

				oSelection.moveToStringBookmark(sBookmark);
				oSelection.select();
				oSelection.removeStringBookmark(sBookmark); //bookmark 삭제

				setTimeout(jindo.$Fn(function(sCommand){
					this.oApp.exec("RECORD_UNDO_AFTER_ACTION", [sCommand]);
				}, this).bind(sCommand), 25);

				break;
			
			case "justifyleft":
			case "justifycenter":
			case "justifyright":
			case "justifyfull":
				var oSelectionClone = this._extendBlock();	// FF

				this.oEditingArea.execCommand(sCommand, bUserInterface, vValue);
				
				if(oSelectionClone){
					oSelectionClone.select();
				}
				
				// [SMARTEDITORSUS-2050] 선택된 범위 내에 table이 있다면 align 제거
				// [SMARTEDITORSUS-2114] 크롬에서 표 가운데 정렬이 되지 않는 문제가 있어서 해당 처리를 IE에서만 하도록 수정
				if(this.oNavigator.ie) {
					this._removeElementAlign('table');
				}
				
				break;
				
			default:
				//if(this.oNavigator.firefox){
					//this.oEditingArea.execCommand("styleWithCSS", bUserInterface, false);
				//}
				// [SMARTEDITORSUS-1646] [SMARTEDITORSUS-1653] collapsed 상태이면 execCommand 가 실행되기 전에 ZWSP를 넣어준다.
				// [SMARTEDITORSUS-1702] ul, ol 처럼 block element 가 바로 생성되는 경우는 ZWSP 삽입 제외
				if(oSelection.collapsed && this._rxCmdInline.test(sCommand)){
					// collapsed 인 경우
					var sBM = oSelection.placeStringBookmark(),
						oBM = oSelection.getStringBookmark(sBM),
						oHolderNode = oBM.previousSibling;
					
					// execCommand를 실행할때마다 ZWSP가 포함된 더미 태그가 자꾸 생길 수 있기 때문에 이미 있으면 있는 걸로 사용한다.
					if(!oHolderNode || oHolderNode.nodeValue !== "\u200B"){
						oHolderNode = this.oApp.getWYSIWYGDocument().createTextNode("\u200B");
						oSelection.insertNode(oHolderNode);
					}
					oSelection.removeStringBookmark(sBM);	// 미리 지워주지 않으면 더미 태그가 생길 수 있다.
					oSelection.selectNodeContents(oHolderNode);
					oSelection.select();
					this.oEditingArea.execCommand(sCommand, bUserInterface, vValue);
					oSelection.collapseToEnd();
					oSelection.select();

					// [SMARTEDITORSUS-1658] 뒤쪽에 더미태그가 있으면 제거해준다.
					var oSingleNode = this._findSingleNode(oHolderNode);
					if(oSingleNode && oSelection._hasCursorHolderOnly(oSingleNode.nextSibling)){
						oSingleNode.parentNode.removeChild(oSingleNode.nextSibling);
					}
				}else{
					this.oEditingArea.execCommand(sCommand, bUserInterface, vValue);
				}
			}
		}

		this._countClickCr(sCommand);
	},

	/**
	 * [SMARTEDITORSUS-1658] 해당노드의 상위로 검색해 single child 만 갖는 최상위 노드를 찾는다.
	 * @param {Node} oNode 확인할 노드
	 * @return {Node} single child 만 감싸고 있는 최상위 노드를 반환한다. 없으면 입력한 노드 반환  
	 */
	_findSingleNode : function(oNode){
		if(!oNode){
			return null;
		}
		if(oNode.parentNode.childNodes.length === 1){
			return this._findSingleNode(oNode.parentNode);
		}else{
			return oNode;
		}
	},
	
	$AFTER_EXECCOMMAND : function(sCommand, bUserInterface, vValue, htOptions){
		if(this.elP1 && this.elP1.parentNode){
			this.elP1.parentNode.removeChild(this.elP1);
		}

		if(this.elP2 && this.elP2.parentNode){
			this.elP2.parentNode.removeChild(this.elP2);
		}
		
		if(/^insertorderedlist|insertunorderedlist$/i.test(sCommand)){
			// this._fixDocumentBR();	// Chrome/Safari
			// [SMARTEDITORSUS-985][SMARTEDITORSUS-1740] 
			this._removeDummyParagraph_IE();
			// --[SMARTEDITORSUS-985][SMARTEDITORSUS-1740] 
			this._fixCorruptedBlockQuote(sCommand === "insertorderedlist" ? "OL" : "UL");	// IE
			// [SMARTEDITORSUS-1795] 갤럭시노트_Android4.1.2 기본브라우저일 경우 내부에 생성된 BLOCKQUOTE 제거
			if(this.oNavigator.bGalaxyBrowser){
				this._removeBlockQuote();
			}
		}
		
		if((/^justify*/i.test(sCommand))){
			this._fixAlign(sCommand === "justifyfull" ? "justify" : sCommand.substring(7));
		}

		if(sCommand == "indent" || sCommand == "outdent"){
			if(!htOptions){htOptions = {};}
			htOptions["bDontAddUndoHistory"] = true;
		}
		
		if((!htOptions || !htOptions["bDontAddUndoHistory"]) && !this._bOnlyCursorChanged){
			this.oApp.exec("RECORD_UNDO_AFTER_ACTION", [sCommand, this.oUndoOption]);
		}

		this.oApp.exec("CHECK_STYLE_CHANGE", []);
	},
		
	/**
	 * [SMARTEDITORSUS-704][SMARTEDITORSUS-2050] Element에 적용된 align 제거
	 * @param String sTagName 대상 element의 tagName
	 */
	_removeElementAlign : function(sTagName){
		var oSelection = this.oApp.getSelection(),
			aNodes = oSelection.getNodes(),
			elNode = null,
			rxTagName = new RegExp('^' + sTagName + '$', 'i');
			
		for(var i=0, nLen=aNodes.length; i<nLen; i++){
			elNode = aNodes[i];
			
			if(elNode.tagName && rxTagName.test(elNode.tagName)){
				elNode.style.textAlign = "";
				elNode.removeAttribute("align");
			}
		}
	},
	
	// [SMARTEDITORSUS-851] align, text-align을 fix해야 할 대상 노드를 찾음
	_getAlignNode : function(elNode){
		if(elNode.tagName && (elNode.tagName === "P" || elNode.tagName === "DIV")){
			return elNode;
		}
		
		elNode = elNode.parentNode;
		
		while(elNode && elNode.tagName){
			if(elNode.tagName === "P" || elNode.tagName === "DIV"){
				return elNode;
			}
			
			elNode = elNode.parentNode;
		}
	},
	
	_fixAlign : function(sAlign){
		var oSelection = this.oApp.getSelection(),
			aNodes = [],
			elNode = null,
			elParentNode = null;
			
		if(oSelection.collapsed){
			aNodes[0] = oSelection.startContainer;	// collapsed인 경우에는 getNodes의 결과는 []
		}else{
			aNodes = oSelection.getNodes();
		}
		
		for(var i=0, nLen=aNodes.length; i<nLen; i++){
			elNode = aNodes[i];
			
			if(elNode.nodeType === 3){
				elNode = elNode.parentNode;
			}
			
			if(elParentNode && (elNode === elParentNode || jindo.$Element(elNode).isChildOf(elParentNode))){
				continue;
			}
			
			elParentNode = this._getAlignNode(elNode);
			
			if(elParentNode && elParentNode.align !== elParentNode.style.textAlign){ // [SMARTEDITORSUS-704] align 속성과 text-align 속성의 값을 맞춰줌
				elParentNode.style.textAlign = sAlign;
				elParentNode.setAttribute("align", sAlign);
			}
		}
	},
	
	_getDocumentBR : function(){
		var i, nLen;
		
		// [COM-715] <Chrome/Safari> 요약글 삽입 > 더보기 영역에서 기호매기기, 번호매기기 설정할때마다 요약글 박스가 아래로 이동됨
		// ExecCommand를 처리하기 전에 현재의 BR을 저장
		
		this.aBRs = this.oApp.getWYSIWYGDocument().getElementsByTagName("BR");
		this.aBeforeBRs = [];
		
		for(i=0, nLen=this.aBRs.length; i<nLen; i++){
			this.aBeforeBRs[i] = this.aBRs[i];
		}
	},
	
	_fixDocumentBR : function(){
		// [COM-715] ExecCommand가 처리된 후에 업데이트된 BR을 처리 전에 저장한 BR과 비교하여 생성된 BR을 제거
		
		if(this.aBeforeBRs.length === this.aBRs.length){	// this.aBRs gets updated automatically when the document is updated
			return;
		}
		
		var waBeforeBRs = jindo.$A(this.aBeforeBRs),
			i, iLen = this.aBRs.length;
		
		for(i=iLen-1; i>=0; i--){
			if(waBeforeBRs.indexOf(this.aBRs[i])<0){
				this.aBRs[i].parentNode.removeChild(this.aBRs[i]);
			}
		}
	},
	
	_setBlockExecCommand : function(sCommand, bUserInterface, vValue){
		var aNodes, aChildrenNode, htSelectedTDs = {};
		this.oSelection = this.oApp.getSelection();
		this.oApp.exec("GET_SELECTED_TD_BLOCK",['aTdCells',htSelectedTDs]);
		aNodes = htSelectedTDs.aTdCells;

		for( var j = 0; j < aNodes.length ; j++){
			
			this.oSelection.selectNodeContents(aNodes[j]);
			this.oSelection.select();
			
			if(this.oNavigator.firefox){
				this.oEditingArea.execCommand("styleWithCSS", bUserInterface, false); //styleWithCSS는 ff전용임.
			}
			
			aChildrenNode = this.oSelection.getNodes();
			for( var k = 0; k < aChildrenNode.length ; k++ ) {
				if(aChildrenNode[k].tagName == "UL" || aChildrenNode[k].tagName == "OL" ){
					jindo.$Element(aChildrenNode[k]).css("color",vValue);
				}
			}			
			this.oEditingArea.execCommand(sCommand, bUserInterface, vValue);
		}
	},
	
	_indentMargin : function(elDiv){
		var elTmp = elDiv,
			aAppend, i, nLen, elInsertTarget, elDeleteTarget, nCurMarginLeft;
		
		while(elTmp){
			if(elTmp.tagName && elTmp.tagName === "LI"){
				elDiv = elTmp;
				break;
			}
			elTmp = elTmp.parentNode;
		}
		
		if(elDiv.tagName === "LI"){
			//<OL>
			//	<OL>
			// 		<LI>22</LI>
			//	</OL>
			//	<LI>33</LI>
			//</OL>
			//와 같은 형태라면 33을 들여쓰기 했을 때, 상단의 silbling OL과 합쳐서 아래와 같이 만들어 줌.
			//<OL>
			//	<OL>
			// 		<LI>22</LI>
			//		<LI>33</LI>
			//	</OL>
			//</OL>
			if(elDiv.previousSibling && elDiv.previousSibling.tagName && elDiv.previousSibling.tagName === elDiv.parentNode.tagName){
				// 하단에 또다른 OL이 있어 아래와 같은 형태라면,
				//<OL>
				//	<OL>
				// 		<LI>22</LI>
				//	</OL>
				//	<LI>33</LI>
				//	<OL>
				// 		<LI>44</LI>
				//	</OL>
				//</OL>
				//22,33,44를 합쳐서 아래와 같이 만들어 줌.
				//<OL>
				//	<OL>
				// 		<LI>22</LI>
				//		<LI>33</LI>
				// 		<LI>44</LI>
				//	</OL>
				//</OL>
				if(elDiv.nextSibling && elDiv.nextSibling.tagName && elDiv.nextSibling.tagName === elDiv.parentNode.tagName){
					aAppend = [elDiv];
					
					for(i=0, nLen=elDiv.nextSibling.childNodes.length; i<nLen; i++){
						aAppend.push(elDiv.nextSibling.childNodes[i]);
					}
					
					elInsertTarget = elDiv.previousSibling;
					elDeleteTarget = elDiv.nextSibling;
					
					for(i=0, nLen=aAppend.length; i<nLen; i++){
						elInsertTarget.insertBefore(aAppend[i], null);
					}
					
					elDeleteTarget.parentNode.removeChild(elDeleteTarget);
				}else{
					elDiv.previousSibling.insertBefore(elDiv, null);
				}

				return;
			}
			
			//<OL>
			//	<LI>22</LI>
			//	<OL>
			// 		<LI>33</LI>
			//	</OL>
			//</OL>
			//와 같은 형태라면 22을 들여쓰기 했을 때, 하단의 silbling OL과 합친다.
			if(elDiv.nextSibling && elDiv.nextSibling.tagName && elDiv.nextSibling.tagName === elDiv.parentNode.tagName){
				elDiv.nextSibling.insertBefore(elDiv, elDiv.nextSibling.firstChild);
				return;
			}
			
			elTmp = elDiv.parentNode.cloneNode(false);
			elDiv.parentNode.insertBefore(elTmp, elDiv);
			elTmp.appendChild(elDiv);
			return;
		}
		
		nCurMarginLeft = parseInt(elDiv.style.marginLeft, 10);
		
		if(!nCurMarginLeft){
			nCurMarginLeft = 0;
		}

		nCurMarginLeft += this.nIndentSpacing;
		elDiv.style.marginLeft = nCurMarginLeft+"px";
	},
	
	_outdentMargin : function(elDiv){
		var elTmp = elDiv,
			elParentNode, elInsertBefore, elNewParent, elInsertParent, oDoc, nCurMarginLeft;
		
		while(elTmp){
			if(elTmp.tagName && elTmp.tagName === "LI"){
				elDiv = elTmp;
				break;
			}
			elTmp = elTmp.parentNode;
		}
		
		if(elDiv.tagName === "LI"){
			elParentNode = elDiv.parentNode;
			elInsertBefore = elDiv.parentNode;
			
			// LI를 적절 위치로 이동.
			// 위에 다른 li/ol/ul가 있는가?
			if(elDiv.previousSibling && elDiv.previousSibling.tagName && elDiv.previousSibling.tagName.match(/LI|UL|OL/)){
				// 위아래로 sibling li/ol/ul가 있다면 ol/ul를 2개로 나누어야됨
				if(elDiv.nextSibling && elDiv.nextSibling.tagName && elDiv.nextSibling.tagName.match(/LI|UL|OL/)){
					elNewParent = elParentNode.cloneNode(false);
					
					while(elDiv.nextSibling){
						elNewParent.insertBefore(elDiv.nextSibling, null);
					}
					
					elParentNode.parentNode.insertBefore(elNewParent, elParentNode.nextSibling);
					elInsertBefore = elNewParent;
				// 현재 LI가 마지막 LI라면 부모 OL/UL 하단에 삽입
				}else{
					elInsertBefore = elParentNode.nextSibling;
				}
			}
			elParentNode.parentNode.insertBefore(elDiv, elInsertBefore);
			
			// 내어쓰기 한 LI 외에 다른 LI가 존재 하지 않을 경우 부모 노드 지워줌
			if(!elParentNode.innerHTML.match(/LI/i)){
				elParentNode.parentNode.removeChild(elParentNode);
			}

			// OL이나 UL 위로까지 내어쓰기가 된 상태라면 LI를 벗겨냄
			if(!elDiv.parentNode.tagName.match(/OL|UL/)){
				elInsertParent = elDiv.parentNode;
				elInsertBefore = elDiv;

				// 내용물을 P로 감싸기
				oDoc = this.oApp.getWYSIWYGDocument();
				elInsertParent = oDoc.createElement("P");
				elInsertBefore = null;
				
				elDiv.parentNode.insertBefore(elInsertParent, elDiv);

				while(elDiv.firstChild){
					elInsertParent.insertBefore(elDiv.firstChild, elInsertBefore);
				}
				elDiv.parentNode.removeChild(elDiv);
			}
			return;
		}
		nCurMarginLeft = parseInt(elDiv.style.marginLeft, 10);
		
		if(!nCurMarginLeft){
			nCurMarginLeft = 0;
		}

		nCurMarginLeft -= this.nIndentSpacing;
		
		if(nCurMarginLeft < 0){
			nCurMarginLeft = 0;
		}
		
		elDiv.style.marginLeft = nCurMarginLeft+"px";
	},
	
	// Fix IE's execcommand bug
	// When insertorderedlist/insertunorderedlist is executed on a blockquote, the blockquote will "suck in" directly neighboring OL, UL's if there's any.
	// To prevent this, insert empty P tags right before and after the blockquote and remove them after the execution.
	// [SMARTEDITORSUS-793] Chrome 에서 동일한 이슈 발생, Chrome 은 빈 P 태그로는 처리되지 않으 &nbsp; 추가
	// [SMARTEDITORSUS-1857] 인용구내에 UL/OL이 있고 바깥에서 UL/OL을 실행하는 경우도 동일한 문제가 발생하여 동일한 방식으로 해결하도록 해당 케이스 추가  
	_insertBlankLine : function(){
		var oSelection = this.oApp.getSelection();
		var elNode = oSelection.commonAncestorContainer;
		this.elP1 = null;
		this.elP2 = null;

		// [SMARTEDITORSUS-793] 인용구 안에서 글머리기호/번호매기기하는 경우에 대한 처리 
		while(elNode){
			if(elNode.tagName == "BLOCKQUOTE"){
				this.elP1 = jindo.$("<p>&nbsp;</p>", this.oApp.getWYSIWYGDocument());
				elNode.parentNode.insertBefore(this.elP1, elNode);

				this.elP2 = jindo.$("<p>&nbsp;</p>", this.oApp.getWYSIWYGDocument());
				elNode.parentNode.insertBefore(this.elP2, elNode.nextSibling);
				
				break;
			}
			elNode = elNode.parentNode;
		}

		// [SMARTEDITORSUS-1857] 인용구 바깥에서 글머리기호/번호매기기하는 경우에 대한 처리
		if(!this.elP1 && !this.elP2){
			elNode = oSelection.commonAncestorContainer;
			elNode = (elNode.nodeType !== 1) ? elNode.parentNode : elNode;
			var elPrev = elNode.previousSibling,
				elNext = elNode.nextSibling;

			if(elPrev && elPrev.tagName === "BLOCKQUOTE"){
				this.elP1 = jindo.$("<p>&nbsp;</p>", this.oApp.getWYSIWYGDocument());
				elPrev.parentNode.insertBefore(this.elP1, elPrev.nextSibling);
			}
			if(elNext && elNext.tagName === "BLOCKQUOTE"){
				this.elP1 = jindo.$("<p>&nbsp;</p>", this.oApp.getWYSIWYGDocument());
				elNext.parentNode.insertBefore(this.elP1, elNext);
			}
		}
	},

	// Fix IE's execcommand bug
	// When insertorderedlist/insertunorderedlist is executed on a blockquote with all the child nodes selected, 
	// eg:<blockquote>[selection starts here]blah...[selection ends here]</blockquote>
	// , IE will change the blockquote with the list tag and create <OL><OL><LI>blah...</LI></OL></OL>.
	// (two OL's or two UL's depending on which command was executed)
	//
	// It can also happen when the cursor is located at bogus positions like 
	// * below blockquote when the blockquote is the last element in the document
	// 
	// [IE] 인용구 안에서 글머리 기호를 적용했을 때, 인용구 밖에 적용된 번호매기기/글머리 기호가 인용구 안으로 빨려 들어가는 문제 처리
	_fixCorruptedBlockQuote : function(sTagName){
		var aNodes = this.oApp.getWYSIWYGDocument().getElementsByTagName(sTagName),
			elCorruptedBlockQuote, elTmpParent, elNewNode, aLists,
			i, nLen, nPos, el, oSelection;
		
		for(i=0, nLen=aNodes.length; i<nLen; i++){
			if(aNodes[i].firstChild && aNodes[i].firstChild.tagName == sTagName){
				elCorruptedBlockQuote = aNodes[i];
				break;
			}
		}
		
		if(!elCorruptedBlockQuote){return;}

		elTmpParent = elCorruptedBlockQuote.parentNode;

		// (1) changing outerHTML will cause loss of the reference to the node, so remember the idx position here
		nPos = this._getPosIdx(elCorruptedBlockQuote);
		el = this.oApp.getWYSIWYGDocument().createElement("DIV");
		el.innerHTML = elCorruptedBlockQuote.outerHTML.replace("<"+sTagName, "<BLOCKQUOTE");
		elCorruptedBlockQuote.parentNode.insertBefore(el.firstChild, elCorruptedBlockQuote);
		elCorruptedBlockQuote.parentNode.removeChild(elCorruptedBlockQuote);

		// (2) and retrieve the new node here
		elNewNode = elTmpParent.childNodes[nPos];

		// garbage <OL></OL> or <UL></UL> will be left over after setting the outerHTML, so remove it here.
		aLists = elNewNode.getElementsByTagName(sTagName);
		
		for(i=0, nLen=aLists.length; i<nLen; i++){
			if(aLists[i].childNodes.length<1){
				aLists[i].parentNode.removeChild(aLists[i]);
			}
		}

		oSelection = this.oApp.getEmptySelection();
		oSelection.selectNodeContents(elNewNode);
		oSelection.collapseToEnd();
		oSelection.select();
	},

	/**
	 * [SMARTEDITORSUS-1795] UL/OL 삽입시 LI 하위에 BLOCKQUOTE 가 있으면 제거한다. 
	 * <blockquote><p><ul><li><span class="Apple-style-span"><blockquote><p style="display: inline !important;">선택영역</p></blockquote></span></li></ul></p><blockquote>
	 * 삭제될때도 복사됨
	 * <blockquote><p><span class="Apple-style-span"><blockquote><p style="display: inline !important;">선택영역</p></blockquote></span></p><blockquote>
	 */
	_removeBlockQuote : function(){
		var sVendorSpanClass = "Apple-style-span",
			elVendorSpan,
			aelVendorSpanDummy,
			oSelection = this.oApp.getSelection(),
			elNode = oSelection.commonAncestorContainer,
			elChild = elNode,
			elLi;

		// LI 와 SPAN.Apple-style-span 를 찾는다.
		while(elNode){
			if(elNode.tagName === "LI"){
				elLi = elNode;
				elNode = (elNode.style.cssText === "display: inline !important; ") ? elNode.parentNode : null;
			}else if(elNode.tagName === "SPAN" && elNode.className === sVendorSpanClass){
				elVendorSpan = elNode;
				elNode = (!elLi) ? elNode.parentNode : null;
			}else{
				elNode = elNode.parentNode;
			}
		}
		// SPAN.Apple-style-span 을 selection 된 텍스트로 교체한 후 다시 selection을 준다. 
		if(elLi && elVendorSpan){
			elNode = elVendorSpan.parentNode; 
			elNode.replaceChild(elChild, elVendorSpan);
			oSelection.selectNodeContents(elNode);
			oSelection.collapseToEnd();
			oSelection.select();
		}
		// BLOCKQUOTE 내에 남아있는 SPAN.Apple-style-span 을 제거한다.(UL과 OL 교체시 남게되는 더미 SPAN 제거용)
		while(elNode){
			if(elNode.tagName === "BLOCKQUOTE"){
				aelVendorSpanDummy = elNode.getElementsByClassName(sVendorSpanClass);
				for(var i = 0;(elVendorSpan = aelVendorSpanDummy[i]); i++){
					elVendorSpan.parentNode.removeChild(elVendorSpan);
				}
				elNode = null;
			}else{
				elNode = elNode.parentNode;
			}
		}
	},

	_getPosIdx : function(refNode){
		var idx = 0;
		for(var node = refNode.previousSibling; node; node = node.previousSibling){idx++;}

		return idx;
	},
	
	_countClickCr : function(sCommand) {
		if (!sCommand.match(this.rxClickCr)) {
			return;
		}	

		this.oApp.exec('MSG_NOTIFY_CLICKCR', [sCommand.replace(/^insert/i, '')]);
	}, 
	
	_extendBlock : function(){
		// [SMARTEDITORSUS-663] [FF] block단위로 확장하여 Range를 새로 지정해주는것이 원래 스펙이므로
		// 해결을 위해서는 현재 선택된 부분을 Block으로 extend하여 execCommand API가 처리될 수 있도록 함

		var oSelection = this.oApp.getSelection(),
			oStartContainer = oSelection.startContainer,
			oEndContainer = oSelection.endContainer,
			aChildImg = [],
			aSelectedImg = [],
			oSelectionClone = oSelection.cloneRange();
		
		// <p><img><br/><img><br/><img></p> 일 때 이미지가 일부만 선택되면 발생
		// - container 노드는 P 이고 container 노드의 자식노드 중 이미지가 여러개인데 선택된 이미지가 그 중 일부인 경우
		
		if(!(oStartContainer === oEndContainer && oStartContainer.nodeType === 1 && oStartContainer.tagName === "P")){
			return;
		}

		aChildImg = jindo.$A(oStartContainer.childNodes).filter(function(value){
			return (value.nodeType === 1 && value.tagName === "IMG");
		}).$value();
		
		aSelectedImg = jindo.$A(oSelection.getNodes()).filter(function(value){
			return (value.nodeType === 1 && value.tagName === "IMG");
		}).$value();
		
		if(aChildImg.length <= aSelectedImg.length){
			return;
		}
		
		oSelection.selectNode(oStartContainer);
		oSelection.select();
		
		return oSelectionClone;
	}
});
//}
