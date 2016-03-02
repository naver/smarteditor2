//{
/**
 * @fileOverview This file contains Husky plugin that bridges the HuskyRange function
 * @name hp_HuskyRangeManager.js
 */
nhn.husky.HuskyRangeManager = jindo.$Class({
	name : "HuskyRangeManager",

	oWindow : null,

	$init : function(win){
		this.oWindow = win || window;
	},

	$BEFORE_MSG_APP_READY : function(){
		if(this.oWindow && this.oWindow.tagName == "IFRAME"){
			this.oWindow = this.oWindow.contentWindow;
			nhn.CurrentSelection.setWindow(this.oWindow);
		}

		this.oApp.exec("ADD_APP_PROPERTY", ["getSelection", jindo.$Fn(this.getSelection, this).bind()]);
		this.oApp.exec("ADD_APP_PROPERTY", ["getEmptySelection", jindo.$Fn(this.getEmptySelection, this).bind()]);
	},

	$ON_SET_EDITING_WINDOW : function(oWindow){
		this.oWindow = oWindow;
	},

	getEmptySelection : function(oWindow){
		var oHuskyRange = new nhn.HuskyRange(oWindow || this.oWindow);
		return oHuskyRange;
	},

	getSelection : function(oWindow){
		this.oApp.exec("RESTORE_IE_SELECTION", []);

		var oHuskyRange = this.getEmptySelection(oWindow);

		// this may throw an exception if the selected is area is not yet shown
		try{
			oHuskyRange.setFromSelection();
		}catch(e){}

		return oHuskyRange;
	}
});
//}