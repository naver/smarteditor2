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
 * @fileOverview This file contains Husky plugin that takes care of the operations related to resizing the editing area vertically
 * @name hp_SE_EditingAreaVerticalResizer.js
 */
nhn.husky.SE_EditingAreaVerticalResizer = jindo.$Class({
	name : "SE_EditingAreaVerticalResizer",
	
	oResizeGrip : null,
	sCookieNotice : "bHideResizeNotice",
	
	nEditingAreaMinHeight : null,	// [SMARTEDITORSUS-677] 편집 영역의 최소 높이
	htConversionMode : null,
	
	$init : function(elAppContainer, htConversionMode){
		this.htConversionMode = htConversionMode;
		this._assignHTMLElements(elAppContainer);
	},
	
	$BEFORE_MSG_APP_READY : function(){
		this.oApp.exec("ADD_APP_PROPERTY", ["isUseVerticalResizer", jindo.$Fn(this.isUseVerticalResizer, this).bind()]);
	},
	
	$ON_MSG_APP_READY : function(){
		if(this.oApp.bMobile){
			// [SMARTEDITORSUS-941] 모바일에서는 자동확장기능이 항상 켜져있도록 한다.
			// [SMARTEDITORSUS-1679] 하지만 사용자가 조절하지는 못하도록 버튼은 비활성화 한다.
			this.oResizeGrip.disabled = true;
			this.oResizeGrip.style.height = '0';	// 버튼의 문구를 가림. display:none을 하면 안드로이드에서 높이 계산오류 발생 
		}else{
			this.oApp.exec("REGISTER_HOTKEY", ["shift+esc", "FOCUS_RESIZER"]);

			// [SMARTEDITORSUS-906][SMARTEDITORSUS-1433] Resizbar 사용 여부 처리 (true:사용함/ false:사용하지 않음)
			if(this.isUseVerticalResizer()){
				this.oResizeGrip.style.display = 'block';
				if(!!this.welNoticeLayer && !Number(jindo.$Cookie().get(this.sCookieNotice))){
					this.welNoticeLayer.delegate("click", "BUTTON.bt_clse", jindo.$Fn(this._closeNotice, this).bind());
					this.welNoticeLayer.show();
				}
				this.$FnMouseDown = jindo.$Fn(this._mousedown, this);
				this.$FnMouseMove = jindo.$Fn(this._mousemove, this);
				this.$FnMouseUp = jindo.$Fn(this._mouseup, this);
				this.$FnMouseOver = jindo.$Fn(this._mouseover, this);
				this.$FnMouseOut = jindo.$Fn(this._mouseout, this);
				
				this.$FnMouseDown.attach(this.oResizeGrip, "mousedown");
				this.$FnMouseOver.attach(this.oResizeGrip, "mouseover");
				this.$FnMouseOut.attach(this.oResizeGrip, "mouseout");
				
			}else{
				this.oResizeGrip.style.display = 'none';
				if(!this.oApp.isUseModeChanger()){
					this.elModeToolbar.style.display = "none";
				}
			}
		}
		
		this.oApp.exec("ADD_APP_PROPERTY", ["checkResizeGripPosition", jindo.$Fn(this.checkResizeGripPosition, this).bind()]);	// [SMARTEDITORSUS-677]
		
		if(this.oApp.getEditingAreaHeight){
			this.nEditingAreaMinHeight = this.oApp.getEditingAreaHeight();	// [SMARTEDITORSUS-677] 편집 영역의 최소 높이를 가져와 Gap 처리 시 사용
		}
	},

	/**
	 * [SMARTEDITORSUS-2036][SMARTEDITORSUS-1585] DISABLE_ALL_UI 메시지가 발생하면 기능을 비활성화한다.
	 */
	$ON_DISABLE_ALL_UI : function(){
		this.oResizeGrip.style.cursor = "default";
		this.welConversionMode.addClass("off");
		this.oResizeGrip.disabled = true;
	},

	/**
	 * [SMARTEDITORSUS-2036][SMARTEDITORSUS-1585] ENABLE_ALL_UI 메시지가 발생하면 기능을 활성화한다.
	 */
	$ON_ENABLE_ALL_UI : function(){
		this.oResizeGrip.style.cursor = "n-resize";
		this.welConversionMode.removeClass("off");
		this.oResizeGrip.disabled = false;
	},
	
	isUseVerticalResizer : function(){
		return (typeof(this.htConversionMode) === 'undefined' || typeof(this.htConversionMode.bUseVerticalResizer) === 'undefined' || this.htConversionMode.bUseVerticalResizer === true) ? true : false;
	},
	
	/**
	 * [SMARTEDITORSUS-677] [에디터 자동확장 ON인 경우]
	 * 입력창 크기 조절 바의 위치를 확인하여 브라우저 하단에 위치한 경우 자동확장을 멈춤
	 */	
	checkResizeGripPosition : function(bExpand){
		var oDocument = jindo.$Document();
		var nGap = (jindo.$Element(this.oResizeGrip).offset().top - oDocument.scrollPosition().top + 25) - oDocument.clientSize().height;
		
		if(nGap <= 0){
			return;
		}

		if(bExpand){
			if(this.nEditingAreaMinHeight > this.oApp.getEditingAreaHeight() - nGap){	// [SMARTEDITORSUS-822] 수정 모드인 경우에 대비
				nGap = (-1) * (this.nEditingAreaMinHeight - this.oApp.getEditingAreaHeight());
			}
	
			// Gap 만큼 편집영역 사이즈를 조절하여
			// 사진 첨부나 붙여넣기 등의 사이즈가 큰 내용 추가가 있었을 때 입력창 크기 조절 바가 숨겨지지 않도록 함
			this.oApp.exec("MSG_EDITING_AREA_RESIZE_STARTED");
			this.oApp.exec("RESIZE_EDITING_AREA_BY", [0, (-1) * nGap]);
			this.oApp.exec("MSG_EDITING_AREA_RESIZE_ENDED");
		}
		
		this.oApp.exec("STOP_AUTORESIZE_EDITING_AREA");
	},	
	
	$ON_FOCUS_RESIZER : function(){
		this.oApp.exec("IE_HIDE_CURSOR");
		this.oResizeGrip.focus();
	},
	
	_assignHTMLElements : function(elAppContainer){
		//@ec[
		this.oResizeGrip = jindo.$$.getSingle("BUTTON.husky_seditor_editingArea_verticalResizer", elAppContainer);
		this.elModeToolbar = jindo.$$.getSingle("DIV.se2_conversion_mode", elAppContainer);
		//@ec]
		
		this.welNoticeLayer = jindo.$Element(jindo.$$.getSingle("DIV.husky_seditor_resize_notice", elAppContainer));
		this.welConversionMode = jindo.$Element(this.oResizeGrip.parentNode);
	},
	
	_mouseover : function(oEvent){
		oEvent.stopBubble();
		this.welConversionMode.addClass("controller_on");
	},

	_mouseout : function(oEvent){
		oEvent.stopBubble();
		this.welConversionMode.removeClass("controller_on");
	},
	
	_mousedown : function(oEvent){
		this.iStartHeight = oEvent.pos().clientY;
		this.iStartHeightOffset = oEvent.pos().layerY;

		this.$FnMouseMove.attach(document, "mousemove");
		this.$FnMouseUp.attach(document, "mouseup");

		this.iStartHeight = oEvent.pos().clientY;
		
		this.oApp.exec("HIDE_ACTIVE_LAYER");
		this.oApp.exec("HIDE_ALL_DIALOG_LAYER");

		this.oApp.exec("MSG_EDITING_AREA_RESIZE_STARTED", [this.$FnMouseDown, this.$FnMouseMove, this.$FnMouseUp]);
	},

	_mousemove : function(oEvent){
		var iHeightChange = oEvent.pos().clientY - this.iStartHeight;

		this.oApp.exec("RESIZE_EDITING_AREA_BY", [0, iHeightChange]);
	},

	_mouseup : function(){
		this.$FnMouseMove.detach(document, "mousemove");
		this.$FnMouseUp.detach(document, "mouseup");

		this.oApp.exec("MSG_EDITING_AREA_RESIZE_ENDED", [this.$FnMouseDown, this.$FnMouseMove, this.$FnMouseUp]);
	},
	
	_closeNotice : function(){
		this.welNoticeLayer.hide();
		jindo.$Cookie().set(this.sCookieNotice, 1, 365*10);
	}
});
//}