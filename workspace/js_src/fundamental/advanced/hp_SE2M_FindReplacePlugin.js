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
/**
 * @fileOverview This file contains Husky plugin that takes care of the operations related to Find/Replace
 * @name hp_SE2M_FindReplacePlugin.js
 */
nhn.husky.SE2M_FindReplacePlugin = jindo.$Class({
	name : "SE2M_FindReplacePlugin",
	oEditingWindow : null,
	oFindReplace :  null,
	bFindMode : true,
	bLayerShown : false,

	$init : function(){
		this.nDefaultTop = 20;
	},
	
	$ON_MSG_APP_READY : function(){
		// the right document will be available only when the src is completely loaded
		this.oEditingWindow = this.oApp.getWYSIWYGWindow();

		// [SMARTEDITORSUS-2260] 메일 > Mac에서 ctrl 조합 단축키 모두 meta 조합으로 변경
		if (jindo.$Agent().os().mac) {
			this.oApp.exec("REGISTER_HOTKEY", ["meta+f", "SHOW_FIND_LAYER", []]);
			this.oApp.exec("REGISTER_HOTKEY", ["meta+h", "SHOW_REPLACE_LAYER", []]);
		} else {
			this.oApp.exec("REGISTER_HOTKEY", ["ctrl+f", "SHOW_FIND_LAYER", []]);
			this.oApp.exec("REGISTER_HOTKEY", ["ctrl+h", "SHOW_REPLACE_LAYER", []]);
		}

		this.oApp.exec("REGISTER_UI_EVENT", ["findAndReplace", "click", "TOGGLE_FIND_REPLACE_LAYER"]);
		this.oApp.registerLazyMessage(["TOGGLE_FIND_REPLACE_LAYER","SHOW_FIND_LAYER","SHOW_REPLACE_LAYER","SHOW_FIND_REPLACE_LAYER"], ["hp_SE2M_FindReplacePlugin$Lazy.js","N_FindReplace.js"]);
	},
	
	$ON_SHOW_ACTIVE_LAYER : function(){
		this.oApp.exec("HIDE_DIALOG_LAYER", [this.elDropdownLayer]);
	}
});