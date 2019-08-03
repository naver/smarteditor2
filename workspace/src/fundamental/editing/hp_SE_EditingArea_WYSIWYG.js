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
/*[
 * ENABLE_WYSIWYG
 *
 * 비활성화된 WYSIWYG 편집 영역을 활성화 시킨다.
 *
 * none
 *
---------------------------------------------------------------------------]*/
/*[
 * DISABLE_WYSIWYG
 *
 * WYSIWYG 편집 영역을 비활성화 시킨다.
 *
 * none
 *
---------------------------------------------------------------------------]*/
/*[
 * PASTE_HTML
 *
 * HTML을 편집 영역에 삽입한다.
 *
 * sHTML string 삽입할 HTML
 * oPSelection object 붙여 넣기 할 영역, 생략시 현재 커서 위치
 *
---------------------------------------------------------------------------]*/
/*[
 * RESTORE_IE_SELECTION
 *
 * (IE전용) 에디터에서 포커스가 나가는 시점에 기억해둔 포커스를 복구한다.
 *
 * none
 *
---------------------------------------------------------------------------]*/
/**
 * @pluginDesc WYSIWYG 모드를 제공하는 플러그인
 */
nhn.husky.SE_EditingArea_WYSIWYG = jindo.$Class({
	name : "SE_EditingArea_WYSIWYG",
	status : nhn.husky.PLUGIN_STATUS.NOT_READY,

	sMode : "WYSIWYG",
	iframe : null,
	doc : null,
	
	bStopCheckingBodyHeight : false, 
	bAutoResize : false,	// [SMARTEDITORSUS-677] 해당 편집모드의 자동확장 기능 On/Off 여부
	
	nBodyMinHeight : 0,
	nScrollbarWidth : 0,
	
	iLastUndoRecorded : 0,
//	iMinUndoInterval : 50,
	
	_nIFrameReadyCount : 50,
	
	bWYSIWYGEnabled : false,
	
	$init : function(iframe){
		this.iframe = jindo.$(iframe);		
		var oAgent = jindo.$Agent().navigator();		
		// IE에서 에디터 초기화 시에 임의적으로 iframe에 포커스를 반쯤(IME 입력 안되고 커서만 깜박이는 상태) 주는 현상을 막기 위해서 일단 iframe을 숨겨 뒀다가 CHANGE_EDITING_MODE에서 위지윅 전환 시 보여준다.
		// 이런 현상이 다양한 요소에 의해서 발생하며 발견된 몇가지 경우는,
		// - frameset으로 페이지를 구성한 후에 한개의 frame안에 버튼을 두어 에디터로 링크 할 경우
		// - iframe과 동일 페이지에 존재하는 text field에 값을 할당 할 경우
		if(oAgent.ie){
			this.iframe.style.display = "none";
		}
	
		// IE8 : 찾기/바꾸기에서 글자 일부에 스타일이 적용된 경우 찾기가 안되는 브라우저 버그로 인해 EmulateIE7 파일을 사용
		// <meta http-equiv="X-UA-Compatible" content="IE=EmulateIE7">
		this.sBlankPageURL = "smart_editor2_inputarea.html";
		this.sBlankPageURL_EmulateIE7 = "smart_editor2_inputarea_ie8.html";
		this.aAddtionalEmulateIE7 = [];

		this.htOptions = nhn.husky.SE2M_Configuration.SE_EditingAreaManager;	
		if (this.htOptions) {
			this.sBlankPageURL = this.htOptions.sBlankPageURL || this.sBlankPageURL;
			this.sBlankPageURL_EmulateIE7 = this.htOptions.sBlankPageURL_EmulateIE7 || this.sBlankPageURL_EmulateIE7;
			this.aAddtionalEmulateIE7 = this.htOptions.aAddtionalEmulateIE7 || this.aAddtionalEmulateIE7;
		}
		
		this.aAddtionalEmulateIE7.push(8); // IE8은 Default 사용

		this.sIFrameSrc = this.sBlankPageURL;
		if(oAgent.ie && jindo.$A(this.aAddtionalEmulateIE7).has(oAgent.nativeVersion)) {
			this.sIFrameSrc = this.sBlankPageURL_EmulateIE7;
		}
		
		var sIFrameSrc = this.sIFrameSrc,
			iframe = this.iframe,
			fHandlerSuccess = jindo.$Fn(this.initIframe, this).bind(),
			fHandlerFail =jindo.$Fn(function(){this.iframe.src = sIFrameSrc;}, this).bind();
			
		if(!oAgent.ie || (oAgent.version >=9 && !!document.addEventListener)){
			iframe.addEventListener("load", fHandlerSuccess, false);
			iframe.addEventListener("error", fHandlerFail, false);
		}else{
			iframe.attachEvent("onload", fHandlerSuccess);
			iframe.attachEvent("onerror", fHandlerFail);
		}
		iframe.src = sIFrameSrc; 	
		this.elEditingArea = iframe;
	},

	$BEFORE_MSG_APP_READY : function(){
		this.oEditingArea = this.iframe.contentWindow.document;
		this.oApp.exec("REGISTER_EDITING_AREA", [this]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getWYSIWYGWindow", jindo.$Fn(this.getWindow, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getWYSIWYGDocument", jindo.$Fn(this.getDocument, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["isWYSIWYGEnabled", jindo.$Fn(this.isWYSIWYGEnabled, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getRawHTMLContents", jindo.$Fn(this.getRawHTMLContents, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["setRawHTMLContents", jindo.$Fn(this.setRawHTMLContents, this).bind()]);
		
		if (!!this.isWYSIWYGEnabled()) {
			this.oApp.exec('ENABLE_WYSIWYG_RULER');
		}
		
		this.oApp.registerBrowserEvent(this.getDocument().body, 'paste', 'EVENT_EDITING_AREA_PASTE');
		this.oApp.registerBrowserEvent(this.getDocument().body, 'drop', 'EVENT_EDITING_AREA_DROP');
	},

	$ON_MSG_APP_READY : function(){
		if(!this.oApp.hasOwnProperty("saveSnapShot")){
			this.$ON_EVENT_EDITING_AREA_MOUSEUP = function(){};
			this._recordUndo = function(){};
		}
				
		// uncomment this line if you wish to use the IE-style cursor in FF
		// this.getDocument().body.style.cursor = "text";

		// Do not update this._oIERange until the document is actually clicked (focus was given by mousedown->mouseup)
		// Without this, iframe cannot be re-selected(by RESTORE_IE_SELECTION) if the document hasn't been clicked
		// mousedown on iframe -> focus goes into the iframe doc -> beforedeactivate is fired -> empty selection is saved by the plugin -> empty selection is recovered in RESTORE_IE_SELECTION
		this._bIERangeReset = true;

		// [SMARTEDITORSUS-2149] win10_edge 추가 (TODO: 추후 win10 정식릴리즈시 ua 재확인필요)
		if(this.oApp.oNavigator.ie || navigator.userAgent.indexOf("Edge") > -1){
			this._bIECursorHide = true;
			jindo.$Fn(
				function(weEvent){
					var oSelection = this.iframe.contentWindow.document.selection;
					if(oSelection && oSelection.type.toLowerCase() === 'control' && weEvent.key().keyCode === 8){
						this.oApp.exec("EXECCOMMAND", ['delete', false, false]);
						weEvent.stop();
					}
					
					this._bIERangeReset = false;
				}, this
			).attach(this.iframe.contentWindow.document, "keydown");
			jindo.$Fn(
				function(weEvent){
					this._oIERange = null;
					this._bIERangeReset = true;
				}, this
			).attach(this.iframe.contentWindow.document.body, "mousedown");

			// [SMARTEDITORSUS-1810] document.createRange 가 없는 경우만(IE8이하) beforedeactivate 이벤트 등록
			if(!this.getDocument().createRange){
				jindo.$Fn(this._onIEBeforeDeactivate, this).attach(this.iframe.contentWindow.document.body, "beforedeactivate");
			}
			
			jindo.$Fn(
				function(weEvent){
					this._bIERangeReset = false;
				}, this
			).attach(this.iframe.contentWindow.document.body, "mouseup");
		}else if(this.oApp.oNavigator.bGPadBrowser){
			// [SMARTEDITORSUS-1802] GPad 에서만 툴바 터치시 셀렉션을 저장해둔다.
			this.$ON_EVENT_TOOLBAR_TOUCHSTART = function(){
				this._oIERange = this.oApp.getSelection().cloneRange();
			}
		}
		
		// DTD가 quirks가 아닐 경우 body 높이 100%가 제대로 동작하지 않아서 타임아웃을 돌며 높이를 수동으로 계속 할당 해 줌 
		// body 높이가 제대로 설정 되지 않을 경우, 보기에는 이상없어 보이나 마우스로 텍스트 선택이 잘 안된다든지 하는 이슈가 있음
		this.fnSetBodyHeight = jindo.$Fn(this._setBodyHeight, this).bind();
		this.fnCheckBodyChange = jindo.$Fn(this._checkBodyChange, this).bind();

		this.fnSetBodyHeight();
		this._nContainerHeight = this.oApp.getEditingAreaHeight();	// 편집영역이 리사이즈되었는지 체크하기 위해 초기값 할당
		
		this._setScrollbarWidth();
	},

	$ON_REGISTER_CONVERTERS : function(){
		this.oApp.exec("ADD_CONVERTER_DOM", ["DB_TO_IR", jindo.$Fn(this._dbToIrDOM, this).bind()]);
	},

	/**
	 * [SMARTEDITORSUS-2315] setContents가 될때 폰트태그를 정제해준다.
	 */
	_dbToIrDOM : function(oTmpNode){
		nhn.husky.SE2M_Utils.removeInvalidFont(oTmpNode);
		nhn.husky.SE2M_Utils.convertFontToSpan(oTmpNode);
	},

	/**
	 * 스크롤바의 사이즈 측정하여 설정
	 */
	_setScrollbarWidth : function(){
		var oDocument = this.getDocument(),
			elScrollDiv = oDocument.createElement("div");
		
		elScrollDiv.style.width = "100px";
		elScrollDiv.style.height = "100px";
		elScrollDiv.style.overflow = "scroll";
		elScrollDiv.style.position = "absolute";
		elScrollDiv.style.top = "-9999px";
				
		oDocument.body.appendChild(elScrollDiv);

		this.nScrollbarWidth = elScrollDiv.offsetWidth - elScrollDiv.clientWidth;
		
		oDocument.body.removeChild(elScrollDiv);
	},
	
	/**
	 * [SMARTEDITORSUS-677] 붙여넣기나 내용 입력에 대한 편집영역 자동 확장 처리
	 */ 
	$AFTER_EVENT_EDITING_AREA_KEYUP : function(oEvent){		
		if(!this.bAutoResize){
			return;
		}
		
		var oKeyInfo = oEvent.key();

		if((oKeyInfo.keyCode >= 33 && oKeyInfo.keyCode <= 40) || oKeyInfo.alt || oKeyInfo.ctrl || oKeyInfo.keyCode === 16){
			return;
		}
		
		this._setAutoResize();
	},
	
	/**
	 * [SMARTEDITORSUS-677] 붙여넣기나 내용 입력에 대한 편집영역 자동 확장 처리
	 */
	$AFTER_PASTE_HTML : function(){
		if(!this.bAutoResize){
			return;
		}
		
		this._setAutoResize();
	},

	/**
	 * [SMARTEDITORSUS-677] WYSIWYG 편집 영역 자동 확장 처리 시작
	 */ 
	startAutoResize : function(){
		this.oApp.exec("STOP_CHECKING_BODY_HEIGHT");
		this.bAutoResize = true;
		
		var oBrowser = this.oApp.oNavigator;

		// [SMARTEDITORSUS-887] [블로그 1단] 자동확장 모드에서 에디터 가로사이즈보다 큰 사진을 추가했을 때 가로스크롤이 안생기는 문제
		if(oBrowser.ie && oBrowser.version < 9){
			jindo.$Element(this.getDocument().body).css({ "overflow" : "visible" });

			// { "overflowX" : "visible", "overflowY" : "hidden" } 으로 설정하면 세로 스크롤 뿐 아니라 가로 스크롤도 보이지 않는 문제가 있어
			// { "overflow" : "visible" } 로 처리하고 에디터의 container 사이즈를 늘려 세로 스크롤이 보이지 않도록 처리해야 함
			// [한계] 자동 확장 모드에서 내용이 늘어날 때 세로 스크롤이 보였다가 없어지는 문제
		}else{
			jindo.$Element(this.getDocument().body).css({ "overflowX" : "visible", "overflowY" : "hidden" });
		}
				
		this._setAutoResize();
		this.nCheckBodyInterval = setInterval(this.fnCheckBodyChange, 500);
		
		this.oApp.exec("START_FLOAT_TOOLBAR");	// set scroll event
	},
	
	/**
	 * [SMARTEDITORSUS-677] WYSIWYG 편집 영역 자동 확장 처리 종료
	 */ 
	stopAutoResize : function(){
		this.bAutoResize = false;
		clearInterval(this.nCheckBodyInterval);

		this.oApp.exec("STOP_FLOAT_TOOLBAR");	// remove scroll event
		
		jindo.$Element(this.getDocument().body).css({ "overflow" : "visible", "overflowY" : "visible" });
		
		this.oApp.exec("START_CHECKING_BODY_HEIGHT");
	},
	
	/**
	 * [SMARTEDITORSUS-677] 편집 영역 Body가 변경되었는지 주기적으로 확인
	 */ 
	_checkBodyChange : function(){
		if(!this.bAutoResize){
			return;
		}
		
		var nBodyLength = this.getDocument().body.innerHTML.length;
		
		if(nBodyLength !== this.nBodyLength){
			this.nBodyLength = nBodyLength;
			
			this._setAutoResize();
		}
	},
	
	/**
	 * [SMARTEDITORSUS-677] WYSIWYG 자동 확장 처리
	 */ 
	_setAutoResize : function(){		
		var elBody = this.getDocument().body,
			welBody = jindo.$Element(elBody),
			nBodyHeight,
			nContainerHeight,
			oCurrentStyle,
			nStyleSize,
			bExpand = false,
			oBrowser = this.oApp.oNavigator;
		
		this.nTopBottomMargin = this.nTopBottomMargin || (parseInt(welBody.css("marginTop"), 10) + parseInt(welBody.css("marginBottom"), 10));
		this.nBodyMinHeight = this.nBodyMinHeight || (this.oApp.getEditingAreaHeight() - this.nTopBottomMargin);

		// 내용이 줄었을 경우, height를 줄여주기 위해 height를 0으로 조정하고 
		// scrollHeight 를 이용해 내용의 실제 높이값을 구한다.
		welBody.css("height", "0px");
		this.iframe.style.height = "0px";
		nBodyHeight = parseInt(elBody.scrollHeight, 10);

		if(nBodyHeight < this.nBodyMinHeight){	// 최소높이값 지정
			nBodyHeight = this.nBodyMinHeight;
		}

		if(oBrowser.ie){
			// 내용 뒤로 공간이 남아 보일 수 있으나 추가로 Container높이를 더하지 않으면
			// 내용 가장 뒤에서 Enter를 하는 경우 아래위로 흔들려 보이는 문제가 발생
			if(nBodyHeight > this.nBodyMinHeight){
				oCurrentStyle = this.oApp.getCurrentStyle();
				// [SMARTEDITORSUS-1756]
				//nStyleSize = parseInt(oCurrentStyle.fontSize, 10) * oCurrentStyle.lineHeight;
				nStyleSize = this._getStyleSize(oCurrentStyle);
				// --[SMARTEDITORSUS-1756]
				
				if(nStyleSize < this.nTopBottomMargin){
					nStyleSize = this.nTopBottomMargin;
				}

				nContainerHeight = nBodyHeight + nStyleSize;
				nContainerHeight += 18;
				
				bExpand = true;
			}else{
				nBodyHeight = this.nBodyMinHeight;
				nContainerHeight = this.nBodyMinHeight + this.nTopBottomMargin;
			}
		// }else if(oBrowser.safari){	// -- 사파리에서 내용이 줄어들지 않는 문제가 있어 Firefox 방식으로 변경함
			// // [Chrome/Safari] 크롬이나 사파리에서는 Body와 iframe높이서 서로 연관되어 늘어나므로,
			// // nContainerHeight를 추가로 더하는 경우 setTimeout 시 무한 증식되는 문제가 발생할 수 있음
			// nBodyHeight = nBodyHeight > this.nBodyMinHeight ? nBodyHeight - this.nTopBottomMargin : this.nBodyMinHeight;
			// nContainerHeight = nBodyHeight + this.nTopBottomMargin;
		}else{
			// [FF] nContainerHeight를 추가로 더하였음. setTimeout 시 무한 증식되는 문제가 발생할 수 있음
			if(nBodyHeight > this.nBodyMinHeight){
				oCurrentStyle = this.oApp.getCurrentStyle();
				// [SMARTEDITORSUS-1756]
				//nStyleSize = parseInt(oCurrentStyle.fontSize, 10) * oCurrentStyle.lineHeight;
				nStyleSize = this._getStyleSize(oCurrentStyle);
				// --[SMARTEDITORSUS-1756]
				
				if(nStyleSize < this.nTopBottomMargin){
					nStyleSize = this.nTopBottomMargin;
				}

				nContainerHeight = nBodyHeight + nStyleSize;
				
				bExpand = true;
			}else{
				nBodyHeight = this.nBodyMinHeight;
				nContainerHeight = this.nBodyMinHeight + this.nTopBottomMargin;
			}
		}
		
		welBody.css("height", nBodyHeight + "px");
		this.iframe.style.height = nContainerHeight + "px";				// 편집영역 IFRAME의 높이 변경
		this.oApp.welEditingAreaContainer.height(nContainerHeight);		// 편집영역 IFRAME을 감싸는 DIV 높이 변경
		
		// [SMARTEDITORSUS-2036] 자동리사이즈기능으로 편집영역 크기가 변경되면 메시지를 발생시키도록 함
		if(this._nContainerHeight !== nContainerHeight){
			this._nContainerHeight = nContainerHeight;
			this.oApp.exec('MSG_EDITING_AREA_SIZE_CHANGED');
		}

		//[SMARTEDITORSUS-941][iOS5대응]아이패드의 자동 확장 기능이 동작하지 않을 때 에디터 창보다 긴 내용을 작성하면 에디터를 뚫고 나오는 현상 
		//원인 : 자동확장 기능이 정지 될 경우 iframe에 스크롤이 생기지 않고, 창을 뚫고 나옴
		//해결 : 항상 자동확장 기능이 켜져있도록 변경. 자동 확장 기능 관련한 이벤트 코드도 모바일 사파리에서 예외 처리
		if(!this.oApp.oNavigator.msafari){
			this.oApp.checkResizeGripPosition(bExpand);
		}
	},
	
	// [SMARTEDITORSUS-1756]
	_getStyleSize : function(oCurrentStyle){
		/**
		 * this.iframe의 height style에 반영되는 높이값인
		 * nContainerHeight를 결정짓는 nStyleSize의 경우,
		 * 기존 로직에서는
		 * nStyleSize = parseInt(oCurrentStyle.fontSize, 10) * oCurrentStyle.lineHeight;
		 * 와 같이 값을 산정한다.
		 * 
		 * SmartEditor에서만 생산한 컨텐츠의 경우,
		 * font-size 값은 px 단위형 숫자이고,
		 * line-height 값은 배수형 숫자이다.
		 * 
		 * 따라서 nStyleSize는 이 산정으로 px 단위의 숫자값을 가지게 된다.
		 * 
		 * 하지만 외부에서 붙여넣은 컨텐츠는 다양한 형태의 font-size값과 line-height 값을 가질 수 있다.
		 * 그 중 일부 값은 nStyleSize를 NaN으로 만들기 때문에, 
		 * 컨텐츠가 화면에서 사라진 것처럼 보이는 현상을 일으킨다.
		 * 
		 * 또한 "px 단위형 - 배수형" 이라는 틀에 맞지 않으면
		 * 부적절한 결과를 야기할 수 있다.
		 * 
		 * 따라서 font-size 값을 px 단위형 숫자로,
		 * line-height 값을 배수형 숫자로 보정해 줘서, 
		 * nStyleSize가 숫자형이 될 수 있도록 만들어 준다.
		 * 
		 * line-height의 보정은 아래를 참조한다. (http://www.w3schools.com/cssref/pr_dim_line-height.asp)
		 * -"normal" : 통상 120%에 대응하며, 정확한 값은 font-family에 좌우 (https://developer.mozilla.org/en-US/docs/Web/CSS/line-height)
		 * --ex) verdana 폰트
		 * ---12px~15일 때 120% 에 대응
		 * ---16일 때 115%
		 * ---17일 때 120%
		 * ---18~20일 때 125%
		 * -배수형 숫자
		 * -단위형 숫자 (pt, px, em, cm 등)
		 * --pt : 12pt = 16px = 100%
		 * --em : 1em = 12pt = 16px = 100%
		 * --cm : 1inch = 2.54cm = 96px 이므로 1cm = (1/2.54*96) = 약 37.795px
		 * -%형
		 * -"initial"
		 * -"inherit" : 부모 엘리먼트의 값에 의해 좌우됨
		 * 
		 * font-size의 보정은 아래를 참조한다. (http://www.w3schools.com/cssref/pr_font_font-size.asp)
		 * -"medium" : 16px = 100%
		 * -단위형은 line-height와 같이 처리
		 * */
		var nResult;
		if(oCurrentStyle){
			// line-height 값을 배수형으로 보정
			var nLineHeight = oCurrentStyle.lineHeight;
			if(nLineHeight && /[^\d\.]/.test(nLineHeight)){ // 배수형이 아닌 경우
				if(/\d/.test(nLineHeight) && /[A-Za-z]/.test(nLineHeight)){ // 단위형 : 실제 원하는 최종 결과값인 만큼, px 단위형으로 변환만 거친 뒤 return
					if(/px$/.test(nLineHeight)){ // px 단위형 : 최종 결과값
						return parseFloat(nLineHeight, 10);
					}else if(/pt$/.test(nLineHeight)){ // pt 단위형
						return parseFloat(nLineHeight, 10) * 4 / 3;
					}else if(/em$/.test(nLineHeight)){ // em 단위형
						return parseFloat(nLineHeight, 10) * 16;
					}else if(/cm$/.test(nLineHeight)){ // cm 단위형
						return parseFloat(nLineHeight, 10) * 96 / 2.54;
					}
				}else if(/\d/.test(nLineHeight) && /%/.test(nLineHeight)){ // %형
					nLineHeight = parseFloat(nLineHeight, 10) * 100;
				}else if(!/[^A-Za-z]/.test(nLineHeight)){ // TODO : "normal", "inherit", "initial" 세분화
					nLineHeight = 1.2;
				}
			}
			
			// font-size 값을 px 단위형으로 보정
			var sFontSize = oCurrentStyle.fontSize;
			if(sFontSize && !/px$/.test(sFontSize)){ // px 단위형이 아닌 경우
				if(/pt$/.test(sFontSize)){ // pt 단위형
					sFontSize = parseFloat(sFontSize, 10) * 4 / 3 + "px";
				}else if(/em$/.test(sFontSize)){ // em 단위형
					sFontSize = parseFloat(sFontSize, 10) * 16 + "px";
				}else if(/cm$/.test(sFontSize)){ // cm 단위형
					sFontSize = parseFloat(sFontSize, 10) * 96 / 2.54 + "px";
				}else if(sFontSize == "medium"){ // "medium"
					sFontSize = "16px";
				}else{ // TODO : 다양한 small, large 종류가 존재 
					sFontSize = "16px";
				}
			}
			
			nResult = parseFloat(sFontSize, 10) * nLineHeight;
		}else{
			nResult = 12 * 1.5;
		}
		
		return nResult;
	},
	// --[SMARTEDITORSUS-1756]
	
	/**
	 * 스크롤 처리를 위해 편집영역 Body의 사이즈를 확인하고 설정함
	 * 편집영역 자동확장 기능이 Off인 경우에 주기적으로 실행됨
	 */ 
	_setBodyHeight : function(){
		if( this.bStopCheckingBodyHeight ){ // 멈춰야 하는 경우 true, 계속 체크해야 하면 false
			// 위지윅 모드에서 다른 모드로 변경할 때 "document는 css를 사용 할수 없습니다." 라는 error 가 발생.
			// 그래서 on_change_mode에서 bStopCheckingBodyHeight 를 true로 변경시켜줘야 함.
			return;
		}

		var elBody = this.getDocument().body,
			welBody = jindo.$Element(elBody),
			nMarginTopBottom = parseInt(welBody.css("marginTop"), 10) + parseInt(welBody.css("marginBottom"), 10),
			nContainerOffset = this.oApp.getEditingAreaHeight(),
			nMinBodyHeight = nContainerOffset - nMarginTopBottom,
			nBodyHeight = welBody.height(),
			nScrollHeight,
			nNewBodyHeight;
		
		this.nTopBottomMargin = nMarginTopBottom;
		
		if(nBodyHeight === 0){	// [SMARTEDITORSUS-144] height 가 0 이고 내용이 없으면 크롬10 에서 캐럿이 보이지 않음
			welBody.css("height", nMinBodyHeight + "px");

			setTimeout(this.fnSetBodyHeight, 500);	
			return;
		}
		
		/**
		 * [SMARTEDITORSUS-1972] [IE 11] 마지막 변경된 body height에서 변화가 없는 경우 0px로 축소하지 않음
		 * */
		var htBrowser = jindo.$Agent().navigator(),
		isIE11 = (htBrowser.ie && htBrowser.nativeVersion === 11),
		isShrinkingUnnecessary = (this.nBodyHeight_last === nBodyHeight);
		
		if(!(isIE11 && isShrinkingUnnecessary)){
			welBody.css("height", "0px");
		}
		// Previous below	
		/*welBody.css("height", "0px");*/
		// --[SMARTEDITORSUS-1972]
		
		// [SMARTEDITORSUS-257] IE9, 크롬에서 내용을 삭제해도 스크롤이 남아있는 문제 처리
		// body 에 내용이 없어져도 scrollHeight 가 줄어들지 않아 height 를 강제로 0 으로 설정
		
		nScrollHeight = parseInt(elBody.scrollHeight, 10);

		nNewBodyHeight = (nScrollHeight > nContainerOffset ? nScrollHeight - nMarginTopBottom : nMinBodyHeight);
		// nMarginTopBottom 을 빼지 않으면 스크롤이 계속 늘어나는 경우가 있음 (참고 [BLOGSUS-17421])

		if(this._isHorizontalScrollbarVisible()){
			nNewBodyHeight -= this.nScrollbarWidth;
		}
		
		// [SMARTEDITORSUS-1972]
		if(!(isIE11 && isShrinkingUnnecessary)){
			welBody.css("height", nNewBodyHeight + "px");
		}
		this.nBodyHeight_last = nNewBodyHeight;
		// Previous below
		/*welBody.css("height", nNewBodyHeight + "px");*/
		// --[SMARTEDITORSUS-1972]
		
		setTimeout(this.fnSetBodyHeight, 500);
	},
	
	/**
	 * 가로 스크롤바 생성 확인
	 */
	_isHorizontalScrollbarVisible : function(){
		var oDocument = this.getDocument();
		
		if(oDocument.documentElement.clientWidth < oDocument.documentElement.scrollWidth){
			//oDocument.body.clientWidth < oDocument.body.scrollWidth ||
			
			return true;
		}
		
		return false;
	},
	
	/**
	 *  body의 offset체크를 멈추게 하는 함수.
	 */
	$ON_STOP_CHECKING_BODY_HEIGHT :function(){
		if(!this.bStopCheckingBodyHeight){
			this.bStopCheckingBodyHeight = true;
		}
	},
	
	/**
	 *  body의 offset체크를 계속 진행.
	 */
	$ON_START_CHECKING_BODY_HEIGHT :function(){
		if(this.bStopCheckingBodyHeight){
			this.bStopCheckingBodyHeight = false;
			this.fnSetBodyHeight();
		}
	},
	
	$ON_IE_CHECK_EXCEPTION_FOR_SELECTION_PRESERVATION : function(){
		// 현재 선택된 앨리먼트가 iframe이라면, 셀렉션을 따로 기억 해 두지 않아도 유지 됨으로 RESTORE_IE_SELECTION을 타지 않도록 this._oIERange을 지워준다.
		// (필요 없을 뿐더러 저장 시 문제 발생)
		var oSelection = this.getDocument().selection;
        if(oSelection && oSelection.type === "Control"){
            this._oIERange = null;
        }
	},
	
	_onIEBeforeDeactivate : function(wev){
		this.oApp.delayedExec("IE_CHECK_EXCEPTION_FOR_SELECTION_PRESERVATION", null, 0);

		if(this._oIERange){
			return;
		}

		// without this, cursor won't make it inside a table.
		// mousedown(_oIERange gets reset) -> beforedeactivate(gets fired for table) -> RESTORE_IE_SELECTION
		if(this._bIERangeReset){
			return;
		}

		this._oIERange = this.oApp.getSelection().cloneRange();
	},
	
	$ON_CHANGE_EDITING_MODE : function(sMode, bNoFocus){
		if(sMode === this.sMode){
			// [SMARTEDITORSUS-1213][IE9, 10] 사진 삭제 후 zindex 1000인 div가 잔존하는데, 그 위로 썸네일 drag를 시도하다 보니 drop이 불가능.
			var htBrowser = jindo.$Agent().navigator();
			if(htBrowser.ie && htBrowser.nativeVersion > 8){ 
				var elFirstChild = jindo.$$.getSingle("DIV.husky_seditor_editing_area_container").childNodes[0];
				if((elFirstChild.tagName == "DIV") && (elFirstChild.style.zIndex == 1000)){
					elFirstChild.parentNode.removeChild(elFirstChild);
				}
			}
			// --[SMARTEDITORSUS-1213]
			
			/**
			 * [SMARTEDITORSUS-1889] 
			 * visibility 속성을 사용해서 Editor를 표시하고 숨김
			 * 단, 에디터 초기화 시 필요한 display:block 설정은 유지
			 * 
			 * */
			this.iframe.style.visibility = "visible";
			if(this.iframe.style.display != "block"){ // 초기화 시 최초 1회
				this.iframe.style.display = "block";
			}
			// Previous below
			//this.iframe.style.display = "block";
			// --[SMARTEDITORSUS-1889]
			
			this.oApp.exec("SET_EDITING_WINDOW", [this.getWindow()]);
			this.oApp.exec("START_CHECKING_BODY_HEIGHT");
		}else{
			/**
			 * [SMARTEDITORSUS-1889] 
			 * 모드 전환 시 display:none과 display:block을 사용해서
			 * Editor 영역을 표시하고 숨기는 경우,
			 * iframe 요소가 그 때마다 다시 로드되는 과정에서
			 * 스크립트 오류를 유발시킴 (국내지도)
			 * 
			 * 따라서 visibility 속성을 대신 사용하고,
			 * 이 경우 Editor 영역이 공간을 여전히 차지하고 있기 때문에
			 * 그 아래 위치하게 될 수밖에 없는
			 * HTML 영역이나 Text 영역은
			 * position:absolute와 top 속성을 사용하여
			 * 위로 끌어올리는 방법을 사용
			 * */
			this.iframe.style.visibility = "hidden";
			// previous below
			//this.iframe.style.display = "none";
			// --[SMARTEDITORSUS-1889]
			this.oApp.exec("STOP_CHECKING_BODY_HEIGHT");
		}
	},

	$AFTER_CHANGE_EDITING_MODE : function(sMode, bNoFocus){
		this._oIERange = null;
	},

	$ON_ENABLE_WYSIWYG : function(){
		this._enableWYSIWYG();
	},

	$ON_DISABLE_WYSIWYG : function(){
		this._disableWYSIWYG();
	},
	
	$ON_IE_HIDE_CURSOR : function(){
		if(!this._bIECursorHide){
			return;
		}

		this._onIEBeforeDeactivate();

		// De-select the default selection.
		// [SMARTEDITORSUS-978] IE9에서 removeAllRanges로 제거되지 않아
		// 이전 IE와 동일하게 empty 방식을 사용하도록 하였으나 doc.selection.type이 None인 경우 에러
		// Range를 재설정 해주어 selectNone 으로 처리되도록 예외처리
		var oSelection = this.oApp.getWYSIWYGDocument().selection;
        if(oSelection && oSelection.createRange){
        	try{
        		oSelection.empty();
        	}catch(e){
        		// [SMARTEDITORSUS-1003] IE9 / doc.selection.type === "None"
        		oSelection = this.oApp.getSelection();
        		oSelection.select();
        		oSelection.oBrowserSelection.selectNone();
        	}
        }else{
            this.oApp.getEmptySelection().oBrowserSelection.selectNone();
        	this.getDocument().body.blur();	// [SMARTEDITORSUS-2149] win10_edge 에서 커서가 보이지 않도록 하려면 blur 해줘야 한다.
        }
	},
	
	$AFTER_SHOW_ACTIVE_LAYER : function(){
		this.oApp.exec("IE_HIDE_CURSOR");
		this.bActiveLayerShown = true;
	},
	
	$BEFORE_EVENT_EDITING_AREA_KEYDOWN : function(oEvent){
		this._bKeyDown = true;
	},
	
	$ON_EVENT_EDITING_AREA_KEYDOWN : function(oEvent){
		if(this.oApp.getEditingMode() !== this.sMode){
			return;
		}
		
		var oKeyInfo = oEvent.key();
		if(this.oApp.oNavigator.ie){
			//var oKeyInfo = oEvent.key();
			switch(oKeyInfo.keyCode){
				case 33:
					this._pageUp(oEvent);
					break;
				case 34:
					this._pageDown(oEvent);
					break;
				case 8:		// [SMARTEDITORSUS-495][SMARTEDITORSUS-548] IE에서 표가 삭제되지 않는 문제
					this._backspace(oEvent);
					break;
				case 46:	// [SMARTEDITORSUS-2064] IE11은 delete 로 테이블 삭제가 안되서 추가함
					this._delete(oEvent);
					break;
				default:
			}
		}else if(this.oApp.oNavigator.firefox){
			// [SMARTEDITORSUS-151] FF 에서 표가 삭제되지 않는 문제
			if(oKeyInfo.keyCode === 8){				// backspace
				this._backspace(oEvent);
			}
		}
		
		this._recordUndo(oKeyInfo);	// 첫번째 Delete 키 입력 전의 상태가 저장되도록 KEYDOWN 시점에 저장
	},

	/**
	 * IE와 FF에서 백스페이스로 테이블이 삭제되지 않기 때문에 강제삭제 처리
	 */
	_backspace : function(weEvent){
		var oPrevNode = this._prepareBackspaceDelete(true);
		if(!oPrevNode){
			return;
		}

		if(this._removeUnremovable(oPrevNode, true)){
			// table 처럼 키로 삭제가 안되는 경우 강제 삭제하고 이벤트를 중단한다.
			weEvent.stop();
		}
	},

	/**
	 * [SMARTEDITORSUS-2064] IE11은 delete 로 테이블 삭제가 안되서 추가함
	 * [SMARTEDITORSUS-2184] span > p 역전현상으로 인한 오류 보정 로직 추가
	 */
	_delete : function(weEvent){
		var oNextNode = this._prepareBackspaceDelete(false);
		if(!oNextNode){
			return;
		}

		if(this._removeUnremovable(oNextNode, false)){
			// table 처럼 키로 삭제가 안되는 경우 강제 삭제하고 이벤트를 중단한다.
			weEvent.stop();
		}else if(oNextNode.nodeType === 3){
			// [SMARTEDITORSUS-2184] 텍스트 노드이면 다음 라인을 확인하여 span > p 역전된 경우 span 만 제거하도록 처리
			var oLineInfo = this.oApp.getSelection().getLineInfo(),
				oEnd = oLineInfo.oEnd.oLineBreaker,
				oNextLine = oEnd && oEnd.nextSibling;
			this._removeWrongSpan(oNextLine);
		}else{
			// [SMARTEDITORSUS-2184] span > p 역전된 경우 span 만 제거하도록 처리
			this._removeWrongSpan(oNextNode);
		}
	},

	/**
	 * backspace/delete 키에 대한 공통 전처리 과정으로
	 * 셀렉션레인지가 collapsed 상태인 경우 주변의 노드를 반환한다.
	 * @param {Boolean} bBackspace 백스페이스키 여부 (true 면 앞쪽노드를 찾고 false 면 뒤쪽노드를 찾는다.)
	 * @returns {Node} 찾은 주변 노드
	 */
	_prepareBackspaceDelete : function(bBackspace){
		var oSelection = this.oApp.getSelection();
		if(!oSelection.collapsed){
			return;
		}

		var oNode = oSelection.getNodeAroundRange(bBackspace, false);
		// LineFeed 텍스트노드라면 다음 노드를 할당
		if(this._isLineFeed(oNode)){
			oNode = bBackspace ? oSelection._getPrevNode(oNode) : oSelection._getNextNode(oNode);
		}
		/*
		 * [SMARTEDITORSUS-1575] 빈라인에 커서홀더가 삽입된 상태에서는
		 * 키를 두번 쳐야 빈줄이 삭제되기 때문에 미리 커서홀더문자는 제거한다.
		 */
		this._clearCursorHolderValue(oNode);

		return oNode;
	},

	/**
	 * 해당 텍스트 노드가 LineFeed(\n) 로만 이루어졌는지 여부
	 * @param {Node} oNode 확인할 노드
	 * @returns {Boolean} LineFeed(\n) 로만 이루어진 텍스트노드인지 여부
	 */
	_isLineFeed : function(oNode){
		return (oNode && oNode.nodeType === 3 && /^[\n]*$/.test(oNode.nodeValue));
	},

	/**
	 * 해당 텍스트 노드의 값이 커서홀더 문자이면 값을 비운다. (노드자체를 제거하지 않고 문자값만 비운다.)
	 * @param {Node} oNode 확인할 노드
	 */
	_clearCursorHolderValue : function(oNode){
		if(oNode && oNode.nodeType === 3 &&
				(oNode.nodeValue === "\u200B" || oNode.nodeValue === "\uFEFF")){
			oNode.nodeValue = "";
		}
	},

	/**
	 * backspace나 delete 키로 삭제가 안되는 요소를 강제 삭제한다.
	 * @param {Node} oNode 확인할 노드
	 * @param {Boolean} bBackspace 백스페이스키 여부
	 * @returns {Boolean} 삭제되었으면 true 반환
	 */
	_removeUnremovable : function(oNode, bBackspace){
		var bRemoved = false;
		if(!oNode){
			return false;
		}

		if(oNode.nodeName === "TABLE"){
			oNode.parentNode.removeChild(oNode);
			bRemoved = true;
		}else if(oNode.nodeName === "DIV"){
			/*
			 * IE의 경우 텍스트가 없는 블럭요소가 삭제되지 않기 때문에 별도 처리함
			 * TODO: div 뿐만 아니라 다른 블럭요소도 마찬가지일 것으로 추정되나 일단 div에 대해서만 한정 처리함
			 */
			var oChild = bBackspace ? oNode.lastChild : oNode.firstChild;
			if(!oChild){
				oNode.parentNode.removeChild(oNode);
				bRemoved = true;
			}else if(oChild.nodeName === "TABLE"){
				oNode.removeChild(oChild);
				bRemoved = true;
			}else if(oChild.nodeType === 1 && jindo.$S(oChild.innerHTML).trim() == ""){
				oNode.removeChild(oChild);
				bRemoved = true;
			}
		}

		return bRemoved;
	},

	/**
	 * [SMARTEDITORSUS-2184] span 안쪽에 p태그가 있는 경우 span의 모든 child 노드를 밖으로 빼내고 제거한다.
	 * known-issue: span에 스타일이 적용되어 있을 경우, 적용된 스타일이 풀려버린다. 
	 * 잘못된 span에 적용된 스타일을 무조건 안쪽에 넣어주기에는 위험도가 있어서 별도 처리하지 않음 
	 * @param {Node} oNode 확인할 노드
	 */
	_removeWrongSpan : function(oNode){
		if(oNode && oNode.nodeName === "SPAN" && oNode.firstChild && oNode.firstChild.nodeName === "P"){
			var oParentNode = oNode.parentNode;
			while(oNode.firstChild){
				oParentNode.insertBefore(oNode.firstChild, oNode);
			}
			oParentNode.removeChild(oNode);
		}
	},
	
	$BEFORE_EVENT_EDITING_AREA_KEYUP : function(oEvent){
		// IE(6) sometimes fires keyup events when it should not and when it happens the keyup event gets fired without a keydown event
		if(!this._bKeyDown){
			return false;
		}
		this._bKeyDown = false;
	},
	
	$ON_EVENT_EDITING_AREA_MOUSEUP : function(oEvent){
		this.oApp.saveSnapShot();
	},

	$BEFORE_PASTE_HTML : function(){
		if(this.oApp.getEditingMode() !== this.sMode){
			this.oApp.exec("CHANGE_EDITING_MODE", [this.sMode]);
		}
	},
	
	/**
	 * @param {String}		sHTML				삽입할 HTML
	 * @param {HuskyRange}	oPSelection			재사용할 Selection 객체
	 * @param {HashTable}	htOption			추가옵션
	 * @param {Boolean}		htOption.bNoUndo	UNDO 히스토리를 저장하지 않을지 여부 
	 * @param {Boolean}		htOption.bBlock		HTML 삽입시 강제로 block 요소 처리할지 여부(true 이면 P태그 안에 삽입될 경우, P태그를 무조건 쪼개고 그 사이에 DIV태그로 감싸서 삽입한다.)
	 */
	$ON_PASTE_HTML : function(sHTML, oPSelection, htOption){
		htOption = htOption || {};
		var oSelection, oNavigator, sTmpBookmark, 
			oStartContainer, aImgChild, elLastImg, elChild, elNextChild;

		if(this.oApp.getEditingMode() !== this.sMode){
			return;
		}
		
		// [SMARTEDITORSUS-2023] 편집영역에 포커스가 없는 상태에서 PASTE_HTML 을 수행하면 
		// <p>태그 바깥쪽으로 삽입되기 때문에 pasteHTML 전에 포커스를 준다. 
		this.focus();
		
		if(!htOption.bNoUndo){
			this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["PASTE HTML"]);
		}
		 
		oNavigator = jindo.$Agent().navigator();
		oSelection = oPSelection || this.oApp.getSelection();

		//[SMARTEDITORSUS-888] 브라우저 별 테스트 후 아래 부분이 불필요하여 제거함
		//	- [SMARTEDITORSUS-387] IE9 표준모드에서 엘리먼트 뒤에 어떠한 엘리먼트도 없는 상태에서 커서가 안들어가는 현상.
		// if(oNavigator.ie && oNavigator.nativeVersion >= 9 && document.documentMode >= 9){
		//		sHTML = sHTML + unescape("%uFEFF");
		// }
		//[SMARTEDITORSUS-2043] IE8의 경우 FEFF 로 인해 한줄 내려가는 현상이 생겨서 아래 부분 제거함 
		//if(oNavigator.ie && oNavigator.nativeVersion == 8 && document.documentMode == 8){
		//	sHTML = sHTML + unescape("%uFEFF");
		//}

		oSelection.pasteHTML(sHTML, htOption.bBlock);
		
		// every browser except for IE may modify the innerHTML when it is inserted
		if(!oNavigator.ie){
			sTmpBookmark = oSelection.placeStringBookmark();
			this.oApp.getWYSIWYGDocument().body.innerHTML = this.oApp.getWYSIWYGDocument().body.innerHTML;
			oSelection.moveToBookmark(sTmpBookmark);
			oSelection.collapseToEnd();
			oSelection.select();
			oSelection.removeStringBookmark(sTmpBookmark);
			// [SMARTEDITORSUS-56] 사진을 연속으로 첨부할 경우 연이어 삽입되지 않는 현상으로 이슈를 발견하게 되었습니다.
			// 그러나 이는 비단 '다수의 사진을 첨부할 경우'에만 발생하는 문제는 아니었고, 
			// 원인 확인 결과 컨텐츠 삽입 후 기존 Bookmark 삭제 시 갱신된 Selection 이 제대로 반영되지 않는 점이 있었습니다.
			// 이에, Selection 을 갱신하는 코드를 추가하였습니다.
			oSelection = this.oApp.getSelection();
			
			//[SMARTEDITORSUS-831] 비IE 계열 브라우저에서 스크롤바가 생기게 문자입력 후 엔터 클릭하지 않은 상태에서 
			//이미지 하나 삽입 시 이미지에 포커싱이 놓이지 않습니다.
			//원인 : parameter로 넘겨 받은 oPSelecion에 변경된 값을 복사해 주지 않아서 발생
			//해결 : parameter로 넘겨 받은 oPSelecion에 변경된 값을 복사해준다
			//       call by reference로 넘겨 받았으므로 직접 객체 안의 인자 값을 바꿔주는 setRange 함수 사용
			if(!!oPSelection){
				oPSelection.setRange(oSelection);
			}
		}else{
			// [SMARTEDITORSUS-428] [IE9.0] IE9에서 포스트 쓰기에 접근하여 맨위에 임의의 글감 첨부 후 엔터를 클릭 시 글감이 사라짐
			// PASTE_HTML 후에 IFRAME 부분이 선택된 상태여서 Enter 시 내용이 제거되어 발생한 문제
			oSelection.collapseToEnd();
			oSelection.select();
			
			this._oIERange = null;
			this._bIERangeReset = false;
		}
		
		// [SMARTEDITORSUS-639] 사진 첨부 후 이미지 뒤의 공백으로 인해 스크롤이 생기는 문제
		if(sHTML.indexOf("<img") > -1){
			oStartContainer = oSelection.startContainer;
				
			if(oStartContainer.nodeType === 1 && oStartContainer.tagName === "P"){
				aImgChild = jindo.$Element(oStartContainer).child(function(v){  
					return (v.$value().nodeType === 1 && v.$value().tagName === "IMG");
				}, 1);
				
				if(aImgChild.length > 0){
					elLastImg = aImgChild[aImgChild.length - 1].$value();
					elChild = elLastImg.nextSibling;
					
					while(elChild){
						elNextChild = elChild.nextSibling;
						
						if (elChild.nodeType === 3 && (elChild.nodeValue === "&nbsp;" || elChild.nodeValue === unescape("%u00A0"))) {
							oStartContainer.removeChild(elChild);
						}
					
						elChild = elNextChild;
					}
				}
			}
		}

		if(!htOption.bNoUndo){
			this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["PASTE HTML"]);
		}
	},

	/**
	 * [SMARTEDITORSUS-344]사진/동영상/지도 연속첨부시 포커싱 개선이슈로 추가되 함수.
	 */
	$ON_FOCUS_N_CURSOR : function (bEndCursor, sId){
		var el, oSelection;
		if(sId && ( el = jindo.$(sId, this.getDocument()) )){
			// ID가 지정된 경우, 무조건 해당 부분으로 커서 이동
			clearTimeout(this._nTimerFocus);	// 연속 삽입될 경우, 미완료 타이머는 취소한다.
			this._nTimerFocus = setTimeout(jindo.$Fn(function(el){
				this._scrollIntoView(el);
				this.oApp.exec("FOCUS");
			}, this).bind(el), 300);
			return;
		}

		oSelection = this.oApp.getSelection();
		if(!oSelection.collapsed){ // select 영역이 있는 경우
			if(bEndCursor){
				oSelection.collapseToEnd();
			} else {
				oSelection.collapseToStart();
			}
			oSelection.select();
		}else if(bEndCursor){ // select 영역이 없는 상태에서 bEndCursor 이면 body 맨 뒤로 이동시킨다.
			this.oApp.exec("FOCUS");
			el = this.getDocument().body;
			oSelection.selectNode(el);
			oSelection.collapseToEnd();
			oSelection.select();
			this._scrollIntoView(el);
		}else{	// select 영역이 없는 상태라면 focus만 준다.
			this.oApp.exec("FOCUS");
		}			
	},
	
	/* 
	 * 엘리먼트의 top, bottom 값을 반환
	 */
	_getElementVerticalPosition : function(el){
	    var nTop = 0,
			elParent = el,
			htPos = {nTop : 0, nBottom : 0};
	    
	    if(!el){
			return htPos;
	    }

		// 테스트코드를 실행하면 IE8 이하에서 offsetParent 접근시 다음과 같이 알 수 없는 exception 이 발생함
		// "SCRIPT16389: 지정되지 않은 오류입니다."
		// TODO: 해결방법이 없어서 일단 try/catch 처리했지만 추후 정확한 이유를 파악할 필요가 있음
	    try{
	    	while(elParent) {
	    		nTop += elParent.offsetTop;
    			elParent = elParent.offsetParent;
	    	}
	    }catch(e){}

	    htPos.nTop = nTop;
	    htPos.nBottom = nTop + jindo.$Element(el).height();
	    
	    return htPos;
	},
	
	/* 
	 * Window에서 현재 보여지는 영역의 top, bottom 값을 반환
	 */
	_getVisibleVerticalPosition : function(){
		var oWindow, oDocument, nVisibleHeight,
			htPos = {nTop : 0, nBottom : 0};
		
		oWindow = this.getWindow();
		oDocument = this.getDocument();
		nVisibleHeight = oWindow.innerHeight ? oWindow.innerHeight : oDocument.documentElement.clientHeight || oDocument.body.clientHeight;
		
		htPos.nTop = oWindow.pageYOffset || oDocument.documentElement.scrollTop;
		htPos.nBottom = htPos.nTop + nVisibleHeight;
		
		return htPos;
	},
	
	/* 
	 * 엘리먼트가 WYSIWYG Window의 Visible 부분에서 완전히 보이는 상태인지 확인 (일부만 보이면 false)
	 */
	_isElementVisible : function(htElementPos, htVisiblePos){					
		return (htElementPos.nTop >= htVisiblePos.nTop && htElementPos.nBottom <= htVisiblePos.nBottom);
	},
	
	/* 
	 * [SMARTEDITORSUS-824] [SMARTEDITORSUS-828] 자동 스크롤 처리
	 */
	_scrollIntoView : function(el){
		var htElementPos = this._getElementVerticalPosition(el),
			htVisiblePos = this._getVisibleVerticalPosition(),
			nScroll = 0;
				
		if(this._isElementVisible(htElementPos, htVisiblePos)){
			return;
		}
				
		if((nScroll = htElementPos.nBottom - htVisiblePos.nBottom) > 0){
			this.getWindow().scrollTo(0, htVisiblePos.nTop + nScroll);	// Scroll Down
			return;
		}
		
		this.getWindow().scrollTo(0, htElementPos.nTop);	// Scroll Up
	},
	
	$BEFORE_MSG_EDITING_AREA_RESIZE_STARTED  : function(){
		// FF에서 Height조정 시에 본문의 _fitElementInEditingArea()함수 부분에서 selection이 깨지는 현상을 잡기 위해서
		// StringBookmark를 사용해서 위치를 저장해둠. (step1)
		if(!jindo.$Agent().navigator().ie){
			var oSelection = null;
			oSelection = this.oApp.getSelection();
			this.sBM = oSelection.placeStringBookmark();
		}
	},
	
	$AFTER_MSG_EDITING_AREA_RESIZE_ENDED : function(FnMouseDown, FnMouseMove, FnMouseUp){
		if(this.oApp.getEditingMode() !== this.sMode){
			return;
		}
		
		// bts.nhncorp.com/nhnbts/browse/COM-1042
		// $BEFORE_MSG_EDITING_AREA_RESIZE_STARTED에서 저장한 StringBookmark를 셋팅해주고 삭제함.(step2)
		if(!jindo.$Agent().navigator().ie){
			var oSelection = this.oApp.getEmptySelection();
			oSelection.moveToBookmark(this.sBM);
			oSelection.select();
			oSelection.removeStringBookmark(this.sBM);	
		}
	},

	$ON_CLEAR_IE_BACKUP_SELECTION : function(){
		this._oIERange = null;
	},
	
	$ON_RESTORE_IE_SELECTION : function(){
		if(this._oIERange){
			// changing the visibility of the iframe can cause an exception
			try{
				this._oIERange.select();

				this._oPrevIERange = this._oIERange;
				this._oIERange = null;
			}catch(e){}
		}
	},
	
	/**
	  * EVENT_EDITING_AREA_PASTE 의 ON 메시지 핸들러
	  *		위지윅 모드에서 에디터 본문의 paste 이벤트에 대한 메시지를 처리한다.
	  *		paste 시에 내용이 붙여진 본문의 내용을 바로 가져올 수 없어 delay 를 준다.
	  */	
	$ON_EVENT_EDITING_AREA_PASTE : function(oEvent){
		this.oApp.delayedExec('EVENT_EDITING_AREA_PASTE_DELAY', [oEvent], 0);
	},

	$ON_EVENT_EDITING_AREA_PASTE_DELAY : function(weEvent) {	
		this._replaceBlankToNbsp(weEvent.element);
	},
	
	// [SMARTEDITORSUS-855] IE에서 특정 블로그 글을 복사하여 붙여넣기 했을 때 개행이 제거되는 문제
	_replaceBlankToNbsp : function(el){
		var oNavigator = this.oApp.oNavigator;
		
		if(!oNavigator.ie){
			return;
		}
		
		if(oNavigator.nativeVersion !== 9 || document.documentMode !== 7) { // IE9 호환모드에서만 발생
			return;
		}

		if(el.nodeType !== 1){
			return;
		}
		
		if(el.tagName === "BR"){
			return;
		}
		
		var aEl = jindo.$$("p:empty()", this.oApp.getWYSIWYGDocument().body, { oneTimeOffCache:true });
		
		jindo.$A(aEl).forEach(function(value, index, array) {
			value.innerHTML = "&nbsp;";
		});
	},
	
	_pageUp : function(we){
		var nEditorHeight = this._getEditorHeight(),
			htPos = jindo.$Document(this.oApp.getWYSIWYGDocument()).scrollPosition(),
			nNewTop;

		if(htPos.top <= nEditorHeight){
			nNewTop = 0;
		}else{
			nNewTop = htPos.top - nEditorHeight;
		}
		this.oApp.getWYSIWYGWindow().scrollTo(0, nNewTop);
		we.stop();
	},
	
	_pageDown : function(we){
		var nEditorHeight = this._getEditorHeight(),
			htPos = jindo.$Document(this.oApp.getWYSIWYGDocument()).scrollPosition(),
			nBodyHeight = this._getBodyHeight(),
			nNewTop;

		if(htPos.top+nEditorHeight >= nBodyHeight){
			nNewTop = nBodyHeight - nEditorHeight;
		}else{
			nNewTop = htPos.top + nEditorHeight;
		}
		this.oApp.getWYSIWYGWindow().scrollTo(0, nNewTop);
		we.stop();
	},
	
	_getEditorHeight : function(){
		return this.oApp.elEditingAreaContainer.offsetHeight - this.nTopBottomMargin;
	},
	
	_getBodyHeight : function(){
		return parseInt(this.getDocument().body.scrollHeight, 10);
	},
	
	initIframe : function(){
		try {
			if (!this.iframe.contentWindow.document || !this.iframe.contentWindow.document.body || this.iframe.contentWindow.document.location.href === 'about:blank'){
				throw new Error('Access denied');
			}

			var sCSSBaseURI = (!!nhn.husky.SE2M_Configuration.SE2M_CSSLoader && nhn.husky.SE2M_Configuration.SE2M_CSSLoader.sCSSBaseURI) ? 
					nhn.husky.SE2M_Configuration.SE2M_CSSLoader.sCSSBaseURI : "";

			if(!!nhn.husky.SE2M_Configuration.SE_EditingAreaManager.sCSSBaseURI){
				sCSSBaseURI = nhn.husky.SE2M_Configuration.SE_EditingAreaManager.sCSSBaseURI;
			}

			// add link tag
			if (sCSSBaseURI){
				var sCssUrl = sCSSBaseURI;
				var sLocale = this.oApp && this.oApp.htOptions.I18N_LOCALE;
				if(sLocale){
					sCssUrl += "/" + sLocale;
				}
				sCssUrl += "/smart_editor2_in.css";

				var doc = this.getDocument();
				var headNode = doc.getElementsByTagName("head")[0];
				var linkNode = doc.createElement('link');
				linkNode.type = 'text/css';
				linkNode.rel = 'stylesheet';
				linkNode.href = sCssUrl;
				linkNode.onload = jindo.$Fn(function(){
					// [SMARTEDITORSUS-1853] IE의 경우 css가 로드되어 반영되는데 시간이 걸려서 브라우저 기본폰트가 세팅되는 경우가 있음
					// 때문에 css가 로드되면 SE_WYSIWYGStylerGetter 플러그인의 스타일정보를 RESET 해준다.
					// 주의: 크롬의 경우, css 로딩이 더 먼저 발생해서 SE_WYSIWYGStylerGetter 플러그인에서 오류가 발생할 수 있기 때문에 RESET_STYLE_STATUS 메시지 호출이 가능한 상태인지 체크함
					if(this.oApp && this.oApp.getEditingMode && this.oApp.getEditingMode() === this.sMode){
						this.oApp.exec("RESET_STYLE_STATUS");
					}
					/*
					 * [SMARTEDITORSUS-2298]
					 * IE에서 웹폰트용 css가 import될때 이벤트핸들러가 실행되어 툴바에 선택된 폰트가 리셋되는 문제가 있음
					 * 때문에 한번 실행되고 난 후에는 연결된 이벤트핸들러를 클리어처리함
					 */
					linkNode.onload = null;
				}, this).bind();
				headNode.appendChild(linkNode);
			}
			
			this._enableWYSIWYG();

			this.status = nhn.husky.PLUGIN_STATUS.READY;
		} catch(e) {
			if(this._nIFrameReadyCount-- > 0){
				setTimeout(jindo.$Fn(this.initIframe, this).bind(), 100);
			}else{
				throw("iframe for WYSIWYG editing mode can't be initialized. Please check if the iframe document exists and is also accessable(cross-domain issues). ");
			}
		}
	},

	getIR : function(){
		var sContent = this.iframe.contentWindow.document.body.innerHTML,
			sIR;

		if(this.oApp.applyConverter){
			sIR = this.oApp.applyConverter(this.sMode+"_TO_IR", sContent, this.oApp.getWYSIWYGDocument());
		}else{
			sIR = sContent;
		}

		return sIR;
	},

	setIR : function(sIR){
		// [SMARTEDITORSUS-875] HTML 모드의 beautify에서 추가된 공백을 다시 제거
		//sIR = sIR.replace(/(>)([\n\r\t\s]*)([^<]?)/g, "$1$3").replace(/([\n\r\t\s]*)(<)/g, "$2")
		// --[SMARTEDITORSUS-875]
		
		var sContent, 
			oNavigator = this.oApp.oNavigator, 
			bUnderIE11 = oNavigator.ie && document.documentMode < 11, // IE11미만
			sCursorHolder = bUnderIE11 ? "" : "<br>";

		if(this.oApp.applyConverter){
			sContent = this.oApp.applyConverter("IR_TO_"+this.sMode, sIR, this.oApp.getWYSIWYGDocument());
		}else{
			sContent = sIR;
		}

		// [SMARTEDITORSUS-1279] [IE9/10] pre 태그 아래에 \n이 포함되면 개행이 되지 않는 이슈
		/*if(oNavigator.ie && oNavigator.nativeVersion >= 9 && document.documentMode >= 9){
			// [SMARTEDITORSUS-704] \r\n이 있는 경우 IE9 표준모드에서 정렬 시 브라우저가 <p>를 추가하는 문제
			sContent = sContent.replace(/[\r\n]/g,"");
		}*/

		// 편집내용이 없는 경우 커서홀더로 대체
		if(sContent.replace(/[\r\n\t\s]*/,"") === ""){
			if(this.oApp.sLineBreaker !== "BR"){
				sCursorHolder = "<p>" + sCursorHolder + "</p>";
			}
			sContent = sCursorHolder;
		}
		this.iframe.contentWindow.document.body.innerHTML = sContent;

		// [COM-1142] IE의 경우 <p>&nbsp;</p> 를 <p></p> 로 변환
		// [SMARTEDITORSUS-1623] IE11은 <p></p>로 변환하면 라인이 붙어버리기 때문에 IE10만 적용하도록 수정
		if(bUnderIE11 && this.oApp.getEditingMode() === this.sMode){
			var pNodes = this.oApp.getWYSIWYGDocument().body.getElementsByTagName("P");

			for(var i=0, nMax = pNodes.length; i < nMax; i++){
				if(pNodes[i].childNodes.length === 1 && pNodes[i].innerHTML === "&nbsp;"){
					pNodes[i].innerHTML = '';
				}
			}
		}
	},

	getRawContents : function(){
		return this.iframe.contentWindow.document.body.innerHTML;
	},

	getRawHTMLContents : function(){
		return this.getRawContents();
	},

	setRawHTMLContents : function(sContents){
		this.iframe.contentWindow.document.body.innerHTML = sContents;
	},

	getWindow : function(){
		return this.iframe.contentWindow;
	},

	getDocument : function(){
		return this.iframe.contentWindow.document;
	},
	
	focus : function(){
		//this.getWindow().focus();
		this.getDocument().body.focus();
		this.oApp.exec("RESTORE_IE_SELECTION");
	},
	
	_recordUndo : function(oKeyInfo){
		/**
		 * 229: Korean/Eng
		 * 16: shift
		 * 33,34: page up/down
		 * 35,36: end/home
		 * 37,38,39,40: left, up, right, down
		 * 32: space
		 * 46: delete
		 * 8: bksp
		 */
		if(oKeyInfo.keyCode >= 33 && oKeyInfo.keyCode <= 40){	// record snapshot
			this.oApp.saveSnapShot();
			return;
		}

		if(oKeyInfo.alt || oKeyInfo.ctrl || oKeyInfo.keyCode === 16){
			return;
		}

		if(this.oApp.getLastKey() === oKeyInfo.keyCode){
			return;
		}
		
		this.oApp.setLastKey(oKeyInfo.keyCode);

		// && oKeyInfo.keyCode != 32		// 속도 문제로 인하여 Space 는 제외함
		if(!oKeyInfo.enter && oKeyInfo.keyCode !== 46 && oKeyInfo.keyCode !== 8){
			return;
		}
	
		this.oApp.exec("RECORD_UNDO_ACTION", ["KEYPRESS(" + oKeyInfo.keyCode + ")", {bMustBlockContainer:true}]);
	},
	
	_enableWYSIWYG : function(){
		//if (this.iframe.contentWindow.document.body.hasOwnProperty("contentEditable")){
		if (this.iframe.contentWindow.document.body.contentEditable !== null) {
			this.iframe.contentWindow.document.body.contentEditable = true;
		} else {
			this.iframe.contentWindow.document.designMode = "on";
		}
				
		this.bWYSIWYGEnabled = true;		
		if(jindo.$Agent().navigator().firefox){
			setTimeout(jindo.$Fn(function(){
				//enableInlineTableEditing : Enables or disables the table row and column insertion and deletion controls. 
				this.iframe.contentWindow.document.execCommand('enableInlineTableEditing', false, false);
			}, this).bind(), 0);
		}
	},
	
	_disableWYSIWYG : function(){
		//if (this.iframe.contentWindow.document.body.hasOwnProperty("contentEditable")){
		if (this.iframe.contentWindow.document.body.contentEditable !== null){
			this.iframe.contentWindow.document.body.contentEditable = false;
		} else {
			this.iframe.contentWindow.document.designMode = "off";
		}
		this.bWYSIWYGEnabled = false;
	},
	
	isWYSIWYGEnabled : function(){
		return this.bWYSIWYGEnabled;
	}
});
//}