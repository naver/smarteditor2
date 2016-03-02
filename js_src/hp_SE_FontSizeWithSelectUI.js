/**
 * @pluginDesc Select 엘리먼트를 이용한 폰트 사이즈 변경 플러그인
 * @name hp_SE_FontSizeWithSelectUI.js
 */
nhn.husky.SE_FontSizeWithSelectUI = $Class({
	name : "SE_FontSizeWithSelectUI",

	$init : function(elAppContainer){
		this._assignHTMLObjects(elAppContainer);
	},
	
	_assignHTMLObjects : function(elAppContainer){
		this.elFontSizeSelect = cssquery.getSingle("SELECT.husky_seditor_ui_fontSize_select", elAppContainer);
	},

	$ON_MSG_APP_READY : function(){
		this.oApp.registerBrowserEvent(this.elFontSizeSelect, "change", "SET_FONTSIZE_FROM_SELECT_UI");
		this.elFontSizeSelect.selectedIndex = 0;
	},
	
	$ON_MSG_STYLE_CHANGED : function(sAttributeName, sAttributeValue){
		if(sAttributeName == "fontSize"){
			this.elFontSizeSelect.value = sAttributeValue;
			if(this.elFontSizeSelect.selectedIndex < 0) this.elFontSizeSelect.selectedIndex = 0;
		}
	},

	$ON_SET_FONTSIZE_FROM_SELECT_UI : function(){
		var sFontSize = this.elFontSizeSelect.value;
		if(!sFontSize) return;

		this.oApp.exec("SET_WYSIWYG_STYLE", [{"fontSize":sFontSize}]);
		this.oApp.exec("CHECK_STYLE_CHANGE", []);
	}
});