/*[
 * REGISTER_HOTKEY
 *
 * 단축키와 해당 단축키를 눌렀을 때 발생시킬 메시지를 등록한다.
 *
 * sHotkey string 사용할 단축키를 지정한다. 예) "alt+3"
 * sCMD string 단축키가 눌렸을 때 발생할 메시지를 설정
 * sArgs array 메시지를 발생할때 함께 넘겨줄 파라미터 설정
 *
---------------------------------------------------------------------------]*/
/**
 * @pluginDesc 단축키 기능을 제공하는 플러그인
 */
nhn.husky.Hotkey = $Class({
	name : "Hotkey",

	$init : function(){
		this.oShortcut = shortcut;
	},

	$ON_REGISTER_HOTKEY : function(sHotkey, sCMD, sArgs){
		if(!sArgs) sArgs = [];
		var func = $Fn(this.oApp.exec, this.oApp).bind(sCMD, sArgs);

		this.oShortcut(sHotkey, this.oApp.getWYSIWYGDocument()).addEvent(func);
	}
});