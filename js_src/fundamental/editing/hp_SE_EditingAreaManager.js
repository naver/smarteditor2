/*[
 * LOAD_CONTENTS_FIELD
 *
 * 에디터 초기화 시에 넘어온 Contents(DB 저장 값)필드를 읽어 에디터에 설정한다.
 *
 * bDontAddUndo boolean Contents를 설정하면서 UNDO 히스토리는 추가 하지않는다.
 *
---------------------------------------------------------------------------]*/
/*[
 * UPDATE_IR_FIELD
 *
 * 에디터의 IR값을 IR필드에 설정 한다.
 *
 * none
 *
---------------------------------------------------------------------------]*/
/*[
 * CHANGE_EDITING_MODE
 *
 * 에디터의 편집 모드를 변경한다.
 *
 * sMode string 전환 할 모드명
 * bNoFocus boolean 모드 전환 후에 에디터에 포커스를 강제로 할당하지 않는다.
 *
---------------------------------------------------------------------------]*/
/*[
 * FOCUS
 *
 * 에디터 편집 영역에 포커스를 준다.
 *
 * none
 *
---------------------------------------------------------------------------]*/
/*[
 * SET_IR
 *
 * IR값을 에디터에 설정 한다.
 *
 * none
 *
---------------------------------------------------------------------------]*/
/*[
 * REGISTER_EDITING_AREA
 *
 * 편집 영역을 플러그인을 등록 시킨다. 원활한 모드 전환과 IR값 공유등를 위해서 초기화 시에 등록이 필요하다. 
 *
 * oEditingAreaPlugin object 편집 영역 플러그인 인스턴스
 *
---------------------------------------------------------------------------]*/
/*[
 * MSG_EDITING_AREA_RESIZE_STARTED
 *
 * 편집 영역 사이즈 조절이 시작 되었음을 알리는 메시지.
 *
 * none
 *
---------------------------------------------------------------------------]*/
/*[
 * RESIZE_EDITING_AREA
 *
 * 편집 영역 사이즈를 설정 한다. 변경 전후에 MSG_EDITIING_AREA_RESIZE_STARTED/MSG_EDITING_AREA_RESIZE_ENED를 발생 시켜 줘야 된다.
 *
 * ipNewWidth number 새 폭
 * ipNewHeight number 새 높이
 *
---------------------------------------------------------------------------]*/
/*[
 * RESIZE_EDITING_AREA_BY
 *
 * 편집 영역 사이즈를 늘리거나 줄인다. 변경 전후에 MSG_EDITIING_AREA_RESIZE_STARTED/MSG_EDITING_AREA_RESIZE_ENED를 발생 시켜 줘야 된다.
 * 변경치를 입력하면 원래 사이즈에서 변경하여 px로 적용하며, width가 %로 설정된 경우에는 폭 변경치가 입력되어도 적용되지 않는다.
 *
 * ipWidthChange number 폭 변경치
 * ipHeightChange number 높이 변경치
 *
---------------------------------------------------------------------------]*/
/*[
 * MSG_EDITING_AREA_RESIZE_ENDED
 *
 * 편집 영역 사이즈 조절이 끝났음을 알리는 메시지.
 *
 * none
 *
---------------------------------------------------------------------------]*/
/**
 * @pluginDesc IR 값과 복수개의 편집 영역을 관리하는 플러그인
 */
