/**
 * @pluginDesc Enter키 입력시에 현재 줄을 P 태그로 감거나 <br> 태그를 삽입한다.
 */
nhn.husky.SE_WYSIWYGEnterKey = $Class({
	name : "SE_WYSIWYGEnterKey",

	$init : function(sLineBreaker){
		if(sLineBreaker == "BR"){
			this.sLineBreaker = "BR";
		}else{
			this.sLineBreaker = "P";
		}
		
		this.htBrowser = $Agent().navigator();
		
		if((this.htBrowser.ie || this.htBrowser.opera) && this.sLineBreaker == "P"){
			this.$ON_MSG_APP_READY = function(){};
		}
	},
	
	$ON_MSG_APP_READY : function(){
		$Fn(this._onKeyDown, this).attach(this.oApp.getWYSIWYGDocument(), "keydown");
	},
	
	_onKeyDown : function(oEvent){
		var oKeyInfo = oEvent.key();
		
		if(oKeyInfo.shift) return;
		
		if(oKeyInfo.enter){
			if(this.sLineBreaker == "BR"){
				this._insertBR(oEvent);
			}else{
				this._wrapBlock(oEvent);
			}
		}
	},
	
	_wrapBlock : function(oEvent, sWrapperTagName){
		var oSelection = this.oApp.getSelection();
		var sBM = oSelection.placeStringBookmark();
		var oLineInfo = oSelection.getLineInfo();
		var oStart = oLineInfo.oStart;
		var oEnd = oLineInfo.oEnd;

		// line broke by sibling
		// or
		// the parent line breaker is just a block container
		if(!oStart.bParentBreak || oSelection.rxBlockContainer.test(oStart.oLineBreaker.tagName)){
			oEvent.stop();

			var oSWrapper = this.oApp.getWYSIWYGDocument().createElement(this.sLineBreaker);
			oSelection.moveToBookmark(sBM);
			oSelection.setStartBefore(oStart.oNode);
			oSelection.surroundContents(oSWrapper);

			oSelection.collapseToEnd();

			var oEWrapper = this.oApp.getWYSIWYGDocument().createElement(this.sLineBreaker);
			oSelection.setEndAfter(oEnd.oNode);
			oSelection.surroundContents(oEWrapper);

			oSelection.removeStringBookmark(sBM);

			if(oSWrapper.innerHTML == "") oSWrapper.innerHTML = "<br>";
			if(oEWrapper.innerHTML == "") oEWrapper.innerHTML = "<br>";
			
			if(oEWrapper.nextSibling && oEWrapper.nextSibling.tagName == "BR") oEWrapper.parentNode.removeChild(oEWrapper.nextSibling);

			oSelection.selectNodeContents(oEWrapper);
			oSelection.collapseToStart();
			oSelection.select();
			this.oApp.exec("CHECK_STYLE_CHANGE", []);
		}else{
			oSelection.removeStringBookmark(sBM);
		}
	},
	
	_insertBR : function(oEvent){
		oEvent.stop();

		var oSelection = this.oApp.getSelection();

		var elBR = this.oApp.getWYSIWYGDocument().createElement("BR");
		oSelection.insertNode(elBR);
		oSelection.selectNode(elBR);
		oSelection.collapseToEnd();
		
		if(!this.htBrowser.ie){
			var oLineInfo = oSelection.getLineInfo();
			var oStart = oLineInfo.oStart;
			var oEnd = oLineInfo.oEnd;

			if(oEnd.bParentBreak){
				while(oEnd.oNode && oEnd.oNode.nodeType == 3 && oEnd.oNode.nodeValue == ""){
					oEnd.oNode = oEnd.oNode.previousSibling;
				}

				var nTmp = 1;
				if(oEnd.oNode == elBR || oEnd.oNode.nextSibling == elBR){
					nTmp = 0;
				}

				if(nTmp == 0){
					oSelection.pasteHTML("<br type='_moz'/>");
					oSelection.collapseToEnd();
				}
			}
		}

		// the text cursor won't move to the next line without this
		oSelection.insertNode(this.oApp.getWYSIWYGDocument().createTextNode(""));
		oSelection.select();
	}
});
//}
