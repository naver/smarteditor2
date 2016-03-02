/*[
 * EVENT_TOGGLE_EDITING_MODE
 *
 * 현재 편집 모드에 따라서 편집 모드를 토글한다. (HTMLSrc/WYSIWYG)
 *
 * none
 *
---------------------------------------------------------------------------]*/
/*[
 * CHANGE_EDITING_MODE
 *
 * 편집 모드를 전환시킨다.
 *
 * sMode string HTMLSrc/WYSIWYG중 전환할 모드
 *
---------------------------------------------------------------------------]*/
/**
 * @pluginDesc button이 눌렸을 때 편집 모드 HTMLSrc/WYSIWYG를 토글 전환하는 플러그인
 */
nhn.husky.SE_EditingModeToggler = $Class({
	name : "SE_EditingModeToggler",
	
	$init : function(elAppContainer){
		this._assignHTMLObjects(elAppContainer);
	},

	_assignHTMLObjects : function(elAppContainer){
		elAppContainer = $(elAppContainer) || document;

		this.elModeToggleButton = cssquery.getSingle("BUTTON.husky_seditor_mode_toggle_button", elAppContainer);
		this.welModeToggleButton = $Element(this.elModeToggleButton);
	},
	
	$ON_MSG_APP_READY : function(){
		this.oApp.registerBrowserEvent(this.elModeToggleButton, "click", "EVENT_TOGGLE_EDITING_MODE", []);
	},
	
	$ON_EVENT_TOGGLE_EDITING_MODE : function(){
		if(this.oApp.getEditingMode() == "WYSIWYG")
			this.oApp.exec("CHANGE_EDITING_MODE", ["HTMLSrc"]);
		else
			this.oApp.exec("CHANGE_EDITING_MODE", ["WYSIWYG"]);
	},
	
	$ON_CHANGE_EDITING_MODE : function(sMode){
		if(sMode == "HTMLSrc"){
			this.welModeToggleButton.addClass("active");
			this.oApp.exec("DISABLE_ALL_UI", []);
		}else{
			this.welModeToggleButton.removeClass("active");
			this.oApp.exec("ENABLE_ALL_UI", []);
		}
	}
});