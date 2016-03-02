// Sample plugin. Use CTRL+T to toggle the toolbar
nhn.husky.SE_ToolbarToggler = $Class({
	name : "SE_ToolbarToggler",
	bUseToolbar : true,
	
	$init : function(oAppContainer, bUseToolbar){
		this._assignHTMLObjects(oAppContainer, bUseToolbar);
	},

	_assignHTMLObjects : function(oAppContainer, bUseToolbar){
		oAppContainer = $(oAppContainer) || document;
	
		this.toolbarArea = cssquery.getSingle(".se2_tool", oAppContainer);
		
		//설정이 없거나, 사용하겠다고 표시한 경우 block 처리
		if( typeof(bUseToolbar) == 'undefined' || bUseToolbar === true){
			this.toolbarArea.style.display = "block";
		}else{
			this.toolbarArea.style.display = "none";		
		}
	},
	
	$ON_MSG_APP_READY : function(){
		this.oApp.exec("REGISTER_HOTKEY", ["ctrl+t", "SE_TOGGLE_TOOLBAR", []]);
	},
	
	$ON_SE_TOGGLE_TOOLBAR : function(){
		this.toolbarArea.style.display = (this.toolbarArea.style.display == "none")?"block":"none";
		this.oApp.exec("MSG_EDITING_AREA_SIZE_CHANGED", []);
	}
});
