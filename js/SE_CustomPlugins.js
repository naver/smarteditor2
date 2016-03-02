function SE_RegisterCustomPlugins(oEditor, elAppContainer){
//	oEditor.registerPlugin(new nhn.husky.SE_ToolbarToggler(elAppContainer));
}

// Sample plugin. Use CTRL+T to toggle the toolbar
nhn.husky.SE_ToolbarToggler = $Class({
	name : "SE_ToolbarToggler",

	$init : function(oAppContainer){
		this._assignHTMLObjects(oAppContainer);
	},

	_assignHTMLObjects : function(oAppContainer){
		oAppContainer = $(oAppContainer) || document;
		this.toolbarArea = cssquery.getSingle(".tool", oAppContainer);
	},
	
	$ON_MSG_APP_READY : function(){
		this.oApp.exec("SE_TOGGLE_TOOLBAR", []);
		this.oApp.exec("REGISTER_HOTKEY", ["ctrl+t", "SE_TOGGLE_TOOLBAR", []]);
	},
	
	$ON_SE_TOGGLE_TOOLBAR : function(){
		this.toolbarArea.style.display = (this.toolbarArea.style.display == "none")?"block":"none";
		this.oApp.exec("MSG_EDITING_AREA_SIZE_CHANGED", []);
	}
});
