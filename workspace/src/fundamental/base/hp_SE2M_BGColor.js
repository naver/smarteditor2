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
		this.elLastUsed = jindo.$$.getSingle("SPAN.husky_se2m_BGColor_lastUsed", elAppContainer);
	
		this.elDropdownLayer = jindo.$$.getSingle("DIV.husky_se2m_BGColor_layer", elAppContainer);
		this.elBGColorList = jindo.$$.getSingle("UL.husky_se2m_bgcolor_list", elAppContainer);
		this.elPaletteHolder = jindo.$$.getSingle("DIV.husky_se2m_BGColor_paletteHolder", this.elDropdownLayer);
		//@ec]

		this._setLastUsedBGColor("#777777");
	},
	
	$BEFORE_MSG_APP_READY : function() {
		this.oApp.exec("ADD_APP_PROPERTY", ["getLastUsedBackgroundColor", jindo.$Fn(this.getLastUsedBGColor, this).bind()]);
  	},
	
	$ON_MSG_APP_READY : function(){
		this.oApp.exec("REGISTER_UI_EVENT", ["BGColorA", "click", "APPLY_LAST_USED_BGCOLOR"]);
		this.oApp.exec("REGISTER_UI_EVENT", ["BGColorB", "click", "TOGGLE_BGCOLOR_LAYER"]);

		this.oApp.registerBrowserEvent(this.elBGColorList, "click", "EVENT_APPLY_BGCOLOR", []);
		this.oApp.registerLazyMessage(["APPLY_LAST_USED_BGCOLOR", "TOGGLE_BGCOLOR_LAYER"], ["hp_SE2M_BGColor$Lazy.js"]);
	},

	_setLastUsedBGColor : function(sBGColor){
		this.sLastUsedColor = sBGColor;
		this.elLastUsed.style.backgroundColor = this.sLastUsedColor;
	},
	
	getLastUsedBGColor : function(){
		return (!!this.sLastUsedColor) ? this.sLastUsedColor : '#777777';
	}
});
//}