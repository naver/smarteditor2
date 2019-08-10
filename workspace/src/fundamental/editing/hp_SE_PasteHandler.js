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
 * @pluginDesc WYSIWYG 영역에 붙여넣어지는 외부 컨텐츠를 정제하는 플러그인
 */
nhn.husky.SE_PasteHandler = jindo.$Class({
	name : "SE_PasteHandler",
	_rxStyleTag : /<style(?:\s+[^>]*)?>(?:.|\r|\n)*?<\/style>/gi,
	_rxStyleTagStrip : /<\/?style(?:\s+[^>]*)?>/gi,
	_rxClassSelector : /\w*\.\w+/g,
	_rxClassSelectorStart : /\w*\./g,

	$init : function(){
	},

	/**
	 * 크롬에서 복/붙시 style분석을 위한 임시 document
	 * @returns {Document} 임시 document 반환
	 */
	_getTmpDocument : function(){
		if(!this._oTmpDoc){
			var elIframe = document.createElement("IFRAME");
			elIframe.style.display = "none";
			document.body.appendChild(elIframe);
			var oDoc = elIframe.contentWindow.document;
			oDoc.open();
			oDoc.write('<html><head></head><body></body></html>');
			oDoc.close();

			this._oTmpDoc = oDoc;
		}

		return this._oTmpDoc;
	},

	/**
	 * CSSRuleList에서 CSSRule.STYLE_RULE만 가져와 selector키 맵핑형태로 반환한다.
	 * @param {CSSRuleList} cssRules 확인할 CSSRuleList
	 * @returns {HashTable} key(셀렉터명)/value(CSSRule) 맵핑객체
	 */
	_getCSSStyleRule : function(cssRules) {
		var htStyleRule = {};
		for(var i = 0, cssRule; (cssRule = cssRules[i]); i++){
			// @see https://developer.mozilla.org/en-US/docs/Web/API/CSSRule#Type_constants
			if(cssRule.type === CSSRule.STYLE_RULE){
				htStyleRule[cssRule.selectorText] = cssRule.style;
			}
		}
		return htStyleRule;
	},

	/**
	 * html문자열에 style태그가 있으면 CSSStyleRule을 추출하여 저장해둔다.
	 * @param {String} html 확인할 HTML문자열
	 */
	_extractStyle : function(html) {
		if(!html) {
			return;
		}
		var aMatch = html.match(this._rxStyleTag) || [];
		var sStyles = aMatch.join("\n");
		sStyles = sStyles.replace(this._rxStyleTagStrip, "");

		var oTmpDoc = this._getTmpDocument();
		var elHead = oTmpDoc.getElementsByTagName("HEAD")[0]; 
		var elStyle = oTmpDoc.createElement("STYLE");
		elStyle.innerHTML = sStyles;
		elHead.appendChild(elStyle);

		this._htStyleRule = this._getCSSStyleRule(elStyle.sheet.cssRules);
		elStyle.parentNode.removeChild(elStyle);
	},

	/**
	 * 해당 요소에 inline style을 적용한다.
	 * @param {Element} el 스타일을 적용할 대상 요소
	 * @param {CSSStyleDeclaration} oStyle 반영할 스타일 정의 객체
	 * @param {Booleam} bOverride 스타일을 덮어씌울 것인지 여부
	 */
	_applyInlineStyle : function(el, oStyle, bOverride) {
		for(var i = 0, len = oStyle.length, sStyleName; i < len; i++){
			sStyleName = oStyle[i];
			if(bOverride || !el.style[sStyleName]){
				el.style[sStyleName] = oStyle[sStyleName];
			}
		}
	},

	/**
	 * CSSStyleRule을 inline style로 반영해준다.
	 * @param {String} sSelector CSS셀렉터명
	 * @param {CSSStyleDeclaration} oStyle 셀렉터명에 해당하는 스타일 정의 객체
	 * @param {Element} el 스타일반영을 제한할 상위 요소
	 */
	_applyStyleRuleToInline : function(sSelector, oStyle, el) {
		var aClassSelector = sSelector.match(this._rxClassSelector) || [];
		// 태그 셀렉터는 잘못된 영향을 줄 수 있기 때문에 클래스 셀렉터만 적용한다.
		if(aClassSelector.length < 1) {
			return;
		}

		var sRemoveClass = aClassSelector.join(" ").replace(this._rxClassSelectorStart, "");
		var aelTarget = jindo.$$(sSelector, el);
		for(var i = 0, elTarget; (elTarget = aelTarget[i]); i++){
			this._applyInlineStyle(elTarget, oStyle);
			if(sRemoveClass){
				jindo.$Element(elTarget).removeClass(sRemoveClass);
			}
		}
	},

	/**
	 * 저장해둔 CSSStyleRule를 적용한다.
	 * @param {Element} el 적용범위를 제한할 상위 요소
	 */
	_applyStyle : function(el) {
		var htStyleRule = this._htStyleRule || {};
		for (var sSelector in htStyleRule) {
			this._applyStyleRuleToInline(sSelector, htStyleRule[sSelector], el);
		}
		this._htStyleRule = null;
	},

	/**
	 * 붙여넣기시 생성된 폰트태그를 보정한다.
	 * @param {Element} el 태그정제를 제한할 상위 요소
	 */
	_revertFontAfterPaste : function(el){
		nhn.husky.SE2M_Utils.removeInvalidFont(el);

		if(document.documentMode < 11){
			// [MUG-7757] IE11미만은 span 이 남아있기 때문에 그냥 제거
			nhn.husky.SE2M_Utils.stripTags(el, "FONT");
		}else{
			// IE11미만이외는 font를 span으로 재변환
			nhn.husky.SE2M_Utils.convertFontToSpan(el);
		}
	},

	/**
	 * SPAN태그에 line-height 스타일속성이 있으면 제거한다.
	 * @param {Element} el 태그정제를 제한할 상위 요소
	 */
	_removeLineHeightInSpan : function(el){
		var aelSpans = jindo.$$('span[style*="line-height:"]', el);
		for(var i = 0, elSpan; (elSpan = aelSpans[i]); i++){
			elSpan.style.lineHeight = null;
		}
	},

	/**
	 * paste이벤트에서 클립보드의 style태그를 추출할 수 있으면 CSSStyleRule을 저장해둔다.
	 */
	$ON_EVENT_EDITING_AREA_PASTE : function(we) {
		var oClipboard = we.$value().clipboardData;
		if (!oClipboard) {
			return;
		}
		var sClipboardHTML = oClipboard.getData("text/html");
		if (!sClipboardHTML) {
			return;
		}

		this._extractStyle(sClipboardHTML);
	},

	/**
	 * paste된 후 정제처리한다.
	 * 1. font태그가 삽입되었다면 보정한다.
	 * 2. 저장해둔 CSSStyleRule이 있다면 inline style로 반영해준다.
	 * 3. line-height스타일이 지정된 span이 있으면 해당 속성 제거
	 */
	$ON_EVENT_EDITING_AREA_PASTE_DELAY : function() {
		var el = this.oApp.getWYSIWYGDocument().body;

		this._revertFontAfterPaste(el);
		this._applyStyle(el);
		this._removeLineHeightInSpan(el);
	}
});
