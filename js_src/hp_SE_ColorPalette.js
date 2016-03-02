/**
 * @pluginDesc 컬러 팔레트 관리 플러그인
 */
 nhn.husky.SE_ColorPalette = $Class({
	name : "SE_ColorPalette",
	rxRGBColorPattern : /rgb\((\d+), ?(\d+), ?(\d+)\)/i,

	$init : function(oAppContainer){
		this._assignHTMLObjects(oAppContainer);
	},
	
	_assignHTMLObjects : function(oAppContainer){
		this.elColorPaletteLayer = cssquery.getSingle("UL.husky_seditor_color_palette", oAppContainer);
	},
	
	$ON_MSG_APP_READY : function(){
		this.oApp.registerBrowserEvent(this.elColorPaletteLayer, "click", "EVENT_MOUSEUP_COLOR_PALETTE");
	},
	
	$ON_SHOW_COLOR_PALETTE : function(sCallbackCmd, oLayerContainer){
		this.sCallbackCmd = sCallbackCmd;
		this.oLayerContainer = oLayerContainer;

		this.oLayerContainer.insertBefore(this.elColorPaletteLayer, null);

		this.elColorPaletteLayer.style.display = "block";
	},

	$ON_HIDE_COLOR_PALETTE : function(){
		this.elColorPaletteLayer.style.display = "none";
	},
	
	$ON_COLOR_PALETTE_APPLY_COLOR : function(sColorCode){
		if(this.rxRGBColorPattern.test(sColorCode)){

			function dec2Hex(sDec){
				var sTmp = parseInt(sDec).toString(16);
				if(sTmp.length<2) sTmp = "0"+sTmp;
				return sTmp.toUpperCase();
			}

			var sR = dec2Hex(RegExp.$1);
			var sG = dec2Hex(RegExp.$2);
			var sB = dec2Hex(RegExp.$3);
			sColorCode = "#"+sR+sG+sB;
		}
		this.oApp.exec(this.sCallbackCmd, [sColorCode]);
	},
	
	$ON_EVENT_MOUSEUP_COLOR_PALETTE : function(oEvent){
		var elButton = oEvent.element;
		if(! elButton.style.backgroundColor) return;

		this.oApp.exec("COLOR_PALETTE_APPLY_COLOR", [elButton.style.backgroundColor]);
	}
});