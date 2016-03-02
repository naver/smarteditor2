//{
/**
 * @fileOverview This file contains Husky plugin that takes care of the operations related to changing the editing mode using a Button element
 * @name hp_SE2M_EditingModeChanger.js
 */
nhn.husky.SE2M_EditingModeChanger = jindo.$Class({
	name : "SE2M_EditingModeChanger",
	
	$init : function(elAppContainer){
		this._assignHTMLElements(elAppContainer);
	},

	_assignHTMLElements : function(elAppContainer){
		elAppContainer = jindo.$(elAppContainer) || document;

		//@ec[
		this.elWYSIWYGButton = jindo.$$.getSingle("BUTTON.se2_to_editor", elAppContainer);
		this.elHTMLSrcButton = jindo.$$.getSingle("BUTTON.se2_to_html", elAppContainer);
		this.elTEXTButton = jindo.$$.getSingle("BUTTON.se2_to_text", elAppContainer);		
		//@ec]

		this.welWYSIWYGButtonLi = jindo.$Element(this.elWYSIWYGButton.parentNode);
		this.welHTMLSrcButtonLi = jindo.$Element(this.elHTMLSrcButton.parentNode);
		this.welTEXTButtonLi = jindo.$Element(this.elTEXTButton.parentNode);		

	},
	
	$ON_MSG_APP_READY : function(){
		this.oApp.registerBrowserEvent(this.elWYSIWYGButton, "click", "EVENT_CHANGE_EDITING_MODE_CLICKED", ["WYSIWYG"]);
		this.oApp.registerBrowserEvent(this.elHTMLSrcButton, "click", "EVENT_CHANGE_EDITING_MODE_CLICKED", ["HTMLSrc"]);
		this.oApp.registerBrowserEvent(this.elTEXTButton, "click", "EVENT_CHANGE_EDITING_MODE_CLICKED", ["TEXT", false]);
	},
	
	$ON_EVENT_CHANGE_EDITING_MODE_CLICKED : function(sMode, bNoAlertMsg){
		if (sMode == 'TEXT') {
			//에디터 영역 내에 모든 내용 가져옴. 
	    	var sContent = this.oApp.getIR();
	    	
			// 내용이 있으면 경고창 띄우기
			if (sContent.length > 0 && !bNoAlertMsg) {
				if ( !confirm(this.oApp.$MSG("SE2M_EditingModeChanger.confirmTextMode")) ) {
					return false;
				}
			}
			this.oApp.exec("CHANGE_EDITING_MODE", [sMode]);
		}else{
			this.oApp.exec("CHANGE_EDITING_MODE", [sMode]);
		}
		
		if ('HTMLSrc' == sMode) {
			this.oApp.exec('MSG_NOTIFY_CLICKCR', ['htmlmode']);
		} else if ('TEXT' == sMode) {
			this.oApp.exec('MSG_NOTIFY_CLICKCR', ['textmode']);
		} else {
			this.oApp.exec('MSG_NOTIFY_CLICKCR', ['editormode']);
		}
	},
	
	$ON_DISABLE_ALL_UI : function(htOptions){
		htOptions = htOptions || {};
		var waExceptions = jindo.$A(htOptions.aExceptions || []);

		if(waExceptions.has("mode_switcher")){
			return;
		}
		if(this.oApp.getEditingMode() == "WYSIWYG"){
			this.welWYSIWYGButtonLi.removeClass("active");
			this.elHTMLSrcButton.disabled = true;
			this.elTEXTButton.disabled = true;
		} else if (this.oApp.getEditingMode() == 'TEXT') {
			this.welTEXTButtonLi.removeClass("active");
			this.elWYSIWYGButton.disabled = true;
			this.elHTMLSrcButton.disabled = true;
		}else{
			this.welHTMLSrcButtonLi.removeClass("active");
			this.elWYSIWYGButton.disabled = true;
			this.elTEXTButton.disabled = true;
		}
	},
	
	$ON_ENABLE_ALL_UI : function(){
		if(this.oApp.getEditingMode() == "WYSIWYG"){
			this.welWYSIWYGButtonLi.addClass("active");
			this.elHTMLSrcButton.disabled = false;
			this.elTEXTButton.disabled = false;
		} else if (this.oApp.getEditingMode() == 'TEXT') {
			this.welTEXTButtonLi.addClass("active");
			this.elWYSIWYGButton.disabled = false;
			this.elHTMLSrcButton.disabled = false;
		}else{
			this.welHTMLSrcButtonLi.addClass("active");
			this.elWYSIWYGButton.disabled = false;
			this.elTEXTButton.disabled = false;
		}
	},

	$ON_CHANGE_EDITING_MODE : function(sMode){
		if(sMode == "HTMLSrc"){
			this.welWYSIWYGButtonLi.removeClass("active");
			this.welHTMLSrcButtonLi.addClass("active");
			this.welTEXTButtonLi.removeClass("active");
			
			this.elWYSIWYGButton.disabled = false;
			this.elHTMLSrcButton.disabled = true;
			this.elTEXTButton.disabled = false;
			this.oApp.exec("HIDE_ALL_DIALOG_LAYER");
			
			this.oApp.exec("DISABLE_ALL_UI", [{aExceptions:["mode_switcher"]}]);
		} else if (sMode == 'TEXT') {
			this.welWYSIWYGButtonLi.removeClass("active");
			this.welHTMLSrcButtonLi.removeClass("active");
			this.welTEXTButtonLi.addClass("active");
			
			this.elWYSIWYGButton.disabled = false;
			this.elHTMLSrcButton.disabled = false;
			this.elTEXTButton.disabled = true; 
			this.oApp.exec("HIDE_ALL_DIALOG_LAYER");
			this.oApp.exec("DISABLE_ALL_UI", [{aExceptions:["mode_switcher"]}]);
		}else{
			this.welWYSIWYGButtonLi.addClass("active");
			this.welHTMLSrcButtonLi.removeClass("active");
			this.welTEXTButtonLi.removeClass("active");

			this.elWYSIWYGButton.disabled = true;
			this.elHTMLSrcButton.disabled = false;
			this.elTEXTButton.disabled = false;
			
			this.oApp.exec("RESET_STYLE_STATUS");
			this.oApp.exec("ENABLE_ALL_UI", []);
		}
	}
});
//}