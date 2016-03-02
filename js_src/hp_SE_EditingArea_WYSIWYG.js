/*[
 * REFRESH_WYSIWYG
 *
 * (FF전용) WYSIWYG 모드를 비활성화 후 다시 활성화 시킨다. FF에서 WYSIWYG 모드가 일부 비활성화 되는 문제용
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
nhn.husky.SE_EditingArea_WYSIWYG = $Class({
	name : "SE_EditingArea_WYSIWYG",
	status : nhn.husky.PLUGIN_STATUS["NOT_READY"],

	sMode : "WYSIWYG",
	iframe : null,
	doc : null,

	iLastUndoRecorded : 0,
	iMinUndoInterval : 3000,
	
	_nIFrameReadyCount : 50,
	
	$init : function(iframe){
		this.iframe = $(iframe);

		this.initIframe();
		
		this.elEditingArea = iframe;
	},

	$BEFORE_MSG_APP_READY : function(){
		this.oEditingArea = this.iframe.contentWindow.document;
		this.oApp.exec("REGISTER_EDITING_AREA", [this]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getWYSIWYGWindow", $Fn(this.getWindow, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getWYSIWYGDocument", $Fn(this.getDocument, this).bind()]);
	},

	$ON_MSG_APP_READY : function(){
		// uncomment this line if you wish to use the IE-style cursor in FF
		// this.getDocument().body.style.cursor = "text";

		if($Agent().navigator().ie){
			$Fn(
				function(weEvent){
					if(this.iframe.contentWindow.document.selection.type.toLowerCase() == 'control' && weEvent.key().keyCode == 8)  {
						this.oApp.exec("EXECCOMMAND", ['delete', false, false]);
						weEvent.stop();
					}
				}, this
			).attach(this.iframe.contentWindow.document, "keydown");
			$Fn(
				function(weEvent){
					this._oIERange = null;
					this._bIERangeReset = true;
				}, this
			).attach(this.iframe.contentWindow.document.body, "mousedown");
			$Fn(
				function(weEvent){
					// without this, cursor won't make it inside a table.
					// mousedown(_oIERange gets reset) -> beforedeactivate(gets fired for table) -> RESTORE_IE_SELECTION
					if(this._bIERangeReset) return;

					var tmpRange = this.getDocument().selection.createRange(0);
					// Control range does not have parentElement
					if(tmpRange.parentElement && tmpRange.parentElement() && tmpRange.parentElement().tagName == "INPUT"){
						this._oIERange = this._oPrevIERange;
					}else{
						this._oIERange = tmpRange;
					}
				}, this
			).attach(this.iframe.contentWindow.document.body, "beforedeactivate");
			$Fn(
				function(weEvent){
					this._bIERangeReset = false;
				}, this
			).attach(this.iframe.contentWindow.document.body, "mouseup");
		}
	},
	
	$ON_CHANGE_EDITING_MODE : function(sMode, bNoFocus){
		if(sMode == this.sMode){
			this.iframe.style.display = "block";

			this.oApp.exec("REFRESH_WYSIWYG", []);
			this.oApp.exec("SET_EDITING_WINDOW", [this.getWindow()]);
		}else{
			this.iframe.style.display = "none";
		}
	},

	$AFTER_CHANGE_EDITING_MODE : function(sMode, bNoFocus){
		if(sMode == this.sMode){
			var oSelection = this.oApp.getSelection();
			oSelection.selectNode(this.getDocument().body);
			oSelection.collapseToStart();
			oSelection.select();
		}
		
		this._oIERange = null;
	},

	$ON_REFRESH_WYSIWYG : function(){
		if(!$Agent().navigator().firefox) return;

		this._disableWYSIWYG();
		this._enableWYSIWYG();
	},
	
	$ON_ENABLE_WYSIWYG : function(){
		this._enableWYSIWYG();
	},

	$ON_DISABLE_WYSIWYG : function(){
		this._disableWYSIWYG();
	},
	
	$ON_EVENT_EDITING_AREA_KEYUP : function(oEvent){
		var oKeyInfo = oEvent.key();

		// 33, 34: page up/down, 35,36: end/home, 37,38,39,40: left, up, right, down
		if(oKeyInfo.keyCode == 229 || oKeyInfo.enter || oKeyInfo.alt || oKeyInfo.ctrl || (oKeyInfo.keyCode >= 33 && oKeyInfo.keyCode <= 40) || oKeyInfo.keyCode == 16) return;
		this._recordUndo(oKeyInfo)
	},
	
	$ON_PASTE_HTML : function(sHTML, oPSelection){
		if(this.oApp.getEditingMode() != this.sMode) return;

		var oSelection = oPSelection || this.oApp.getSelection();
		oSelection.pasteHTML(sHTML);
		
		// every browser except for IE may modify the innerHTML when it is inserted
		if(!$Agent().navigator().ie){
			var sTmpBookmark = oSelection.placeStringBookmark();
			this.oApp.getWYSIWYGDocument().body.innerHTML = this.oApp.getWYSIWYGDocument().body.innerHTML;
			oSelection.moveToBookmark(sTmpBookmark);
			oSelection.collapseToEnd();
			oSelection.select();
			oSelection.removeStringBookmark(sTmpBookmark);
		}

		this.oApp.exec("RECORD_UNDO_ACTION", ["INSERT HTML"]);
	},
	
	$AFTER_MSG_EDITING_AREA_RESIZE_ENDED : function(FnMouseDown, FnMouseMove, FnMouseUp){
		this.oApp.exec("REFRESH_WYSIWYG", []);
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
	
	initIframe : function(){
		try {
			if (this.iframe.contentWindow.document == null || this.iframe.contentWindow.document.location.href == 'about:blank'){
				throw new Error('Access denied');
			}

			this._enableWYSIWYG();

			this.status = nhn.husky.PLUGIN_STATUS["READY"];
		} catch(e) {
			if(this._nIFrameReadyCount-- > 0){
				setTimeout($Fn(this.initIframe, this).bind(), 100);
			}else{
				throw("iframe for WYSIWYG editing mode can't be initialized. Please check if the iframe document exists and is also accessable(cross-domain issues). ");
			}
		}
	},

	getIR : function(){
		var sContent = this.iframe.contentWindow.document.body.innerHTML;
		var sIR;

		if(this.oApp.applyConverter)
			sIR = this.oApp.applyConverter(this.sMode+"_TO_IR", sContent);
		else
			sIR = sContent;

		return sIR;
	},

	setIR : function(sIR){
		var sContent;
		if(this.oApp.applyConverter)
			sContent = this.oApp.applyConverter("IR_TO_"+this.sMode, sIR);
		else
			sContent = sIR;

		this.iframe.contentWindow.document.body.innerHTML = sContent;
		
		if($Agent().navigator().firefox){
			if(this.iframe.contentWindow.document.body.innerHTML == "") this.iframe.contentWindow.document.body.innerHTML = "<br>";
		}
	},

	getWindow : function(){
		return this.iframe.contentWindow;
	},

	getDocument : function(){
		return this.iframe.contentWindow.document;
	},
	
	focus : function(){
		this.getWindow().focus();
		this.oApp.exec("RESTORE_IE_SELECTION", []);
	},
	
	_recordUndo : function(oKeyInfo){
		var curTime = new Date();
		if(curTime-this.iLastUndoRecorded < this.iMinUndoInterval) return;
		this.oApp.exec("RECORD_UNDO_ACTION", ["KEYPRESS"]);

		this.iLastUndoRecorded = new Date();

		this.prevKeyCode = oKeyInfo.keyCode;
	},
	
	_enableWYSIWYG : function(){
		if ($Agent().navigator().ie){
			this.iframe.contentWindow.document.body.contentEditable = true;
		} else {
			this.iframe.contentWindow.document.designMode = "on";
		}
	},
	
	_disableWYSIWYG : function(){
		if ($Agent().navigator().ie){
			this.iframe.contentWindow.document.body.contentEditable = false;
		} else {
			this.iframe.contentWindow.document.designMode = "off";
		}
	}
});
//}