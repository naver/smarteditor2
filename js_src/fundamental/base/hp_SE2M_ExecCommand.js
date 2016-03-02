//{
/**
 * @fileOverview This file contains Husky plugin that takes care of the basic editor commands
 * @name hp_SE_ExecCommand.js
 */
nhn.husky.SE2M_ExecCommand = jindo.$Class({
	name : "SE2M_ExecCommand",
	oEditingArea : null,
	oUndoOption : null,

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
		this.oApp.exec("REGISTER_HOTKEY", ["ctrl+b", "EXECCOMMAND", ["bold", false, false]]);
		this.oApp.exec("REGISTER_HOTKEY", ["ctrl+u", "EXECCOMMAND", ["underline", false, false]]);
		this.oApp.exec("REGISTER_HOTKEY", ["ctrl+i", "EXECCOMMAND", ["italic", false, false]]);
		this.oApp.exec("REGISTER_HOTKEY", ["ctrl+d", "EXECCOMMAND", ["strikethrough", false, false]]);
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
		var elTmp, oSelection;
		
		//본문에 전혀 클릭이 한번도 안 일어난 상태에서 크롬과 IE에서 EXECCOMMAND가 정상적으로 안 먹히는 현상. 
		this.oApp.exec("FOCUS");
		this._bOnlyCursorChanged = false;		
		oSelection = this.oApp.getSelection();
				
		if(/^insertorderedlist|insertunorderedlist$/i.test(sCommand)){
			this._getDocumentBR();
		}
		
		if(/^justify*/i.test(sCommand)){
			this._removeSpanAlign();
		}
		
		if(sCommand.match(/^bold|underline|italic|strikethrough|superscript|subscript$/i)){
			this.oUndoOption = {bMustBlockElement:true};
			
			if( nhn.CurrentSelection.isCollapsed()){
				this._bOnlyCursorChanged = true;

				//[SMARTEDITORSUS-228] 글꼴 효과를 미리 지정 한 후에 텍스트 입력 시, 색상 변경은 적용되나 굵게 기울임 밑줄 취소선 등의 효과는 적용안됨
				if( this.oNavigator.ie ){
					if(oSelection.startContainer.tagName == "BODY" && oSelection.startOffset === 0){
						elTmp = this.oApp.getWYSIWYGDocument().createElement("SPAN");					
						elTmp.innerHTML = unescape("%uFEFF");
						oSelection.insertNode(elTmp);
						oSelection.select();	
					}
				}
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
		if(this.oNavigator.ie){
			if(this.oApp.getWYSIWYGDocument().selection.type === "Control"){
				oSelection = this.oApp.getSelection();
				oSelection.select();
			} 
			
			if(sCommand == "insertorderedlist" || sCommand == "insertunorderedlist"){
				this._insertBlankLine();
			}
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
            	
				var sBookmark = oSelection.placeStringBookmark();

				if(sCommand === "indent"){
					this.oApp.exec("SET_LINE_STYLE", [null, jindo.$Fn(this._indentMargin, this).bind(), {bDoNotSelect : true, bDontAddUndoHistory : true}]);
				}else{
					this.oApp.exec("SET_LINE_STYLE", [null, jindo.$Fn(this._outdentMargin, this).bind(), {bDoNotSelect : true, bDontAddUndoHistory : true}]);
				}

				oSelection.moveToStringBookmark(sBookmark);
				oSelection.select();
				oSelection.removeStringBookmark(sBookmark);
				
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
				
				if(!!oSelectionClone){
					oSelectionClone.select();
				}
				
				break;
				
			default:
				//if(this.oNavigator.firefox){
					//this.oEditingArea.execCommand("styleWithCSS", bUserInterface, false);
				//}
				this.oEditingArea.execCommand(sCommand, bUserInterface, vValue);
			}
		}
		
		this._countClickCr(sCommand);
	},

	$AFTER_EXECCOMMAND : function(sCommand, bUserInterface, vValue, htOptions){
		if(this.oNavigator.ie){
			if(this.elP1 && this.elP1.parentNode){
				this.elP1.parentNode.removeChild(this.elP1);
			}

			if(this.elP2 && this.elP2.parentNode){
				this.elP2.parentNode.removeChild(this.elP2);
			}
		}
		
		if(/^insertorderedlist|insertunorderedlist$/i.test(sCommand)){
			this._fixDocumentBR();	// Chrome/Safari
			this._fixCorruptedBlockQuote(sCommand === "insertorderedlist" ? "OL" : "UL");	// IE
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
	
	_removeSpanAlign : function(){
		var oSelection = this.oApp.getSelection(),
			aNodes = oSelection.getNodes(),
			elNode = null;
			
		for(var i=0, nLen=aNodes.length; i<nLen; i++){
			elNode = aNodes[i];
			
			// [SMARTEDITORSUS-704] SPAN에서 적용된 Align을 제거
			if(elNode.tagName && elNode.tagName === "SPAN"){
				elNode.style.textAlign = "";
				elNode.removeAttribute("align");
			}
		}
	},
	
	_fixAlign : function(sAlign){
		var oSelection = this.oApp.getSelection(),
			aNodes = oSelection.getNodes(),
			elNode = null;
			
		var removeTableAlign = !this.oNavigator.ie ? function(){} : function(elNode){
			if(elNode.tagName && elNode.tagName === "TABLE"){
				elNode.removeAttribute("align");
				
				return true;
			}
			
			return false;
		};
			
		if(aNodes.length === 1 && aNodes[0].nodeType === 3){ // [SMARTEDITORSUS-704] 텍스트노드 하나만 선택된 경우
			elNode = aNodes[0].parentNode;
			
			while(elNode && elNode.tagName){
				if((elNode.tagName === "P" || elNode.tagName === "DIV") && elNode.align !== elNode.style.textAlign){
					elNode.style.textAlign = sAlign;
					elNode.setAttribute("align", sAlign);
					
					break;
				}
				
				elNode = elNode.parentNode;
			}
			
			return;
		}
		
		for(var i=0, nLen=aNodes.length; i<nLen; i++){
			elNode = aNodes[i];
			
			if(elNode.nodeType !== 1){
				continue;
			}
			
			if(removeTableAlign(elNode)){	// IE
				continue;
			}
			
			// [SMARTEDITORSUS-704] align 속성과 text-align 속성의 값을 맞춰줌
			if((elNode.tagName === "P" || elNode.tagName === "DIV") && elNode.align !== elNode.style.textAlign){
				elNode.style.textAlign = sAlign;
				elNode.setAttribute("align", sAlign);
			}
		}
	},
	
	_getDocumentBR : function(){
		// [COM-715] <Chrome/Safari> 요약글 삽입 > 더보기 영역에서 기호매기기, 번호매기기 설정할때마다 요약글 박스가 아래로 이동됨
		// ExecCommand를 처리하기 전에 현재의 BR을 저장
		
		this.aBRs = this.oApp.getWYSIWYGDocument().getElementsByTagName("BR");
		this.aBeforeBRs = [];
		
		for(i=0, iLen=this.aBRs.length; i<iLen; i++){
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
		var elTmp = elDiv;
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
					var aAppend = [elDiv];
					for(var i=0, nLen=elDiv.nextSibling.childNodes.length; i<nLen; i++){
						aAppend.push(elDiv.nextSibling.childNodes[i]);
					}
					
					var elInsertTarget = elDiv.previousSibling;
					var elDeleteTarget = elDiv.nextSibling;
					for(var i=0, nLen=aAppend.length; i<nLen; i++){
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
			
			var elTmp = elDiv.parentNode.cloneNode(false);
			elDiv.parentNode.insertBefore(elTmp, elDiv);
			elTmp.appendChild(elDiv);
			return;
		}
		var nCurMarginLeft = parseInt(elDiv.style.marginLeft);
		if(!nCurMarginLeft){
			nCurMarginLeft = 0;
		}

		nCurMarginLeft += this.nIndentSpacing;
		elDiv.style.marginLeft = nCurMarginLeft+"px";
	},
	
	_outdentMargin : function(elDiv){
		var elTmp = elDiv;
		while(elTmp){
			if(elTmp.tagName && elTmp.tagName === "LI"){
				elDiv = elTmp;
				break;
			}
			elTmp = elTmp.parentNode;
		}
		
		if(elDiv.tagName === "LI"){
			var elParentNode = elDiv.parentNode;
			
			var elInsertBefore = elDiv.parentNode;
			
			// LI를 적절 위치로 이동.
			// 위에 다른 li/ol/ul가 있는가?
			if(elDiv.previousSibling && elDiv.previousSibling.tagName && elDiv.previousSibling.tagName.match(/LI|UL|OL/)){
				// 위아래로 sibling li/ol/ul가 있다면 ol/ul를 2개로 나누어야됨
				if(elDiv.nextSibling && elDiv.nextSibling.tagName && elDiv.nextSibling.tagName.match(/LI|UL|OL/)){
					var elNewParent = elParentNode.cloneNode(false);
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
				var elInsertParent = elDiv.parentNode;
				elInsertBefore = elDiv;

				// 내용물을 P로 감싸기
				var oDoc = this.oApp.getWYSIWYGDocument();
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
		var nCurMarginLeft = parseInt(elDiv.style.marginLeft);
		if(!nCurMarginLeft) nCurMarginLeft = 0;

		nCurMarginLeft -= this.nIndentSpacing;
		if(nCurMarginLeft < 0) nCurMarginLeft = 0;
		elDiv.style.marginLeft = nCurMarginLeft+"px";
	},
	
	// Fix IE's execcommand bug
	// When insertorderedlist/insertunorderedlist is executed on a blockquote, the blockquote will "suck in" directly neighboring OL, UL's if there's any.
	// To prevent this, insert empty P tags right before and after the blockquote and remove them after the execution.
	_insertBlankLine : function(){
		var oSelection = this.oApp.getSelection();
		var elNode = oSelection.commonAncestorContainer;
		this.elP1 = null;
		this.elP2 = null;

		while(elNode){
			if(elNode.tagName == "BLOCKQUOTE"){
				this.elP1 = this.oApp.getWYSIWYGDocument().createElement("P");
				elNode.parentNode.insertBefore(this.elP1, elNode);

				this.elP2 = this.oApp.getWYSIWYGDocument().createElement("P");
				elNode.parentNode.insertBefore(this.elP2, elNode.nextSibling);
				
				break;
			}
			elNode = elNode.parentNode;
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
		var aNodes = this.oApp.getWYSIWYGDocument().getElementsByTagName(sTagName);
		var elCorruptedBlockQuote;
		
		for(var i=0, nLen=aNodes.length; i<nLen; i++){
			if(aNodes[i].firstChild && aNodes[i].firstChild.tagName == sTagName){
				elCorruptedBlockQuote = aNodes[i];
				break;
			}
		}
		
		if(!elCorruptedBlockQuote){return;}

		var elTmpParent = elCorruptedBlockQuote.parentNode;

		// (1) changing outerHTML will cause loss of the reference to the node, so remember the idx position here
		var nPos = this._getPosIdx(elCorruptedBlockQuote);
		var el = this.oApp.getWYSIWYGDocument().createElement("DIV");
		el.innerHTML = elCorruptedBlockQuote.outerHTML.replace("<"+sTagName, "<BLOCKQUOTE");
		elCorruptedBlockQuote.parentNode.insertBefore(el.firstChild, elCorruptedBlockQuote);
		elCorruptedBlockQuote.parentNode.removeChild(elCorruptedBlockQuote);

		// (2) and retrieve the new node here
		var elNewNode = elTmpParent.childNodes[nPos];

		// garbage <OL></OL> or <UL></UL> will be left over after setting the outerHTML, so remove it here.
		var aLists = elNewNode.getElementsByTagName(sTagName);
		for(var i=0, nLen=aLists.length; i<nLen; i++){
			if(aLists[i].childNodes.length<1){
				aLists[i].parentNode.removeChild(aLists[i]);
			}
		}

		oSelection = this.oApp.getEmptySelection();
		oSelection.selectNodeContents(elNewNode);
		oSelection.collapseToEnd();
		oSelection.select();
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

		aChildImg = jindo.$A(oStartContainer.childNodes).filter(function(value, index, array){
			return (value.nodeType === 1 && value.tagName === "IMG");
		}).$value();
		
		aSelectedImg = jindo.$A(oSelection.getNodes()).filter(function(value, index, array){
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
