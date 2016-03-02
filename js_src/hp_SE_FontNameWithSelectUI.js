/**
 * @pluginDesc Select 엘리먼트를 이용한 폰트명 변경 플러그인
 */
nhn.husky.SE_FontNameWithSelectUI = $Class({
	name : "SE_FontNameWithSelectUI",

	$init : function(elAppContainer){
		this._assignHTMLObjects(elAppContainer);
	},
	
	_assignHTMLObjects : function(elAppContainer){
		this.elFontNameSelect = cssquery.getSingle("SELECT.husky_seditor_ui_fontName_select", elAppContainer);
	},
	
	$ON_MSG_APP_READY : function(){
		this.oApp.registerBrowserEvent(this.elFontNameSelect, "change", "SET_FONTNAME_FROM_SELECT_UI");
		this.elFontNameSelect.selectedIndex = 0;
	},
	
	$ON_MSG_STYLE_CHANGED : function(sAttributeName, sAttributeValue){
		if(sAttributeName == "fontFamily"){
			this.elFontNameSelect.value = sAttributeValue.toLowerCase();
			if(this.elFontNameSelect.selectedIndex < 0) this.elFontNameSelect.selectedIndex = 0;
		}
	},
	
	$ON_SET_FONTNAME_FROM_SELECT_UI : function(){
		var sFontName = this.elFontNameSelect.value;
		if(!sFontName) return;
		
		this.oApp.exec("SET_WYSIWYG_STYLE", [{"fontFamily":sFontName}]);
		this.oApp.exec("CHECK_STYLE_CHANGE", []);
	}
});