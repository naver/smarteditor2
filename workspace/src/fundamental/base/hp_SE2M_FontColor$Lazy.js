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
nhn.husky.HuskyCore.addLoadedFile("hp_SE2M_FontColor$Lazy.js");
/**
 * @depends nhn.husky.SE2M_FontColor
 * this.oApp.registerLazyMessage(["APPLY_LAST_USED_FONTCOLOR", "TOGGLE_FONTCOLOR_LAYER"], ["hp_SE2M_FontColor$Lazy.js"]);
 */
nhn.husky.HuskyCore.mixin(nhn.husky.SE2M_FontColor, {
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

		this._setLastUsedFontColor(sFontColor);
		
		this.oApp.exec("SET_WYSIWYG_STYLE", [{"color":sFontColor}]);

		// [SMARTEDITORSUS-907] 모든 브라우저에서 SET_WYSIWYG_STYLE로 색상을 설정하도록 변경
		// var oAgent = jindo.$Agent().navigator();
		// if( oAgent.ie || oAgent.firefox ){	// [SMARTEDITORSUS-658] Firefox 추가
		//	this.oApp.exec("SET_WYSIWYG_STYLE", [{"color":sFontColor}]);
		// } else {
		// 	var bDontAddUndoHistory = false;
			
		// 	if(this.oApp.getSelection().collapsed){
		// 		bDontAddUndoHistory = true;
		// 	}
			
		// 	this.oApp.exec("EXECCOMMAND", ["ForeColor", false, sFontColor, { "bDontAddUndoHistory" : bDontAddUndoHistory }]);
			
		// 	if(bDontAddUndoHistory){
		// 		this.oApp.exec("RECORD_UNDO_ACTION", ["FONT COLOR", {bMustBlockElement : true}]);
		// 	}
		// }
		
		this.oApp.exec("HIDE_ACTIVE_LAYER");
	}
	//@lazyload_js]
});