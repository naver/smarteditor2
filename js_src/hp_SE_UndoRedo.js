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
 *
---------------------------------------------------------------------------]*/
/*[
 * RECORD_UNDO_BEFORE_ACTION
 *
 * 현재 IR을 UNDO 히스토리에 추가한다. 액션 전후 따로 저장 할 경우 전 단계.
 *
 * sAction string 실행 할 액션(어떤 이유로 IR에 변경이 있었는지 참고용)
 *
---------------------------------------------------------------------------]*/
/*[
 * RECORD_UNDO_AFTER_ACTION
 *
 * 현재 IR을 UNDO 히스토리에 추가한다. 액션 전후 따로 저장 할 경우 후 단계.
 *
 * sAction string 실행 할 액션(어떤 이유로 IR에 변경이 있었는지 참고용)
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
 * bTwoStepAction bool 2단계짜리 액션인지 여부
 * bBeforeAction bool 2단계짜리 액션이라면 앞부분인지 여부
 * nForceAddUnlessEqual number 어느정도 변경이이 있을때 히스토리를 추가 할지. (0: 변경이 어느정도 발생 했을 때, 1: 조금의 변경이라도 있을 경우, 2: 항상)
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
nhn.husky.SE_UndoRedo = $Class({
	name : "SE_UndoRedo",
	actionHistory : null,
	// this may also be called, lastAdded/lastRestored
	oCurStateIdx : null,
	iMinimumSizeChange : 10,
	sBlankContentsForFF : "<br>",

	$init : function(){
		this.aUndoHistory = [];
		this.oCurStateIdx = {nIdx: 0, nStep: 0};
	},

	$LOCAL_BEFORE_ALL : function(sCmd){
		if(sCmd.match(/_DO_RECORD_UNDO_HISTORY_AT$/)) return true;

		try{
			if(this.oApp.getEditingMode() != "WYSIWYG") return false;
		}catch(e){
			return false;
		}
		
		return true;
	},
	
	$BEFORE_MSG_APP_READY : function(){
		this.oApp.exec("DO_RECORD_UNDO_HISTORY_AT", [this.oCurStateIdx, "", "", null]);
	},

	$ON_MSG_APP_READY : function(){
		this.bFF = $Agent().navigator().firefox;

		this.oApp.exec("ADD_APP_PROPERTY", ["getUndoHistory", $Fn(this._getUndoHistory, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getUndoStateIdx", $Fn(this._getUndoStateIdx, this).bind()]);

		this.oApp.exec("REGISTER_UI_EVENT", ["undo", "click", "UNDO"]);
		this.oApp.exec("REGISTER_UI_EVENT", ["redo", "click", "REDO"]);
		
		this.oApp.exec("REGISTER_HOTKEY", ["ctrl+z", "UNDO"]);
		this.oApp.exec("REGISTER_HOTKEY", ["ctrl+y", "REDO"]);
	},
	
	$ON_UNDO : function(){
		var oTmpStateIdx = {};
		this.oApp.exec("DO_RECORD_UNDO_HISTORY", ["KEYPRESS", false, false, 1]);
		if(this.oCurStateIdx.nIdx == 0) return;

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

		this.oApp.exec("RESTORE_UNDO_HISTORY", [this.oCurStateIdx.nIdx, this.oCurStateIdx.nStep]);

		this.oApp.exec("CHECK_STYLE_CHANGE", []);
	},


	$ON_REDO : function(){
		if(this.oCurStateIdx.nIdx >= this.aUndoHistory.length) return;

		var oCurHistory = this.aUndoHistory[this.oCurStateIdx.nIdx];
		if(this.oCurStateIdx.nIdx == this.aUndoHistory.length-1 && this.oCurStateIdx.nStep >= oCurHistory.nTotalSteps-1) return;
		
		if(this.oCurStateIdx.nStep < oCurHistory.nTotalSteps-1){
			this.oCurStateIdx.nStep++;
		}else{
			this.oCurStateIdx.nIdx++;
			oCurHistory = this.aUndoHistory[this.oCurStateIdx.nIdx];
			this.oCurStateIdx.nStep = oCurHistory.nTotalSteps-1;
		}

		this.oApp.exec("RESTORE_UNDO_HISTORY", [this.oCurStateIdx.nIdx, this.oCurStateIdx.nStep]);

		this.oApp.exec("CHECK_STYLE_CHANGE", []);
	},

	$ON_RECORD_UNDO_ACTION : function(sAction){
		this.oApp.exec("DO_RECORD_UNDO_HISTORY", [sAction]);
	},

	$ON_RECORD_UNDO_BEFORE_ACTION : function(sAction){
		this.oApp.exec("DO_RECORD_UNDO_HISTORY", [sAction, true, true]);
	},

	$ON_RECORD_UNDO_AFTER_ACTION : function(sAction){
		this.oApp.exec("DO_RECORD_UNDO_HISTORY", [sAction, true, false]);
	},

	$ON_RESTORE_UNDO_HISTORY : function(nUndoIdx, nUndoStateStep){
		this.oCurStateIdx.nIdx = nUndoIdx;
		this.oCurStateIdx.nStep = nUndoStateStep;

		var oCurHistory = this.aUndoHistory[this.oCurStateIdx.nIdx];
		var sContent = oCurHistory.sContent[this.oCurStateIdx.nStep];
		var oBookmark = oCurHistory.oBookmark[this.oCurStateIdx.nStep];

		//this.oApp.setIR(sContent, true);
		this.oApp.getWYSIWYGDocument().body.innerHTML = sContent;

		// setting the innerHTML may change the internal DOM structure, so save the value again.
		//var sCurContent = this.oApp.getIR();
		var sCurContent = this.oApp.getWYSIWYGDocument().body.innerHTML;
		if(this.bFF && sCurContent == this.sBlankContentsForFF){
			sCurContent = "";
		}
		oCurHistory.sContent[this.oCurStateIdx.nStep] = sCurContent;
		
		var oSelection = this.oApp.getEmptySelection();
		if(oSelection.selectionLoaded){
			if(oBookmark){
				oSelection.moveToXPathBookmark(oBookmark);
			}else{
				oSelection = this.oApp.getEmptySelection();
			}
			
			oSelection.select();
		}
	},

	$ON_DO_RECORD_UNDO_HISTORY : function(sAction, bTwoStepAction, bBeforeAction, nForceAddUnlessEqual){
		bTwoStepAction = bTwoStepAction || false;
		bBeforeAction = bBeforeAction || false;
		nForceAddUnlessEqual = nForceAddUnlessEqual || 0;
		
		// if we're in the middle of some action history, remove everything after current idx if any "little" change is made
		if(!(this.oCurStateIdx.nIdx == this.aUndoHistory.length-1)) nForceAddUnlessEqual = 1;

		var oCurHistory = this.aUndoHistory[this.oCurStateIdx.nIdx];

		//var sCurContent = this.oApp.getIR();
		var sCurContent = this.oApp.getWYSIWYGDocument().body.innerHTML;
		var sHistoryContent = oCurHistory.sContent[this.oCurStateIdx.nStep];

		if(this.bFF && sCurContent == this.sBlankContentsForFF){
			sCurContent = "";
		}

		// every TwoStepAction needs to be recorded
		if(!bTwoStepAction){
			switch(nForceAddUnlessEqual){
				case 0:
					if(Math.abs(sHistoryContent.length - sCurContent.length)<this.iMinimumSizeChange) return;
					break;
				
				case 1:
					if(sHistoryContent == sCurContent) return;
					break;
				
				// write at all times
				case 2:
					break;
			}
		}

		var oSelection = this.oApp.getSelection();
		
		var oBookmark=null;
		if(oSelection.selectionLoaded){
			oBookmark = oSelection.getXPathBookmark();
		}
		
		var oInsertionIdx = {nIdx:this.oCurStateIdx.nIdx, nStep:this.oCurStateIdx.nStep};
		if(bTwoStepAction){
			if(bBeforeAction){
				oInsertionIdx.nStep = 0;
			}else{
				oInsertionIdx.nStep = 1;
			}
		}else{
			oInsertionIdx.nStep = 0;
		}

		if(oInsertionIdx.nStep == 0 && this.oCurStateIdx.nStep == oCurHistory.nTotalSteps-1){
			oInsertionIdx.nIdx = this.oCurStateIdx.nIdx+1;
		}

		this.oApp.exec("DO_RECORD_UNDO_HISTORY_AT", [oInsertionIdx, sAction, sCurContent, oBookmark]);
	},

	$ON_DO_RECORD_UNDO_HISTORY_AT : function(oInsertionIdx, sAction, sContent, oBookmark){
		if(oInsertionIdx.nStep != 0){
			this.aUndoHistory[oInsertionIdx.nIdx].nTotalSteps = oInsertionIdx.nStep+1;
			this.aUndoHistory[oInsertionIdx.nIdx].sContent[oInsertionIdx.nStep] = sContent;
			this.aUndoHistory[oInsertionIdx.nIdx].oBookmark[oInsertionIdx.nStep] = oBookmark;
		}else{
			var oNewHistory = {sAction:sAction, nTotalSteps: 1};
			oNewHistory.sContent = [];
			oNewHistory.sContent[0] = sContent;

			oNewHistory.oBookmark = [];
			oNewHistory.oBookmark[0] = oBookmark;
			this.aUndoHistory.splice(oInsertionIdx.nIdx, this.aUndoHistory.length - oInsertionIdx.nIdx, oNewHistory);
		}

		this.oCurStateIdx.nIdx = oInsertionIdx.nIdx;
		this.oCurStateIdx.nStep = oInsertionIdx.nStep;
	},

	_getUndoHistory : function(){
		return this.aUndoHistory;
	},

	_getUndoStateIdx : function(){
		return this.oCurStateIdx;
	}
});
//}