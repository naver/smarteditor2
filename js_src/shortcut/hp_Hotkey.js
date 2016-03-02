//{
/**
 * @fileOverview This file contains Husky plugin that takes care of the hotkey feature
 * @name hp_Hotkey.js
 */
nhn.husky.Hotkey = jindo.$Class({
	name : "Hotkey",

	$init : function(){
		this.oShortcut = shortcut;
	},
	
	$ON_ADD_HOTKEY : function(sHotkey, sCMD, aArgs, elTarget){
		if(!aArgs){aArgs = [];}
		
		var func = jindo.$Fn(this.oApp.exec, this.oApp).bind(sCMD, aArgs);
		this.oShortcut(sHotkey, elTarget).addEvent(func);		
	}
});
//}