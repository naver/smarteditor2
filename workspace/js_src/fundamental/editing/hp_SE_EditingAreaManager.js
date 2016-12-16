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
	bAutoResize : false, // [SMARTEDITORSUS-677] 에디터의 자동확장 기능 On/Off 여부
	
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
		this.elEditingAreaContainer = jindo.$$.getSingle("DIV.husky_seditor_editing_area_container", elAppContainer);

		// [SMARTEDITORSUS-2036] 로딩 레이어는 하위 호환을 위해 마크업이 존재하는 경우만 동작하도록 한다.
		var f = function(){};
		this.elLoadingLayer = jindo.$$.getSingle(".se2_content_loading", elAppContainer);
		if(!this.elLoadingLayer){
			this.$ON_SHOW_LOADING_LAYER = f;
			this.$ON_HIDE_LOADING_LAYER = f;
		}
	},

	$BEFORE_MSG_APP_READY : function(msg){
		this.oApp.exec("ADD_APP_PROPERTY", ["version", nhn.husky.SE_EditingAreaManager.version]);
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

		// [SMARTEDITORSUS-2089] fOnBeforeUnload === false 인 경우, 아예 window.onbeforeunload 를 등록하지 않도록 수정
		if(this.fOnBeforeUnload !== false){
			if(!!this.fOnBeforeUnload){
				window.onbeforeunload = this.fOnBeforeUnload;
			}else{
				window.onbeforeunload = jindo.$Fn(function(){
					// [SMARTEDITORSUS-1028][SMARTEDITORSUS-1517] QuickEditor 설정 API 개선으로, submit 이후 발생하게 되는 beforeunload 이벤트 핸들링 제거
					//this.oApp.exec("MSG_BEFOREUNLOAD_FIRED");
					// --// [SMARTEDITORSUS-1028][SMARTEDITORSUS-1517]
					//if(this.getContents() != this.elContentsField.value || this.bIsDirty){
					if(this.getRawContents() != this.sCurrentRawContents || this.bIsDirty){
						return this.oApp.$MSG("SE_EditingAreaManager.onExit");
					}
				}, this).bind();
			}
		}
	},

	$AFTER_MSG_APP_READY : function(){
		this.oApp.exec("UPDATE_RAW_CONTENTS");
		
		if(!!this.oApp.htOptions[this.name] && this.oApp.htOptions[this.name].bAutoResize){
			this.bAutoResize = this.oApp.htOptions[this.name].bAutoResize;
		}
		// [SMARTEDITORSUS-941] 아이패드에서는 자동확장기능이 항상 켜져있도록 한다.
		if(this.oApp.oNavigator.msafari){
			this.bAutoResize = true;
		}

		this.startAutoResize();	// [SMARTEDITORSUS-677] 편집영역 자동 확장 옵션이 TRUE이면 자동확장 시작
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
		
		this.stopAutoResize();	// [SMARTEDITORSUS-677] 해당 편집 모드에서의 자동확장을 중지함
		
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
		
		this.startAutoResize();	// [SMARTEDITORSUS-677] 변경된 편집 모드에서의 자동확장을 시작

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

	// [SMARTEDITORSUS-1698] 모바일에서 팝업 형태의 첨부가 사용될 때 포커스 이슈가 있음
	$ON_FOCUS : function(isPopupOpening){
		if(!this.oActivePlugin || typeof this.oActivePlugin.setIR != "function"){
			return;
		}

		// [SMARTEDITORSUS-599] ipad 대응 이슈.
		// ios5에서는 this.iframe.contentWindow focus가 없어서 생긴 이슈. 
		// document가 아닌 window에 focus() 주어야만 본문에 focus가 가고 입력이됨.
		
		//[SMARTEDITORSUS-1017] [iOS5대응] 모드 전환 시 textarea에 포커스가 있어도 글자가 입력이 안되는 현상
		//원인 : WYSIWYG모드가 아닐 때에도 iframe의 contentWindow에 focus가 가면서 focus기능이 작동하지 않음
		//해결 : WYSIWYG모드 일때만 실행 되도록 조건식 추가 및 기존에 blur처리 코드 삭제
		//[SMARTEDITORSUS-1594] 크롬에서 웹접근성용 키로 빠져나간 후 다시 진입시 간혹 포커싱이 안되는 문제가 있어 iframe에 포커싱을 먼저 주도록 수정
		if(!!this.iframeWindow && this.iframeWindow.document.hasFocus && !this.iframeWindow.document.hasFocus() && this.oActivePlugin.sMode == "WYSIWYG"){
			this.iframeWindow.focus();
		}else{ // 누락된 [SMARTEDITORSUS-1018] 작업분 반영
			this.oActivePlugin.focus();
		}
		
		if(isPopupOpening && this.oApp.bMobile){
			 return;
		}
		
		this.oActivePlugin.focus();
	},
	// --[SMARTEDITORSUS-1698]
	
	$ON_IE_FOCUS : function(){
		var oAgent = this.oApp.oNavigator;
		if(!oAgent.ie && !oAgent.edge){	// [SMARTEDITORSUS-2257] edge도 ie와 동일하게 포커스처리해준다.
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
		if(oEditingAreaPlugin.sMode == 'WYSIWYG'){
			this.attachDocumentEvents(oEditingAreaPlugin.oEditingArea);
		}
		this._setEditingAreaDimension(oEditingAreaPlugin);
	},

	$ON_MSG_EDITING_AREA_RESIZE_STARTED : function(){
		this._fitElementInEditingArea(this.elEditingAreaContainer);
		this.oApp.exec("STOP_AUTORESIZE_EDITING_AREA");	// [SMARTEDITORSUS-677] 사용자가 편집영역 사이즈를 변경하면 자동확장 기능 중지
		this.oApp.exec("SHOW_EDITING_AREA_COVER");
		this.elEditingAreaContainer.style.overflow = "hidden";

		this.iStartingHeight = parseInt(this.elEditingAreaContainer.style.height, 10);
	},
	
	/**
	 * [SMARTEDITORSUS-677] 편집영역 자동확장 기능을 중지함
	 */
	$ON_STOP_AUTORESIZE_EDITING_AREA : function(){
		if(!this.bAutoResize){
			return;
		}
		
		this.stopAutoResize();
		this.bAutoResize = false;
	},
	
	/**
	 * [SMARTEDITORSUS-677] 해당 편집 모드에서의 자동확장을 시작함
	 */
	startAutoResize : function(){
		if(!this.bAutoResize || !this.oActivePlugin || typeof this.oActivePlugin.startAutoResize != "function"){
			return;
		}
		
		this.oActivePlugin.startAutoResize();
	},
	
	/**
	 * [SMARTEDITORSUS-677] 해당 편집 모드에서의 자동확장을 중지함
	 */
	stopAutoResize : function(){
		if(!this.bAutoResize || !this.oActivePlugin || typeof this.oActivePlugin.stopAutoResize != "function"){
			return;
		}
		
		this.oActivePlugin.stopAutoResize();
	},
	
	$ON_RESIZE_EDITING_AREA: function(ipNewWidth, ipNewHeight){
		if(ipNewWidth !== null && typeof ipNewWidth !== "undefined"){
			this._resizeWidth(ipNewWidth, "px");	
		}
		if(ipNewHeight !== null && typeof ipNewHeight !== "undefined"){
			this._resizeHeight(ipNewHeight, "px");
		}
		
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
		this._setEditingAreaDimension();
	},

	/**
	 * 편집영역에 커서가 들어가지 않도록 투명 커버를 씌운다.
	 * @param {Boolean} bDimmed 반투명 처리할지 여부
	 */
	$ON_SHOW_EDITING_AREA_COVER : function(bDimmed){
		if(!this.elEditingAreaCover){
			this.elEditingAreaCover = document.createElement("DIV");
			this.elEditingAreaCover.style.cssText = 'position:absolute;top:0;left:0;z-index:100;background:#000000;filter:alpha(opacity=0);opacity:0.0;-moz-opacity:0.0;-khtml-opacity:0.0;height:100%;width:100%';
			this.elEditingAreaContainer.appendChild(this.elEditingAreaCover);
		}
		if(bDimmed){
			jindo.$Element(this.elEditingAreaCover).opacity(0.4);
		}
		this.elEditingAreaCover.style.display = "block";
	},
	
	$ON_HIDE_EDITING_AREA_COVER : function(){
		if(!this.elEditingAreaCover){
			return;
		}
		this.elEditingAreaCover.style.display = "none";
		jindo.$Element(this.elEditingAreaCover).opacity(0);
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
	
	$ON_GET_COVER_DIV : function(sAttr,oReturn){
		if(!!this.elEditingAreaCover) {
			oReturn[sAttr] = this.elEditingAreaCover;
		}
	},
	
	$ON_SHOW_LOADING_LAYER : function(){
		this.elLoadingLayer.style.display = 'block';
	},

	$ON_HIDE_LOADING_LAYER : function(){
		this.elLoadingLayer.style.display = 'none';
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
		// [SMARTEDITORSUS-2077]
		this._convertLastBrToNbsp();

		var sIR = this.oApp.getIR();
		var sContents;

		if(this.oApp.applyConverter){
			sContents = this.oApp.applyConverter("IR_TO_DB", sIR, this.oApp.getWYSIWYGDocument());
		}else{
			sContents = sIR;
		}
		
		sContents = this._cleanContents(sContents);

		return sContents;
	},
	
	/**
	 * [SMARTEDITORSUS-2077]
	 * 문단 내 마지막 <br>을 찾아서,
	 * 특수한 경우를 제외하고 모두 &nbsp;로 변환한다.
	 * 
	 * -NBSP로 변환해야 할 필요성
	 * --[IE 문서모드 8~10] 레이아웃 상 문단 내부 맨 마지막 요소가 <br>인 경우,
	 * <br>이 두 줄의 높이를 가진 것처럼 표현되는 현상이 있음
	 *  
	 * -NBSP로 변환하지 않고 <br>을 제거하는 경우
	 * --레이아웃 상 <br> 바로 앞에 <img>가 위치하고,
	 * 이 <img>가 
	 * parentNode가 허용하는 최대 가로폭 이상의 가로 크기를 가지고 있어
	 * parentNode가 허용하는 최대 가로폭으로 리사이징된 경우
	 * ---<br>이 NBSP로 변환되면, <img> 아래줄로 밀려나 한 줄을 더 차지하게 됨
	 * 
	 */
	_convertLastBrToNbsp : function(){
		var elBody = this.oApp.getWYSIWYGDocument().body,
		aBr, elBr,
		elBrContainer, elImgContainer, elNextToImgContainer, elUndesiredContainer,
		aImg, elImg, nImgWidth,
		elImgParent, nParentWidth,
		bConvertBrToNbsp,
		oNbsp = document.createTextNode('\u00A0'), oNbspClone,
		elBrParent;
		
		// br:last-child 탐색
		aBr = jindo.$$('br:last-child', elBody, {oneTimeOffCache : true});
		for(var i = 0, len = aBr.length; i < len; i++){
			elImg = null;
			elBrParent = null;
			elBr = aBr[i];
			
			// <br>부터 부모로 거슬러 올라가면서, previousSibling이 있는지 찾는다.
			elImgContainer = this._findNextSiblingRecursive(elBr, {isReverse : true});
			if(!(elImgContainer && (elImgContainer.nodeType === 1))){
				continue;
			}
			
			elBrContainer = elImgContainer.nextSibling;
			
			/*
			 * <br> container에서 부모로 거슬러 올라가면서, nextSibling이 있는지 찾는다.
			 * nextSibling이 없다는 것이 확인되어야만, 
			 * <br> container가 문단 맨 마지막에 있다는 것을
			 * 보장할 수 있기 때문이다.
			 */
			elUndesiredContainer = this._findNextSiblingRecursive(elBrContainer);
			 // <br> container 뒤의 container는 존재해서는 안 된다.
			if(elUndesiredContainer){
				continue;
			}
			
			if(elImgContainer.tagName.toUpperCase() === 'IMG'){
				// previousSibling이 <img>이면 바로 할당
				elImg = elImgContainer;
			}else{
				// previousSibling의 img:last-child 탐색
				aImg = jindo.$$('img:last-child', elImgContainer, {oneTimeOffCache : true});
				
				// 가장 마지막 <img>가 고려 대상이다. 즉, <br> 바로 앞에 위치하고 있을 것으로 추정되는 img
				if(aImg.length > 0){
					elImg = aImg[aImg.length - 1];
				}
			}
			
			if(elImg){
				/*
				 * <img> container 바로 뒤가 실제로 <br> container인지 확인.
				 * 레이아웃 상에서 실제로 <img> 뒤에 <br>이 붙어 있는지 확인하는 과정이다.
				 */
				elNextToImgContainer = this._findNextSiblingRecursive(elImg);
				if(elNextToImgContainer == elBrContainer){
					elImgParent = elImg.parentNode;
					if(!elImgParent){
						continue;
					}
					
					// <img>의 width 확인
					nImgWidth = jindo.$Element(elImg).width(),
					
					// <img> parentNode의 width 확인
					elImgParent = elImg.parentNode,
					nParentWidth = jindo.$Element(elImgParent).width();
					
					/*
					 * <img>와 parentNode의 width가 같은지 확인하여
					 * <img> 뒤의 <br>을 &nbsp;로 변환할지, 아니면 제거할지 판단한다.
					 */
					bConvertBrToNbsp = !(nImgWidth === nParentWidth);
				}else{
					// <img> container와 <br> container 사이에 다른 container가 존재한다면, &nbsp;로 변환
					bConvertBrToNbsp = true;
				}
			}else{
				// img:last-child 가 존재하지 않으면, <br>을 &nbsp;로 변환
				bConvertBrToNbsp = true;
			}
				
			elBrParent = elBr.parentNode;
			if(bConvertBrToNbsp){
				// <br>을 &nbsp;로 변환
				oNbspClone = oNbsp.cloneNode(false);
				
				elBrParent.replaceChild(oNbspClone, elBr);
			}else{
				// <br>을 &nbsp;로 변환하지 않고 제거해 버림
				this._recursiveRemoveChild(elBr);
			}
		}
	},
	
	/**
	 * 대상 element의 nextSibling이 있는지
	 * tree를 거슬러 올라가며 recursive 탐색
	 * 
	 * @param {HTMLElement} el 탐색 시작점 element
	 * @param {Object} htOption
	 *     @param {Boolean} htOption.isReverse nextSibling 이 아닌, previousSibling을 탐색
	 */
	_findNextSiblingRecursive : function(el, htOption){
		var elTarget = el,
		elSibling,
		elParent,
		isReverse = (htOption && htOption.isReverse) ? true : false,
		rxParagraph = new RegExp('^(P|DIV)$', 'i'),
		rxContainer = new RegExp('^(TD|BODY)$', 'i');
		
		/*
		 * 종료 조건
		 * -container 역할을 하는 태그로 지정한 TD, BODY가 parentNode가 될 때까지 거슬러 올라감
		 * -sibling 존재
		 */
		while(!elSibling){
			if(isReverse){
				elSibling = elTarget.previousSibling;
			}else{
				elSibling = elTarget.nextSibling;
			}
			
			elTarget = elTarget.parentNode;
			if(rxContainer.test(elTarget.tagName)){
				elSibling = null;
				break;
			}
		}
		
		return elSibling;
	},
	
	/**
	 * 대상 element를 parentNode에서 제거한다.
	 * 
	 * 이후, 
	 * parentNode 입장에서 
	 * childNode가 아무것도 없으면
	 * 그 parentNode에서 이 parentNode를 제거하는 작업을
	 * recursive로 수행한다.
	 */
	_recursiveRemoveChild : function(el){
		var elParent = el.parentNode,
		elChild = el,
		aChild;
		
		do{
			elParent.removeChild(elChild);
		}while((aChild = elParent.childNodes) && (aChild.length == 0) && (elChild = elParent) && (elParent = elParent.parentNode))
	},
	
	_cleanContents : function(sContents){
		return sContents.replace(new RegExp("(<img [^>]*>)"+unescape("%uFEFF")+"", "ig"), "$1");
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
var nSE2Version = "4a256db";
nhn.husky.SE_EditingAreaManager.version = {
	revision : "4a256db",
	type : "open",
	number : "2.9.0"
};