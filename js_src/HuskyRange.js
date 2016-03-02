if(typeof window.nhn=='undefined') window.nhn = {};

/**
 * @fileOverview This file contains a cross-browser implementation of W3C's DOM Range
 * @name W3CDOMRange.js
 */
nhn.W3CDOMRange = $Class({
	$init : function(doc){
		this._document = doc || document;

		this.collapsed = true;
		this.commonAncestorContainer = this._document.body;
		this.endContainer = this._document.body;
		this.endOffset = 0;
		this.startContainer = this._document.body;
		this.startOffset = 0;
	},

	cloneContents : function(){
		var oClonedContents = this._document.createDocumentFragment();
		var oTmpContainer = this._document.createDocumentFragment();

		var aNodes = this._getNodesInRange();

		if(aNodes.length < 1) return oClonedContents;

		var oClonedContainers = this._constructClonedTree(aNodes, oTmpContainer);

		// oTopContainer = aNodes[aNodes.length-1].parentNode and this is not part of the initial array and only those child nodes should be cloned
		var oTopContainer = oTmpContainer.firstChild;

		if(oTopContainer){
			var elCurNode = oTopContainer.firstChild;
			var elNextNode;

			while(elCurNode){
				elNextNode = elCurNode.nextSibling;
				oClonedContents.appendChild(elCurNode);
				elCurNode = elNextNode;
			}
		}

		oClonedContainers = this._splitTextEndNodes({oStartContainer: oClonedContainers.oStartContainer, iStartOffset: this.startOffset, 
													oEndContainer: oClonedContainers.oEndContainer, iEndOffset: this.endOffset});

		if(oClonedContainers.oStartContainer && oClonedContainers.oStartContainer.previousSibling)
			nhn.DOMFix.parentNode(oClonedContainers.oStartContainer).removeChild(oClonedContainers.oStartContainer.previousSibling);

		if(oClonedContainers.oEndContainer && oClonedContainers.oEndContainer.nextSibling)
			nhn.DOMFix.parentNode(oClonedContainers.oEndContainer).removeChild(oClonedContainers.oEndContainer.nextSibling);

		return oClonedContents;
	},

	_constructClonedTree : function(aNodes, oClonedParentNode){
		var oClonedStartContainer = null;
		var oClonedEndContainer = null;

		var oStartContainer = this.startContainer;
		var oEndContainer = this.endContainer;

		_recurConstructClonedTree = function(aAllNodes, iCurIdx, oParentNode, oClonedParentNode){

			if(iCurIdx < 0) return iCurIdx;

			var iChildIdx = iCurIdx-1;

			var oCurNodeCloneWithChildren = aAllNodes[iCurIdx].cloneNode(false);

			if(aAllNodes[iCurIdx] == oStartContainer) oClonedStartContainer = oCurNodeCloneWithChildren;
			if(aAllNodes[iCurIdx] == oEndContainer) oClonedEndContainer = oCurNodeCloneWithChildren;

			while(iChildIdx >= 0 && nhn.DOMFix.parentNode(aAllNodes[iChildIdx]) == aAllNodes[iCurIdx]){
				iChildIdx = this._recurConstructClonedTree(aAllNodes, iChildIdx, aAllNodes[iCurIdx], oCurNodeCloneWithChildren, oClonedStartContainer, oClonedEndContainer);
			}

			// this may trigger an error message in IE when an erroneous script is inserted
			oClonedParentNode.insertBefore(oCurNodeCloneWithChildren, oClonedParentNode.firstChild);

			return iChildIdx;
		};

		aNodes[aNodes.length] = nhn.DOMFix.parentNode(aNodes[aNodes.length-1]);
		_recurConstructClonedTree(aNodes, aNodes.length-1, aNodes[aNodes.length-1], oClonedParentNode);

		return {oStartContainer: oClonedStartContainer, oEndContainer: oClonedEndContainer};
	},

	cloneRange : function(){
		return this._copyRange(new nhn.W3CDOMRange(this._document));
	},

	_copyRange : function(oClonedRange){
		oClonedRange.collapsed = this.collapsed;
		oClonedRange.commonAncestorContainer = this.commonAncestorContainer;
		oClonedRange.endContainer = this.endContainer;
		oClonedRange.endOffset = this.endOffset;
		oClonedRange.startContainer = this.startContainer;
		oClonedRange.startOffset = this.startOffset;
		oClonedRange._document = this._document;
		
		return oClonedRange;
	},

	collapse : function(toStart){
		if(toStart){
			this.endContainer = this.startContainer;
			this.endOffset = this.startOffset;
		}else{
			this.startContainer = this.endContainer;
			this.startOffset = this.endOffset;
		}

		this._updateRangeInfo();
	},

	compareBoundaryPoints : function(how, sourceRange){
		switch(how){
			case nhn.W3CDOMRange.START_TO_START:
				return this._compareEndPoint(this.startContainer, this.startOffset, sourceRange.startContainer, sourceRange.startOffset);
			case nhn.W3CDOMRange.START_TO_END:
				return this._compareEndPoint(this.endContainer, this.endOffset, sourceRange.startContainer, sourceRange.startOffset);
			case nhn.W3CDOMRange.END_TO_END:
				return this._compareEndPoint(this.endContainer, this.endOffset, sourceRange.endContainer, sourceRange.endOffset);
			case nhn.W3CDOMRange.END_TO_START:
				return this._compareEndPoint(this.startContainer, this.startOffset, sourceRange.endContainer, sourceRange.endOffset);
		}
	},

	_findBody : function(oNode){
		if(!oNode) return null;
		while(oNode){
			if(oNode.tagName == "BODY") return oNode;
			oNode = nhn.DOMFix.parentNode(oNode);
		}
		return null;
	},

	_compareEndPoint : function(oContainerA, iOffsetA, oContainerB, iOffsetB){
		var iIdxA, iIdxB;

		if(!oContainerA || this._findBody(oContainerA) != this._document.body){
			oContainerA = this._document.body;
			iOffsetA = 0;
		}

		if(!oContainerB || this._findBody(oContainerB) != this._document.body){
			oContainerB = this._document.body;
			iOffsetB = 0;
		}

		var compareIdx = function(iIdxA, iIdxB){
			// iIdxX == -1 when the node is the commonAncestorNode
			// if iIdxA == -1
			// -> [[<nodeA>...<nodeB></nodeB>]]...</nodeA>
			// if iIdxB == -1
			// -> <nodeB>...[[<nodeA></nodeA>...</nodeB>]]
			if(iIdxB == -1) iIdxB = iIdxA+1;
			if(iIdxA < iIdxB) return -1;
			if(iIdxA == iIdxB) return 0;
			return 1;
		};

		var oCommonAncestor = this._getCommonAncestorContainer(oContainerA, oContainerB);

		// ================================================================================================================================================
		//  Move up both containers so that both containers are direct child nodes of the common ancestor node. From there, just compare the offset
		// Add 0.5 for each contaienrs that has "moved up" since the actual node is wrapped by 1 or more parent nodes and therefore its position is somewhere between idx & idx+1
		// <COMMON_ANCESTOR>NODE1<P>NODE2</P>NODE3</COMMON_ANCESTOR>
		// The position of NODE2 in COMMON_ANCESTOR is somewhere between after NODE1(idx1) and before NODE3(idx2), so we let that be 1.5

		// container node A in common ancestor container
		var oNodeA = oContainerA;
		if(oNodeA != oCommonAncestor){
			while((oTmpNode = nhn.DOMFix.parentNode(oNodeA)) != oCommonAncestor){oNodeA = oTmpNode;}
			
			iIdxA = this._getPosIdx(oNodeA)+0.5;
		}else iIdxA = iOffsetA;
		
		// container node B in common ancestor container
		var oNodeB = oContainerB;
		if(oNodeB != oCommonAncestor){
			while((oTmpNode = nhn.DOMFix.parentNode(oNodeB)) != oCommonAncestor){oNodeB = oTmpNode;}
			
			iIdxB = this._getPosIdx(oNodeB)+0.5;
		}else iIdxB = iOffsetB;

		return compareIdx(iIdxA, iIdxB);
	},

	_getCommonAncestorContainer : function(oNode1, oNode2){
		var oComparingNode = oNode2;

		while(oNode1){
			while(oComparingNode){
				if(oNode1 == oComparingNode) return oNode1;
				oComparingNode = nhn.DOMFix.parentNode(oComparingNode);
			}
			oComparingNode = oNode2;
			oNode1 = nhn.DOMFix.parentNode(oNode1);
		}

		return this._document.body;
	},

	deleteContents : function(){
		if(this.collapsed) return;

		this._splitTextEndNodesOfTheRange();

		var aNodes = this._getNodesInRange();

		if(aNodes.length < 1) return;

		var oPrevNode = aNodes[0].previousSibling;
		while(oPrevNode && this._isBlankTextNode(oPrevNode)) oPrevNode = oPrevNode.previousSibling;
		
		var oNewStartContainer, iNewOffset;
		if(!oPrevNode){
			oNewStartContainer = nhn.DOMFix.parentNode(aNodes[0]);
			iNewOffset = 0;
		}

		for(var i=0; i<aNodes.length; i++){
			var oNode = aNodes[i];
			if(!oNode.firstChild){
				if(oNewStartContainer == oNode){
					iNewOffset = this._getPosIdx(oNewStartContainer);
					oNewStartContainer = nhn.DOMFix.parentNode(oNode);
				}
				nhn.DOMFix.parentNode(oNode).removeChild(oNode);
			}
		}

		if(!oPrevNode){
			this.setStart(oNewStartContainer, iNewOffset);
		}else{
			if(oPrevNode.tagName == "BODY")
				this.setStartBefore(oPrevNode);
			else
				this.setStartAfter(oPrevNode);
		}

		this.collapse(true);
	},

	extractContents : function(){
		var oClonedContents = this.cloneContents();
		this.deleteContents();
		return oClonedContents;
	},

	insertNode : function(newNode){
		var oFirstNode = null;

		var oParentContainer;

		if(this.startContainer.nodeType == "3"){
			oParentContainer = nhn.DOMFix.parentNode(this.startContainer);
			if(this.startContainer.nodeValue.length <= this.startOffset)
				oFirstNode = this.startContainer.nextSibling;
			else
				oFirstNode = this.startContainer.splitText(this.startOffset);
		}else{
			oParentContainer = this.startContainer;
			oFirstNode = nhn.DOMFix.childNodes(this.startContainer)[this.startOffset];
		}

		if(!oFirstNode || !nhn.DOMFix.parentNode(oFirstNode)) oFirstNode = null;

		oParentContainer.insertBefore(newNode, oFirstNode);

		this.setStartBefore(newNode);
	},

	selectNode : function(refNode){
		this.setStartBefore(refNode);
		this.setEndAfter(refNode);
	},

	selectNodeContents : function(refNode){
		this.setStart(refNode, 0);
		this.setEnd(refNode, nhn.DOMFix.childNodes(refNode).length);
	},

	_endsNodeValidation : function(oNode, iOffset){
		if(!oNode || this._findBody(oNode) != this._document.body) throw new Error("INVALID_NODE_TYPE_ERR oNode is not part of current document");

		if(oNode.nodeType == 3){
			if(iOffset > oNode.nodeValue.length) iOffset = oNode.nodeValue.length;
		}else{
			if(iOffset > nhn.DOMFix.childNodes(oNode).length) iOffset = nhn.DOMFix.childNodes(oNode).length;
		}

		return iOffset;
	},
	

	setEnd : function(refNode, offset){
		offset = this._endsNodeValidation(refNode, offset);

		this.endContainer = refNode;
		this.endOffset = offset;
		if(!this.startContainer || this._compareEndPoint(this.startContainer, this.startOffset, this.endContainer, this.endOffset) != -1) this.collapse(false);

		this._updateRangeInfo();
	},

	setEndAfter : function(refNode){
		if(!refNode) throw new Error("INVALID_NODE_TYPE_ERR in setEndAfter");

		if(refNode.tagName == "BODY"){
			this.setEnd(refNode, nhn.DOMFix.childNodes(refNode).length);
			return;
		}
		this.setEnd(nhn.DOMFix.parentNode(refNode), this._getPosIdx(refNode)+1);
	},

	setEndBefore : function(refNode){
		if(!refNode) throw new Error("INVALID_NODE_TYPE_ERR in setEndBefore");

		if(refNode.tagName == "BODY"){
			this.setEnd(refNode, 0);
			return;
		}

		this.setEnd(nhn.DOMFix.parentNode(refNode), this._getPosIdx(refNode));
	},

	setStart : function(refNode, offset){
		offset = this._endsNodeValidation(refNode, offset);

		this.startContainer = refNode;
		this.startOffset = offset;

		if(!this.endContainer || this._compareEndPoint(this.startContainer, this.startOffset, this.endContainer, this.endOffset) != -1) this.collapse(true);
		this._updateRangeInfo();
	},

	setStartAfter : function(refNode){
		if(!refNode) throw new Error("INVALID_NODE_TYPE_ERR in setStartAfter");

		if(refNode.tagName == "BODY"){
			this.setStart(refNode, nhn.DOMFix.childNodes(refNode).length);
			return;
		}

		this.setStart(nhn.DOMFix.parentNode(refNode), this._getPosIdx(refNode)+1);
	},

	setStartBefore : function(refNode){
		if(!refNode) throw new Error("INVALID_NODE_TYPE_ERR in setStartBefore");

		if(refNode.tagName == "BODY"){
			this.setStart(refNode, 0);
			return;
		}
		this.setStart(nhn.DOMFix.parentNode(refNode), this._getPosIdx(refNode));
	},

	surroundContents : function(newParent){
		newParent.appendChild(this.extractContents());
		this.insertNode(newParent);
		this.selectNode(newParent);
	},

	toString : function(){
		var oTmpContainer = this._document.createElement("DIV");
		oTmpContainer.appendChild(this.cloneContents());

		return oTmpContainer.textContent || oTmpContainer.innerText || "";
	},

	_isBlankTextNode : function(oNode){
		if(oNode.nodeType == 3 && oNode.nodeValue == "") return true;
		return false;
	},
	
	_getPosIdx : function(refNode){
		var idx = 0;
		for(var node = refNode.previousSibling; node; node = node.previousSibling) idx++;

		return idx;
	},

	_updateRangeInfo : function(){
		if(!this.startContainer){
			this.init(this._document);
			return;
		}
		
		this.collapsed = this._isCollapsed(this.startContainer, this.startOffset, this.endContainer, this.endOffset);

		this.commonAncestorContainer = this._getCommonAncestorContainer(this.startContainer, this.endContainer);
	},
	
	_isCollapsed : function(oStartContainer, iStartOffset, oEndContainer, iEndOffset){
		var bCollapsed = false;

		if(oStartContainer == oEndContainer && iStartOffset == iEndOffset){
			bCollapsed = true;
		}else{
			var oActualStartNode = this._getActualStartNode(oStartContainer, iStartOffset);
			var oActualEndNode = this._getActualEndNode(oEndContainer, iEndOffset);

			// Take the parent nodes on the same level for easier comparison when they're next to each other
			// eg) From
			//	<A>
			//		<B>
			//			<C>
			//			</C>
			//		</B>
			//		<D>
			//			<E>
			//				<F>
			//				</F>
			//			</E>
			//		</D>
			//	</A>
			//	, it's easier to compare the position of B and D rather than C and F because they are siblings
			//
			// If the range were collapsed, oActualEndNode will precede oActualStartNode by doing this
			oActualStartNode = this._getNextNode(this._getPrevNode(oActualStartNode));
			oActualEndNode = this._getPrevNode(this._getNextNode(oActualEndNode));

			if(oActualStartNode && oActualEndNode && oActualEndNode.tagName != "BODY" && 
				(this._getNextNode(oActualEndNode) == oActualStartNode || (oActualEndNode == oActualStartNode && this._isBlankTextNode(oActualEndNode)))
			)
				bCollapsed = true;
		}
		
		return bCollapsed;
	},

	_splitTextEndNodesOfTheRange : function(){
		var oEndPoints = this._splitTextEndNodes({oStartContainer: this.startContainer, iStartOffset: this.startOffset, 
													oEndContainer: this.endContainer, iEndOffset: this.endOffset});

		this.startContainer = oEndPoints.oStartContainer;
		this.startOffset = oEndPoints.iStartOffset;

		this.endContainer = oEndPoints.oEndContainer;
		this.endOffset = oEndPoints.iEndOffset;
	},

	_splitTextEndNodes : function(oEndPoints){
		oEndPoints = this._splitStartTextNode(oEndPoints);
		oEndPoints = this._splitEndTextNode(oEndPoints);

		return oEndPoints;
	},

	_splitStartTextNode : function(oEndPoints){
		var oStartContainer = oEndPoints.oStartContainer;
		var iStartOffset = oEndPoints.iStartOffset;

		var oEndContainer = oEndPoints.oEndContainer;
		var iEndOffset = oEndPoints.iEndOffset;

		if(!oStartContainer) return oEndPoints;
		if(oStartContainer.nodeType != 3) return oEndPoints;
		if(iStartOffset == 0) return oEndPoints;

		if(oStartContainer.nodeValue.length <= iStartOffset) return oEndPoints;

		var oLastPart = oStartContainer.splitText(iStartOffset);

		if(oStartContainer == oEndContainer){
			iEndOffset -= iStartOffset;
			oEndContainer = oLastPart;
		}
		oStartContainer = oLastPart;
		iStartOffset = 0;

		return {oStartContainer: oStartContainer, iStartOffset: iStartOffset, oEndContainer: oEndContainer, iEndOffset: iEndOffset};
	},

	_splitEndTextNode : function(oEndPoints){
		var oStartContainer = oEndPoints.oStartContainer;
		var iStartOffset = oEndPoints.iStartOffset;

		var oEndContainer = oEndPoints.oEndContainer;
		var iEndOffset = oEndPoints.iEndOffset;

		if(!oEndContainer) return oEndPoints;
		if(oEndContainer.nodeType != 3) return oEndPoints;

		if(iEndOffset >= oEndContainer.nodeValue.length) return oEndPoints;
		if(iEndOffset == 0) return oEndPoints;

		oEndContainer.splitText(iEndOffset);

		return {oStartContainer: oStartContainer, iStartOffset: iStartOffset, oEndContainer: oEndContainer, iEndOffset: iEndOffset};
	},
	
	_getNodesInRange : function(){
		if(this.collapsed) return [];

		var oStartNode = this._getActualStartNode(this.startContainer, this.startOffset);
		var oEndNode = this._getActualEndNode(this.endContainer, this.endOffset);

		return this._getNodesBetween(oStartNode, oEndNode);
	},

	_getActualStartNode : function(oStartContainer, iStartOffset){
		var oStartNode = oStartContainer;;

		if(oStartContainer.nodeType == 3){
			if(iStartOffset >= oStartContainer.nodeValue.length){
				oStartNode = this._getNextNode(oStartContainer);
				if(oStartNode.tagName == "BODY") oStartNode = null;
			}else{
				oStartNode = oStartContainer;
			}
		}else{
			if(iStartOffset < nhn.DOMFix.childNodes(oStartContainer).length){
				oStartNode = nhn.DOMFix.childNodes(oStartContainer)[iStartOffset];
			}else{
				oStartNode = this._getNextNode(oStartContainer);
				if(oStartNode.tagName == "BODY") oStartNode = null;
			}
		}

		return oStartNode;
	},

	_getActualEndNode : function(oEndContainer, iEndOffset){
		var oEndNode = oEndContainer;

		if(iEndOffset == 0){
			oEndNode = this._getPrevNode(oEndContainer);
			if(oEndNode.tagName == "BODY") oEndNode = null;
		}else if(oEndContainer.nodeType == 3){
			oEndNode = oEndContainer;
		}else{
			oEndNode = nhn.DOMFix.childNodes(oEndContainer)[iEndOffset-1];
		}

		return oEndNode;
	},

	_getNextNode : function(oNode){
		if(!oNode || oNode.tagName == "BODY") return this._document.body;

		if(oNode.nextSibling) return oNode.nextSibling;
		
		return this._getNextNode(nhn.DOMFix.parentNode(oNode));
	},

	_getPrevNode : function(oNode){
		if(!oNode || oNode.tagName == "BODY") return this._document.body;

		if(oNode.previousSibling) return oNode.previousSibling;
		
		return this._getPrevNode(nhn.DOMFix.parentNode(oNode));
	},

	// includes partially selected
	// for <div id="a"><div id="b"></div></div><div id="c"></div>, _getNodesBetween(b, c) will yield to b, "a" and c
	_getNodesBetween : function(oStartNode, oEndNode){
		var aNodesBetween = [];
		this._nNodesBetweenLen = 0;

		if(!oStartNode || !oEndNode) return aNodesBetween;

		this._recurGetNextNodesUntil(oStartNode, oEndNode, aNodesBetween);
		return aNodesBetween;
	},

	_recurGetNextNodesUntil : function(oNode, oEndNode, aNodesBetween){
		if(!oNode) return false;

		if(!this._recurGetChildNodesUntil(oNode, oEndNode, aNodesBetween)) return false;

		var oNextToChk = oNode.nextSibling;
		
		while(!oNextToChk){
			if(!(oNode = nhn.DOMFix.parentNode(oNode))) return false;

			aNodesBetween[this._nNodesBetweenLen++] = oNode;

			if(oNode == oEndNode) return false;

			oNextToChk = oNode.nextSibling;
		}

		return this._recurGetNextNodesUntil(oNextToChk, oEndNode, aNodesBetween);
	},

	_recurGetChildNodesUntil : function(oNode, oEndNode, aNodesBetween){
		if(!oNode) return false;

		var bEndFound = false;
		var oCurNode = oNode;
		if(oCurNode.firstChild){
			oCurNode = oCurNode.firstChild;
			while(oCurNode){
				if(!this._recurGetChildNodesUntil(oCurNode, oEndNode, aNodesBetween)){
					bEndFound = true;
					break;
				}
				oCurNode = oCurNode.nextSibling;
			}
		}

		aNodesBetween[this._nNodesBetweenLen++] = oNode;

		if(bEndFound) return false;
		if(oNode == oEndNode) return false;

		return true;
	}
});

