/**
 * @fileOverview This file contains Husky plugin that takes care of the operations directly related to editing the HTML source code using Textarea element
 * @name hp_SE_EditingArea_TEXT.js
 * @required SE_EditingAreaManager
 */
nhn.husky.SE_EditingArea_TEXT = jindo.$Class({
	name : "SE_EditingArea_TEXT",
	sMode : "TEXT",
	sRxConverter : '@[0-9]+@',
	bAutoResize : false,	// [SMARTEDITORSUS-677] 해당 편집모드의 자동확장 기능 On/Off 여부
	nMinHeight : null,		// [SMARTEDITORSUS-677] 편집 영역의 최소 높이
	
	$init : function(sTextArea) {
		this.elEditingArea = jindo.$(sTextArea);
	},

	$BEFORE_MSG_APP_READY : function() {
		this.oNavigator = jindo.$Agent().navigator();
		this.oApp.exec("REGISTER_EDITING_AREA", [this]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getTextAreaContents", jindo.$Fn(this.getRawContents, this).bind()]);
	},
	
	$ON_MSG_APP_READY : function() {
		if(!!this.oApp.getEditingAreaHeight){
			this.nMinHeight = this.oApp.getEditingAreaHeight();	// [SMARTEDITORSUS-677] 편집 영역의 최소 높이를 가져와 자동 확장 처리를 할 때 사용
		}
	},
	
	$ON_REGISTER_CONVERTERS : function() {
		this.oApp.exec("ADD_CONVERTER", ["IR_TO_TEXT", jindo.$Fn(this.irToText, this).bind()]);
		this.oApp.exec("ADD_CONVERTER", ["TEXT_TO_IR", jindo.$Fn(this.textToIr, this).bind()]);
	},
	
	$ON_CHANGE_EDITING_MODE : function(sMode) {
		if (sMode == this.sMode) {
			this.elEditingArea.style.display = "block";
		} else {
			this.elEditingArea.style.display = "none";
		}
	},
	
	$AFTER_CHANGE_EDITING_MODE : function(sMode) {
		if (sMode == this.sMode) {					
			var o = new TextRange(this.elEditingArea);
			o.setSelection(0, 0);
		}
		
		//모바일 textarea에서는 직접 클릭을해야만 키보드가 먹히기 때문에 우선은 커서가 안보이게 해서 사용자가 직접 클릭을 유도.
		if(!!this.oNavigator.msafari){
			this.elEditingArea.blur();
		}
	},
	
	irToText : function(sHtml) {
		var sContent = sHtml, nIdx = 0;		
		var aTemp = sContent.match(new RegExp(this.sRxConverter)); // applyConverter에서 추가한 sTmpStr를 잠시 제거해준다.
		if (aTemp !== null) {
			sContent = sContent.replace(new RegExp(this.sRxConverter), "");
		}
		
		//0.안보이는 값들에 대한 정리. (에디터 모드에 view와 text모드의 view를 동일하게 해주기 위해서)		
		sContent = sContent.replace(/\r/g, '');// MS엑셀 테이블에서 tr별로 분리해주는 역할이\r이기 때문에  text모드로 변경시에 가독성을 위해 \r 제거하는 것은 임시 보류. - 11.01.28 by cielo 
		sContent = sContent.replace(/[\n|\t]/g, ''); // 개행문자, 안보이는 공백 제거
		sContent = sContent.replace(/[\v|\f]/g, ''); // 개행문자, 안보이는 공백 제거
		//1. 먼저, 빈 라인 처리 .
		sContent = sContent.replace(/<p><br><\/p>/gi, '\n');
		sContent = sContent.replace(/<P>&nbsp;<\/P>/gi, '\n');
		
		//2. 빈 라인 이외에 linebreak 처리.
		sContent = sContent.replace(/<br(\s)*\/?>/gi, '\n'); // br 태그를 개행문자로
		sContent = sContent.replace(/<br(\s[^\/]*)?>/gi, '\n'); // br 태그를 개행문자로
		sContent = sContent.replace(/<\/p(\s[^\/]*)?>/gi, '\n'); // p 태그를 개행문자로
		
		sContent = sContent.replace(/<\/li(\s[^\/]*)?>/gi, '\n'); // li 태그를 개행문자로 [SMARTEDITORSUS-107]개행 추가
		sContent = sContent.replace(/<\/tr(\s[^\/]*)?>/gi, '\n'); // tr 태그를 개행문자로 [SMARTEDITORSUS-107]개행 추가
	
		// 마지막 \n은 로직상 불필요한 linebreak를 제공하므로 제거해준다.
		nIdx = sContent.lastIndexOf('\n');
		if (nIdx > -1 && sContent.substring(nIdx) == '\n') {
			sContent = sContent.substring(0, nIdx);
		}
		
		sContent = jindo.$S(sContent).stripTags().toString();
		sContent = this.unhtmlSpecialChars(sContent);
		if (aTemp !== null) { // 제거했던sTmpStr를 추가해준다.
			sContent = aTemp[0] + sContent;
		}
		
		return sContent;
	},
	
	textToIr : function(sHtml) {
		if (!sHtml) {
			return;
		}

		var sContent = sHtml, aTemp = null;
		
		// applyConverter에서 추가한 sTmpStr를 잠시 제거해준다. sTmpStr도 하나의 string으로 인식하는 경우가 있기 때문.
		aTemp = sContent.match(new RegExp(this.sRxConverter));
		if (aTemp !== null) {
			sContent = sContent.replace(aTemp[0], "");
		}
				
		sContent = this.htmlSpecialChars(sContent);
		sContent = this._addLineBreaker(sContent);

		if (aTemp !== null) {
			sContent = aTemp[0] + sContent;
		}
		
		return sContent;
	},
	
	_addLineBreaker : function(sContent){
		if(this.oApp.sLineBreaker === "BR"){
			return sContent.replace(/\r?\n/g, "<BR>");
		}
		
		var oContent = new StringBuffer(),
			aContent = sContent.split('\n'), // \n을 기준으로 블럭을 나눈다.
			aContentLng = aContent.length, 
			sTemp = "";
		
		for (var i = 0; i < aContentLng; i++) {
			sTemp = jindo.$S(aContent[i]).trim().$value();
			if (i === aContentLng -1 && sTemp === "") {
				break;
			}
			
			if (sTemp !== null && sTemp !== "") {
				oContent.append('<P>');
				oContent.append(aContent[i]);
				oContent.append('</P>');
			} else {
				if (!jindo.$Agent().navigator().ie) {
					oContent.append('<P><BR></P>');
				} else {
					oContent.append('<P>&nbsp;<\/P>');
				}
			}
		}
		
		return oContent.toString();
	},

	/**
	 * [SMARTEDITORSUS-677] HTML 편집 영역 자동 확장 처리 시작
	 */ 
	startAutoResize : function(){
		var htOption = {
			nMinHeight : this.nMinHeight,
			wfnCallback : jindo.$Fn(this.oApp.checkResizeGripPosition, this).bind()
		};
		
		this.bAutoResize = true;
		this.AutoResizer = new nhn.husky.AutoResizer(this.elEditingArea, htOption);
		this.AutoResizer.bind();
	},
	
	/**
	 * [SMARTEDITORSUS-677] HTML 편집 영역 자동 확장 처리 종료
	 */ 
	stopAutoResize : function(){
		this.AutoResizer.unbind();
	},
	
	getIR : function() {
		var sIR = this.getRawContents();
		if (this.oApp.applyConverter) {
			sIR = this.oApp.applyConverter(this.sMode + "_TO_IR", sIR, this.oApp.getWYSIWYGDocument());
		}		
		return sIR;
	},

	setIR : function(sIR) {
		var sContent = sIR;
		if (this.oApp.applyConverter) {
			sContent = this.oApp.applyConverter("IR_TO_" + this.sMode, sContent, this.oApp.getWYSIWYGDocument());
		}
		
		this.setRawContents(sContent);
	},
	
	setRawContents : function(sContent) {
		if (typeof sContent !== 'undefined') {
			this.elEditingArea.value = sContent;
		}
	},
	
	getRawContents : function() {
		return this.elEditingArea.value;
	},

	focus : function() {
		this.elEditingArea.focus();
	},

	/**
	 * HTML 태그에 해당하는 글자가 먹히지 않도록 바꿔주기
	 *
	 * 동작) & 를 &amp; 로, < 를 &lt; 로, > 를 &gt; 로 바꿔준다
	 *
	 * @param {String} sText
	 * @return {String}
	 */
	htmlSpecialChars : function(sText) {
		return sText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;');
	},

	/**
	 * htmlSpecialChars 의 반대 기능의 함수
	 *
	 * 동작) &amp, &lt, &gt, &nbsp 를 각각 &, <, >, 빈칸으로 바꿔준다
	 *
	 * @param {String} sText
	 * @return {String}
	 */
	unhtmlSpecialChars : function(sText) {
		return sText.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
	}
});