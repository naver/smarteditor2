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
 * @fileOverview This file contains Husky plugin that takes care of the operations related to changing the editing mode using a Button element
 * @name hp_SE2M_EditingModeChanger.js
 */
nhn.husky.SE2M_EditingModeChanger = jindo.$Class({
	name : "SE2M_EditingModeChanger",
	htConversionMode : null,
	
	$init : function(elAppContainer, htConversionMode){
		this.htConversionMode = htConversionMode;
		this._assignHTMLElements(elAppContainer);
	},

	_assignHTMLElements : function(elAppContainer){
		elAppContainer = jindo.$(elAppContainer) || document;

		//@ec[
		this.elWYSIWYGButton = jindo.$$.getSingle("BUTTON.se2_to_editor", elAppContainer);
		this.elHTMLSrcButton = jindo.$$.getSingle("BUTTON.se2_to_html", elAppContainer);
		this.elTEXTButton = jindo.$$.getSingle("BUTTON.se2_to_text", elAppContainer);
		this.elModeToolbar = jindo.$$.getSingle("DIV.se2_conversion_mode", elAppContainer);		
		//@ec]

		this.welWYSIWYGButtonLi = jindo.$Element(this.elWYSIWYGButton.parentNode);
		this.welHTMLSrcButtonLi = jindo.$Element(this.elHTMLSrcButton.parentNode);
		this.welTEXTButtonLi = jindo.$Element(this.elTEXTButton.parentNode);
	},
	
	$BEFORE_MSG_APP_READY : function(){
		this.oApp.exec("ADD_APP_PROPERTY", ["isUseModeChanger", jindo.$Fn(this.isUseModeChanger, this).bind()]);
	},
	
	$ON_MSG_APP_READY : function(){
		if(this.oApp.htOptions.bOnlyTextMode){
			this.elWYSIWYGButton.style.display = 'none';
			this.elHTMLSrcButton.style.display = 'none';
			this.elTEXTButton.style.display = 'block';
			this.oApp.exec("CHANGE_EDITING_MODE", ["TEXT"]);
		}else{
			this.oApp.registerBrowserEvent(this.elWYSIWYGButton, "click", "EVENT_CHANGE_EDITING_MODE_CLICKED", ["WYSIWYG"]);
			this.oApp.registerBrowserEvent(this.elHTMLSrcButton, "click", "EVENT_CHANGE_EDITING_MODE_CLICKED", ["HTMLSrc"]);
			this.oApp.registerBrowserEvent(this.elTEXTButton, "click", "EVENT_CHANGE_EDITING_MODE_CLICKED", ["TEXT", false]);
			
			this.showModeChanger();
			
			if(this.isUseModeChanger() === false && this.oApp.isUseVerticalResizer() === false){
				this.elModeToolbar.style.display = "none";
			}
		}
	},
	
	// [SMARTEDITORSUS-906][SMARTEDITORSUS-1433] Editing Mode 사용 여부 처리 (true:사용함/ false:사용하지 않음)
	showModeChanger : function(){
		if(this.isUseModeChanger()){
			this.elWYSIWYGButton.style.display = 'block';
			this.elHTMLSrcButton.style.display = 'block';
			this.elTEXTButton.style.display = 'block';
		}else{
			this.elWYSIWYGButton.style.display = 'none';
			this.elHTMLSrcButton.style.display = 'none';
			this.elTEXTButton.style.display = 'none';
		}
	},
	
	isUseModeChanger : function(){
		return (typeof(this.htConversionMode) === 'undefined' || typeof(this.htConversionMode.bUseModeChanger) === 'undefined' || this.htConversionMode.bUseModeChanger === true) ? true : false;
	},
	
	$ON_EVENT_CHANGE_EDITING_MODE_CLICKED : function(sMode, bNoAlertMsg){
		if (sMode == 'TEXT') {
			//에디터 영역 내에 모든 내용 가져옴. 
	    	var sContent = this.oApp.getIR();
	    	
			// 내용이 있으면 경고창 띄우기
			if (sContent.length > 0 && !bNoAlertMsg) {
				if ( !confirm(this.oApp.$MSG("SE2M_EditingModeChanger.confirmTextMode")) ) {
					return false;
				}
			}
			this.oApp.exec("CHANGE_EDITING_MODE", [sMode]);
		}else{
			this.oApp.exec("CHANGE_EDITING_MODE", [sMode]);
		}
		
		if ('HTMLSrc' == sMode) {
			this.oApp.exec('MSG_NOTIFY_CLICKCR', ['htmlmode']);
		} else if ('TEXT' == sMode) {
			this.oApp.exec('MSG_NOTIFY_CLICKCR', ['textmode']);
		} else {
			this.oApp.exec('MSG_NOTIFY_CLICKCR', ['editormode']);
		}
	},
	
	$ON_DISABLE_ALL_UI : function(htOptions){
		htOptions = htOptions || {};
		var waExceptions = jindo.$A(htOptions.aExceptions || []);

		if(waExceptions.has("mode_switcher")){
			return;
		}
		if(this.oApp.getEditingMode() == "WYSIWYG"){
			this.welWYSIWYGButtonLi.removeClass("active");
			this.elHTMLSrcButton.disabled = true;
			this.elTEXTButton.disabled = true;
		} else if (this.oApp.getEditingMode() == 'TEXT') {
			this.welTEXTButtonLi.removeClass("active");
			this.elWYSIWYGButton.disabled = true;
			this.elHTMLSrcButton.disabled = true;
		}else{
			this.welHTMLSrcButtonLi.removeClass("active");
			this.elWYSIWYGButton.disabled = true;
			this.elTEXTButton.disabled = true;
		}
	},
	
	$ON_ENABLE_ALL_UI : function(){
		if(this.oApp.getEditingMode() == "WYSIWYG"){
			this.welWYSIWYGButtonLi.addClass("active");
			this.elHTMLSrcButton.disabled = false;
			this.elTEXTButton.disabled = false;
		} else if (this.oApp.getEditingMode() == 'TEXT') {
			this.welTEXTButtonLi.addClass("active");
			this.elWYSIWYGButton.disabled = false;
			this.elHTMLSrcButton.disabled = false;
		}else{
			this.welHTMLSrcButtonLi.addClass("active");
			this.elWYSIWYGButton.disabled = false;
			this.elTEXTButton.disabled = false;
		}
	},

	$ON_CHANGE_EDITING_MODE : function(sMode){
		if(sMode == "HTMLSrc"){
			this.welWYSIWYGButtonLi.removeClass("active");
			this.welHTMLSrcButtonLi.addClass("active");
			this.welTEXTButtonLi.removeClass("active");
			
			this.elWYSIWYGButton.disabled = false;
			this.elHTMLSrcButton.disabled = true;
			this.elTEXTButton.disabled = false;
			this.oApp.exec("HIDE_ALL_DIALOG_LAYER");
			
			this.oApp.exec("DISABLE_ALL_UI", [{aExceptions:["mode_switcher"]}]);
		} else if (sMode == 'TEXT') {
			this.welWYSIWYGButtonLi.removeClass("active");
			this.welHTMLSrcButtonLi.removeClass("active");
			this.welTEXTButtonLi.addClass("active");
			
			this.elWYSIWYGButton.disabled = false;
			this.elHTMLSrcButton.disabled = false;
			this.elTEXTButton.disabled = true; 
			this.oApp.exec("HIDE_ALL_DIALOG_LAYER");
			this.oApp.exec("DISABLE_ALL_UI", [{aExceptions:["mode_switcher"]}]);
		}else{
			this.welWYSIWYGButtonLi.addClass("active");
			this.welHTMLSrcButtonLi.removeClass("active");
			this.welTEXTButtonLi.removeClass("active");

			this.elWYSIWYGButton.disabled = true;
			this.elHTMLSrcButton.disabled = false;
			this.elTEXTButton.disabled = false;
			
			this.oApp.exec("RESET_STYLE_STATUS");
			this.oApp.exec("ENABLE_ALL_UI", []);
		}
	}
});
//}