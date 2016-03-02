/**
 * @pluginDesc 줄간격 플러그인
 */
nhn.husky.SE_LineHeight = $Class({
	name : "SE_LineHeight",

	$init : function(oAppContainer){
		this._assignHTMLObjects(oAppContainer);
	},
	
	_assignHTMLObjects : function(oAppContainer){
	},
	
	$ON_SET_LINEHEIGHT : function(nLineHeight){
		this.setLineHeight(nLineHeight);
	},
	
	getLineHeight : function(){
		var nodes = this._getSelectedNodes(false);

		var curWrapper, prevWrapper;
		var iCurHeight, iHeight;

		if(nodes.length == 0) return -1;
		
		var iLength = nodes.length;
		
		if(iLength == 0){
			iHeight = -1;
		}else{
			prevWrapper = this._getLineWrapper(nodes[0]);
			iHeight = this._getWrapperLineheight(prevWrapper);
		}

		var firstNode = this.oSelection.getStartNode();

		if(iHeight > 0){
			for(var i=1; i<iLength; i++){
				if(this._isChildOf(nodes[i], curWrapper)) continue;
				if(!nodes[i]) continue;
				
				curWrapper = this._getLineWrapper(nodes[i]);
				if(curWrapper == prevWrapper) continue;
	
				curHeight = this._getWrapperLineheight(curWrapper);
				
				if(curHeight != iHeight){
					iHeight = -1;
					break;
				}
	
				prevWrapper = curWrapper;
			}
		}
		
		curWrapper = this._getLineWrapper(nodes[iLength-1]);

		var lastNode = this.oSelection.getEndNode();

		selectText = $Fn(function(firstNode, lastNode){
			this.oSelection.setEndNodes(firstNode, lastNode);
			this.oSelection.select();
		}, this).bind(firstNode, lastNode);
		
		setTimeout(selectText, 100);

		return iHeight;
	},

	// height in percentage. For example pass 1 to set the line height to 100% and 1.5 to set it to 150%
	setLineHeight : function(height) {
		thisRef = this;
		
		function _setLineheight(div, height){
			if(!div){
				// try to wrap with P first
				try{
					div = thisRef.oSelection.surroundContentsWithNewNode("P");
				// if the range contains a block-level tag, wrap it with a DIV
				}catch(e){
					div = thisRef.oSelection.surroundContentsWithNewNode("DIV");
				}
			}

			div.style.lineHeight = height;

			return div;
		}
		
		function isInBody(node){
			while(node && node.tagName != "BODY"){
				node = nhn.DOMFix.parentNode(node);
			}
			if(!node) return false;

			return true;
		}

		var nodes = this._getSelectedNodes(false);
		if(nodes.length == 0){
			return;
		}

		var curWrapper, prevWrapper;
		var iLength = nodes.length;

		this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["LINEHEIGHT"]);
		
		prevWrapper = this._getLineWrapper(nodes[0]);
		prevWrapper = _setLineheight(prevWrapper, height);

		var startNode = prevWrapper;
		var endNode = prevWrapper;

		for(var i=1; i<iLength; i++){
			// Skip the node if a copy of the node were wrapped and the actual node no longer exists within the document.
			try{
				if(!isInBody(nhn.DOMFix.parentNode(nodes[i]))) continue;
			}catch(e){continue;}

			if(this._isChildOf(nodes[i], curWrapper)) continue;

			curWrapper = this._getLineWrapper(nodes[i]);

			if(curWrapper == prevWrapper) continue;

			curWrapper = _setLineheight(curWrapper, height);

			prevWrapper = curWrapper;
		}

		endNode = curWrapper || startNode;

		setTimeout($Fn(function(startNode, endNode){
			this.oSelection.setEndNodes(startNode, endNode);
			this.oSelection.select();
			this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["LINEHEIGHT"]);
		}, this).bind(startNode, endNode), 100);
	},
	_getSelectedNodes : function(bDontUpdate){
		if(!bDontUpdate)
			this.oSelection = this.oApp.getSelection();

		if(this.oSelection.collapsed) this.oSelection.selectNode(this.oSelection.commonAncestorContainer);
			
		var nodes = this.oSelection.getTextNodes();

		if(nodes.length == 0){
			var tmp = this.oSelection.getStartNode();
			if(tmp){
				nodes[0] = tmp;
			}else{
				nodes = [];
			}
		}

		return nodes;
	},
	_getWrapperLineheight : function(div){
		var iLineHeight = '';
		if(div && div.style.lineHeight){
			iLineHeight = div.style.lineHeight;
		}else{
			div = this.oSelection.commonAncesterContainer;
			while(div && !this.oSelection.rxLineBreaker.test(div.tagName)){
				if(div && div.style.lineHeight){
					iLineHeight = div.style.lineHeight;
					break;
				}
				div = nhn.DOMFix.parentNode(div);
			}
		}

		return iLineHeight;
	},

	_isChildOf : function(node, container){
		while(node && node.tagName != "BODY"){
			if(node == container) return true;
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
			if(breakerA.tagName == "P" || breakerA.tagName == "DIV"){
				div = breakerA;
			}else{
				this.oSelection.setEndNodes(breakerA.firstChild, breakerA.lastChild);
			}
		}
		
		return div;
 	}
 });