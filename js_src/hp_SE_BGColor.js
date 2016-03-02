/**
 * @pluginDesc 배경색 변경 플러그인
 */
nhn.husky.SE_BGColor = $Class({
	name : "SE_BGColor",
	rxColorPattern : /^#?[0-9a-fA-F]{6}$|^rgb\(\d+, ?\d+, ?\d+\)$/i,
	
	$init : function(elAppContainer){
		this._assignHTMLObjects(elAppContainer);
	},
	
	_assignHTMLObjects : function(elAppContainer){
		this.elDropdownLayer = cssquery.getSingle("DIV.husky_seditor_bgcolor_layer", elAppContainer);
	},
	
	$ON_MSG_APP_READY : function(){
		this.oApp.exec("REGISTER_UI_EVENT", ["bgColor", "click", "TOGGLE_BGCOLOR_LAYER"]);

		this.oApp.registerBrowserEvent(this.elDropdownLayer, "click", "EVENT_APPLY_BGCOLOR", []);
	},
	
	$ON_TOGGLE_BGCOLOR_LAYER : function(){
		this.oApp.exec("TOGGLE_TOOLBAR_ACTIVE_LAYER", [this.elDropdownLayer, null, "SHOW_COLOR_PALETTE", ["APPLY_BGCOLOR", this.elDropdownLayer]]);
	},

	$ON_EVENT_APPLY_BGCOLOR : function(weEvent){
		var elButton = weEvent.element;

		// Safari/Chrome/Opera may capture the event on Span
		if(elButton.tagName == "SPAN") elButton = elButton.parentNode;
		if(elButton.tagName != "BUTTON") return;

		var sBGColor, sFontColor;

		sBGColor = elButton.style.backgroundColor;
		sFontColor = elButton.style.color;

		this.oApp.exec("APPLY_BGCOLOR", [sBGColor, sFontColor]);
	},

	$ON_APPLY_BGCOLOR : function(sBGColor, sFontColor){
		if(!this.rxColorPattern.test(sBGColor)){
			alert(this.oApp.$MSG("SE_BGColor.invalidColorCode"));
			return;
		}
		
		var oStyle = {"backgroundColor": sBGColor}
		if(sFontColor) oStyle.color = sFontColor;
		
		this.oApp.exec("SET_WYSIWYG_STYLE", [oStyle]);
		
		this.oApp.exec("HIDE_ACTIVE_LAYER");
	}
});