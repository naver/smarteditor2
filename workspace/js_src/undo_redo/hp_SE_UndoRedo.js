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
/*[
 * UNDO
 *
 * UNDO 히스토리에 저장되어 있는 이전 IR을 복구한다.
 *
 * none
 *
---------------------------------------------------------------------------]*/
/*[
 * REDO
 *
 * UNDO 히스토리에 저장되어 있는 다음 IR을 복구한다.
 *
 * none
 *
---------------------------------------------------------------------------]*/
/*[
 * RECORD_UNDO_ACTION
 *
 * 현재 IR을 UNDO 히스토리에 추가한다.
 *
 * sAction string 실행 할 액션(어떤 이유로 IR에 변경이 있었는지 참고용)
 * oSaveOption object 저장 옵션(htRecordOption 참고)	
 *
---------------------------------------------------------------------------]*/
/*[
 * RECORD_UNDO_BEFORE_ACTION
 *
 * 현재 IR을 UNDO 히스토리에 추가한다. 액션 전후 따로 저장 할 경우 전 단계.
 *
 * sAction string 실행 할 액션(어떤 이유로 IR에 변경이 있었는지 참고용)
 * oSaveOption object 저장 옵션(htRecordOption 참고)	
 *
---------------------------------------------------------------------------]*/
/*[
 * RECORD_UNDO_AFTER_ACTION
 *
 * 현재 IR을 UNDO 히스토리에 추가한다. 액션 전후 따로 저장 할 경우 후 단계.
 *
 * sAction string 실행 할 액션(어떤 이유로 IR에 변경이 있었는지 참고용)
 * oSaveOption object 저장 옵션(htRecordOption 참고)	
 *
---------------------------------------------------------------------------]*/
/*[
 * RESTORE_UNDO_HISTORY
 *
 * UNDO 히스토리에 저장되어 있는 IR을 복구한다.
 *
 * nUndoIdx number 몇번째 히스토리를 복구할지
 * nUndoStateStep number 히스토리 내에 몇번째 스텝을 복구 할지. (before:0, after:1)
 *
---------------------------------------------------------------------------]*/
/*[
 * DO_RECORD_UNDO_HISTORY
 *
 * 현재 IR을 UNDO 히스토리에 추가한다.
 *
 * sAction string 실행 할 액션(어떤 이유로 IR에 변경이 있었는지 참고용)
 * htRecordOption object 저장 옵션	
 * 		nStep (number) 0 | 1					액션의 스텝 인덱스 (보통 1단계이나 Selection 의 저장이 필요한 경우 1, 2단계로 나누어짐)
 * 		bSkipIfEqual (bool) false | true		변경이 없다면 히스토리에 추가하지 않음 (현재 길이로 판단하여 저장함)
 * 		bTwoStepAction (bool) false | true		2단계 액션인 경우
 * 		sSaveTarget (string) [TAG] | null		저장 타겟을 지정하는 경우 사용 (해당 태그를 포함하여 저장)
 * 		elSaveTarget : [Element] | null			저장 타겟을 지정하는 경우 사용 (해당 엘리먼트의 innerHTML을 저장)
 * 		bDontSaveSelection : false | true		Selection을 추가하지 않는 경우 (예, 표 편집)
 * 		bMustBlockElement : false | true		반드시 Block 엘리먼트에 대해서만 저장함, 없으면 BODY 영역 (예, 글자 스타일 편집)
 *  	bMustBlockContainer : false | true		반드시 Block 엘리먼트(그 중 컨테이너로 사용되는)에 대해서만 저장함, 없으면 BODY 영역 (예, 엔터)
 * 		oUndoCallback : null | [Object]			Undo 처리할 때 호출해야할 콜백 메시지 정보
 * 		oRedoCallback : null | [Object]			Redo 처리할 때 호출해야할 콜백 메시지 정보
 *
---------------------------------------------------------------------------]*/
/*[
 * DO_RECORD_UNDO_HISTORY_AT
 *
 * 현재 IR을 UNDO 히스토리의 지정된 위치에 추가한다.
 *
 * oInsertionIdx object 삽입할 위치({nIdx:히스토리 번호, nStep: 히스토리 내에 액션 번호})
 * sAction string 실행 할 액션(어떤 이유로 IR에 변경이 있었는지 참고용)
 * sContent string 저장할 내용
 * oBookmark object oSelection.getXPathBookmark()를 통해 얻어진 북마크
 *
---------------------------------------------------------------------------]*/
/**
 * @pluginDesc Husky Framework에서 자주 사용되는 메시지를 처리하는 플러그인
 * @fileOverview This file contains Husky plugin that takes care of the operations related to Undo/Redo
 * @name hp_SE_UndoRedo.js
 * @required SE_EditingAreaManager, HuskyRangeManager
 */
