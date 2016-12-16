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
nhn.husky.HuskyCore.addLoadedFile("hp_SE2M_TableEditor$Lazy.js");
/**
 * @depends nhn.husky.SE2M_TableEditor
 * this.oApp.registerLazyMessage(["EVENT_EDITING_AREA_MOUSEMOVE", "STYLE_TABLE"], ["hp_SE2M_TableEditor$Lazy.js","SE2M_TableTemplate.js"]);
 */
nhn.husky.HuskyCore.mixin(nhn.husky.SE2M_TableEditor, {
	// [SMARTEDITORSUS-1672]
	_aCellName : ["TD", "TH"],
	// --[SMARTEDITORSUS-1672]
	
	//@lazyload_js EVENT_EDITING_AREA_MOUSEMOVE:SE2M_TableTemplate.js[
	_assignHTMLObjects : function(){
		this.oApp.exec("LOAD_HTML", ["qe_table"]);

		this.elQELayer = jindo.$$.getSingle("DIV.q_table_wrap", this.oApp.htOptions.elAppContainer);
		this.elQELayer.style.zIndex = 150;
		this.elBtnAddRowBelow = jindo.$$.getSingle("BUTTON.se2_addrow", this.elQELayer);
		this.elBtnAddColumnRight = jindo.$$.getSingle("BUTTON.se2_addcol", this.elQELayer);
		this.elBtnSplitRow = jindo.$$.getSingle("BUTTON.se2_seprow", this.elQELayer);
		this.elBtnSplitColumn = jindo.$$.getSingle("BUTTON.se2_sepcol", this.elQELayer);
		this.elBtnDeleteRow = jindo.$$.getSingle("BUTTON.se2_delrow", this.elQELayer);
		this.elBtnDeleteColumn = jindo.$$.getSingle("BUTTON.se2_delcol", this.elQELayer);
		this.elBtnMergeCell = jindo.$$.getSingle("BUTTON.se2_merrow", this.elQELayer);
		this.elBtnBGPalette = jindo.$$.getSingle("BUTTON.husky_se2m_table_qe_bgcolor_btn", this.elQELayer);
		this.elBtnBGIMGPalette = jindo.$$.getSingle("BUTTON.husky_se2m_table_qe_bgimage_btn", this.elQELayer);

		this.elPanelBGPaletteHolder = jindo.$$.getSingle("DIV.husky_se2m_tbl_qe_bg_paletteHolder", this.elQELayer);
		this.elPanelBGIMGPaletteHolder = jindo.$$.getSingle("DIV.husky_se2m_tbl_qe_bg_img_paletteHolder", this.elQELayer);	
		
		this.elPanelTableBGArea = jindo.$$.getSingle("DIV.se2_qe2", this.elQELayer);
		this.elPanelTableTemplateArea = jindo.$$.getSingle("DL.se2_qe3", this.elQELayer);
		this.elPanelReviewBGArea = jindo.$$.getSingle("DL.husky_se2m_tbl_qe_review_bg", this.elQELayer);	
		
		this.elPanelBGImg = jindo.$$.getSingle("DD", this.elPanelReviewBGArea);
		
		this.welPanelTableBGArea = jindo.$Element(this.elPanelTableBGArea);
		this.welPanelTableTemplateArea = jindo.$Element(this.elPanelTableTemplateArea);
		this.welPanelReviewBGArea = jindo.$Element(this.elPanelReviewBGArea);
		
		//		this.elPanelReviewBtnArea = jindo.$$.getSingle("DIV.se2_btn_area", this.elQELayer); 	//My리뷰 버튼 레이어
		this.elPanelDim1 = jindo.$$.getSingle("DIV.husky_se2m_tbl_qe_dim1", this.elQELayer);
		this.elPanelDim2 = jindo.$$.getSingle("DIV.husky_se2m_tbl_qe_dim2", this.elQELayer);
		this.elPanelDimDelCol = jindo.$$.getSingle("DIV.husky_se2m_tbl_qe_dim_del_col", this.elQELayer);
		this.elPanelDimDelRow = jindo.$$.getSingle("DIV.husky_se2m_tbl_qe_dim_del_row", this.elQELayer);
		
		this.elInputRadioBGColor = jindo.$$.getSingle("INPUT.husky_se2m_radio_bgc", this.elQELayer);		
		this.elInputRadioBGImg = jindo.$$.getSingle("INPUT.husky_se2m_radio_bgimg", this.elQELayer);		
		
		this.elSelectBoxTemplate = jindo.$$.getSingle("DIV.se2_select_ty2", this.elQELayer);
		this.elInputRadioTemplate = jindo.$$.getSingle("INPUT.husky_se2m_radio_template", this.elQELayer);
		this.elPanelQETemplate = jindo.$$.getSingle("DIV.se2_layer_t_style", this.elQELayer);
		this.elBtnQETemplate = jindo.$$.getSingle("BUTTON.husky_se2m_template_more", this.elQELayer);
		this.elPanelQETemplatePreview = jindo.$$.getSingle("SPAN.se2_t_style1", this.elQELayer);
		
		this.aElBtn_tableStyle = jindo.$$("BUTTON", this.elPanelQETemplate);
		for(i = 0; i < this.aElBtn_tableStyle.length; i++){
			this.oApp.registerBrowserEvent(this.aElBtn_tableStyle[i], "click", "TABLE_QE_SELECT_TEMPLATE");
		}
	},

	_attachEvents : function(){
		var htBrowser = jindo.$Agent().navigator();
		
		this.oApp.exec("SE2_ATTACH_HOVER_EVENTS", [this.aElBtn_tableStyle]);
		
		this._wfnOnMouseDownResizeCover = jindo.$Fn(this._fnOnMouseDownResizeCover, this);
		this._wfnOnMouseMoveResizeCover = jindo.$Fn(this._fnOnMouseMoveResizeCover, this);
		this._wfnOnMouseUpResizeCover = jindo.$Fn(this._fnOnMouseUpResizeCover, this);
		this._wfnOnMouseDownResizeCover.attach(this.elResizeCover, "mousedown");
		
		if((htBrowser.ie) && (htBrowser.version > 8)){
			this._wfnOnResizeEndTable = jindo.$Fn(this._fnOnResizeEndTable, this).bind();
		}
		
//		this.oApp.registerBrowserEvent(doc, "click", "EVENT_EDITING_AREA_CLICK");
		this.oApp.registerBrowserEvent(this.elBtnMergeCell, "click", "TE_MERGE_CELLS");
		
		this.oApp.registerBrowserEvent(this.elBtnSplitColumn, "click", "TE_SPLIT_COLUMN");
		this.oApp.registerBrowserEvent(this.elBtnSplitRow, "click", "TE_SPLIT_ROW");

//		this.oApp.registerBrowserEvent(this.elBtnAddColumnLeft, "click", "TE_INSERT_COLUMN_LEFT");
		this.oApp.registerBrowserEvent(this.elBtnAddColumnRight, "click", "TE_INSERT_COLUMN_RIGHT");

		this.oApp.registerBrowserEvent(this.elBtnAddRowBelow, "click", "TE_INSERT_ROW_BELOW");
//		this.oApp.registerBrowserEvent(this.elBtnAddRowAbove, "click", "TE_INSERT_ROW_ABOVE");

		this.oApp.registerBrowserEvent(this.elBtnDeleteColumn, "click", "TE_DELETE_COLUMN");
		this.oApp.registerBrowserEvent(this.elBtnDeleteRow, "click", "TE_DELETE_ROW");
		
		this.oApp.registerBrowserEvent(this.elInputRadioBGColor, "click", "DRAW_QE_RADIO_OPTION", [2]);
		this.oApp.registerBrowserEvent(this.elInputRadioBGImg, "click", "DRAW_QE_RADIO_OPTION", [3]);
		this.oApp.registerBrowserEvent(this.elInputRadioTemplate, "click", "DRAW_QE_RADIO_OPTION", [4]);
		this.oApp.registerBrowserEvent(this.elBtnBGPalette, "click", "TABLE_QE_TOGGLE_BGC_PALETTE");
//		this.oApp.registerBrowserEvent(this.elPanelReviewBtnArea, "click", "SAVE_QE_MY_REVIEW_ITEM"); //My리뷰 버튼 레이어
		this.oApp.registerBrowserEvent(this.elBtnBGIMGPalette, "click", "TABLE_QE_TOGGLE_IMG_PALETTE");
		this.oApp.registerBrowserEvent(this.elPanelBGIMGPaletteHolder, "click", "TABLE_QE_SET_IMG_FROM_PALETTE");
		//this.elPanelQETemplate
		//this.elBtnQETemplate
		this.oApp.registerBrowserEvent(this.elBtnQETemplate, "click", "TABLE_QE_TOGGLE_TEMPLATE");

		this.oApp.registerBrowserEvent(document.body, "mouseup", "EVENT_OUTER_DOC_MOUSEUP");
		this.oApp.registerBrowserEvent(document.body, "mousemove", "EVENT_OUTER_DOC_MOUSEMOVE");
	},
	
	$LOCAL_BEFORE_FIRST : function(sMsg){
		if(sMsg.indexOf("REGISTER_CONVERTERS") > -1){
			this.oApp.acceptLocalBeforeFirstAgain(this, true);
			return true;
		}
		this.htResizing = {};
		this.nDraggableCellEdge = 2;

		var elBody = jindo.$Element(document.body);
		this.nPageLeftRightMargin = parseInt(elBody.css("marginLeft"), 10) + parseInt(elBody.css("marginRight"), 10);
		this.nPageTopBottomMargin = parseInt(elBody.css("marginTop"), 10) + parseInt(elBody.css("marginBottom"), 10);
		
		//this.nPageLeftRightMargin = parseInt(elBody.css("marginLeft"), 10)+parseInt(elBody.css("marginRight"), 10) + parseInt(elBody.css("paddingLeft"), 10)+parseInt(elBody.css("paddingRight"), 10);
		//this.nPageTopBottomMargin = parseInt(elBody.css("marginTop"), 10)+parseInt(elBody.css("marginBottom"), 10) + parseInt(elBody.css("paddingTop"), 10)+parseInt(elBody.css("paddingBottom"), 10);
		
		this.QE_DIM_MERGE_BTN = 1;
		this.QE_DIM_BG_COLOR = 2;
		this.QE_DIM_REVIEW_BG_IMG = 3;
		this.QE_DIM_TABLE_TEMPLATE = 4;

		this.rxLastDigits = RegExp("([0-9]+)$");

		this._assignHTMLObjects();

		this.addCSSClass(this.CELL_SELECTION_CLASS, "background-color:#B4C9E9;");

		this._createCellResizeGrip();

		this.elIFrame = this.oApp.getWYSIWYGWindow().frameElement;
		//[SMARTEDITORSUS-1625] iframe의 offset을 수행하면 iOS에서 처음 탭시 포커싱이 안되는데 정확한 이유를 모르겠음
		//일단 사용안하기 때문에 코멘트처리해서 회피함
		//TODO: 다른 부분에서 동일한 이슈가 발생할 경우 디버깅이 어렵기 때문에 정확한 원인파악이 필요함
		//this.htFrameOffset = jindo.$Element(this.elIFrame).offset();

		this.sEmptyTDSrc = "";
		if(this.oApp.oNavigator.firefox){
			this.sEmptyTDSrc = "<p><br/></p>";
		}else{
			this.sEmptyTDSrc = "<p>&nbsp;</p>";
		}
		
		this._changeTableEditorStatus(this.STATUS.S_0);

		this._attachEvents();
		
		// [SMARTEDITORSUS-1672]
		this._rxCellNames = new RegExp("^(" + this._aCellName.join("|") + ")$", "i");
		// --[SMARTEDITORSUS-1672]
	},

	$ON_EVENT_EDITING_AREA_KEYUP : function(oEvent){
		// for undo/redo and other hotkey functions
		var oKeyInfo = oEvent.key();
		// 229: Korean/Eng, 33, 34: page up/down, 35,36: end/home, 37,38,39,40: left, up, right, down, 16: shift
		if(oKeyInfo.keyCode == 229 || oKeyInfo.alt || oKeyInfo.ctrl || oKeyInfo.keyCode == 16){
			return;
		}else if(oKeyInfo.keyCode == 8 || oKeyInfo.keyCode == 46){
			this.oApp.exec("DELETE_BLOCK_CONTENTS");
			oEvent.stop();
		}

		switch(this.nStatus){
			case this.STATUS.CELL_SELECTED:
				this._changeTableEditorStatus(this.STATUS.S_0);
				break;
		}
	},

	$ON_TABLE_QE_SELECT_TEMPLATE : function(weEvent){
		var aMatch = this.rxLastDigits.exec(weEvent.element.className);
		var elCurrentTable = this.elSelectionStartTable;

		this._changeTableEditorStatus(this.STATUS.S_0);
		this.oApp.exec("STYLE_TABLE", [elCurrentTable, aMatch[1]]);
		//this._selectTableStyle(aMatch[1]);

		var elSaveTarget = !!elCurrentTable && elCurrentTable.parentNode ? elCurrentTable.parentNode : null;
		var sSaveTarget = !elCurrentTable ? "BODY" : null; 
		
		this.oApp.exec("RECORD_UNDO_ACTION", ["CHANGE_TABLE_STYLE", {elSaveTarget:elSaveTarget, sSaveTarget : sSaveTarget, bDontSaveSelection:true}]); 
	},

	$BEFORE_CHANGE_EDITING_MODE : function(sMode, bNoFocus){
		if(sMode !== "WYSIWYG" && this.nStatus !== this.STATUS.S_0){
			this._changeTableEditorStatus(this.STATUS.S_0);
		}
	},
	
	// [Undo/Redo] Table Selection 처리와 관련된 부분 주석 처리
	// $AFTER_DO_RECORD_UNDO_HISTORY : function(){
		// if(this.nStatus != this.STATUS.CELL_SELECTED){
			// return;
		// }
		// 		
		// if(this.aSelectedCells.length < 1){
			// return;
		// }
		// 
		// var aTables = this.oApp.getWYSIWYGDocument().getElementsByTagName("TABLE");
		// for(var nTableIdx = 0, nLen = aTables.length; nTableIdx < nLen; nTableIdx++){
			// if(aTables[nTableIdx] === this.elSelectionStartTable){
				// break;
			// }
		// }
		// 
		// var aUndoHistory = this.oApp.getUndoHistory();
		// var oUndoStateIdx = this.oApp.getUndoStateIdx();
		// if(!aUndoHistory[oUndoStateIdx.nIdx].htTableSelection){
			// aUndoHistory[oUndoStateIdx.nIdx].htTableSelection = [];
		// }
		// aUndoHistory[oUndoStateIdx.nIdx].htTableSelection[oUndoStateIdx.nStep] = {
			// nTableIdx : nTableIdx,
			// nSX : this.htSelectionSPos.x,
			// nSY : this.htSelectionSPos.y,
			// nEX : this.htSelectionEPos.x,
			// nEY : this.htSelectionEPos.y
		// };
	// },
	// 
	// $BEFORE_RESTORE_UNDO_HISTORY : function(){
		// if(this.nStatus == this.STATUS.CELL_SELECTED){
			// var oSelection = this.oApp.getEmptySelection();
			// oSelection.selectNode(this.elSelectionStartTable);
			// oSelection.collapseToEnd();
			// oSelection.select();
		// }
	// },
	// 
	// $AFTER_RESTORE_UNDO_HISTORY : function(){
		// var aUndoHistory = this.oApp.getUndoHistory();
		// var oUndoStateIdx = this.oApp.getUndoStateIdx();
		// 
		// if(aUndoHistory[oUndoStateIdx.nIdx].htTableSelection && aUndoHistory[oUndoStateIdx.nIdx].htTableSelection[oUndoStateIdx.nStep]){
			// var htTableSelection = aUndoHistory[oUndoStateIdx.nIdx].htTableSelection[oUndoStateIdx.nStep];
			// this.elSelectionStartTable = this.oApp.getWYSIWYGDocument().getElementsByTagName("TABLE")[htTableSelection.nTableIdx];
			// this.htMap = this._getCellMapping(this.elSelectionStartTable);
			// 			
			// this.htSelectionSPos.x = htTableSelection.nSX;
			// this.htSelectionSPos.y = htTableSelection.nSY;
			// this.htSelectionEPos.x = htTableSelection.nEX;
			// this.htSelectionEPos.y = htTableSelection.nEY;
			// this._selectCells(this.htSelectionSPos, this.htSelectionEPos);
			// 			
			// this._startCellSelection();
			// this._changeTableEditorStatus(this.STATUS.CELL_SELECTED);
		// }else{
			// this._changeTableEditorStatus(this.STATUS.S_0);
		// }
	// },
	
	/**
	 * 테이블 셀 배경색 셋팅
	 */
	$ON_TABLE_QE_TOGGLE_BGC_PALETTE : function(){
		if(this.elPanelBGPaletteHolder.parentNode.style.display == "block"){
			this.oApp.exec("HIDE_TABLE_QE_BGC_PALETTE", []);
		}else{
			this.oApp.exec("SHOW_TABLE_QE_BGC_PALETTE", []);
		}
	},

	$ON_SHOW_TABLE_QE_BGC_PALETTE : function(){
		this.elPanelBGPaletteHolder.parentNode.style.display = "block";
		this.oApp.exec("SHOW_COLOR_PALETTE", ["TABLE_QE_SET_BGC_FROM_PALETTE", this.elPanelBGPaletteHolder]);
	},
	
	$ON_HIDE_TABLE_QE_BGC_PALETTE : function(){
		this.elPanelBGPaletteHolder.parentNode.style.display = "none";
		this.oApp.exec("HIDE_COLOR_PALETTE", []);
	},
	
	$ON_TABLE_QE_SET_BGC_FROM_PALETTE : function(sColorCode){
		this.oApp.exec("TABLE_QE_SET_BGC", [sColorCode]);
		if(this.oSelection){
			this.oSelection.select();
		}
		this._changeTableEditorStatus(this.STATUS.S_0);
	},

	$ON_TABLE_QE_SET_BGC : function(sColorCode){
		this.elBtnBGPalette.style.backgroundColor = sColorCode;
		for(var i = 0, nLen = this.aSelectedCells.length; i < nLen; i++){
			this.aSelectedCells[i].setAttribute(this.TMP_BGC_ATTR, sColorCode);
			this.aSelectedCells[i].removeAttribute(this.TMP_BGIMG_ATTR);
		}
		this.sQEAction = "TABLE_SET_BGCOLOR";
	},
	
	/**
	 * 테이블 리뷰 테이블 배경 이미지 셋팅 
	 */
	$ON_TABLE_QE_TOGGLE_IMG_PALETTE : function(){
		if(this.elPanelBGIMGPaletteHolder.parentNode.style.display == "block"){
			this.oApp.exec("HIDE_TABLE_QE_IMG_PALETTE", []);
		}else{
			this.oApp.exec("SHOW_TABLE_QE_IMG_PALETTE", []);
		}
	},
	
	$ON_SHOW_TABLE_QE_IMG_PALETTE : function(){
		this.elPanelBGIMGPaletteHolder.parentNode.style.display = "block";
	},
	
	$ON_HIDE_TABLE_QE_IMG_PALETTE : function(){
		this.elPanelBGIMGPaletteHolder.parentNode.style.display = "none";
	},
	
	$ON_TABLE_QE_SET_IMG_FROM_PALETTE : function(elEvt){
		this.oApp.exec("TABLE_QE_SET_IMG", [elEvt.element]);
		if(this.oSelection){
			this.oSelection.select();
		}
		this._changeTableEditorStatus(this.STATUS.S_0);
	},

	$ON_TABLE_QE_SET_IMG : function(elSelected){
		var sClassName = jindo.$Element(elSelected).className();
		var welBtnBGIMGPalette = jindo.$Element(this.elBtnBGIMGPalette);
		var aBtnClassNames = welBtnBGIMGPalette.className().split(" ");
		for(var i = 0, nLen = aBtnClassNames.length; i < nLen; i++){
			if(aBtnClassNames[i].indexOf("cellimg") > 0){
				welBtnBGIMGPalette.removeClass(aBtnClassNames[i]);
			}
		}
		jindo.$Element(this.elBtnBGIMGPalette).addClass(sClassName);
		
		var n = sClassName.substring(11, sClassName.length); //se2_cellimg11
		var sImageName = "pattern_";

		if(n === "0"){
			for(var i = 0, nLen = this.aSelectedCells.length; i < nLen; i++){
				jindo.$Element(this.aSelectedCells[i]).css("backgroundImage", "");
				this.aSelectedCells[i].removeAttribute(this.TMP_BGC_ATTR);
				this.aSelectedCells[i].removeAttribute(this.TMP_BGIMG_ATTR);
			}
		}else{
			if(n == 19 || n == 20 || n == 21 || n == 22 || n == 25 || n == 26){ //파일 사이즈때문에 jpg
				sImageName = sImageName + n + ".jpg";
			}else{
				sImageName = sImageName + n + ".gif";
			}
			
			for(var j = 0, nLen = this.aSelectedCells.length; j < nLen ; j++){
				jindo.$Element(this.aSelectedCells[j]).css("backgroundImage", "url("+"http://static.se2.naver.com/static/img/"+sImageName+")");
				this.aSelectedCells[j].removeAttribute(this.TMP_BGC_ATTR);
				this.aSelectedCells[j].setAttribute(this.TMP_BGIMG_ATTR, "url("+"http://static.se2.naver.com/static/img/"+sImageName+")");
			}
		} 
		this.sQEAction = "TABLE_SET_BGIMAGE";
	},
	
	$ON_SAVE_QE_MY_REVIEW_ITEM : function(){
		this.oApp.exec("SAVE_MY_REVIEW_ITEM");
		this.oApp.exec("CLOSE_QE_LAYER");
	},
	
	/**
	 * 테이블 퀵 에디터 Show 
	 */
	$ON_SHOW_COMMON_QE : function(){
		if(jindo.$Element(this.elSelectionStartTable).hasClass(this._sSETblClass)){
			this.oApp.exec("SHOW_TABLE_QE");
		}else{
			if(jindo.$Element(this.elSelectionStartTable).hasClass(this._sSEReviewTblClass)){
				this.oApp.exec("SHOW_REVIEW_QE");
			}
		}
	},
	
	$ON_SHOW_TABLE_QE : function(){
		this.oApp.exec("HIDE_TABLE_QE_BGC_PALETTE", []);
		this.oApp.exec("TABLE_QE_HIDE_TEMPLATE", []);
		this.oApp.exec("SETUP_TABLE_QE_MODE", [0]);
		this.oApp.exec("OPEN_QE_LAYER", [this.htMap[this.htSelectionEPos.x][this.htSelectionEPos.y], this.elQELayer, "table"]);
		//this.oApp.exec("FOCUS");
	},
	
	$ON_SHOW_REVIEW_QE : function(){
		this.oApp.exec("SETUP_TABLE_QE_MODE", [1]);
		this.oApp.exec("OPEN_QE_LAYER", [this.htMap[this.htSelectionEPos.x][this.htSelectionEPos.y], this.elQELayer, "review"]);
	},
	
	$ON_CLOSE_SUB_LAYER_QE : function(){
		if(typeof this.elPanelBGPaletteHolder != 'undefined'){
			this.elPanelBGPaletteHolder.parentNode.style.display = "none";
		}
		if(typeof this.elPanelBGIMGPaletteHolder != 'undefined'){
			this.elPanelBGIMGPaletteHolder.parentNode.style.display = "none";
		}
	},
	
	// 0: table
	// 1: review
	$ON_SETUP_TABLE_QE_MODE : function(nMode){
		var bEnableMerge = true;
		
		if(typeof nMode == "number"){
			this.nQEMode = nMode;
		}
		
		if(this.aSelectedCells.length < 2){
			bEnableMerge = false;
		}
		
		this.oApp.exec("TABLE_QE_DIM", [this.QE_DIM_MERGE_BTN, bEnableMerge]);

		//null인경우를 대비해서 default값을 지정해준다.
		var sBackgroundColor = this.aSelectedCells[0].getAttribute(this.TMP_BGC_ATTR) || "rgb(255,255,255)";

		var bAllMatched = true;
		for(var i = 1, nLen = this.aSelectedCells.length; i < nLen; i++){
			// [SMARTEDITORSUS-1552] 드래그로 셀을 선택하는 중 elCell이 없는 경우 오류 발생
			if(this.aSelectedCells[i]){
				if(sBackgroundColor != this.aSelectedCells[i].getAttribute(this.TMP_BGC_ATTR)){
					bAllMatched = false;
					break;
				}
			}
			// --[SMARTEDITORSUS-1552]
		}
		if(bAllMatched){
			this.elBtnBGPalette.style.backgroundColor = sBackgroundColor;
		}else{
			this.elBtnBGPalette.style.backgroundColor = "#FFFFFF";
		}
		
		var sBackgroundImage = this.aSelectedCells[0].getAttribute(this.TMP_BGIMG_ATTR) || "";
		var bAllMatchedImage = true;
		var sPatternInfo, nPatternImage = 0;
		var welBtnBGIMGPalette = jindo.$Element(this.elBtnBGIMGPalette);
		
		if(!!sBackgroundImage){
			var aPattern = sBackgroundImage.match(/\_[0-9]*/);
			sPatternInfo = (!!aPattern)?aPattern[0] : "_0";
			nPatternImage = sPatternInfo.substring(1, sPatternInfo.length);
			for(var i = 1, nLen = this.aSelectedCells.length; i < nLen; i++){
				if(sBackgroundImage != this.aSelectedCells[i].getAttribute(this.TMP_BGIMG_ATTR)){
					bAllMatchedImage = false;
					break;
				}
			}
		}
		
		var aBtnClassNames = welBtnBGIMGPalette.className().split(/\s/);
		for(var j = 0, nLen = aBtnClassNames.length; j < nLen; j++){
			if(aBtnClassNames[j].indexOf("cellimg") > 0){
				welBtnBGIMGPalette.removeClass(aBtnClassNames[j]);
			}
		}
		
		if(bAllMatchedImage && nPatternImage > 0){
			welBtnBGIMGPalette.addClass("se2_cellimg" + nPatternImage);
		}else{
			welBtnBGIMGPalette.addClass("se2_cellimg0");
		}
		
		if(this.nQEMode === 0){		//table
			this.elPanelTableTemplateArea.style.display = "block";
//			this.elSelectBoxTemplate.style.display = "block"; 
			this.elPanelReviewBGArea.style.display = "none";
			
//			this.elSelectBoxTemplate.style.position = "";
			
			//this.elPanelReviewBtnArea.style.display = "none"; //My리뷰 버튼 레이어
			
			// 배경Area에서 css를 제거해야함
			jindo.$Element(this.elPanelTableBGArea).className("se2_qe2");
			
			var nTpl = this.parseIntOr0(this.elSelectionStartTable.getAttribute(this.ATTR_TBL_TEMPLATE));
			if(nTpl){
				//this.elInputRadioTemplate.checked = "true";
			}else{
				this.elInputRadioBGColor.checked = "true";
				nTpl = 1;
			}
			
			this.elPanelQETemplatePreview.className = "se2_t_style" + nTpl;
			
			this.elPanelBGImg.style.position = "";
		}else if(this.nQEMode == 1){	//review
			this.elPanelTableTemplateArea.style.display = "none";
//			this.elSelectBoxTemplate.style.display = "none"; 
			this.elPanelReviewBGArea.style.display = "block";
			
//			this.elSelectBoxTemplate.style.position = "static";

			//	this.elPanelReviewBtnArea.style.display = "block"; //My리뷰 버튼 레이어
			var nTpl = this.parseIntOr0(this.elSelectionStartTable.getAttribute(this.ATTR_REVIEW_TEMPLATE));
			
			this.elPanelBGImg.style.position = "relative";
		}else{
			this.elPanelTableTemplateArea.style.display = "none";
			this.elPanelReviewBGArea.style.display = "none";
		//	this.elPanelReviewBtnArea.style.display = "none";	//My리뷰 버튼 레이어
		}
		
		this.oApp.exec("DRAW_QE_RADIO_OPTION", [0]);
	},

	// nClickedIdx
	// 0: none
	// 2: bg color
	// 3: bg img
	// 4: template
	$ON_DRAW_QE_RADIO_OPTION : function(nClickedIdx){
		if(nClickedIdx !== 0 && nClickedIdx != 2){
			this.oApp.exec("HIDE_TABLE_QE_BGC_PALETTE", []);
		}
		if(nClickedIdx !== 0 && nClickedIdx != 3){
			this.oApp.exec("HIDE_TABLE_QE_IMG_PALETTE", []);
		}
		if(nClickedIdx !== 0 && nClickedIdx != 4){
			this.oApp.exec("TABLE_QE_HIDE_TEMPLATE", []);
		}
		
		if(this.nQEMode === 0){
			// bg image option does not exist in table mode. so select the bgcolor option
			if(this.elInputRadioBGImg.checked){
				this.elInputRadioBGColor.checked = "true";
			}
			if(this.elInputRadioBGColor.checked){
				// one dimming layer is being shared so only need to dim once and the rest will be undimmed automatically
				//this.oApp.exec("TABLE_QE_DIM", [this.QE_DIM_BG_COLOR, true]);
				this.oApp.exec("TABLE_QE_DIM", [this.QE_DIM_TABLE_TEMPLATE, false]);
			}else{
				this.oApp.exec("TABLE_QE_DIM", [this.QE_DIM_BG_COLOR, false]);
				//this.oApp.exec("TABLE_QE_DIM", [this.QE_DIM_TABLE_TEMPLATE, true]);
			}
		}else{
			// template option does not exist in review mode. so select the bgcolor optio
			if(this.elInputRadioTemplate.checked){
				this.elInputRadioBGColor.checked = "true";
			}
			if(this.elInputRadioBGColor.checked){
				//this.oApp.exec("TABLE_QE_DIM", [this.QE_DIM_BG_COLOR, true]);
				this.oApp.exec("TABLE_QE_DIM", [this.QE_DIM_REVIEW_BG_IMG, false]);
			}else{
				this.oApp.exec("TABLE_QE_DIM", [this.QE_DIM_BG_COLOR, false]);
				//this.oApp.exec("TABLE_QE_DIM", [this.QE_DIM_REVIEW_BG_IMG, true]);
			}
		}
	},

	// nPart
	// 1: Merge cell btn
	// 2: Cell bg color
	// 3: Review - bg image
	// 4: Table - Template
	//
	// bUndim
	// true: Undim
	// false(default): Dim
	$ON_TABLE_QE_DIM : function(nPart, bUndim){
		var elPanelDim;
		var sDimClassPrefix = "se2_qdim";
		if(nPart == 1){
			elPanelDim = this.elPanelDim1;
		}else{
			elPanelDim = this.elPanelDim2;
		}
		
		if(bUndim){
			nPart = 0;
		}
		elPanelDim.className = sDimClassPrefix + nPart;
	},
	
	$ON_TE_SELECT_TABLE : function(elTable){
		this.elSelectionStartTable = elTable;
		this.htMap = this._getCellMapping(this.elSelectionStartTable);
	},
	
	$ON_TE_SELECT_CELLS : function(htSPos, htEPos){
		this._selectCells(htSPos, htEPos);
	},

	$ON_TE_MERGE_CELLS : function(){	
		if(this.aSelectedCells.length === 0 || this.aSelectedCells.length == 1){
			return;
		}
		this._removeClassFromSelection();

		var i, elFirstTD, elTD;

		elFirstTD = this.aSelectedCells[0];
		var elTable = nhn.husky.SE2M_Utils.findAncestorByTagName("TABLE", elFirstTD);
		
		var nHeight, nWidth;
		var elCurTD, elLastTD = this.aSelectedCells[0];
		nHeight = parseInt(elLastTD.style.height || elLastTD.getAttribute("height"), 10);
		nWidth = parseInt(elLastTD.style.width || elLastTD.getAttribute("width"), 10);
		//nHeight = elLastTD.offsetHeight;
		//nWidth = elLastTD.offsetWidth;
		
		for(i = this.htSelectionSPos.x + 1; i < this.htSelectionEPos.x + 1; i++){
			curTD = this.htMap[i][this.htSelectionSPos.y];
			if(curTD == elLastTD){
				continue;
			}
			elLastTD = curTD;
			nWidth += parseInt(curTD.style.width || curTD.getAttribute("width"), 10);
			//nWidth += curTD.offsetWidth;
		}
		
		elLastTD = this.aSelectedCells[0];
		for(i = this.htSelectionSPos.y + 1; i < this.htSelectionEPos.y + 1; i++){
			curTD = this.htMap[this.htSelectionSPos.x][i];
			if(curTD == elLastTD){
				continue;
			}
			elLastTD = curTD;
			nHeight += parseInt(curTD.style.height || curTD.getAttribute("height"), 10);
			//nHeight += curTD.offsetHeight;
		}
		
		if(nWidth){
			elFirstTD.style.width = nWidth + "px";
		}
		if(nHeight){
			elFirstTD.style.height = nHeight + "px";
		}
		
		elFirstTD.setAttribute("colSpan", this.htSelectionEPos.x - this.htSelectionSPos.x + 1);
		elFirstTD.setAttribute("rowSpan", this.htSelectionEPos.y - this.htSelectionSPos.y + 1);
		
		for(i = 1; i < this.aSelectedCells.length; i++){
			elTD = this.aSelectedCells[i];
			
			if(elTD.parentNode){
				if(!nhn.husky.SE2M_Utils.isBlankNode(elTD)){
					elFirstTD.innerHTML += elTD.innerHTML;
				}
				
				// [SMARTEDITORSUS-1533] 병합되는 셀 바로 뒤에 포함된 빈 텍스트 노드도 함께 제거하여 DOM 트리 일관성 유지
				var htBrowser = jindo.$Agent().navigator();
				if(htBrowser.ie && (htBrowser.nativeVersion == 9 || htBrowser.nativeVersion == 10) && (htBrowser.version == 9 || htBrowser.version == 10)){
					this._removeEmptyTextNode_IE(elTD);
				}
				// --[SMARTEDITORSUS-1533]
				
				elTD.parentNode.removeChild(elTD);
			}
		}
//		this._updateSelection();
		
		this.htMap = this._getCellMapping(this.elSelectionStartTable);
		this._selectCells(this.htSelectionSPos, this.htSelectionEPos);

		this._showTableTemplate(this.elSelectionStartTable);
		this._addClassToSelection();

		this.sQEAction = "TABLE_CELL_MERGE";

		this.oApp.exec("SHOW_COMMON_QE");
	},
	
	
	$ON_TABLE_QE_TOGGLE_TEMPLATE : function(){
		if(this.elPanelQETemplate.style.display == "block"){
			this.oApp.exec("TABLE_QE_HIDE_TEMPLATE");
		}else{
			this.oApp.exec("TABLE_QE_SHOW_TEMPLATE");
		}
	},
	
	$ON_TABLE_QE_SHOW_TEMPLATE : function(){
		this.elPanelQETemplate.style.display = "block";
		this.oApp.exec("POSITION_TOOLBAR_LAYER", [this.elPanelQETemplate]);
	},
	
	$ON_TABLE_QE_HIDE_TEMPLATE : function(){
		this.elPanelQETemplate.style.display = "none";
	},
	
	$ON_STYLE_TABLE : function(elTable, nTableStyleIdx){
		if(!elTable){
			if(!this._t){
				this._t = 1;
			}
			elTable = this.elSelectionStartTable;
			nTableStyleIdx = (this._t++) % 20 + 1;
		}

		if(this.oSelection){
			this.oSelection.select();
		}
		this._applyTableTemplate(elTable, nTableStyleIdx);
	},
	
	$ON_TE_DELETE_COLUMN : function(){
		// [SMARTEDITORSUS-1784] [SMARTEDITORSUS-555] 처리 후 발생한 사이트이펙트
		if(this.aSelectedCells.length === 0) {
			return;
		}
		/*if(this.aSelectedCells.length === 0 || this.aSelectedCells.length == 1) {
			return;
		}*/
		// --[SMARTEDITORSUS-1784]
		
		this._selectAll_Column();
		this._deleteSelectedCells();
		this.sQEAction = "DELETE_TABLE_COLUMN";
		this._changeTableEditorStatus(this.STATUS.S_0);
	},
	
	$ON_TE_DELETE_ROW : function(){
		// [SMARTEDITORSUS-1784] [SMARTEDITORSUS-555] 처리 후 발생한 사이트이펙트
		if(this.aSelectedCells.length === 0) {
			return;
		}
		/*if(this.aSelectedCells.length === 0 || this.aSelectedCells.length == 1) {
			return;
		}*/
		// --[SMARTEDITORSUS-1784]
		
		this._selectAll_Row();
		this._deleteSelectedCells();
		this.sQEAction = "DELETE_TABLE_ROW";
		this._changeTableEditorStatus(this.STATUS.S_0);
	},

	$ON_TE_INSERT_COLUMN_RIGHT : function(){
		if(this.aSelectedCells.length === 0) {
			return;
		}
		
		this._selectAll_Column();
		this._insertColumnAfter(this.htSelectionEPos.x);
	},
	
	$ON_TE_INSERT_COLUMN_LEFT : function(){
		this._selectAll_Column();
		this._insertColumnAfter(this.htSelectionSPos.x - 1);
	},

	$ON_TE_INSERT_ROW_BELOW : function(){
		if(this.aSelectedCells.length === 0) {
			return;
		}
		
		this._insertRowBelow(this.htSelectionEPos.y);
	},
	
	$ON_TE_INSERT_ROW_ABOVE : function(){
		this._insertRowBelow(this.htSelectionSPos.y - 1);
	},

	$ON_TE_SPLIT_COLUMN : function(){
		var nSpan, nNewSpan, nWidth, nNewWidth;
		var elCurCell, elNewTD;
		
		if(this.aSelectedCells.length === 0) {
			return;
		}
		
		this._removeClassFromSelection();

		var elLastCell = this.aSelectedCells[0];
		// Assign colSpan>1 to all selected cells.
		// If current colSpan == 1 then increase the colSpan of the cell and all the vertically adjacent cells.
		for(var i = 0, nLen = this.aSelectedCells.length; i < nLen; i++){
			elCurCell = this.aSelectedCells[i];
			nSpan = parseInt(elCurCell.getAttribute("colSpan"), 10) || 1;
			if(nSpan > 1){
				continue;
			}
			
			var htPos = this._getBasisCellPosition(elCurCell);
			for(var y = 0; y < this.htMap[0].length;){
				elCurCell = this.htMap[htPos.x][y];
				nSpan = parseInt(elCurCell.getAttribute("colSpan"), 10) || 1;
				elCurCell.setAttribute("colSpan", nSpan+1);
				y += parseInt(elCurCell.getAttribute("rowSpan"), 10) || 1;
			}
		}

		for(var i = 0, nLen = this.aSelectedCells.length; i < nLen; i++){
			elCurCell = this.aSelectedCells[i];
			nSpan = parseInt(elCurCell.getAttribute("colSpan"), 10) || 1;
			nNewSpan = (nSpan/2).toFixed(0);
			
			elCurCell.setAttribute("colSpan", nNewSpan);
			
			elNewTD = this._shallowCloneTD(elCurCell);
			elNewTD.setAttribute("colSpan", nSpan-nNewSpan);
			elLastCell = elNewTD;

			nSpan = parseInt(elCurCell.getAttribute("rowSpan"), 10) || 1;
			elNewTD.setAttribute("rowSpan", nSpan);
			elNewTD.innerHTML = "&nbsp;";

			nWidth = elCurCell.width || elCurCell.style.width;
			if(nWidth){
				nWidth = this.parseIntOr0(nWidth);
				elCurCell.removeAttribute("width");
				nNewWidth = (nWidth/2).toFixed();
				elCurCell.style.width = nNewWidth + "px";
				elNewTD.style.width = (nWidth - nNewWidth) + "px";
			}

			elCurCell.parentNode.insertBefore(elNewTD, elCurCell.nextSibling);
			
			// [SMARTEDITORSUS-1745][SMARTEDITORSUS-1842] 배경색이 바로 반영되지 않는 버그로 인해 명시
			// [SMARTEDITORSUS-2155] Win10 Spartan
			var htBrowser = jindo.$Agent().navigator();
			if((htBrowser.edge && (Math.floor(htBrowser.version) === 12)) || (htBrowser.ie && (htBrowser.nativeVersion >= 9 || htBrowser.nativeVersion <= 11) && (htBrowser.version >= 9 || htBrowser.version <= 11))){
				elNewTD.style.cssText = elCurCell.style.cssText;
			}
			// --[SMARTEDITORSUS-1745][SMARTEDITORSUS-1842][SMARTEDITORSUS-2155]
		}

		this._reassignCellSizes(this.elSelectionStartTable);
		
		this.htMap = this._getCellMapping(this.elSelectionStartTable);

		var htPos = this._getBasisCellPosition(elLastCell);
		this.htSelectionEPos.x = htPos.x;

		this._selectCells(this.htSelectionSPos, this.htSelectionEPos);
		
		this.sQEAction = "SPLIT_TABLE_COLUMN";
		
		this.oApp.exec("SHOW_COMMON_QE");
	},
	
	$ON_TE_SPLIT_ROW : function(){
		var nSpan, nNewSpan, nHeight, nHeight;
		var elCurCell, elNewTD, htPos, elNewTR;
		
		if(this.aSelectedCells.length === 0) {
			return;
		}
		
		var aTR = jindo.$$(">TBODY>TR", this.elSelectionStartTable, {oneTimeOffCache:true});
		this._removeClassFromSelection();
//top.document.title = this.htSelectionSPos.x+","+this.htSelectionSPos.y+"::"+this.htSelectionEPos.x+","+this.htSelectionEPos.y;

		var nNewRows = 0;
		// Assign rowSpan>1 to all selected cells.
		// If current rowSpan == 1 then increase the rowSpan of the cell and all the horizontally adjacent cells.
		var elNextTRInsertionPoint;
		for(var i = 0, nLen = this.aSelectedCells.length; i < nLen; i++){
			elCurCell = this.aSelectedCells[i];
			nSpan = parseInt(elCurCell.getAttribute("rowSpan"), 10) || 1;
			if(nSpan > 1){
				continue;
			}
			
			htPos = this._getBasisCellPosition(elCurCell);
			elNextTRInsertionPoint = aTR[htPos.y];

			// a new TR has to be inserted when there's an increase in rowSpan
			elNewTR = this.oApp.getWYSIWYGDocument().createElement("TR");
			elNextTRInsertionPoint.parentNode.insertBefore(elNewTR, elNextTRInsertionPoint.nextSibling);
			nNewRows++;
			
			// loop through horizontally adjacent cells and increase their rowSpan
			for(var x = 0; x < this.htMap.length;){
				elCurCell = this.htMap[x][htPos.y];
				nSpan = parseInt(elCurCell.getAttribute("rowSpan"), 10) || 1;
				elCurCell.setAttribute("rowSpan", nSpan + 1);
				x += parseInt(elCurCell.getAttribute("colSpan"), 10) || 1;
			}
		}

		aTR = jindo.$$(">TBODY>TR", this.elSelectionStartTable, {oneTimeOffCache:true});
		
		var htPos1, htPos2;
		for(var i = 0, nLen = this.aSelectedCells.length; i < nLen; i++){
			elCurCell = this.aSelectedCells[i];
			nSpan = parseInt(elCurCell.getAttribute("rowSpan"), 10) || 1;
			nNewSpan = (nSpan/2).toFixed(0);
			
			elCurCell.setAttribute("rowSpan", nNewSpan);
			
			elNewTD = this._shallowCloneTD(elCurCell);
			elNewTD.setAttribute("rowSpan", nSpan - nNewSpan);

			nSpan = parseInt(elCurCell.getAttribute("colSpan"), 10) || 1;
			elNewTD.setAttribute("colSpan", nSpan);
			elNewTD.innerHTML = "&nbsp;";
			
			nHeight = elCurCell.height || elCurCell.style.height;
			if(nHeight){
				nHeight = this.parseIntOr0(nHeight);
				elCurCell.removeAttribute("height");
				nNewHeight = (nHeight/2).toFixed();
				elCurCell.style.height = nNewHeight + "px";
				elNewTD.style.height = (nHeight - nNewHeight) + "px";
			}

			//var elTRInsertTo = elCurCell.parentNode;
			//for(var ii=0; ii<nNewSpan; ii++) elTRInsertTo = elTRInsertTo.nextSibling;
			var nTRIdx = jindo.$A(aTR).indexOf(elCurCell.parentNode);
			var nNextTRIdx = parseInt(nTRIdx, 10)+parseInt(nNewSpan, 10);
			var elTRInsertTo = aTR[nNextTRIdx];

			var oSiblingTDs = elTRInsertTo.childNodes;
			var elInsertionPt = null;
			var tmp;
			htPos1 = this._getBasisCellPosition(elCurCell);
			for(var ii = 0, nNumTDs = oSiblingTDs.length; ii < nNumTDs; ii++){
				tmp = oSiblingTDs[ii];
				// [SMARTEDITORSUS-1672]
				//if(!tmp.tagName || tmp.tagName != "TD"){
				if(!tmp.tagName || !this._rxCellNames.test(tmp.tagName)){
				// --[SMARTEDITORSUS-1672]
					continue;
				}
				
				htPos2 = this._getBasisCellPosition(tmp);
				if(htPos1.x < htPos2.x){
					elInsertionPt = tmp;
					break;
				}
			}
			elTRInsertTo.insertBefore(elNewTD, elInsertionPt);
			
			// [SMARTEDITORSUS-1745][SMARTEDITORSUS-1842] 배경색이 바로 반영되지 않는 버그로 인해 명시
			// [SMARTEDITORSUS-2155] Win10 Spartan
			var htBrowser = jindo.$Agent().navigator();
			if((htBrowser.edge && (Math.floor(htBrowser.version) === 12)) || (htBrowser.ie && (htBrowser.nativeVersion >= 9 || htBrowser.nativeVersion <= 11) && (htBrowser.version >= 9 || htBrowser.version <= 11))){
				elNewTD.style.cssText = elNewTD.style.cssText;
			}
			// --[SMARTEDITORSUS-1745][SMARTEDITORSUS-1842][SMARTEDITORSUS-2155]
		}

		this._reassignCellSizes(this.elSelectionStartTable);
		
		this.htMap = this._getCellMapping(this.elSelectionStartTable);
		this.htSelectionEPos.y += nNewRows;

		this._selectCells(this.htSelectionSPos, this.htSelectionEPos);
		
		this.sQEAction = "SPLIT_TABLE_ROW";
		
		this.oApp.exec("SHOW_COMMON_QE");
	},
	
	$ON_MSG_CELL_SELECTED : function(){
		// disable row/col delete btn
		this.elPanelDimDelCol.className = "se2_qdim6r";
		this.elPanelDimDelRow.className = "se2_qdim6c";
	
		if(this.htSelectionSPos.x === 0 && this.htSelectionEPos.x === this.htMap.length - 1){
			this.oApp.exec("MSG_ROW_SELECTED");
		}
		
		if(this.htSelectionSPos.y === 0 && this.htSelectionEPos.y === this.htMap[0].length - 1){
			this.oApp.exec("MSG_COL_SELECTED");
		}

		this.oApp.exec("SHOW_COMMON_QE");
	},

	$ON_MSG_ROW_SELECTED : function(){
		this.elPanelDimDelRow.className = "";
	},
	
	$ON_MSG_COL_SELECTED : function(){
		this.elPanelDimDelCol.className = "";
	},

	$ON_EVENT_EDITING_AREA_MOUSEDOWN : function(wevE){
		if(!this.oApp.isWYSIWYGEnabled()){
			return;
		}

		switch(this.nStatus){
		case this.STATUS.S_0:
			// the user may just want to resize the image
			if(!wevE.element){return;}
			if(wevE.element.tagName == "IMG"){return;}
			if(this.oApp.getEditingMode() !== "WYSIWYG"){return;}
		
			// change the status to MOUSEDOWN_CELL if the mouse is over a table cell
			// [SMARTEDITORSUS-1672]
			/*var elTD = nhn.husky.SE2M_Utils.findAncestorByTagName("TD", wevE.element);
			
			if(elTD && elTD.tagName == "TD"){*/
			var elTD = nhn.husky.SE2M_Utils.findClosestAncestorAmongTagNames(this._aCellName, wevE.element);
			
			if(elTD && this._rxCellNames.test(elTD.tagName)){
			// --[SMARTEDITORSUS-1672]
				var elTBL = nhn.husky.SE2M_Utils.findAncestorByTagName("TABLE", elTD);
				
				if(!jindo.$Element(elTBL).hasClass(this._sSETblClass) && !jindo.$Element(elTBL).hasClass(this._sSEReviewTblClass)){return;}
				if(!this._isValidTable(elTBL)){
					jindo.$Element(elTBL).removeClass(this._sSETblClass);
					jindo.$Element(elTBL).removeClass(this._sSEReviewTblClass);
					return;
				}
				
				if(elTBL){
					this.elSelectionStartTD = elTD;
					this.elSelectionStartTable = elTBL;
					this._changeTableEditorStatus(this.STATUS.MOUSEDOWN_CELL);
				}
			}
			break;
		case this.STATUS.MOUSEDOWN_CELL:
			break;
		case this.STATUS.CELL_SELECTING:
			break;
		case this.STATUS.CELL_SELECTED:
			this._changeTableEditorStatus(this.STATUS.S_0);
			break;
		}
	},

	$ON_EVENT_EDITING_AREA_MOUSEMOVE : function(wevE){
		if(this.oApp.getEditingMode() != "WYSIWYG"){return;}

		// [SMARTEDITORSUS-2136] [IE] <table>에 resizeend 핸들러 부여
		var elTable = wevE.element,
		htBrowser = jindo.$Agent().navigator(),
		sPointerUpEvent = 'onpointerup',
		sResizeEndEvent = 'onresizeend';
		if(htBrowser.ie && elTable && elTable.tagName && (elTable.tagName.toUpperCase() === 'TABLE')){ // [IE]
			if(sPointerUpEvent in elTable){ // [IE 11] resizeend 이벤트 deprecated
				elTable[sPointerUpEvent] = this._wfnOnResizeEndTable;
			}else if(sResizeEndEvent in elTable){
				if(htBrowser.version > 8){
					elTable[sResizeEndEvent] = this._wfnOnResizeEndTable;
				}else{
					// [IE 8-] event 객체가 handler로 전달되지 않는 문제가 있어서 별도의 handler 사용
					elTable[sResizeEndEvent] = this._getTableResizeEndHandler(elTable);
				}
			}
		}
		// --[SMARTEDITORSUS-2136]
		
		switch(this.nStatus){
			case this.STATUS.S_0:
				if(this._isOnBorder(wevE)){
					//this._changeTableEditorStatus(this.MOUSEOVER_BORDER);
					this._showCellResizeGrip(wevE);
				}else{
					this._hideResizer();
				}
				break;
			case this.STATUS.MOUSEDOWN_CELL:
				// change the status to CELL_SELECTING if the mouse moved out of the inital TD
				// [SMARTEDITORSUS-1672]
				//var elTD = nhn.husky.SE2M_Utils.findAncestorByTagName("TD", wevE.element);
				var elTD = nhn.husky.SE2M_Utils.findClosestAncestorAmongTagNames(this._aCellName, wevE.element); 
				// --[SMARTEDITORSUS-1672]
				if((elTD && elTD !== this.elSelectionStartTD) || !elTD){
					if(!elTD){elTD = this.elSelectionStartTD;}
	
					this._reassignCellSizes(this.elSelectionStartTable);
					
					this._startCellSelection();
					this._selectBetweenCells(this.elSelectionStartTD, elTD);
				}
				break;
			case this.STATUS.CELL_SELECTING:
				// show selection
				// [SMARTEDITORSUS-1672]
				//var elTD = nhn.husky.SE2M_Utils.findAncestorByTagName("TD", wevE.element);
				var elTD = nhn.husky.SE2M_Utils.findClosestAncestorAmongTagNames(this._aCellName, wevE.element);
				// --[SMARTEDITORSUS-1672]
				if(!elTD || elTD === this.elLastSelectedTD){return;}
	
				var elTBL = nhn.husky.SE2M_Utils.findAncestorByTagName("TABLE", elTD);
				if(elTBL !== this.elSelectionStartTable){return;}
	
				this.elLastSelectedTD = elTD;
	
				this._selectBetweenCells(this.elSelectionStartTD, elTD);
	
				break;
			case this.STATUS.CELL_SELECTED:
				break;
		}
	},

	// 셀 선택 상태에서 문서영역을 상/하로 벗어날 경우, 벗어난 방향으로 선택 셀을 늘려가며 문서의 스크롤을 해줌
	$ON_EVENT_OUTER_DOC_MOUSEMOVE : function(wevE){
		switch(this.nStatus){
			case this.STATUS.CELL_SELECTING:
				var htPos = wevE.pos();
				var nYPos = htPos.pageY;
				var nXPos = htPos.pageX;
				if(nYPos < this.htEditingAreaPos.top){
					var y = this.htSelectionSPos.y;
					if(y > 0){
						this.htSelectionSPos.y--;
						this._selectCells(this.htSelectionSPos, this.htSelectionEPos);
	
						var oSelection = this.oApp.getSelection();
						oSelection.selectNodeContents(this.aSelectedCells[0]);
						oSelection.select();
						oSelection.oBrowserSelection.selectNone();
					}
				}else{
					if(nYPos > this.htEditingAreaPos.bottom){
						var y = this.htSelectionEPos.y;
						if(y < this.htMap[0].length - 1){
							this.htSelectionEPos.y++;
							this._selectCells(this.htSelectionSPos, this.htSelectionEPos);
	
							var oSelection = this.oApp.getSelection();
							oSelection.selectNodeContents(this.htMap[this.htSelectionEPos.x][this.htSelectionEPos.y]);
							oSelection.select();
							oSelection.oBrowserSelection.selectNone();
						}
					}
				}
	
				if(nXPos < this.htEditingAreaPos.left){
					var x = this.htSelectionSPos.x;
					if(x > 0){
						this.htSelectionSPos.x--;
						this._selectCells(this.htSelectionSPos, this.htSelectionEPos);
	
						var oSelection = this.oApp.getSelection();
						oSelection.selectNodeContents(this.aSelectedCells[0]);
						oSelection.select();
						oSelection.oBrowserSelection.selectNone();
					}
				}else{
					if(nXPos > this.htEditingAreaPos.right){
						var x = this.htSelectionEPos.x;
						if(x < this.htMap.length - 1){
							this.htSelectionEPos.x++;
							this._selectCells(this.htSelectionSPos, this.htSelectionEPos);
	
							var oSelection = this.oApp.getSelection();
							oSelection.selectNodeContents(this.htMap[this.htSelectionEPos.x][this.htSelectionEPos.y]);
							oSelection.select();
							oSelection.oBrowserSelection.selectNone();
						}
					}
				}
				break;
		}
	},
	
	$ON_EVENT_OUTER_DOC_MOUSEUP : function(wevE){
		this._eventEditingAreaMouseup(wevE);
	},
	
	$ON_EVENT_EDITING_AREA_MOUSEUP : function(wevE){
		this._eventEditingAreaMouseup(wevE);
	},
	
	_eventEditingAreaMouseup : function(wevE){
		if(this.oApp.getEditingMode() != "WYSIWYG"){return;}

		switch(this.nStatus){
			case this.STATUS.S_0:
				break;
			case this.STATUS.MOUSEDOWN_CELL:
				this._changeTableEditorStatus(this.STATUS.S_0);
				break;
			case this.STATUS.CELL_SELECTING:
				this._changeTableEditorStatus(this.STATUS.CELL_SELECTED);
				break;
			case this.STATUS.CELL_SELECTED:
				break;
			}
	},

	/**
	 * Table의 block으로 잡힌 영역을 넘겨준다.
	 * @see hp_SE2M_TableBlockStyler.js
	 */
	$ON_GET_SELECTED_CELLS : function(sAttr,oReturn){
		if(!!this.aSelectedCells){
			oReturn[sAttr] = this.aSelectedCells;
		}
	},

	_coverResizeLayer : function(){
		// [SMARTEDITORSUS-1504] 에디터 전체 크기보다 창이 작아졌을 때 elResizeGrid가 최대화된 elResizeCover으로부터 벗어나는 이슈가 있음
		//this.elResizeCover.style.position = "absolute";
		this.elResizeCover.style.position = "fixed";
		// --[SMARTEDITORSUS-1504]
		
		var size = jindo.$Document().clientSize();
		this.elResizeCover.style.width = size.width - this.nPageLeftRightMargin + "px";
		this.elResizeCover.style.height = size.height - this.nPageTopBottomMargin + "px";
		//this.elResizeCover.style.width = size.width + "px";
		//this.elResizeCover.style.height = size.height + "px";
		//document.body.insertBefore(this.elResizeCover, document.body.firstChild);
		document.body.appendChild(this.elResizeCover);
	},
	
	_uncoverResizeLayer : function(){
		this.elResizeGrid.appendChild(this.elResizeCover);
		this.elResizeCover.style.position = "";
		this.elResizeCover.style.width = "100%";
		this.elResizeCover.style.height = "100%";
	},
	
	_reassignCellSizes : function(elTable){
		var allCells = new Array(2);
		allCells[0] = jindo.$$(">TBODY>TR>TD", elTable, {oneTimeOffCache:true});
		allCells[1] = jindo.$$(">TBODY>TR>TH", elTable, {oneTimeOffCache:true});
		
		var aAllCellsWithSizeInfo = new Array(allCells[0].length + allCells[1].length);
		var numCells = 0;
		
		var nTblBorderPadding = this.parseIntOr0(elTable.border);
		var nTblCellPadding = this.parseIntOr0(elTable.cellPadding);

		// remember all the dimensions first and then assign later.
		// this is done this way because if the table/cell size were set in %, setting one cell size would change size of other cells, which are still yet in %.
		// 1 for TD and 1 for TH
		for(var n = 0; n < 2; n++){
			for(var i = 0; i < allCells[n].length; i++){
				var elCell = allCells[n][i];
				var welCell = jindo.$Element(elCell);
				
				var htBrowser = jindo.$Agent().navigator();
				
				// [SMARTEDITORSUS-1427][SMARTEDITORSUS-1431][SMARTEDITORSUS-1491][SMARTEDITORSUS-1504] IE9, 10에서 Jindo.$Element#css 가 빈 속성값을 1px로 가져오는 문제점이 있어 대체
				/*var nPaddingLeft = this.parseIntOr0(welCell.css("paddingLeft"));
				var nPaddingRight = this.parseIntOr0(welCell.css("paddingRight"));
				var nPaddingTop = this.parseIntOr0(welCell.css("paddingTop"));
				var nPaddingBottom = this.parseIntOr0(welCell.css("paddingBottom"));
				var nBorderLeft = this.parseBorder(welCell.css("borderLeftWidth"), welCell.css("borderLeftStyle"));
				var nBorderRight = this.parseBorder(welCell.css("borderRightWidth"), welCell.css("borderRightStyle"));
				var nBorderTop = this.parseBorder(welCell.css("borderTopWidth"), welCell.css("borderTopStyle"));
				var nBorderBottom = this.parseBorder(welCell.css("borderBottomWidth"), welCell.css("borderBottomStyle"));*/
				var nPaddingLeft, nPaddingRight, nPaddingTop, nPaddingBottom;
				var nBorderLeft, nBorderRight, nBorderTop, nBorderBottom;
				// --[SMARTEDITORSUS-1427][SMARTEDITORSUS-1431][SMARTEDITORSUS-1491][SMARTEDITORSUS-1504]
				
				var nOffsetWidth, nOffsetHeight;
				
				// [SMARTEDITORSUS-1571] IE 10 이상임에도 불구하고, 문서 모드가 8 이하로 설정되어 있는 경우가 있어 메서드 기반 분기로 변경
				if(elCell.getComputedStyle){
				// --[SMARTEDITORSUS-1571]
					// getComputedStyle()로 inherit된 스타일을 획득. IE 8 이하에서는 지원되지 않는다.  
					nPaddingLeft = parseFloat(getComputedStyle(elCell).paddingLeft, 10);
					nPaddingRight = parseFloat(getComputedStyle(elCell).paddingRight, 10);
					nPaddingTop = parseFloat(getComputedStyle(elCell).paddingTop, 10);
					nPaddingBottom = parseFloat(getComputedStyle(elCell).paddingBottom, 10);
					
					// 최초 리사이징 직전 width attribute에서 style의 width로 이행하는 과정에서 미세보정이 있기 때문에 크기가 조금 변한다.
					nBorderLeft = parseFloat(getComputedStyle(elCell).borderLeftWidth, 10);
					nBorderRight = parseFloat(getComputedStyle(elCell).borderRightWidth, 10);
					nBorderTop = parseFloat(getComputedStyle(elCell).borderTopWidth, 10);
					nBorderBottom = parseFloat(getComputedStyle(elCell).borderBottomWidth, 10);
				}else{ // 이 방식은 inherit된 스타일을 가져오지 못하는 문제와 함께, 일부 브라우저의 소수점 값을 버림하는 문제가 있다.
					// [SMARTEDITORSUS-1427][SMARTEDITORSUS-1431][SMARTEDITORSUS-1491]
					nPaddingLeft = this.parseIntOr0(elCell.style.paddingLeft);
					nPaddingRight = this.parseIntOr0(elCell.style.paddingRight);
					nPaddingTop = this.parseIntOr0(elCell.style.paddingTop);
					nPaddingBottom = this.parseIntOr0(elCell.style.paddingBottom);
					// --[SMARTEDITORSUS-1427][SMARTEDITORSUS-1431][SMARTEDITORSUS-1491]
					
					// 기존 로직을 사용. IE의 경우 bug로 분류하여 1px를 획득하도록 설정되어 있다.
					nBorderLeft = this.parseBorder(welCell.css("borderLeftWidth"), welCell.css("borderLeftStyle"));
					nBorderRight = this.parseBorder(welCell.css("borderRightWidth"), welCell.css("borderRightStyle"));
					nBorderTop = this.parseBorder(welCell.css("borderTopWidth"), welCell.css("borderTopStyle"));
					nBorderBottom = this.parseBorder(welCell.css("borderBottomWidth"), welCell.css("borderBottomStyle"));
				}
				
				/**
				 * 매번 발생하는 리사이징 오차를 최소하기 위하여, 2회차부터는 1회차에 적용되는 style 값을 가져온다.
				 * 
				 * width와 height attribute는 최초 1회에 제거된다. 
				 * 즉 2회차부터는, 동적으로 변하는 style의 width, height 값을 그대로 사용한다.
				 * */
				/*nOffsetWidth = elCell.offsetWidth - (nPaddingLeft + nPaddingRight + nBorderLeft + nBorderRight) + "px";
				nOffsetHeight = elCell.offsetHeight - (nPaddingTop + nPaddingBottom + nBorderTop + nBorderBottom) + "px";*/
				var nWidth = jindo.$Element(elCell).attr("width");
				var nHeight = jindo.$Element(elCell).attr("height");
				if(!nWidth && !nHeight){
					nOffsetWidth = elCell.style.width;
					nOffsetHeight = elCell.style.height;
				}else{
					nOffsetWidth = elCell.offsetWidth - (nPaddingLeft + nPaddingRight + nBorderLeft + nBorderRight) + "px";
					nOffsetHeight = elCell.offsetHeight - (nPaddingTop + nPaddingBottom + nBorderTop + nBorderBottom) + "px";
				}
				
				/*if(htBrowser.ie && (htBrowser.nativeVersion >= 9 && htBrowser.nativeVersion <= 10)){
					// IE9, IE10
					// [SMARTEDITORSUS-1427][SMARTEDITORSUS-1431][SMARTEDITORSUS-1491] IE9, 10에서 Jindo.$Element#css 관련 문제에 대응하면 다른 브라우저와 동일한 수식 적용 가능
					//nOffsetWidth = elCell.offsetWidth + "px";
					//nOffsetHeight = elCell.offsetHeight - (nPaddingTop + nPaddingBottom + nBorderTop + nBorderBottom) + "px";
					nOffsetWidth = elCell.offsetWidth - (nPaddingLeft + nPaddingRight + nBorderLeft + nBorderRight) + "px";
					nOffsetHeight = elCell.offsetHeight - (nPaddingTop + nPaddingBottom + nBorderTop + nBorderBottom) + "px";
					// --[SMARTEDITORSUS-1427][SMARTEDITORSUS-1431][SMARTEDITORSUS-1491]
				}else{
					// Firefox, Chrome, IE7, IE8
					nOffsetWidth = elCell.offsetWidth - (nPaddingLeft + nPaddingRight + nBorderLeft + nBorderRight) + "px";
					nOffsetHeight = elCell.offsetHeight - (nPaddingTop + nPaddingBottom + nBorderTop + nBorderBottom) + "px";
				}*/
				// --[SMARTEDITORSUS-1504]
				
				aAllCellsWithSizeInfo[numCells++] = [elCell, nOffsetWidth, nOffsetHeight];
			}
		}
		
		// [SMARTEDITORSUS-2136]
		var nTableWidth = elTable._nWidth, nTableHeight = elTable._nHeight,
		nResizedTableWidth = elTable._nResizedWidth, nResizedTableHeight = elTable._nResizedHeight, // [IE] resizeend 이벤트가 발생했다면 존재
		nTableWidthAdjustRatio = 1, nTableHeightAdjustRatio = 1; // 셀 크기 변경 시 사용되는 보정계수
		
		if(nhn.husky.SE2M_Utils.isNumber(nTableWidth) && nhn.husky.SE2M_Utils.isNumber(nTableHeight)
			&& nhn.husky.SE2M_Utils.isNumber(nResizedTableWidth) && nhn.husky.SE2M_Utils.isNumber(nResizedTableHeight)){ 
			// [IE] resizeend 정보가 기록되어 있다면, 셀 크기 변경 시 보정계수 조정
			nTableWidthAdjustRatio = nResizedTableWidth / nTableWidth,
			nTableHeightAdjustRatio = nResizedTableHeight / nTableHeight;
		}
		
		// [IE] 기록해 둔 resizeend 크기는 일회성으로 사용한다.
		if(elTable._nResizedWidth){
			nhn.husky.SE2M_Utils.deleteProperty(elTable, '_nResizedWidth');
		}
		if(elTable._nResizedHeight){
			nhn.husky.SE2M_Utils.deleteProperty(elTable, '_nResizedHeight');
		}
		// --[SMARTEDITORSUS-2136]
		
		for(var i = 0; i < numCells; i++){
			var aCellInfo = aAllCellsWithSizeInfo[i];

			aCellInfo[0].removeAttribute("width");
			aCellInfo[0].removeAttribute("height");
			
			// [SMARTEDITORSUS-2136] 보정계수를 적용하여 셀의 크기 변경
			aCellInfo[0].style.width = (parseFloat(aCellInfo[1], 10) * nTableWidthAdjustRatio) + 'px';
			aCellInfo[0].style.height = (parseFloat(aCellInfo[2], 10) * nTableHeightAdjustRatio) + 'px';
			// --[SMARTEDITORSUS-2136]
			
//			jindo.$Element(aCellInfo[0]).css("width", aCellInfo[1]);
//			jindo.$Element(aCellInfo[0]).css("height", aCellInfo[2]);
		}

		// [SMARTEDITORSUS-2136] HTMLElement의 속성으로 <table>의 크기 기록
		var welTable = jindo.$Element(elTable);
		elTable._nWidth = welTable.width(),
		elTable._nHeight = welTable.height();
		// --[SMARTEDITORSUS-2136]
		
		elTable.removeAttribute("width");
		elTable.removeAttribute("height");
		elTable.style.width = "";
		elTable.style.height = "";
	},
	
	_fnOnMouseDownResizeCover : function(oEvent){
		this.bResizing = true;
		this.nStartHeight = oEvent.pos().clientY;
		
		// [SMARTEDITORSUS-1504] 표 테두리를 누를 때마다 글양식이 2px씩 세로로 길어지는 문제가 있는데, 이를 위한 flag
		this.bResizingCover = true;
		// --[SMARTEDITORSUS-1504]
		
		this._wfnOnMouseMoveResizeCover.attach(this.elResizeCover, "mousemove");
		this._wfnOnMouseUpResizeCover.attach(document, "mouseup");

		this._coverResizeLayer();
		this.elResizeGrid.style.border = "1px dotted black";

		this.nStartHeight = oEvent.pos().clientY;
		this.nStartWidth = oEvent.pos().clientX;
		
		// [SMARTEDITORSUS-1504] 표 리사이즈용 gripper의 배치를 WYSIWYG 편집 영역 위치 기반으로 개선 
		this.nClientXDiff = this.nStartWidth - this.htResizing.htEPos.clientX;
		this.nClientYDiff = this.nStartHeight - this.htResizing.htEPos.clientY; 
		// --[SMARTEDITORSUS-1504]
		
		this._reassignCellSizes(this.htResizing.elTable);
		
		this.htMap = this._getCellMapping(this.htResizing.elTable);
		var htPosition = this._getBasisCellPosition(this.htResizing.elCell);

		var nOffsetX = (parseInt(this.htResizing.elCell.getAttribute("colspan")) || 1) - 1;
		var nOffsetY = (parseInt(this.htResizing.elCell.getAttribute("rowspan")) || 1) - 1;
		var x = htPosition.x + nOffsetX + this.htResizing.nHA;
		var y = htPosition.y + nOffsetY + this.htResizing.nVA;

		if(x < 0 || y < 0){return;}

		this.htAllAffectedCells = this._getAllAffectedCells(x, y, this.htResizing.nResizeMode, this.htResizing.elTable);
	},

	_fnOnMouseMoveResizeCover : function(oEvent){
		// [SMARTEDITORSUS-1504] 표 모서리 Drag 사용성 개선
		// - 최초 리사이징 후 해당 위치에서 바로 마우스를 눌러 Drag 가능
		if(jindo.$Agent().navigator().chrome || jindo.$Agent().navigator().safari){
			if(this.htResizing.nPreviousResizeMode != undefined && this.htResizing.nPreviousResizeMode != 0){
				if(this.htResizing.nResizeMode != this.htResizing.nPreviousResizeMode){
					this.htResizing.nResizeMode = this.htResizing.nPreviousResizeMode;
					this._showResizer();
				}
			}
		}
		// --[SMARTEDITORSUS-1504]
		
		var nHeightChange = oEvent.pos().clientY - this.nStartHeight;
		var nWidthChange = oEvent.pos().clientX - this.nStartWidth;

		var oEventPos = oEvent.pos();

		// [SMARTEDITORSUS-1504] 표 리사이즈용 gripper의 배치를 WYSIWYG 편집 영역 위치 기반으로 개선
		/*if(this.htResizing.nResizeMode == 1){
			this.elResizeGrid.style.left = oEventPos.pageX - this.parseIntOr0(this.elResizeGrid.style.width)/2 + "px";
		}else{
			this.elResizeGrid.style.top = oEventPos.pageY - this.parseIntOr0(this.elResizeGrid.style.height)/2 + "px";
		}*/
		if(this.htResizing.nResizeMode == 1){
			this.elResizeGrid.style.left = oEvent.pos().clientX - this.nClientXDiff - this.parseIntOr0(this.elResizeGrid.style.width)/2 + "px";
		}else{
			this.elResizeGrid.style.top = oEvent.pos().clientY - this.nClientYDiff - this.parseIntOr0(this.elResizeGrid.style.height)/2 + "px";
		}
		// --[SMARTEDITORSUS-1504]
	},

	_fnOnMouseUpResizeCover : function(oEvent){
		this.bResizing = false;
		this._hideResizer();
		this._uncoverResizeLayer();
		this.elResizeGrid.style.border = "";

		this._wfnOnMouseMoveResizeCover.detach(this.elResizeCover, "mousemove");
		this._wfnOnMouseUpResizeCover.detach(document, "mouseup");

		var nHeightChange = 0;
		var nWidthChange = 0;

		if(this.htResizing.nResizeMode == 2){
			nHeightChange = oEvent.pos().clientY - this.nStartHeight;
		}
		if(this.htResizing.nResizeMode == 1){
			nWidthChange = oEvent.pos().clientX - this.nStartWidth;
			
			if(this.htAllAffectedCells.nMinBefore != -1 && nWidthChange < -1*this.htAllAffectedCells.nMinBefore){
				nWidthChange = -1 * this.htAllAffectedCells.nMinBefore + this.MIN_CELL_WIDTH;
			}
			if(this.htAllAffectedCells.nMinAfter != -1 && nWidthChange > this.htAllAffectedCells.nMinAfter){
				nWidthChange = this.htAllAffectedCells.nMinAfter - this.MIN_CELL_WIDTH;
			}
		}
		
		// [SMARTEDITORSUS-1504] FireFox는 소수점으로 size가 나오는데, parseInt는 소수점 이하를 버림
		// [SMARTEDITORSUS-1655] 메서드, 프로퍼티 기반 리팩토링
		var width, height;
		// --[SMARTEDITORSUS-1655]

		var aCellsBefore = this.htAllAffectedCells.aCellsBefore;
		for(var i = 0; i < aCellsBefore.length; i++){
			var elCell = aCellsBefore[i];
			
			// [SMARTEDITORSUS-1655]
			width = 0, height = 0;
	
			width = elCell.style.width;
			if(isNaN(parseFloat(width, 10))){ // 값이 없거나 "auto"인 경우
				width = 0;
			}else{
				width = parseFloat(width, 10);
			}
			width += nWidthChange;
	
			height = elCell.style.height;
			if(isNaN(parseFloat(height, 10))){ // 값이 없거나 "auto"인 경우
				height = 0;
			}else{
				height = parseFloat(height, 10);
			}
			height += nHeightChange;
			// --[SMARTEDITORSUS-1655]
	
			//var width = this.parseIntOr0(elCell.style.width) + nWidthChange;
			elCell.style.width = Math.max(width, this.MIN_CELL_WIDTH) + "px";
			
			//var height = this.parseIntOr0(elCell.style.height) + nHeightChange;
			elCell.style.height = Math.max(height, this.MIN_CELL_HEIGHT) + "px";
		}
			
		var aCellsAfter = this.htAllAffectedCells.aCellsAfter;
		for(var i = 0; i < aCellsAfter.length; i++){
			var elCell = aCellsAfter[i];

			// [SMARTEDITORSUS-1655]
			width = 0, height = 0;
			
			width = elCell.style.width;
			if(isNaN(parseFloat(width, 10))){ // 값이 없거나 "auto"인 경우
				width = 0;
			}else{
				width = parseFloat(width, 10);
			}
			width -= nWidthChange;
	
			height = elCell.style.height;
			if(isNaN(parseFloat(height, 10))){ // 값이 없거나 "auto"인 경우
				height = 0;
			}else{
				height = parseFloat(height, 10);
			}
			height -= nHeightChange;
			// --[SMARTEDITORSUS-1655]		
			
			//var width = this.parseIntOr0(elCell.style.width) - nWidthChange;
			elCell.style.width = Math.max(width, this.MIN_CELL_WIDTH) + "px";
			
			//var height = this.parseIntOr0(elCell.style.height) - nHeightChange;
			elCell.style.height = Math.max(height, this.MIN_CELL_HEIGHT) + "px";
		}
		// --[SMARTEDITORSUS-1504]
		
		// [SMARTEDITORSUS-1504] 표 테두리를 누를 때마다 글양식이 2px씩 세로로 길어지는 문제가 있는데, 이를 위한 flag
		this.bResizingCover = false;
		// --[SMARTEDITORSUS-1504]
	},

	/**
	 * [SMARTEDITORSUS-2136] [IE 9, 10] resizeend 이벤트 handler
	 * [IE 11] resizeend 이벤트 deprecated : pointerup 이벤트로 갈음한다.
	 * */
	_fnOnResizeEndTable : function(oEvent){
		var wev = jindo.$Event(oEvent);
		var elTable = wev.element;
		
		this._markResizedMetric(elTable);
	},
	
	/**
	 * [SMARTEDITORSUS-2136] [IE 8-] resizeend 이벤트 handler
	 * */
	_getTableResizeEndHandler : function(elTable){
		return jindo.$Fn(this._markResizedMetric, this).bind(elTable);
	},
	
	/**
	 * [SMARTEDITORSUS-2136] [IE] resizeend 이벤트 발생 시
	 * 이 경우에 변화하는 표의 크기를 기록해 두고
	 * 셀 크기 변경 시 보정에 사용한다.
	 * */
	_markResizedMetric : function(elTable){
		if(!elTable || (elTable.tagName.toUpperCase() !== 'TABLE')){
			return;
		}
		
		// HTMLElement의 속성으로 resize된 <table>의 크기 기록
		var welCurrentTable = jindo.$Element(elTable);
		elTable._nResizedWidth = welCurrentTable.width(),
		elTable._nResizedHeight = welCurrentTable.height();
	},
	
	$ON_CLOSE_QE_LAYER : function(oEvent){
		// [SMARTEDITORSUS-2137] 퀵에디터의 접기/펼치기 클릭 시에는, cell의 상태를 변경하지 않는다.
		var elTarget = oEvent ? oEvent.element : null,
		welTarget = elTarget ? jindo.$Element(elTarget) : null,
		aQEToggleClassName = ['q_open_table_fold', 'q_open_table_full'], sQEToggleClassName,
		i, len = aQEToggleClassName.length,
		isFromQEToggle = false;
		
		if(welTarget){
			for(i = len; i--;){
				sQEToggleClassName = aQEToggleClassName[i];
				if(welTarget.hasClass(sQEToggleClassName)){
					isFromQEToggle = true;
					break;
				}
			}
		}

		if(isFromQEToggle){
			return;
		}
		// --[SMARTEDITORSUS-2137]
		
		this._changeTableEditorStatus(this.STATUS.S_0);
	},
	
	_changeTableEditorStatus : function(nNewStatus){
		if(this.nStatus == nNewStatus){return;}
		this.nStatus = nNewStatus;

		switch(nNewStatus){
			case this.STATUS.S_0:
				if(this.nStatus == this.STATUS.MOUSEDOWN_CELL){
					break;
				}
	
				this._deselectCells();
				
				// 히스토리 저장 (선택 위치는 저장하지 않음)
				if(!!this.sQEAction){
					this.oApp.exec("RECORD_UNDO_ACTION", [this.sQEAction, {elSaveTarget:this.elSelectionStartTable, bDontSaveSelection:true}]); 
					this.sQEAction = "";
				}
				
				if(this.oApp.oNavigator["safari"] || this.oApp.oNavigator["chrome"]){
					this.oApp.getWYSIWYGDocument().onselectstart = null;
				}
	
				this.oApp.exec("ENABLE_WYSIWYG", []);
				this.oApp.exec("CLOSE_QE_LAYER");
				
				this.elSelectionStartTable = null;
				break;
			case this.STATUS.CELL_SELECTING:
				// [SMARTEDITORSUS-2155] Legacy Event Methods (https://msdn.microsoft.com/en-us/library/ms536742(v=vs.85).aspx)
				if(this.oApp.oNavigator.ie && (typeof(document.body.setCapture) === 'function')){
					document.body.setCapture(false);
				}
				break;
			case this.STATUS.CELL_SELECTED:
				this.oApp.delayedExec("MSG_CELL_SELECTED", [], 0);
				// [SMARTEDITORSUS-2155] Legacy Event Methods (https://msdn.microsoft.com/en-us/library/ms536742(v=vs.85).aspx)
				if(this.oApp.oNavigator.ie && (typeof(document.body.releaseCapture) === 'function')){
					document.body.releaseCapture();
				}
				break;
		}

		this.oApp.exec("TABLE_EDITOR_STATUS_CHANGED", [this.nStatus]);
	},
	
	_isOnBorder : function(wevE){
		// ===========================[Start: Set/init global resizing info]===========================
		// 0: not resizing
		// 1: horizontal resizing
		// 2: vertical resizing
		this.htResizing.nResizeMode = 0;
		this.htResizing.elCell = wevE.element;
		// [SMARTEDITORSUS-1672]
		//if(wevE.element.tagName != "TD" && wevE.element.tagName != "TH"){return false;}
		if(!this._rxCellNames.test(wevE.element.tagName)){return false;}
		// --[SMARTEDITORSUS-1672]
		
		this.htResizing.elTable = nhn.husky.SE2M_Utils.findAncestorByTagName("TABLE", this.htResizing.elCell);
		if(!this.htResizing.elTable){return;}

		if(!jindo.$Element(this.htResizing.elTable).hasClass(this._sSETblClass) && !jindo.$Element(this.htResizing.elTable).hasClass(this._sSEReviewTblClass)){return;}
		
		// Adjustment variables: to be used to map the x, y position of the resizing point relative to elCell
		// eg) When left border of a cell at 2,2 is selected, the actual cell that has to be resized is the one at 1,2. So, set the horizontal adjustment to -1.
		// Vertical Adjustment
		this.htResizing.nVA = 0;
		// Horizontal Adjustment
		this.htResizing.nHA = 0;

		this.htResizing.nBorderLeftPos = 0;
		this.htResizing.nBorderTopPos = -1;
		this.htResizing.htEPos = wevE.pos(true);
		this.htResizing.nBorderSize = this.parseIntOr0(this.htResizing.elTable.border);
		// ===========================[E N D: Set/init global resizing info]===========================

		// Separate info is required as the offsetX/Y are different in IE and FF
		// For IE, (0, 0) is top left corner of the cell including the border.
		// For FF, (0, 0) is top left corner of the cell excluding the border.
		var nAdjustedDraggableCellEdge1;
		var nAdjustedDraggableCellEdge2;
		if(jindo.$Agent().navigator().ie || jindo.$Agent().navigator().safari){
			nAdjustedDraggableCellEdge1 = this.htResizing.nBorderSize + this.nDraggableCellEdge;
			nAdjustedDraggableCellEdge2 = this.nDraggableCellEdge;
		}else{
			nAdjustedDraggableCellEdge1 = this.nDraggableCellEdge;
			nAdjustedDraggableCellEdge2 = this.htResizing.nBorderSize + this.nDraggableCellEdge;
		}
		
		// [SMARTEDITORSUS-1504] 경계선 판별에 사용
		var elCellWidth = this.htResizing.elCell.clientWidth,  
		elCellHeight = this.htResizing.elCell.clientHeight;
		
		nRightBorderCriteria = elCellWidth - this.htResizing.htEPos.offsetX,
		nBottomBorderCriteria = elCellHeight - this.htResizing.htEPos.offsetY;
		// --[SMARTEDITORSUS-1504]
		
 		// top border of the cell is selected
		if(this.htResizing.htEPos.offsetY <= nAdjustedDraggableCellEdge1){
			// [SMARTEDITORSUS-2136] resizeend 이후 표의 상단 테두리에 resize grip이 생성되면 스크립트 오류를 발생시킨다.
			var _isFirstRow = false,
			_elRow = this.htResizing.elCell.parentNode;
			var _elTbody = _elRow.parentNode;
			var _aRow = jindo.$$('tr', _elTbody, {oneTimeOffCache : true});
			if(_aRow[0] == _elRow){
				_isFirstRow = true;
			}
			// --[SMARTEDITORSUS-2136]
			// top border of the first cell can't be dragged
			if(_isFirstRow){
				this.htResizing.nVA = -1;
				
				// [SMARTEDITORSUS-1504] 표 리사이즈용 gripper 배치 개선
				//this.htResizing.nResizeMode = 2;
				this.htResizing.nResizeMode = 4;
				// --[SMARTEDITORSUS-1504]
			}
		}
		// bottom border of the cell is selected
		// [SMARTEDITORSUS-1504] 표 모서리 Drag 사용성 개선
		//if(this.htResizing.elCell.offsetHeight-nAdjustedDraggableCellEdge2 <= this.htResizing.htEPos.offsetY){
		if(nBottomBorderCriteria <= nAdjustedDraggableCellEdge2){
			this.htResizing.nBorderTopPos = this.htResizing.elCell.offsetHeight + nAdjustedDraggableCellEdge1 - 1;
			this.htResizing.nResizeMode = 2;
		}
		// --[SMARTEDITORSUS-1504]
		
		// left border of the cell is selected
		if(this.htResizing.htEPos.offsetX <= nAdjustedDraggableCellEdge1){
			// left border of the first cell can't be dragged
			// [SMARTEDITORSUS-1504] 표 리사이즈용 gripper 배치 개선
			// 일반 표는 아래 if문을 거치지 않지만, 글양식의 경우 가장 좌측 cell의 previousSibling이 textNode이기 때문에 if문에 부합하는 문제가 있었다.
			/*if(this.htResizing.elCell.previousSibling){
				this.htResizing.nHA = -1;
				
				this.htResizing.nResizeMode = 0;
			}*/
			
			// 가장 좌측의 cell은 그 offsetLeft가 table의 scrollLeft와 같다.
			if(this.htResizing.elTable.scrollLeft != this.htResizing.elCell.offsetLeft){
				this.htResizing.nHA = -1;
				
				this.htResizing.nResizeMode = 3;
			}
			// --[SMARTEDITORSUS-1504]
		}
		// right border of the cell is selected
		// [SMARTEDITORSUS-1504] 표 모서리 Drag 사용성 개선
		//if(this.htResizing.elCell.offsetWidth - nAdjustedDraggableCellEdge2 <= this.htResizing.htEPos.offsetX){
		if(nRightBorderCriteria <= nAdjustedDraggableCellEdge1){
			this.htResizing.nBorderLeftPos = this.htResizing.elCell.offsetWidth + nAdjustedDraggableCellEdge1 - 1;
			this.htResizing.nResizeMode = 1;
		}
		// --[SMARTEDITORSUS-1504]
		
		// [SMARTEDITORSUS-1504] 표 모서리 Drag 사용성 개선
		if(jindo.$Agent().navigator().chrome || jindo.$Agent().navigator().safari){
			if(!this.htResizing.elPreviousCell){
				this.htResizing.elPreviousCell = this.htResizing.elCell;
			}else{
				if(this.htResizing.elCell != this.htResizing.elPreviousCell){
					this.htResizing.elPreviousCell = this.htResizing.elCell;
				}
			}
		}
		// --[SMARTEDITORSUS-1504]
		
		if(this.htResizing.nResizeMode === 0){return false;}
		
		return true;
	},
	
	_showCellResizeGrip : function(){
		// [SMARTEDITORSUS-2136] 표 상단 테두리에는 resize grip을 표시하지 않는다.
		if(this.htResizing.nResizeMode == 4){
			return;
		}
		// --[SMARTEDITORSUS-2136]
		
		// [SMARTEDITORSUS-1504] gripper가 WYSIWYG 편집영역 위치정보에 기반하여 배치되도록 변경
		// 만약 iframe 내부에 gripper를 생성한다면, 커서 위치를 기반으로 생성해 주면 됨
		if(this.htResizing.nResizeMode == 1 || this.htResizing.nResizeMode == 3){
			this.elResizeCover.style.cursor = "col-resize";
		}else if(this.htResizing.nResizeMode == 2){
			this.elResizeCover.style.cursor = "row-resize";
		}

		this._showResizer();
		
		// gripper는 대상 셀에서 어느 경계 위에 커서가 위치했느냐에 기반하여 배치
		if(this.htResizing.nResizeMode == 1){ // 오른쪽 경계
			this._setResizerSize((this.htResizing.nBorderSize + this.nDraggableCellEdge) * 2, this.parseIntOr0(jindo.$Element(this.elIFrame).css("height")));
			this.elResizeGrid.style.top = "0px";
			this.elResizeGrid.style.left = this.htResizing.elCell.clientWidth + this.htResizing.htEPos.clientX - this.htResizing.htEPos.offsetX - this.parseIntOr0(this.elResizeGrid.style.width)/2 + "px";
		}else if(this.htResizing.nResizeMode == 2){ // 아래쪽 경계
			//가변폭을 지원하기 때문에 매번 현재 Container의 크기를 구해와서 Grip을 생성해야 한다.
			var elIFrameWidth = this.oApp.elEditingAreaContainer.offsetWidth + "px";
			this._setResizerSize(this.parseIntOr0(elIFrameWidth), (this.htResizing.nBorderSize + this.nDraggableCellEdge) * 2);
			this.elResizeGrid.style.top = this.htResizing.elCell.clientHeight + this.htResizing.htEPos.clientY - this.htResizing.htEPos.offsetY - this.parseIntOr0(this.elResizeGrid.style.height)/2 + "px";
			this.elResizeGrid.style.left = "0px";
		}else if(this.htResizing.nResizeMode == 3){ // 왼쪽 경계
			this._setResizerSize((this.htResizing.nBorderSize + this.nDraggableCellEdge) * 2, this.parseIntOr0(jindo.$Element(this.elIFrame).css("height")));
			this.elResizeGrid.style.top = "0px";
			this.elResizeGrid.style.left = + this.htResizing.htEPos.clientX - this.htResizing.htEPos.offsetX - this.parseIntOr0(this.elResizeGrid.style.width)/2 + "px";
			
			// 이후 작업들은 오른쪽 경계를 기준으로 일괄처리
			this.htResizing.nResizeMode = 1;
		}
		 // --[SMARTEDITORSUS-1504]
	},
	
	_getAllAffectedCells : function(basis_x, basis_y, iResizeMode, oTable){
		if(!oTable){return [];}

		var oTbl = this._getCellMapping(oTable);
		var iTblX = oTbl.length;
		var iTblY = oTbl[0].length;

		// 선택 테두리의 앞쪽 셀
		var aCellsBefore = [];
		// 선택 테두리의 뒤쪽 셀
		var aCellsAfter = [];
		
		var htResult;

		var nMinBefore = -1, nMinAfter = -1;
		// horizontal resizing -> need to get vertical rows
		if(iResizeMode == 1){
			for(var y = 0; y < iTblY; y++){
				if(aCellsBefore.length>0 && aCellsBefore[aCellsBefore.length-1] == oTbl[basis_x][y]){continue;}
				aCellsBefore[aCellsBefore.length] = oTbl[basis_x][y];

				var nWidth = parseInt(oTbl[basis_x][y].style.width);
				if(nMinBefore == -1 || nMinBefore > nWidth){
					nMinBefore = nWidth;
				}
			}
			
			if(oTbl.length > basis_x+1){
				for(var y = 0; y < iTblY; y++){
					if(aCellsAfter.length>0 && aCellsAfter[aCellsAfter.length-1] == oTbl[basis_x+1][y]){continue;}
					aCellsAfter[aCellsAfter.length] = oTbl[basis_x+1][y];

					var nWidth = parseInt(oTbl[basis_x + 1][y].style.width);
					if(nMinAfter == -1 || nMinAfter > nWidth){
						nMinAfter = nWidth;
					}
				}
			}
			htResult = {aCellsBefore: aCellsBefore, aCellsAfter: aCellsAfter, nMinBefore: nMinBefore, nMinAfter: nMinAfter};
		}else{
			for(var x = 0; x < iTblX; x++){
				if(aCellsBefore.length>0 && aCellsBefore[aCellsBefore.length - 1] == oTbl[x][basis_y]){continue;}
				aCellsBefore[aCellsBefore.length] = oTbl[x][basis_y];

				if(nMinBefore == -1 || nMinBefore > oTbl[x][basis_y].style.height){
					nMinBefore = oTbl[x][basis_y].style.height;
				}
			}
			// 높이 리사이징 시에는 선택 테두리 앞쪽 셀만 조절 함으로 아래쪽 셀은 생성 할 필요 없음
			
			htResult = {aCellsBefore: aCellsBefore, aCellsAfter: aCellsAfter, nMinBefore: nMinBefore, nMinAfter: nMinAfter};
		}

		return htResult;
	},
	
	_createCellResizeGrip : function(){
		this.elTmp = document.createElement("DIV");
		try{
			this.elTmp.innerHTML = '<div style="position:absolute; overflow:hidden; z-index: 99; "><div onmousedown="return false" style="background-color:#000000;filter:alpha(opacity=0);opacity:0.0;-moz-opacity:0.0;-khtml-opacity:0.0;cursor: col-resize; left: 0px; top: 0px; width: 100%; height: 100%;font-size:1px;z-index: 999; "></div></div>';
			this.elResizeGrid = this.elTmp.firstChild;
			this.elResizeCover = this.elResizeGrid.firstChild;
		}catch(e){}
		
		// [SMARTEDITORSUS-1504] gripper를 WYSIWYG 편집 영역 위치 정보에 기반하여 배치하도록 개선
		//document.body.appendChild(this.elResizeGrid);
		// document.body 대신 WYSIWYG 편집 영역을 둘러싼 container div에 추가
		var oContainer = jindo.$$.getSingle(".husky_seditor_editing_area_container");
		oContainer.appendChild(this.elResizeGrid);
		// --[SMARTEDITORSUS-1504]
	},
	
	_selectAll_Row : function(){
		this.htSelectionSPos.x = 0;
		this.htSelectionEPos.x = this.htMap.length - 1;
		this._selectCells(this.htSelectionSPos, this.htSelectionEPos);
	},
	
	_selectAll_Column : function(){
		this.htSelectionSPos.y = 0;
		this.htSelectionEPos.y = this.htMap[0].length - 1;
		this._selectCells(this.htSelectionSPos, this.htSelectionEPos);
	},
	
	_deleteSelectedCells : function(){
		var elTmp;

		for(var i = 0, nLen = this.aSelectedCells.length; i < nLen; i++){
			elTmp = this.aSelectedCells[i];
			
			// [SMARTEDITORSUS-1533] 삭제되는 열 바로 뒤에 인접한 빈 텍스트 노드도 함께 삭제하여 DOM 트리 일관성 유지 
			var htBrowser = jindo.$Agent().navigator();
			if(htBrowser.ie && (htBrowser.nativeVersion == 9 || htBrowser.nativeVersion == 10) && (htBrowser.version == 9 || htBrowser.version == 10)){
				this._removeEmptyTextNode_IE(elTmp);
			}
			// --[SMARTEDITORSUS-1533]
			
			elTmp.parentNode.removeChild(elTmp);
		}

		var aTR = jindo.$$(">TBODY>TR", this.elSelectionStartTable, {oneTimeOffCache:true});
		var nSelectionWidth = this.htSelectionEPos.x - this.htSelectionSPos.x + 1;
		var nWidth = this.htMap.length;
		if(nSelectionWidth == nWidth){
			for(var i = 0, nLen = aTR.length; i < nLen; i++){
				elTmp = aTR[i];

				// There can be empty but necessary TR's because of Rowspan
				if(!this.htMap[0][i] || !this.htMap[0][i].parentNode || this.htMap[0][i].parentNode.tagName !== "TR"){
					// [SMARTEDITORSUS-1533] 삭제되는 행 바로 뒤에 인접한 빈 텍스트 노드도 함께 삭제하여 DOM 트리 일관성 유지
					var htBrowser = jindo.$Agent().navigator();
					if(htBrowser.ie && (htBrowser.nativeVersion == 9 || htBrowser.nativeVersion == 10) && (htBrowser.version == 9 || htBrowser.version == 10)){
						this._removeEmptyTextNode_IE(elTmp);
					}
					// --[SMARTEDITORSUS-1533]
					
					elTmp.parentNode.removeChild(elTmp);
				}
			}

			aTR = jindo.$$(">TBODY>TR", this.elSelectionStartTable, {oneTimeOffCache:true});
		}

		if(aTR.length < 1){
			this.elSelectionStartTable.parentNode.removeChild(this.elSelectionStartTable);
		}
		
		this._updateSelection();
	},
	
	_insertColumnAfter : function(){
		this._removeClassFromSelection();
		this._hideTableTemplate(this.elSelectionStartTable);

		var aTR = jindo.$$(">TBODY>TR", this.elSelectionStartTable, {oneTimeOffCache:true});
		var sInserted;
		var sTmpAttr_Inserted = "_tmp_inserted";
		var elCell, elCellClone, elCurTR, elInsertionPt;
		// copy each cells in the following order: top->down, right->left
		// +---+---+---+---+
		// |...|.2.|.1.|...|
		// |---+---+.1.|...|
		// |...|.3.|.1.|...|
		// |...|.3.+---+...|
		// |...|.3.|.4.+...|
		// |...+---+---+...|
		// |...|.6.|.5.|...|
		// +---+---+---+---+
		
		// [SMARTEDITORSUS-991] IE는 insertionPt의 previousSibling에도 배경색을 적용해줘야 할 필요가 있음.
		var htBrowser = jindo.$Agent().navigator();
		// --[SMARTEDITORSUS-991]
		
		for(var y = 0, nYLen = this.htMap[0].length; y < nYLen; y++){
			elCurTR = aTR[y];
			for(var x = this.htSelectionEPos.x; x >= this.htSelectionSPos.x; x--){
				elCell = this.htMap[x][y];
				//sInserted = elCell.getAttribute(sTmpAttr_Inserted);
				//if(sInserted){continue;}

				//elCell.setAttribute(sTmpAttr_Inserted, "o");
				elCellClone = this._shallowCloneTD(elCell);
				
				// elCellClone의 outerHTML에 정상적인 rowSpan이 있더라도 IE에서는 이 위치에서 항상 1을 반환. (elCellClone.rowSpan & elCellClone.getAttribute("rowSpan")).
				//var nSpan = parseInt(elCellClone.getAttribute("rowSpan"));
				var nSpan = parseInt(elCell.getAttribute("rowSpan"));

				if(nSpan > 1){
					elCellClone.setAttribute("rowSpan", 1);
					elCellClone.style.height = "";
				}
				nSpan = parseInt(elCell.getAttribute("colSpan"));

				if(nSpan > 1){
					elCellClone.setAttribute("colSpan", 1);
					elCellClone.style.width = "";
				}
				
				// 현재 줄(TR)에 속한 셀(TD)을 찾아서 그 앞에 append 한다.
				elInsertionPt = null;
				for(var xx = this.htSelectionEPos.x; xx >= this.htSelectionSPos.x; xx--){
					if(this.htMap[xx][y].parentNode == elCurTR){
						elInsertionPt = this.htMap[xx][y].nextSibling;
						break;
					}
				}
				elCurTR.insertBefore(elCellClone, elInsertionPt);
				
				// [SMARTEDITORSUS-1742][SMARTEDITORSUS-1842] 배경색이 바로 반영되지 않는 버그로 인해 명시
				// [SMARTEDITORSUS-2155] Win10 Spartan
				if((htBrowser.edge && (Math.floor(htBrowser.version) === 12)) || (htBrowser.ie && (htBrowser.nativeVersion >= 9 || htBrowser.nativeVersion <= 11) && (htBrowser.version >= 9 || htBrowser.version <= 11))){
					elCellClone.style.cssText = elCellClone.style.cssText;
				}
				// --[SMARTEDITORSUS-1742][SMARTEDITORSUS-1842][SMARTEDITORSUS-2155]
			}
		}
		// remove the insertion marker from the original cells
		for(var i = 0, nLen = this.aSelectedCells.length; i < nLen; i++){
			this.aSelectedCells[i].removeAttribute(sTmpAttr_Inserted);
		}

		var nSelectionWidth = this.htSelectionEPos.x - this.htSelectionSPos.x + 1;
		var nSelectionHeight = this.htSelectionEPos.y - this.htSelectionSPos.y + 1;
		this.htSelectionSPos.x += nSelectionWidth;
		this.htSelectionEPos.x += nSelectionWidth;

		this.htMap = this._getCellMapping(this.elSelectionStartTable);
		this._selectCells(this.htSelectionSPos, this.htSelectionEPos);

		this._showTableTemplate(this.elSelectionStartTable);
		this._addClassToSelection();

		this.sQEAction = "INSERT_TABLE_COLUMN";
		
		this.oApp.exec("SHOW_COMMON_QE");
	},
	
	_insertRowBelow : function(){
		this._selectAll_Row();

		this._removeClassFromSelection();
		this._hideTableTemplate(this.elSelectionStartTable);

		var elRowClone;
		var elTBody = this.htMap[0][0].parentNode.parentNode;
		
		var aTRs = jindo.$$(">TR", elTBody, {oneTimeOffCache:true});
		var elInsertionPt = aTRs[this.htSelectionEPos.y + 1] || null;

		// [SMARTEDITORSUS-991] IE는 insertionPt의 previousSibling에도 배경색을 적용해줘야 할 필요가 있음.
		var htBrowser = jindo.$Agent().navigator();
		// --[SMARTEDITORSUS-991]
		
		for(var y = this.htSelectionSPos.y; y <= this.htSelectionEPos.y; y++){
			elRowClone = this._getTRCloneWithAllTD(y);
			elTBody.insertBefore(elRowClone, elInsertionPt);
			
			// [SMARTEDITORSUS-991] IE는 insertionPt의 previousSibling에도 추가로 배경색을 적용해줘야 할 필요가 있음.
			//if(htBrowser.ie && htBrowser.nativeVersion >= 9){
			// [SMARTEDITORSUS-1533] 문서모드가 9~10인 IE 9~10에서 빈 텍스트 노드가 인식된다.
			// [SMARTEDITORSUS-1842]
			// [SMARTEDITORSUS-2155] Win10 Spartan
			if((htBrowser.edge && (Math.floor(htBrowser.version) === 12)) || (htBrowser.ie && (htBrowser.nativeVersion >= 9 || htBrowser.nativeVersion <= 11) && (htBrowser.version >= 9 || htBrowser.version <= 11))){
			// --[SMARTEDITORSUS-1842][SMARTEDITORSUS-2155]
				// 스타일을 적용시켜 줄 대상 tr
				var elPreviousSiblingParent = this.htMap[0][y].parentNode;
				
				var aOriginalPreviousSibling = elPreviousSiblingParent.childNodes;
				var aPreviousSibling = [];
				for(var i = 0, len = aOriginalPreviousSibling.length; i < len; i++){
					// [SMARTEDITORSUS-1742]
					//aPreviousSibling.push(aOriginalPreviousSibling[i]);
					if(this._rxCellNames.test(aOriginalPreviousSibling[i].nodeName)){
						aPreviousSibling.push(aOriginalPreviousSibling[i].cloneNode());
					}
					// --[SMARTEDITORSUS-1742]
				}
				
				// 배경색을 복사하기 위해 준비
				var aCellClone = elRowClone.childNodes;

				for(var i = 0, len = aCellClone.length; i < len; i++){
					var elCloneTD = aCellClone[i];
					
					var elPreviousTD = aPreviousSibling[i];
					// [SMARTEDITORSUS-1639] 병합 후 추가시 JS 오류가 발생하는 문제가 있어 nodeName 확인
					// [SMARTEDITORSUS-1672]
					//if(elCloneTD.nodeName == "TD" && elPreviousTD && elPreviousTD.nodeName == "TD"){
					if(this._rxCellNames.test(elCloneTD.nodeName) && elPreviousTD && this._rxCellNames.test(elPreviousTD.nodeName)){
					// --[SMARTEDITORSUS-1672]
						// [SMARTEDITORSUS-1742] 
						//elPreviousTD.style.backgroundColor = elCloneTD.style.backgroundColor;
						elCloneTD.style.cssText = elPreviousTD.style.cssText;
						// --[SMARTEDITORSUS-1742]
					}
				}
			}
			// --[SMARTEDITORSUS-991]
		}

		var nSelectionWidth = this.htSelectionEPos.x - this.htSelectionSPos.x + 1;
		var nSelectionHeight = this.htSelectionEPos.y - this.htSelectionSPos.y + 1;
		this.htSelectionSPos.y += nSelectionHeight;
		this.htSelectionEPos.y += nSelectionHeight;

		this.htMap = this._getCellMapping(this.elSelectionStartTable);
		this._selectCells(this.htSelectionSPos, this.htSelectionEPos);

		this._showTableTemplate(this.elSelectionStartTable);
		this._addClassToSelection();

		this.sQEAction = "INSERT_TABLE_ROW";
		
		this.oApp.exec("SHOW_COMMON_QE");
	},

	_updateSelection : function(){
		this.aSelectedCells = jindo.$A(this.aSelectedCells).filter(function(v){return (v.parentNode!==null && v.parentNode.parentNode!==null);}).$value();
	},
	
	_startCellSelection : function(){
		this.htMap = this._getCellMapping(this.elSelectionStartTable);

		// De-select the default selection
		this.oApp.getEmptySelection().oBrowserSelection.selectNone();

		if(this.oApp.oNavigator["safari"] || this.oApp.oNavigator["chrome"]){
			this.oApp.getWYSIWYGDocument().onselectstart = function(){return false;};
		}
		
		var elIFrame = this.oApp.getWYSIWYGWindow().frameElement;
		this.htEditingAreaPos = jindo.$Element(elIFrame).offset();
		this.htEditingAreaPos.height = elIFrame.offsetHeight;
		this.htEditingAreaPos.bottom = this.htEditingAreaPos.top + this.htEditingAreaPos.height;
		this.htEditingAreaPos.width = elIFrame.offsetWidth;
		this.htEditingAreaPos.right = this.htEditingAreaPos.left + this.htEditingAreaPos.width;

/*
		if(!this.oNavigatorInfo["firefox"]){
			this.oApp.exec("DISABLE_WYSIWYG", []);
		}
*/
		this._changeTableEditorStatus(this.STATUS.CELL_SELECTING);
	},

	_selectBetweenCells : function(elCell1, elCell2){
		this._deselectCells();
		
		var oP1 = this._getBasisCellPosition(elCell1);
		var oP2 = this._getBasisCellPosition(elCell2);
		this._setEndPos(oP1);
		this._setEndPos(oP2);

		var oStartPos = {}, oEndPos = {};

		oStartPos.x = Math.min(oP1.x, oP1.ex, oP2.x, oP2.ex);
		oStartPos.y = Math.min(oP1.y, oP1.ey, oP2.y, oP2.ey);

		oEndPos.x = Math.max(oP1.x, oP1.ex, oP2.x, oP2.ex);
		oEndPos.y = Math.max(oP1.y, oP1.ey, oP2.y, oP2.ey);

		this._selectCells(oStartPos, oEndPos);
	},

	_getNextCell : function(elCell){
		while(elCell){
			elCell = elCell.nextSibling;
			if(elCell && elCell.tagName && elCell.tagName.match(/^TD|TH$/)){return elCell;}
		}
		
		return null;
	},

	_getCellMapping : function(elTable){
		var aTR = jindo.$$(">TBODY>TR", elTable, {oneTimeOffCache:true});
		var nTD = 0;
		var aTD_FirstRow = aTR[0].childNodes;
/*
		// remove empty TR's from the bottom of the table
		for(var i=aTR.length-1; i>0; i--){
			if(!aTR[i].childNodes || aTR[i].childNodes.length === 0){
				aTR[i].parentNode.removeChild(aTR[i]);
				aTR = aTR.slice(0, i);
				
				if(this.htSelectionSPos.y>=i) this.htSelectionSPos.y--;
				if(this.htSelectionEPos.y>=i) this.htSelectionEPos.y--;
			}else{
				break;
			}
		}
*/
		// count the number of columns
		for(var i = 0; i < aTD_FirstRow.length; i++){
			var elTmp = aTD_FirstRow[i];
			
			if(!elTmp.tagName || !elTmp.tagName.match(/^TD|TH$/)){continue;}

			if(elTmp.getAttribute("colSpan")){
				nTD += this.parseIntOr0(elTmp.getAttribute("colSpan"));
			}else{
				nTD ++;
			}
		}

		var nTblX = nTD;
		var nTblY = aTR.length;

		var aCellMapping = new Array(nTblX);
		for(var x = 0; x < nTblX; x++){
			aCellMapping[x] = new Array(nTblY);
		}

		for(var y = 0; y < nTblY; y++){
			var elCell = aTR[y].childNodes[0];

			if(!elCell){continue;}
			if(!elCell.tagName || !elCell.tagName.match(/^TD|TH$/)){elCell = this._getNextCell(elCell);}

			var x = -1;
			while(elCell){
				x++;
				if(!aCellMapping[x]){aCellMapping[x] = [];}
				if(aCellMapping[x][y]){continue;}
				var colSpan = parseInt(elCell.getAttribute("colSpan"), 10) || 1;
				var rowSpan = parseInt(elCell.getAttribute("rowSpan"), 10) || 1;
/*
				if(y+rowSpan >= nTblY){
					rowSpan = nTblY-y;
					elCell.setAttribute("rowSpan", rowSpan);
				}
*/
				for(var yy = 0; yy < rowSpan; yy++){
					for(var xx = 0; xx < colSpan; xx++){
						if(!aCellMapping[x+xx]){
							aCellMapping[x+xx] = [];
						}
						aCellMapping[x+xx][y+yy] = elCell;
					}
				}

				elCell = this._getNextCell(elCell);
			}
		}
		
		// remove empty TR's
		// (상단 TD의 rowspan만으로 지탱되는) 빈 TR이 있을 경우 IE7 이하에서 랜더링 오류가 발생 할 수 있어 빈 TR을 지워 줌
		var bRowRemoved = false;
		var elLastCell = null;
		for(var y = 0, nRealY = 0, nYLen = aCellMapping[0].length; y < nYLen; y++, nRealY++){
			elLastCell = null;
			if(!aTR[y].innerHTML.match(/TD|TH/i)){
				for(var x = 0, nXLen = aCellMapping.length; x < nXLen; x++){
					elCell = aCellMapping[x][y];
					if(!elCell || elCell === elLastCell){
						continue;
					}
					elLastCell = elCell;
					var rowSpan = parseInt(elCell.getAttribute("rowSpan"), 10) || 1;

					if(rowSpan > 1){
						elCell.setAttribute("rowSpan", rowSpan - 1);
					}
				}
				
				// [SMARTEDITORSUS-1533]
				var htBrowser = jindo.$Agent().navigator();
				if(htBrowser.ie && (htBrowser.nativeVersion == 9 || htBrowser.nativeVersion == 10) && (htBrowser.version == 9 || htBrowser.version == 10)){
					this._removeEmptyTextNode_IE(aTR[y]);
				}
				// --[SMARTEDITORSUS-1533]
				
				aTR[y].parentNode.removeChild(aTR[y]);

				if(this.htSelectionEPos.y >= nRealY){
					nRealY--;
					this.htSelectionEPos.y--;
				}
				
				bRowRemoved = true;
			}
		}
		if(bRowRemoved){
			return this._getCellMapping(elTable);
		}
		
		return aCellMapping;
	},
	
	_selectCells : function(htSPos, htEPos){
		this.aSelectedCells = this._getSelectedCells(htSPos, htEPos);
		this._addClassToSelection();
	},

	_deselectCells : function(){
		this._removeClassFromSelection();
	
		this.aSelectedCells = [];
		this.htSelectionSPos = {x:-1, y:-1};
		this.htSelectionEPos = {x:-1, y:-1};
	},
	
	_addClassToSelection : function(){
		var welCell, elCell;
		for(var i = 0; i < this.aSelectedCells.length; i++){
			elCell = this.aSelectedCells[i];

			// [SMARTEDITORSUS-1552] 드래그로 셀을 선택하는 중 elCell이 없는 경우 오류 발생
			if(elCell){
				// [SMARTEDITORSUS-1498][SMARTEDITORSUS-1549] 선택된 모든 셀에서 드래그가 발생하지 못하게 방지(FF, Chrome)
				if(elCell.ondragstart == null){
					elCell.ondragstart = function(){
						return false;
					};
				}
				// --[SMARTEDITORSUS-1498][SMARTEDITORSUS-1549]
					
				welCell = jindo.$Element(elCell);
				welCell.addClass(this.CELL_SELECTION_CLASS);
				
				// [SMARTEDITORSUS-1498][SMARTEDITORSUS-1549] 선택된 모든 셀에서 드래그가 발생하지 못하게 방지(FF, Chrome)
				welCell.addClass("undraggable");
				// --[SMARTEDITORSUS-1498][SMARTEDITORSUS-1549]
				
				if(elCell.style.backgroundColor){
					elCell.setAttribute(this.TMP_BGC_ATTR, elCell.style.backgroundColor);
					welCell.css("backgroundColor", "");
				}
				
				if(elCell.style.backgroundImage) {
					elCell.setAttribute(this.TMP_BGIMG_ATTR, elCell.style.backgroundImage);
					welCell.css("backgroundImage", "");
				}
			}
			// --[SMARTEDITORSUS-1552]
		}
	},

	_removeClassFromSelection : function(){
		var welCell, elCell;
		
		for(var i = 0; i < this.aSelectedCells.length; i++){
			elCell = this.aSelectedCells[i];

			// [SMARTEDITORSUS-1552] 드래그로 셀을 선택하는 중 elCell이 없는 경우 오류 발생
			if(elCell){
				welCell = jindo.$Element(elCell);
				welCell.removeClass(this.CELL_SELECTION_CLASS);
				
				// [SMARTEDITORSUS-1498][SMARTEDITORSUS-1549] 선택된 모든 셀에서 드래그가 발생하지 못하게 방지(FF, Chrome)
				welCell.removeClass("undraggable");
				// --[SMARTEDITORSUS-1498][SMARTEDITORSUS-1549]
				
				//배경색
				if(elCell.getAttribute(this.TMP_BGC_ATTR)){
					elCell.style.backgroundColor = elCell.getAttribute(this.TMP_BGC_ATTR);
					elCell.removeAttribute(this.TMP_BGC_ATTR);
				}
				//배경이미지 
				if(elCell.getAttribute(this.TMP_BGIMG_ATTR)) {
					welCell.css("backgroundImage",elCell.getAttribute(this.TMP_BGIMG_ATTR));
					elCell.removeAttribute(this.TMP_BGIMG_ATTR);
				}
			}
			// --[SMARTEDITORSUS-1552]
		}
	},

	_expandAndSelect : function(htPos1, htPos2){
		var x, y, elTD, nTmp, i;

		// expand top
		if(htPos1.y > 0){
			for(x = htPos1.x; x <= htPos2.x; x++){
				elTD = this.htMap[x][htPos1.y];
				if(this.htMap[x][htPos1.y - 1] == elTD){
					nTmp = htPos1.y - 2;
					while(nTmp >= 0 && this.htMap[x][nTmp] == elTD){
						nTmp--;
					}
					htPos1.y = nTmp + 1;
					this._expandAndSelect(htPos1, htPos2);
					return;
				}
			}
		}
		
		// expand left
		if(htPos1.x > 0){
			for(y = htPos1.y; y <= htPos2.y; y++){
				elTD = this.htMap[htPos1.x][y];
				if(this.htMap[htPos1.x - 1][y] == elTD){
					nTmp = htPos1.x - 2;
					while(nTmp >= 0 && this.htMap[nTmp][y] == elTD){
						nTmp--;
					}
					htPos1.x = nTmp + 1;
					this._expandAndSelect(htPos1, htPos2);
					return;
				}
			}
		}

		// expand bottom
		if(htPos2.y < this.htMap[0].length - 1){
			for(x = htPos1.x; x <= htPos2.x; x++){
				elTD = this.htMap[x][htPos2.y];
				if(this.htMap[x][htPos2.y + 1] == elTD){
					nTmp = htPos2.y + 2;
					while(nTmp < this.htMap[0].length && this.htMap[x][nTmp] == elTD){
						nTmp++;
					}
					htPos2.y = nTmp - 1;
					this._expandAndSelect(htPos1, htPos2);
					return;
				}
			}
		}

		// expand right
		if(htPos2.x < this.htMap.length - 1){
			for(y = htPos1.y; y <= htPos2.y; y++){
				elTD = this.htMap[htPos2.x][y];
				if(this.htMap[htPos2.x + 1][y] == elTD){
					nTmp = htPos2.x + 2;
					while(nTmp < this.htMap.length && this.htMap[nTmp][y] == elTD){
						nTmp++;
					}
					htPos2.x = nTmp - 1;
					this._expandAndSelect(htPos1, htPos2);
					return;
				}
			}
		}
	},

	_getSelectedCells : function(htPos1, htPos2){
		this._expandAndSelect(htPos1, htPos2);
		var x1 = htPos1.x;
		var y1 = htPos1.y;

		var x2 = htPos2.x;
		var y2 = htPos2.y;

		this.htSelectionSPos = htPos1;
		this.htSelectionEPos = htPos2;
		
		var aResult = [];

		for(var y = y1; y <= y2; y++){
			for(var x = x1; x <= x2; x++){
				if(jindo.$A(aResult).has(this.htMap[x][y])){
					continue;
				}
				aResult[aResult.length] = this.htMap[x][y];
			}
		}
		return aResult;
	},

	_setEndPos : function(htPos){
		var nColspan, nRowspan;

		nColspan = parseInt(htPos.elCell.getAttribute("colSpan"), 10) || 1;
		nRowspan = parseInt(htPos.elCell.getAttribute("rowSpan"), 10) || 1;
		htPos.ex = htPos.x + nColspan - 1;
		htPos.ey = htPos.y + nRowspan - 1;
	},

	_getBasisCellPosition : function(elCell){
		var x = 0, y = 0;
		for(x = 0; x < this.htMap.length; x++){
			for(y = 0; y < this.htMap[x].length; y++){
				if(this.htMap[x][y] == elCell){
					return {'x': x, 'y': y, elCell: elCell};
				}
			}
		}
		return {'x': 0, 'y': 0, elCell: elCell};
	},
	
	_applyTableTemplate : function(elTable, nTemplateIdx){
		// clear style first if already exists
		/*
		if(elTable.getAttribute(this.ATTR_TBL_TEMPLATE)){
			this._doApplyTableTemplate(elTable, nhn.husky.SE2M_TableTemplate[this.parseIntOr0(elTable.getAttribute(this.ATTR_TBL_TEMPLATE))], true);
		}else{
			this._clearAllTableStyles(elTable);
		}
		*/
		
		if (!elTable) {
			return;
		}

		// 사용자가 지정한 스타일 무시하고 새 템플릿 적용
		// http://bts.nhncorp.com/nhnbts/browse/COM-871
		this._clearAllTableStyles(elTable);
		
		this._doApplyTableTemplate(elTable, nhn.husky.SE2M_TableTemplate[nTemplateIdx], false);
		elTable.setAttribute(this.ATTR_TBL_TEMPLATE, nTemplateIdx);
	},
	
	_clearAllTableStyles : function(elTable){
		elTable.removeAttribute("border");
		elTable.removeAttribute("cellPadding");
		elTable.removeAttribute("cellSpacing");
		elTable.style.padding = "";
		elTable.style.border = "";
		elTable.style.backgroundColor = "";
		elTable.style.color = "";
		
		var aTD = jindo.$$(">TBODY>TR>TD", elTable, {oneTimeOffCache:true});
		for(var i = 0, nLen = aTD.length; i < nLen; i++){
			aTD[i].style.padding = "";
			aTD[i].style.border = "";
			aTD[i].style.backgroundColor = "";
			aTD[i].style.color = "";
		}
		// [SMARTEDITORSUS-1672]
		var aTH = jindo.$$(">TBODY>TR>TH", elTable, {oneTimeOffCache:true});
		for(var i = 0, nLen = aTH.length; i < nLen; i++){
			aTH[i].style.padding = "";
			aTH[i].style.border = "";
			aTH[i].style.backgroundColor = "";
			aTH[i].style.color = "";
		}
		// --[SMARTEDITORSUS-1672]
	},
	
	_hideTableTemplate : function(elTable){
		if(elTable.getAttribute(this.ATTR_TBL_TEMPLATE)){
			this._doApplyTableTemplate(elTable, nhn.husky.SE2M_TableTemplate[this.parseIntOr0(elTable.getAttribute(this.ATTR_TBL_TEMPLATE))], true);
		}
	},
	
	_showTableTemplate : function(elTable){
		if(elTable.getAttribute(this.ATTR_TBL_TEMPLATE)){
			this._doApplyTableTemplate(elTable, nhn.husky.SE2M_TableTemplate[this.parseIntOr0(elTable.getAttribute(this.ATTR_TBL_TEMPLATE))], false);
		}
	},
	
	_doApplyTableTemplate : function(elTable, htTableTemplate, bClearStyle){
		var htTableProperty = htTableTemplate.htTableProperty;
		var htTableStyle = htTableTemplate.htTableStyle;
		var ht1stRowStyle = htTableTemplate.ht1stRowStyle;
		var ht1stColumnStyle = htTableTemplate.ht1stColumnStyle;
		var aRowStyle = htTableTemplate.aRowStyle;
		var elTmp;

		// replace all TH's with TD's

		if(htTableProperty){
			this._copyAttributesTo(elTable, htTableProperty, bClearStyle);
		}
		if(htTableStyle){
			this._copyStylesTo(elTable, htTableStyle, bClearStyle);
		}

		var aTR = jindo.$$(">TBODY>TR", elTable, {oneTimeOffCache:true});

		var nStartRowNum = 0;
		if(ht1stRowStyle){
			var nStartRowNum = 1;
			 
			for(var ii = 0, nNumCells = aTR[0].childNodes.length; ii < nNumCells; ii++){
				elTmp = aTR[0].childNodes[ii];
				if(!elTmp.tagName || !elTmp.tagName.match(/^TD|TH$/)){continue;}
				this._copyStylesTo(elTmp, ht1stRowStyle, bClearStyle);
			}
		}

		var nRowSpan;
		var elFirstEl;
		if(ht1stColumnStyle){
			// if the style's got a row heading, skip the 1st row. (it was taken care above)
			var nRowStart = ht1stRowStyle ? 1 : 0;
			
			for(var i = nRowStart, nLen = aTR.length; i < nLen;){
				elFirstEl = aTR[i].firstChild;
				
				nRowSpan = 1;

				if(elFirstEl && elFirstEl.tagName.match(/^TD|TH$/)){
					nRowSpan = parseInt(elFirstEl.getAttribute("rowSpan"), 10) || 1;
					this._copyStylesTo(elFirstEl, ht1stColumnStyle, bClearStyle);
				}

				i += nRowSpan;
			}
		}

		if(aRowStyle){
			var nNumStyles = aRowStyle.length;
			for(var i = nStartRowNum, nLen = aTR.length; i < nLen; i++){
				for(var ii = 0, nNumCells = aTR[i].childNodes.length; ii < nNumCells; ii++){
					var elTmp = aTR[i].childNodes[ii];
					if(!elTmp.tagName || !elTmp.tagName.match(/^TD|TH$/)){continue;}
					this._copyStylesTo(elTmp, aRowStyle[(i+nStartRowNum)%nNumStyles], bClearStyle);
				}
			}
		}
	},
	
	_copyAttributesTo : function(oTarget, htProperties, bClearStyle){
		var elTmp;
		for(var x in htProperties){
			if(htProperties.hasOwnProperty(x)){
				if(bClearStyle){
					if(oTarget[x]){
						elTmp = document.createElement(oTarget.tagName);
						elTmp[x] = htProperties[x];
						if(elTmp[x] == oTarget[x]){
							oTarget.removeAttribute(x);
						}
					}
				}else{
					elTmp = document.createElement(oTarget.tagName);
					elTmp.style[x] = "";
					if(!oTarget[x] || oTarget.style[x] == elTmp.style[x]){oTarget.setAttribute(x, htProperties[x]);}
				}
			}
		}
	},
	
	_copyStylesTo : function(oTarget, htProperties, bClearStyle){
		var elTmp;
		for(var x in htProperties){
			if(htProperties.hasOwnProperty(x)){
				if(bClearStyle){
					if(oTarget.style[x]){
						elTmp = document.createElement(oTarget.tagName);
						elTmp.style[x] = htProperties[x];
						if(elTmp.style[x] == oTarget.style[x]){
							oTarget.style[x] = "";
						}
					}
				}else{
					elTmp = document.createElement(oTarget.tagName);
					elTmp.style[x] = "";
					if(!oTarget.style[x] || oTarget.style[x] == elTmp.style[x] || x.match(/^border/)){oTarget.style[x] = htProperties[x];}
				}
			}
		}
	},
	
	_hideResizer : function(){
		this.elResizeGrid.style.display = "none";
	},
	
	_showResizer : function(){
		this.elResizeGrid.style.display = "block";
	},
	
	_setResizerSize : function(width, height){
		this.elResizeGrid.style.width = width + "px";
		this.elResizeGrid.style.height = height + "px";
	},
	
	parseBorder : function(vBorder, sBorderStyle){
		if(sBorderStyle == "none"){return 0;}

		var num = parseInt(vBorder, 10);
		if(isNaN(num)){
			if(typeof(vBorder) == "string"){
				// IE Bug
				return 1;
/*
				switch(vBorder){
				case "thin":
					return 1;
				case "medium":
					return 3;
				case "thick":
					return 5;
				}
*/
			}
		}
		return num;
	},
	
	parseIntOr0 : function(num){
		num = parseInt(num, 10);
		if(isNaN(num)){return 0;}
		return num;
	},
	
	_getTRCloneWithAllTD : function(nRow){
		var elResult = this.htMap[0][nRow].parentNode.cloneNode(false);

		var elCurTD, elCurTDClone;
		for(var i = 0, nLen = this.htMap.length; i < nLen; i++){
			elCurTD = this.htMap[i][nRow];
			// [SMARTEDITORSUS-1672]
			//if(elCurTD.tagName == "TD"){
			if(this._rxCellNames.test(elCurTD.tagName)){
			// --[SMARTEDITORSUS-1672]
				elCurTDClone = this._shallowCloneTD(elCurTD);
				elCurTDClone.setAttribute("rowSpan", 1);
				elCurTDClone.setAttribute("colSpan", 1);
				elCurTDClone.style.width = "";
				elCurTDClone.style.height = "";
				elResult.insertBefore(elCurTDClone, null);
			}
		}
		
		return elResult;
	},
	
	_shallowCloneTD : function(elTD){
		var elResult = elTD.cloneNode(false);
		
		elResult.innerHTML = this.sEmptyTDSrc;
		
		return elResult;
	},
	
	// elTbl이 꽉 찬 직사각형 형태의 테이블인지 확인
	_isValidTable : function(elTbl){
		if(!elTbl || !elTbl.tagName || elTbl.tagName != "TABLE"){
			return false;
		}

		this.htMap = this._getCellMapping(elTbl);
		var nXSize = this.htMap.length;
		if(nXSize < 1){return false;}

		var nYSize = this.htMap[0].length;
		if(nYSize < 1){return false;}

		for(var i = 1; i < nXSize; i++){
			// 첫번째 열과 길이가 다른 열이 하나라도 있다면 직사각형이 아님
			if(this.htMap[i].length != nYSize || !this.htMap[i][nYSize - 1]){
				return false;
			}
			
			// 빈칸이 하나라도 있다면 꽉 찬 직사각형이 아님
			for(var j = 0; j < nYSize; j++){
				if(!this.htMap[i] || !this.htMap[i][j]){
					return false;
				}
			}
		}
		
		return true;
	},
	
	addCSSClass : function(sClassName, sClassRule){
		var oDoc = this.oApp.getWYSIWYGDocument();
		if(oDoc.styleSheets[0] && oDoc.styleSheets[0].addRule){
			// IE
			oDoc.styleSheets[0].addRule("." + sClassName, sClassRule);
		}else{
			// FF
			var elHead = oDoc.getElementsByTagName("HEAD")[0]; 
			var elStyle = oDoc.createElement ("STYLE"); 
			//styleElement.type = "text / css"; 
			elHead.appendChild (elStyle); 
			
			elStyle.sheet.insertRule("." + sClassName + " { "+sClassRule+" }", 0);
		}
	},
	
	// [SMARTEDITORSUS-1533]
	_removeEmptyTextNode_IE : function(elPair){
		var elEmptyTextNode = elPair.nextSibling;
		if(elEmptyTextNode && elEmptyTextNode.nodeType == 3 && !/\S/.test(elEmptyTextNode.nodeValue)){
			elPair.parentNode.removeChild(elEmptyTextNode);
		}
	}
	// --[SMARTEDITORSUS-1533]
	//@lazyload_js]
});