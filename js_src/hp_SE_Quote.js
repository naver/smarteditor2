/**
 * @pluginDesc 인용구 플러그인
 */
nhn.husky.SE_Quote = $Class({
	name : "SE_Quote",

	$init : function(elAppContainer){
		this._assignHTMLObjects(elAppContainer);
	},
	
	_assignHTMLObjects : function(elAppContainer){
		this.elDropdownLayer = cssquery.getSingle("DIV.husky_seditor_blockquote_layer", elAppContainer);
	},
	
	$ON_MSG_APP_READY: function(){
		this.oApp.exec("REGISTER_UI_EVENT", ["quote", "click", "TOGGLE_BLOCKQUOTE_LAYER"]);

		this.oApp.registerBrowserEvent(this.elDropdownLayer, "click", "EVENT_APPLY_SEDITOR_BLOCKQUOTE", []);
	},

	$ON_TOGGLE_BLOCKQUOTE_LAYER : function(){
		this.oApp.exec("TOGGLE_TOOLBAR_ACTIVE_LAYER", [this.elDropdownLayer, null, "SELECT_UI", ["quote"], "DESELECT_UI", ["quote"]]);
	},

	$ON_EVENT_APPLY_SEDITOR_BLOCKQUOTE : function(weEvent){
		var elButton = weEvent.element;
		if(elButton.tagName != "BUTTON") return;
		
		var sClass = elButton.parentNode.className;

		if(sClass != "q8")
			this._wrapBlock("BLOCKQUOTE", sClass);
		else
			this._unwrapBlock("BLOCKQUOTE");
			
		this.oApp.exec("HIDE_ACTIVE_LAYER", []);
	},
	
	_unwrapBlock : function(tag){
		var oSelection = this.oApp.getSelection();
		var oC = oSelection.commonAncestorContainer;

		while(oC && oC.tagName != tag) oC = oC.parentNode;
		if(!oC) return;

		while(oC.firstChild) oC.parentNode.insertBefore(oC.firstChild, oC);
		
		oC.parentNode.removeChild(oC);
	},
	
	_wrapBlock : function(tag, className){
		var oSelection = this.oApp.getSelection();
		var oLineInfo = oSelection.getLineInfo();
		var oStart = oLineInfo.oStart;
		var oEnd = oLineInfo.oEnd;
		
		var rxDontUseAsWhole = /BODY|TD|LI/i;

		var oStartNode, oEndNode;

		if(oStart.bParentBreak && !rxDontUseAsWhole.test(oStart.oLineBreaker.tagName)) oStartNode = oStart.oNode.parentNode;
		else oStartNode = oStart.oNode;

		if(oEnd.bParentBreak && !rxDontUseAsWhole.test(oEnd.oLineBreaker.tagName)) oEndNode = oEnd.oNode.parentNode;
		else oEndNode = oEnd.oNode;

		oSelection.setStartBefore(oStartNode);
		oSelection.setEndAfter(oEndNode);

		var oNode = this._expandToTableStart(oSelection, oEndNode);
		if(oNode){
			oEndNode = oNode;
			oSelection.setEndAfter(oNode);
		}

		oNode = this._expandToTableStart(oSelection, oStartNode);
		if(oNode){
			oStartNode = oNode;
			oSelection.setStartBefore(oNode);
		}

		oNode = oStartNode;
		var oC = oSelection.commonAncestorContainer;

		// find the insertion position for the formatting tag right beneath the common ancestor container
		while(oNode && oNode != oC && oNode.parentNode != oC) oNode = oNode.parentNode;

		oFormattingNode = oSelection._document.createElement(tag);
		if(className) oFormattingNode.className = className;

		if(oNode == oC){
			oC.insertBefore(oFormattingNode, oC.firstChild);
		}else{
			oC.insertBefore(oFormattingNode, oNode);
		}
		
		oSelection.setStartAfter(oFormattingNode);

		oSelection.setEndAfter(oEndNode);
		oSelection.surroundContents(oFormattingNode);
		
		var aNodes = oFormattingNode.childNodes;
		var oInsertionPoint;
		for(var i=aNodes.length-1; i>=0; i--){
			if(aNodes[i].nodeType == 3 || aNodes[i].tagName == "BR"){
				var oP = oSelection._document.createElement("P");
				oInsertionPoint = aNodes[i].nextSibling;
				while(i>=0 && aNodes[i] && (aNodes[i].nodeType == 3 || aNodes[i].tagName == "BR")){
					oP.insertBefore(aNodes[i--], oP.firstChild);
				}
				oFormattingNode.insertBefore(oP, oInsertionPoint);
				i++;
			}
		}

		if(oFormattingNode && oFormattingNode.parentNode){
			var oP = oSelection._document.createElement("P");
			oP.innerHTML = unescape("<br/>");
			oFormattingNode.parentNode.insertBefore(oP, oFormattingNode.nextSibling);
		}

		this.oApp.exec("RECORD_UNDO_ACTION", ["Block Quote"]);
		
		return oFormattingNode;
	},
	
	_expandToTableStart : function(oSelection, oNode){
		var oC = oSelection.commonAncestorContainer;
		var oResultNode = null;

		var bLastIteration = false;
		while(oNode && !bLastIteration){
			if(oNode == oC) bLastIteration = true;

			if(/TBODY|TFOOT|THEAD|TR/i.test(oNode.tagName)){
				oResultNode = this._getTableRoot(oNode);
				break;
			}
			oNode = oNode.parentNode;
		}
		
		return oResultNode;
	},
	
	_getTableRoot : function(oNode){
		while(oNode && oNode.tagName != "TABLE") oNode = oNode.parentNode;
		
		return oNode;
	}
});