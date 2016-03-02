/*[
 * ADD_APP_PROPERTY
 *
 * 주요 오브젝트를 모든 플러그인에서 this.oApp를 통해서 직접 접근 가능 하도록 등록한다.
 *
 * sPropertyName string 등록명
 * oProperty object 등록시킬 오브젝트
 *
---------------------------------------------------------------------------]*/
/*[
 * REGISTER_BROWSER_EVENT
 *
 * 특정 브라우저 이벤트가 발생 했을때 Husky 메시지를 발생 시킨다.
 *
 * obj HTMLElement 브라우저 이벤트를 발생 시킬 HTML 엘리먼트
 * sEvent string 발생 대기 할 브라우저 이벤트
 * sMsg string 발생 할 Husky 메시지
 * aParams array 메시지에 넘길 파라미터
 * nDelay number 브라우저 이벤트 발생 후 Husky 메시지 발생 사이에 딜레이를 주고 싶을 경우 설정. (1/1000초 단위)
 *
---------------------------------------------------------------------------]*/
/*[
 * DISABLE_MESSAGE
 *
 * 특정 메시지를 코어에서 무시하고 라우팅 하지 않도록 비활성화 한다.
 *
 * sMsg string 비활성화 시킬 메시지
 *
---------------------------------------------------------------------------]*/
/*[
 * ENABLE_MESSAGE
 *
 * 무시하도록 설정된 메시지를 무시하지 않도록 활성화 한다.
 *
 * sMsg string 활성화 시킬 메시지
 *
---------------------------------------------------------------------------]*/
/*[
 * EXEC_ON_READY_FUNCTION
 *
 * oApp.run({fnOnAppReady:fnOnAppReady})와 같이 run 호출 시점에 지정된 함수가 있을 경우 이를 MSG_APP_READY 시점에 실행 시킨다.
 * 코어에서 자동으로 발생시키는 메시지로 직접 발생시키지는 않도록 한다.
 *
 * none
 *
---------------------------------------------------------------------------]*/
/**
 * @pluginDesc Husky Framework에서 자주 사용되는 중요 메시지를 처리하는 플러그인
 */
nhn.husky.CorePlugin = $Class({
	name : "CorePlugin",

	$AFTER_MSG_APP_READY : function(){
		this.oApp.exec("EXEC_ON_READY_FUNCTION", []);
	},

	$ON_ADD_APP_PROPERTY : function(sPropertyName, oProperty){
		this.oApp[sPropertyName] = oProperty;
	},

	$ON_REGISTER_BROWSER_EVENT : function(obj, sEvent, sMsg, aParams, nDelay){
		this.oApp.registerBrowserEvent(obj, sEvent, sMsg, aParams, nDelay);
	},
	
	$ON_DISABLE_MESSAGE : function(sMsg){
		this.oApp.disableMessage(sMsg, true);
	},

	$ON_ENABLE_MESSAGE : function(sMsg){
		this.oApp.disableMessage(sMsg, false);
	},

	$ON_EXEC_ON_READY_FUNCTION : function(){
		if(typeof this.oApp.htRunOptions.fnOnAppReady == "function") this.oApp.htRunOptions.fnOnAppReady();
	}
});