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
 * @fileOverview This file contains Husky plugin that takes care of the operations directly related to the color palette
 * @name hp_SE2M_ColorPalette.js
 */
nhn.husky.SE2M_ColorPalette = jindo.$Class({
	name : "SE2M_ColorPalette",
	elAppContainer : null,
	bUseRecentColor : false, 
	nLimitRecentColor : 17,
	rxRGBColorPattern : /rgb\((\d+), ?(\d+), ?(\d+)\)/i,
	rxColorPattern : /^#?[0-9a-fA-F]{6}$|^rgb\(\d+, ?\d+, ?\d+\)$/i,
	aRecentColor : [],	// 최근 사용한 색 목록, 가장 최근에 등록한 색의 index가 가장 작음
	URL_COLOR_LIST : "",
	URL_COLOR_ADD : "",
	URL_COLOR_UPDATE : "",
	sRecentColorTemp : "<li><button type=\"button\" title=\"{RGB_CODE}\" style=\"background:{RGB_CODE}\"><span><span>{RGB_CODE}</span></span></button></li>",
	
	$init : function(elAppContainer){
		this.elAppContainer = elAppContainer;
	},
	
	$ON_MSG_APP_READY : function(){},
	
	_assignHTMLElements : function(oAppContainer){
		var htConfiguration = nhn.husky.SE2M_Configuration.SE2M_ColorPalette;
		if(htConfiguration){
			var LinkageDomain = nhn.husky.SE2M_Configuration.LinkageDomain || {};
			var sDomainCommonAPI = LinkageDomain.sCommonAPI || "";
			this.bUseRecentColor = htConfiguration.bUseRecentColor || false;
			this.URL_COLOR_ADD = htConfiguration.addColorURL || sDomainCommonAPI + "/1/colortable/TextAdd.nhn";
			this.URL_COLOR_UPDATE = htConfiguration.updateColorURL || sDomainCommonAPI + "/1/colortable/TextUpdate.nhn";
			this.URL_COLOR_LIST = htConfiguration.colorListURL || sDomainCommonAPI + "/1/colortable/TextList.nhn";
		}
		
		this.elColorPaletteLayer = jindo.$$.getSingle("DIV.husky_se2m_color_palette", oAppContainer);

		this.elColorPaletteLayerColorPicker = jindo.$$.getSingle("DIV.husky_se2m_color_palette_colorpicker", this.elColorPaletteLayer);
		this.elRecentColorForm = jindo.$$.getSingle("form", this.elColorPaletteLayerColorPicker);
		
		this.elBackgroundColor = jindo.$$.getSingle("ul.husky_se2m_bgcolor_list", oAppContainer);
		this.elInputColorCode = jindo.$$.getSingle("INPUT.husky_se2m_cp_colorcode", this.elColorPaletteLayerColorPicker);
		
		this.elPreview = jindo.$$.getSingle("SPAN.husky_se2m_cp_preview", this.elColorPaletteLayerColorPicker);
		this.elCP_ColPanel = jindo.$$.getSingle("DIV.husky_se2m_cp_colpanel", this.elColorPaletteLayerColorPicker);
		this.elCP_HuePanel = jindo.$$.getSingle("DIV.husky_se2m_cp_huepanel", this.elColorPaletteLayerColorPicker);

		this.elCP_ColPanel.style.position = "relative";
		this.elCP_HuePanel.style.position = "relative";

		this.elColorPaletteLayerColorPicker.style.display = "none";
		
		this.elMoreBtn = jindo.$$.getSingle("BUTTON.husky_se2m_color_palette_more_btn", this.elColorPaletteLayer);
		this.welMoreBtn = jindo.$Element(this.elMoreBtn);
		
		this.elOkBtn = jindo.$$.getSingle("BUTTON.husky_se2m_color_palette_ok_btn", this.elColorPaletteLayer);
		
		if(this.bUseRecentColor){
			this.elColorPaletteLayerRecent = jindo.$$.getSingle("DIV.husky_se2m_color_palette_recent", this.elColorPaletteLayer);
			this.elRecentColor = jindo.$$.getSingle("ul.se2_pick_color", this.elColorPaletteLayerRecent);
			this.elDummyNode = jindo.$$.getSingle("ul.se2_pick_color > li", this.elColorPaletteLayerRecent) || null;
			
			this.elColorPaletteLayerRecent.style.display = "none";
		}
	},
	
	$LOCAL_BEFORE_FIRST : function(){
		this._assignHTMLElements(this.elAppContainer);
		
		if(this.elDummyNode){
			jindo.$Element(jindo.$$.getSingle("ul.se2_pick_color > li", this.elColorPaletteLayerRecent)).leave();
		}

		if( this.bUseRecentColor ){
			this._ajaxRecentColor(this._ajaxRecentColorCallback);
		}
		
		this.oApp.registerBrowserEvent(this.elColorPaletteLayer, "click", "EVENT_CLICK_COLOR_PALETTE");
		// [SMARTEDITORSUS-1833] 아이패드에서 mouseover 이벤트리스너를 등록하면 후속 click 이벤트가 바로 동작하지 않음
		// 모바일환경에서 hover 처리는 의미가 없으므로 PC 환경에서만 hover 처리하도록 함
		if(!this.oApp.bMobile){
			this.oApp.registerBrowserEvent(this.elBackgroundColor, "mouseover", "EVENT_MOUSEOVER_COLOR_PALETTE");
			this.oApp.registerBrowserEvent(this.elColorPaletteLayer, "mouseover", "EVENT_MOUSEOVER_COLOR_PALETTE");
			this.oApp.registerBrowserEvent(this.elBackgroundColor, "mouseout", "EVENT_MOUSEOUT_COLOR_PALETTE");
			this.oApp.registerBrowserEvent(this.elColorPaletteLayer, "mouseout", "EVENT_MOUSEOUT_COLOR_PALETTE");
		}
	},
	
	$ON_EVENT_MOUSEOVER_COLOR_PALETTE : function(oEvent){
		var elHovered = oEvent.element;
		while(elHovered && elHovered.tagName && elHovered.tagName.toLowerCase() != "li"){
			elHovered = elHovered.parentNode;
		}
		//조건 추가-by cielo 2010.04.20
		if(!elHovered || !elHovered.nodeType || elHovered.nodeType == 9){return;}
		if(elHovered.className == "" || (!elHovered.className) || typeof(elHovered.className) == 'undefined'){jindo.$Element(elHovered).addClass("hover");}
	},
	
	$ON_EVENT_MOUSEOUT_COLOR_PALETTE : function(oEvent){
		var elHovered = oEvent.element;
		
		while(elHovered && elHovered.tagName && elHovered.tagName.toLowerCase() != "li"){
			elHovered = elHovered.parentNode;
		}
		if(!elHovered){return;}
		if(elHovered.className == "hover"){jindo.$Element(elHovered).removeClass("hover");}
	},
	
	$ON_EVENT_CLICK_COLOR_PALETTE : function(oEvent){
		var elClicked = oEvent.element;
		
		while(elClicked.tagName == "SPAN"){elClicked = elClicked.parentNode;}
		
		if(elClicked.tagName && elClicked.tagName == "BUTTON"){
			if(elClicked == this.elMoreBtn){
				this.oApp.exec("TOGGLE_COLOR_PICKER");
				return;
			}
			
			this.oApp.exec("APPLY_COLOR", [elClicked]);
		}
	},
	
	$ON_APPLY_COLOR : function(elButton){
		var sColorCode = this.elInputColorCode.value,
			welColorParent = null;
		
		if(sColorCode.indexOf("#") == -1){
			sColorCode = "#" + sColorCode;
			this.elInputColorCode.value = sColorCode;
		}
		
		// 입력 버튼인 경우
		if(elButton == this.elOkBtn){
			if(!this._verifyColorCode(sColorCode)){
				this.elInputColorCode.value = "";
				alert(this.oApp.$MSG("SE_Color.invalidColorCode"));
				this.elInputColorCode.focus();
				
				return;
			}
			
			this.oApp.exec("COLOR_PALETTE_APPLY_COLOR", [sColorCode,true]);
			
			return;
		}
		
		// 색상 버튼인 경우
		welColorParent = jindo.$Element(elButton.parentNode.parentNode.parentNode);
		sColorCode = elButton.title;
		
		if(welColorParent.hasClass("husky_se2m_color_palette")){				// 템플릿 색상 적용
			/*
			 * [SMARTEDITORSUS-1884][SMARTEDITORSUS-2117]
			 * 설정값 제거(r12236) 전에도
			 * 모든 타입에서
			 * nhn.husky.SE2M_Configuration.SE2M_ColorPalette.bAddRecentColorFromDefault 값이
			 * undefined인 상태로 동작하고 있었기 때문에
			 * false로 처리
			 */
			this.oApp.exec("COLOR_PALETTE_APPLY_COLOR", [sColorCode, false]);
		}else if(welColorParent.hasClass("husky_se2m_color_palette_recent")){	// 최근 색상 적용
			this.oApp.exec("COLOR_PALETTE_APPLY_COLOR", [sColorCode,true]);
		}
	},
	
	$ON_RESET_COLOR_PALETTE : function(){
		this._initColor();
	},
	
	$ON_TOGGLE_COLOR_PICKER : function(){
		if(this.elColorPaletteLayerColorPicker.style.display == "none"){
			this.oApp.exec("SHOW_COLOR_PICKER");
		}else{
			this.oApp.exec("HIDE_COLOR_PICKER");
		}
	},
	
	$ON_SHOW_COLOR_PICKER : function(){
		this.elColorPaletteLayerColorPicker.style.display = "";

		this.cpp = new nhn.ColorPicker(this.elCP_ColPanel, {huePanel:this.elCP_HuePanel});
		var fn = jindo.$Fn(function(oEvent) {
			this.elPreview.style.backgroundColor = oEvent.hexColor;
			this.elInputColorCode.value = oEvent.hexColor;
		}, this).bind();
		this.cpp.attach("colorchange", fn);

		this.$ON_SHOW_COLOR_PICKER = this._showColorPickerMain;
		this.$ON_SHOW_COLOR_PICKER();
	},
		
	$ON_HIDE_COLOR_PICKER : function(){
		this.elColorPaletteLayerColorPicker.style.display = "none";
		this.welMoreBtn.addClass("se2_view_more");
		this.welMoreBtn.removeClass("se2_view_more2");
	},
	
	$ON_SHOW_COLOR_PALETTE : function(sCallbackCmd, oLayerContainer){
		this.sCallbackCmd = sCallbackCmd;
		this.oLayerContainer = oLayerContainer;

		this.oLayerContainer.insertBefore(this.elColorPaletteLayer, null);

		this.elColorPaletteLayer.style.display = "block";
		
		this.oApp.delayedExec("POSITION_TOOLBAR_LAYER", [this.elColorPaletteLayer.parentNode.parentNode], 0);
	},

	$ON_HIDE_COLOR_PALETTE : function(){
		this.elColorPaletteLayer.style.display = "none";
	},
	
	$ON_COLOR_PALETTE_APPLY_COLOR : function(sColorCode , bAddRecentColor){
		bAddRecentColor = (!bAddRecentColor)? false : bAddRecentColor;
		sColorCode = this._getHexColorCode(sColorCode);
		
		//더보기 레이어에서 적용한 색상만 최근 사용한 색에 추가한다. 
		if( this.bUseRecentColor && !!bAddRecentColor ){
			this.oApp.exec("ADD_RECENT_COLOR", [sColorCode]);
		}
		this.oApp.exec(this.sCallbackCmd, [sColorCode]);
	},

	$ON_EVENT_MOUSEUP_COLOR_PALETTE : function(oEvent){
		var elButton = oEvent.element;
		if(! elButton.style.backgroundColor){return;}
		
		this.oApp.exec("COLOR_PALETTE_APPLY_COLOR", [elButton.style.backgroundColor,false]);
	},
	
	$ON_ADD_RECENT_COLOR : function(sRGBCode){
		var bAdd = (this.aRecentColor.length === 0);
		
		this._addRecentColor(sRGBCode);
		
		if(bAdd){
			this._ajaxAddColor();
		}else{
			this._ajaxUpdateColor();
		}
				
		this._redrawRecentColorElement();
	},
	
	_verifyColorCode : function(sColorCode){
		return this.rxColorPattern.test(sColorCode);
	},
	
	_getHexColorCode : function(sColorCode){
		if(this.rxRGBColorPattern.test(sColorCode)){
			var dec2Hex = function(sDec){
				var sTmp = parseInt(sDec, 10).toString(16);
				if(sTmp.length<2){sTmp = "0"+sTmp;}
				return sTmp.toUpperCase();
			};
			
			var sR = dec2Hex(RegExp.$1);
			var sG = dec2Hex(RegExp.$2);
			var sB = dec2Hex(RegExp.$3);
			sColorCode = "#"+sR+sG+sB;
		}
		
		return sColorCode;
	},
	
	_addRecentColor : function(sRGBCode){
		var waRecentColor = jindo.$A(this.aRecentColor);
				
		waRecentColor = waRecentColor.refuse(sRGBCode);
		waRecentColor.unshift(sRGBCode);
		
		if(waRecentColor.length() > this.nLimitRecentColor){
			waRecentColor.length(this.nLimitRecentColor);
		}
		
		this.aRecentColor = waRecentColor.$value();
	},
	
	_redrawRecentColorElement : function(){
		var aRecentColorHtml = [],
			nRecentColor = this.aRecentColor.length,
			i;
		
		if(nRecentColor === 0){
			return;
		}
		
		for(i=0; i<nRecentColor; i++){
			aRecentColorHtml.push(this.sRecentColorTemp.replace(/\{RGB_CODE\}/gi, this.aRecentColor[i]));
		}
		
		this.elRecentColor.innerHTML = aRecentColorHtml.join("");
		
		this.elColorPaletteLayerRecent.style.display = "block";
	},
	
	_ajaxAddColor : function(){		
		jindo.$Ajax(this.URL_COLOR_ADD, {
			type : "jsonp",
			onload: function(){}
		}).request({
			text_key : "colortable",
			text_data : this.aRecentColor.join(",")
		});
	},
	
	_ajaxUpdateColor : function(){		
		jindo.$Ajax(this.URL_COLOR_UPDATE, {
			type : "jsonp",
			onload: function(){}
		}).request({
			text_key : "colortable",
			text_data : this.aRecentColor.join(",")
		});
	},

	_showColorPickerMain : function(){
		this._initColor();
		this.elColorPaletteLayerColorPicker.style.display = "";
		this.welMoreBtn.removeClass("se2_view_more");
		this.welMoreBtn.addClass("se2_view_more2");
	},
	
	_initColor : function(){
		if(this.cpp){this.cpp.rgb({r:0,g:0,b:0});}
		this.elPreview.style.backgroundColor = '#'+'000000';
		this.elInputColorCode.value = '#'+'000000';
		this.oApp.exec("HIDE_COLOR_PICKER");
	},
	
	_ajaxRecentColor : function(fCallback){
		jindo.$Ajax(this.URL_COLOR_LIST, {
			type : "jsonp",
			onload : jindo.$Fn(fCallback, this).bind()
		}).request();
	},

	_ajaxRecentColorCallback : function(htResponse){
		var aColorList = htResponse.json()["result"],
			waColorList,
			i, nLen;
			
		if(!aColorList || !!aColorList.error){
			return;
		}
		
		waColorList = jindo.$A(aColorList).filter(this._verifyColorCode, this);
		
		if(waColorList.length() > this.nLimitRecentColor){
			waColorList.length(this.nLimitRecentColor);
		}
		
		aColorList = waColorList.reverse().$value();

		for(i = 0, nLen = aColorList.length; i < nLen; i++){
			this._addRecentColor(this._getHexColorCode(aColorList[i]));
		}
		
		this._redrawRecentColorElement();
	}
}).extend(jindo.Component);
//}