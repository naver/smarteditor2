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
 * @fileOverview This file contains Husky plugin that takes care of the operations related to detecting the style change
 * @name hp_SE_WYSIWYGStyleGetter.js
 */
nhn.husky.SE_WYSIWYGStyleGetter = jindo.$Class({
	name : "SE_WYSIWYGStyleGetter",

	hKeyUp : null,
	
	getStyleInterval : 200,

	oStyleMap : {
		fontFamily : {
			type : "Value",
			css : "fontFamily"
		},
		fontSize : {
			type : "Value",
			css : "fontSize"
		},
		lineHeight : {
			type : "Value",
			css : "lineHeight",
			converter : function(sValue, oStyle){
				if(!sValue.match(/px$/)){
					return sValue;
				}

				return Math.ceil((parseInt(sValue, 10)/parseInt(oStyle.fontSize, 10))*10)/10;
			}
		},
		bold : {
			command : "bold"
		},
		underline : {
			command : "underline"
		},
		italic : {
			command : "italic"
		},
		lineThrough : {
			command : "strikethrough"
		},
		superscript : {
			command : "superscript"
		},
		subscript : {
			command : "subscript"
		},
		justifyleft : {
			command : "justifyleft"
		},
		justifycenter : {
			command : "justifycenter"
		},
		justifyright : {
			command : "justifyright"
		},
		justifyfull : {
			command : "justifyfull"
		},
		orderedlist : {
			command : "insertorderedlist"
		},
		unorderedlist : {
			command : "insertunorderedlist"
		}
	},

	$init : function(){
		this.oStyle = this._getBlankStyle();
	},

	$LOCAL_BEFORE_ALL : function(){
		return (this.oApp.getEditingMode() == "WYSIWYG");
	},
	
	$ON_MSG_APP_READY : function(){
		this.oDocument = this.oApp.getWYSIWYGDocument();
		this.oApp.exec("ADD_APP_PROPERTY", ["getCurrentStyle", jindo.$Fn(this.getCurrentStyle, this).bind()]);
		
		if(jindo.$Agent().navigator().safari || jindo.$Agent().navigator().chrome || jindo.$Agent().navigator().ie){
			this.oStyleMap.textAlign = {
				type : "Value",
				css : "textAlign"
			};
		}
	},
	
	$ON_EVENT_EDITING_AREA_MOUSEUP : function(oEvnet){
		/*
		if(this.hKeyUp){
			clearTimeout(this.hKeyUp);
		}
		this.oApp.delayedExec("CHECK_STYLE_CHANGE", [], 100);
		*/
		this.oApp.exec("CHECK_STYLE_CHANGE");
	},

	$ON_EVENT_EDITING_AREA_KEYPRESS : function(oEvent){
		// ctrl+a in FF triggers keypress event with keyCode 97, other browsers don't throw keypress event for ctrl+a
		var oKeyInfo;
		if(this.oApp.oNavigator.firefox){
			oKeyInfo = oEvent.key();
			if(oKeyInfo.ctrl && oKeyInfo.keyCode == 97){
				return;
			}
		}

		if(this.bAllSelected){
			this.bAllSelected = false;
			return;
		}

		/*
		// queryCommandState often fails to return correct result for Korean/Enter. So just ignore them.
		if(this.oApp.oNavigator.firefox && (oKeyInfo.keyCode == 229 || oKeyInfo.keyCode == 13)){
			return;
		}
		*/
		
		this.oApp.exec("CHECK_STYLE_CHANGE");
		//this.oApp.delayedExec("CHECK_STYLE_CHANGE", [], 0);
	},
	
	$ON_EVENT_EDITING_AREA_KEYDOWN : function(oEvent){
		var oKeyInfo = oEvent.key();

		// ctrl+a
		if((this.oApp.oNavigator.ie || this.oApp.oNavigator.firefox) && oKeyInfo.ctrl && oKeyInfo.keyCode == 65){
			this.oApp.exec("RESET_STYLE_STATUS");
			this.bAllSelected = true;
			return;
		}

		/*
		backspace 8
		enter 13
		page up 33
		page down 34
		end 35
		home 36
		left arrow 37
		up arrow 38
		right arrow 39
		down arrow 40
		insert 45
		delete 46
		*/
		// other key strokes are taken care by keypress event
		if(!(oKeyInfo.keyCode == 8 || (oKeyInfo.keyCode >= 33 && oKeyInfo.keyCode <= 40) || oKeyInfo.keyCode == 45 || oKeyInfo.keyCode == 46)) return;

		// [SMARTEDITORSUS-1841] IE11에서 테이블 첫번째 셀에서 shift+end 를 두번 실행하면 오류 발생
		// ctrl+a 를 다루는 방식대로 RESET_STYLE_STATUS 를 수행하고 CHECK_STYLE_CHANGE 는 수행하지 않도록 처리
		if(oKeyInfo.shift && oKeyInfo.keyCode === 35){
			this.oApp.exec("RESET_STYLE_STATUS");
			this.bAllSelected = true;
			return;
		}

		// take care of ctrl+a -> delete/bksp sequence
		if(this.bAllSelected){
			// firefox will throw both keydown and keypress events for those input(keydown first), so let keypress take care of them
			if(this.oApp.oNavigator.firefox){
				return;
			}
			
			this.bAllSelected = false;
			return;
		}

		this.oApp.exec("CHECK_STYLE_CHANGE");
	},

	$ON_CHECK_STYLE_CHANGE : function(){
		this._getStyle();
	},
	
	$ON_RESET_STYLE_STATUS : function(){
		this.oStyle = this._getBlankStyle();
		var oBodyStyle = this._getStyleOf(this.oApp.getWYSIWYGDocument().body);
		this.oStyle.fontFamily = oBodyStyle.fontFamily;
		this.oStyle.fontSize = oBodyStyle.fontSize;
		this.oStyle["justifyleft"]="@^";
		for(var sAttributeName in this.oStyle){
			//this.oApp.exec("SET_STYLE_STATUS", [sAttributeName, this.oStyle[sAttributeName]]);
			this.oApp.exec("MSG_STYLE_CHANGED", [sAttributeName, this.oStyle[sAttributeName]]);
		}
	},
	
	getCurrentStyle : function(){
		return this.oStyle;
	},
	
	_check_style_change : function(){
		this.oApp.exec("CHECK_STYLE_CHANGE", []);
	},

	_getBlankStyle : function(){
		var oBlankStyle = {};
		for(var attributeName in this.oStyleMap){
			if(this.oStyleMap[attributeName].type == "Value"){
				oBlankStyle[attributeName] = "";
			}else{
				oBlankStyle[attributeName] = 0;
			}
		}
		
		return oBlankStyle;
	},

	_getStyle : function(){
		var oStyle;
		if(nhn.CurrentSelection.isCollapsed()){
			oStyle = this._getStyleOf(nhn.CurrentSelection.getCommonAncestorContainer());
		}else{
			var oSelection = this.oApp.getSelection();
			
			var funcFilter = function(oNode){
				if (!oNode.childNodes || oNode.childNodes.length == 0)
					return true;
				else
					return false;
			}

			var aBottomNodes = oSelection.getNodes(false, funcFilter);

			if(aBottomNodes.length == 0){
				oStyle = this._getStyleOf(oSelection.commonAncestorContainer);
			}else{
				oStyle = this._getStyleOf(aBottomNodes[0]);
			}
		}
		
		for(attributeName in oStyle){
			if(this.oStyleMap[attributeName].converter){
				oStyle[attributeName] = this.oStyleMap[attributeName].converter(oStyle[attributeName], oStyle);
			}
		
			if(this.oStyle[attributeName] != oStyle[attributeName]){
				/**
				 * [SMARTEDITORSUS-1803] 글꼴을 변경할 때는 글자크기 변경사항은 반영되지 않도록 함 - getComputedStyle() 버그 
				 * 
				 * 글꼴이나 글자 크기를 변경할 때마다,
				 * this.oApp.exec("CHECK_STYLE_CHANGE")가 호출되는데, 
				 * 이 때 대상 스타일 뿐 아니라 모든 요소의 변화를 확인하게 된다.
				 *  
				 * 글꼴만 변경하는 경우에도
				 * getComputedStyle() 반올림 방식으로 인한 오차로 인해
				 * pt 단위의 글자크기가 px로 바뀌게 되는데,
				 *  
				 * 스타일 변화 확인에는 jindo.$Element().css()를 사용하는데,
				 * el.currentStyle - getComputedStyle(el)의 순위로 존재여부를 확인하여 사용한다.
				 * 
				 * getComputedStyle(el)을 사용하는 경우,
				 * 대상 엘리먼트에 pt 단위의 값이 지정되어 있었다면
				 * 다음의 순서를 거친다.
				 * - pt 단위를 px 단위로 변환
				 * - 소수점 이하 값을 반올림
				 * 
				 * 글자 크기의 경우 이 영향으로
				 * 산술적인 pt-px 변환이 아닌 값으로 변경되어
				 * 툴바에 노출되는 값 계산에 사용될 수 있다.
				 * */
				if((typeof(document.body.currentStyle) != "object") && (typeof(getComputedStyle) == "function")){
					if((attributeName == "fontSize") && (this.oStyle["fontFamily"] != oStyle["fontFamily"])){
						continue;
					}
				}
				// --[SMARTEDITORSUS-1803]
				this.oApp.exec("MSG_STYLE_CHANGED", [attributeName, oStyle[attributeName]]);
			}
		}

		this.oStyle = oStyle;
	},

	_getStyleOf : function(oNode){
		var oStyle = this._getBlankStyle();
		
		// this must not happen
		if(!oNode){
			return oStyle;
		}
		
		if( oNode.nodeType == 3 ){
			oNode = oNode.parentNode;
		}else if( oNode.nodeType == 9 ){
			//document에는 css를 적용할 수 없음.
			oNode = oNode.body;
		}
		
		var welNode = jindo.$Element(oNode);
		var attribute, cssName;

		for(var styleName in this.oStyle){
			attribute = this.oStyleMap[styleName];
			if(attribute.type && attribute.type == "Value"){
				try{
					if(attribute.css){
						var sValue = welNode.css(attribute.css);
						if(styleName == "fontFamily"){
							sValue = sValue.split(/,/)[0];
						}
		
						oStyle[styleName] = sValue;
					} else if(attribute.command){
						oStyle[styleName] = this.oDocument.queryCommandState(attribute.command);
					} else {
						// todo
					}
				}catch(e){}
			}else{
				if(attribute.command){
					try{
						if(this.oDocument.queryCommandState(attribute.command)){
							oStyle[styleName] = "@^";
						}else{
							oStyle[styleName] = "@-";
						}
					}catch(e){}
				}else{
					// todo
				}
			}
		}
		
		switch(oStyle["textAlign"]){
		case "left":
			oStyle["justifyleft"]="@^";
			break;
		case "center":
			oStyle["justifycenter"]="@^";
			break;
		case "right":
			oStyle["justifyright"]="@^";
			break;
		case "justify":
			oStyle["justifyfull"]="@^";
			break;
		}
		
		// IE에서는 기본 정렬이 queryCommandState로 넘어오지 않아서 정렬이 없다면, 왼쪽 정렬로 가정함
		if(oStyle["justifyleft"]=="@-" && oStyle["justifycenter"]=="@-" && oStyle["justifyright"]=="@-" && oStyle["justifyfull"]=="@-"){oStyle["justifyleft"]="@^";}
		
		return oStyle;
	}
});
//}