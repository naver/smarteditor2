/*[
 * ATTACH_HOVER_EVENTS
 *
 * 주어진 HTML엘리먼트에 Hover 이벤트 발생시 특정 클래스가 할당 되도록 설정
 *
 * aElms array Hover 이벤트를 걸 HTML Element 목록
 * sHoverClass string Hover 시에 할당 할 클래스
 *
---------------------------------------------------------------------------]*/
/**
 * @pluginDesc Husky Framework에서 자주 사용되는 유틸성 메시지를 처리하는 플러그인
 */
 nhn.husky.Utils = $Class({
	name : "Utils",

	$init : function(){
		var oAgentInfo = $Agent();
		var oNavigatorInfo = oAgentInfo.navigator();

		if(oNavigatorInfo.ie && oNavigatorInfo.version == 6){
			try{
				document.execCommand('BackgroundImageCache', false, true);
			}catch(e){}
		}
	},
	
	$BEFORE_MSG_APP_READY : function(){
		this.oApp.exec("ADD_APP_PROPERTY", ["htBrowser", $Agent().navigator()]);
	},
	
	$ON_ATTACH_HOVER_EVENTS : function(aElms, sHoverClass){
		sHoverClass = sHoverClass || "hover";
		
		if(!aElms) return;
		
		var len = aElms.length;
		for(i=0; i<len; i++){
			var tmpElm = aElms[i];

			$Fn($Fn(function(tmpElm){
				$Element(tmpElm).addClass(sHoverClass);
			}, this).bind(tmpElm), this).attach(tmpElm, "mouseover");

			$Fn($Fn(function(tmpElm){
				$Element(tmpElm).removeClass(sHoverClass);
			}, this).bind(tmpElm), this).attach(tmpElm, "mouseout");
		}
	}
});
