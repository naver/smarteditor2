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
 * @fileOverview This file contains Husky plugin that takes care of the operations related to inserting special characters
 * @name hp_SE2M_SCharacter.js
 * @required HuskyRangeManager
 */
nhn.husky.SE2M_SCharacter = jindo.$Class({
	name : "SE2M_SCharacter",

	$ON_MSG_APP_READY : function(){
		this.oApp.exec("REGISTER_UI_EVENT", ["sCharacter", "click", "TOGGLE_SCHARACTER_LAYER"]);
		this.oApp.registerLazyMessage(["TOGGLE_SCHARACTER_LAYER"], ["hp_SE2M_SCharacter$Lazy.js"]);
	}
});