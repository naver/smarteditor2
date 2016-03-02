//{
/**
 * @fileOverview This file contains Husky plugin that takes care of the operations related to styling the font
 * @name hp_SE_WYSIWYGStyler.js
 * @required SE_EditingArea_WYSIWYG, HuskyRangeManager
 */
nhn.husky.SE_WYSIWYGStyler = jindo.$Class({
	name : "SE_WYSIWYGStyler",
	sBlankText : unescape("%uFEFF"),

	$init : function(){
		var htBrowser = jindo.$Agent().navigator();
		
		if(!htBrowser.ie || htBrowser.nativeVersion < 9 || document.documentMode < 9){
			this._addCursorHolder = function(){};
		}
	},
	
	_addCursorHolder : function(oSelection, oSpan){
		var oBody = this.oApp.getWYSIWYGDocument().body,
			oAncestor,
			welSpan = jindo.$Element(oSpan),
			sHtml,
			tmpTextNode;
		
		sHtml = oBody.innerHTML;
		oAncestor = oBody;
		
		if(sHtml === welSpan.outerHTML()){
			tmpTextNode = oSelection._document.createTextNode(unescape("%uFEFF"));
			oAncestor.appendChild(tmpTextNode);
			
			return;
		}
		
		oAncestor = nhn.husky.SE2M_Utils.findAncestorByTagName("P", oSpan);

		if(!oAncestor){
			return;
		}

		sHtml = oAncestor.innerHTML;
		
		if(sHtml.indexOf("&nbsp;") > -1){
			return;
		}

		tmpTextNode = oSelection._document.createTextNode(unescape("%u00A0"));
		oAncestor.appendChild(tmpTextNode);
	},
	
	$PRECONDITION : function(sFullCommand, aArgs){
		return (this.oApp.getEditingMode() == "WYSIWYG");
	},
	$ON_SET_WYSIWYG_STYLE : function(oStyles){
		var oSelection = this.oApp.getSelection();
		var htSelectedTDs = {};
		this.oApp.exec("IS_SELECTED_TD_BLOCK",['bIsSelectedTd',htSelectedTDs]);
		var bSelectedBlock = htSelectedTDs.bIsSelectedTd;
		
		// style cursor or !(selected block) 
		if(oSelection.collapsed && !bSelectedBlock){
			this.oApp.exec("RECORD_UNDO_ACTION", ["FONT STYLE", {bMustBlockElement : true}]);
					
			var oSpan, bNewSpan;
			var elCAC = oSelection.commonAncestorContainer;
			//var elCAC = nhn.CurrentSelection.getCommonAncestorContainer();
			if(elCAC.nodeType == 3){
				elCAC = elCAC.parentNode;
			}
			
			if(elCAC && elCAC.tagName == "SPAN" && (elCAC.innerHTML == "" || elCAC.innerHTML == this.sBlankText || elCAC.innerHTML == "&nbsp;")){
				bNewSpan = false;
				oSpan = elCAC;
			}else{
				bNewSpan = true;
				oSpan = this.oApp.getWYSIWYGDocument().createElement("SPAN");
			}
			oSpan.innerHTML = this.sBlankText;

			var sValue;
			for(var sName in oStyles){
				sValue = oStyles[sName];

				if(typeof sValue != "string"){
					continue;
				}

				oSpan.style[sName] = sValue;
			}

			if(bNewSpan){
				if(oSelection.startContainer.tagName == "BODY" && oSelection.startOffset === 0){
					var oVeryFirstNode = oSelection._getVeryFirstRealChild(this.oApp.getWYSIWYGDocument().body);
				
					var bAppendable = true;
					var elTmp = oVeryFirstNode.cloneNode(false);
					// some browsers may throw an exception for trying to set the innerHTML of BR/IMG tags
					try{
						elTmp.innerHTML = "test";
						
						if(elTmp.innerHTML != "test"){
							bAppendable = false;
						}
					}catch(e){
						bAppendable = false;
					}
					
					if(bAppendable && elTmp.nodeType == 1 && elTmp.tagName == "BR"){// [SMARTEDITORSUS-311] [FF4] Cursor Holder 인 BR 의 하위노드로 SPAN 을 추가하여 발생하는 문제
						oSelection.selectNode(oVeryFirstNode);
						oSelection.collapseToStart();
						oSelection.insertNode(oSpan);
					}else if(bAppendable && oVeryFirstNode.tagName != "IFRAME" && oVeryFirstNode.appendChild && typeof oVeryFirstNode.innerHTML == "string"){
						oVeryFirstNode.appendChild(oSpan);
					}else{
						oSelection.selectNode(oVeryFirstNode);
						oSelection.collapseToStart();
						oSelection.insertNode(oSpan);
					}
				}else{
					oSelection.collapseToStart();
					oSelection.insertNode(oSpan);
				}
			}else{
				oSelection = this.oApp.getEmptySelection();
			}

			// [SMARTEDITORSUS-229] 새로 생성되는 SPAN 에도 취소선/밑줄 처리 추가
			if(!!oStyles.color){
				oSelection._checkTextDecoration(oSpan);
			}
			
			this._addCursorHolder(oSelection, oSpan);	// [SMARTEDITORSUS-178] [IE9] 커서가 위로 올라가는 문제
			
			oSelection.selectNodeContents(oSpan);
			oSelection.collapseToEnd();
			oSelection._window.focus();
			oSelection._window.document.body.focus();
			oSelection.select();
			
			// 영역으로 스타일이 잡혀 있는 경우(예:현재 커서가 B블럭 안에 존재) 해당 영역이 사라져 버리는 오류 발생해서 제거
			// http://bts.nhncorp.com/nhnbts/browse/COM-912
/*
			var oCursorStyle = this.oApp.getCurrentStyle();
			if(oCursorStyle.bold == "@^"){
				this.oApp.delayedExec("EXECCOMMAND", ["bold"], 0);
			}
			if(oCursorStyle.underline == "@^"){
				this.oApp.delayedExec("EXECCOMMAND", ["underline"], 0);
			}
			if(oCursorStyle.italic == "@^"){
				this.oApp.delayedExec("EXECCOMMAND", ["italic"], 0);
			}
			if(oCursorStyle.lineThrough == "@^"){
				this.oApp.delayedExec("EXECCOMMAND", ["strikethrough"], 0);
			}
*/
			// FF3 will actually display %uFEFF when it is followed by a number AND certain font-family is used(like Gulim), so remove the character for FF3
			//if(jindo.$Agent().navigator().firefox && jindo.$Agent().navigator().version == 3){
			// FF4+ may have similar problems, so ignore the version number
			// [SMARTEDITORSUS-416] 커서가 올라가지 않도록 BR 을 살려둠
			// if(jindo.$Agent().navigator().firefox){
				// oSpan.innerHTML = "";
			// }
			return;
		}

		this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["FONT STYLE", {bMustBlockElement:true}]);
		
		if(bSelectedBlock){
			var aNodes;
			
			this.oApp.exec("GET_SELECTED_TD_BLOCK",['aTdCells',htSelectedTDs]);
			aNodes = htSelectedTDs.aTdCells;
			
			for( var j = 0; j < aNodes.length ; j++){
				oSelection.selectNodeContents(aNodes[j]);
				oSelection.styleRange(oStyles);
				oSelection.select();
			}
		} else {
			var bCheckTextDecoration = !!oStyles.color;	// [SMARTEDITORSUS-26] 취소선/밑줄 색상 적용 처리
			var bIncludeLI = oStyles.fontSize || oStyles.fontFamily;
			oSelection.styleRange(oStyles, null, null, bIncludeLI, bCheckTextDecoration);
			
			// http://bts.nhncorp.com/nhnbts/browse/COM-964
			//
			// In FF when,
			// 1) Some text was wrapped with a styling SPAN and a bogus BR is followed
			// 	eg: <span style="XXX">TEST</span><br>
			// 2) And some place outside the span is clicked.
			//
			// The text cursor will be located outside the SPAN like the following,
			// <span style="XXX">TEST</span>[CURSOR]<br>
			//
			// which is not what the user would expect
			// Desired result: <span style="XXX">TEST[CURSOR]</span><br>
			//
			// To make the cursor go inside the styling SPAN, remove the bogus BR when the styling SPAN is created.
			// 	-> Style TEST<br> as <span style="XXX">TEST</span> (remove unnecessary BR)
			// 	-> Cannot monitor clicks/cursor position real-time so make the contents error-proof instead.
			if(jindo.$Agent().navigator().firefox){
				var aStyleParents = oSelection.aStyleParents;
				for(var i=0, nLen=aStyleParents.length; i<nLen; i++){
					var elNode = aStyleParents[i];
					if(elNode.nextSibling && elNode.nextSibling.tagName == "BR" && !elNode.nextSibling.nextSibling){
						elNode.parentNode.removeChild(elNode.nextSibling);
					}
				}
			}
			
			oSelection._window.focus();
			oSelection.select();
		}
		
		this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["FONT STYLE", {bMustBlockElement:true}]);
	}
});
//}
