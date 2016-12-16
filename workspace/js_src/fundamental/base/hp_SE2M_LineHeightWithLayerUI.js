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
 * @fileOverview This file contains Husky plugin that takes care of the operations related to changing the lineheight using layer
 * @name hp_SE2M_LineHeightWithLayerUI.js
 */
nhn.husky.SE2M_LineHeightWithLayerUI = jindo.$Class({
	name : "SE2M_LineHeightWithLayerUI",
	MIN_LINE_HEIGHT : 50,
	
	$ON_MSG_APP_READY : function(){
		this.oApp.exec("REGISTER_UI_EVENT", ["lineHeight", "click", "SE2M_TOGGLE_LINEHEIGHT_LAYER"]);
		this.oApp.registerLazyMessage(["SE2M_TOGGLE_LINEHEIGHT_LAYER"], ["hp_SE2M_LineHeightWithLayerUI$Lazy.js"]);
	}
});