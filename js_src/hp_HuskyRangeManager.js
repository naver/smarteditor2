/*[
 * SET_EDITING_WINDOW
 *
 * 셀렉션을 읽어 올 window 객체를 변경한다.
 *
 * oWindow object 새 window 객체
 *
---------------------------------------------------------------------------]*/
/**
 * @pluginDesc Husky Range 라이브러리를 플러그인 형태로 사용 가능 하도록 해 주는 wrapper 
 */
nhn.husky.HuskyRangeManager = $Class({
	name : "HuskyRangeManager",

	oWindow : null,

	$init : function(win){
		this.oWindow = win || window;
	},

	$BEFORE_MSG_APP_READY : function(){
		if(this.oWindow && this.oWindow.tagName == "IFRAME")
			this.oWindow = this.oWindow.contentWindow;

		this.oApp.exec("ADD_APP_PROPERTY", ["getSelection", $Fn(this.getSelection, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getEmptySelection", $Fn(this.getEmptySelection, this).bind()]);
	},

	$ON_SET_EDITING_WINDOW : function(oWindow){
		this.oWindow = oWindow;
	},

	getEmptySelection : function(){
		var oHuskyRange = new nhn.HuskyRange(this.oWindow);
		return oHuskyRange;
	},

	getSelection : function(){
		this.oApp.exec("RESTORE_IE_SELECTION", []);

		var oHuskyRange = this.getEmptySelection();

		// this may throw an exception if the selected is area is not yet shown
		try{
			oHuskyRange.setFromSelection();
		}catch(e){}

		return oHuskyRange;
	}
});