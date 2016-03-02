//{
/**
 * @fileOverview This file contains Husky plugin that takes care of the operations directly related to the color palette
 * @name hp_SE2M_ColorPalette.js
 * @notice Flash Object Block인 경우, 최신 사용 색상의 업데이트과 리스트 생성을 막음. 
 */
 nhn.husky.SE2M_ColorPalette = jindo.$Class({
	name : "SE2M_ColorPalette",
	elAppContainer : null,
	bUseFlashModule : false, 
	nRecentColorNum : 0,
	nLimitRecentColor : 17,
	rxRGBColorPattern : /rgb\((\d+), ?(\d+), ?(\d+)\)/i,
	rxColorPattern : /^#?[0-9a-fA-F]{6}$|^rgb\(\d+, ?\d+, ?\d+\)$/i,
	aRecentColor : [],
	URL_COLOR_ADD : "",
	URL_COLOR_LIST : "",
	URL_COLOR_DELETE : "",
	sRecentColorTemp : "<li><button type=\"button\" title=\"{RGB_CODE}\" style=\"background:{RGB_CODE}\"><span><span>{RGB_CODE}</span></span></button></li>",
	
	$init : function(elAppContainer){
	 	this.elAppContainer = elAppContainer;
	},
	
	$ON_MSG_APP_READY : function(){},
	
	_assignHTMLElements : function(oAppContainer){
		var htConfiguration = nhn.husky.SE2M_Configuration.SE2M_ColorPalette;
		if(htConfiguration){
			this.bUseFlashModule = htConfiguration.bUseFlashModule || false;
			this.URL_COLOR_ADD = htConfiguration.addColorURL || "http://api.se2.naver.com/1/colortable/TextAdd.nhn?text_data=";
			this.URL_COLOR_DELETE = htConfiguration.delColorURL || "http://api.se2.naver.com/1/colortable/TextDelete.nhn?text_data=";
			this.URL_COLOR_LIST = htConfiguration.colorListURL || "http://api.se2.naver.com/1/colortable/TextList.nhn";
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
		
		if(this.bUseFlashModule){
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

		if( this.bUseFlashModule ){
			this._ajaxRecentColor(this._ajaxRecentColorCallback);
		}
		
		this.oApp.registerBrowserEvent(this.elColorPaletteLayer, "click", "EVENT_CLICK_COLOR_PALETTE");
		this.oApp.registerBrowserEvent(this.elBackgroundColor, "mouseover", "EVENT_MOUSEOVER_COLOR_PALETTE");
		this.oApp.registerBrowserEvent(this.elColorPaletteLayer, "mouseover", "EVENT_MOUSEOVER_COLOR_PALETTE");
		this.oApp.registerBrowserEvent(this.elBackgroundColor, "mouseout", "EVENT_MOUSEOUT_COLOR_PALETTE");
		this.oApp.registerBrowserEvent(this.elColorPaletteLayer, "mouseout", "EVENT_MOUSEOUT_COLOR_PALETTE");
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
		if(this.elInputColorCode.value.indexOf("#") == -1){this.elInputColorCode.value = "#" + this.elInputColorCode.value;}
		if(elButton == this.elOkBtn){
			if(!this.rxColorPattern.test(this.elInputColorCode.value)){
				this.elInputColorCode.value = "";
				alert(this.oApp.$MSG("SE_Color.invalidColorCode"));
				this.elInputColorCode.focus();
				return;
			}
			this.oApp.exec("COLOR_PALETTE_APPLY_COLOR", [this.elInputColorCode.value,true]);
			
			return;
		}
		var welColorClassName = jindo.$Element(elButton.parentNode.parentNode.parentNode);
		this.elInputColorCode.value = elButton.title;
		
		if(welColorClassName.hasClass("husky_se2m_color_palette")){
			this.oApp.exec("COLOR_PALETTE_APPLY_COLOR", [this.elInputColorCode.value,false]);
		}else if(welColorClassName.hasClass("husky_se2m_color_palette_recent")){
			this.elOkBtn.click();
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
		
		//더보기 레이어에서 적용한 색상만 최근 사용한 색에 추가한다. 
		if( this.bUseFlashModule && !!bAddRecentColor ){
			this.oApp.exec("ADD_RECENT_COLOR", [sColorCode]);
		}
		this.oApp.exec(this.sCallbackCmd, [sColorCode]);
	},
	
	/**
	 * 미사용 함수.(?)
	 */
	$ON_EVENT_MOUSEUP_COLOR_PALETTE : function(oEvent){
		var elButton = oEvent.element;
		if(! elButton.style.backgroundColor){return;}
		
		this.oApp.exec("COLOR_PALETTE_APPLY_COLOR", [elButton.style.backgroundColor,false]);
	},
	
	$ON_ADD_RECENT_COLOR : function(sRGBCode){
		// Flash 모듈을 브라우저에서 block할 경우 대처
		if( this.bUseFlashModule && !jindo.$Ajax.SWFRequest.activeFlash){
			alert(this.oApp.$MSG("SE.SE2M_ColorPalette.failedToLoadFlash"));
			return;
		} else if ( !this.bUseFlashModule ){
			return;
		}
		
		var aRecentColorChild = this.elRecentColor.childNodes;
		
		for(var i = 0, nLen = aRecentColorChild.length; i < nLen; i++){
			if(typeof aRecentColorChild[i] == "undefined"){break;}
			if(aRecentColorChild[i].nodeType == 1){
				var elColorButton = jindo.$$.getSingle("button", aRecentColorChild[i]);
				if(elColorButton.title != sRGBCode){continue;}
				
				this._ajaxDeleteColor(elColorButton.title);					
				jindo.$Element(aRecentColorChild[i]).leave();
				this.nRecentColorNum--;
				break;
			}
		}
		this.aRecentColor.unshift(sRGBCode);
		var sRecentColorTemp = this.sRecentColorTemp.replace(/\{RGB_CODE\}/gi, sRGBCode);
		jindo.$Element(this.elRecentColor).prepend(sRecentColorTemp);
		setTimeout(jindo.$Fn(this._ajaxSendColor, this).bind(sRGBCode), 17);
		this.nRecentColorNum++;
		
		if(this.nRecentColorNum > this.nLimitRecentColor){
			var nNum = 0;
			var elLastColor = null;
			do{
				nNum++;
				elLastColor = this.elRecentColor.childNodes[this.elRecentColor.childNodes.length - nNum];
			}while(this.elRecentColor.childNodes[this.elRecentColor.childNodes.length - nNum].nodeType != 1);
			
			var elColorButton = jindo.$$.getSingle("button", elLastColor);
			var sDeleteRGB = elColorButton.title;
			
			jindo.$Element(elLastColor).leave();
			this._ajaxDeleteColor(sDeleteRGB);
			var waRecentColor = jindo.$A(this.aRecentColor).refuse(sDeleteRGB);
			this.aRecentColor = waRecentColor.$value();
			this.nRecentColorNum--;
		}
		
		var waRecentColor = jindo.$A(this.aRecentColor).unique();
		this.aRecentColor = waRecentColor.$value();
		this.elColorPaletteLayerRecent.style.display = "block";
	},
	
	_ajaxDeleteColor : function(sColor){
		var sUrl = this.URL_COLOR_DELETE + escape(sColor);
		new jindo.$Ajax(sUrl, {
			type : "flash",
			sendheader : false
		}).request();
	},
	
	_ajaxSendColor : function(sColor){
		var sUrl = this.URL_COLOR_ADD + escape(sColor);
		new jindo.$Ajax(sUrl, {
			type : "flash",
			sendheader : false
		}).request();
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
		//Flash 모듈을 브라우저에서 block할 경우 대처
		if(jindo.$Ajax.SWFRequest.activeFlash){
			// send ajax request to fetch recently used colors
			var sUrl = this.URL_COLOR_LIST;
			var ajax = new jindo.$Ajax(sUrl, {
				type : "flash",
				sendheader : false,
				onload : jindo.$Fn(fCallback, this).bind()
			}).request();
		} 
	},

	_ajaxRecentColorCallback : function(htResponse){
		var aColorList = htResponse.json()["result"];
		if(!aColorList || !!aColorList.error) return;
		
		aColorList = aColorList.reverse();
		aColorList = jindo.$A(aColorList).refuse("").$value();
		
		for(var i = 0, nLen = aColorList.length; i < nLen; i++){
			if (i == this.nLimitRecentColor) {break;}
			//비정상적인 data의 경우 list에서 보여주지 않는다.
			if ( aColorList[i].indexOf("#") > -1 ) {
				var sRecentColorTemp = this.sRecentColorTemp.replace(/\{RGB_CODE\}/gi, aColorList[i]);
				
				jindo.$Element(this.elRecentColor).append(sRecentColorTemp);
				this.aRecentColor.push(aColorList[i]);
			}
		}
		this._initRecentColor();
	},
	
	_initRecentColor : function(){
		var aRecentColorChild = this.elRecentColor.childNodes;
		var nRecentColorNum = 0;
		
		for(var i = 0, nLen = aRecentColorChild.length; i < nLen; i++){
			if(typeof aRecentColorChild[i] == "undefined"){break;}
			if(aRecentColorChild[i].nodeType == 1){
				if (!aRecentColorChild[i].tagName) {
					continue;
				}else{
					this.elColorPaletteLayerRecent.style.display = "block";
					nRecentColorNum++;
				}
			}
		}
		this.nRecentColorNum = nRecentColorNum;
	}
}).extend(jindo.Component);
//}