//{
/**
 * @fileOverview This file contains Husky plugin that takes care of the operations related to changing the font size using Select element
 * @name SE2M_FontSizeWithLayerUI.js
 */
nhn.husky.SE2M_FontSizeWithLayerUI = jindo.$Class({
	name : "SE2M_FontSizeWithLayerUI",

	$init : function(elAppContainer){
		this._assignHTMLElements(elAppContainer);
		
		// this hash table is required for Firefox
		this.mapPX2PT = {};
		this.mapPX2PT["8"] = "6";
		this.mapPX2PT["9"] = "7";
		this.mapPX2PT["10"] = "7.5";
		this.mapPX2PT["11"] = "8";
		this.mapPX2PT["12"] = "9";
		this.mapPX2PT["13"] = "10";
		this.mapPX2PT["14"] = "10.5";
		this.mapPX2PT["15"] = "11";
		this.mapPX2PT["16"] = "12";
		this.mapPX2PT["17"] = "13";
		this.mapPX2PT["18"] = "13.5";
		this.mapPX2PT["19"] = "14";
		this.mapPX2PT["20"] = "14.5";
		this.mapPX2PT["21"] = "15";
		this.mapPX2PT["22"] = "16";
		this.mapPX2PT["23"] = "17";
		this.mapPX2PT["24"] = "18";
		this.mapPX2PT["26"] = "20";
		this.mapPX2PT["29"] = "22";
		this.mapPX2PT["32"] = "24";
		this.mapPX2PT["35"] = "26";
		this.mapPX2PT["36"] = "27";
		this.mapPX2PT["37"] = "28";
		this.mapPX2PT["38"] = "29";
		this.mapPX2PT["40"] = "30";
		this.mapPX2PT["42"] = "32";
		this.mapPX2PT["45"] = "34";
		this.mapPX2PT["48"] = "36";
	},
	
	_assignHTMLElements : function(elAppContainer){
		//@ec
		this.oDropdownLayer = jindo.$$.getSingle("DIV.husky_se_fontSize_layer", elAppContainer);

		//@ec[
		this.elFontSizeLabel = jindo.$$.getSingle("SPAN.husky_se2m_current_fontSize", elAppContainer);
		this.aLIFontSizes = jindo.$A(jindo.$$("LI", this.oDropdownLayer)).filter(function(v,i,a){return (v.firstChild != null);})._array;
		//@ec]
		
		this.sDefaultText = this.elFontSizeLabel.innerHTML;
	},
	
	$ON_MSG_APP_READY : function(){
		this.oApp.exec("REGISTER_UI_EVENT", ["fontSize", "click", "SE2M_TOGGLE_FONTSIZE_LAYER"]);
		this.oApp.exec("SE2_ATTACH_HOVER_EVENTS", [this.aLIFontSizes]);

		for(var i=0; i<this.aLIFontSizes.length; i++){
			this.oApp.registerBrowserEvent(this.aLIFontSizes[i], "click", "SET_FONTSIZE", [this._getFontSizeFromLI(this.aLIFontSizes[i])]);
		}
	},

	$ON_SE2M_TOGGLE_FONTSIZE_LAYER : function(){
		this.oApp.exec("TOGGLE_TOOLBAR_ACTIVE_LAYER", [this.oDropdownLayer, null, "SELECT_UI", ["fontSize"], "DESELECT_UI", ["fontSize"]]);
		this.oApp.exec('MSG_NOTIFY_CLICKCR', ['size']);
	},
	
	$ON_MSG_STYLE_CHANGED : function(sAttributeName, sAttributeValue){
		if(sAttributeName == "fontSize"){
			if(sAttributeValue.match(/px$/)){
				var num = parseFloat(sAttributeValue.replace("px", "")).toFixed(0);
				if(this.mapPX2PT[num]){
					sAttributeValue = this.mapPX2PT[num] + "pt";
				}else{
					if(sAttributeValue > 0){
						sAttributeValue = num + "px";
					}else{
						sAttributeValue = this.sDefaultText;
					}
				}
			}
			if(!sAttributeValue){
				sAttributeValue = this.sDefaultText;
			}
			var elLi = this._getMatchingLI(sAttributeValue);
			this._clearFontSizeSelection();
			if(elLi){
				this.elFontSizeLabel.innerHTML = sAttributeValue;
				jindo.$Element(elLi).addClass("active");
			}else{
				this.elFontSizeLabel.innerHTML = sAttributeValue;
			}
		}
	},

	$ON_SET_FONTSIZE : function(sFontSize){
		if(!sFontSize){return;}

		this.oApp.exec("SET_WYSIWYG_STYLE", [{"fontSize":sFontSize}]);
		this.oApp.exec("HIDE_ACTIVE_LAYER", []);

		this.oApp.exec("CHECK_STYLE_CHANGE", []);
	},
	
	_getMatchingLI : function(sFontSize){
		var elLi;
		
		sFontSize = sFontSize.toLowerCase();
		for(var i=0; i<this.aLIFontSizes.length; i++){
			elLi = this.aLIFontSizes[i];
			if(this._getFontSizeFromLI(elLi).toLowerCase() == sFontSize){return elLi;}
		}
		
		return null;
	},

	_getFontSizeFromLI : function(elLi){
		return elLi.firstChild.firstChild.style.fontSize;
	},
	
	_clearFontSizeSelection : function(elLi){
		for(var i=0; i<this.aLIFontSizes.length; i++){
			jindo.$Element(this.aLIFontSizes[i]).removeClass("active");
		}
	}
});
