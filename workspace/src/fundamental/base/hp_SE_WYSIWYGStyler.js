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
 * @fileOverview This file contains Husky plugin that takes care of the operations related to styling the font
 * @name hp_SE_WYSIWYGStyler.js
 * @required SE_EditingArea_WYSIWYG, HuskyRangeManager
 */
nhn.husky.SE_WYSIWYGStyler = jindo.$Class({
	name : "SE_WYSIWYGStyler",
	_sCursorHolder : "\uFEFF",

	$init : function(){
		var htBrowser = jindo.$Agent().navigator();

		if(htBrowser.ie && htBrowser.version > 8){
			// [SMARTEDITORSUS-178] ZWNBSP(\uFEFF) 를 사용하면 IE9 이상의 경우 높이값을 갖지 못해 커서위치가 이상함
			// [SMARTEDITORSUS-1704] ZWSP(\u200B) 를 사용할 경우 줄바꿈이 됨 
			// 기본적으로 \uFEFF 를 사용하고 IE9 이상만 \u2060 사용 (\u2060 은 \uFEFF 와 동일한 역할을 하지만 크롬에서는 깨짐)  
			// *주의* 작성자가 IE9이상에서 작성하고 독자가 크롬에서 볼 경우 \u2060 가 깨진 문자로 보여질 수 있기 때문에 컨버터를 통해 \u2060 를 \uFEFF 로 변환한다.
			// FIXME: 단, \u2060 를 \uFEFF 변환으로 인해 SPAN태그만 들어있는 상태에서 모드를 변환하면 커서 위치가 다시 이상해질 수 있음
			// 참고:
			// http://en.wikipedia.org/wiki/Universal_Character_Set_characters#Word_joiners_and_separators
			// http://en.wikipedia.org/wiki/Zero-width_no-break_space
			// https://www.cs.tut.fi/~jkorpela/chars/spaces.html
			this._sCursorHolder = "\u2060";
			this.$ON_REGISTER_CONVERTERS = function(){
				var rx2060 = /\u2060/g;
				this.oApp.exec("ADD_CONVERTER", ["WYSIWYG_TO_IR", jindo.$Fn(function(sContents){
					return sContents.replace(rx2060, "\uFEFF");
				}, this).bind()]);
			};
		}
	},
	
	$PRECONDITION : function(/*sFullCommand, aArgs*/){
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
					
			var oSpan, bNewSpan = false;
			var elCAC = oSelection.commonAncestorContainer;
			//var elCAC = nhn.CurrentSelection.getCommonAncestorContainer();
			if(elCAC.nodeType == 3){
				elCAC = elCAC.parentNode;
			}

			// [SMARTEDITORSUS-1648] SPAN > 굵게/밑줄/기울림/취소선이 있는 경우, 상위 SPAN을 찾는다. 
			if(elCAC && oSelection._rxCursorHolder.test(elCAC.innerHTML)){
				oSpan = oSelection._findParentSingleSpan(elCAC);
			}
			// 스타일을 적용할 SPAN이 없으면 새로 생성
			if(!oSpan){
				oSpan = this.oApp.getWYSIWYGDocument().createElement("SPAN");
				oSpan.innerHTML = this._sCursorHolder;
				bNewSpan = true;
			}else if(oSpan.innerHTML == ""){	// 내용이 아예 없으면 크롬에서 커서가 위치하지 못함
				oSpan.innerHTML = this._sCursorHolder;
			}

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
			if(oStyles.color){
				oSelection._checkTextDecoration(oSpan);
			}
			
			// [SMARTEDITORSUS-1648] oSpan이 굵게//밑줄/기울임/취소선태그보다 상위인 경우, IE에서 굵게//밑줄/기울임/취소선태그 밖으로 나가게 된다. 때문에 SPAN을 새로 만든 경우 oSpan을, 그렇지 않은 경우 elCAC를 잡는다.
			oSelection.selectNodeContents(bNewSpan?oSpan:elCAC);	 
			oSelection.collapseToEnd();
			// TODO: focus 는 왜 있는 것일까? => IE에서 style 적용후 포커스가 날아가서 글작성이 안됨???
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
			// [SMARTEDITORSUS-2237] IE11 에서 엑셀을 복사붙여넣기하면 유효하지 않은 위치(tbody, tr, td 사이)에 font 태그가 삽입된다.
			// oSelection.styleRange 을 실행하면 유효하지 않은 위치의 태그들에 스타일지정용 span 이 삽입되어 테이블이 깨지게 된다.
			// 때문에 styleRange 실행전에 잘못된 노드들을 제거해준다.
			aNodes = oSelection.getNodes();
			for(var i = 0, oNode;(oNode = aNodes[i]); i++){
				nhn.husky.SE2M_Utils.removeInvalidNodeInTable(oNode);
			}

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
				var nLen=aStyleParents.length;
				for(i=0; i<nLen; i++){
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