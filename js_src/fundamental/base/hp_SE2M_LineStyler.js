//{
/**
 * @fileOverview This file contains Husky plugin that takes care of the operations related to setting/changing the line style
 * @name hp_SE_LineStyler.js
 */
nhn.husky.SE2M_LineStyler = jindo.$Class({
	name : "SE2M_LineStyler",

	//@lazyload_js SE2M_TOGGLE_LINEHEIGHT_LAYER,SET_LINE_STYLE[
	$ON_SE2M_TOGGLE_LINEHEIGHT_LAYER : function(){
		this.oApp.exec("ADD_APP_PROPERTY", ["getLineStyle", jindo.$Fn(this.getLineStyle, this).bind()]);
	},
	
	$ON_SET_LINE_STYLE : function(sStyleName, styleValue, htOptions){
		this.oSelection = this.oApp.getSelection();
		var nodes = this._getSelectedNodes(false);
		this.setLineStyle(sStyleName, styleValue, htOptions, nodes);
		
		this.oApp.exec("CHECK_STYLE_CHANGE", []);
	},
	
	$ON_SET_LINE_BLOCK_STYLE : function(sStyleName, styleValue, htOptions){
		this.oSelection = this.oApp.getSelection();
		this.setLineBlockStyle(sStyleName, styleValue, htOptions);
		
		this.oApp.exec("CHECK_STYLE_CHANGE", []);
	},
	
	getLineStyle : function(sStyle){
		var nodes = this._getSelectedNodes(false);

		var curWrapper, prevWrapper;
		var sCurStyle, sStyleValue;

		if(nodes.length === 0){return null;}
		
		var iLength = nodes.length;
		
		if(iLength === 0){
			sStyleValue = null;
		}else{
			prevWrapper = this._getLineWrapper(nodes[0]);
			sStyleValue = this._getWrapperLineStyle(sStyle, prevWrapper);
		}

		var firstNode = this.oSelection.getStartNode();

		if(sStyleValue != null){
			for(var i=1; i<iLength; i++){
				if(this._isChildOf(nodes[i], curWrapper)){continue;}
				if(!nodes[i]){continue;}
				
				curWrapper = this._getLineWrapper(nodes[i]);
				if(curWrapper == prevWrapper){continue;}
	
				sCurStyle = this._getWrapperLineStyle(sStyle, curWrapper);
				
				if(sCurStyle != sStyleValue){
					sStyleValue = null;
					break;
				}
	
				prevWrapper = curWrapper;
			}
		}
		
		curWrapper = this._getLineWrapper(nodes[iLength-1]);

		var lastNode = this.oSelection.getEndNode();

		selectText = jindo.$Fn(function(firstNode, lastNode){
			this.oSelection.setEndNodes(firstNode, lastNode);
			this.oSelection.select();
			
			this.oApp.exec("CHECK_STYLE_CHANGE", []);
		}, this).bind(firstNode, lastNode);
		
		setTimeout(selectText, 0);

		return sStyleValue;
	},

	// height in percentage. For example pass 1 to set the line height to 100% and 1.5 to set it to 150%
	setLineStyle : function(sStyleName, styleValue, htOptions, nodes){
		thisRef = this;
		
		var bWrapperCreated = false;
		
		function _setLineStyle(div, sStyleName, styleValue){
			if(!div){
				bWrapperCreated = true;

				// try to wrap with P first
				try{
					div = thisRef.oSelection.surroundContentsWithNewNode("P");
				// if the range contains a block-level tag, wrap it with a DIV
				}catch(e){
					div = thisRef.oSelection.surroundContentsWithNewNode("DIV");
				}
			}

			if(typeof styleValue == "function"){
				styleValue(div);
			}else{
				div.style[sStyleName] = styleValue;
			}

			if(div.childNodes.length === 0){
				div.innerHTML = "&nbsp;";
			}

			return div;
		}
		
		function isInBody(node){
			while(node && node.tagName != "BODY"){
				node = nhn.DOMFix.parentNode(node);
			}
			if(!node){return false;}

			return true;
		}

		if(nodes.length === 0){
			return;
		}
		
		var curWrapper, prevWrapper;
		var iLength = nodes.length;
		
		if((!htOptions || !htOptions["bDontAddUndoHistory"])){
			this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["LINE STYLE"]);
		}
		
		prevWrapper = this._getLineWrapper(nodes[0]);
		prevWrapper = _setLineStyle(prevWrapper, sStyleName, styleValue);

		var startNode = prevWrapper;
		var endNode = prevWrapper;

		for(var i=1; i<iLength; i++){
			// Skip the node if a copy of the node were wrapped and the actual node no longer exists within the document.
			try{
				if(!isInBody(nhn.DOMFix.parentNode(nodes[i]))){continue;}
			}catch(e){continue;}

			if(this._isChildOf(nodes[i], curWrapper)){continue;}

			curWrapper = this._getLineWrapper(nodes[i]);
			
			if(curWrapper == prevWrapper){continue;}

			curWrapper = _setLineStyle(curWrapper, sStyleName, styleValue);

			prevWrapper = curWrapper;
		}

		endNode = curWrapper || startNode;

		if(bWrapperCreated && (!htOptions || !htOptions.bDoNotSelect)) {
			setTimeout(jindo.$Fn(function(startNode, endNode, htOptions){
				if(startNode == endNode){
					this.oSelection.selectNodeContents(startNode);

					if(startNode.childNodes.length==1 && startNode.firstChild.tagName == "BR"){
						this.oSelection.collapseToStart();
					}
				}else{
					this.oSelection.setEndNodes(startNode, endNode);
				}

				this.oSelection.select();

				if((!htOptions || !htOptions["bDontAddUndoHistory"])){
					this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["LINE STYLE"]);
				}
			}, this).bind(startNode, endNode, htOptions), 0);
		}
	},
	
	/**
	 * Block Style 적용
	 */
	setLineBlockStyle : function(sStyleName, styleValue, htOptions) {
		var htSelectedTDs = {};
		//var aTempNodes = aTextnodes = [];
		var aTempNodes = [];
		var aTextnodes = [];
		this.oApp.exec("GET_SELECTED_TD_BLOCK",['aTdCells',htSelectedTDs]);

		var aNodes = htSelectedTDs.aTdCells;
		
		for( var j = 0; j < aNodes.length ; j++){
			this.oSelection.selectNode(aNodes[j]);
			aTempNodes = this.oSelection.getNodes();
			
			for(var k = 0, m = 0; k < aTempNodes.length ; k++){		
				if(aTempNodes[k].nodeType == 3 || (aTempNodes[k].tagName == "BR" && k == 0)) {
					aTextnodes[m] = aTempNodes[k];
					m ++;
				}
			}
			this.setLineStyle(sStyleName, styleValue, htOptions, aTextnodes);
			aTempNodes = aTextnodes = [];
		}
	},

	getTextNodes : function(bSplitTextEndNodes, oSelection){
		var txtFilter = function(oNode){
			// 편집 중에 생겨난 빈 LI/P에도 스타일 먹이도록 포함함
			if((oNode.nodeType == 3 && oNode.nodeValue != "\n" && oNode.nodeValue != "") || (oNode.tagName == "LI" && oNode.innerHTML == "") || (oNode.tagName == "P" && oNode.innerHTML == "")){
				return true;
			}else{
				return false;
			}
		};

		return oSelection.getNodes(bSplitTextEndNodes, txtFilter);
	},

	_getSelectedNodes : function(bDontUpdate){
		if(!bDontUpdate){
			this.oSelection = this.oApp.getSelection();
		}

		// 페이지 최하단에 빈 LI 있을 경우 해당 LI 포함하도록 expand
		if(this.oSelection.endContainer.tagName == "LI" && this.oSelection.endOffset == 0 && this.oSelection.endContainer.innerHTML == ""){
			this.oSelection.setEndAfter(this.oSelection.endContainer);
		}

		if(this.oSelection.collapsed){this.oSelection.selectNode(this.oSelection.commonAncestorContainer);}
			
		//var nodes = this.oSelection.getTextNodes();
		var nodes = this.getTextNodes(false, this.oSelection);

		if(nodes.length === 0){
			var tmp = this.oSelection.getStartNode();
			if(tmp){
				nodes[0] = tmp;
			}else{
				var elTmp = this.oSelection._document.createTextNode("\u00A0");
				this.oSelection.insertNode(elTmp);
				nodes = [elTmp];
			}
		}
		return nodes;
	},
	
	_getWrapperLineStyle : function(sStyle, div){
		var sStyleValue = null;
		if(div && div.style[sStyle]){
			sStyleValue = div.style[sStyle];
		}else{
			div = this.oSelection.commonAncesterContainer;
			while(div && !this.oSelection.rxLineBreaker.test(div.tagName)){
				if(div && div.style[sStyle]){
					sStyleValue = div.style[sStyle];
					break;
				}
				div = nhn.DOMFix.parentNode(div);
			}
		}

		return sStyleValue;
	},

	_isChildOf : function(node, container){
		while(node && node.tagName != "BODY"){
			if(node == container){return true;}
			node = nhn.DOMFix.parentNode(node);
		}

		return false;
	},
 	_getLineWrapper : function(node){
		var oTmpSelection = this.oApp.getEmptySelection();
		oTmpSelection.selectNode(node);
		var oLineInfo = oTmpSelection.getLineInfo();
		var oStart = oLineInfo.oStart;
		var oEnd = oLineInfo.oEnd;

		var a, b;
		var breakerA, breakerB;
		var div = null;
	
		a = oStart.oNode;
		breakerA = oStart.oLineBreaker;
		b = oEnd.oNode;
		breakerB = oEnd.oLineBreaker;

		this.oSelection.setEndNodes(a, b);

		if(breakerA == breakerB){
			if(breakerA.tagName == "P" || breakerA.tagName == "DIV" || breakerA.tagName == "LI"){
//			if(breakerA.tagName == "P" || breakerA.tagName == "DIV"){
				div = breakerA;
			}else{
				this.oSelection.setEndNodes(breakerA.firstChild, breakerA.lastChild);
			}
		}
		
		return div;
 	}
	//@lazyload_js]
 });
//}