/*[
 * EXECCOMMAND
 *
 * 브라우저의 execCommand를 실행하는 플러그인. 실행 전후에 UNDO 히스토리를 저장한다.
 *
 * sCommand string execCommand에 넘길 파라미터
 * bUserInterface bool execCommand에 넘길 파라미터
 * vValue string execCommand에 넘길 파라미터
 *
---------------------------------------------------------------------------]*/
/**
 * @pluginDesc 브라우저의 execCommand를 실행하는 플러그인
 */
nhn.husky.SE_ExecCommand = $Class({
	name : "SE_ExecCommand",
	oEditingArea : null,

	$init : function(oEditingArea){
		this.oEditingArea = oEditingArea;
	},

	$BEFORE_MSG_APP_READY : function(){
		// the right document will be available only when the src is completely loaded
		if(this.oEditingArea && this.oEditingArea.tagName == "IFRAME")
			this.oEditingArea = this.oEditingArea.contentWindow.document;
	},

	$ON_MSG_APP_READY : function(){
		this.oApp.exec("REGISTER_HOTKEY", ["ctrl+b", "EXECCOMMAND", ["bold", false, false]]);
		this.oApp.exec("REGISTER_HOTKEY", ["ctrl+u", "EXECCOMMAND", ["underline", false, false]]);
		this.oApp.exec("REGISTER_HOTKEY", ["ctrl+i", "EXECCOMMAND", ["italic", false, false]]);
		this.oApp.exec("REGISTER_HOTKEY", ["ctrl+d", "EXECCOMMAND", ["strikethrough", false, false]]);

		this.oApp.exec("REGISTER_UI_EVENT", ["bold", "click", "EXECCOMMAND", ["bold", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["underline", "click", "EXECCOMMAND", ["underline", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["italic", "click", "EXECCOMMAND", ["italic", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["lineThrough", "click", "EXECCOMMAND", ["strikethrough", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["superscript", "click", "EXECCOMMAND", ["superscript", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["subscript", "click", "EXECCOMMAND", ["subscript", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["justifyleft", "click", "EXECCOMMAND", ["justifyleft", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["justifycenter", "click", "EXECCOMMAND", ["justifycenter", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["justifyright", "click", "EXECCOMMAND", ["justifyright", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["justifyfull", "click", "EXECCOMMAND", ["justifyfull", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["orderedlist", "click", "EXECCOMMAND", ["insertorderedlist", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["unorderedlist", "click", "EXECCOMMAND", ["insertunorderedlist", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["outdent", "click", "EXECCOMMAND", ["outdent", false, false]]);
		this.oApp.exec("REGISTER_UI_EVENT", ["indent", "click", "EXECCOMMAND", ["indent", false, false]]);
	},

	$BEFORE_EXECCOMMAND : function(sCommand, bUserInterface, vValue){
		this._bOnlyCursorChanged = false;
		
		this.oApp.exec("FOCUS", []);
		
		if(sCommand.match(/^bold|underline|italic|strikethrough|superscript|subscript$/i)){
			var oSelection = this.oApp.getSelection();
			if(oSelection.collapsed) this._bOnlyCursorChanged = true;
		}

		if(!this._bOnlyCursorChanged){
			this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", [sCommand]);
		}
	},

	$ON_EXECCOMMAND : function(sCommand, bUserInterface, vValue){
		bUserInterface = (bUserInterface == "" || bUserInterface)?bUserInterface:false;
		vValue = (vValue == "" || vValue)?vValue:false;

		this.oEditingArea.execCommand(sCommand, bUserInterface, vValue);
	},

	$AFTER_EXECCOMMAND : function(sCommand, bUserInterface, vValue){
		if(!this._bOnlyCursorChanged){
			this.oApp.exec("RECORD_UNDO_AFTER_ACTION", [sCommand]);
		}

		this.oApp.exec("CHECK_STYLE_CHANGE", []);
	}
});