nhn.husky.SE_EditingAreaManager = jindo.$Class({
	name : "SE_EditingAreaManager",
	
	// Currently active plugin instance(SE_EditingArea_???)
	oActivePlugin : null,
	
	// Intermediate Representation of the content being edited.
	// This should be a textarea element.
	elContentsField : null,
	
	bIsDirty : false,
	
	$init : function(sDefaultEditingMode, elContentsField, oDimension, fOnBeforeUnload, elAppContainer){
		this.sDefaultEditingMode = sDefaultEditingMode;
		this.elContentsField = jindo.$(elContentsField);
		this._assignHTMLElements(elAppContainer);
		this.fOnBeforeUnload = fOnBeforeUnload;
		
		this.oEditingMode = {};
		
		this.elContentsField.style.display = "none";
		
		this.nMinWidth = parseInt((oDimension.nMinWidth || 60), 10);
		this.nMinHeight = parseInt((oDimension.nMinHeight || 60), 10);
		
		var oWidth = this._getSize([oDimension.nWidth, oDimension.width, this.elEditingAreaContainer.offsetWidth], this.nMinWidth);
		var oHeight = this._getSize([oDimension.nHeight, oDimension.height, this.elEditingAreaContainer.offsetHeight], this.nMinHeight);

		this.elEditingAreaContainer.style.width = oWidth.nSize + oWidth.sUnit;
		this.elEditingAreaContainer.style.height = oHeight.nSize + oHeight.sUnit;
		
		if(oWidth.sUnit === "px"){
			elAppContainer.style.width = (oWidth.nSize + 2) + "px";	
		}else if(oWidth.sUnit === "%"){
			elAppContainer.style.minWidth = this.nMinWidth + "px";
		}
	},
	
	_getSize : function(aSize, nMin){
		var i, nLen, aRxResult, nSize, sUnit, sDefaultUnit = "px";
		
		nMin = parseInt(nMin, 10);
		
		for(i=0, nLen=aSize.length; i<nLen; i++){
			if(!aSize[i]){
				continue;
			}
			
			if(!isNaN(aSize[i])){
				nSize = parseInt(aSize[i], 10);
				sUnit = sDefaultUnit;
				break;
			}
			
			aRxResult = /([0-9]+)(.*)/i.exec(aSize[i]);
						
			if(!aRxResult || aRxResult.length < 2 || aRxResult[1] <= 0){
				continue;
			}
			
			nSize = parseInt(aRxResult[1], 10);
			sUnit = aRxResult[2];
						
			if(!sUnit){
				sUnit = sDefaultUnit;
			}
			
			if(nSize < nMin && sUnit === sDefaultUnit){
				nSize = nMin;
			}
			
			break;
		}
				
		if(!sUnit){
			sUnit = sDefaultUnit;
		}
		
		if(isNaN(nSize) || (nSize < nMin && sUnit === sDefaultUnit)){
			nSize = nMin;
		}
		
		return {nSize : nSize, sUnit : sUnit};
	},

	_assignHTMLElements : function(elAppContainer){
		//@ec[
		this.elEditingAreaContainer = jindo.$$.getSingle("DIV.husky_seditor_editing_area_container", elAppContainer);
		//@ec]
	},

	$BEFORE_MSG_APP_READY : function(msg){
		this.oNavigator = jindo.$Agent().navigator();
		
		this.oApp.exec("ADD_APP_PROPERTY", ["elEditingAreaContainer", this.elEditingAreaContainer]);
		this.oApp.exec("ADD_APP_PROPERTY", ["welEditingAreaContainer", jindo.$Element(this.elEditingAreaContainer)]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getEditingAreaHeight", jindo.$Fn(this.getEditingAreaHeight, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getEditingAreaWidth", jindo.$Fn(this.getEditingAreaWidth, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getRawContents", jindo.$Fn(this.getRawContents, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getContents", jindo.$Fn(this.getContents, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getIR", jindo.$Fn(this.getIR, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["setContents", this.setContents]);
		this.oApp.exec("ADD_APP_PROPERTY", ["setIR", this.setIR]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getEditingMode", jindo.$Fn(this.getEditingMode, this).bind()]);
	},

	$ON_MSG_APP_READY : function(){
		this.htOptions =  this.oApp.htOptions[this.name] || {};
		this.sDefaultEditingMode = this.htOptions["sDefaultEditingMode"] || this.sDefaultEditingMode;
		this.iframeWindow = this.oApp.getWYSIWYGWindow();
		this.oApp.exec("REGISTER_CONVERTERS", []);
		this.oApp.exec("CHANGE_EDITING_MODE", [this.sDefaultEditingMode, true]);
		this.oApp.exec("LOAD_CONTENTS_FIELD", [false]);
		
		if(!!this.fOnBeforeUnload){
			window.onbeforeunload = this.fOnBeforeUnload;
		}else{
			window.onbeforeunload = jindo.$Fn(function(){
				this.oApp.exec("MSG_BEFOREUNLOAD_FIRED");
				//if(this.getContents() != this.elContentsField.value || this.bIsDirty){
				if(this.getRawContents() != this.sCurrentRawContents || this.bIsDirty){
					return this.oApp.$MSG("SE_EditingAreaManager.onExit");
				}
			}, this).bind();
		}
	},
	
	$AFTER_MSG_APP_READY : function(){
		this.oApp.exec("UPDATE_RAW_CONTENTS");
	},
	
	$ON_LOAD_CONTENTS_FIELD : function(bDontAddUndo){
		var sContentsFieldValue = this.elContentsField.value;
		
		// [SMARTEDITORSUS-177] [IE9] 글 쓰기, 수정 시에 elContentsField 에 들어간 공백을 제거
		// [SMARTEDITORSUS-312] [FF4] 인용구 첫번째,두번째 디자인 1회 선택 시 에디터에 적용되지 않음
		sContentsFieldValue = sContentsFieldValue.replace(/^\s+/, "");
				
		this.oApp.exec("SET_CONTENTS", [sContentsFieldValue, bDontAddUndo]);
	},
	
	// 현재 contents를 form의 textarea에 세팅 해 줌.
	// form submit 전에 이 부분을 실행시켜야 됨.
	$ON_UPDATE_CONTENTS_FIELD : function(){
		//this.oIRField.value = this.oApp.getIR();
		this.elContentsField.value = this.oApp.getContents();
		this.oApp.exec("UPDATE_RAW_CONTENTS");
		//this.sCurrentRawContents = this.elContentsField.value;
	},
	
	// 에디터의 현재 상태를 기억해 둠. 페이지를 떠날 때 이 값이 변경 됐는지 확인 해서 내용이 변경 됐다는 경고창을 띄움
	// RawContents 대신 contents를 이용해도 되지만, contents 획득을 위해서는 변환기를 실행해야 되기 때문에 RawContents 이용
	$ON_UPDATE_RAW_CONTENTS : function(){
		this.sCurrentRawContents = this.oApp.getRawContents();
	},
	
	$BEFORE_CHANGE_EDITING_MODE : function(sMode){
		if(!this.oEditingMode[sMode]){
			return false;
		}
		this._oPrevActivePlugin = this.oActivePlugin;
		this.oActivePlugin = this.oEditingMode[sMode];
	},

	$AFTER_CHANGE_EDITING_MODE : function(sMode, bNoFocus){
		if(this._oPrevActivePlugin){
			var sIR = this._oPrevActivePlugin.getIR();
			this.oApp.exec("SET_IR", [sIR]);

			//this.oApp.exec("ENABLE_UI", [this._oPrevActivePlugin.sMode]);
			
			this._setEditingAreaDimension();
		}
		//this.oApp.exec("DISABLE_UI", [this.oActivePlugin.sMode]);

		if(!bNoFocus){
			this.oApp.delayedExec("FOCUS", [], 0);
		}
	},
	
	/** 
	 * 페이지를 떠날 때 alert을 표시할지 여부를 셋팅하는 함수.
	 */
	$ON_SET_IS_DIRTY : function(bIsDirty){
		this.bIsDirty = bIsDirty;
	},

	$ON_FOCUS : function(){
		if(!this.oActivePlugin || typeof this.oActivePlugin.setIR != "function"){
			return;
		}

		// [SMARTEDITORSUS-599] ipad 대응 이슈.
		// ios5에서는 this.iframe.contentWindow focus가 없어서 생긴 이슈. 
		// document가 아닌 window에 focus() 주어야만 본문에 focus가 가고 입력이됨.
		if(!!this.oNavigator.msafari && !!this.iframeWindow && !this.iframeWindow.document.hasFocus()){
			this.iframeWindow.focus();
		}
		
		this.oActivePlugin.focus();
	},
	
	$ON_IE_FOCUS : function(){
		if(!this.oApp.oNavigator.ie){
			return;
		}
		this.oApp.exec("FOCUS");
	},
	
	$ON_SET_CONTENTS : function(sContents, bDontAddUndoHistory){
		this.setContents(sContents, bDontAddUndoHistory);
	},

	$BEFORE_SET_IR : function(sIR, bDontAddUndoHistory){
		bDontAddUndoHistory = bDontAddUndoHistory || false;
		if(!bDontAddUndoHistory){
			this.oApp.exec("RECORD_UNDO_ACTION", ["BEFORE SET CONTENTS", {sSaveTarget:"BODY"}]);
		}
	},

	$ON_SET_IR : function(sIR){
		if(!this.oActivePlugin || typeof this.oActivePlugin.setIR != "function"){
			return;
		}

		this.oActivePlugin.setIR(sIR);
	},

	$AFTER_SET_IR : function(sIR, bDontAddUndoHistory){
		bDontAddUndoHistory = bDontAddUndoHistory || false;
		if(!bDontAddUndoHistory){
			this.oApp.exec("RECORD_UNDO_ACTION", ["AFTER SET CONTENTS", {sSaveTarget:"BODY"}]);
		}
	},

	$ON_REGISTER_EDITING_AREA : function(oEditingAreaPlugin){
		this.oEditingMode[oEditingAreaPlugin.sMode] = oEditingAreaPlugin;
		this.attachDocumentEvents(oEditingAreaPlugin.oEditingArea);
		this._setEditingAreaDimension(oEditingAreaPlugin);
	},

	$ON_MSG_EDITING_AREA_RESIZE_STARTED : function(){
		this._fitElementInEditingArea(this.elEditingAreaContainer);

		this.oApp.exec("SHOW_EDITING_AREA_COVER");
		this.elEditingAreaContainer.style.overflow = "hidden";
//		this.elResizingBoard.style.display = "block";

		this.iStartingHeight = parseInt(this.elEditingAreaContainer.style.height, 10);
	},
	
	$ON_RESIZE_EDITING_AREA: function(ipNewWidth, ipNewHeight){
		if(ipNewWidth !== null && typeof ipNewWidth !== "undefined"){
			this._resizeWidth(ipNewWidth, "px");	
		}
		if(ipNewHeight !== null && typeof ipNewHeight !== "undefined"){
			this._resizeHeight(ipNewHeight, "px");
		}
		
		this._fitElementInEditingArea(this.elResizingBoard);
		this._setEditingAreaDimension();
	},
	
	_resizeWidth : function(ipNewWidth, sUnit){
		var iNewWidth = parseInt(ipNewWidth, 10);
		
		if(iNewWidth < this.nMinWidth){
			iNewWidth = this.nMinWidth;
		}
		
		if(ipNewWidth){		
			this.elEditingAreaContainer.style.width = iNewWidth + sUnit;			
		}
	},
	
	_resizeHeight : function(ipNewHeight, sUnit){
		var iNewHeight = parseInt(ipNewHeight, 10);
		
		if(iNewHeight < this.nMinHeight){
			iNewHeight = this.nMinHeight;
		}

		if(ipNewHeight){
			this.elEditingAreaContainer.style.height = iNewHeight + sUnit;
		}
	},
	
	$ON_RESIZE_EDITING_AREA_BY : function(ipWidthChange, ipHeightChange){
		var iWidthChange = parseInt(ipWidthChange, 10);
		var iHeightChange = parseInt(ipHeightChange, 10);
		var iWidth;
		var iHeight;
		
		if(ipWidthChange !== 0 && this.elEditingAreaContainer.style.width.indexOf("%") === -1){
			iWidth = this.elEditingAreaContainer.style.width?parseInt(this.elEditingAreaContainer.style.width, 10)+iWidthChange:null;
		}
		
		if(iHeightChange !== 0){
			iHeight = this.elEditingAreaContainer.style.height?this.iStartingHeight+iHeightChange:null;
		}
		
		if(!ipWidthChange && !iHeightChange){
			return;
		}
				
		this.oApp.exec("RESIZE_EDITING_AREA", [iWidth, iHeight]);
	},
	
	$ON_MSG_EDITING_AREA_RESIZE_ENDED : function(FnMouseDown, FnMouseMove, FnMouseUp){
		this.oApp.exec("HIDE_EDITING_AREA_COVER");
		this.elEditingAreaContainer.style.overflow = "";
//		this.elResizingBoard.style.display = "none";
		this._setEditingAreaDimension();
	},

	$ON_SHOW_EDITING_AREA_COVER : function(){
//		this.elEditingAreaContainer.style.overflow = "hidden";
		if(!this.elResizingBoard){
			this.createCoverDiv();
		}
		this.elResizingBoard.style.display = "block";
	},
	
	$ON_HIDE_EDITING_AREA_COVER : function(){
//		this.elEditingAreaContainer.style.overflow = "";
		if(!this.elResizingBoard){
			return;
		}
		this.elResizingBoard.style.display = "none";
	},
	
	$ON_KEEP_WITHIN_EDITINGAREA : function(elLayer, nHeight){
		var nTop = parseInt(elLayer.style.top, 10);
		if(nTop + elLayer.offsetHeight > this.oApp.elEditingAreaContainer.offsetHeight){
			if(typeof nHeight == "number"){
				elLayer.style.top = nTop - elLayer.offsetHeight - nHeight + "px";
			}else{
				elLayer.style.top = this.oApp.elEditingAreaContainer.offsetHeight - elLayer.offsetHeight + "px";
			}
		}

		var nLeft = parseInt(elLayer.style.left, 10);
		if(nLeft + elLayer.offsetWidth > this.oApp.elEditingAreaContainer.offsetWidth){
			elLayer.style.left = this.oApp.elEditingAreaContainer.offsetWidth - elLayer.offsetWidth + "px";
		}
	},

	$ON_EVENT_EDITING_AREA_KEYDOWN : function(){
		this.oApp.exec("HIDE_ACTIVE_LAYER", []);
	},

	$ON_EVENT_EDITING_AREA_MOUSEDOWN : function(){
		this.oApp.exec("HIDE_ACTIVE_LAYER", []);
	},

	$ON_EVENT_EDITING_AREA_SCROLL : function(){
		this.oApp.exec("HIDE_ACTIVE_LAYER", []);
	},

	_setEditingAreaDimension : function(oEditingAreaPlugin){
		oEditingAreaPlugin = oEditingAreaPlugin || this.oActivePlugin;
		this._fitElementInEditingArea(oEditingAreaPlugin.elEditingArea);
	},
	
	_fitElementInEditingArea : function(el){
		el.style.height = this.elEditingAreaContainer.offsetHeight+"px";
//		el.style.width = this.elEditingAreaContainer.offsetWidth+"px";
//		el.style.width = this.elEditingAreaContainer.style.width || (this.elEditingAreaContainer.offsetWidth+"px");
	},
	
	attachDocumentEvents : function(doc){
		this.oApp.registerBrowserEvent(doc, "click", "EVENT_EDITING_AREA_CLICK");
		this.oApp.registerBrowserEvent(doc, "dblclick", "EVENT_EDITING_AREA_DBLCLICK");
		this.oApp.registerBrowserEvent(doc, "mousedown", "EVENT_EDITING_AREA_MOUSEDOWN");
		this.oApp.registerBrowserEvent(doc, "mousemove", "EVENT_EDITING_AREA_MOUSEMOVE");
		this.oApp.registerBrowserEvent(doc, "mouseup", "EVENT_EDITING_AREA_MOUSEUP");
		this.oApp.registerBrowserEvent(doc, "mouseout", "EVENT_EDITING_AREA_MOUSEOUT");
		this.oApp.registerBrowserEvent(doc, "mousewheel", "EVENT_EDITING_AREA_MOUSEWHEEL");
		this.oApp.registerBrowserEvent(doc, "keydown", "EVENT_EDITING_AREA_KEYDOWN");
		this.oApp.registerBrowserEvent(doc, "keypress", "EVENT_EDITING_AREA_KEYPRESS");
		this.oApp.registerBrowserEvent(doc, "keyup", "EVENT_EDITING_AREA_KEYUP");
		this.oApp.registerBrowserEvent(doc, "scroll", "EVENT_EDITING_AREA_SCROLL");
	},
	
	createCoverDiv : function(){
		this.elResizingBoard = document.createElement("DIV");

		this.elEditingAreaContainer.insertBefore(this.elResizingBoard, this.elEditingAreaContainer.firstChild);
		this.elResizingBoard.style.position = "absolute";
		this.elResizingBoard.style.background = "#000000";
		this.elResizingBoard.style.zIndex=100;
		this.elResizingBoard.style.border=1;
		
		this.elResizingBoard.style["opacity"] = 0.0;
		this.elResizingBoard.style.filter="alpha(opacity=0.0)";
		this.elResizingBoard.style["MozOpacity"]=0.0;
		this.elResizingBoard.style["-moz-opacity"] = 0.0;
		this.elResizingBoard.style["-khtml-opacity"] = 0.0;
		
		this._fitElementInEditingArea(this.elResizingBoard);
		this.elResizingBoard.style.width = this.elEditingAreaContainer.offsetWidth+"px";
		
		this.elResizingBoard.style.display = "none";
	},

	$ON_GET_COVER_DIV : function(sAttr,oReturn){
		if(!!this.elResizingBoard) {
			oReturn[sAttr] = this.elResizingBoard;
		}
	},
	
	getIR : function(){
		if(!this.oActivePlugin){
			return "";
		}
		return this.oActivePlugin.getIR();
	},

	setIR : function(sIR, bDontAddUndo){
		this.oApp.exec("SET_IR", [sIR, bDontAddUndo]);
	},

	getRawContents : function(){
		if(!this.oActivePlugin){
			return "";
		}
		return this.oActivePlugin.getRawContents();
	},
	
	getContents : function(){
		var sIR = this.oApp.getIR();
		var sContents;

		if(this.oApp.applyConverter){
			sContents = this.oApp.applyConverter("IR_TO_DB", sIR, this.oApp.getWYSIWYGDocument());
		}else{
			sContents = sIR;
		}

		return sContents;
	},

	setContents : function(sContents, bDontAddUndo){
		var sIR;

		if(this.oApp.applyConverter){
			sIR = this.oApp.applyConverter("DB_TO_IR", sContents, this.oApp.getWYSIWYGDocument());
		}else{
			sIR = sContents;
		}

		this.oApp.exec("SET_IR", [sIR, bDontAddUndo]);
	},
	
	getEditingMode : function(){
		return this.oActivePlugin.sMode;
	},
	
	getEditingAreaWidth : function(){
		return this.elEditingAreaContainer.offsetWidth;
	},
	
	getEditingAreaHeight : function(){
		return this.elEditingAreaContainer.offsetHeight;
	}
});