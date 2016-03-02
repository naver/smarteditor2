 /**
 * @fileOverview This file contains Husky plugin that takes care of the operations related to quote
 * @name hp_SE_Quote.js
 * @required SE_EditingArea_WYSIWYG
 */
nhn.husky.SE2M_Quote = jindo.$Class({
	name : "SE2M_Quote",
	
	htQuoteStyles_view : null,

	$init : function(){
		this.htQuoteStyles_view = {};
		this.htQuoteStyles_view["se2_quote1"] = "_zoom:1;padding:0 8px; margin:0 0 30px 20px; margin-right:15px; border-left:2px solid #cccccc;color:#888888;";
		this.htQuoteStyles_view["se2_quote2"] = "_zoom:1;margin:0 0 30px 13px;padding:0 8px 0 16px;background:url("+nhn.husky.SE2M_Configuration.Quote.sImageBaseURL+"/bg_quote2.gif) 0 3px no-repeat;color:#888888;";
		this.htQuoteStyles_view["se2_quote3"] = "_zoom:1;margin:0 0 30px 0;padding:10px;border:1px dashed #cccccc;color:#888888;";
		this.htQuoteStyles_view["se2_quote4"] = "_zoom:1;margin:0 0 30px 0;padding:10px;border:1px dashed #66b246;color:#888888;";
		this.htQuoteStyles_view["se2_quote5"] = "_zoom:1;margin:0 0 30px 0;padding:10px;border:1px dashed #cccccc;background:url("+nhn.husky.SE2M_Configuration.Quote.sImageBaseURL+"/bg_b1.png) repeat;_background:none;_filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+nhn.husky.SE2M_Configuration.Quote.sImageBaseURL+"/bg_b1.png',sizingMethod='scale');color:#888888;";
		this.htQuoteStyles_view["se2_quote6"] = "_zoom:1;margin:0 0 30px 0;padding:10px;border:1px solid #e5e5e5;color:#888888;";
		this.htQuoteStyles_view["se2_quote7"] = "_zoom:1;margin:0 0 30px 0;padding:10px;border:1px solid #66b246;color:#888888;";
		this.htQuoteStyles_view["se2_quote8"] = "_zoom:1;margin:0 0 30px 0;padding:10px;border:1px solid #e5e5e5;background:url("+nhn.husky.SE2M_Configuration.Quote.sImageBaseURL+"/bg_b1.png) repeat;_background:none;_filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+nhn.husky.SE2M_Configuration.Quote.sImageBaseURL+"/bg_b1.png',sizingMethod='scale');color:#888888;";
		this.htQuoteStyles_view["se2_quote9"] = "_zoom:1;margin:0 0 30px 0;padding:10px;border:2px solid #e5e5e5;color:#888888;";
		this.htQuoteStyles_view["se2_quote10"] = "_zoom:1;margin:0 0 30px 0;padding:10px;border:2px solid #e5e5e5;background:url("+nhn.husky.SE2M_Configuration.Quote.sImageBaseURL+"/bg_b1.png) repeat;_background:none;_filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+nhn.husky.SE2M_Configuration.Quote.sImageBaseURL+"/bg_b1.png',sizingMethod='scale');color:#888888;";
	},

	_assignHTMLElements : function(){
		this.elDropdownLayer = jindo.$$.getSingle("DIV.husky_seditor_blockquote_layer", this.oApp.htOptions.elAppContainer);
		this.aLI = jindo.$$("LI", this.elDropdownLayer);
	},
	
	$ON_REGISTER_CONVERTERS : function(){
		this.oApp.exec("ADD_CONVERTER", ["DB_TO_IR", jindo.$Fn(function(sContents){
			sContents = sContents.replace(/<(blockquote)[^>]*class=['"]?(se2_quote[0-9]+)['"]?[^>]*>/gi, "<$1 class=$2>");
			return sContents;
		}, this).bind()]);
		
		this.oApp.exec("ADD_CONVERTER", ["IR_TO_DB", jindo.$Fn(function(sContents){
			var htQuoteStyles_view = this.htQuoteStyles_view;
			sContents = sContents.replace(/<(blockquote)[^>]*class=['"]?(se2_quote[0-9]+)['"]?[^>]*>/gi, function(sAll, sTag, sClassName){
				return '<'+sTag+' class='+sClassName+' style="'+htQuoteStyles_view[sClassName]+'">';
			});
			return sContents;
		}, this).bind()]);

		this.htSE1toSE2Map = {
			"01" : "1",
			"02" : "2",
			"03" : "6",
			"04" : "8",
			"05" : "9",
			"07" : "3",
			"08" : "5"
		};
		// convert SE1's quotes to SE2's
		// -> 블로그 개발 쪽에서 처리 하기로 함.
		/*
		this.oApp.exec("ADD_CONVERTER", ["DB_TO_IR", jindo.$Fn(function(sContents){
			return sContents.replace(/<blockquote[^>]* class="?vview_quote([0-9]+)"?[^>]*>((?:\s|.)*?)<\/blockquote>/ig, jindo.$Fn(function(m0,sQuoteType,sQuoteContents){
				if (/<!--quote_txt-->((?:\s|.)*?)<!--\/quote_txt-->/ig.test(sQuoteContents)){
					if(!this.htSE1toSE2Map[sQuoteType]){
						return m0;
					}
					
					return '<blockquote class="se2_quote'+this.htSE1toSE2Map[sQuoteType]+'">'+RegExp.$1+'</blockquote>';
				}else{
					return '';
				}
			}, this).bind());
		}, this).bind()]);
		*/
	},

	$LOCAL_BEFORE_FIRST : function(){
		this._assignHTMLElements();

		this.oApp.registerBrowserEvent(this.elDropdownLayer, "click", "EVENT_SE2_BLOCKQUOTE_LAYER_CLICK", []);
		this.oApp.delayedExec("SE2_ATTACH_HOVER_EVENTS", [this.aLI], 0);
	},
	
	$ON_MSG_APP_READY: function(){
		this.oApp.exec("REGISTER_UI_EVENT", ["quote", "click", "TOGGLE_BLOCKQUOTE_LAYER"]);		
	},
	
	$ON_TOGGLE_BLOCKQUOTE_LAYER : function(){
		this.oApp.exec("TOGGLE_TOOLBAR_ACTIVE_LAYER", [this.elDropdownLayer, null, "SELECT_UI", ["quote"], "DESELECT_UI", ["quote"]]);
		this.oApp.exec('MSG_NOTIFY_CLICKCR', ['quote']);
	},

	$ON_EVENT_SE2_BLOCKQUOTE_LAYER_CLICK : function(weEvent){
		var elButton = nhn.husky.SE2M_Utils.findAncestorByTagName("BUTTON", weEvent.element);

		if(!elButton || elButton.tagName != "BUTTON"){return;}
		
		var sClass = elButton.className;
		this.oApp.exec("APPLY_BLOCKQUOTE", [sClass]);
	},
	
	$ON_APPLY_BLOCKQUOTE : function(sClass){
		if(sClass.match(/(se2_quote[0-9]+)/)){
			this._wrapBlock("BLOCKQUOTE", RegExp.$1);
		}else{
			this._unwrapBlock("BLOCKQUOTE");
		}
		
		this.oApp.exec("HIDE_ACTIVE_LAYER", []);
	},

	// [SMARTEDITORSUS-209] 인용구 내에 내용이 없을 때 Backspace 로 인용구가 삭제되도록 처리
	$ON_EVENT_EDITING_AREA_KEYDOWN : function(weEvent) {
		var oSelection,
			elParentQuote;
		
		if ('WYSIWYG' !== this.oApp.getEditingMode()){
			return;
		}
		
		if(8 !== weEvent.key().keyCode){
			return;
		}
				
		oSelection = this.oApp.getSelection();
		oSelection.fixCommonAncestorContainer();
		elParentQuote = this._findParentQuote(oSelection.commonAncestorContainer);

		if(!elParentQuote){
			return;
		}
		
		if(this._isBlankQuote(elParentQuote)){
			weEvent.stop(jindo.$Event.CANCEL_DEFAULT);
		
			oSelection.selectNode(elParentQuote);
			oSelection.collapseToStart();
		
			jindo.$Element(elParentQuote).leave();
			
			oSelection.select();
		}
	},
	
	// [SMARTEDITORSUS-215] Delete 로 인용구 뒤의 P 가 제거되지 않도록 처리
	$ON_EVENT_EDITING_AREA_KEYUP : function(weEvent) {
		var oSelection,
			elParentQuote,
			oP;
		
		if ('WYSIWYG' !== this.oApp.getEditingMode()){
			return;
		}
		
		if(46 !== weEvent.key().keyCode){
			return;
		}
		
		oSelection = this.oApp.getSelection();
		oSelection.fixCommonAncestorContainer();
		elParentQuote = this._findParentQuote(oSelection.commonAncestorContainer);
		
		if(!elParentQuote){
			return false;
		}
		
		if(!elParentQuote.nextSibling){
			weEvent.stop(jindo.$Event.CANCEL_DEFAULT);
			
			oP = oSelection._document.createElement("P");
			oP.innerHTML = "&nbsp;";
			
			jindo.$Element(elParentQuote).after(oP);
						
			setTimeout(jindo.$Fn(function(oSelection){
				var sBookmarkID = oSelection.placeStringBookmark();
				
				oSelection.select();
				oSelection.removeStringBookmark(sBookmarkID);
			},this).bind(oSelection), 0);
		}
	},
	
	_isBlankQuote : function(elParentQuote){
		var	elChild,
			aChildNodes,
			i, nLen, 
			bChrome = this.oApp.oNavigator.chrome,
			bSafari = this.oApp.oNavigator.safari,
			isBlankText = function(sText){
				sText = sText.replace(/[\r\n]/ig, '').replace(unescape("%uFEFF"), '');

				if(sText === ""){
					return true;
				}
				
				if(sText === "&nbsp;" || sText === " "){ // [SMARTEDITORSUS-479]
					return true;
				}
				
				return false;
			},
			isBlank = function(oNode){
				if(oNode.nodeType === 3 && isBlankText(oNode.nodeValue)){
					return true;
				}
				
				if((oNode.tagName === "P" || oNode.tagName === "SPAN") && 
					(isBlankText(oNode.innerHTML) || oNode.innerHTML === "<br>")){					
					return true;
				}

				return false;
			},
			isBlankTable = function(oNode){
				if((jindo.$$("tr", oNode)).length === 0){
					return true;
				}
				
				return false;
			};

		if(isBlankText(elParentQuote.innerHTML) || elParentQuote.innerHTML === "<br>"){
			return true;
		}
		
		if(bChrome || bSafari){	// [SMARTEDITORSUS-352], [SMARTEDITORSUS-502]
			var aTable = jindo.$$("TABLE", elParentQuote),
				nTable = aTable.length,
				elTable;
			
			for(i=0; i<nTable; i++){
				elTable = aTable[i];

				if(isBlankTable(elTable)){
					jindo.$Element(elTable).leave();
				}
			}
		}
		
		aChildNodes = elParentQuote.childNodes;

		for(i=0, nLen=aChildNodes.length; i<nLen; i++){
			elChild = aChildNodes[i];

			if(!isBlank(elChild)){
				return false;
			}
		}
		
		return true;
	},
	
	_getQuoteCount : function(elNode){
		var elBlockNode = elNode;
		var welBlockNode = null;
		var nCount = 1, 
			nMaxChildCount = 0,
			nChildCount = 0, 
			aChildNodes,
			aChildrenOfBlockNode = [],
			nIndex = 0;

		//추가하는 인용구의 부모중에 인용구  사용  Count를 체크한다.
		while(elBlockNode.tagName != "BODY"){			
			elBlockNode = elBlockNode.parentNode;
			while (elBlockNode.tagName == "BLOCKQUOTE") {
				elBlockNode = elBlockNode.parentNode;
				nCount++;
			}
		}
		
		elBlockNode = elNode;
		
		jindo.$A(jindo.$Element(elBlockNode)._element.childNodes).forEach( function(el, i, o){
			if(el.tagName === "BLOCKQUOTE"){
				aChildrenOfBlockNode[nIndex] = el;
				nIndex ++;
			}
		}, this);
		//추가하는 인용구의 자식 중에 인용구 사용  Count를 체크한다.
		for(var k = 0; k < nIndex; k++){
			elBlockNode = aChildrenOfBlockNode[k];
			
			while(elBlockNode.tagName == "BLOCKQUOTE"){
				aChildNodes = jindo.$Element(elBlockNode).child();
				
				if( !!aChildNodes && aChildNodes.length > 0 ){
					welBlockNode = aChildNodes[0]; 
					elBlockNode = welBlockNode.$value();
					while(!!elBlockNode.nextSibling && elBlockNode.tagName != "BLOCKQUOTE"){
						elBlockNode = elBlockNode.nextSibling;
					}
				} else {
					break;
				}
				
				nChildCount++;
			}
			
			// MaxChildCount를 넘김.
			if(nMaxChildCount <= nChildCount) {
				nMaxChildCount = nChildCount;
			}
			
			//14개이상이면 loop를 중단하고 return.
			if( nChildCount + nCount > 14 ){
				nCount = nChildCount + nCount;
				return 	nCount;			
			}else{
				nChildCount = 0;
			}
		}

//		if(elBlockNode.tagName != "BLOCKQUOTE"){
//			return 1;
//		}
		return nCount + nMaxChildCount;
	},
	
	_unwrapBlock : function(tag){
		var oSelection = this.oApp.getSelection();
		var elCommonAncestor = oSelection.commonAncestorContainer;

		while(elCommonAncestor && elCommonAncestor.tagName != tag){elCommonAncestor = elCommonAncestor.parentNode;}
		if(!elCommonAncestor){return;}

		this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["CANCEL BLOCK QUOTE", {sSaveTarget:"BODY"}]);
		
		while(elCommonAncestor.firstChild){elCommonAncestor.parentNode.insertBefore(elCommonAncestor.firstChild, elCommonAncestor);}
		elCommonAncestor.parentNode.removeChild(elCommonAncestor);
		
		this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["CANCEL BLOCK QUOTE", {sSaveTarget:"BODY"}]);
	},
	
	_wrapBlock : function(tag, className){
		var oSelection,
			oLineInfo,
			oStart, oEnd,
			rxDontUseAsWhole = /BODY|TD|LI/i,
			oStartNode, oEndNode, oNode,
			elCommonAncestor,
			elCommonNode,
			elParentQuote,
			elInsertBefore,
			oFormattingNode,
			nQuoteCount,
			elNextNode,
			elParentNode,
			aQuoteChild,
			aQuoteCloneChild,
			i, nLen, oP,
			sBookmarkID;
	
		this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["BLOCK QUOTE", {sSaveTarget:"BODY"}]);
		oSelection = this.oApp.getSelection();
//		var sBookmarkID = oSelection.placeStringBookmark();

		// [SMARTEDITORSUS-430] 문자를 입력하고 Enter 후 인용구를 적용할 때 위의 문자들이 인용구 안에 들어가는 문제
		if(oSelection.startContainer === oSelection.endContainer && 
			oSelection.startContainer.nodeType === 1 &&
			oSelection.startContainer.tagName === "P" &&
			nhn.husky.SE2M_Utils.isBlankNode(oSelection.startContainer)){
						
			oLineInfo = oSelection.getLineInfo(true);
		}else{
			oLineInfo = oSelection.getLineInfo(false);
		}
		
		oStart = oLineInfo.oStart;
		oEnd = oLineInfo.oEnd;
		
		if(oStart.bParentBreak && !rxDontUseAsWhole.test(oStart.oLineBreaker.tagName)){
			oStartNode = oStart.oNode.parentNode;
		}else{
			oStartNode = oStart.oNode;
		}

		if(oEnd.bParentBreak && !rxDontUseAsWhole.test(oEnd.oLineBreaker.tagName)){
			oEndNode = oEnd.oNode.parentNode;
		}else{
			oEndNode = oEnd.oNode;
		}

		oSelection.setStartBefore(oStartNode);
		oSelection.setEndAfter(oEndNode);

		oNode = this._expandToTableStart(oSelection, oEndNode);
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
		// IE에서는 commonAncestorContainer 자체는 select 가능하지 않고, 하위에 commonAncestorContainer를 대체 하더라도 똑같은 영역이 셀렉트 되어 보이는 
		// 노드가 있을 경우 하위 노드가 commonAncestorContainer로 반환됨.
		// 그래서, 스크립트로 commonAncestorContainer 계산 하도록 함.
		// 예)
		// <P><SPAN>TEST</SPAN></p>를 선택 할 경우, <SPAN>TEST</SPAN>가 commonAncestorContainer로 잡힘
		oSelection.fixCommonAncestorContainer();
		elCommonAncestor = oSelection.commonAncestorContainer;

		if(oSelection.startContainer == oSelection.endContainer && oSelection.endOffset-oSelection.startOffset == 1){
			elCommonNode = oSelection.startContainer.childNodes[oSelection.startOffset];
		}else{
			elCommonNode = oSelection.commonAncestorContainer;
		}
		
		elParentQuote = this._findParentQuote(elCommonNode);

		if(elParentQuote){
			elParentQuote.className = className;
			return;
		}

		while(!elCommonAncestor.tagName || (elCommonAncestor.tagName && elCommonAncestor.tagName.match(/UL|OL|LI|IMG|IFRAME/))){
			elCommonAncestor = elCommonAncestor.parentNode;
		}

		// find the insertion position for the formatting tag right beneath the common ancestor container
		while(oNode && oNode != elCommonAncestor && oNode.parentNode != elCommonAncestor){oNode = oNode.parentNode;}

		if(oNode == elCommonAncestor){
			elInsertBefore = elCommonAncestor.firstChild;
		}else{
			elInsertBefore = oNode;
		}
		
		oFormattingNode = oSelection._document.createElement(tag);
		if(className){
			oFormattingNode.className = className;
			//this._setStyle(oFormattingNode, this.htQuoteStyles_editor[className]);
		}

		elCommonAncestor.insertBefore(oFormattingNode, elInsertBefore);

		oSelection.setStartAfter(oFormattingNode);

		oSelection.setEndAfter(oEndNode);
		oSelection.surroundContents(oFormattingNode);
		nQuoteCount = this._getQuoteCount(oFormattingNode);
		
		if(nQuoteCount > 14){
			alert(this.oApp.$MSG("SE2M_Quote.exceedMaxCount"));
			
			this.oApp.exec("HIDE_ACTIVE_LAYER", []);
			
			elNextNode = oFormattingNode.nextSibling;
			elParentNode = oFormattingNode.parentNode;
			aQuoteChild = oFormattingNode.childNodes;
			aQuoteCloneChild = [];
			
			jindo.$Element(oFormattingNode).leave();
			for(i = 0, nLen = aQuoteChild.length; i < nLen; i++){
				aQuoteCloneChild[i] = aQuoteChild[i];
			}
			for(i = 0, nLen = aQuoteCloneChild.length; i < nLen; i++){
				if(!!elNextNode){
					jindo.$Element(elNextNode).before(aQuoteCloneChild[i]);
				}else{
					jindo.$Element(elParentNode).append(aQuoteCloneChild[i]);
				}
			}
			
			return;
		}

		oSelection.selectNodeContents(oFormattingNode);

		// insert an empty line below, so the text cursor can move there
		if(oFormattingNode && oFormattingNode.parentNode && oFormattingNode.parentNode.tagName == "BODY" && !oFormattingNode.nextSibling){
			oP = oSelection._document.createElement("P");
			//oP.innerHTML = unescape("<br/>");
			oP.innerHTML = "&nbsp;";
			oFormattingNode.parentNode.insertBefore(oP, oFormattingNode.nextSibling);
		}

		//		oSelection.removeStringBookmark(sBookmarkID);
		// Insert an empty line inside the blockquote if it's empty.
		// This is done to position the cursor correctly when the contents of the blockquote is empty in Chrome.
		if(nhn.husky.SE2M_Utils.isBlankNode(oFormattingNode)){
			// oFormattingNode.innerHTML = "";
			// oP = oSelection._document.createElement("P");
			// oP.innerHTML = "&nbsp;";
			// oFormattingNode.insertBefore(oP, null);
			// oSelection = this.oApp.getEmptySelection();
			// oSelection.selectNode(oP);
			// [SMARTEDITORSUS-645] 편집영역 포커스 없이 인용구 추가했을 때 IE7에서 박스가 늘어나는 문제
			oFormattingNode.innerHTML = "&nbsp;";
			oSelection.selectNodeContents(oFormattingNode);
			oSelection.collapseToStart();
			oSelection.select();
		}

		//oSelection.select();
		this.oApp.exec("REFRESH_WYSIWYG");
		setTimeout(jindo.$Fn(function(oSelection){
			sBookmarkID = oSelection.placeStringBookmark();
			
			oSelection.select();
			oSelection.removeStringBookmark(sBookmarkID);
			
			this.oApp.exec("FOCUS");	// [SMARTEDITORSUS-469] [SMARTEDITORSUS-434] 에디터 로드 후 최초 삽입한 인용구 안에 포커스가 가지 않는 문제
		},this).bind(oSelection), 0);

		this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["BLOCK QUOTE", {sSaveTarget:"BODY"}]);
		
		return oFormattingNode;
	},
	
	_findParentQuote : function(el){
		return this._findAncestor(jindo.$Fn(function(elNode){
			if(!elNode){return false;}
			if(elNode.tagName !== "BLOCKQUOTE"){return false;}
			if(!elNode.className){return false;}
			
			var sClassName = elNode.className;
			if(!this.htQuoteStyles_view[sClassName]){return false;}
			
			return true;
		}, this).bind(), el);
	},
	
	_findAncestor : function(fnCondition, elNode){
		while(elNode && !fnCondition(elNode)){elNode = elNode.parentNode;}
		
		return elNode;
	},

	_expandToTableStart : function(oSelection, oNode){
		var elCommonAncestor = oSelection.commonAncestorContainer;
		var oResultNode = null;

		var bLastIteration = false;
		while(oNode && !bLastIteration){
			if(oNode == elCommonAncestor){bLastIteration = true;}

			if(/TBODY|TFOOT|THEAD|TR/i.test(oNode.tagName)){
				oResultNode = this._getTableRoot(oNode);
				break;
			}
			oNode = oNode.parentNode;
		}
		
		return oResultNode;
	},
	
	_getTableRoot : function(oNode){
		while(oNode && oNode.tagName != "TABLE"){oNode = oNode.parentNode;}
		
		return oNode;
	},
	
	_setStyle : function(el, sStyle) {
		el.setAttribute("style", sStyle);
		el.style.cssText = sStyle;
	}
});