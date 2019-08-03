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
 /**
 * @fileOverview This file contains Husky plugin that takes care of the operations related to quote
 * @name hp_SE_Quote.js
 * @required SE_EditingArea_WYSIWYG
 */
nhn.husky.SE2M_Quote = jindo.$Class({
	name : "SE2M_Quote",
	
	htQuoteStyles_view : null,

	$init : function(){
		var htConfig = nhn.husky.SE2M_Configuration.Quote || {};
		var sImageBaseURL = htConfig.sImageBaseURL;
		
		this.nMaxLevel = htConfig.nMaxLevel || 14;
		
		this.htQuoteStyles_view = {};
		this.htQuoteStyles_view["se2_quote1"] = "_zoom:1;padding:0 8px; margin:0 0 30px 20px; margin-right:15px; border-left:2px solid #cccccc;color:#888888;";
		this.htQuoteStyles_view["se2_quote2"] = "_zoom:1;margin:0 0 30px 13px;padding:0 8px 0 16px;background:url("+sImageBaseURL+"/bg_quote2.gif) 0 3px no-repeat;color:#888888;";
		this.htQuoteStyles_view["se2_quote3"] = "_zoom:1;margin:0 0 30px 0;padding:10px;border:1px dashed #cccccc;color:#888888;";
		this.htQuoteStyles_view["se2_quote4"] = "_zoom:1;margin:0 0 30px 0;padding:10px;border:1px dashed #66b246;color:#888888;";
		this.htQuoteStyles_view["se2_quote5"] = "_zoom:1;margin:0 0 30px 0;padding:10px;border:1px dashed #cccccc;background:url("+sImageBaseURL+"/bg_b1.png) repeat;_background:none;_filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+sImageBaseURL+"/bg_b1.png',sizingMethod='scale');color:#888888;";
		this.htQuoteStyles_view["se2_quote6"] = "_zoom:1;margin:0 0 30px 0;padding:10px;border:1px solid #e5e5e5;color:#888888;";
		this.htQuoteStyles_view["se2_quote7"] = "_zoom:1;margin:0 0 30px 0;padding:10px;border:1px solid #66b246;color:#888888;";
		this.htQuoteStyles_view["se2_quote8"] = "_zoom:1;margin:0 0 30px 0;padding:10px;border:1px solid #e5e5e5;background:url("+sImageBaseURL+"/bg_b1.png) repeat;_background:none;_filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+sImageBaseURL+"/bg_b1.png',sizingMethod='scale');color:#888888;";
		this.htQuoteStyles_view["se2_quote9"] = "_zoom:1;margin:0 0 30px 0;padding:10px;border:2px solid #e5e5e5;color:#888888;";
		this.htQuoteStyles_view["se2_quote10"] = "_zoom:1;margin:0 0 30px 0;padding:10px;border:2px solid #e5e5e5;background:url("+sImageBaseURL+"/bg_b1.png) repeat;_background:none;_filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+sImageBaseURL+"/bg_b1.png',sizingMethod='scale');color:#888888;";
	},

	_assignHTMLElements : function(){
		//@ec
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
		this.oApp.registerLazyMessage(["TOGGLE_BLOCKQUOTE_LAYER"], ["hp_SE2M_Quote$Lazy.js"]);
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
	}
});