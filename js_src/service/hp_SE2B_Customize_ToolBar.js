/**
 * @name nhn.husky.SE2B_Customize_ToolBar
 * @description 메일 전용 커스터마이즈 툴바로 더보기 레이어 관리만을 담당하고 있음.
 * @class
 * @author HyeKyoung,NHN AjaxUI Lab, CMD Division
 * @version 0.1.0
 * @since
 */

nhn.husky.SE2B_Customize_ToolBar = jindo.$Class(/** @lends nhn.husky.SE2B_Customize_ToolBar */{
	name : "SE2B_Customize_ToolBar",
	/**
	 * @constructs
	 * @param {Object} oAppContainer 에디터를 구성하는 컨테이너
	 */
	$init : function(oAppContainer) {
		this._assignHTMLElements(oAppContainer);
	},
	$BEFORE_MSG_APP_READY : function(){
		this._addEventMoreButton();
	},
	
	/**
	 * @private
	 * @description DOM엘리먼트를 수집하는 메소드
	 * @param {Object} oAppContainer 툴바 포함 에디터를 감싸고 있는 div 엘리먼트
	 */
	_assignHTMLElements : function(oAppContainer) {
		this.oAppContainer = oAppContainer;
		this.elTextToolBarArea =  jindo.$$.getSingle("div.se2_tool");
		this.elTextMoreButton =  jindo.$$.getSingle("button.se2_text_tool_more", this.elTextToolBarArea);
		this.elTextMoreButtonParent = this.elTextMoreButton.parentNode;
		this.welTextMoreButtonParent = jindo.$Element(this.elTextMoreButtonParent);
		this.elMoreLayer =  jindo.$$.getSingle("div.se2_sub_text_tool");
	},

	_addEventMoreButton : function (){
		this.oApp.registerBrowserEvent(this.elTextMoreButton, "click", "EVENT_CLICK_EXPAND_VIEW");
		this.oApp.registerBrowserEvent(this.elMoreLayer, "click", "EVENT_CLICK_EXPAND_VIEW");			
	},
	
	$ON_EVENT_CLICK_EXPAND_VIEW : function(weEvent){
		this.oApp.exec("TOGGLE_EXPAND_VIEW", [this.elTextMoreButton]);
		weEvent.stop();
	},
	
	$ON_TOGGLE_EXPAND_VIEW : function(){
		if(!this.welTextMoreButtonParent.hasClass("active")){
			this.oApp.exec("SHOW_EXPAND_VIEW");
		} else {
			this.oApp.exec("HIDE_EXPAND_VIEW");
		}
	},
	
	$ON_CHANGE_EDITING_MODE : function(sMode){
		if(sMode != "WYSIWYG"){
			this.elTextMoreButton.disabled =true;
			this.welTextMoreButtonParent.removeClass("active");
			this.oApp.exec("HIDE_EXPAND_VIEW");
		}else{
			this.elTextMoreButton.disabled =false;
		}
	},
	
	$AFTER_SHOW_ACTIVE_LAYER : function(){
		this.oApp.exec("HIDE_EXPAND_VIEW");
	},
	
	$AFTER_SHOW_DIALOG_LAYER : function(){
		this.oApp.exec("HIDE_EXPAND_VIEW");
	},
	
	$ON_SHOW_EXPAND_VIEW : function(){
		this.welTextMoreButtonParent.addClass("active");
		this.elMoreLayer.style.display = "block";
	},
	
	$ON_HIDE_EXPAND_VIEW : function(){
		this.welTextMoreButtonParent.removeClass("active");
		this.elMoreLayer.style.display = "none";
	},
	
	/**
	 * CHANGE_EDITING_MODE모드 이후에 호출되어야 함. 
	 * WYSIWYG 모드가 활성화되기 전에 호출이 되면 APPLY_FONTCOLOR에서 에러 발생.
	 */
	$ON_RESET_TOOLBAR : function(){
		if(this.oApp.getEditingMode() !== "WYSIWYG"){			
			return;
		}
		//스펠체크 닫기 
		this.oApp.exec("END_SPELLCHECK");		
		//열린 팝업을 닫기 위해서
		this.oApp.exec("DISABLE_ALL_UI");
		this.oApp.exec("ENABLE_ALL_UI");
		//글자색과 글자 배경색을 제외한 세팅
		this.oApp.exec("RESET_STYLE_STATUS");
		this.oApp.exec("CHECK_STYLE_CHANGE");
		//최근 사용한 글자색 셋팅.
		this.oApp.exec("APPLY_FONTCOLOR", ["#000000"]);
		//더보기 영역 닫기.
		this.oApp.exec("HIDE_EXPAND_VIEW");
	}
});