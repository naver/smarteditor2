/*[
 * REFRESH_WYSIWYG
 *
 * (FF전용) WYSIWYG 모드를 비활성화 후 다시 활성화 시킨다. FF에서 WYSIWYG 모드가 일부 비활성화 되는 문제용
 * 주의] REFRESH_WYSIWYG후에는 본문의 selection이 깨져서 커서 제일 앞으로 가는 현상이 있음. (stringbookmark로 처리해야함.)
 *  
 * none
 *
---------------------------------------------------------------------------]*/
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
	status : nhn.husky.PLUGIN_STATUS["NOT_READY"],

	sMode : "WYSIWYG",
	iframe : null,
	doc : null,
	bStopCheckingBodyHeight : false, 
	
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

		// IE8에서는 이미지 뒤로 커서가 가지 않는 등의 여러 오동작이 발생 해서 IE8에서는 IE7모드로 작동하도록 설정 되어 있는 빈 페이지를 이용함
		// <meta http-equiv="X-UA-Compatible" content="IE=EmulateIE7">
		this.sBlankPageURL = "smart_editor2_inputarea.html";
		this.sBlankPageURL_IE8 = "smart_editor2_inputarea_ie8.html";
		
		this.htOptions = nhn.husky.SE2M_Configuration.SE_EditingAreaManager;	
		if (this.htOptions) {
			if (this.htOptions.sBlankPageURL) {
				this.sBlankPageURL = this.htOptions.sBlankPageURL;
			}
			
			if (this.htOptions.sBlankPageURL_IE8) {
				this.sBlankPageURL_IE8 = this.htOptions.sBlankPageURL_IE8;
			}
		}

		this.sIFrameSrc = this.sBlankPageURL;
		if(oAgent.ie && oAgent.nativeVersion >= 8) {
			this.sIFrameSrc = this.sBlankPageURL_IE8;
		}

		this.iframe.src = this.sIFrameSrc;
		this.initIframe();		
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
			this.oApp.exec('ENABLE_WYSIWYG_RULER', []);
		}
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

		if(jindo.$Agent().navigator().ie){
			jindo.$Fn(
				function(weEvent){
					if(this.iframe.contentWindow.document.selection.type.toLowerCase() == 'control' && weEvent.key().keyCode == 8){
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

			jindo.$Fn(this._onIEBeforeDeactivate, this).attach(this.iframe.contentWindow.document.body, "beforedeactivate");
			
			jindo.$Fn(
				function(weEvent){
					this._bIERangeReset = false;
				}, this
			).attach(this.iframe.contentWindow.document.body, "mouseup");
		}else{
			//this.getDocument().execCommand('useCSS', false, false);
			//this.getDocument().execCommand('styleWithCSS', false, false);
			//this.document.execCommand("insertBrOnReturn", false, false);
		}

		// DTD가 quirks가 아닐 경우 body 높이 100%가 제대로 동작하지 않아서 타임아웃을 돌며 높이를 수동으로 계속 할당 해 줌 
		// body 높이가 제대로 설정 되지 않을 경우, 보기에는 이상없어 보이나 마우스로 텍스트 선택이 잘 안된다든지 하는 이슈가 있음
		this.fnSetBodyHeight = jindo.$Fn(this._setBodyHeight, this).bind();
		this.fnSetBodyHeight();
	},
	
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
		
		welBody.css("height", "0px");
		// [SMARTEDITORSUS-257] IE9, 크롬에서 내용을 삭제해도 스크롤이 남아있는 문제 처리
		// body 에 내용이 없어져도 scrollHeight 가 줄어들지 않아 height 를 강제로 0 으로 설정
		
		nScrollHeight = parseInt(elBody.scrollHeight, 10);
		nNewBodyHeight = (nScrollHeight > nContainerOffset ? nScrollHeight - nMarginTopBottom : nMinBodyHeight);
		// nMarginTopBottom 을 빼지 않으면 스크롤이 계속 늘어나는 경우가 있음 (참고 [BLOGSUS-17421])

		welBody.css("height", nNewBodyHeight + "px");
		
		setTimeout(this.fnSetBodyHeight, 500);
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
		var tmpSelection = this.getDocument().selection;

		if(tmpSelection.type === "Control"){
			var oRange = tmpSelection.createRange();
			var elNode = oRange.item(0);
			if(elNode && elNode.tagName === "IFRAME"){
				this._oIERange = null;
			}
		}
	},
	
	_onIEBeforeDeactivate : function(wev){
		this.oApp.delayedExec("IE_CHECK_EXCEPTION_FOR_SELECTION_PRESERVATION", [], 0);

		if(this._oIERange){
			return;
		}

		// without this, cursor won't make it inside a table.
		// mousedown(_oIERange gets reset) -> beforedeactivate(gets fired for table) -> RESTORE_IE_SELECTION
		if(this._bIERangeReset){
			return;
		}

		var tmpSelection = this.getDocument().selection;
		var tmpRange = tmpSelection.createRange();
		// Control range does not have parentElement
		if(tmpRange.parentElement && tmpRange.parentElement() && tmpRange.parentElement().tagName == "INPUT"){
			this._oIERange = this._oPrevIERange;
		}else{
			this._oIERange = tmpRange;
		}
	},
	
	$ON_CHANGE_EDITING_MODE : function(sMode, bNoFocus){
		if(sMode == this.sMode){
			this.iframe.style.display = "block";
			
			this.oApp.exec("REFRESH_WYSIWYG", []);
			this.oApp.exec("SET_EDITING_WINDOW", [this.getWindow()]);
			this.oApp.exec("START_CHECKING_BODY_HEIGHT");
		}else{
			this.iframe.style.display = "none";
			this.oApp.exec("STOP_CHECKING_BODY_HEIGHT");
		}
	},

	$AFTER_CHANGE_EDITING_MODE : function(sMode, bNoFocus){
		this._oIERange = null;
	},

	$ON_REFRESH_WYSIWYG : function(){
		if(!jindo.$Agent().navigator().firefox){
			return;
		}

		this._disableWYSIWYG();
		this._enableWYSIWYG();
	},
	
	$ON_ENABLE_WYSIWYG : function(){
		this._enableWYSIWYG();
	},

	$ON_DISABLE_WYSIWYG : function(){
		this._disableWYSIWYG();
	},
	
	$ON_IE_HIDE_CURSOR : function(){
		if(!this.oApp.oNavigator.ie){
			return;
		}

		this._onIEBeforeDeactivate();

		// De-select the default selection.
		this.oApp.getEmptySelection().oBrowserSelection.selectNone();
	},
	
	$AFTER_SHOW_ACTIVE_LAYER : function(){
		this.oApp.exec("IE_HIDE_CURSOR",[]);
		this.bActiveLayerShown = true;
	},
	
	$BEFORE_EVENT_EDITING_AREA_KEYDOWN : function(oEvent){
		this._bKeyDown = true;
	},
	
	$ON_EVENT_EDITING_AREA_KEYDOWN : function(oEvent){
		if(this.oApp.getEditingMode() != this.sMode){
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
					this._backspaceTable(oEvent);
					break;
				default:
			}
		}else if(this.oApp.oNavigator.firefox){
			// [SMARTEDITORSUS-151] FF 에서 표가 삭제되지 않는 문제
			if(oKeyInfo.keyCode === 8){				// backspace
				this._backspaceTable(oEvent);
			}
		}
		
		this._recordUndo(oKeyInfo);	// 첫번째 Delete 키 입력 전의 상태가 저장되도록 KEYDOWN 시점에 저장
	},
	
	_backspaceTable : function(weEvent){
		var oSelection = this.oApp.getSelection(),
			preNode = null;

		if(!oSelection.collapsed){
			return;
		}
		
		preNode = oSelection.getNodeAroundRange(true, false);

		if(preNode && preNode.nodeType === 3 && /^[\n]*$/.test(preNode.nodeValue)){
			preNode = preNode.previousSibling;
		}

		if(!!preNode && preNode.nodeType === 1 && preNode.tagName === "TABLE"){	
			jindo.$Element(preNode).leave();
			weEvent.stop(jindo.$Event.CANCEL_ALL);
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
		if(this.oApp.getEditingMode() != this.sMode){
			this.oApp.exec("CHANGE_EDITING_MODE", [this.sMode]);
		}
	},
	
	$ON_PASTE_HTML : function(sHTML, oPSelection, bNoUndo){
		if(this.oApp.getEditingMode() != this.sMode){
			return;
		}
		
		if(!bNoUndo){
			this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["PASTE HTML"]);
		}
			
		var oSelection, oNavigator;
		 
		oNavigator = jindo.$Agent().navigator();
		oSelection = oPSelection || this.oApp.getSelection();

		//[SMARTEDITORSUS-387]IE9 표준모드에서 엘리먼트 뒤에 어떠한 엘리먼트도 없는 상태에서 커서가 안들어가는 현상.
		if(oNavigator.ie && oNavigator.nativeVersion >= 9 && document.documentMode >= 9){
		 	sHTML = sHTML + unescape("%uFEFF");
		}
		oSelection.pasteHTML(sHTML);
		
		// every browser except for IE may modify the innerHTML when it is inserted
		if(!oNavigator.ie){
			var sTmpBookmark = oSelection.placeStringBookmark();
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
		}else{
			// [SMARTEDITORSUS-428] [IE9.0] IE9에서 포스트 쓰기에 접근하여 맨위에 임의의 글감 첨부 후 엔터를 클릭 시 글감이 사라짐
			// PASTE_HTML 후에 IFRAME 부분이 선택된 상태여서 Enter 시 내용이 제거되어 발생한 문제
			oSelection.collapseToEnd();
			oSelection.select();
			
			this._bIERangeReset = false;
		}
		
		// [SMARTEDITORSUS-639] 사진 첨부 후 이미지 뒤의 공백으로 인해 스크롤이 생기는 문제
		if(sHTML.indexOf("<img") > -1){
			var oStartContainer = oSelection.startContainer,
				aImgChild, elLastImg, elChild, elNextChild;
				
			if(oStartContainer.nodeType === 1 && oStartContainer.tagName == "P"){
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

		if(!bNoUndo){
			this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["PASTE HTML"]);
		}
	},

	/**
	 * [SMARTEDITORSUS-344]사진/동영상/지도 연속첨부시 포커싱 개선이슈로 추가되 함수.
	 */
	$ON_FOCUS_N_CURSOR : function (bEndCursor, sId){
		//지도 추가 후 포커싱을 주기 위해서
		bEndCursor = bEndCursor || true;		
		var oSelection = this.oApp.getSelection();	
		if(jindo.$Agent().navigator().ie && !oSelection.collapsed){
			if(bEndCursor){
				oSelection.collapseToEnd();
			} else {
				oSelection.collapseToStart();
			}
			oSelection.select();
		}else if(!!oSelection.collapsed && !sId) {
			this.oApp.exec("FOCUS");
		}else if( !!sId ){
			setTimeout(jindo.$Fn(function(){
				//위치 이동
				var el = this.oApp.getWYSIWYGDocument().getElementById(sId);  
				if( el !== null ){
					el.scrollIntoView(false);
				}
				//포커스
				this.getDocument().body.focus();
			}, this).bind(), 300);	
		}
		
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
		if(this.oApp.getEditingMode() != this.sMode){
			return;
		}
		
		this.oApp.exec("REFRESH_WYSIWYG", []);
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

	_pageUp : function(we){
		var nEditorHeight = this._getEditorHeight();
		var htPos = jindo.$Document(this.oApp.getWYSIWYGDocument()).scrollPosition();
		var nNewTop;
		if(htPos.top <= nEditorHeight){
			nNewTop = 0;
		}else{
			nNewTop = htPos.top - nEditorHeight;
		}
		this.oApp.getWYSIWYGWindow().scrollTo(0, nNewTop);
		we.stop();
	},
	
	_pageDown : function(we){
		var nEditorHeight = this._getEditorHeight();
		var htPos = jindo.$Document(this.oApp.getWYSIWYGDocument()).scrollPosition();
		var nBodyHeight = this._getBodyHeight();
		var nNewTop;
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
	
	tidyNbsp : function(){
		if(!this.oApp.oNavigator.ie) {
			return;
		}	
		
		var pNodes = this.oApp.getWYSIWYGDocument().body.getElementsByTagName("P");
		for(var i=0; i<pNodes.length; i++){
			if(pNodes[i].childNodes.length == 1 && pNodes[i].innerHTML == "&nbsp;"){
				pNodes[i].innerHTML = '';
			}
		}
	},

	initIframe : function(){
		try {
			if (!this.iframe.contentWindow.document || !this.iframe.contentWindow.document.body || this.iframe.contentWindow.document.location.href == 'about:blank'){
				throw new Error('Access denied');
			}

			this._enableWYSIWYG();

			this.status = nhn.husky.PLUGIN_STATUS["READY"];
		} catch(e) {
			if(this._nIFrameReadyCount-- > 0){
				setTimeout(jindo.$Fn(this.initIframe, this).bind(), 100);
			}else{
				throw("iframe for WYSIWYG editing mode can't be initialized. Please check if the iframe document exists and is also accessable(cross-domain issues). ");
			}
		}
	},

	getIR : function(){
		var sContent = this.iframe.contentWindow.document.body.innerHTML;
		var sIR;

		if(this.oApp.applyConverter){
			sIR = this.oApp.applyConverter(this.sMode+"_TO_IR", sContent, this.oApp.getWYSIWYGDocument());
		}else{
			sIR = sContent;
		}

		return sIR;
	},

	setIR : function(sIR){		
		var sContent, oNavigator = jindo.$Agent().navigator();
		
		if(this.oApp.applyConverter){
			sContent = this.oApp.applyConverter("IR_TO_"+this.sMode, sIR, this.oApp.getWYSIWYGDocument());
		}else{
			sContent = sIR;
		}
		
		if(oNavigator.ie && oNavigator.nativeVersion >= 9 && document.documentMode >= 9){
			// [SMARTEDITORSUS-704] \r\n이 있는 경우 IE9 표준모드에서 정렬 시 브라우저가 <p>를 추가하는 문제
			sContent = sContent.replace(/[\r\n]/g,"");
		}

		this.iframe.contentWindow.document.body.innerHTML = sContent;
		
		if(!oNavigator.ie){
			if((this.iframe.contentWindow.document.body.innerHTML).replace(/[\r\n\t\s]*/,"") == ""){
				this.iframe.contentWindow.document.body.innerHTML = "<br>";
			}
		}else{
			if(this.oApp.getEditingMode() == this.sMode){
				this.tidyNbsp();
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
		this.oApp.exec("RESTORE_IE_SELECTION", []);
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

		if(oKeyInfo.alt || oKeyInfo.ctrl || oKeyInfo.keyCode == 16){
			return;
		}

		if(this.oApp.getLastKey() == oKeyInfo.keyCode){
			return;
		}
		
		this.oApp.setLastKey(oKeyInfo.keyCode);

		// && oKeyInfo.keyCode != 32 	// 속도 문제로 인하여 Space 는 제외함
		if(!oKeyInfo.enter && oKeyInfo.keyCode != 46 && oKeyInfo.keyCode != 8){
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