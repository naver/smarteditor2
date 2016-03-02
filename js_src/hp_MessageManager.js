/**
 * @pluginDesc 플러그인 초기화 시에 받은 메시지/키 매핑을 이용해서 메시지를 this.oApp.$MSG(sKey)와 같은 방법으로 접근 하도록 해 주는 플러그인. (언어팩 용으로 사용)
 */
nhn.husky.MessageManager = $Class({
	name : "MessageManager",

	oMessageMap : null,

	$init : function(oMessageMap){
		this.oMessageMap = oMessageMap;
	},

	$BEFORE_MSG_APP_READY : function(){
		this.oApp.exec("ADD_APP_PROPERTY", ["$MSG", $Fn(this.getMessage, this).bind()]);
	},

	getMessage : function(sMsg){
		if(this.oMessageMap[sMsg]) return unescape(this.oMessageMap[sMsg]);
		
		return sMsg;
	}
});