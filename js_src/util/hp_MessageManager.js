//{
/**
 * @fileOverview This file contains Husky plugin that maps a message code to the actual message
 * @name hp_MessageManager.js
 */
nhn.husky.MessageManager = jindo.$Class({
	name : "MessageManager",

	oMessageMap : null,
	sLocale : "ko_KR",
	
	$init : function(oMessageMap, sLocale){
		switch(sLocale) {
			case "ja_JP" :
				this.oMessageMap = oMessageMap_ja_JP;
				break;
			case "en_US" :
				this.oMessageMap = oMessageMap_en_US;
				break;
			case "zh_CN" :
				this.oMessageMap = oMessageMap_zh_CN;
				break;
			default :  // Korean
				this.oMessageMap = oMessageMap;
				break;
		}
	},

	$BEFORE_MSG_APP_READY : function(){
		this.oApp.exec("ADD_APP_PROPERTY", ["$MSG", jindo.$Fn(this.getMessage, this).bind()]);
	},

	getMessage : function(sMsg){
		if(this.oMessageMap[sMsg]){return unescape(this.oMessageMap[sMsg]);}
		return sMsg;
	}
});
//}