nhn.husky.SE_UndoRedo = jindo.$Class({
	name : "SE_UndoRedo",
	
	oCurStateIdx : null,
	iMinimumSizeChange : 1,
	
	// limit = nMaxUndoCount + nAfterMaxDeleteBuffer. When the limit is reached delete [0...nAfterMaxDeleteBuffer] so only nMaxUndoCount histories will be left
	nMaxUndoCount : 20,	// 1000
	nAfterMaxDeleteBuffer : 100,
	
	sBlankContentsForFF : "<br>",
	sDefaultXPath : "/HTML[0]/BODY[0]",

	$init : function(){
		this.aUndoHistory = [];
		this.oCurStateIdx = {nIdx: 0, nStep: 0};
		this.nHardLimit = this.nMaxUndoCount + this.nAfterMaxDeleteBuffer;
	},

	$LOCAL_BEFORE_ALL : function(sCmd){
		if(sCmd.match(/_DO_RECORD_UNDO_HISTORY_AT$/)){
			return true;
		}

		try{
			if(this.oApp.getEditingMode() != "WYSIWYG"){
				return false;
			}
		}catch(e){
			return false;
		}
		
		return true;
	},
	
	$BEFORE_MSG_APP_READY : function(){
		this._historyLength = 0;
		this.oApp.exec("ADD_APP_PROPERTY", ["getUndoHistory", jindo.$Fn(this._getUndoHistory, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getUndoStateIdx", jindo.$Fn(this._getUndoStateIdx, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["saveSnapShot", jindo.$Fn(this._saveSnapShot, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getLastKey", jindo.$Fn(this._getLastKey, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["setLastKey", jindo.$Fn(this._setLastKey, this).bind()]);

		this._saveSnapShot();
		
		this.oApp.exec("DO_RECORD_UNDO_HISTORY_AT", [this.oCurStateIdx, "", "", "", null, this.sDefaultXPath]);			
	},
	
	_getLastKey : function(){
		return this.sLastKey;
	},

	_setLastKey : function(sLastKey){
		this.sLastKey = sLastKey;
	},
	
	$ON_MSG_APP_READY : function(){
		var oNavigator = jindo.$Agent().navigator();
		this.bIE = oNavigator.ie;
		this.bFF = oNavigator.firefox;
		//this.bChrome = oNavigator.chrome;
		//this.bSafari = oNavigator.safari;

		this.oApp.exec("REGISTER_UI_EVENT", ["undo", "click", "UNDO"]);
		this.oApp.exec("REGISTER_UI_EVENT", ["redo", "click", "REDO"]);

		// [SMARTEDITORSUS-2260] 메일 > Mac에서 ctrl 조합 단축키 모두 meta 조합으로 변경
		if (jindo.$Agent().os().mac) {
			this.oApp.exec("REGISTER_HOTKEY", ["meta+z", "UNDO"]);
			this.oApp.exec("REGISTER_HOTKEY", ["meta+y", "REDO"]);
		} else {
			this.oApp.exec("REGISTER_HOTKEY", ["ctrl+z", "UNDO"]);
			this.oApp.exec("REGISTER_HOTKEY", ["ctrl+y", "REDO"]);
		}
		
		// this.htOptions =  this.oApp.htOptions["SE_UndoRedo"] || {};
	},
	
	$ON_UNDO : function(){
		this._doRecordUndoHistory("UNDO", { nStep : 0, bSkipIfEqual : true, bMustBlockContainer : true });
				
		if(this.oCurStateIdx.nIdx <= 0){
			return;
		}
		
		// 현재의 상태에서 Undo 했을 때 처리해야 할 메시지 호출
		var oUndoCallback = this.aUndoHistory[this.oCurStateIdx.nIdx].oUndoCallback[this.oCurStateIdx.nStep];
		var sCurrentPath = this.aUndoHistory[this.oCurStateIdx.nIdx].sParentXPath[this.oCurStateIdx.nStep];
		
		if(oUndoCallback){
			this.oApp.exec(oUndoCallback.sMsg, oUndoCallback.aParams);
		}

		if(this.oCurStateIdx.nStep > 0){
			this.oCurStateIdx.nStep--;
		}else{
			var oTmpHistory = this.aUndoHistory[this.oCurStateIdx.nIdx];

			this.oCurStateIdx.nIdx--;

			if(oTmpHistory.nTotalSteps>1){
				this.oCurStateIdx.nStep = 0;
			}else{
				oTmpHistory = this.aUndoHistory[this.oCurStateIdx.nIdx];
				this.oCurStateIdx.nStep = oTmpHistory.nTotalSteps-1;
			}
		}
		
		var sUndoHistoryPath = this.aUndoHistory[this.oCurStateIdx.nIdx].sParentXPath[this.oCurStateIdx.nStep];
		var bUseDefault = false;
		
		if(sUndoHistoryPath !== sCurrentPath && sUndoHistoryPath.indexOf(sCurrentPath) === 0){	// 현재의 Path가 Undo의 Path보다 범위가 큰 경우
			bUseDefault = true;
		}

		this.oApp.exec("RESTORE_UNDO_HISTORY", [this.oCurStateIdx.nIdx, this.oCurStateIdx.nStep, bUseDefault]);
		this.oApp.exec("CHECK_STYLE_CHANGE", []);
		
		this.sLastKey = null;
	},


	$ON_REDO : function(){
		if(this.oCurStateIdx.nIdx >= this.aUndoHistory.length){
			return;
		}

		var oCurHistory = this.aUndoHistory[this.oCurStateIdx.nIdx];
		
		if(this.oCurStateIdx.nIdx == this.aUndoHistory.length-1 && this.oCurStateIdx.nStep >= oCurHistory.nTotalSteps-1){
			return;
		}
		
		if(this.oCurStateIdx.nStep < oCurHistory.nTotalSteps-1){
			this.oCurStateIdx.nStep++;
		}else{
			this.oCurStateIdx.nIdx++;
			oCurHistory = this.aUndoHistory[this.oCurStateIdx.nIdx];
			this.oCurStateIdx.nStep = oCurHistory.nTotalSteps-1;
		}

		// 원복될 상태에서 Redo 했을 때 처리해야 할 메시지 호출
		var oRedoCallback = this.aUndoHistory[this.oCurStateIdx.nIdx].oRedoCallback[this.oCurStateIdx.nStep];
		
		if(oRedoCallback){
			this.oApp.exec(oRedoCallback.sMsg, oRedoCallback.aParams);
		}

		this.oApp.exec("RESTORE_UNDO_HISTORY", [this.oCurStateIdx.nIdx, this.oCurStateIdx.nStep]);
		this.oApp.exec("CHECK_STYLE_CHANGE", []);
		
		this.sLastKey = null;
	},

	$ON_RECORD_UNDO_ACTION : function(sAction, oSaveOption){
		oSaveOption = oSaveOption || { sSaveTarget : null, elSaveTarget : null, bMustBlockElement : false, bMustBlockContainer : false, bDontSaveSelection : false };
		oSaveOption.nStep = 0;
		oSaveOption.bSkipIfEqual = false;
		oSaveOption.bTwoStepAction = false;
		
		this._doRecordUndoHistory(sAction, oSaveOption);
	},

	$ON_RECORD_UNDO_BEFORE_ACTION : function(sAction, oSaveOption){
		oSaveOption = oSaveOption || { sSaveTarget : null, elSaveTarget : null, bMustBlockElement : false, bMustBlockContainer : false, bDontSaveSelection : false };
		oSaveOption.nStep = 0;
		oSaveOption.bSkipIfEqual = false;
		oSaveOption.bTwoStepAction = true;
		
		this._doRecordUndoHistory(sAction, oSaveOption);
	},

	$ON_RECORD_UNDO_AFTER_ACTION : function(sAction, oSaveOption){
		oSaveOption = oSaveOption || { sSaveTarget : null, elSaveTarget : null, bMustBlockElement : false, bMustBlockContainer : false, bDontSaveSelection : false };
		oSaveOption.nStep = 1;
		oSaveOption.bSkipIfEqual = false;
		oSaveOption.bTwoStepAction = true;
		
		this._doRecordUndoHistory(sAction, oSaveOption);
	},

	$ON_RESTORE_UNDO_HISTORY : function(nUndoIdx, nUndoStateStep, bUseDefault){
		this.oApp.exec("HIDE_ACTIVE_LAYER");

		this.oCurStateIdx.nIdx = nUndoIdx;
		this.oCurStateIdx.nStep = nUndoStateStep;

		var oCurHistory = this.aUndoHistory[this.oCurStateIdx.nIdx],
			sContent = oCurHistory.sContent[this.oCurStateIdx.nStep],
			sFullContents = oCurHistory.sFullContents[this.oCurStateIdx.nStep],
			oBookmark = oCurHistory.oBookmark[this.oCurStateIdx.nStep],
			sParentXPath = oCurHistory.sParentXPath[this.oCurStateIdx.nStep],
			oParent = null,
			sCurContent = "",
			oSelection = this.oApp.getEmptySelection();
		
		this.oApp.exec("RESTORE_IE_SELECTION");	// this is done to null the ie selection
		
		if(bUseDefault){
			this.oApp.getWYSIWYGDocument().body.innerHTML = sFullContents;
			sFullContents = this.oApp.getWYSIWYGDocument().body.innerHTML;
			sCurContent = sFullContents;
			sParentXPath = this.sDefaultXPath;
		}else{
			oParent = oSelection._evaluateXPath(sParentXPath, oSelection._document);
			try{
				oParent.innerHTML = sContent;
				sCurContent = oParent.innerHTML;
			}catch(e){	// Path 노드를 찾지 못하는 경우
				this.oApp.getWYSIWYGDocument().body.innerHTML = sFullContents;
				sFullContents = this.oApp.getWYSIWYGDocument().body.innerHTML;	// setting the innerHTML may change the internal DOM structure, so save the value again.
				sCurContent = sFullContents;
				sParentXPath = this.sDefaultXPath;
			}
		}

		if(this.bFF && sCurContent == this.sBlankContentsForFF){
			sCurContent = "";
		}
		
		oCurHistory.sFullContents[this.oCurStateIdx.nStep] = sFullContents;
		oCurHistory.sContent[this.oCurStateIdx.nStep] = sCurContent;
		oCurHistory.sParentXPath[this.oCurStateIdx.nStep] = sParentXPath;

		if(oBookmark && oBookmark.sType == "scroll"){
			setTimeout(jindo.$Fn(function(){this.oApp.getWYSIWYGDocument().documentElement.scrollTop = oBookmark.nScrollTop;}, this).bind(), 0);
		}else{
			oSelection = this.oApp.getEmptySelection();
			if(oSelection.selectionLoaded){
				if(oBookmark){
					oSelection.moveToXPathBookmark(oBookmark);
				}else{
					oSelection = this.oApp.getEmptySelection();
				}
				
				oSelection.select();
			}
		}
	},
	
	_doRecordUndoHistory : function(sAction, htRecordOption){
		/*
			htRecordOption = {
				nStep : 0 | 1,
				bSkipIfEqual : false | true,
				bTwoStepAction : false | true,
				sSaveTarget : [TAG] | null
				elSaveTarget : [Element] | null
				bDontSaveSelection : false | true
				bMustBlockElement : false | true
				bMustBlockContainer : false | true
			};
		 */
		
		htRecordOption = htRecordOption || {};
		
		var nStep = htRecordOption.nStep || 0,
			bSkipIfEqual = htRecordOption.bSkipIfEqual || false,
			bTwoStepAction = htRecordOption.bTwoStepAction || false,
			sSaveTarget = htRecordOption.sSaveTarget || null,
			elSaveTarget = htRecordOption.elSaveTarget || null,
			bDontSaveSelection = htRecordOption.bDontSaveSelection || false,
			bMustBlockElement = htRecordOption.bMustBlockElement || false,
			bMustBlockContainer = htRecordOption.bMustBlockContainer || false,
			oUndoCallback = htRecordOption.oUndoCallback,
			oRedoCallback = htRecordOption.oRedoCallback;
		
		// if we're in the middle of some action history,
		// remove everything after current idx if any "little" change is made
		this._historyLength = this.aUndoHistory.length;
		
		if(this.oCurStateIdx.nIdx !== this._historyLength-1){
			bSkipIfEqual = true;
		}

		var oCurHistory = this.aUndoHistory[this.oCurStateIdx.nIdx],
			sHistoryFullContents = oCurHistory.sFullContents[this.oCurStateIdx.nStep],
			sCurContent = "",
			sFullContents = "",
			sParentXPath = "",
			oBookmark = null,
			oSelection = null,
			oInsertionIdx = {nIdx:this.oCurStateIdx.nIdx, nStep:this.oCurStateIdx.nStep};	// 히스토리를 저장할 위치

		oSelection = this.oApp.getSelection();
		
		if(oSelection.selectionLoaded){
			oBookmark = oSelection.getXPathBookmark();
		}
		
		if(elSaveTarget){
			sParentXPath = oSelection._getXPath(elSaveTarget);
		}else if(sSaveTarget){
			sParentXPath = this._getTargetXPath(oBookmark, sSaveTarget);
		}else{
			sParentXPath = this._getParentXPath(oBookmark, bMustBlockElement, bMustBlockContainer);
		}
		
		sFullContents = this.oApp.getWYSIWYGDocument().body.innerHTML;
		// sCurContent = this.oApp.getWYSIWYGDocument().body.innerHTML.replace(/ *_cssquery_UID="[^"]+" */g, "");

		if(sParentXPath === this.sDefaultXPath){
			sCurContent = sFullContents;
		}else{
			sCurContent = oSelection._evaluateXPath(sParentXPath, oSelection._document).innerHTML;
		}

		if(this.bFF && sCurContent == this.sBlankContentsForFF){
			sCurContent = "";
		}

		// every TwoStepAction needs to be recorded
		if(!bTwoStepAction && bSkipIfEqual){
			if(sHistoryFullContents.length === sFullContents.length){
				return;
			}
			
			// 저장된 데이터와 같음에도 다르다고 처리되는 경우에 대한 처리
			// (예, P안에 Block엘리먼트가 추가된 경우 P를 분리)
			//if(this.bChrome || this.bSafari){
				var elCurrentDiv = document.createElement("div");
				var elHistoryDiv = document.createElement("div");

				elCurrentDiv.innerHTML = sFullContents;
				elHistoryDiv.innerHTML = sHistoryFullContents;
				
				var elDocFragment = document.createDocumentFragment();
				elDocFragment.appendChild(elCurrentDiv);
				elDocFragment.appendChild(elHistoryDiv);

				sFullContents = elCurrentDiv.innerHTML;
				sHistoryFullContents = elHistoryDiv.innerHTML;

				elCurrentDiv = null;
				elHistoryDiv = null;				
				elDocFragment = null;

				if(sHistoryFullContents.length === sFullContents.length){
					return;
				}
			//}
		}
		
		if(bDontSaveSelection){
			oBookmark = { sType : "scroll", nScrollTop : this.oApp.getWYSIWYGDocument().documentElement.scrollTop };
		}
		
		oInsertionIdx.nStep = nStep;

		if(oInsertionIdx.nStep === 0 && this.oCurStateIdx.nStep === oCurHistory.nTotalSteps-1){
			oInsertionIdx.nIdx = this.oCurStateIdx.nIdx+1;
		}

		this._doRecordUndoHistoryAt(oInsertionIdx, sAction, sCurContent, sFullContents, oBookmark, sParentXPath, oUndoCallback, oRedoCallback);
	},
	
	$ON_DO_RECORD_UNDO_HISTORY_AT : function(oInsertionIdx, sAction, sContent, sFullContents, oBookmark, sParentXPath){
		this._doRecordUndoHistoryAt(oInsertionIdx, sAction, sContent, sFullContents, oBookmark, sParentXPath);
	},
	
	_doRecordUndoHistoryAt : function(oInsertionIdx, sAction, sContent, sFullContents, oBookmark, sParentXPath, oUndoCallback, oRedoCallback){
		if(oInsertionIdx.nStep !== 0){
			this.aUndoHistory[oInsertionIdx.nIdx].nTotalSteps = oInsertionIdx.nStep+1;
			this.aUndoHistory[oInsertionIdx.nIdx].sContent[oInsertionIdx.nStep] = sContent;
			this.aUndoHistory[oInsertionIdx.nIdx].sFullContents[oInsertionIdx.nStep] = sFullContents;
			this.aUndoHistory[oInsertionIdx.nIdx].oBookmark[oInsertionIdx.nStep] = oBookmark;
			this.aUndoHistory[oInsertionIdx.nIdx].sParentXPath[oInsertionIdx.nStep] = sParentXPath;
			this.aUndoHistory[oInsertionIdx.nIdx].oUndoCallback[oInsertionIdx.nStep] = oUndoCallback;
			this.aUndoHistory[oInsertionIdx.nIdx].oRedoCallback[oInsertionIdx.nStep] = oRedoCallback;
		}else{
			var oNewHistory = {sAction:sAction, nTotalSteps: 1};
			oNewHistory.sContent = [];
			oNewHistory.sContent[0] = sContent;

			oNewHistory.sFullContents = [];
			oNewHistory.sFullContents[0] = sFullContents;

			oNewHistory.oBookmark = [];
			oNewHistory.oBookmark[0] = oBookmark;
			
			oNewHistory.sParentXPath = [];
			oNewHistory.sParentXPath[0] = sParentXPath;
			
			oNewHistory.oUndoCallback = [];
			oNewHistory.oUndoCallback[0] = oUndoCallback;
						
			oNewHistory.oRedoCallback = [];
			oNewHistory.oRedoCallback[0] = oRedoCallback;
			
			this.aUndoHistory.splice(oInsertionIdx.nIdx, this._historyLength - oInsertionIdx.nIdx, oNewHistory);
			this._historyLength = this.aUndoHistory.length;
		}

		if(this._historyLength > this.nHardLimit){
			this.aUndoHistory.splice(0, this.nAfterMaxDeleteBuffer);
			oInsertionIdx.nIdx -= this.nAfterMaxDeleteBuffer;
		}
		this.oCurStateIdx.nIdx = oInsertionIdx.nIdx;
		this.oCurStateIdx.nStep = oInsertionIdx.nStep;
	},

	_saveSnapShot : function(){
		this.oSnapShot = {
			oBookmark : this.oApp.getSelection().getXPathBookmark()
		};
	},
	
	_getTargetXPath : function(oBookmark, sSaveTarget){	// ex. A, TABLE ...
		var sParentXPath = this.sDefaultXPath,
			aStartXPath = oBookmark[0].sXPath.split("/"),
			aEndXPath = oBookmark[1].sXPath.split("/"),
			aParentPath = [],
			nPathLen = aStartXPath.length < aEndXPath.length ? aStartXPath.length : aEndXPath.length, 
			nPathIdx = 0, nTargetIdx = -1;

		if(sSaveTarget === "BODY"){
			return sParentXPath;
		}
		
		for(nPathIdx=0; nPathIdx<nPathLen; nPathIdx++){			
			if(aStartXPath[nPathIdx] !== aEndXPath[nPathIdx]){
				break;
			}
			
			aParentPath.push(aStartXPath[nPathIdx]);
			
			if(aStartXPath[nPathIdx] === "" || aStartXPath[nPathIdx] === "HTML" || aStartXPath[nPathIdx] === "BODY"){
				continue;
			}
			
			if(aStartXPath[nPathIdx].indexOf(sSaveTarget) > -1){
				nTargetIdx = nPathIdx;
			}
		}

		if(nTargetIdx > -1){
			aParentPath.length = nTargetIdx;	// Target 의 상위 노드까지 지정
		}
		
		sParentXPath = aParentPath.join("/");
		
		if(sParentXPath.length < this.sDefaultXPath.length){
			sParentXPath = this.sDefaultXPath;
		}
		
		return sParentXPath; 
	},
	
	_getParentXPath : function(oBookmark, bMustBlockElement, bMustBlockContainer){
		var sParentXPath = this.sDefaultXPath,
			aStartXPath, aEndXPath,
			aSnapShotStart, aSnapShotEnd,
			nSnapShotLen, nPathLen,
			aParentPath = ["", "HTML[0]", "BODY[0]"],			
			nPathIdx = 0, nBlockIdx = -1,
			// rxBlockContainer = /\bUL|OL|TD|TR|TABLE|BLOCKQUOTE\[/i,	// DL
			// rxBlockElement = /\bP|LI|DIV|UL|OL|TD|TR|TABLE|BLOCKQUOTE\[/i,	// H[1-6]|DD|DT|DL|PRE
			// rxBlock,
			sPath, sTag;
			
		if(!oBookmark){
			return sParentXPath;
		}
				
		// 가능한 중복되는 Parent 를 검색
		if(oBookmark[0].sXPath === sParentXPath || oBookmark[1].sXPath === sParentXPath){
			return sParentXPath;
		}

		aStartXPath = oBookmark[0].sXPath.split("/");
		aEndXPath = oBookmark[1].sXPath.split("/");
		aSnapShotStart = this.oSnapShot.oBookmark[0].sXPath.split("/");
		aSnapShotEnd = this.oSnapShot.oBookmark[1].sXPath.split("/");
		
		nSnapShotLen = aSnapShotStart.length < aSnapShotEnd.length ? aSnapShotStart.length : aSnapShotEnd.length;
		nPathLen = aStartXPath.length < aEndXPath.length ? aStartXPath.length : aEndXPath.length;
		nPathLen = nPathLen < nSnapShotLen ? nPathLen : nSnapShotLen;

		if(nPathLen < 3){	// BODY
			return sParentXPath;
		}
		
		bMustBlockElement = bMustBlockElement || false;
		bMustBlockContainer = bMustBlockContainer || false;
		// rxBlock = bMustBlockElement ? rxBlockElement : rxBlockContainer;
		
		for(nPathIdx=3; nPathIdx<nPathLen; nPathIdx++){
			sPath = aStartXPath[nPathIdx];
			
			if(sPath !== aEndXPath[nPathIdx] || 
				sPath !== aSnapShotStart[nPathIdx] ||
				sPath !== aSnapShotEnd[nPathIdx] ||  
				aEndXPath[nPathIdx] !== aSnapShotStart[nPathIdx] ||
				aEndXPath[nPathIdx] !== aSnapShotEnd[nPathIdx] ||
				aSnapShotStart[nPathIdx] !== aSnapShotEnd[nPathIdx]){
			
				break;		
			}
						
			aParentPath.push(sPath);

			sTag = sPath.substring(0, sPath.indexOf("["));
			
			if(bMustBlockElement && (sTag === "P" || sTag === "LI" || sTag === "DIV")){
				nBlockIdx = nPathIdx;
			}else if(sTag === "UL" || sTag === "OL" || sTag === "TD" || sTag === "TR" || sTag === "TABLE" || sTag === "BLOCKQUOTE"){
				nBlockIdx = nPathIdx;
			}

			// if(rxBlock.test(sPath)){
				// nBlockIdx = nPathIdx;
			// }
		}

		if(nBlockIdx > -1){
			aParentPath.length = nBlockIdx + 1;
		}else if(bMustBlockElement || bMustBlockContainer){
			return sParentXPath;
		}

		return aParentPath.join("/");
	},

	_getUndoHistory : function(){
		return this.aUndoHistory;
	},

	_getUndoStateIdx : function(){
		return this.oCurStateIdx;
	}
});