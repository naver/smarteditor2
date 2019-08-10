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
if(typeof window.nhn=='undefined'){window.nhn = {};}

nhn.CurrentSelection_IE = function(){
	this.getCommonAncestorContainer = function(){
		try{
			this._oSelection = this._document.selection;
			if(this._oSelection.type == "Control"){
				return this._oSelection.createRange().item(0);
			}else{
				return this._oSelection.createRangeCollection().item(0).parentElement();
			}
		}catch(e){
			return this._document.body;
		}
	};
	
	this.isCollapsed = function(){
		this._oSelection = this._document.selection;

		return this._oSelection.type == "None";
	};
};

nhn.CurrentSelection_FF = function(){
	this.getCommonAncestorContainer = function(){
		return this._getSelection().commonAncestorContainer;
	};
	
	this.isCollapsed = function(){
		var oSelection = this._window.getSelection();
		
		if(oSelection.rangeCount<1){ return true; }
		return oSelection.getRangeAt(0).collapsed;
	};
	
	this._getSelection = function(){
		try{
			return this._window.getSelection().getRangeAt(0);
		}catch(e){
			return this._document.createRange();
		}
	};
};

nhn.CurrentSelection = new (jindo.$Class({
	$init : function(){
		var oAgentInfo = jindo.$Agent().navigator();
		if(oAgentInfo.ie && document.selection){
			nhn.CurrentSelection_IE.apply(this);
		}else{
			nhn.CurrentSelection_FF.apply(this);
		}
	},
	
	setWindow : function(oWin){
		this._window = oWin;
		this._document = oWin.document;
	}
}))();

/**
 * @fileOverview This file contains a cross-browser implementation of W3C's DOM Range
 * @name W3CDOMRange.js
 */