nhn.W3CDOMRange.START_TO_START = 0;
nhn.W3CDOMRange.START_TO_END = 1;
nhn.W3CDOMRange.END_TO_END = 2;
nhn.W3CDOMRange.END_TO_START = 3;


/**
 * @fileOverview This file contains a cross-browser function that implements all of the W3C's DOM Range specification and some more
 * @name HuskyRange.js
 */
nhn.HuskyRange = $Class({
	setWindow : function(win){
		this._window = win;
		this._document = win.document;
	},

	$init : function(win){
		this.HUSKY_BOOMARK_START_ID_PREFIX = "husky_bookmark_start_";
		this.HUSKY_BOOMARK_END_ID_PREFIX = "husky_bookmark_end_";

		this.sBlockElement = "P|DIV|LI|H[1-6]|PRE";
		this.sBlockContainer = "BODY|TABLE|TH|TR|TD|UL|OL|BLOCKQUOTE|FORM";

		this.rxBlockElement = new RegExp("^("+this.sBlockElement+")$");
		this.rxBlockContainer = new RegExp("^("+this.sBlockContainer+")$")
		this.rxLineBreaker = new RegExp("^("+this.sBlockElement+"|"+this.sBlockContainer+")$")

		this.setWindow(win);

		this.oSimpleSelection = new nhn.SimpleSelection(this._window);
		this.selectionLoaded = this.oSimpleSelection.selectionLoaded;
		
		this.$super.$init(this._document);
	},

	select : function(){
		this.oSimpleSelection.selectRange(this);
	},

	setFromSelection : function(iNum){
		this.setRange(this.oSimpleSelection.getRangeAt(iNum));
	},

	setRange : function(oW3CRange){
		this.setStart(oW3CRange.startContainer, oW3CRange.startOffset);
		this.setEnd(oW3CRange.endContainer, oW3CRange.endOffset);
	},

	setEndNodes : function(oSNode, oENode){
		this.setEndAfter(oENode);
		this.setStartBefore(oSNode);
	},
	
	splitTextAtBothEnds : function(){
		this._splitTextEndNodesOfTheRange();
	},

	getStartNode : function(){
		if(this.collapsed){
			if(this.startContainer.nodeType == 3){
				if(this.startOffset == 0) return null;
				if(this.startContainer.nodeValue.length <= this.startOffset) return null;
				return this.startContainer;
			}
			return null;
		}
		
		if(this.startContainer.nodeType == 3){
			if(this.startOffset >= this.startContainer.nodeValue.length) return this._getNextNode(this.startContainer);
			return this.startContainer;
		}else{
			if(this.startOffset >= nhn.DOMFix.childNodes(this.startContainer).length) return this._getNextNode(this.startContainer);
			return nhn.DOMFix.childNodes(this.startContainer)[this.startOffset];
		}
	},
	
	getEndNode : function(){
		if(this.collapsed) return this.getStartNode();
		
		if(this.endContainer.nodeType == 3){
			if(this.endOffset == 0) return this._getPrevNode(this.endContainer);
			return this.endContainer;
		}else{
			if(this.endOffset == 0) return this._getPrevNode(this.endContainer);
			return nhn.DOMFix.childNodes(this.endContainer)[this.endOffset-1];
		}
	},

	getNodeAroundRange : function(bBefore, bStrict){
		if(this.collapsed && this.startContainer && this.startContainer.nodeType == 3) return this.startContainer;
		if(!this.collapsed || (this.startContainer && this.startContainer.nodeType == 3)) return this.getStartNode();

		var oBeforeRange, oAfterRange, oResult;

		if(this.startOffset >= nhn.DOMFix.childNodes(this.startContainer).length)
			oAfterRange = this._getNextNode(this.startContainer);
		else
			oAfterRange = nhn.DOMFix.childNodes(this.startContainer)[this.startOffset];

		if(this.endOffset == 0)
			oBeforeRange = this._getPrevNode(this.endContainer);
		else
			oBeforeRange = nhn.DOMFix.childNodes(this.endContainer)[this.endOffset-1];

		if(bBefore){
			oResult = oBeforeRange;
			if(!oResult && !bStrict) oResult = oAfterRange;
		}else{
			oResult = oAfterRange;
			if(!oResult && !bStrict) oResult = oBeforeRange;
		}

		return oResult;
	},

	_getXPath : function(elNode){
		var sXPath = "";
		
		while(elNode && elNode.nodeType == 1){
			sXPath = "/" + elNode.tagName+"["+this._getPosIdx4XPath(elNode)+"]" + sXPath;
			elNode = nhn.DOMFix.parentNode(elNode);
		}
		
		return sXPath;
	},
	
	_getPosIdx4XPath : function(refNode){
		var idx = 0;
		for(var node = refNode.previousSibling; node; node = node.previousSibling)
			if(node.tagName == refNode.tagName) idx++;

		return idx;
	},
	
	// this was written specifically for XPath Bookmark and it may not perform correctly for general purposes
	_evaluateXPath : function(sXPath, oDoc){
		sXPath = sXPath.substring(1, sXPath.length-1);
		var aXPath = sXPath.split(/\//);
		var elNode = oDoc.body;

		for(var i=2; i<aXPath.length && elNode; i++){
			aXPath[i].match(/([^\[]+)\[(\d+)/i);
			var sTagName = RegExp.$1;
			var nIdx = RegExp.$2;

			var aAllNodes = nhn.DOMFix.childNodes(elNode);
			var aNodes = [];
			var nLength = aAllNodes.length;
			var nCount = 0;
			for(var ii=0; ii<nLength; ii++){
				if(aAllNodes[ii].tagName == sTagName) aNodes[nCount++] = aAllNodes[ii];
			}

			if(aNodes.length < nIdx)
				elNode = null;
			else
				elNode = aNodes[nIdx];
		}

		return elNode;
	},

	_evaluateXPathBookmark : function(oBookmark){
		var sXPath = oBookmark["sXPath"];
		var nTextNodeIdx = oBookmark["nTextNodeIdx"];
		var nOffset = oBookmark["nOffset"];

		var elContainer = this._evaluateXPath(sXPath, this._document);

		if(nTextNodeIdx > -1 && elContainer){
			var aChildNodes = nhn.DOMFix.childNodes(elContainer);
			var elNode = null;
			
			var nIdx = nTextNodeIdx;
			var nOffsetLeft = nOffset;
			
			while((elNode = aChildNodes[nIdx]) && elNode.nodeType == 3 && elNode.nodeValue.length < nOffsetLeft){
				nOffsetLeft -= elNode.nodeValue.length;
				nIdx++;
			}
			
			elContainer = nhn.DOMFix.childNodes(elContainer)[nIdx];
			nOffset = nOffsetLeft;
		}

		if(!elContainer){
			elContainer = this._document.body;
			nOffset = 0;
		}
		return {elContainer: elContainer, nOffset: nOffset};
	},
	
	// this was written specifically for XPath Bookmark and it may not perform correctly for general purposes
	getXPathBookmark : function(){
		var nTextNodeIdx1 = -1;
		var htEndPt1 = {elContainer: this.startContainer, nOffset: this.startOffset};
		var elNode1 = this.startContainer;
		if(elNode1.nodeType == 3){
			htEndPt1 = this._getFixedStartTextNode();
			nTextNodeIdx1 = this._getPosIdx(htEndPt1.elContainer);
			elNode1 = nhn.DOMFix.parentNode(elNode1);
		}
		var sXPathNode1 = this._getXPath(elNode1);
		var oBookmark1 = {sXPath:sXPathNode1, nTextNodeIdx:nTextNodeIdx1, nOffset: htEndPt1.nOffset};
		
		var nTextNodeIdx2 = -1;
		var htEndPt2 = {elContainer: this.endContainer, nOffset: this.endOffset};
		var elNode2 = this.endContainer;
		if(elNode2.nodeType == 3){
			htEndPt2 = this._getFixedEndTextNode();
			nTextNodeIdx2 = this._getPosIdx(htEndPt2.elContainer);
			elNode2 = nhn.DOMFix.parentNode(elNode2);
		}
		var sXPathNode2 = this._getXPath(elNode2);
		var oBookmark2 = {sXPath:sXPathNode2, nTextNodeIdx:nTextNodeIdx2, nOffset: htEndPt2.nOffset};

		return [oBookmark1, oBookmark2];
	},
	
	moveToXPathBookmark : function(aBookmark){
		if(!aBookmark) return;

		var oBookmarkInfo1 = this._evaluateXPathBookmark(aBookmark[0]);
		var oBookmarkInfo2 = this._evaluateXPathBookmark(aBookmark[1]);

		if(!oBookmarkInfo1["elContainer"] || !oBookmarkInfo2["elContainer"]) return;

		this.startContainer = oBookmarkInfo1["elContainer"];
		this.startOffset = oBookmarkInfo1["nOffset"];

		this.endContainer = oBookmarkInfo2["elContainer"];
		this.endOffset = oBookmarkInfo2["nOffset"];
	},
	
	_getFixedTextContainer : function(elNode, nOffset){
		while(elNode && elNode.nodeType == 3 && elNode.previousSibling && elNode.previousSibling.nodeType == 3){
			nOffset += elNode.previousSibling.nodeValue.length;
			elNode = elNode.previousSibling;
		}
		
		return {elContainer:elNode, nOffset:nOffset};
	},
	
	_getFixedStartTextNode : function(){
		return this._getFixedTextContainer(this.startContainer, this.startOffset);
	},
	
	_getFixedEndTextNode : function(){
		return this._getFixedTextContainer(this.endContainer, this.endOffset);
	},
	
	placeStringBookmark : function(){
		var sTmpId = (new Date()).getTime();

		var oInsertionPoint = this.cloneRange();
		oInsertionPoint.collapseToEnd();
		var oEndMarker = this._document.createElement("A");
		oEndMarker.id = this.HUSKY_BOOMARK_END_ID_PREFIX+sTmpId;
		oInsertionPoint.insertNode(oEndMarker);

		var oInsertionPoint = this.cloneRange();
		oInsertionPoint.collapseToStart();
		var oStartMarker = this._document.createElement("A");
		oStartMarker.id = this.HUSKY_BOOMARK_START_ID_PREFIX+sTmpId;
		oInsertionPoint.insertNode(oStartMarker);

		this.moveToBookmark(sTmpId);

		return sTmpId;
	},

	cloneRange : function(){
		return this._copyRange(new nhn.HuskyRange(this._window));
	},

	moveToBookmark : function(vBookmark){
		if(typeof(vBookmark) != "object")
			this.moveToStringBookmark(vBookmark);
		else
			this.moveToXPathBookmark(vBookmark);
	},

	moveToStringBookmark : function(sBookmarkID){
		var oStartMarker = this._document.getElementById(this.HUSKY_BOOMARK_START_ID_PREFIX+sBookmarkID);
		var oEndMarker = this._document.getElementById(this.HUSKY_BOOMARK_END_ID_PREFIX+sBookmarkID);

		if(!oStartMarker || !oEndMarker) return;

		this.setEndBefore(oEndMarker);
		this.setStartAfter(oStartMarker);
	},

	removeStringBookmark : function(sBookmarkID){
		var oStartMarker = this._document.getElementById(this.HUSKY_BOOMARK_START_ID_PREFIX+sBookmarkID);
		var oEndMarker = this._document.getElementById(this.HUSKY_BOOMARK_END_ID_PREFIX+sBookmarkID);

		if(oStartMarker) nhn.DOMFix.parentNode(oStartMarker).removeChild(oStartMarker);
		if(oEndMarker) nhn.DOMFix.parentNode(oEndMarker).removeChild(oEndMarker);
	},

	collapseToStart : function(){
		this.collapse(true);
	},
	
	collapseToEnd : function(){
		this.collapse(false);
	},

	createAndInsertNode : function(sTagName){
		tmpNode = this._document.createElement(tagName);
		this.insertNode(tmpNode)
		return tmpNode
	},

	getNodes : function(bSplitTextEndNodes, fnFilter){
		if(bSplitTextEndNodes) this._splitTextEndNodesOfTheRange();

		var aAllNodes = this._getNodesInRange();
		var aFilteredNodes = [];

		if(!fnFilter) return aAllNodes;

		for(var i=0; i<aAllNodes.length; i++)
			if(fnFilter(aAllNodes[i])) aFilteredNodes[aFilteredNodes.length] = aAllNodes[i];

		return aFilteredNodes;
	},

	getTextNodes : function(bSplitTextEndNodes){
		var txtFilter = function(oNode){
			if (oNode.nodeType == 3 && oNode.nodeValue != "\n" && oNode.nodeValue != "")
				return true;
			else
				return false;
		}

		return this.getNodes(bSplitTextEndNodes, txtFilter);
	},

	surroundContentsWithNewNode : function(sTagName){
		var oNewParent = this._document.createElement(sTagName);
		this.surroundContents(oNewParent);
		return oNewParent;
	},

	isRangeinRange : function(oAnoterRange, bIncludePartlySelected){
		var startToStart = this.compareBoundaryPoints(this.START_TO_START, oAnoterRange);
		var startToEnd = this.compareBoundaryPoints(this.START_TO_END, oAnoterRange);
		var endToStart = this.compareBoundaryPoints(this.END_TO_START, oAnoterRange);
		var endToEnd = this.compareBoundaryPoints(this.END_TO_END, oAnoterRange);

		if(startToStart <= 0 && endToEnd >= 0) return true;

		if(bIncludePartlyIncluded){
			if(startToEnd == 1) return false;
			if(endToStart == -1) return false;
			return true;
		}

		return false;
	},

	isNodeInRange : function(oNode, bIncludePartlySelected, bContentOnly){
		var oTmpRange = new nhn.HuskyRange(this._window);

		if(bContentOnly && oNode.firstChild){
			oTmpRange.setStartBefore(oNode.firstChild);
			oTmpRange.setEndAfter(oNode.lastChild);
		}else{
			oTmpRange.selectNode(oNode);
		}

		return isRangeInRange(oTmpRange, bIncludePartlySelected);
	},		

	pasteHTML : function(sHTML){
		if(sHTML == ""){
			this.deleteContents();
			return;
		}
		
		var oTmpDiv = this._document.createElement("DIV");
		oTmpDiv.innerHTML = sHTML;

		var oFirstNode = oTmpDiv.firstChild;
		var oLastNode = oTmpDiv.lastChild;

		var clone = this.cloneRange();
		var sBM = clone.placeStringBookmark();

		while(oTmpDiv.lastChild) this.insertNode(oTmpDiv.lastChild);

		this.setEndNodes(oFirstNode, oLastNode);

		// delete the content later as deleting it first may mass up the insertion point
		// eg) <p>[A]BCD</p> ---paste O---> O<p>BCD</p>
		clone.moveToBookmark(sBM);
		clone.deleteContents();
		clone.removeStringBookmark(sBM);
	},
	
	toString : function(){
		this.toString = nhn.W3CDOMRange.prototype.toString;
		return this.toString();
	},
	
	toHTMLString : function(){
		var oTmpContainer = this._document.createElement("DIV");
		oTmpContainer.appendChild(this.cloneContents());

		return oTmpContainer.innerHTML;
	},

	findAncestorByTagName : function(sTagName){
		var oNode = this.commonAncestorContainer;
		while(oNode && oNode.tagName != sTagName) oNode = nhn.DOMFix.parentNode(oNode);
		
		return oNode;
	},

	selectNodeContents : function(oNode){
		if(!oNode) return;

		var oFirstNode = oNode.firstChild?oNode.firstChild:oNode;
		var oLastNode = oNode.lastChild?oNode.lastChild:oNode;

		if(oFirstNode.nodeType == 3)
			this.setStart(oFirstNode, 0);
		else
			this.setStartBefore(oFirstNode);
		
		if(oLastNode.nodeType == 3)
			this.setEnd(oLastNode, oLastNode.nodeValue.length);
		else
			this.setEndAfter(oLastNode);
	},

	styleRange : function(oStyle, oAttribute, sNewSpanMarker){
		var aStyleParents = this._getStyleParentNodes(sNewSpanMarker);
		if(aStyleParents.length < 1) return;

		var sName, sValue;

		for(var i=0; i<aStyleParents.length; i++){
			for(var x in oStyle){
				sName = x;
				sValue = oStyle[sName];

				if(typeof sValue != "string") continue;

				aStyleParents[i].style[sName] = sValue;
			}

			if(!oAttribute) continue;

			for(var x in oAttribute){
				sName = x;
				sValue = oAttribute[sName];

				if(typeof sValue != "string") continue;
				
				if(sName == "class"){
					$Element(aStyleParents[i]).addClass(sValue);
				}else{
					aStyleParents[i].setAttribute(sName, sValue);
				}
			}
		}

		this.setStartBefore(aStyleParents[0]);
		this.setEndAfter(aStyleParents[aStyleParents.length-1]);
	},

	_getStyleParentNodes : function(sNewSpanMarker){
		this._splitTextEndNodesOfTheRange();

		var oSNode = this.getStartNode();
		var oENode = this.getEndNode();

		var aAllNodes = this._getNodesInRange();
		var aResult = [];
		var nResult = 0;

		var oNode, oTmpNode, iStartRelPos, iEndRelPos, oSpan, iSIdx, iEIdx;
		var nInitialLength = aAllNodes.length;
		var arAllBottmNodes = $A(aAllNodes).filter(function(v){return (!v.firstChild);});

		for(var i=0; i<nInitialLength; i++){
			oNode = aAllNodes[i];

			if(!oNode) continue;
			if(oNode.nodeType != 3) continue;
			if(oNode.nodeValue == "") continue;

			var oParentNode = nhn.DOMFix.parentNode(oNode);

			if(oParentNode.tagName == "SPAN"){
				// check if the SPAN element is fully contained
				// do quick checks before trying indexOf() because indexOf() function is very slow
				oTmpNode = this._getVeryFirstRealChild(oParentNode);
				if(oTmpNode == oNode) iSIdx = 1;
				else iSIdx = arAllBottmNodes.indexOf(oTmpNode);

				if(iSIdx != -1){
					oTmpNode = this._getVeryLastRealChild(oParentNode);
					if(oTmpNode == oNode) iEIdx = 1;
					else iEIdx = arAllBottmNodes.indexOf(oTmpNode);
				}

				if(iSIdx != -1 && iEIdx != -1){
					aResult[nResult++] = oParentNode;
					continue;
				}
			}

			oSpan = this._document.createElement("SPAN");
			oParentNode.insertBefore(oSpan, oNode);
			oSpan.appendChild(oNode);
			aResult[nResult++] = oSpan;
			
			if(sNewSpanMarker) oSpan.setAttribute(sNewSpanMarker, "true");
		}

		this.setStartBefore(oSNode);
		this.setEndAfter(oENode);

		return aResult;
	},
	
	_getVeryFirstChild : function(oNode){
		if(oNode.firstChild) return this._getVeryFirstChild(oNode.firstChild);
		return oNode;
	},

	_getVeryLastChild : function(oNode){
		if(oNode.lastChild) return this._getVeryLastChild(oNode.lastChild);
		return oNode;
	},

	_getFirstRealChild : function(oNode){
		var oFirstNode = oNode.firstChild;
		while(oFirstNode && oFirstNode.nodeType == 3 && oFirstNode.nodeValue == "") oFirstNode = oFirstNode.nextSibling;

		return oFirstNode;
	},
	
	_getLastRealChild : function(oNode){
		var oLastNode = oNode.lastChild;
		while(oLastNode && oLastNode.nodeType == 3 && oLastNode.nodeValue == "") oLastNode = oLastNode.previousSibling;

		return oLastNode;
	},
	
	_getVeryFirstRealChild : function(oNode){
		var oFirstNode = this._getFirstRealChild(oNode);
		if(oFirstNode) return this._getVeryFirstRealChild(oFirstNode);
		return oNode;
	},
	_getVeryLastRealChild : function(oNode){
		var oLastNode = this._getLastRealChild(oNode);
		if(oLastNode) return this._getVeryLastChild(oLastNode);
		return oNode;
	},

	_getLineStartInfo : function(node){
		var frontEndFinal = null;
		var frontEnd = node;
		var lineBreaker = node;
		var bParentBreak = true;

		var rxLineBreaker = this.rxLineBreaker;

		// vertical(parent) search
		function getLineStart(node){
			if(!node) return;
			if(frontEndFinal) return;

			if(rxLineBreaker.test(node.tagName)){
				lineBreaker = node;
				frontEndFinal = frontEnd;

				bParentBreak = true;

				return;
			}else{
				frontEnd = node;
			}

			getFrontEnd(node.previousSibling);

			if(frontEndFinal) return;
			getLineStart(nhn.DOMFix.parentNode(node));
		}

		// horizontal(sibling) search			
		function getFrontEnd(node){
			if(!node) return;
			if(frontEndFinal) return;

			if(rxLineBreaker.test(node.tagName)){
				lineBreaker = node;
				frontEndFinal = frontEnd;

				bParentBreak = false;
				return;
			}

			if(node.firstChild && node.tagName != "TABLE"){
				var curNode = node.lastChild;
				while(curNode && !frontEndFinal){
					getFrontEnd(curNode);
					
					curNode = curNode.previousSibling;
				}
			}else{
				frontEnd = node;
			}
			
			if(!frontEndFinal){
				getFrontEnd(node.previousSibling);
			}
		}
	
		getLineStart(node);
	
		return {oNode: frontEndFinal, oLineBreaker: lineBreaker, bParentBreak: bParentBreak};
	},

	_getLineEndInfo : function(node){
		var backEndFinal = null;
		var backEnd = node;
		var lineBreaker = node;
		var bParentBreak = true;

		var rxLineBreaker = this.rxLineBreaker;

		// vertical(parent) search
		function getLineEnd(node){
			if(!node) return;
			if(backEndFinal) return;
			
			if(rxLineBreaker.test(node.tagName)){
				lineBreaker = node;
				backEndFinal = backEnd;

				bParentBreak = true;

				return;
			}else{
				backEnd = node;
			}
	
			getBackEnd(node.nextSibling);
			if(backEndFinal) return;
	
			getLineEnd(nhn.DOMFix.parentNode(node));
		}
		
		// horizontal(sibling) search
		function getBackEnd(node){
			if(!node) return;
			if(backEndFinal) return;
			
			if(rxLineBreaker.test(node.tagName)){
				lineBreaker = node;
				backEndFinal = backEnd;

				bParentBreak = false;
				
				return;
			}

			if(node.firstChild && node.tagName != "TABLE"){
				var curNode = node.firstChild;
				while(curNode && !backEndFinal){
					getBackEnd(curNode);
					
					curNode = curNode.nextSibling;
				}
			}else{
				backEnd = node;
			}
	
			if(!backEndFinal){
				getBackEnd(node.nextSibling);
			}
		}
	
		getLineEnd(node);
	
		return {oNode: backEndFinal, oLineBreaker: lineBreaker, bParentBreak: bParentBreak};
	},

	getLineInfo : function(){
		var oSNode = this.getStartNode();
		var oENode = this.getEndNode();

		// the range is currently collapsed
		if(!oSNode) oSNode = this.getNodeAroundRange(true, true);
		if(!oENode) oENode = this.getNodeAroundRange(true, true);

		var oStart = this._getLineStartInfo(oSNode);
		var oStartNode = oStart.oNode;
		var oEnd = this._getLineEndInfo(oENode);
		var oEndNode = oEnd.oNode;

		var iRelativeStartPos = this._compareEndPoint(nhn.DOMFix.parentNode(oStartNode), this._getPosIdx(oStartNode), this.endContainer, this.endOffset);
		var iRelativeEndPos = this._compareEndPoint(nhn.DOMFix.parentNode(oEndNode), this._getPosIdx(oEndNode)+1, this.startContainer, this.startOffset);

		if(!(iRelativeStartPos <= 0 && iRelativeEndPos >= 0)){
			oSNode = this.getNodeAroundRange(false, true);
			oENode = this.getNodeAroundRange(false, true);
			oStart = this._getLineStartInfo(oSNode);
			oEnd = this._getLineEndInfo(oENode);
		}

		return {oStart: oStart, oEnd: oEnd};
	}
}).extend(nhn.W3CDOMRange);

/**
 * @fileOverview This file contains cross-browser selection function
 * @name SimpleSelection.js
 */
nhn.SimpleSelection = function(win){
	this.init = function(win){
		this._window = win || window;
		this._document = this._window.document;
	};

	this.init(win);

	var oAgentInfo = $Agent().navigator();
	if(oAgentInfo.ie)
		nhn.SimpleSelectionImpl_IE.apply(this);
	else
		nhn.SimpleSelectionImpl_FF.apply(this);
	
	this.selectRange = function(oRng){
		this.selectNone();
		this.addRange(oRng);
	};

	this.selectionLoaded = true;
	if(!this._oSelection) this.selectionLoaded = false;
};

nhn.SimpleSelectionImpl_FF = function(){
	this._oSelection = this._window.getSelection();

	this.getRangeAt = function(iNum){
		iNum = iNum || 0;

		try{
			var oFFRange = this._oSelection.getRangeAt(iNum);
		}catch(e){return new nhn.W3CDOMRange(this._document);}

		return this._FFRange2W3CRange(oFFRange);
	};
			
	this.addRange = function(oW3CRange){
		var oFFRange = this._W3CRange2FFRange(oW3CRange);
		this._oSelection.addRange(oFFRange);
	};

	this.selectNone = function(){
		this._oSelection.removeAllRanges();
	};

	this._FFRange2W3CRange = function(oFFRange){
		var oW3CRange = new nhn.W3CDOMRange(this._document);
		oW3CRange.setStart(oFFRange.startContainer, oFFRange.startOffset);
		oW3CRange.setEnd(oFFRange.endContainer, oFFRange.endOffset);
		return oW3CRange;
	};

	this._W3CRange2FFRange = function(oW3CRange){
		var oFFRange = this._document.createRange();
		oFFRange.setStart(oW3CRange.startContainer, oW3CRange.startOffset);
		oFFRange.setEnd(oW3CRange.endContainer, oW3CRange.endOffset);

		return oFFRange;
	};
};

nhn.SimpleSelectionImpl_IE = function(){
	this._oSelection = this._document.selection;

	this.getRangeAt = function(iNum){
		iNum = iNum || 0;

		if(this._oSelection.type == "Control"){
			var oW3CRange = new nhn.W3CDOMRange(this._document);

			var oSelectedNode = this._oSelection.createRange().item(iNum);

			// if the selction occurs in a different document, ignore
			if(!oSelectedNode || oSelectedNode.ownerDocument != this._document) return oW3CRange;

			oW3CRange.selectNode(oSelectedNode);

			return oW3CRange;
		}else{
			var oSelectedNode = this._oSelection.createRangeCollection().item(iNum).parentElement();

			// if the selction occurs in a different document, ignore
			if(!oSelectedNode || oSelectedNode.ownerDocument != this._document){
				var oW3CRange = new nhn.W3CDOMRange(this._document);
				return oW3CRange;
			}
			return this._IERange2W3CRange(this._oSelection.createRangeCollection().item(iNum));
		}
	};

	this.addRange = function(oW3CRange){
		var oIERange = this._W3CRange2IERange(oW3CRange);
		oIERange.select();
	};

	this.selectNone = function(){
		this._oSelection.empty();
	};

	this._W3CRange2IERange = function(oW3CRange){
		var oStartIERange = this._getIERangeAt(oW3CRange.startContainer, oW3CRange.startOffset);
		var oEndIERange = this._getIERangeAt(oW3CRange.endContainer, oW3CRange.endOffset);
		oStartIERange.setEndPoint("EndToEnd", oEndIERange);

		return oStartIERange;
	};

	this._getIERangeAt = function(oW3CContainer, iW3COffset){
		var oIERange = this._document.body.createTextRange();

		var oEndPointInfoForIERange = this._getSelectableNodeAndOffsetForIE(oW3CContainer, iW3COffset);

		var oSelectableNode = oEndPointInfoForIERange.oSelectableNodeForIE;
		var iIEOffset = oEndPointInfoForIERange.iOffsetForIE;

		oIERange.moveToElementText(oSelectableNode);
		oIERange.collapse(oEndPointInfoForIERange.bCollapseToStart);
		oIERange.moveStart("character", iIEOffset);

		return oIERange;
	};

	this._getSelectableNodeAndOffsetForIE = function(oW3CContainer, iW3COffset){
		var oIERange = this._document.body.createTextRange();

		var oNonTextNode = null;
		var aChildNodes =  null;
		var iNumOfLeftNodesToCount = 0;

		if(oW3CContainer.nodeType == 3){
			oNonTextNode = nhn.DOMFix.parentNode(oW3CContainer);
			aChildNodes = nhn.DOMFix.childNodes(oNonTextNode);
			iNumOfLeftNodesToCount = aChildNodes.length;
		}else{
			oNonTextNode = oW3CContainer;
			aChildNodes = nhn.DOMFix.childNodes(oNonTextNode);
			iNumOfLeftNodesToCount = iW3COffset;
		}

		var oNodeTester = null;

		var iResultOffset = 0;

		var bCollapseToStart = true;

		for(var i=0; i<iNumOfLeftNodesToCount; i++){
			oNodeTester = aChildNodes[i];

			if(oNodeTester.nodeType == 3){
				if(oNodeTester == oW3CContainer) break;

				iResultOffset += oNodeTester.nodeValue.length;
			}else{
				oIERange.moveToElementText(oNodeTester);
				oNonTextNode = oNodeTester;
				iResultOffset = 0;

				bCollapseToStart = false;
			}
		}

		if(oW3CContainer.nodeType == 3) iResultOffset += iW3COffset;

		return {oSelectableNodeForIE:oNonTextNode, iOffsetForIE: iResultOffset, bCollapseToStart: bCollapseToStart};
	};

	this._IERange2W3CRange = function(oIERange){
		var oW3CRange = new nhn.W3CDOMRange(this._document);

		var oIEPointRange = null;
		var oPosition = null;

		oIEPointRange = oIERange.duplicate();
		oIEPointRange.collapse(true);

		oPosition = this._getW3CContainerAndOffset(oIEPointRange, true);

		oW3CRange.setStart(oPosition.oContainer, oPosition.iOffset);

		var oCollapsedChecker = oIERange.duplicate();
		oCollapsedChecker.collapse(true);
		if(oCollapsedChecker.isEqual(oIERange)){
			oW3CRange.collapse(true);
		}else{
			oIEPointRange = oIERange.duplicate();
			oIEPointRange.collapse(false);
			oPosition = this._getW3CContainerAndOffset(oIEPointRange);
			oW3CRange.setEnd(oPosition.oContainer, oPosition.iOffset);
		}

		return oW3CRange;
	};

	this._getW3CContainerAndOffset = function(oIEPointRange, bStartPt){
		var oRgOrigPoint = oIEPointRange;

		var oContainer = oRgOrigPoint.parentElement();
		var offset = -1;

		var oRgTester = this._document.body.createTextRange();
		var aChildNodes = nhn.DOMFix.childNodes(oContainer);
		var oPrevNonTextNode = null;
		var pointRangeIdx = 0;

		for(var i=0;i<aChildNodes.length;i++){
			if(aChildNodes[i].nodeType == 3) continue;

			oRgTester.moveToElementText(aChildNodes[i]);

			if(oRgTester.compareEndPoints("StartToStart", oIEPointRange)>=0) break;

			oPrevNonTextNode = aChildNodes[i];
		}

		var pointRangeIdx = i;

		if(pointRangeIdx != 0 && aChildNodes[pointRangeIdx-1].nodeType == 3){
			var oRgTextStart = this._document.body.createTextRange();
			var oCurTextNode = null;
			if(oPrevNonTextNode){
				oRgTextStart.moveToElementText(oPrevNonTextNode);
				oRgTextStart.collapse(false);
				oCurTextNode = oPrevNonTextNode.nextSibling;
			}else{
				oRgTextStart.moveToElementText(oContainer);
				oRgTextStart.collapse(true);
				oCurTextNode = oContainer.firstChild;
			}

			var oRgTextsUpToThePoint = oRgOrigPoint.duplicate();
			oRgTextsUpToThePoint.setEndPoint("StartToStart", oRgTextStart);

			var textCount = oRgTextsUpToThePoint.text.length

			while(textCount > oCurTextNode.nodeValue.length && oCurTextNode.nextSibling){
				textCount -= oCurTextNode.nodeValue.length;
				oCurTextNode = oCurTextNode.nextSibling;
			}

			// this will enforce IE to re-reference oCurTextNode
			var oTmp = oCurTextNode.nodeValue;
			
			if(bStartPt && oCurTextNode.nextSibling && oCurTextNode.nextSibling.nodeType == 3 && textCount == oCurTextNode.nodeValue.length){
				textCount -= oCurTextNode.nodeValue.length;
				oCurTextNode = oCurTextNode.nextSibling;
			}

			oContainer = oCurTextNode;
			offset = textCount;
		}else{
			oContainer = oRgOrigPoint.parentElement();
			offset = pointRangeIdx;
		}

		return {"oContainer" : oContainer, "iOffset" : offset};
	};
}

nhn.DOMFix = new ($Class({
	$init : function(){
		if($Agent().navigator().ie || $Agent().navigator().opera){
			this.childNodes = this._childNodes_Fix;
			this.parentNode = this._parentNode_Fix;
		}else{
			this.childNodes = this._childNodes_Native;
			this.parentNode = this._parentNode_Native;
		}
	},

	_parentNode_Native : function(elNode){
		return elNode.parentNode;
	},
	
	_parentNode_Fix : function(elNode){
		if(!elNode) return elNode;

		while(elNode.previousSibling){elNode = elNode.previousSibling;}

		return elNode.parentNode;
	},
	
	_childNodes_Native : function(elNode){
		return elNode.childNodes;
	},
	
	_childNodes_Fix : function(elNode){
		var aResult = null;
		var nCount = 0;

		if(elNode){
			var aResult = [];
			elNode = elNode.firstChild;
			while(elNode){
				aResult[nCount++] = elNode;
				elNode=elNode.nextSibling;
			}
		}
		
		return aResult;
	}
}))();