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

	$init : function(elAppContainer){
		this._assignHTMLElements(elAppContainer);
	},

	$ON_MSG_APP_READY : function(){
		this.$FnMouseDown = jindo.$Fn(this._mousedown, this);
		this.$FnMouseMove = jindo.$Fn(this._mousemove, this);
		this.$FnMouseUp = jindo.$Fn(this._mouseup, this);
		this.$FnMouseOver = jindo.$Fn(this._mouseover, this);
		this.$FnMouseOut = jindo.$Fn(this._mouseout, this);

		this.$FnMouseDown.attach(this.oResizeGrip, "mousedown");
		this.$FnMouseOver.attach(this.oResizeGrip, "mouseover");
		this.$FnMouseOut.attach(this.oResizeGrip, "mouseout");
		
		jindo.$Fn(this._closeNotice, this).attach(this.elCloseLayerBtn, "click");
		
		this.oApp.exec("REGISTER_HOTKEY", ["shift+esc", "FOCUS_RESIZER"]);
		
		this.oApp.exec("ADD_APP_PROPERTY", ["checkResizeGripPosition", jindo.$Fn(this.checkResizeGripPosition, this).bind()]);	// [SMARTEDITORSUS-677]
		
		if(!!this.welNoticeLayer && !Number(jindo.$Cookie().get(this.sCookieNotice))){
			this.welNoticeLayer.show();
		}
		
		if(!!this.oApp.getEditingAreaHeight){
			this.nEditingAreaMinHeight = this.oApp.getEditingAreaHeight();	// [SMARTEDITORSUS-677] 편집 영역의 최소 높이를 가져와 Gap 처리 시 사용
		}
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
		this.elNoticeLayer = jindo.$$.getSingle("DIV.husky_seditor_resize_notice", elAppContainer);
		//@ec]
		
		this.welConversionMode = jindo.$Element(this.oResizeGrip.parentNode);
		
		if(!!this.elNoticeLayer){
			this.welNoticeLayer = jindo.$Element(this.elNoticeLayer);
			this.elCloseLayerBtn = jindo.$$.getSingle("BUTTON.bt_clse", this.elNoticeLayer);
		}
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

	_mouseup : function(oEvent){
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