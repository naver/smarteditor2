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
nhn.husky.HuskyCore.addLoadedFile("hp_SE2M_BGColor$Lazy.js");
/**
 * @depends nhn.husky.SE2M_BGColor
 * this.oApp.registerLazyMessage(["APPLY_LAST_USED_BGCOLOR", "TOGGLE_BGCOLOR_LAYER"], ["hp_SE2M_BGColor$Lazy.js"]);
 */
nhn.husky.HuskyCore.mixin(nhn.husky.SE2M_BGColor, {
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
	}
	//@lazyload_js]
});