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
		
		if(jindo.$Agent().navigator().safari || jindo.$Agent().navigator().chrome){
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