nhn.W3CDOMRange = jindo.$Class({
	$init : function(win){
		this.reset(win);
	},
	
	reset : function(win){
		this._window = win;
		this._document = this._window.document;

		this.collapsed = true;
		this.commonAncestorContainer = this._document.body;
		this.endContainer = this._document.body;
		this.endOffset = 0;
		this.startContainer = this._document.body;
		this.startOffset = 0;

		this.oBrowserSelection = new nhn.BrowserSelection(this._window);
		this.selectionLoaded = this.oBrowserSelection.selectionLoaded;
	},

	cloneContents : function(){
		var oClonedContents = this._document.createDocumentFragment();
		var oTmpContainer = this._document.createDocumentFragment();

		var aNodes = this._getNodesInRange();

		if(aNodes.length < 1){return oClonedContents;}

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

		if(oClonedContainers.oStartContainer && oClonedContainers.oStartContainer.previousSibling){
			nhn.DOMFix.parentNode(oClonedContainers.oStartContainer).removeChild(oClonedContainers.oStartContainer.previousSibling);
		}

		if(oClonedContainers.oEndContainer && oClonedContainers.oEndContainer.nextSibling){
			nhn.DOMFix.parentNode(oClonedContainers.oEndContainer).removeChild(oClonedContainers.oEndContainer.nextSibling);
		}

		return oClonedContents;
	},

	_constructClonedTree : function(aNodes, oClonedParentNode){
		var oClonedStartContainer = null;
		var oClonedEndContainer = null;

		var oStartContainer = this.startContainer;
		var oEndContainer = this.endContainer;

		var _recurConstructClonedTree = function(aAllNodes, iCurIdx, oClonedParentNode){

			if(iCurIdx < 0){return iCurIdx;}

			var iChildIdx = iCurIdx-1;

			var oCurNodeCloneWithChildren = aAllNodes[iCurIdx].cloneNode(false);

			if(aAllNodes[iCurIdx] == oStartContainer){oClonedStartContainer = oCurNodeCloneWithChildren;}
			if(aAllNodes[iCurIdx] == oEndContainer){oClonedEndContainer = oCurNodeCloneWithChildren;}

			while(iChildIdx >= 0 && nhn.DOMFix.parentNode(aAllNodes[iChildIdx]) == aAllNodes[iCurIdx]){
				iChildIdx = this._recurConstructClonedTree(aAllNodes, iChildIdx, oCurNodeCloneWithChildren);
			}

			// this may trigger an error message in IE when an erroneous script is inserted
			oClonedParentNode.insertBefore(oCurNodeCloneWithChildren, oClonedParentNode.firstChild);

			return iChildIdx;
		};
		this._recurConstructClonedTree = _recurConstructClonedTree;
		aNodes[aNodes.length] = nhn.DOMFix.parentNode(aNodes[aNodes.length-1]);
		this._recurConstructClonedTree(aNodes, aNodes.length-1, oClonedParentNode);

		return {oStartContainer: oClonedStartContainer, oEndContainer: oClonedEndContainer};
	},

	cloneRange : function(){
		return this._copyRange(new nhn.W3CDOMRange(this._window));
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
		if(!oNode){return null;}
		while(oNode){
			if(oNode.tagName == "BODY"){return oNode;}
			oNode = nhn.DOMFix.parentNode(oNode);
		}
		return null;
	},

	_compareEndPoint : function(oContainerA, iOffsetA, oContainerB, iOffsetB){
		return this.oBrowserSelection.compareEndPoints(oContainerA, iOffsetA, oContainerB, iOffsetB);
/*
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
			if(iIdxB == -1){iIdxB = iIdxA+1;}
			if(iIdxA < iIdxB){return -1;}
			if(iIdxA == iIdxB){return 0;}
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
		var oTmpNode = null;
		if(oNodeA != oCommonAncestor){
			while((oTmpNode = nhn.DOMFix.parentNode(oNodeA)) != oCommonAncestor){oNodeA = oTmpNode;}
			
			iIdxA = this._getPosIdx(oNodeA)+0.5;
		}else{
			iIdxA = iOffsetA;
		}
		
		// container node B in common ancestor container
		var oNodeB = oContainerB;
		if(oNodeB != oCommonAncestor){
			while((oTmpNode = nhn.DOMFix.parentNode(oNodeB)) != oCommonAncestor){oNodeB = oTmpNode;}
			
			iIdxB = this._getPosIdx(oNodeB)+0.5;
		}else{
			iIdxB = iOffsetB;
		}

		return compareIdx(iIdxA, iIdxB);
*/
	},

	_getCommonAncestorContainer : function(oNode1, oNode2){
		oNode1 = oNode1 || this.startContainer;
		oNode2 = oNode2 || this.endContainer;
		
		var oComparingNode = oNode2;

		while(oNode1){
			while(oComparingNode){
				if(oNode1 == oComparingNode){return oNode1;}
				oComparingNode = nhn.DOMFix.parentNode(oComparingNode);
			}
			oComparingNode = oNode2;
			oNode1 = nhn.DOMFix.parentNode(oNode1);
		}

		return this._document.body;
	},

	deleteContents : function(){
		if(this.collapsed){return;}

		this._splitTextEndNodesOfTheRange();

		var aNodes = this._getNodesInRange();

		if(aNodes.length < 1){return;}
		var oPrevNode = aNodes[0].previousSibling;

		while(oPrevNode && this._isBlankTextNode(oPrevNode)){oPrevNode = oPrevNode.previousSibling;}

		var oNewStartContainer, iNewOffset = -1;
		if(!oPrevNode){
			oNewStartContainer = nhn.DOMFix.parentNode(aNodes[0]);
			iNewOffset = 0;
		}

		for(var i=0; i<aNodes.length; i++){
			var oNode = aNodes[i];

			if(!oNode.firstChild || this._isAllChildBlankText(oNode)){
				if(oNewStartContainer == oNode){
					iNewOffset = this._getPosIdx(oNewStartContainer);
					oNewStartContainer = nhn.DOMFix.parentNode(oNode);
				}
				oNode.parentNode.removeChild(oNode);
			}else{
				// move the starting point to out of the parent container if the starting point of parent container is meant to be removed
				// [<span>A]B</span>
				// -> []<span>B</span>
				// without these lines, the result would yeild to
				// -> <span>[]B</span>
				if(oNewStartContainer == oNode && iNewOffset === 0){
					iNewOffset = this._getPosIdx(oNewStartContainer);
					oNewStartContainer = nhn.DOMFix.parentNode(oNode);
				}
			}
		}

		if(!oPrevNode){
			this.setStart(oNewStartContainer, iNewOffset, true, true);
		}else{
			if(oPrevNode.tagName == "BODY"){
				this.setStartBefore(oPrevNode, true);
			}else{
				this.setStartAfter(oPrevNode, true);
			}
		}

		this.collapse(true);
	},

	extractContents : function(){
		var oClonedContents = this.cloneContents();
		this.deleteContents();
		return oClonedContents;
	},

	getInsertBeforeNodes : function(){
		var oFirstNode = null;

		var oParentContainer;

		if(this.startContainer.nodeType == "3"){
			oParentContainer = nhn.DOMFix.parentNode(this.startContainer);
			if(this.startContainer.nodeValue.length <= this.startOffset){
				oFirstNode = this.startContainer.nextSibling;
			}else{
				oFirstNode = this.startContainer.splitText(this.startOffset);
			}
		}else{
			oParentContainer = this.startContainer;
			oFirstNode = nhn.DOMFix.childNodes(this.startContainer)[this.startOffset];
		}

		if(!oFirstNode || !nhn.DOMFix.parentNode(oFirstNode)){oFirstNode = null;}
		
		return {elParent: oParentContainer, elBefore: oFirstNode};
	},
	
	insertNode : function(newNode){
		var oInsertBefore = this.getInsertBeforeNodes();

		oInsertBefore.elParent.insertBefore(newNode, oInsertBefore.elBefore);

		this.setStartBefore(newNode);
	},

	selectNode : function(refNode){
		this.reset(this._window);

		this.setStartBefore(refNode);
		this.setEndAfter(refNode);
	},

	selectNodeContents : function(refNode){
		this.reset(this._window);
		
		this.setStart(refNode, 0, true);
		this.setEnd(refNode, nhn.DOMFix.childNodes(refNode).length);
	},

	_endsNodeValidation : function(oNode, iOffset){
		if(!oNode || this._findBody(oNode) != this._document.body){throw new Error("INVALID_NODE_TYPE_ERR oNode is not part of current document");}

		if(oNode.nodeType == 3){
			if(iOffset > oNode.nodeValue.length){iOffset = oNode.nodeValue.length;}
		}else{
			if(iOffset > nhn.DOMFix.childNodes(oNode).length){iOffset = nhn.DOMFix.childNodes(oNode).length;}
		}

		return iOffset;
	},
	

	setEnd : function(refNode, offset, bSafe, bNoUpdate){
		if(!bSafe){offset = this._endsNodeValidation(refNode, offset);}

		this.endContainer = refNode;
		this.endOffset = offset;
		
		if(!bNoUpdate){
			if(!this.startContainer || this._compareEndPoint(this.startContainer, this.startOffset, this.endContainer, this.endOffset) != -1){
				this.collapse(false);
			}else{
				this._updateRangeInfo();
			}
		}
	},

	setEndAfter : function(refNode, bNoUpdate){
		if(!refNode){throw new Error("INVALID_NODE_TYPE_ERR in setEndAfter");}

		if(refNode.tagName == "BODY"){
			this.setEnd(refNode, nhn.DOMFix.childNodes(refNode).length, true, bNoUpdate);
			return;
		}
		this.setEnd(nhn.DOMFix.parentNode(refNode), this._getPosIdx(refNode)+1, true, bNoUpdate);
	},

	setEndBefore : function(refNode, bNoUpdate){
		if(!refNode){throw new Error("INVALID_NODE_TYPE_ERR in setEndBefore");}

		if(refNode.tagName == "BODY"){
			this.setEnd(refNode, 0, true, bNoUpdate);
			return;
		}

		this.setEnd(nhn.DOMFix.parentNode(refNode), this._getPosIdx(refNode), true, bNoUpdate);
	},

	setStart : function(refNode, offset, bSafe, bNoUpdate){
		if(!bSafe){offset = this._endsNodeValidation(refNode, offset);}

		this.startContainer = refNode;
		this.startOffset = offset;

		if(!bNoUpdate){
			if(!this.endContainer || this._compareEndPoint(this.startContainer, this.startOffset, this.endContainer, this.endOffset) != -1){
				this.collapse(true);
			}else{
				this._updateRangeInfo();
			}
		}
	},

	setStartAfter : function(refNode, bNoUpdate){
		if(!refNode){throw new Error("INVALID_NODE_TYPE_ERR in setStartAfter");}

		if(refNode.tagName == "BODY"){
			this.setStart(refNode, nhn.DOMFix.childNodes(refNode).length, true, bNoUpdate);
			return;
		}

		this.setStart(nhn.DOMFix.parentNode(refNode), this._getPosIdx(refNode)+1, true, bNoUpdate);
	},

	setStartBefore : function(refNode, bNoUpdate){
		if(!refNode){throw new Error("INVALID_NODE_TYPE_ERR in setStartBefore");}

		if(refNode.tagName == "BODY"){
			this.setStart(refNode, 0, true, bNoUpdate);
			return;
		}
		this.setStart(nhn.DOMFix.parentNode(refNode), this._getPosIdx(refNode), true, bNoUpdate);
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
	
	// this.oBrowserSelection.getCommonAncestorContainer which uses browser's built-in API runs faster but may return an incorrect value.
	// Call this function to fix the problem.
	//
	// In IE, the built-in API would return an incorrect value when,
	// 1. commonAncestorContainer is not selectable
	// AND
	// 2. The selected area will look the same when its child node is selected
	// eg)
	// when <P><SPAN>TEST</SPAN></p> is selected, <SPAN>TEST</SPAN> will be returned as commonAncestorContainer
	fixCommonAncestorContainer : function(){
		if(!jindo.$Agent().navigator().ie){
			return;
		}
		
		this.commonAncestorContainer = this._getCommonAncestorContainer();
	},

	_isBlankTextNode : function(oNode){
		if(oNode.nodeType == 3 && oNode.nodeValue == ""){return true;}
		return false;
	},
	
	_isAllChildBlankText : function(elNode){
		for(var i=0, nLen=elNode.childNodes.length; i<nLen; i++){
			if(!this._isBlankTextNode(elNode.childNodes[i])){return false;}
		}
		return true;
	},
	
	_getPosIdx : function(refNode){
		var idx = 0;
		for(var node = refNode.previousSibling; node; node = node.previousSibling){idx++;}

		return idx;
	},

	_updateRangeInfo : function(){
		if(!this.startContainer){
			this.reset(this._window);
			return;
		}

		// isCollapsed may not function correctly when the cursor is located,
		// (below a table) AND (at the end of the document where there's no P tag or anything else to actually hold the cursor)
		this.collapsed = this.oBrowserSelection.isCollapsed(this) || (this.startContainer === this.endContainer && this.startOffset === this.endOffset);
//		this.collapsed = this._isCollapsed(this.startContainer, this.startOffset, this.endContainer, this.endOffset);
		this.commonAncestorContainer = this.oBrowserSelection.getCommonAncestorContainer(this);
//		this.commonAncestorContainer = this._getCommonAncestorContainer(this.startContainer, this.endContainer);
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
			){
				bCollapsed = true;
			}
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

		if(!oStartContainer){return oEndPoints;}
		if(oStartContainer.nodeType != 3){return oEndPoints;}
		if(iStartOffset === 0){return oEndPoints;}

		if(oStartContainer.nodeValue.length <= iStartOffset){return oEndPoints;}

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

		if(!oEndContainer){return oEndPoints;}
		if(oEndContainer.nodeType != 3){return oEndPoints;}

		if(iEndOffset >= oEndContainer.nodeValue.length){return oEndPoints;}
		if(iEndOffset === 0){return oEndPoints;}

		oEndContainer.splitText(iEndOffset);

		return {oStartContainer: oStartContainer, iStartOffset: iStartOffset, oEndContainer: oEndContainer, iEndOffset: iEndOffset};
	},
	
	_getNodesInRange : function(){
		if(this.collapsed){return [];}

		var oStartNode = this._getActualStartNode(this.startContainer, this.startOffset);
		var oEndNode = this._getActualEndNode(this.endContainer, this.endOffset);

		return this._getNodesBetween(oStartNode, oEndNode);
	},

	_getActualStartNode : function(oStartContainer, iStartOffset){
		var oStartNode = oStartContainer;

		if(oStartContainer.nodeType == 3){
			if(iStartOffset >= oStartContainer.nodeValue.length){
				oStartNode = this._getNextNode(oStartContainer);
				if(oStartNode.tagName == "BODY"){oStartNode = null;}
			}else{
				oStartNode = oStartContainer;
			}
		}else{
			if(iStartOffset < nhn.DOMFix.childNodes(oStartContainer).length){
				oStartNode = nhn.DOMFix.childNodes(oStartContainer)[iStartOffset];
			}else{
				oStartNode = this._getNextNode(oStartContainer);
				if(oStartNode.tagName == "BODY"){oStartNode = null;}
			}
		}

		return oStartNode;
	},

	_getActualEndNode : function(oEndContainer, iEndOffset){
		var oEndNode = oEndContainer;

		if(iEndOffset === 0){
			oEndNode = this._getPrevNode(oEndContainer);
			if(oEndNode.tagName == "BODY"){oEndNode = null;}
		}else if(oEndContainer.nodeType == 3){
			oEndNode = oEndContainer;
		}else{
			oEndNode = nhn.DOMFix.childNodes(oEndContainer)[iEndOffset-1];
		}

		return oEndNode;
	},

	_getNextNode : function(oNode){
		if(!oNode || oNode.tagName == "BODY"){return this._document.body;}

		if(oNode.nextSibling){return oNode.nextSibling;}
		
		return this._getNextNode(nhn.DOMFix.parentNode(oNode));
	},

	_getPrevNode : function(oNode){
		if(!oNode || oNode.tagName == "BODY"){return this._document.body;}

		if(oNode.previousSibling){return oNode.previousSibling;}
		
		return this._getPrevNode(nhn.DOMFix.parentNode(oNode));
	},

	// includes partially selected
	// for <div id="a"><div id="b"></div></div><div id="c"></div>, _getNodesBetween(b, c) will yield to b, "a" and c
	_getNodesBetween : function(oStartNode, oEndNode){
		var aNodesBetween = [];
		this._nNodesBetweenLen = 0;

		if(!oStartNode || !oEndNode){return aNodesBetween;}

		// IE may throw an exception on "oCurNode = oCurNode.nextSibling;" when oCurNode is 'invalid', not null or undefined but somehow 'invalid'.
		// It happened during browser's build-in UNDO with control range selected(table).
		try{
			this._recurGetNextNodesUntil(oStartNode, oEndNode, aNodesBetween);
		}catch(e){
			return [];
		}
		
		return aNodesBetween;
	},

	_recurGetNextNodesUntil : function(oNode, oEndNode, aNodesBetween){
		if(!oNode){return false;}

		if(!this._recurGetChildNodesUntil(oNode, oEndNode, aNodesBetween)){return false;}

		var oNextToChk = oNode.nextSibling;
		
		while(!oNextToChk){
			if(!(oNode = nhn.DOMFix.parentNode(oNode))){return false;}

			aNodesBetween[this._nNodesBetweenLen++] = oNode;

			if(oNode == oEndNode){return false;}

			oNextToChk = oNode.nextSibling;
		}

		return this._recurGetNextNodesUntil(oNextToChk, oEndNode, aNodesBetween);
	},

	_recurGetChildNodesUntil : function(oNode, oEndNode, aNodesBetween){
		if(!oNode){return false;}

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

		if(bEndFound){return false;}
		if(oNode == oEndNode){return false;}

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
nhn.HuskyRange = jindo.$Class({
	_rxCursorHolder : /^(?:\uFEFF|\u00A0|\u200B|<br>)$/i,
	_rxTextAlign : /text-align:[^"';]*;?/i,

	setWindow : function(win){
		this.reset(win || window);
	},

	$init : function(win){
		this.HUSKY_BOOMARK_START_ID_PREFIX = "husky_bookmark_start_";
		this.HUSKY_BOOMARK_END_ID_PREFIX = "husky_bookmark_end_";

		this.sBlockElement = "P|DIV|LI|H[1-6]|PRE";
		this.sBlockContainer = "BODY|TABLE|TH|TR|TD|UL|OL|BLOCKQUOTE|FORM";

		this.rxBlockElement = new RegExp("^("+this.sBlockElement+")$");
		this.rxBlockContainer = new RegExp("^("+this.sBlockContainer+")$");
		this.rxLineBreaker = new RegExp("^("+this.sBlockElement+"|"+this.sBlockContainer+")$");
		this.rxHasBlock = new RegExp("(?:<(?:"+this.sBlockElement+"|"+this.sBlockContainer+").*?>|style=[\"']?[^>]*?(?:display\\s?:\\s?block)[^>]*?[\"']?)", "i");

		this.setWindow(win);
	},

	select : function(){
		try{
			this.oBrowserSelection.selectRange(this);
		}catch(e){
			// console.warn("[WARNING] 잘못된 범위가 지정 됨!");
		}
	},

	setFromSelection : function(iNum){
		this.setRange(this.oBrowserSelection.getRangeAt(iNum), true);
	},

	setRange : function(oW3CRange, bSafe){
		this.reset(this._window);

		this.setStart(oW3CRange.startContainer, oW3CRange.startOffset, bSafe, true);
		this.setEnd(oW3CRange.endContainer, oW3CRange.endOffset, bSafe);
	},

	setEndNodes : function(oSNode, oENode){
		this.reset(this._window);

		this.setEndAfter(oENode, true);
		this.setStartBefore(oSNode);
	},
	
	splitTextAtBothEnds : function(){
		this._splitTextEndNodesOfTheRange();
	},

	getStartNode : function(){
		if(this.collapsed){
			if(this.startContainer.nodeType == 3){
				if(this.startOffset === 0){return null;}
				if(this.startContainer.nodeValue.length <= this.startOffset){return null;}
				return this.startContainer;
			}
			return null;
		}
		
		if(this.startContainer.nodeType == 3){
			if(this.startOffset >= this.startContainer.nodeValue.length){return this._getNextNode(this.startContainer);}
			return this.startContainer;
		}else{
			if(this.startOffset >= nhn.DOMFix.childNodes(this.startContainer).length){return this._getNextNode(this.startContainer);}
			return nhn.DOMFix.childNodes(this.startContainer)[this.startOffset];
		}
	},
	
	getEndNode : function(){
		if(this.collapsed){return this.getStartNode();}
		
		if(this.endContainer.nodeType == 3){
			if(this.endOffset === 0){return this._getPrevNode(this.endContainer);}
			return this.endContainer;
		}else{
			if(this.endOffset === 0){return this._getPrevNode(this.endContainer);}
			return nhn.DOMFix.childNodes(this.endContainer)[this.endOffset-1];
		}
	},

	getNodeAroundRange : function(bBefore, bStrict){
		if(!this.collapsed){return this.getStartNode();}

		if(this.startContainer && this.startContainer.nodeType == 3){return this.startContainer;}
		//if(this.collapsed && this.startContainer && this.startContainer.nodeType == 3) return this.startContainer;
		//if(!this.collapsed || (this.startContainer && this.startContainer.nodeType == 3)) return this.getStartNode();

		var oBeforeRange, oAfterRange, oResult;

		if(this.startOffset >= nhn.DOMFix.childNodes(this.startContainer).length){
			oAfterRange = this._getNextNode(this.startContainer);
		}else{
			oAfterRange = nhn.DOMFix.childNodes(this.startContainer)[this.startOffset];
		}

		if(this.endOffset === 0){
			oBeforeRange = this._getPrevNode(this.endContainer);
		}else{
			oBeforeRange = nhn.DOMFix.childNodes(this.endContainer)[this.endOffset-1];
		}

		if(bBefore){
			oResult = oBeforeRange;
			if(!oResult && !bStrict){oResult = oAfterRange;}
		}else{
			oResult = oAfterRange;
			if(!oResult && !bStrict){oResult = oBeforeRange;}
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
		for(var node = refNode.previousSibling; node; node = node.previousSibling){
			if(node.tagName == refNode.tagName){idx++;}
		}

		return idx;
	},
	
	// this was written specifically for XPath Bookmark and it may not perform correctly for general purposes
	_evaluateXPath : function(sXPath, oDoc){
		sXPath = sXPath.substring(1, sXPath.length-1);
		var aXPath = sXPath.split(/\//);
		var elNode = oDoc.body;

		for(var i=2; i<aXPath.length && elNode; i++){
			aXPath[i].match(/([^[]+)\[(\d+)/i);
			var sTagName = RegExp.$1;
			var nIdx = RegExp.$2;

			var aAllNodes = nhn.DOMFix.childNodes(elNode);
			var aNodes = [];
			var nLength = aAllNodes.length;
			var nCount = 0;
			for(var ii=0; ii<nLength; ii++){
				if(aAllNodes[ii].tagName == sTagName){aNodes[nCount++] = aAllNodes[ii];}
			}

			if(aNodes.length < nIdx){
				elNode = null;
			}else{
				elNode = aNodes[nIdx];
			}
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
		var oBookmark2;

		if(this.collapsed){
			oBookmark2 = {sXPath:sXPathNode1, nTextNodeIdx:nTextNodeIdx1, nOffset: htEndPt1.nOffset};
		}else{
			var nTextNodeIdx2 = -1;
			var htEndPt2 = {elContainer: this.endContainer, nOffset: this.endOffset};
			var elNode2 = this.endContainer;
			if(elNode2.nodeType == 3){
				htEndPt2 = this._getFixedEndTextNode();
				nTextNodeIdx2 = this._getPosIdx(htEndPt2.elContainer);
				elNode2 = nhn.DOMFix.parentNode(elNode2);
			}
			var sXPathNode2 = this._getXPath(elNode2);
			oBookmark2 = {sXPath:sXPathNode2, nTextNodeIdx:nTextNodeIdx2, nOffset: htEndPt2.nOffset};
		}
		return [oBookmark1, oBookmark2];
	},
	
	moveToXPathBookmark : function(aBookmark){
		if(!aBookmark){return false;}

		var oBookmarkInfo1 = this._evaluateXPathBookmark(aBookmark[0]);
		var oBookmarkInfo2 = this._evaluateXPathBookmark(aBookmark[1]);

		if(!oBookmarkInfo1["elContainer"] || !oBookmarkInfo2["elContainer"]){return;}

		this.startContainer = oBookmarkInfo1["elContainer"];
		this.startOffset = oBookmarkInfo1["nOffset"];

		this.endContainer = oBookmarkInfo2["elContainer"];
		this.endOffset = oBookmarkInfo2["nOffset"];
		
		return true;
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
		if(this.collapsed || jindo.$Agent().navigator().ie || jindo.$Agent().navigator().firefox){
			return this.placeStringBookmark_NonWebkit();
		}else{
			return this.placeStringBookmark_Webkit();
		}
	},

	placeStringBookmark_NonWebkit : function(){
		var sTmpId = (new Date()).getTime();

		var oInsertionPoint = this.cloneRange();
		oInsertionPoint.collapseToEnd();
		var oEndMarker = this._document.createElement("SPAN");
		oEndMarker.id = this.HUSKY_BOOMARK_END_ID_PREFIX+sTmpId;
		oInsertionPoint.insertNode(oEndMarker);

		oInsertionPoint = this.cloneRange();
		oInsertionPoint.collapseToStart();
		var oStartMarker = this._document.createElement("SPAN");
		oStartMarker.id = this.HUSKY_BOOMARK_START_ID_PREFIX+sTmpId;
		oInsertionPoint.insertNode(oStartMarker);

		// IE에서 빈 SPAN의 앞뒤로 커서가 이동하지 않아 문제가 발생 할 수 있어, 보이지 않는 특수 문자를 임시로 넣어 줌.
		if(jindo.$Agent().navigator().ie){
			// SPAN의 위치가 TD와 TD 사이에 있을 경우, 텍스트 삽입 시 알수 없는 오류가 발생한다.
			// TD와 TD사이에서는 텍스트 삽입이 필요 없음으로 그냥 try/catch로 처리
			try{
				oStartMarker.innerHTML = unescape("%uFEFF");
			}catch(e){
				// console.warn(e);
			}
			
			try{
				oEndMarker.innerHTML = unescape("%uFEFF");
			}catch(e){
				// console.warn(e);
			}
		}
		this.moveToBookmark(sTmpId);

		return sTmpId;
	},
	
	placeStringBookmark_Webkit : function(){
		var sTmpId = (new Date()).getTime();

		var elInsertBefore, elInsertParent;

		// Do not insert the bookmarks between TDs as it will break the rendering in Chrome/Safari
		// -> modify the insertion position from [<td>abc</td>]<td>abc</td> to <td>[abc]</td><td>abc</td>
		var oInsertionPoint = this.cloneRange();
		oInsertionPoint.collapseToEnd();
		elInsertBefore = this._document.createTextNode("");
		oInsertionPoint.insertNode(elInsertBefore);
		elInsertParent = elInsertBefore.parentNode;
		if(elInsertBefore.previousSibling && elInsertBefore.previousSibling.tagName == "TD"){
			elInsertParent = elInsertBefore.previousSibling;
			elInsertBefore = null;
		}
		var oEndMarker = this._document.createElement("SPAN");
		oEndMarker.id = this.HUSKY_BOOMARK_END_ID_PREFIX+sTmpId;
		elInsertParent.insertBefore(oEndMarker, elInsertBefore);

		oInsertionPoint = this.cloneRange();
		oInsertionPoint.collapseToStart();
		elInsertBefore = this._document.createTextNode("");
		oInsertionPoint.insertNode(elInsertBefore);
		elInsertParent = elInsertBefore.parentNode;
		if(elInsertBefore.nextSibling && elInsertBefore.nextSibling.tagName == "TD"){
			elInsertParent = elInsertBefore.nextSibling;
			elInsertBefore = elInsertParent.firstChild;
		}
		var oStartMarker = this._document.createElement("SPAN");
		oStartMarker.id = this.HUSKY_BOOMARK_START_ID_PREFIX+sTmpId;
		elInsertParent.insertBefore(oStartMarker, elInsertBefore);

		//elInsertBefore.parentNode.removeChild(elInsertBefore);
		
		this.moveToBookmark(sTmpId);

		return sTmpId;
	},

	cloneRange : function(){
		return this._copyRange(new nhn.HuskyRange(this._window));
	},

	moveToBookmark : function(vBookmark){
		if(typeof(vBookmark) != "object"){
			return this.moveToStringBookmark(vBookmark);
		}else{
			return this.moveToXPathBookmark(vBookmark);
		}
	},

	getStringBookmark : function(sBookmarkID, bEndBookmark){
		if(bEndBookmark){
			return this._document.getElementById(this.HUSKY_BOOMARK_END_ID_PREFIX+sBookmarkID);
		}else{
			return this._document.getElementById(this.HUSKY_BOOMARK_START_ID_PREFIX+sBookmarkID);
		}
	},
	
	moveToStringBookmark : function(sBookmarkID, bIncludeBookmark){
		var oStartMarker = this.getStringBookmark(sBookmarkID);
		var oEndMarker = this.getStringBookmark(sBookmarkID, true);

		if(!oStartMarker || !oEndMarker){return false;}

		this.reset(this._window);

		if(bIncludeBookmark){
			this.setEndAfter(oEndMarker);
			this.setStartBefore(oStartMarker);
		}else{
			this.setEndBefore(oEndMarker);
			this.setStartAfter(oStartMarker);
		}
		return true;
	},

	removeStringBookmark : function(sBookmarkID){
	/*
		var oStartMarker = this._document.getElementById(this.HUSKY_BOOMARK_START_ID_PREFIX+sBookmarkID);
		var oEndMarker = this._document.getElementById(this.HUSKY_BOOMARK_END_ID_PREFIX+sBookmarkID);

		if(oStartMarker) nhn.DOMFix.parentNode(oStartMarker).removeChild(oStartMarker);
		if(oEndMarker) nhn.DOMFix.parentNode(oEndMarker).removeChild(oEndMarker);
	*/
		this._removeAll(this.HUSKY_BOOMARK_START_ID_PREFIX+sBookmarkID);
		this._removeAll(this.HUSKY_BOOMARK_END_ID_PREFIX+sBookmarkID);
	},
	
	_removeAll : function(sID){
		var elNode;
		while((elNode = this._document.getElementById(sID))){
			elNode.parentNode.removeChild(elNode);
		}
	},

	collapseToStart : function(){
		this.collapse(true);
	},
	
	collapseToEnd : function(){
		this.collapse(false);
	},

	createAndInsertNode : function(sTagName){
		var tmpNode = this._document.createElement(sTagName);
		this.insertNode(tmpNode);
		return tmpNode;
	},

	getNodes : function(bSplitTextEndNodes, fnFilter){
		if(bSplitTextEndNodes){this._splitTextEndNodesOfTheRange();}

		var aAllNodes = this._getNodesInRange();
		var aFilteredNodes = [];

		if(!fnFilter){return aAllNodes;}

		for(var i=0; i<aAllNodes.length; i++){
			if(fnFilter(aAllNodes[i])){aFilteredNodes[aFilteredNodes.length] = aAllNodes[i];}
		}

		return aFilteredNodes;
	},

	getTextNodes : function(bSplitTextEndNodes){
		var txtFilter = function(oNode){
			if (oNode.nodeType == 3 && oNode.nodeValue != "\n" && oNode.nodeValue != ""){
				return true;
			}else{
				return false;
			}
		};

		return this.getNodes(bSplitTextEndNodes, txtFilter);
	},

	surroundContentsWithNewNode : function(sTagName){
		var oNewParent = this._document.createElement(sTagName);
		this.surroundContents(oNewParent);
		return oNewParent;
	},

	isRangeinRange : function(oAnoterRange, bIncludePartlySelected){
		var startToStart = this.compareBoundaryPoints(this.W3CDOMRange.START_TO_START, oAnoterRange);
		var startToEnd = this.compareBoundaryPoints(this.W3CDOMRange.START_TO_END, oAnoterRange);
		var endToStart = this.compareBoundaryPoints(this.W3CDOMRange.ND_TO_START, oAnoterRange);
		var endToEnd = this.compareBoundaryPoints(this.W3CDOMRange.END_TO_END, oAnoterRange);

		if(startToStart <= 0 && endToEnd >= 0){return true;}

		if(bIncludePartlySelected){
			if(startToEnd == 1){return false;}
			if(endToStart == -1){return false;}
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

		return this.isRangeInRange(oTmpRange, bIncludePartlySelected);
	},		

	pasteText : function(sText){
		this.pasteHTML(sText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/ /g, "&nbsp;").replace(/"/g, "&quot;"));
	},

	/**
	 * TODO: 왜 clone 으로 조작할까?
	 * @param {String}	sHTML	삽입할 HTML
	 * @param {Boolean}	bBlock	HTML 삽입시 강제로 block 요소 처리할지 여부(true 이면 P태그 안에 삽입될 경우, P태그를 무조건 쪼개고 그 사이에 DIV태그로 감싸서 삽입한다.)
	 */
	pasteHTML : function(sHTML, bBlock){
		var oTmpDiv = this._document.createElement("DIV");
		oTmpDiv.innerHTML = sHTML;
		
		if(!oTmpDiv.firstChild){
			this.deleteContents();
			return;
		}

		// getLineInfo 전에 북마크를 삽입하지 않으면 IE에서 oLineBreaker가 P태그 바깥으로 잡히는 경우가 있음(P태그에 아무것도 없을때)
		var clone = this.cloneRange();
		var sBM = clone.placeStringBookmark();

		// [SMARTEDITORSUS-1960] PrivateTag, 템플릿삽입등 P태그안에 block 요소 삽입과 관련된 처리 
		// P태그인 경우, block요소가 들어오면 안된다.
		// 때문에 현재 위치의 컨테이너가 P태그이고 컨텐츠 내용이 block 요소인 경우 P태그를 쪼개고 그 사이에 컨텐츠를 DIV로 감싸서 넣도록 처리한다.
		// [SMARTEDITORSUS-2026][SMARTEDITORSUS-2061] bBlock = true 이면 삽입되는 HTML 이 block 요소가 아니더라도 무조건 P태그를 쪼개서 DIV로 감싸도록 한다.
		var oLineInfo = clone.getLineInfo(),
			oStart = oLineInfo.oStart,
			oEnd = oLineInfo.oEnd;
		if(oStart.oLineBreaker && oStart.oLineBreaker.nodeName === "P" && (bBlock || clone.rxHasBlock.test(sHTML))){
			// [SMARTEDITORSUS-2169] 선택영역 삭제시 oStart.oLineBreaker도 DOM 트리에서 제거될 수 있기 때문에 필요한 노드를 미리 참조해둔다.
			var oParentNode = oStart.oLineBreaker.parentNode,
				oNextSibling = oStart.oLineBreaker.nextSibling;

			// 선택영역을 조작해야 하므로 현재 선택된 요소들을 제거한다.
			clone.deleteContents();

			// 동일한 라인에 있으면 뒷부분은 쪼개서 다음 라인으로 삽입한다.
			if(oStart.oLineBreaker === oEnd.oLineBreaker){
				var elBM = clone.getStringBookmark(sBM);
				clone.setEndNodes(elBM, oEnd.oLineBreaker);
				var oNextContents = clone.extractContents(),
					oNextFirst = oNextContents.firstChild;	// oNextSibling 을 교체하기 위해 쪼개진 요소 첫번째 노드를 미리 참조해둔다.

				// 쪼갠 부분을 삽입하고
				if(oNextSibling){
					oParentNode.insertBefore(oNextContents, oNextSibling);
				}else{
					oParentNode.appendChild(oNextContents);
				}
				// [SMARTEDITORSUS-2145] oNextSibling 을 쪼갠 부분의 첫번째 노드로 교체한다. 
				oNextSibling = oNextFirst;
			}

			// 선택영역 앞쪽이 속한 P태그에서 style과 align 정보를 복사한다.
			// 크롬의 경우 div의 style 에 text-align 이 있으면 align 속성은 무시되는데 
			// div 안의 block 요소는 text-align 의 대상이 아니라 정렬되지 않는 문제가 있기 때문에
			// style 복사할 때 text-align 속성은 제외한다.
			oTmpDiv.style.cssText = oStart.oLineBreaker.style.cssText.replace(this._rxTextAlign, '');	// text-align 제외
			oTmpDiv.align = oStart.oLineBreaker.align;	// align 복사

			// 컨텐츠 삽입
			if(oNextSibling){
				oParentNode.insertBefore(oTmpDiv, oNextSibling);
			}else{
				oParentNode.appendChild(oTmpDiv);
			}

			// 컨텐츠 삽입 후에 북마크를 지운다.
			// 컨텐츠 삽입 전에 지우면 컨텐츠 삽입시 oNextSibling 가 북마크로 잡히는 경우 에러가 발생할 수 있음 
			clone.removeStringBookmark(sBM);

			// 컨텐츠 삽입 후 윗라인 P태그에 아무런 내용이 없으면 제거한다.
			this._removeEmptyP(this._getPrevElement(oTmpDiv));
			// 아래 라인 P태그에 아무런 내용이 없는 경우는 그 다음 아래 라인이 있을때만 제거한다.
			// 아래 라인이 아예없으면 IE에서 커서가 들어가지 않기 때문에 라인을 추가해준다.
			var elNextLine = this._getNextElement(oTmpDiv);
			if(elNextLine){
				var elAfterNext = this._getNextElement(elNextLine);
				if(elAfterNext && this._removeEmptyP(elNextLine)){
					elNextLine = elAfterNext;	// 제거되었을 경우만 elNextLine 재할당
				}
			}else{
				// 아래 라인이 없으면 윗 라인 스타일을 복사하여 추가해준다. 
				elNextLine = this._document.createElement("P");
				elNextLine.style.cssText = oStart.oLineBreaker.style.cssText;
				elNextLine.align = oStart.oLineBreaker.align;
				oParentNode.appendChild(elNextLine);
			}

			// 커서를 다음라인으로 앞쪽으로 위치시킨다.
			if(elNextLine.innerHTML === ""){
				// 크롬에서 빈 <p></p> 를 선택해서 collapseToStart 하면 윗라인으로 이동하기 때문에 비어있으면 \uFEFF 를 넣어준다.
				elNextLine.innerHTML = (jindo.$Agent().navigator().ie && jindo.$Agent().navigator().version > 8) ? "\u200B" : "\uFEFF";
			}
			this.selectNodeContents(elNextLine);
			this.collapseToStart();
			
			// IE7에서 커서가 다음라인 p태그 앞쪽이 아닌 div태그 끝쪽으로 자동으로 옮겨가는 경우가 있어서
			// 커서가 멋대로 이동하지 않도록 임시북마크를 넣었다가 바로 빼준다.
			// (주의) 북마크를 넣었다 빼면 IE10은 다음라인 p태그 끝쪽으로 이동되기 때문에 IE7인 경우만 넣어줌 
			// [SMARTEDITORSUS-2043] SE_EditingArea_WYSIWYG.$ON_PASTE_HTML 에서 IE8의 경우만 삽입시 뒤에 \uFEFF가 추가로 붙어서 들어오는데
			// 이로 인해 템플릿과 커서사이가 한줄 벌어지는 문제가 있어서 \uFEFF 추가하는 부분을 삭제하니 커서가 IE7과 동일하게 동작하여 IE8도 임시북마크처리함
			if(jindo.$Agent().navigator().ie && jindo.$Agent().navigator().version < 9){
				sBM = this.placeStringBookmark();
				this.removeStringBookmark(sBM);
			}
		}else{
			var oFirstNode = oTmpDiv.firstChild;
			var oLastNode = oTmpDiv.lastChild;
			
			this.collapseToStart();
			
			while(oTmpDiv.lastChild){this.insertNode(oTmpDiv.lastChild);}
			
			this.setEndNodes(oFirstNode, oLastNode);
			
			// delete the content later as deleting it first may mass up the insertion point
			// eg) <p>[A]BCD</p> ---paste O---> O<p>BCD</p>
			clone.moveToBookmark(sBM);
			clone.deleteContents();
			clone.removeStringBookmark(sBM);
		}
	},

	/**
	 * 비어있는 P태그이면 제거한다.
	 * @param {Element} el 검사할 Element
	 * @returns {Boolean} 제거되었다면 true 를 반환한다.
	 */
	_removeEmptyP : function(el){
		if(el && el.nodeName === "P"){
			var sInner = el.innerHTML;
			if(sInner === "" || this._rxCursorHolder.test(sInner)){
				el.parentNode.removeChild(el);
				return true;
			}
		}
	},

	/**
	 * 인접한 Element 노드를 찾는다.
	 * @param  {Node}    oNode 기준 노드
	 * @param  {Boolean} bPrev 앞뒤여부(true면 앞, false면 뒤)
	 * @return {Element} 인접한 Element, 없으면 null 반환 
	 */
	_getSiblingElement : function(oNode, bPrev){
		if(!oNode){
			return null;
		}
		
		var oSibling = oNode[bPrev ? "previousSibling" : "nextSibling"];
		if(oSibling && oSibling.nodeType === 1){
			return oSibling;
		}else{
			return arguments.callee(oSibling, bPrev);
		}
	},

	/**
	 * 앞쪽 인접한 Element 노드를 찾는다.
	 * @param  {Node}    oNode 기준 노드
	 * @return {Element} 인접한 Element, 없으면 null 반환 
	 */
	_getPrevElement : function(oNode){
		return this._getSiblingElement(oNode, true);
	},

	/**
	 * 뒤쪽 인접한 Element 노드를 찾는다.
	 * @param  {Node}    oNode 기준 노드
	 * @return {Element} 인접한 Element, 없으면 null 반환 
	 */
	_getNextElement : function(oNode){
		return this._getSiblingElement(oNode, false);
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
		while(oNode && oNode.tagName != sTagName){oNode = nhn.DOMFix.parentNode(oNode);}
		
		return oNode;
	},

	selectNodeContents : function(oNode){
		if(!oNode){return;}

		var oFirstNode = oNode.firstChild?oNode.firstChild:oNode;
		var oLastNode = oNode.lastChild?oNode.lastChild:oNode;

		this.reset(this._window);
		if(oFirstNode.nodeType == 3){
			this.setStart(oFirstNode, 0, true);
		}else{
			this.setStartBefore(oFirstNode);
		}
		
		if(oLastNode.nodeType == 3){
			this.setEnd(oLastNode, oLastNode.nodeValue.length, true);
		}else{
			this.setEndAfter(oLastNode);
		}
	},

	/**
	 * 노드의 취소선/밑줄 정보를 확인한다
	 * 관련 BTS [SMARTEDITORSUS-26]
	 * @param {Node} 	oNode	취소선/밑줄을 확인할 노드
	 * @param {String}	sValue 	textDecoration 정보
	 * @see nhn.HuskyRange#_checkTextDecoration
	 */
	_hasTextDecoration : function(oNode, sValue){
		if(!oNode || !oNode.style){
			return false;
		}
		
		if(oNode.style.textDecoration.indexOf(sValue) > -1){
			return true;
		}
		
		if(sValue === "underline" && oNode.tagName === "U"){
			return true;
		}
		
		if(sValue === "line-through" && (oNode.tagName === "S" || oNode.tagName === "STRIKE")){
			return true;
		}
		
		return false;
	},
	
	/**
	 * 노드에 취소선/밑줄을 적용한다
	 * 관련 BTS [SMARTEDITORSUS-26]
	 * [FF] 노드의 Style 에 textDecoration 을 추가한다
	 * [FF 외] U/STRIKE 태그를 추가한다
	 * @param {Node} 	oNode	취소선/밑줄을 적용할 노드
	 * @param {String}	sValue 	textDecoration 정보
	 * @see nhn.HuskyRange#_checkTextDecoration
	 */
	_setTextDecoration : function(oNode, sValue){
		if (jindo.$Agent().navigator().firefox) {	// FF
			oNode.style.textDecoration = (oNode.style.textDecoration) ? oNode.style.textDecoration + " " + sValue : sValue;
		}
		else{
			if(sValue === "underline"){
				oNode.innerHTML = "<U>" + oNode.innerHTML + "</U>"
			}else if(sValue === "line-through"){
				oNode.innerHTML = "<STRIKE>" + oNode.innerHTML + "</STRIKE>"
			}
		}
	},
		
	/**
	 * 인자로 전달받은 노드 상위의 취소선/밑줄 정보를 확인하여 노드에 적용한다
	 * 관련 BTS [SMARTEDITORSUS-26]
	 * @param {Node} oNode 취소선/밑줄을 적용할 노드
	 */
	_checkTextDecoration : function(oNode){
		if(oNode.tagName !== "SPAN"){
			return;	
		}
		
		var bUnderline = false,
			bLineThrough = false,
			oParentNode = null,
			oChildNode = oNode.firstChild;
		
		/* check child */
		while(oChildNode){
			if(oChildNode.nodeType === 1){
				bUnderline = (bUnderline || oChildNode.tagName === "U");
				bLineThrough = (bLineThrough || oChildNode.tagName === "S" || oChildNode.tagName === "STRIKE");
			}
			
			if(bUnderline && bLineThrough){
				return;
			}
			
			oChildNode = oChildNode.nextSibling;
		}
			
		oParentNode = nhn.DOMFix.parentNode(oNode);
		
		/* check parent */
		while(oParentNode && oParentNode.tagName !== "BODY"){
			if(oParentNode.nodeType !== 1){
				oParentNode = nhn.DOMFix.parentNode(oParentNode);
				continue;
			}
			
			if(!bUnderline && this._hasTextDecoration(oParentNode, "underline")){
				bUnderline = true;
				this._setTextDecoration(oNode, "underline");	// set underline
			}
			
			if(!bLineThrough && this._hasTextDecoration(oParentNode, "line-through")){
				bLineThrough = true;
				this._setTextDecoration(oNode, "line-through");	// set line-through
			}

			if(bUnderline && bLineThrough){
				return;
			}
			
			oParentNode = nhn.DOMFix.parentNode(oParentNode);
		}
	},

	/**
	 * Range에 속한 노드들에 스타일을 적용한다
	 * @param {Object} 	oStyle 					적용할 스타일을 가지는 Object (예) 글꼴 색 적용의 경우 { color : "#0075c8" }
	 * @param {Object} 	[oAttribute] 			적용할 속성을 가지는 Object (예) 맞춤범 검사의 경우 { _sm2_spchk: "강남콩", class: "se2_check_spell" }
	 * @param {String} 	[sNewSpanMarker] 		새로 추가된 SPAN 노드를 나중에 따로 처리해야하는 경우 마킹을 위해 사용하는 문자열
	 * @param {Boolean} [bIncludeLI] 			LI 도 스타일 적용에 포함할 것인지의 여부 [COM-1051] _getStyleParentNodes 메서드 참고하기
	 * @param {Boolean} [bCheckTextDecoration] 	취소선/밑줄 처리를 적용할 것인지 여부 [SMARTEDITORSUS-26] _setTextDecoration 메서드 참고하기
	 */
	styleRange : function(oStyle, oAttribute, sNewSpanMarker, bIncludeLI, bCheckTextDecoration){
		var aStyleParents = this.aStyleParents = this._getStyleParentNodes(sNewSpanMarker, bIncludeLI);
		if(aStyleParents.length < 1){return;}

		var sName, sValue, x;

		for(var i=0; i<aStyleParents.length; i++){
			for(x in oStyle){
				sName = x;
				sValue = oStyle[sName];

				if(typeof sValue != "string"){continue;}

				// [SMARTEDITORSUS-26] 글꼴 색을 적용할 때 취소선/밑줄의 색상도 처리되도록 추가
				if(bCheckTextDecoration && oStyle.color){
					this._checkTextDecoration(aStyleParents[i]);
				}
				
				aStyleParents[i].style[sName] = sValue;
			}

			if(!oAttribute){continue;}

			for(x in oAttribute){
				sName = x;
				sValue = oAttribute[sName];

				if(typeof sValue != "string"){continue;}
				
				if(sName == "class"){
					jindo.$Element(aStyleParents[i]).addClass(sValue);
				}else{
					aStyleParents[i].setAttribute(sName, sValue);
				}
			}
		}

		this.reset(this._window);
		this.setStartBefore(aStyleParents[0]);
		this.setEndAfter(aStyleParents[aStyleParents.length-1]);
	},

	expandBothEnds : function(){
		this.expandStart();
		this.expandEnd();
	},
	
	expandStart : function(){
		if(this.startContainer.nodeType == 3 && this.startOffset !== 0){return;}

		var elActualStartNode = this._getActualStartNode(this.startContainer, this.startOffset);
		elActualStartNode = this._getPrevNode(elActualStartNode);
		
		if(elActualStartNode.tagName == "BODY"){
			this.setStartBefore(elActualStartNode);
		}else{
			this.setStartAfter(elActualStartNode);
		}
	},
	
	expandEnd : function(){
		if(this.endContainer.nodeType == 3 && this.endOffset < this.endContainer.nodeValue.length){return;}

		var elActualEndNode = this._getActualEndNode(this.endContainer, this.endOffset);
		elActualEndNode = this._getNextNode(elActualEndNode);
		
		if(elActualEndNode.tagName == "BODY"){
			this.setEndAfter(elActualEndNode);
		}else{
			this.setEndBefore(elActualEndNode);
		}
	},
	
	/**
	 * Style 을 적용할 노드를 가져온다
	 * @param {String}	[sNewSpanMarker]	새로 추가하는 SPAN 노드를 마킹을 위해 사용하는 문자열
	 * @param {Boolean}	[bIncludeLI]		LI 도 스타일 적용에 포함할 것인지의 여부
	 * @return {Array}	Style 을 적용할 노드 배열
	 */
	_getStyleParentNodes : function(sNewSpanMarker, bIncludeLI){
		this._splitTextEndNodesOfTheRange();

		var oSNode = this.getStartNode();
		var oENode = this.getEndNode();

		var aAllNodes = this._getNodesInRange();
		var aResult = [];
		var nResult = 0;

		var oNode, oSpan;
		var nInitialLength = aAllNodes.length;
		var arAllBottomNodes = jindo.$A(aAllNodes).filter(function(v){return (!v.firstChild || (bIncludeLI && v.tagName=="LI"));});

		// [COM-1051] 본문내용을 한 줄만 입력하고 번호 매긴 상태에서 글자크기를 변경하면 번호크기는 변하지 않는 문제
		// 부모 노드 중 LI 가 있고, 해당 LI 의 모든 자식 노드가 선택된 상태라면 LI에도 스타일을 적용하도록 처리함
		// --- Range 에 LI 가 포함되지 않은 경우, LI 를 포함하도록 처리
		var elTmpNode = this.commonAncestorContainer;
		if(bIncludeLI){
			while(elTmpNode){
				if(elTmpNode.tagName == "LI"){
					if(this._isFullyContained(elTmpNode, arAllBottomNodes)){
						aResult[nResult++] = elTmpNode;
					}
					break;
				}
				
				elTmpNode = elTmpNode.parentNode;
			}
		}
		
		for(var i=0; i<nInitialLength; i++){
			oNode = aAllNodes[i];

			if(!oNode){continue;}
			
			// --- Range 에 LI 가 포함된 경우에 대한 LI 확인
			if(bIncludeLI && oNode.tagName == "LI" && this._isFullyContained(oNode, arAllBottomNodes)){
				aResult[nResult++] = oNode;
				continue;
			}

			if(oNode.nodeType != 3){continue;}
			if(oNode.nodeValue == "" || oNode.nodeValue.match(/^(\r|\n)+$/)){continue;}

			var oParentNode = nhn.DOMFix.parentNode(oNode);

			// 부모 노드가 SPAN 인 경우에는 새로운 SPAN 을 생성하지 않고 SPAN 을 리턴 배열에 추가함
			if(oParentNode.tagName == "SPAN"){
				if(this._isFullyContained(oParentNode, arAllBottomNodes, oNode)){
					aResult[nResult++] = oParentNode;
					continue;
				}
			}else{
				// [SMARTEDITORSUS-1513] 선택된 영역을 single node로 감싸는 상위 span 노드가 있으면 리턴 배열에 추가 
				var oParentSingleSpan = this._findParentSingleSpan(oParentNode);
				if(oParentSingleSpan){
					aResult[nResult++] = oParentSingleSpan;
					continue;
				}
			}

			oSpan = this._document.createElement("SPAN");
			oParentNode.insertBefore(oSpan, oNode);
			oSpan.appendChild(oNode);
			aResult[nResult++] = oSpan;
			
			if(sNewSpanMarker){oSpan.setAttribute(sNewSpanMarker, "true");}
		}

		this.setStartBefore(oSNode);
		this.setEndAfter(oENode);

		return aResult;
	},

	/**
	 * [SMARTEDITORSUS-1513][SMARTEDITORSUS-1648] 해당노드가 single child로 묶이는 상위 span 노드가 있는지 찾는다.
	 * @param {Node} oNode 검사할 노드
	 * @return {Element} 상위 span 노드, 없으면 null
	 */
	_findParentSingleSpan : function(oNode){
		if(!oNode){
			return null;
		}
		// ZWNBSP 문자가 같이 있는 경우도 있기 때문에 실제 노드를 카운팅해야 함
		for(var i = 0, nCnt = 0, sValue, oChild, aChildNodes = oNode.childNodes; (oChild = aChildNodes[i]); i++){
			sValue = oChild.nodeValue;
			if(this._rxCursorHolder.test(sValue)){
				continue;
			}else{
				nCnt++;
			}
			if(nCnt > 1){	// 싱글노드가 아니면 더이상 찾지 않고 null 반환
				return null;
			}
		}
		if(oNode.nodeName === "SPAN"){
			return oNode;
		}else{
			return this._findParentSingleSpan(oNode.parentNode);
		}
	},
	
	/**
	 * 컨테이너 엘리먼트(elContainer)의 모든 자식노드가 노드 배열(waAllNodes)에 속하는지 확인한다
	 * 첫 번째 자식 노드와 마지막 자식 노드가 노드 배열에 속하는지를 확인한다
	 * @param {Element}		elContainer	컨테이너 엘리먼트
	 * @param {jindo.$A}	waAllNodes	Node 의 $A 배열
	 * @param {Node}		[oNode] 성능을 위한 옵션 노드로 컨테이너의 첫 번째 혹은 마지막 자식 노드와 같으면 indexOf 함수 사용을 줄일 수 있음
	 * @return {Array}	Style 을 적용할 노드 배열
	 */
	// check if all the child nodes of elContainer are in waAllNodes
	_isFullyContained : function(elContainer, waAllNodes, oNode){
		var nSIdx, nEIdx;
		var oTmpNode = this._getVeryFirstRealChild(elContainer);
		// do quick checks before trying indexOf() because indexOf() function is very slow
		// oNode is optional
		if(oNode && oTmpNode == oNode){
			nSIdx = 1;
		}else{
			nSIdx = waAllNodes.indexOf(oTmpNode);
		}

		if(nSIdx != -1){
			oTmpNode = this._getVeryLastRealChild(elContainer);
			if(oNode && oTmpNode == oNode){
				nEIdx = 1;
			}else{
				nEIdx = waAllNodes.indexOf(oTmpNode);
			}
		}

		return (nSIdx != -1 && nEIdx != -1);
	},
	
	_getVeryFirstChild : function(oNode){
		if(oNode.firstChild){return this._getVeryFirstChild(oNode.firstChild);}
		return oNode;
	},

	_getVeryLastChild : function(oNode){
		if(oNode.lastChild){return this._getVeryLastChild(oNode.lastChild);}
		return oNode;
	},

	_getFirstRealChild : function(oNode){
		var oFirstNode = oNode.firstChild;
		while(oFirstNode && oFirstNode.nodeType == 3 && oFirstNode.nodeValue == ""){oFirstNode = oFirstNode.nextSibling;}

		return oFirstNode;
	},
	
	_getLastRealChild : function(oNode){
		var oLastNode = oNode.lastChild;
		while(oLastNode && oLastNode.nodeType == 3 && oLastNode.nodeValue == ""){oLastNode = oLastNode.previousSibling;}

		return oLastNode;
	},
	
	_getVeryFirstRealChild : function(oNode){
		var oFirstNode = this._getFirstRealChild(oNode);
		if(oFirstNode){return this._getVeryFirstRealChild(oFirstNode);}
		return oNode;
	},
	_getVeryLastRealChild : function(oNode){
		var oLastNode = this._getLastRealChild(oNode);
		if(oLastNode){return this._getVeryLastChild(oLastNode);}
		return oNode;
	},

	_getLineStartInfo : function(node){
		var frontEndFinal = null;
		var frontEnd = node;
		var lineBreaker = node;
		var bParentBreak = false;

		var rxLineBreaker = this.rxLineBreaker;

		// vertical(parent) search
		function getLineStart(node){
			if(!node){return;}
			if(frontEndFinal){return;}

			if(rxLineBreaker.test(node.tagName)){
				lineBreaker = node;
				frontEndFinal = frontEnd;

				bParentBreak = true;

				return;
			}else{
				frontEnd = node;
			}

			getFrontEnd(node.previousSibling);

			if(frontEndFinal){return;}
			getLineStart(nhn.DOMFix.parentNode(node));
		}

		// horizontal(sibling) search			
		function getFrontEnd(node){
			if(!node){return;}
			if(frontEndFinal){return;}

			if(rxLineBreaker.test(node.tagName)){
				lineBreaker = node;
				frontEndFinal = frontEnd;

				bParentBreak = false;
				return;
			}

			// [SMARTEDITORSUS-2339] 인라인요소가 많은 경우 recursive limit를 유발한다.
			// @see https://web.archive.org/web/20110128022845/http://www.javascriptrules.com/2009/06/30/limitation-on-call-stacks/
			// 어짜피 블럭요소가 아니라면 하위요소를 찾을 필요가 있을까? 해당 로직이 있는 히스토리를 몰라서 제거하지 않고 주석처리
			// if(node.firstChild && node.tagName != "TABLE"){
			// 	var curNode = node.lastChild;
			// 	while(curNode && !frontEndFinal){
			// 		getFrontEnd(curNode);
			//
			// 		curNode = curNode.previousSibling;
			// 	}
			// }else{
				frontEnd = node;
			// }
			
			if(!frontEndFinal){
				getFrontEnd(node.previousSibling);
			}
		}

		if(rxLineBreaker.test(node.tagName)){
			frontEndFinal = node;
		}else{
			getLineStart(node);
		}
	
		return {oNode: frontEndFinal, oLineBreaker: lineBreaker, bParentBreak: bParentBreak};
	},

	_getLineEndInfo : function(node){
		var backEndFinal = null;
		var backEnd = node;
		var lineBreaker = node;
		var bParentBreak = false;

		var rxLineBreaker = this.rxLineBreaker;

		// vertical(parent) search
		function getLineEnd(node){
			if(!node){return;}
			if(backEndFinal){return;}
			
			if(rxLineBreaker.test(node.tagName)){
				lineBreaker = node;
				backEndFinal = backEnd;

				bParentBreak = true;

				return;
			}else{
				backEnd = node;
			}
	
			getBackEnd(node.nextSibling);
			if(backEndFinal){return;}
	
			getLineEnd(nhn.DOMFix.parentNode(node));
		}
		
		// horizontal(sibling) search
		function getBackEnd(node){
			if(!node){return;}
			if(backEndFinal){return;}

			if(rxLineBreaker.test(node.tagName)){
				lineBreaker = node;
				backEndFinal = backEnd;

				bParentBreak = false;
				
				return;
			}

			// [SMARTEDITORSUS-2339] 인라인요소가 많은 경우 recursive limit를 유발한다.
			// @see https://web.archive.org/web/20110128022845/http://www.javascriptrules.com/2009/06/30/limitation-on-call-stacks/
			// 어짜피 블럭요소가 아니라면 하위요소를 찾을 필요가 있을까? 해당 로직이 있는 히스토리를 몰라서 제거하지 않고 주석처리
			// if(node.firstChild && node.tagName != "TABLE"){
			// 	var curNode = node.firstChild;
			// 	while(curNode && !backEndFinal){
			// 		getBackEnd(curNode);
			//
			// 		curNode = curNode.nextSibling;
			// 	}
			// }else{
				backEnd = node;
			// }
	
			if(!backEndFinal){
				getBackEnd(node.nextSibling);
			}
		}
	
		if(rxLineBreaker.test(node.tagName)){
			backEndFinal = node;
		}else{
			getLineEnd(node);
		}

		return {oNode: backEndFinal, oLineBreaker: lineBreaker, bParentBreak: bParentBreak};
	},

	getLineInfo : function(bAfter){
		bAfter = bAfter || false;
		
		var oSNode = this.getStartNode();
		var oENode = this.getEndNode();

		// oSNode && oENode will be null if the range is currently collapsed and the cursor is not located in the middle of a text node.
		if(!oSNode){oSNode = this.getNodeAroundRange(!bAfter, true);}
		if(!oENode){oENode = this.getNodeAroundRange(!bAfter, true);}
		
		var oStart = this._getLineStartInfo(oSNode);
		var oStartNode = oStart.oNode;
		var oEnd = this._getLineEndInfo(oENode);
		var oEndNode = oEnd.oNode;

		if(oSNode != oStartNode || oENode != oEndNode){
			// check if the start node is positioned after the range's ending point
			// or
			// if the end node is positioned before the range's starting point
			var iRelativeStartPos = this._compareEndPoint(nhn.DOMFix.parentNode(oStartNode), this._getPosIdx(oStartNode), this.endContainer, this.endOffset);
			var iRelativeEndPos = this._compareEndPoint(nhn.DOMFix.parentNode(oEndNode), this._getPosIdx(oEndNode)+1, this.startContainer, this.startOffset);

			if(!(iRelativeStartPos <= 0 && iRelativeEndPos >= 0)){
				oSNode = this.getNodeAroundRange(false, true);
				oENode = this.getNodeAroundRange(false, true);
				oStart = this._getLineStartInfo(oSNode);
				oEnd = this._getLineEndInfo(oENode);
			}
		}

		return {oStart: oStart, oEnd: oEnd};
	},

	/**
	 * 커서홀더나 공백을 제외한 child 노드가 하나만 있는 경우만 node 를 반환한다.  
	 * @param {Node} oNode 확인할 노드
	 * @return {Node} single child node를 반환한다. 없거나 두개 이상이면 null 을 반환  
	 */
	_findSingleChild : function(oNode){
		if(!oNode){
			return null;
		}
		var oSingleChild = null;
		// ZWNBSP 문자가 같이 있는 경우도 있기 때문에 실제 노드를 카운팅해야 함
		for(var i = 0, nCnt = 0, sValue, oChild, aChildNodes = oNode.childNodes; (oChild = aChildNodes[i]); i++){
			sValue = oChild.nodeValue;
			if(this._rxCursorHolder.test(sValue)){
				continue;
			}else{
				oSingleChild = oChild;
				nCnt++;
			}
			if(nCnt > 1){	// 싱글노드가 아니면 더이상 찾지 않고 null 반환
				return null;
			}
		}
		return oSingleChild;
	},

	/**
	 * 해당요소의 최하위까지 검색해 커서홀더만 감싸고 있는지 여부를 반환
	 * @param {Node} oNode 확인할 노드
	 * @return {Boolean} 커서홀더만 있는 경우 true 반환
	 */
	_hasCursorHolderOnly : function(oNode){
		if(!oNode || oNode.nodeType !== 1){
			return false;
		}
		if(this._rxCursorHolder.test(oNode.innerHTML)){
			return true;
		}else{
			return this._hasCursorHolderOnly(this._findSingleChild(oNode));
		}
	}
}).extend(nhn.W3CDOMRange);

/**
 * @fileOverview This file contains cross-browser selection function
 * @name BrowserSelection.js
 */
nhn.BrowserSelection = function(win){
	this.init = function(win){
		this._window = win || window;
		this._document = this._window.document;
	};

	this.init(win);

	// [SMARTEDITORSUS-888] IE9 이후로 document.createRange 를 지원
/*	var oAgentInfo = jindo.$Agent().navigator();
	if(oAgentInfo.ie){
		nhn.BrowserSelectionImpl_IE.apply(this);
	}else{
		nhn.BrowserSelectionImpl_FF.apply(this);
	}*/

	if(this._document.createRange){
		nhn.BrowserSelectionImpl_FF.apply(this);
	}else{
		nhn.BrowserSelectionImpl_IE.apply(this);
	}
	
	this.selectRange = function(oRng){
		this.selectNone();
		this.addRange(oRng);
	};

	this.selectionLoaded = true;
	if(!this._oSelection){this.selectionLoaded = false;}
};

nhn.BrowserSelectionImpl_FF = function(){
	this._oSelection = this._window.getSelection();

	this.getRangeAt = function(iNum){
		iNum = iNum || 0;

		try{
			var oFFRange = this._oSelection.getRangeAt(iNum);
		}catch(e){return new nhn.W3CDOMRange(this._window);}

		return this._FFRange2W3CRange(oFFRange);
	};
			
	this.addRange = function(oW3CRange){
		var oFFRange = this._W3CRange2FFRange(oW3CRange);
		this._oSelection.addRange(oFFRange);
	};

	this.selectNone = function(){
		this._oSelection.removeAllRanges();
	};
	
	this.getCommonAncestorContainer = function(oW3CRange){
		var oFFRange = this._W3CRange2FFRange(oW3CRange);
		return oFFRange.commonAncestorContainer;
	};
	
	this.isCollapsed = function(oW3CRange){
		var oFFRange = this._W3CRange2FFRange(oW3CRange);
		return oFFRange.collapsed;
	};
	
	this.compareEndPoints = function(elContainerA, nOffsetA, elContainerB, nOffsetB){
		var oFFRangeA = this._document.createRange();
		var oFFRangeB = this._document.createRange();
		oFFRangeA.setStart(elContainerA, nOffsetA);
		oFFRangeB.setStart(elContainerB, nOffsetB);
		oFFRangeA.collapse(true);
		oFFRangeB.collapse(true);

		try{
			return oFFRangeA.compareBoundaryPoints(1, oFFRangeB);
		}catch(e){
			return 1;
		}
	};

	this._FFRange2W3CRange = function(oFFRange){
		var oW3CRange = new nhn.W3CDOMRange(this._window);

		oW3CRange.setStart(oFFRange.startContainer, oFFRange.startOffset, true);
		oW3CRange.setEnd(oFFRange.endContainer, oFFRange.endOffset, true);
		
		return oW3CRange;
	};

	this._W3CRange2FFRange = function(oW3CRange){
		var oFFRange = this._document.createRange();
		oFFRange.setStart(oW3CRange.startContainer, oW3CRange.startOffset);
		oFFRange.setEnd(oW3CRange.endContainer, oW3CRange.endOffset);

		return oFFRange;
	};
};

nhn.BrowserSelectionImpl_IE = function(){
	this._oSelection = this._document.selection;
	this.oLastRange = {
		oBrowserRange : null,
		elStartContainer : null,
		nStartOffset : -1,
		elEndContainer : null,
		nEndOffset : -1
	};

	this._updateLastRange = function(oBrowserRange, oW3CRange){
		this.oLastRange.oBrowserRange = oBrowserRange;
		this.oLastRange.elStartContainer = oW3CRange.startContainer;
		this.oLastRange.nStartOffset = oW3CRange.startOffset;
		this.oLastRange.elEndContainer = oW3CRange.endContainer;
		this.oLastRange.nEndOffset = oW3CRange.endOffset;
	};
	
	this.getRangeAt = function(iNum){
		iNum = iNum || 0;

		var oW3CRange, oBrowserRange, oSelectedNode;
		if(this._oSelection.type == "Control"){
			oW3CRange = new nhn.W3CDOMRange(this._window);

			oSelectedNode = this._oSelection.createRange().item(iNum);

			// if the selction occurs in a different document, ignore
			if(!oSelectedNode || oSelectedNode.ownerDocument != this._document){return oW3CRange;}

			oW3CRange.selectNode(oSelectedNode);
			
			return oW3CRange;
		}else{
			//oBrowserRange = this._oSelection.createRangeCollection().item(iNum);
			oBrowserRange = this._oSelection.createRange();

			oSelectedNode = oBrowserRange.parentElement();

			// if the selction occurs in a different document, ignore
			if(!oSelectedNode || oSelectedNode.ownerDocument != this._document){
				oW3CRange = new nhn.W3CDOMRange(this._window);
				return oW3CRange;
			}
			oW3CRange = this._IERange2W3CRange(oBrowserRange);
			
			return oW3CRange;
		}
	};

	this.addRange = function(oW3CRange){
		var oIERange = this._W3CRange2IERange(oW3CRange);
		oIERange.select();
	};

	this.selectNone = function(){
		this._oSelection.empty();
	};

	this.getCommonAncestorContainer = function(oW3CRange){
		return this._W3CRange2IERange(oW3CRange).parentElement();
	};
	
	this.isCollapsed = function(oW3CRange){
		var oRange = this._W3CRange2IERange(oW3CRange);
		var oRange2 = oRange.duplicate();

		oRange2.collapse();

		return oRange.isEqual(oRange2);
	};
	
	this.compareEndPoints = function(elContainerA, nOffsetA, elContainerB, nOffsetB){
		var oIERangeA, oIERangeB;

		if(elContainerA === this.oLastRange.elStartContainer && nOffsetA === this.oLastRange.nStartOffset){
			oIERangeA = this.oLastRange.oBrowserRange.duplicate();
			oIERangeA.collapse(true);
		}else{
			if(elContainerA === this.oLastRange.elEndContainer && nOffsetA === this.oLastRange.nEndOffset){
				oIERangeA = this.oLastRange.oBrowserRange.duplicate();
				oIERangeA.collapse(false);
			}else{
				oIERangeA = this._getIERangeAt(elContainerA, nOffsetA);
			}
		}

		if(elContainerB === this.oLastRange.elStartContainer && nOffsetB === this.oLastRange.nStartOffset){
			oIERangeB = this.oLastRange.oBrowserRange.duplicate();
			oIERangeB.collapse(true);
		}else{
			if(elContainerB === this.oLastRange.elEndContainer && nOffsetB === this.oLastRange.nEndOffset){
				oIERangeB = this.oLastRange.oBrowserRange.duplicate();
				oIERangeB.collapse(false);
			}else{
				oIERangeB = this._getIERangeAt(elContainerB, nOffsetB);
			}
		}

		return oIERangeA.compareEndPoints("StartToStart", oIERangeB);
	};
	
	this._W3CRange2IERange = function(oW3CRange){
		if(this.oLastRange.elStartContainer === oW3CRange.startContainer &&
			this.oLastRange.nStartOffset === oW3CRange.startOffset &&
			this.oLastRange.elEndContainer === oW3CRange.endContainer &&
			this.oLastRange.nEndOffset === oW3CRange.endOffset){
			return this.oLastRange.oBrowserRange;
		}

		var oStartIERange = this._getIERangeAt(oW3CRange.startContainer, oW3CRange.startOffset);
		var oEndIERange = this._getIERangeAt(oW3CRange.endContainer, oW3CRange.endOffset);
		oStartIERange.setEndPoint("EndToEnd", oEndIERange);

		this._updateLastRange(oStartIERange, oW3CRange);

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
//		var oIERange = this._document.body.createTextRange();

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
			//iNumOfLeftNodesToCount = iW3COffset;
			iNumOfLeftNodesToCount = (iW3COffset<aChildNodes.length)?iW3COffset:aChildNodes.length;
		}
//@ room 4 improvement
		var oNodeTester = null;
		var iResultOffset = 0;
		var bCollapseToStart = true;

		for(var i=0; i<iNumOfLeftNodesToCount; i++){
			oNodeTester = aChildNodes[i];

			if(oNodeTester.nodeType == 3){
				if(oNodeTester == oW3CContainer){break;}

				iResultOffset += oNodeTester.nodeValue.length;
			}else{
//				oIERange.moveToElementText(oNodeTester);
				oNonTextNode = oNodeTester;
				iResultOffset = 0;

				bCollapseToStart = false;
			}
		}

		if(oW3CContainer.nodeType == 3){iResultOffset += iW3COffset;}

		return {oSelectableNodeForIE:oNonTextNode, iOffsetForIE: iResultOffset, bCollapseToStart: bCollapseToStart};
	};

	this._IERange2W3CRange = function(oIERange){
		var oW3CRange = new nhn.W3CDOMRange(this._window);

		var oIEPointRange = null;
		var oPosition = null;

		oIEPointRange = oIERange.duplicate();
		oIEPointRange.collapse(true);

		oPosition = this._getW3CContainerAndOffset(oIEPointRange, true);

		oW3CRange.setStart(oPosition.oContainer, oPosition.iOffset, true, true);

		var oCollapsedChecker = oIERange.duplicate();
		oCollapsedChecker.collapse(true);
		if(oCollapsedChecker.isEqual(oIERange)){
			oW3CRange.collapse(true);
		}else{
			oIEPointRange = oIERange.duplicate();
			oIEPointRange.collapse(false);
			oPosition = this._getW3CContainerAndOffset(oIEPointRange);
			oW3CRange.setEnd(oPosition.oContainer, oPosition.iOffset, true);
		}

		this._updateLastRange(oIERange, oW3CRange);

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
			if(aChildNodes[i].nodeType == 3){continue;}

			oRgTester.moveToElementText(aChildNodes[i]);

			if(oRgTester.compareEndPoints("StartToStart", oIEPointRange)>=0){break;}

			oPrevNonTextNode = aChildNodes[i];
		}

		pointRangeIdx = i;

		if(pointRangeIdx !== 0 && aChildNodes[pointRangeIdx-1].nodeType == 3){
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

			var textCount = oRgTextsUpToThePoint.text.replace(/[\r\n]/g,"").length;

			while(textCount > oCurTextNode.nodeValue.length && oCurTextNode.nextSibling){
				textCount -= oCurTextNode.nodeValue.length;
				oCurTextNode = oCurTextNode.nextSibling;
			}

			// this will enforce IE to re-reference oCurTextNode
			oCurTextNode.nodeValue;
			
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
};

nhn.DOMFix = new (jindo.$Class({
	$init : function(){
		if(jindo.$Agent().navigator().ie || jindo.$Agent().navigator().opera){
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
		if(!elNode){return elNode;}

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
			aResult = [];
			elNode = elNode.firstChild;
			while(elNode){
				aResult[nCount++] = elNode;
				elNode=elNode.nextSibling;
			}
		}
		
		return aResult;
	}
}))();