//{
/**
 * @fileOverview This file contains Husky plugin that takes care of the operations related to changing the font color
 * @name hp_SE_FontColor.js
 */
nhn.husky.SE2M_FontColor = jindo.$Class({
	name : "SE2M_FontColor",
	rxColorPattern : /^#?[0-9a-fA-F]{6}$|^rgb\(\d+, ?\d+, ?\d+\)$/i,

	$init : function(elAppContainer){
		this._assignHTMLElements(elAppContainer);
	},
	
	_assignHTMLElements : function(elAppContainer){
		//@ec[
		this.elLastUsed = jindo.$$.getSingle("BUTTON.husky_se2m_fontColor_lastUsed", elAppContainer);

		this.elDropdownLayer = jindo.$$.getSingle("DIV.husky_se2m_fontcolor_layer", elAppContainer);
		this.elPaletteHolder = jindo.$$.getSingle("DIV.husky_se2m_fontcolor_paletteHolder", this.elDropdownLayer);
		//@ec]

		this._setLastUsedFontColor("#000000");
	},

	$ON_MSG_APP_READY : function(){
		this.oApp.exec("REGISTER_UI_EVENT", ["fontColorA", "click", "APPLY_LAST_USED_FONTCOLOR"]);
		this.oApp.exec("REGISTER_UI_EVENT", ["fontColorB", "click", "TOGGLE_FONTCOLOR_LAYER"]);
	},

	//@lazyload_js APPLY_LAST_USED_FONTCOLOR,TOGGLE_FONTCOLOR_LAYER[
	$ON_TOGGLE_FONTCOLOR_LAYER : function(){
		this.oApp.exec("TOGGLE_TOOLBAR_ACTIVE_LAYER", [this.elDropdownLayer, null, "FONTCOLOR_LAYER_SHOWN", [], "FONTCOLOR_LAYER_HIDDEN", []]);
		this.oApp.exec('MSG_NOTIFY_CLICKCR', ['fontcolor']);
	},
	
	$ON_FONTCOLOR_LAYER_SHOWN : function(){
		this.oApp.exec("SELECT_UI", ["fontColorB"]);
		this.oApp.exec("SHOW_COLOR_PALETTE", ["APPLY_FONTCOLOR", this.elPaletteHolder]);
	},

	$ON_FONTCOLOR_LAYER_HIDDEN : function(){
		this.oApp.exec("DESELECT_UI", ["fontColorB"]);
		this.oApp.exec("RESET_COLOR_PALETTE", []);
	},
	
	$ON_APPLY_LAST_USED_FONTCOLOR : function(){
		this.oApp.exec("APPLY_FONTCOLOR", [this.sLastUsedColor]);
		this.oApp.exec('MSG_NOTIFY_CLICKCR', ['fontcolor']);
	},
	
	$ON_APPLY_FONTCOLOR : function(sFontColor){
		if(!this.rxColorPattern.test(sFontColor)){
			alert(this.oApp.$MSG("SE_FontColor.invalidColorCode"));
			return;
		}
		var oAgent = jindo.$Agent().navigator();	
		this._setLastUsedFontColor(sFontColor);
		
		if( oAgent.ie || oAgent.firefox ){	// [SMARTEDITORSUS-658] Firefox 추가
			this.oApp.exec("SET_WYSIWYG_STYLE", [{"color":sFontColor}]);
		} else {
			var bDontAddUndoHistory = false;
			
			if(this.oApp.getSelection().collapsed){
				bDontAddUndoHistory = true;
			}
			
			this.oApp.exec("EXECCOMMAND", ["ForeColor", false, sFontColor, { "bDontAddUndoHistory" : bDontAddUndoHistory }]);
			
			if(bDontAddUndoHistory){
				this.oApp.exec("RECORD_UNDO_ACTION", ["FONT COLOR", {bMustBlockElement : true}]);
			}
		}
		
		this.oApp.exec("HIDE_ACTIVE_LAYER");
	},
	//@lazyload_js]

	_setLastUsedFontColor : function(sFontColor){
		this.sLastUsedColor = sFontColor;
		this.elLastUsed.style.backgroundColor = this.sLastUsedColor;
	}
});
//}