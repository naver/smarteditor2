/*[
 * CHECK_STYLE_CHANGE
 *
 * 커서 위치의 폰트 스타일 변경 사항을 확인한다.
 *
 * none
 *
---------------------------------------------------------------------------]*/
/**
 * @pluginDesc 현재 커서 위치의 폰트 스타일을 확인하는 플러그인
 */
nhn.husky.SE_WYSIWYGStyleGetter = $Class({
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
				if(!sValue.match(/px$/)) return sValue;

				return Math.ceil((parseInt(sValue)/parseInt(oStyle.fontSize))*10)/10;
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
		if(this.oApp.getEditingMode() != "WYSIWYG") return false;

		return true;
	},
	
	$ON_MSG_APP_READY : function(){
		this.oDocument = this.oApp.getWYSIWYGDocument();
		this.oApp.exec("ADD_APP_PROPERTY", ["getCurrentStyle", $Fn(this.getCurrentStyle, this).bind()]);
	},
	
	$ON_EVENT_EDITING_AREA_MOUSEUP : function(oEvnet){
		if(this.hKeyUp) clearTimeout(this.hKeyUp);
		this.oApp.exec("CHECK_STYLE_CHANGE", []);
	},

	$ON_EVENT_EDITING_AREA_KEYUP : function(oEvent){
		var oKeyInfo = oEvent.key();

		/*
		backspace 8
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
		if(!(oKeyInfo.keyCode == 8 || (oKeyInfo.keyCode >= 33 && oKeyInfo.keyCode <= 40) || oKeyInfo.keyCode == 45 || oKeyInfo.keyCode == 46)) return;

		if(this.hKeyUp) clearTimeout(this.hKeyUp);

		this.hKeyUp = setTimeout($Fn(this.oApp.exec, this.oApp).bind("CHECK_STYLE_CHANGE", []), this.getStyleInterval);
	},
	
	$ON_CHECK_STYLE_CHANGE : function(){
		this._getStyle();
	},
	
	$ON_RESET_STYLE_STATUS : function(){
		var oBlankStyle = this._getBlankStyle();
		for(var sAttributeName in oBlankStyle)
			this.oApp.exec("SET_STYLE_STATUS", [sAttributeName, oBlankStyle[sAttributeName]]);
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
			if(this.oStyleMap[attributeName].type == "Value")
				oBlankStyle[attributeName] = "";
			else
				oBlankStyle[attributeName] = 0;
		}
		
		return oBlankStyle;
	},

	_getStyle : function(){
		var oSelection = this.oApp.getSelection();

		var funcFilter = function(oNode){
			if (!oNode.childNodes || oNode.childNodes.length == 0)
				return true;
			else
				return false;
		}

		var aBottomNodes = oSelection.getNodes(false, funcFilter);

		var oStyle, oBaseStyle, oTmpStyle, attributeName;
		if(aBottomNodes.length == 0){
			oStyle = this._getStyleOf(oSelection.commonAncestorContainer);
		}else{
			oStyle = this._getStyleOf(aBottomNodes[0]);
		}

		for(attributeName in oStyle){
			if(this.oStyleMap[attributeName].converter){
				oStyle[attributeName] = this.oStyleMap[attributeName].converter(oStyle[attributeName], oStyle);
			}
		
			if(this.oStyle[attributeName] != oStyle[attributeName])
				this.oApp.exec("MSG_STYLE_CHANGED", [attributeName, oStyle[attributeName]]);
		}

		this.oStyle = oStyle;
	},

	_getStyleOf : function(oNode){
		var oStyle = this._getBlankStyle();

		// this must not happen
		if(!oNode) return oStyle;

		if(oNode.nodeType == 3) oNode = oNode.parentNode;

		var welNode = $Element(oNode);
		var attribute, cssName;
		for(var styleName in this.oStyle){
			attribute = this.oStyleMap[styleName];

			if(attribute.type && attribute.type == "Value"){
				if(attribute.css){
					var sValue = welNode.css(attribute.css);

					if(styleName == "fontFamily"){
						sValue = sValue.split(/,/)[0];
					}
					
					oStyle[styleName] = sValue;
				}else{
					if(attribute.command){
						try{
							oStyle[styleName] = this.oDocument.queryCommandState(attribute.command);
						}catch(e){}
					}else{
						// todo
					}
				}
			}else{
				if(attribute.command){
					try{
						if(this.oDocument.queryCommandState(attribute.command)){
							oStyle[styleName] = 1;
						}else{
							oStyle[styleName] = 0;
						}
					}catch(e){}
				}else{
					// todo
				}
			}
		}
		return oStyle;
	}
});