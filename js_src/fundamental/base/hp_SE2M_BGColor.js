//{
/**
 * @fileOverview This file contains Husky plugin that takes care of changing the background color
 * @name hp_SE2M_BGColor.js
 */
nhn.husky.SE2M_BGColor = jindo.$Class({
	name : "SE2M_BGColor",
	rxColorPattern : /^#?[0-9a-fA-F]{6}$|^rgb\(\d+, ?\d+, ?\d+\)$/i,
	
	$init : function(elAppContainer){
		this._assignHTMLElements(elAppContainer);
	},
	
	_assignHTMLElements : function(elAppContainer){
		//@ec[
		this.elLastUsed = jindo.$$.getSingle("BUTTON.husky_se2m_BGColor_lastUsed", elAppContainer);
	
		this.elDropdownLayer = jindo.$$.getSingle("DIV.husky_se2m_BGColor_layer", elAppContainer);
		this.elBGColorList = jindo.$$.getSingle("UL.husky_se2m_bgcolor_list", elAppContainer);
		this.elPaletteHolder = jindo.$$.getSingle("DIV.husky_se2m_BGColor_paletteHolder", this.elDropdownLayer);
		//@ec]

		this._setLastUsedBGColor("#777777");
	},
	
	$ON_MSG_APP_READY : function(){
		this.oApp.exec("REGISTER_UI_EVENT", ["BGColorA", "click", "APPLY_LAST_USED_BGCOLOR"]);
		this.oApp.exec("REGISTER_UI_EVENT", ["BGColorB", "click", "TOGGLE_BGCOLOR_LAYER"]);

		this.oApp.registerBrowserEvent(this.elBGColorList, "click", "EVENT_APPLY_BGCOLOR", []);
	},
	
	//@lazyload_js APPLY_LAST_USED_BGCOLOR,TOGGLE_BGCOLOR_LAYER[
	$ON_TOGGLE_BGCOLOR_LAYER : function(){
		this.oApp.exec("TOGGLE_TOOLBAR_ACTIVE_LAYER", [this.elDropdownLayer, null, "BGCOLOR_LAYER_SHOWN", [], "BGCOLOR_LAYER_HIDDEN", []]);
		this.oApp.exec('MSG_NOTIFY_CLICKCR', ['bgcolor']);
	},
	
	$ON_BGCOLOR_LAYER_SHOWN : function(){
		this.oApp.exec("SELECT_UI", ["BGColorB"]);
		this.oApp.exec("SHOW_COLOR_PALETTE", ["APPLY_BGCOLOR", this.elPaletteHolder]);
	},

	$ON_BGCOLOR_LAYER_HIDDEN : function(){
		this.oApp.exec("DESELECT_UI", ["BGColorB"]);
		this.oApp.exec("RESET_COLOR_PALETTE", []);
	},

	$ON_EVENT_APPLY_BGCOLOR : function(weEvent){
		var elButton = weEvent.element;

		// Safari/Chrome/Opera may capture the event on Span
		while(elButton.tagName == "SPAN"){elButton = elButton.parentNode;}
		if(elButton.tagName != "BUTTON"){return;}

		var sBGColor, sFontColor;

		sBGColor = elButton.style.backgroundColor;
		sFontColor = elButton.style.color;

		this.oApp.exec("APPLY_BGCOLOR", [sBGColor, sFontColor]);
	},
	
	$ON_APPLY_LAST_USED_BGCOLOR : function(){
		this.oApp.exec("APPLY_BGCOLOR", [this.sLastUsedColor]);
		this.oApp.exec('MSG_NOTIFY_CLICKCR', ['bgcolor']);
	},

	$ON_APPLY_BGCOLOR : function(sBGColor, sFontColor){
		if(!this.rxColorPattern.test(sBGColor)){
			alert(this.oApp.$MSG("SE_Color.invalidColorCode"));
			return;
		}
		this._setLastUsedBGColor(sBGColor);

		var oStyle = {"backgroundColor": sBGColor};
		if(sFontColor){oStyle.color = sFontColor;}
		
		this.oApp.exec("SET_WYSIWYG_STYLE", [oStyle]);
		
		this.oApp.exec("HIDE_ACTIVE_LAYER");
	},
	//@lazyload_js]

	_setLastUsedBGColor : function(sBGColor){
		this.sLastUsedColor = sBGColor;
		this.elLastUsed.style.backgroundColor = this.sLastUsedColor;
	}
});
//}