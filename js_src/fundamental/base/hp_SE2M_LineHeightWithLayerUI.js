//{
/**
 * @fileOverview This file contains Husky plugin that takes care of the operations related to changing the lineheight using layer
 * @name hp_SE2M_LineHeightWithLayerUI.js
 */
nhn.husky.SE2M_LineHeightWithLayerUI = jindo.$Class({
	name : "SE2M_LineHeightWithLayerUI",

	$ON_MSG_APP_READY : function(){
		this.oApp.exec("REGISTER_UI_EVENT", ["lineHeight", "click", "SE2M_TOGGLE_LINEHEIGHT_LAYER"]);
	},

	//@lazyload_js SE2M_TOGGLE_LINEHEIGHT_LAYER[
	_assignHTMLObjects : function(elAppContainer) {
		//this.elLineHeightSelect = jindo.$$.getSingle("SELECT.husky_seditor_ui_lineHeight_select", elAppContainer);
		this.oDropdownLayer = jindo.$$.getSingle("DIV.husky_se2m_lineHeight_layer", elAppContainer);
		this.aLIOptions = jindo.$A(jindo.$$("LI", this.oDropdownLayer)).filter(function(v,i,a){return (v.firstChild !== null);})._array;
		
		this.oInput = jindo.$$.getSingle("INPUT", this.oDropdownLayer);

		var tmp = jindo.$$.getSingle(".husky_se2m_lineHeight_direct_input", this.oDropdownLayer);
		tmp = jindo.$$("BUTTON", tmp);
		this.oBtn_up = tmp[0];
		this.oBtn_down = tmp[1];
		this.oBtn_ok = tmp[2];
		this.oBtn_cancel = tmp[3];
	},
	
	$LOCAL_BEFORE_FIRST : function(){
		this._assignHTMLObjects(this.oApp.htOptions.elAppContainer);

		this.oApp.exec("SE2_ATTACH_HOVER_EVENTS", [this.aLIOptions]);

		for(var i=0; i<this.aLIOptions.length; i++){
			this.oApp.registerBrowserEvent(this.aLIOptions[i], "click", "SET_LINEHEIGHT_FROM_LAYER_UI", [this._getLineHeightFromLI(this.aLIOptions[i])]);
		}
			
		this.oApp.registerBrowserEvent(this.oBtn_up, "click", "SE2M_INC_LINEHEIGHT", []);
		this.oApp.registerBrowserEvent(this.oBtn_down, "click", "SE2M_DEC_LINEHEIGHT", []);
		this.oApp.registerBrowserEvent(this.oBtn_ok, "click", "SE2M_SET_LINEHEIGHT_FROM_DIRECT_INPUT", []);
		this.oApp.registerBrowserEvent(this.oBtn_cancel, "click", "SE2M_CANCEL_LINEHEIGHT", []);
		
		this.oApp.registerBrowserEvent(this.oInput, "keydown", "EVENT_SE2M_LINEHEIGHT_KEYDOWN");
	},
	
	$ON_EVENT_SE2M_LINEHEIGHT_KEYDOWN : function(oEvent){
		if (oEvent.key().enter){
			this.oApp.exec("SE2M_SET_LINEHEIGHT_FROM_DIRECT_INPUT");
			oEvent.stop();
		}
	},

	$ON_SE2M_TOGGLE_LINEHEIGHT_LAYER : function(){
		this.oApp.exec("TOGGLE_TOOLBAR_ACTIVE_LAYER", [this.oDropdownLayer, null, "LINEHEIGHT_LAYER_SHOWN", [], "LINEHEIGHT_LAYER_HIDDEN", []]);
		this.oApp.exec('MSG_NOTIFY_CLICKCR', ['lineheight']);
	},
	
	$ON_SE2M_INC_LINEHEIGHT : function(){
		this.oInput.value = parseInt(this.oInput.value, 10)||0;
		this.oInput.value++;
	},

	$ON_SE2M_DEC_LINEHEIGHT : function(){
		this.oInput.value = parseInt(this.oInput.value, 10)||0;
		if(this.oInput.value > 0){this.oInput.value--;}
	},
	
	$ON_LINEHEIGHT_LAYER_SHOWN : function(){
		this.oApp.exec("SELECT_UI", ["lineHeight"]);
		this.oInitialSelection = this.oApp.getSelection();
		
		var nLineHeight = this.oApp.getLineStyle("lineHeight");
		
		if(nLineHeight != null && nLineHeight !== 0){
			this.oInput.value = (nLineHeight*100).toFixed(0);
			var elLi = this._getMatchingLI(this.oInput.value+"%");
			if(elLi){jindo.$Element(elLi.firstChild).addClass("active");}
		}else{
			this.oInput.value = "";
		}
	},

	$ON_LINEHEIGHT_LAYER_HIDDEN : function(){
		this.oApp.exec("DESELECT_UI", ["lineHeight"]);
		this._clearOptionSelection();
	},
	
	$ON_SE2M_SET_LINEHEIGHT_FROM_DIRECT_INPUT : function(){
		this._setLineHeightAndCloseLayer(this.oInput.value);
	},

	$ON_SET_LINEHEIGHT_FROM_LAYER_UI : function(sValue){
		this._setLineHeightAndCloseLayer(sValue);
	},
	
	$ON_SE2M_CANCEL_LINEHEIGHT : function(){
		this.oInitialSelection.select();
		this.oApp.exec("HIDE_ACTIVE_LAYER");
	},
	
	_setLineHeightAndCloseLayer : function(sValue){
		var nLineHeight = parseInt(sValue, 10)/100;
		if(nLineHeight>0){
			this.oApp.exec("SET_LINE_STYLE", ["lineHeight", nLineHeight]);
		}else{
			alert(this.oApp.$MSG("SE_LineHeight.invalidLineHeight"));
		}
		this.oApp.exec("SE2M_TOGGLE_LINEHEIGHT_LAYER", []);
		
		var oNavigator = jindo.$Agent().navigator();
		if(oNavigator.chrome || oNavigator.safari){
			this.oApp.exec("FOCUS");	// [SMARTEDITORSUS-654]
		}
	},
	
	_getMatchingLI : function(sValue){
		var elLi;
		
		sValue = sValue.toLowerCase();
		for(var i=0; i<this.aLIOptions.length; i++){
			elLi = this.aLIOptions[i];
			if(this._getLineHeightFromLI(elLi).toLowerCase() == sValue){return elLi;}
		}
		
		return null;
	},

	_getLineHeightFromLI : function(elLi){
		return elLi.firstChild.firstChild.innerHTML;
	},
	
	_clearOptionSelection : function(elLi){
		for(var i=0; i<this.aLIOptions.length; i++){
			jindo.$Element(this.aLIOptions[i].firstChild).removeClass("active");
		}
	}
	//@lazyload_js]
});
//}