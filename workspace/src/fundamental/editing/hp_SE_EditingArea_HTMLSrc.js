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
  * @fileOverview This file contains Husky plugin that takes care of the operations directly related to editing the HTML source code using Textarea element
 * @name hp_SE_EditingArea_HTMLSrc.js
 * @required SE_EditingAreaManager
 */
nhn.husky.SE_EditingArea_HTMLSrc = jindo.$Class({
	name : "SE_EditingArea_HTMLSrc",
	sMode : "HTMLSrc",
	bAutoResize : false,	// [SMARTEDITORSUS-677] 해당 편집모드의 자동확장 기능 On/Off 여부
	nMinHeight : null,		// [SMARTEDITORSUS-677] 편집 영역의 최소 높이
	
	$init : function(sTextArea) { 
		this.elEditingArea = jindo.$(sTextArea);
	},

	$BEFORE_MSG_APP_READY : function() {
		this.oNavigator = jindo.$Agent().navigator();
		this.oApp.exec("REGISTER_EDITING_AREA", [this]);
	},
	
	$ON_MSG_APP_READY : function() {
		if(!!this.oApp.getEditingAreaHeight){
			this.nMinHeight = this.oApp.getEditingAreaHeight();	// [SMARTEDITORSUS-677] 편집 영역의 최소 높이를 가져와 자동 확장 처리를 할 때 사용
		}
	},

	$ON_CHANGE_EDITING_MODE : function(sMode) {
		if (sMode == this.sMode) {				
			this.elEditingArea.style.display = "block";
			/**
			 * [SMARTEDITORSUS-1889] Editor 영역을 표시하고 숨기는 데 있어서
			 * display 속성 대신 visibility 속성을 사용하게 되면서,
			 * Editor 영역이 화면에서 사라지지만
			 * 공간을 차지하게 되므로
			 * 그 아래로 위치하는 HTML 영역을 끌어올려 준다.
			 * 
			 * @see hp_SE_EditingArea_WYSIWYG.js
			 * */
			this.elEditingArea.style.position = "absolute";
			this.elEditingArea.style.top = "0px";
			// --[SMARTEDITORSUS-1889]
		} else {
			this.elEditingArea.style.display = "none";
			// [SMARTEDITORSUS-1889]
			this.elEditingArea.style.position = "";
			this.elEditingArea.style.top = "";
			// --[SMARTEDITORSUS-1889]
		}
	},
	
	$AFTER_CHANGE_EDITING_MODE : function(sMode, bNoFocus) {
		if (sMode == this.sMode && !bNoFocus) { 
			var o = new TextRange(this.elEditingArea);
			o.setSelection(0, 0);
			
			//[SMARTEDITORSUS-1017] [iOS5대응] 모드 전환 시 textarea에 포커스가 있어도 글자가 입력이 안되는 현상
			//원인 : WYSIWYG모드가 아닐 때에도 iframe의 contentWindow에 focus가 가면서 focus기능이 작동하지 않음
			//해결 : WYSIWYG모드 일때만 실행 되도록 조건식 추가 및 기존에 blur처리 코드 삭제
			//모바일 textarea에서는 직접 클릭을해야만 키보드가 먹히기 때문에 우선은 커서가 안보이게 해서 사용자가 직접 클릭을 유도.
			// if(!!this.oNavigator.msafari){
				// this.elEditingArea.blur();
			// }
		}
	},
	
	/**
	 * [SMARTEDITORSUS-677] HTML 편집 영역 자동 확장 처리 시작
	 */ 
	startAutoResize : function(){
		var htOption = {
			nMinHeight : this.nMinHeight,
			wfnCallback : jindo.$Fn(this.oApp.checkResizeGripPosition, this).bind()
		};
		//[SMARTEDITORSUS-941][iOS5대응]아이패드의 자동 확장 기능이 동작하지 않을 때 에디터 창보다 긴 내용을 작성하면 에디터를 뚫고 나오는 현상 
		//원인 : 자동확장 기능이 정지 될 경우 iframe에 스크롤이 생기지 않고, 창을 뚫고 나옴
		//해결 : 항상 자동확장 기능이 켜져있도록 변경. 자동 확장 기능 관련한 이벤트 코드도 모바일 사파리에서 예외 처리
		if(this.oNavigator.msafari){
			htOption.wfnCallback = function(){};
		}
				
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
		if(sIR.toLowerCase() === "<br>" || sIR.toLowerCase() === "<p>&nbsp;</p>" || sIR.toLowerCase() === "<p><br></p>" || sIR.toLowerCase() === "<p></p>"){
			sIR="";
		}
		
		// [SMARTEDITORSUS-1589] 문서 모드가 Edge인 IE11에서 WYSIWYG 모드와 HTML 모드 전환 시, 문말에 무의미한 <br> 두 개가 첨가되는 현상으로 필터링 추가
		var htBrowser = jindo.$Agent().navigator();
		if(htBrowser.ie && htBrowser.nativeVersion == 11 && document.documentMode == 11){ // Edge 모드의 documentMode 값은 11
			sIR = sIR.replace(/(<br><br>$)/, "");
		}
		// --[SMARTEDITORSUS-1589]
		
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
	}
});

/**
 * Selection for textfield
 * @author hooriza
 */
if (typeof window.TextRange == 'undefined') { window.TextRange = {}; }
TextRange = function(oEl, oDoc) { 
	this._o = oEl;
	this._oDoc = (oDoc || document);
};

TextRange.prototype.getSelection = function() {
	var obj = this._o;
	var ret = [-1, -1];

	if(isNaN(this._o.selectionStart)) {
		obj.focus();

		// textarea support added by nagoon97
		var range = this._oDoc.body.createTextRange();
		var rangeField = null;

		rangeField = this._oDoc.selection.createRange().duplicate();
		range.moveToElementText(obj);
		rangeField.collapse(true);
		range.setEndPoint("EndToEnd", rangeField);
		ret[0] = range.text.length;

		rangeField = this._oDoc.selection.createRange().duplicate();
		range.moveToElementText(obj);
		rangeField.collapse(false);
		range.setEndPoint("EndToEnd", rangeField);
		ret[1] = range.text.length;

		obj.blur();
	} else {
		ret[0] = obj.selectionStart;
		ret[1] = obj.selectionEnd;
	}

	return ret;
};

TextRange.prototype.setSelection = function(start, end) {
	var obj = this._o;
	if (typeof end == 'undefined') {
		end = start;
	}

	if (obj.setSelectionRange) {
		obj.setSelectionRange(start, end);
	} else if (obj.createTextRange) {
		var range = obj.createTextRange();
		range.collapse(true);
		range.moveStart("character", start);
		range.moveEnd("character", end - start);
		range.select();
		obj.blur();
	}
};

TextRange.prototype.copy = function() {
	var r = this.getSelection();
	return this._o.value.substring(r[0], r[1]);
};

TextRange.prototype.paste = function(sStr) {
	var obj = this._o;
	var sel = this.getSelection();
	var value = obj.value;
	var pre = value.substr(0, sel[0]);
	var post = value.substr(sel[1]);

	value = pre + sStr + post;
	obj.value = value;

	var n = 0;
	if (typeof this._oDoc.body.style.maxHeight == "undefined") {
		var a = pre.match(/\n/gi);
		n = ( a !== null ? a.length : 0 );
	}
	
	this.setSelection(sel[0] + sStr.length - n);
};

TextRange.prototype.cut = function() {
	var r = this.copy();
	this.paste('');
	return r;
};
//}