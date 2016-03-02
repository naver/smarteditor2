/*[
 * LOAD_IR_FIELD
 *
 * 에디터 초기화 시에 넘어온 IR필드 값을 읽어 에디터에 설정한다.
 *
 * bDontAddUndo boolean IR값을 설정하면서 UNDO 히스토리는 추가 하지않는다.
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
nhn.husky.SE_EditingAreaManager = $Class({
	name : "SE_EditingAreaManager",
	
	// Currently active plugin instance(SE_EditingArea_???)
	oActivePlugin : null,
	
	// Intermediate Representation of the content being edited.
	// This should be a textarea element.
	oIRField : null,
	
	bIsDirty : false,
	
	$init : function(sInitialMode, oIRField, oDimension, fOnBeforeUnload, oAppContainer){
		this.sInitialMode = sInitialMode;
		this.oIRField = $(oIRField);
		this._assignHTMLObjects(oAppContainer);
		this.fOnBeforeUnload = fOnBeforeUnload;
		
		this.oEditingMode = {};
		
		var welEditingAreaContiner = $Element(this.elEditingAreaContainer);
		
		this.elEditingAreaContainer.style.height = oDimension.nHeight || (this.elEditingAreaContainer.offsetHeight+"px");

		this.nMinHeight = oDimension.nMinHeight || 10;
		this.niMinWidth = oDimension.nMinWidth || 10;
	},

	_assignHTMLObjects : function(oAppContainer){
		oAppContainer = $(oAppContainer) || document;
		this.elEditingAreaContainer = cssquery.getSingle("DIV.husky_seditor_editing_area_container", oAppContainer);
		this.elEditingAreaSkipUI = cssquery.getSingle("A.skip", oAppContainer);
	},

	$BEFORE_MSG_APP_READY : function(msg){
		this.oApp.exec("ADD_APP_PROPERTY", ["elEditingAreaContainer", this.elEditingAreaContainer]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getContents", $Fn(this.getContents, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getIR", $Fn(this.getIR, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["setContents", this.setContents]);
		this.oApp.exec("ADD_APP_PROPERTY", ["setIR", this.setIR]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getEditingMode", $Fn(this.getEditingMode, this).bind()]);
	},

	$ON_MSG_APP_READY : function(){
		this.elResizingBoard = document.createElement("DIV");

		this.elEditingAreaContainer.style.overflow = "hidden";
		this.elEditingAreaContainer.insertBefore(this.elResizingBoard, this.elEditingAreaContainer.firstChild);
		this.elResizingBoard.style.position = "absolute";
		this.elResizingBoard.style.background = "#000000";
		this.elResizingBoard.style.filter="alpha(opacity=0)";
		this.elResizingBoard.style.zIndex=99999;
		this.elResizingBoard.style["MozOpacity"]=0;
		this._fitElementInEditingArea(this.elResizingBoard);
		this.elResizingBoard.style.display = "none";

		this.oApp.exec("REGISTER_CONVERTERS", []);
		this.oApp.exec("CHANGE_EDITING_MODE", [this.sInitialMode, true]);
		this.oApp.exec("LOAD_IR_FIELD", [false]);
		
		this.oApp.registerBrowserEvent(this.elEditingAreaSkipUI, "focus", "MSG_EDITING_AREA_SIZE_CHANGED", [], 50);
		this.oApp.registerBrowserEvent(this.elEditingAreaSkipUI, "blur", "MSG_EDITING_AREA_SIZE_CHANGED", [], 50);

		if(this.fOnBeforeUnload){
			window.onbeforeunload = this.fOnBeforeUnload;
		}else{
			window.onbeforeunload = $Fn(function(){
				if(this.getIR() != this.oIRField.value || this.bIsDirty) return this.oApp.$MSG("SE_EditingAreaManager.onExit");
			}, this).bind();
		}
	},
	
	$AFTER_MSG_APP_READY : function(){
		this.oApp.exec("UPDATE_IR_FIELD", []);
	},
	
	$ON_LOAD_IR_FIELD : function(bDontAddUndo){
		this.oApp.setIR(this.oIRField.value, bDontAddUndo);
	},
	
	$ON_UPDATE_IR_FIELD : function(){
		this.oIRField.value = this.oApp.getIR();
	},
	
	$BEFORE_CHANGE_EDITING_MODE : function(sMode){
		if(!this.oEditingMode[sMode]) return false;
		this._oPrevActivePlugin = this.oActivePlugin;
		this.oActivePlugin = this.oEditingMode[sMode];
	},

	$AFTER_CHANGE_EDITING_MODE : function(sMode, bNoFocus){
		if(this._oPrevActivePlugin){
			var sIR = this._oPrevActivePlugin.getIR();
			this.oApp.exec("SET_IR", [sIR]);

			this.oApp.exec("ENABLE_UI", [this._oPrevActivePlugin.sMode]);
			
			this._setEditingAreaDimension();
		}
		this.oApp.exec("DISABLE_UI", [this.oActivePlugin.sMode]);

		if(!bNoFocus){
			this.oApp.exec("FOCUS", []);
		}
	},

	$ON_SET_IS_DIRTY : function(bIsDirty){
		this.bIsDirty = bIsDirty;
	},

	$ON_FOCUS : function(){
		if(!this.oActivePlugin || typeof this.oActivePlugin.setIR != "function") return

		this.oActivePlugin.focus();
	},

	$BEFORE_SET_IR : function(sIR, bDontAddUndoHistory){
		bDontAddUndoHistory = bDontAddUndoHistory || false;
		if(!bDontAddUndoHistory) this.oApp.exec("RECORD_UNDO_ACTION", ["SET CONTENTS"]);
	},

	$ON_SET_IR : function(sIR){
		if(!this.oActivePlugin || typeof this.oActivePlugin.setIR != "function") return

		this.oActivePlugin.setIR(sIR);
	},

	$AFTER_SET_IR : function(sIR, bDontAddUndoHistory){
		bDontAddUndoHistory = bDontAddUndoHistory || false;
		if(!bDontAddUndoHistory) this.oApp.exec("RECORD_UNDO_ACTION", ["SET CONTENTS"]);
	},

	$ON_REGISTER_EDITING_AREA : function(oEditingAreaPlugin){
		this.oEditingMode[oEditingAreaPlugin.sMode] = oEditingAreaPlugin;
		this.attachDocumentEvents(oEditingAreaPlugin.oEditingArea);
		this._setEditingAreaDimension(oEditingAreaPlugin);
	},

	$ON_MSG_EDITING_AREA_RESIZE_STARTED : function(){
		this._fitElementInEditingArea(this.elEditingAreaContainer);

		this.elResizingBoard.style.display = "block";

		this.iStartingHeight = parseInt(this.elEditingAreaContainer.style.height);
	},
	
	$ON_RESIZE_EDITING_AREA: function(ipNewWidth, ipNewHeight){
		var iNewWidth = parseInt(ipNewWidth);
		var iNewHeight = parseInt(ipNewHeight);

		if(iNewWidth < this.niMinWidth) iNewWidth = this.niMinWidth;
		if(iNewHeight < this.nMinHeight) iNewHeight = this.nMinHeight;
	
		if(ipNewWidth) this.elEditingAreaContainer.style.width = iNewWidth+"px";
		if(ipNewHeight) this.elEditingAreaContainer.style.height = iNewHeight+"px";
		
		this._fitElementInEditingArea(this.elResizingBoard);
		this._setEditingAreaDimension();
	},

	$ON_RESIZE_EDITING_AREA_BY : function(ipWidthChange, ipHeightChange){
		var iWidthChange = parseInt(ipWidthChange);
		var iHeightChange = parseInt(ipHeightChange);

		var iWidth = this.elEditingAreaContainer.style.width?parseInt(this.elEditingAreaContainer.style.width)+iWidthChange:null;
		var iHeight = this.elEditingAreaContainer.style.height?this.iStartingHeight+iHeightChange:null;

		this.oApp.exec("RESIZE_EDITING_AREA", [iWidth, iHeight]);
	},
	
	$ON_MSG_EDITING_AREA_RESIZE_ENDED : function(FnMouseDown, FnMouseMove, FnMouseUp){
		this.elResizingBoard.style.display = "none";
		this._setEditingAreaDimension();
	},

	_setEditingAreaDimension : function(oEditingAreaPlugin){
		oEditingAreaPlugin = oEditingAreaPlugin || this.oActivePlugin;
		this._fitElementInEditingArea(oEditingAreaPlugin.elEditingArea);
	},
	
	_fitElementInEditingArea : function(el){
		el.style.height = this.elEditingAreaContainer.offsetHeight+"px";
		el.style.width = this.elEditingAreaContainer.offsetWidth+"px";
	},
	
	attachDocumentEvents : function(doc){
		this.oApp.registerBrowserEvent(doc, "click", "EVENT_EDITING_AREA_CLICK");
		this.oApp.registerBrowserEvent(doc, "mousedown", "EVENT_EDITING_AREA_MOUSEDOWN");
		this.oApp.registerBrowserEvent(doc, "mousemove", "EVENT_EDITING_AREA_MOUSEMOVE");
		this.oApp.registerBrowserEvent(doc, "mouseup", "EVENT_EDITING_AREA_MOUSEUP");
		this.oApp.registerBrowserEvent(doc, "keydown", "EVENT_EDITING_AREA_KEYDOWN");
		this.oApp.registerBrowserEvent(doc, "keypress", "EVENT_EDITING_AREA_KEYPRESS");
		this.oApp.registerBrowserEvent(doc, "keyup", "EVENT_EDITING_AREA_KEYUP");
	},

	getIR : function(){
		if(!this.oActivePlugin) return "";
		return this.oActivePlugin.getIR();
	},

	setIR : function(sIR, bDontAddUndo){
		this.oApp.exec("SET_IR", [sIR, bDontAddUndo]);
	},

	getContents : function(){
		var sIR = this.oApp.getIR();
		var sContents;

		if(this.oApp.applyConverter){
			sContents = this.oApp.applyConverter("IR_TO_VIEW", sIR);
		}else{
			sContents = sIR;
		}

		return sContents;
	},

	setContents : function(sContents, bDontAddUndo){
		var sIR;

		if(this.oApp.applyConverter){
			sIR = this.oApp.applyConverter("VIEW_TO_IR", sContents);
		}else{
			sIR = sContents;
		}

		this.oApp.exec("SET_IR", [sIR, bDontAddUndo]);
	},
	
	getEditingMode : function(){
		return this.oActivePlugin.sMode;
	}
});