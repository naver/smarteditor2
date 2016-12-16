/*
Copyright (C) NAVER corp.  

This library is free software; you can redistribute it and/or  
modify it under the terms of the GNU Lesser General Public  
License as published by the Free Software Foundation; either  
version 2.1 of the License, or (at your option) any later version.  

This library is distributed in the hope that it will be useful,  
but WITHOUT ANY WARRANTY; without even the implied warranty of  
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU  
Lesser General Public License for more details.  

You should have received a copy of the GNU Lesser General Public  
License along with this library; if not, write to the Free Software  
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA  
*/
//{
/**
 * @fileOverview This file contains Husky plugin that takes care of the operations related to changing the font size using Select element
 * @name SE2M_FontSizeWithLayerUI.js
 */
nhn.husky.SE2M_FontSizeWithLayerUI = jindo.$Class({
	name : "SE2M_FontSizeWithLayerUI",

	$init : function(elAppContainer){
		this._assignHTMLElements(elAppContainer);
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
	
	_rxPX : /px$/i,
	_rxPT : /pt$/i,
	
	$ON_MSG_STYLE_CHANGED : function(sAttributeName, sAttributeValue){
		if(sAttributeName == "fontSize"){
			// [SMARTEDITORSUS-1600]
			if(this._rxPX.test(sAttributeValue)){
			// as-is
			/*
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
				}*/
				
				/**
				 * Chrome의 경우, 
				 * jindo.$Element().css()에서 대상 Element에 구하고자 하는 style 값이 명시되어 있지 않다면,
				 * 실제 수행되는 메서드는 window.getComputedStyle()이다.
				 * 
				 * 이 메서드를 거치면 px 단위로 값을 가져오게 되는데,
				 * WYSIWYGDocument.body에 pt 단위로 값이 설정되어 있었다면
				 * px : pt = 72 : 96 의 비례에 의해
				 * 변환된 px 값을 획득하게 되며,
				 *   
				 * 아래 parseFloat()의 특성 상
				 * 소수점 16자리부터는 버려질 수 있으며,
				 * 
				 * 이 경우 발생할 수 있는 오차는
				 * pt 기준으로 3.75E-16 pt이다.
				 * 
				 * 0.5pt 크기로 구간을 설정하였기 때문에
				 * 이 오차는 설정에 지장을 주지 않는다.
				 * 
				 * 위의 기존 방식은 계산을 거치지 않을 뿐 아니라,
				 * 소수점 첫째 자리부터 무조건 반올림하기 때문에
				 * 결과에 따라 0.375 pt의 오차가 발생할 수 있었다.
				 * */
				var num = parseFloat(sAttributeValue.replace(this._rxPX, ""));
				if(num > 0){
					// px : pt = 72 : 96
					sAttributeValue = num * 72 / 96 + "pt"; 
				}else{
					sAttributeValue = this.sDefaultText;
				}
				// --[SMARTEDITORSUS-1600]
			}
			
			// [SMARTEDITORSUS-1600]
			// 산술 계산을 통해 일차적으로 pt로 변환된 값을 0.5pt 구간을 적용하여 보정하되, 보다 가까운 쪽으로 설정한다.
			if(this._rxPT.test(sAttributeValue)){
				var num = parseFloat(sAttributeValue.replace(this._rxPT, ""));
				var integerPart = Math.floor(num); // 정수 부분
				var decimalPart = num - integerPart; // 소수 부분
				
				// 보정 기준은 소수 부분이며, 반올림 단위는 0.25pt
				if(decimalPart >= 0 && decimalPart < 0.25){
					num = integerPart + 0;
				}else if(decimalPart >= 0.25 && decimalPart < 0.75){
					num = integerPart + 0.5;
				}else{
					num = integerPart + 1;
				} 
				
				// 보정된 pt
				sAttributeValue = num + "pt";
			}
			// --[SMARTEDITORSUS-1600]
			
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
