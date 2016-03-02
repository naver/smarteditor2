/**
 * @fileOverview This file contains Husky plugin that takes care of the operations related to changing the font name using Select element
 * @name SE2M_FontNameWithLayerUI.js
 * @trigger MSG_STYLE_CHANGED,SE2M_TOGGLE_FONTNAME_LAYER
 */
nhn.husky.SE2M_FontNameWithLayerUI = jindo.$Class({
	name : "SE2M_FontNameWithLayerUI",

	$init : function(elAppContainer){
		this.elLastHover = null;
		this._assignHTMLElements(elAppContainer);
		
		this.htBrowser = jindo.$Agent().navigator();
	},
	
	addAllFonts : function(){
		var aDefaultFontList, aFontList, htMainFont, aFontInUse, i;
		
		// family name -> display name 매핑 (웹폰트는 두개가 다름)
		this.htFamilyName2DisplayName = {};
		this.htAllFonts = {};
		
		this.aBaseFontList = [];
		this.aDefaultFontList = [];
		this.aTempSavedFontList = [];

		this.htOptions =  this.oApp.htOptions.SE2M_FontName;
		
		if(this.htOptions){
			aDefaultFontList = this.htOptions.aDefaultFontList || [];
			aFontList = this.htOptions.aFontList;
			htMainFont = this.htOptions.htMainFont;
			aFontInUse = this.htOptions.aFontInUse;
			
			//add Font
			if(this.oApp.oNavigator.ie && aFontList){
				for(i=0; i<aFontList.length; i++){
					this.addFont(aFontList[i].id, aFontList[i].name, aFontList[i].size, aFontList[i].url, aFontList[i].cssUrl);
				}
			}

			for(i=0; i<aDefaultFontList.length; i++){
				this.addFont(aDefaultFontList[i][0], aDefaultFontList[i][1], 0, "", "", 1);
			} 

			//set Main Font
			//if(mainFontSelected=='true') {
			if(htMainFont && htMainFont.id) {
				//this.setMainFont(mainFontId, mainFontName, mainFontSize, mainFontUrl, mainFontCssUrl);
				this.setMainFont(htMainFont.id, htMainFont.name, htMainFont.size, htMainFont.url, htMainFont.cssUrl);
			}
			// add font in use
			if(this.oApp.oNavigator.ie && aFontInUse){
				for(i=0; i<aFontInUse.length; i++){
					this.addFontInUse(aFontInUse[i].id, aFontInUse[i].name, aFontInUse[i].size, aFontInUse[i].url, aFontInUse[i].cssUrl);
				}
			}
		}
		
		// [SMARTEDITORSUS-245] 서비스 적용 시 글꼴정보를 넘기지 않으면 기본 글꼴 목록이 보이지 않는 오류
		if(!this.htOptions || !this.htOptions.aDefaultFontList || this.htOptions.aDefaultFontList.length === 0){
			this.addFont("돋움,Dotum", "돋움", 0, "", "", 1);
			this.addFont("돋움체,DotumChe", "돋움체", 0, "", "", 1);
			this.addFont("굴림,Gulim", "굴림", 0, "", "", 1);
			this.addFont("굴림체,GulimChe", "굴림체", 0, "", "", 1);
			this.addFont("바탕,Batang", "바탕", 0, "", "", 1);
			this.addFont("바탕체,BatangChe", "바탕체", 0, "", "", 1);
			this.addFont("궁서,Gungsuh", "궁서", 0, "", "", 1);
			this.addFont('Arial', 'Arial', 0, "", "", 1);
			this.addFont('Tahoma', 'Tahoma', 0, "", "", 1, "abcd");
			this.addFont('Times New Roman', 'Times New Roman', 0, "", "", 1, "abcd");
			this.addFont('Verdana', 'Verdana', 0, "", "", 1, "abcd");
		}
	},
	
	$ON_MSG_APP_READY : function(){
		this.bDoNotRecordUndo = false;

		this.oApp.exec("ADD_APP_PROPERTY", ["addFont", jindo.$Fn(this.addFont, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["addFontInUse", jindo.$Fn(this.addFontInUse, this).bind()]);
		// 블로그등 팩토리 폰트 포함 용
		this.oApp.exec("ADD_APP_PROPERTY", ["setMainFont", jindo.$Fn(this.setMainFont, this).bind()]);
		// 메일등 단순 폰트 지정 용
		this.oApp.exec("ADD_APP_PROPERTY", ["setDefaultFont", jindo.$Fn(this.setDefaultFont, this).bind()]);
		
		this.oApp.exec("REGISTER_UI_EVENT", ["fontName", "click", "SE2M_TOGGLE_FONTNAME_LAYER"]);
	},
	
	$AFTER_MSG_APP_READY : function(){
		this._initFontName();
		this._attachIEEvent();
	},
	
	_assignHTMLElements : function(elAppContainer){
		//@ec[
		this.oDropdownLayer = jindo.$$.getSingle("DIV.husky_se_fontName_layer", elAppContainer);

		this.elFontNameLabel = jindo.$$.getSingle("SPAN.husky_se2m_current_fontName", elAppContainer);

		this.elFontNameList = jindo.$$.getSingle("UL", this.oDropdownLayer);
		this.elInnerLayer = this.elFontNameList.parentNode;
		this.elFontItemTemplate = jindo.$$.getSingle("LI", this.oDropdownLayer);
		this.aLIFontNames = jindo.$A(jindo.$$("LI", this.oDropdownLayer)).filter(function(v,i,a){return (v.firstChild !== null);})._array;

		this.elSeparator = jindo.$$.getSingle("LI.husky_seditor_font_separator", this.oDropdownLayer);
		this.elNanumgothic = jindo.$$.getSingle("LI.husky_seditor_font_nanumgothic", this.oDropdownLayer);
		this.elNanummyeongjo = jindo.$$.getSingle("LI.husky_seditor_font_nanummyeongjo", this.oDropdownLayer);
		//@ec]
		
		this.sDefaultText = this.elFontNameLabel.innerHTML;
	},
	
	//$LOCAL_BEFORE_FIRST : function(){
	_initFontName : function(){
		this._addNanumFont();
		
		this.addAllFonts();

		this.oApp.registerBrowserEvent(this.oDropdownLayer, "mouseover", "EVENT_FONTNAME_LAYER_MOUSEOVER", []);
		this.oApp.registerBrowserEvent(this.oDropdownLayer, "click", "EVENT_FONTNAME_LAYER_CLICKED", []);
	},
	
	_addNanumFont : function(){
		var bUseSeparator = false;
		var nanum_gothic = unescape("%uB098%uB214%uACE0%uB515");
		var nanum_myungjo = unescape("%uB098%uB214%uBA85%uC870");
		
		if(jindo.$Agent().os().mac){
			nanum_gothic = "NanumGothic";
			nanum_myungjo = "NanumMyeongjo";
		}
		
		if(!!this.elNanumgothic){
			if(IsInstalledFont(nanum_gothic)){
				bUseSeparator = true;
				this.elNanumgothic.style.display = "block";
			}else{
				this.elNanumgothic.style.display = "none";
			}
		}
		
		if(!!this.elNanummyeongjo){
			if(IsInstalledFont(nanum_myungjo)){
				bUseSeparator = true;
				this.elNanummyeongjo.style.display = "block";
			}else{
				this.elNanummyeongjo.style.display = "none";
			}
		}
		
		if(!!this.elSeparator){
			this.elSeparator.style.display = bUseSeparator ? "block" : "none";
		}
	},
	
	_attachIEEvent : function(){
		if(!this.htBrowser.ie){			
			return;
		}
		
		if(this.htBrowser.nativeVersion < 9){		// [SMARTEDITORSUS-187] [< IE9] 최초 paste 시점에 웹폰트 파일을 로드
			this._wfOnPasteWYSIWYGBody = jindo.$Fn(this._onPasteWYSIWYGBody, this);
			this._wfOnPasteWYSIWYGBody.attach(this.oApp.getWYSIWYGDocument().body, "paste");
			
			return;
		}
		
		if(document.documentMode < 9){	// [SMARTEDITORSUS-169] [>= IE9] 최초 포커스 시점에 웹폰트 로드
			this._wfOnFocusWYSIWYGBody = jindo.$Fn(this._onFocusWYSIWYGBody, this);
			this._wfOnFocusWYSIWYGBody.attach(this.oApp.getWYSIWYGDocument().body, "focus");
			
			return;
		}

		// documentMode === 9
		// http://blogs.msdn.com/b/ie/archive/2010/08/17/ie9-opacity-and-alpha.aspx	// opacity:0.0;
		this.welEditingAreaCover = jindo.$Element('<DIV style="width:100%; height:100%; position:absolute; top:0px; left:0px; z-index:1000;"></DIV>');

		this.oApp.welEditingAreaContainer.prepend(this.welEditingAreaCover);
		jindo.$Fn(this._onMouseupCover, this).attach(this.welEditingAreaCover.$value(), "mouseup");
	},
	
	_onFocusWYSIWYGBody : function(e){
		this._wfOnFocusWYSIWYGBody.detach(this.oApp.getWYSIWYGDocument().body, "focus");
		this._loadAllBaseFont();
	},
	
	_onPasteWYSIWYGBody : function(e){
		this._wfOnPasteWYSIWYGBody.detach(this.oApp.getWYSIWYGDocument().body, "paste");
		this._loadAllBaseFont();
	},
	
	_onMouseupCover : function(e){
		e.stop();

		this.welEditingAreaCover.leave();
		
		var oMouse = e.mouse(),
			elBody = this.oApp.getWYSIWYGDocument().body,
			welBody = jindo.$Element(elBody),
			oSelection = this.oApp.getEmptySelection();
		
		// [SMARTEDITORSUS-363] 강제로 Selection 을 주도록 처리함
		oSelection.selectNode(elBody);
		oSelection.collapseToStart();
		oSelection.select();

		welBody.fireEvent("mousedown", {left : oMouse.left, middle : oMouse.middle, right : oMouse.right});
		welBody.fireEvent("mouseup", {left : oMouse.left, middle : oMouse.middle, right : oMouse.right});
	},

	$ON_EVENT_TOOLBAR_MOUSEDOWN : function(){
		if(this.htBrowser.nativeVersion < 9 || document.documentMode < 9){
			return;
		}
		
		this.welEditingAreaCover.leave();
	},
	
	_loadAllBaseFont : function(){
		var i, nFontLen;
		
		if(!this.htBrowser.ie){
			return;
		}
		
		if(this.htBrowser.nativeVersion < 9){
			for(i=0, nFontLen=this.aBaseFontList.length; i<nFontLen; i++){
				this.aBaseFontList[i].loadCSS(this.oApp.getWYSIWYGDocument());
			}	
		}else if(document.documentMode < 9){
			for(i=0, nFontLen=this.aBaseFontList.length; i<nFontLen; i++){
				this.aBaseFontList[i].loadCSSToMenu();
			}
		}
	
		this._loadAllBaseFont = function(){};
	},
	
	_addFontToMenu: function(sDisplayName, sFontFamily, sSampleText){
		var elItem = document.createElement("LI");
		elItem.innerHTML = this.elFontItemTemplate.innerHTML.replace("@DisplayName@",  sDisplayName).replace("FontFamily", sFontFamily).replace("@SampleText@", sSampleText);
		this.elFontNameList.insertBefore(elItem, this.elFontItemTemplate);

		this.aLIFontNames[this.aLIFontNames.length] = elItem;
		
		if(this.aLIFontNames.length > 20){
			this.oDropdownLayer.style.overflowX = 'hidden';
			this.oDropdownLayer.style.overflowY = 'auto';
			this.oDropdownLayer.style.height = '400px';
			this.oDropdownLayer.style.width = '204px';	// [SMARTEDITORSUS-155] 스크롤을 포함하여 206px 이 되도록 처리
		}
	},

	$ON_EVENT_FONTNAME_LAYER_MOUSEOVER : function(wev){
		var elTmp = this._findLI(wev.element);
		if(!elTmp){
			return;
		}

		this._clearLastHover();
		
		elTmp.className = "hover";
		this.elLastHover = elTmp;
	},
	
	$ON_EVENT_FONTNAME_LAYER_CLICKED : function(wev){
		var elTmp = this._findLI(wev.element);
		if(!elTmp){
			return;
		}
		
		var sFontFamily = this._getFontFamilyFromLI(elTmp);
		// [SMARTEDITORSUS-169] 웹폰트의 경우 fontFamily 에 ' 을 붙여주는 처리를 함
		var htFontInfo = this.htAllFonts[sFontFamily.replace(/\"/g, nhn.husky.SE2M_FontNameWithLayerUI.CUSTOM_FONT_MARKS)];
		var nDefaultFontSize;
		if(htFontInfo){
			nDefaultFontSize = htFontInfo.defaultSize+"pt";
		}else{
			nDefaultFontSize = 0;
		}
		this.oApp.exec("SET_FONTFAMILY", [sFontFamily, nDefaultFontSize]);
	},
	
	_findLI : function(elTmp){
		while(elTmp.tagName != "LI"){
			if(!elTmp || elTmp === this.oDropdownLayer){
				return null;
			}
			elTmp = elTmp.parentNode;
		}
		if(/husky_seditor_font_separator/.test(elTmp.className)){
			return null;
		}
		return elTmp;
	},
	
	_clearLastHover : function(){
		if(this.elLastHover){
			this.elLastHover.className = "";
		}
	},
	
	$ON_SE2M_TOGGLE_FONTNAME_LAYER : function(){
		this.oApp.exec("TOGGLE_TOOLBAR_ACTIVE_LAYER", [this.oDropdownLayer, null, "MSG_FONTNAME_LAYER_OPENED", [], "MSG_FONTNAME_LAYER_CLOSED", []]);
		this.oApp.exec('MSG_NOTIFY_CLICKCR', ['font']);
	},
	
	$ON_MSG_FONTNAME_LAYER_OPENED : function(){
		this.oApp.exec("SELECT_UI", ["fontName"]);
	},
	
	$ON_MSG_FONTNAME_LAYER_CLOSED : function(){
		this._clearLastHover();
		this.oApp.exec("DESELECT_UI", ["fontName"]);
	},
	
	$ON_MSG_STYLE_CHANGED : function(sAttributeName, sAttributeValue){
		if(sAttributeName == "fontFamily"){
			sAttributeValue = sAttributeValue.replace(/["']/g, "");
			var elLi = this._getMatchingLI(sAttributeValue);
			this._clearFontNameSelection();
			if(elLi){
				this.elFontNameLabel.innerHTML = this._getFontNameLabelFromLI(elLi);
				jindo.$Element(elLi).addClass("active");
			}else{
				//var sDisplayName = this.htFamilyName2DisplayName[sAttributeValue] || sAttributeValue;
				var sDisplayName = this.sDefaultText;
				this.elFontNameLabel.innerHTML = sDisplayName;
			}
		}
	},

	$BEFORE_RECORD_UNDO_BEFORE_ACTION : function(){
		return !this.bDoNotRecordUndo;
	},
	$BEFORE_RECORD_UNDO_AFTER_ACTION : function(){
		return !this.bDoNotRecordUndo;
	},
	$BEFORE_RECORD_UNDO_ACTION : function(){
		return !this.bDoNotRecordUndo;
	},

	$ON_SET_FONTFAMILY : function(sFontFamily, sDefaultSize){
		if(!sFontFamily){return;}
		
		// [SMARTEDITORSUS-169] 웹폰트의 경우 fontFamily 에 ' 을 붙여주는 처리를 함
		var oFontInfo = this.htAllFonts[sFontFamily.replace(/\"/g, nhn.husky.SE2M_FontNameWithLayerUI.CUSTOM_FONT_MARKS)];
		if(!!oFontInfo){
			oFontInfo.loadCSS(this.oApp.getWYSIWYGDocument());
		}
		
		// fontFamily와 fontSize 두개의 액션을 하나로 묶어서 undo history 저장
		this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["SET FONTFAMILY", {bMustBlockElement:true}]);
		this.bDoNotRecordUndo = true;
		
		if(parseInt(sDefaultSize, 10) > 0){
			this.oApp.exec("SET_WYSIWYG_STYLE", [{"fontSize":sDefaultSize}]);
		}
		this.oApp.exec("SET_WYSIWYG_STYLE", [{"fontFamily":sFontFamily}]);
		
		this.bDoNotRecordUndo = false;
		this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["SET FONTFAMILY", {bMustBlockElement:true}]);
		
		this.oApp.exec("HIDE_ACTIVE_LAYER", []);

		this.oApp.exec("CHECK_STYLE_CHANGE", []);
	},
	
	_getMatchingLI : function(sFontName){
		sFontName = sFontName.toLowerCase();
		var elLi, aFontFamily;
		for(var i=0; i<this.aLIFontNames.length; i++){
			elLi = this.aLIFontNames[i];
			aFontFamily = this._getFontFamilyFromLI(elLi).split(",");
			for(var h=0; h < aFontFamily.length;h++){
				if( !!aFontFamily[h] && jindo.$S(aFontFamily[h].replace(/['"]/ig, "")).trim().$value() == sFontName){
					return elLi;
				}
			}
		}
		return null;
	},

	_getFontFamilyFromLI : function(elLi){
		//return elLi.childNodes[1].innerHTML.toLowerCase();
		// <li><button type="button"><span>돋음</span>(</span><em style="font-family:'돋음',Dotum,'굴림',Gulim,AppleGothic,AppleMyungjo,Sans-serif;">돋음</em><span>)</span></span></button></li>
		return (elLi.getElementsByTagName("EM")[0]).style.fontFamily; 
	},
	
	_getFontNameLabelFromLI : function(elLi){
		return elLi.firstChild.firstChild.firstChild.nodeValue;
	},
	
	_clearFontNameSelection : function(elLi){
		for(var i=0; i<this.aLIFontNames.length; i++){
			jindo.$Element(this.aLIFontNames[i]).removeClass("active");
		}
	},

	// Add the font to the list
	// fontType == null, custom font (sent from the server)
	// fontType == 1, default font
	// fontType == 2, tempSavedFont
	addFont : function (fontId, fontName, defaultSize, fontURL, fontCSSURL, fontType, sSampleText) {
		// custom font feature only available in IE
		if(!this.oApp.oNavigator.ie && fontCSSURL){
			return null;
		}

		fontId = fontId.toLowerCase();
		
		var newFont = new fontProperty(fontId, fontName, defaultSize, fontURL, fontCSSURL);
		
		var sFontFamily;
		var sDisplayName;
		if(defaultSize>0){
			sFontFamily = fontId+"_"+defaultSize;
			sDisplayName = fontName+"_"+defaultSize;
		}else{
			sFontFamily = fontId;
			sDisplayName = fontName;
		}
		
		if(!fontType){
			sFontFamily = nhn.husky.SE2M_FontNameWithLayerUI.CUSTOM_FONT_MARKS + sFontFamily + nhn.husky.SE2M_FontNameWithLayerUI.CUSTOM_FONT_MARKS;
		}
		
		if(this.htAllFonts[sFontFamily]){
			return this.htAllFonts[sFontFamily];
		}
		this.htAllFonts[sFontFamily] = newFont;
/*
		// do not add again, if the font is already in the list
		for(var i=0; i<this._allFontList.length; i++){
			if(newFont.fontFamily == this._allFontList[i].fontFamily){
				return this._allFontList[i];
			}
		}

		this._allFontList[this._allFontList.length] = newFont;
*/		
		// [SMARTEDITORSUS-169] [IE9] 웹폰트A 선택>웹폰트B 선택>웹폰트 A를 다시 선택하면 웹폰트 A가 적용되지 않는 문제가 발생
		//
		// [원인]
		// 		- IE9의 웹폰트 로드/언로드 시점
		// 			웹폰트 로드 시점: StyleSheet 의 @font-face 구문이 해석된 이후, DOM Tree 상에서 해당 웹폰트가 최초로 사용된 시점
		// 			웹폰트 언로드 시점: StyleSheet 의 @font-face 구문이 해석된 이후, DOM Tree 상에서 해당 웬폰트가 더이상 사용되지 않는 시점
		// 		- 메뉴 리스트에 적용되는 스타일은 @font-face 이전에 처리되는 것이어서 언로드에 영향을 미치지 않음
		//
		// 		스마트에디터의 경우, 웹폰트를 선택할 때마다 SPAN 이 새로 추가되는 것이 아닌 선택된 SPAN 의 fontFamily 를 변경하여 처리하므로
		// 		fontFamily 변경 후 DOM Tree 상에서 더이상 사용되지 않는 것으로 브라우저 판단하여 언로드 해버림.
		// [해결] 
		//		언로드가 발생하지 않도록 메뉴 리스트에 스타일을 적용하는 것을 @font-face 이후로 하도록 처리하여 DOM Tree 상에 항상 적용될 수 있도록 함
		if(this.htBrowser.ie && this.htBrowser.nativeVersion === 9 && document.documentMode === 9) {
			newFont.loadCSSToMenu();
		}
		
		this.htFamilyName2DisplayName[sFontFamily] = fontName;

		sSampleText = sSampleText || this.oApp.$MSG('SE2M_FontNameWithLayerUI.sSampleText');
		this._addFontToMenu(sDisplayName, sFontFamily, sSampleText);
		
		if(!fontType){
			this.aBaseFontList[this.aBaseFontList.length] = newFont;
		}else{
			if(fontType == 1){
				this.aDefaultFontList[this.aDefaultFontList.length] = newFont;
			}else{
				this.aTempSavedFontList[this.aTempSavedFontList.length] = newFont;
			}
		}

		return newFont;		
	},
	// Add the font AND load it right away
	addFontInUse : function (fontId, fontName, defaultSize, fontURL, fontCSSURL, fontType) {
		var newFont = this.addFont(fontId, fontName, defaultSize, fontURL, fontCSSURL, fontType);
		if(!newFont){
			return null;
		}

		newFont.loadCSS(this.oApp.getWYSIWYGDocument());
		
		return newFont;
	},
	// Add the font AND load it right away AND THEN set it as the default font
	setMainFont : function (fontId, fontName, defaultSize, fontURL, fontCSSURL, fontType) {
		var newFont = this.addFontInUse(fontId, fontName, defaultSize, fontURL, fontCSSURL, fontType);
		if(!newFont){
			return null;
		}
		
		this.setDefaultFont(newFont.fontFamily, defaultSize);
		
		return newFont;
	},
	
	setDefaultFont : function(sFontFamily, nFontSize){
		var elBody = this.oApp.getWYSIWYGDocument().body;
		elBody.style.fontFamily = sFontFamily;
		if(nFontSize>0){elBody.style.fontSize   = nFontSize + 'pt';}
	}
});

nhn.husky.SE2M_FontNameWithLayerUI.CUSTOM_FONT_MARKS = "'";	// [SMARTEDITORSUS-169] 웹폰트의 경우 fontFamily 에 ' 을 붙여주는 처리를 함	

// property function for all fonts - including the default fonts and the custom fonts
// non-custom fonts will have the defaultSize of 0 and empty string for fontURL/fontCSSURL
function fontProperty(fontId, fontName, defaultSize, fontURL, fontCSSURL){
	this.fontId = fontId;
	this.fontName = fontName;
	this.defaultSize = defaultSize;
	this.fontURL = fontURL;
	this.fontCSSURL = fontCSSURL;
	
	this.displayName = fontName;
	this.isLoaded = true;
	this.fontFamily = this.fontId;
	
	// it is custom font
	if(this.fontCSSURL != ""){
		this.displayName += '' + defaultSize;
		this.fontFamily += '_' + defaultSize;
		// custom fonts requires css loading
		this.isLoaded = false;
		
		// load the css that loads the custom font
		this.loadCSS = function(doc){
			// if the font is loaded already, return
			if(this.isLoaded){
				return;
			}
			
			this._importCSS(doc);
			this.isLoaded = true;  
		};
		
		// [SMARTEDITORSUS-169] [IE9] 
		// addImport 후에 처음 적용된 DOM-Tree 가 iframe 내부인 경우 (setMainFont || addFontInUse 에서 호출된 경우)
		// 해당 폰트에 대한 언로드 문제가 계속 발생하여 IE9에서 addFont 에서 호출하는 loadCSS 의 경우에는 isLoaded를 true 로 변경하지 않음.
		this.loadCSSToMenu = function(){
			this._importCSS(document);
		};
		
		this._importCSS = function(doc){
			var nStyleSheet = doc.styleSheets.length;
			var oStyleSheet = doc.styleSheets[nStyleSheet - 1];
			
			if(nStyleSheet === 0 || oStyleSheet.imports.length == 30){ // imports limit
				oStyleSheet = doc.createStyleSheet();
			}
			
			oStyleSheet.addImport(this.fontCSSURL);
		};
	}else{
		this.loadCSS = function(){};
		this.loadCSSToMenu = function(){};
	}
	
	this.toStruct = function(){
		return {fontId:this.fontId, fontName:this.fontName, defaultSize:this.defaultSize, fontURL:this.fontURL, fontCSSURL:this.fontCSSURL};
	};
}