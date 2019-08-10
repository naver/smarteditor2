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
 * @fileOverview This file contains Husky plugin with test handlers
 * @name hp_SE2M_StyleRemover.js
 */
nhn.husky.SE2M_StyleRemover = jindo.$Class({
	name: "SE2M_StyleRemover",

	$ON_MSG_APP_READY : function(){
		this.oApp.exec("REGISTER_UI_EVENT", ["styleRemover", "click", "CHOOSE_REMOVE_STYLE", []]);
	},

	$LOCAL_BEFORE_FIRST : function(){
		// The plugin may be used in view and when it is used there, EditingAreaManager plugin is not loaded.
		// So, get the document from the selection instead of EditingAreaManager.
		this.oHuskyRange = this.oApp.getEmptySelection();
		this._document = this.oHuskyRange._document;
	},
	
	$ON_CHOOSE_REMOVE_STYLE : function(/*oSelection*/){
		var bSelectedBlock = false;
		var htSelectedTDs = {};
		this.oApp.exec("IS_SELECTED_TD_BLOCK",['bIsSelectedTd',htSelectedTDs]);
		bSelectedBlock = htSelectedTDs.bIsSelectedTd;

		this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["REMOVE STYLE", {bMustBlockElement:true}]);
		
		if( bSelectedBlock ){
			this.oApp.exec("REMOVE_STYLE_IN_BLOCK", []);
		}else{
			this.oApp.exec("REMOVE_STYLE", []);
		}
		
		this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["REMOVE STYLE", {bMustBlockElement:true}]);
		
		this.oApp.exec('MSG_NOTIFY_CLICKCR', ['noeffect']);
	},
	
	$ON_REMOVE_STYLE_IN_BLOCK : function(/*oSelection*/){
		var htSelectedTDs = {};
		this.oSelection = this.oApp.getSelection();
		this.oApp.exec("GET_SELECTED_TD_BLOCK",['aTdCells',htSelectedTDs]);
		var aNodes = htSelectedTDs.aTdCells;
		
		for( var j = 0; j < aNodes.length ; j++){
			this.oSelection.selectNodeContents(aNodes[j]);
			this.oSelection.select();
			this.oApp.exec("REMOVE_STYLE", []);
		}
	},
	
	$ON_REMOVE_STYLE : function(oSelection){
		if(!oSelection || !oSelection.commonAncestorContainer){
			oSelection = this.oApp.getSelection();
		}

		if(oSelection.collapsed){return;}

		oSelection.expandBothEnds();

		var sBookmarkID = oSelection.placeStringBookmark();
		var aNodes = oSelection.getNodes(true);

		this._removeStyle(aNodes);
		oSelection.moveToBookmark(sBookmarkID);

		aNodes = oSelection.getNodes(true);
		for(var i=0; i<aNodes.length; i++){
			var oNode = aNodes[i];
			
			if(oNode.style && oNode.tagName != "BR" && oNode.tagName != "TD" && oNode.tagName != "TR" && oNode.tagName != "TBODY" && oNode.tagName != "TABLE"){
				oNode.removeAttribute("align");
				oNode.removeAttribute("style");
				if((jindo.$Element(oNode).css("display") == "inline" && oNode.tagName != "IMG" && oNode.tagName != "IFRAME") && (!oNode.firstChild || oSelection._isBlankTextNode(oNode.firstChild))){
					oNode.parentNode.removeChild(oNode);
				}
			}
		}
		
		oSelection.moveToBookmark(sBookmarkID);
		
		// [SMARTEDITORSUS-1750] 스타일제거를 위해 selection을 확장(oSelection.expandBothEnds)하면 TR까지 확장되는데 IE10에서만 execCommand 가 제대로 동작하지 않는 문제가 발생하기 때문에 확장전 selection으로 복원하도록 수정
		// [SMARTEDITORSUS-1893] 테이블밖에서는 마지막라인이 풀리는 이슈가 발생하여 commonAncestorContainer가 TBODY 인 경우에만 selection을 복원하도록 제한 
		if(oSelection.commonAncestorContainer.tagName === "TBODY"){
			oSelection = this.oApp.getSelection();
		}
		oSelection.select();
		
		// use a custom removeStringBookmark here as the string bookmark could've been cloned and there are some additional cases that need to be considered

		var oMarker, oParent, oNextParent;
		// remove start marker
		oMarker = this._document.getElementById(oSelection.HUSKY_BOOMARK_START_ID_PREFIX+sBookmarkID);
		while(oMarker){
			oParent = nhn.DOMFix.parentNode(oMarker);
			oParent.removeChild(oMarker);
			while(oParent && (!oParent.firstChild || (!oParent.firstChild.nextSibling && oSelection._isBlankTextNode(oParent.firstChild)))){
				oNextParent = oParent.parentNode;
				oParent.parentNode.removeChild(oParent);
				oParent = oNextParent;
			}
			oMarker = this._document.getElementById(oSelection.HUSKY_BOOMARK_START_ID_PREFIX+sBookmarkID);
		}

		// remove end marker
		oMarker = this._document.getElementById(oSelection.HUSKY_BOOMARK_END_ID_PREFIX+sBookmarkID);
		while(oMarker){
			oParent = nhn.DOMFix.parentNode(oMarker);
			oParent.removeChild(oMarker);
			while(oParent && (!oParent.firstChild || (!oParent.firstChild.nextSibling && oSelection._isBlankTextNode(oParent.firstChild)))){
				oNextParent = oParent.parentNode;
				oParent.parentNode.removeChild(oParent);
				oParent = oNextParent;
			}
			oMarker = this._document.getElementById(oSelection.HUSKY_BOOMARK_END_ID_PREFIX+sBookmarkID);
		}

		this.oApp.exec("CHECK_STYLE_CHANGE");
	},
	
	$ON_REMOVE_STYLE2 : function(aNodes){
		this._removeStyle(aNodes);
	},
	
	$ON_REMOVE_STYLE_AND_PASTE_HTML : function(sHtml, bNoUndo){
		var htBrowser,
			elDivHolder,
			elFirstTD,
			aNodesInSelection,
			oSelection; 
		
		htBrowser = jindo.$Agent().navigator();
		
		if(!sHtml) {return false;}
		if(this.oApp.getEditingMode() != "WYSIWYG"){
			this.oApp.exec("CHANGE_EDITING_MODE", ["WYSIWYG"]);
		}
		
		if(!bNoUndo){
			this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["REMOVE STYLE AND PASTE HTML"]);
		}
		
		oSelection = this.oApp.getSelection();
		oSelection.deleteContents(); // remove select node - for dummy image, reedit object
		
		// If the table were inserted within a styled(strikethough & etc) paragraph, the table may inherit the style in IE.
		elDivHolder = this.oApp.getWYSIWYGDocument().createElement("DIV");
		oSelection.insertNode(elDivHolder);
		
		if (htBrowser.webkit) {
			elDivHolder.innerHTML = "&nbsp;"; // for browser bug! - summary reiteration
		}
		
		oSelection.selectNode(elDivHolder);
		this.oApp.exec("REMOVE_STYLE", [oSelection]);

		//[SMARTEDITORSUS-181][IE9] 표나 요약글 등의 테이블에서 > 테이블 외부로 커서 이동 불가
		if( htBrowser.ie ){
			sHtml += "<p>&nbsp;</p>";
		}else if(htBrowser.firefox){
			//[SMARTEDITORSUS-477][개별블로그](파폭특정)포스트쓰기>요약글을 삽입 후 요약글 아래 임의의 본문영역에 마우스 클릭 시 커서가 요약안에 노출됩니다. 
			// 본문에 table만 있는 경우, 커서가 밖으로 못나오는 현상이 있음.FF버그임.
			sHtml += "<p>﻿<br></p>";
		}
		
		oSelection.selectNode(elDivHolder);
		oSelection.pasteHTML(sHtml);
		
		//Table인경우, 커서를 테이블 첫 TD에 넣기 위한 작업.
		aNodesInSelection = oSelection.getNodes() || [];
		for(var i = 0; i < aNodesInSelection.length ; i++){
			if(!!aNodesInSelection[i].tagName && aNodesInSelection[i].tagName.toLowerCase() == 'td'){
				elFirstTD = aNodesInSelection[i];
				oSelection.selectNodeContents(elFirstTD.firstChild || elFirstTD);
				oSelection.collapseToStart();
				oSelection.select();
				break;
			}
		}
		
		oSelection.collapseToEnd(); //파란색 커버 제거.
		oSelection.select();
		this.oApp.exec("FOCUS");
		if (!elDivHolder) {// 임시 div 삭제.
			elDivHolder.parentNode.removeChild(elDivHolder);
		}
		
		if(!bNoUndo){
			this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["REMOVE STYLE AND PASTE HTML"]);
		}
	},
	
	_removeStyle : function(aNodes){
		var arNodes = jindo.$A(aNodes);
		for(var i=0; i<aNodes.length; i++){
			var oNode = aNodes[i];

			// oNode had been removed from the document already
			if(!oNode || !oNode.parentNode || !oNode.parentNode.tagName){continue;}
			
			var bDontSplit = false;
			// If oNode is direct child of a block level node, don't do anything. (should not move up the hierarchy anymore)
			if(jindo.$Element(oNode.parentNode).css("display") != "inline"){
				continue;
			}

			var parent = oNode.parentNode;

			// do not proceed if oNode is not completely selected
			if(oNode.firstChild){
				if(arNodes.indexOf(this.oHuskyRange._getVeryLastRealChild(oNode)) == -1){continue;}
				if(arNodes.indexOf(this.oHuskyRange._getVeryFirstRealChild(oNode)) == -1){continue;}
			}

			// Case 1: oNode is the right most node
			//
			// If oNode were C(right most node) from 
			//   H
			//   |
			//   P
			// / | \
			// A B C
			//
			// and B and C were selected, bring up all the (selected) left siblings to the right of the parent and and make it
			//   H
			// / | \
			// P B C
			// |
			// A
			// ===========================================================
			// If A, B and C were selected from 
			//   H
			//   |
			//   P
			// / | \
			// A B C
			//
			// append them to the right of the parent and make it
			//    H
			// / | | \
			// P A B C
			//
			// and then remove P as it's got no child and make it
			//   H
			// / | \
			// A B C
			if(!oNode.nextSibling){
				i--;
				var tmp = oNode;
				// bring up left siblings
				while(tmp){
					var prevNode = tmp.previousSibling;
					parent.parentNode.insertBefore(tmp, parent.nextSibling);
					if(!prevNode){break;}
					if(arNodes.indexOf(this._getVeryFirst(prevNode)) == -1){break;}
					tmp = prevNode;
				}

				// remove the parent if it's got no child now
				if(parent.childNodes.length === 0){parent.parentNode.removeChild(parent);}

				continue;
			}
			
			// Case 2: oNode's got a right sibling that is included in the selection
			//
			// if the next sibling is included in the selection, stop current iteration
			// -> current node will be handled in the next iteration
			if(arNodes.indexOf(this._getVeryLast(oNode.nextSibling)) != -1){continue;}

			// Since the case
			// 1. oNode is the right most node
			// 2. oNode's got a right sibling that is included in the selection
			// were all taken care of above, so from here we just need take care of the case when oNode is NOT the right most node and oNode's right sibling is NOT included in the selection

			// Case 3: the rest
			// When all of the left siblings were selected, take all the left siblings and current node and append them to the left of the parent node.
			//    H
			//    |
			//    P
			// / | | \
			// A B C D
			// -> if A, B and C were selected, then make it
			//    H
			// / | | \
			// A B C P
			//         |
			//         D
			i--;
			// bring up selected prev siblings
			if(arNodes.indexOf(this._getVeryFirst(oNode.parentNode)) != -1){
				// move
				tmp = oNode;
				var lastInserted = parent;
				while(tmp){
					prevNode = tmp.previousSibling;
					parent.parentNode.insertBefore(tmp, lastInserted);
					lastInserted = tmp;
					
					if(!prevNode){break;}
					tmp = prevNode;
				}
				if(parent.childNodes.length === 0){parent.parentNode.removeChild(parent);}
			// When NOT all of the left siblings were selected, split the parent node and insert the selected nodes in between.
			//    H
			//    |
			//    P
			// / | | \
			// A B C D
			// -> if B and C were selected, then make it
			//    H
			// / | | \
			// P B C P
			// |      |
			// A      D
			}else{
				//split
				if(bDontSplit){
					i++;
					continue;
				}
				
				var oContainer = this._document.createElement("SPAN");
				tmp = oNode;
				parent.insertBefore(oContainer, tmp.nextSibling);
				while(tmp){
					prevNode = tmp.previousSibling;
					oContainer.insertBefore(tmp, oContainer.firstChild);

					if(!prevNode){break;}
					if(arNodes.indexOf(this._getVeryFirst(prevNode)) == -1){break;}
					tmp = prevNode;
				}
				
				this._splitAndAppendAtTop(oContainer);
				while(oContainer.firstChild){
					oContainer.parentNode.insertBefore(oContainer.firstChild, oContainer);
				}
				oContainer.parentNode.removeChild(oContainer);
			}
		}
	},

	_splitAndAppendAtTop : function(oSpliter){
		var targetNode = oSpliter;
		var oTmp = targetNode;
		var oCopy = oTmp;

		while(jindo.$Element(oTmp.parentNode).css("display") == "inline"){
			var oNode = oTmp.parentNode.cloneNode(false);

			while(oTmp.nextSibling){
				oNode.appendChild(oTmp.nextSibling);
			}

			oTmp = oTmp.parentNode;

			oNode.insertBefore(oCopy, oNode.firstChild);
			oCopy = oNode;
		}

		var oTop = oTmp.parentNode;
		oTop.insertBefore(targetNode, oTmp.nextSibling);
		oTop.insertBefore(oCopy, targetNode.nextSibling);
	},
	
	_getVeryFirst : function(oNode){
		if(!oNode){return null;}

		if(oNode.firstChild){
			return this.oHuskyRange._getVeryFirstRealChild(oNode);
		}else{
			return oNode;
		}
	},
	
	_getVeryLast : function(oNode){
		if(!oNode){return null;}
	
		if(oNode.lastChild){
			return this.oHuskyRange._getVeryLastRealChild(oNode);
		}else{
			return oNode;
		}
	}
});
//}
