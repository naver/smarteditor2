//{
/**
 * @fileOverview This file contains Husky plugin that takes care of the operations related to hyperlink
 * @name hp_SE_Hyperlink.js
 */
nhn.husky.SE2M_Hyperlink = jindo.$Class({
	name : "SE2M_Hyperlink",
	sATagMarker : "HTTP://HUSKY_TMP.MARKER/",
	
	_assignHTMLElements : function(elAppContainer){
		this.oHyperlinkButton = jindo.$$.getSingle("li.husky_seditor_ui_hyperlink", elAppContainer);
		this.oHyperlinkLayer = jindo.$$.getSingle("div.se2_layer", this.oHyperlinkButton);
		this.oLinkInput = jindo.$$.getSingle("INPUT[type=text]", this.oHyperlinkLayer);
		
		this.oBtnConfirm = jindo.$$.getSingle("button.se2_apply", this.oHyperlinkLayer);
		this.oBtnCancel = jindo.$$.getSingle("button.se2_cancel", this.oHyperlinkLayer);
		
		//this.oCbNewWin = jindo.$$.getSingle("INPUT[type=checkbox]", this.oHyperlinkLayer) || null;
	},

	_generateAutoLink : function(sAll, sBreaker, sURL, sWWWURL, sHTTPURL) {
		sBreaker = sBreaker || "";

		var sResult;
		if (sWWWURL){
			sResult = '<a href="http://'+sWWWURL+'">'+sURL+'</a>';
		} else {
			sResult = '<a href="'+sHTTPURL+'">'+sURL+'</a>';
		}
		
		return sBreaker+sResult;
	},
	
	$ON_MSG_APP_READY : function(){
		this.bLayerShown = false;

		this.oApp.exec("REGISTER_UI_EVENT", ["hyperlink", "click", "TOGGLE_HYPERLINK_LAYER"]);
		this.oApp.exec("REGISTER_HOTKEY", ["ctrl+k", "TOGGLE_HYPERLINK_LAYER", []]);
	},
	
	$ON_REGISTER_CONVERTERS : function(){
		this.oApp.exec("ADD_CONVERTER_DOM", ["IR_TO_DB", jindo.$Fn(function(oTmpNode){
			//저장 시점에 자동 링크를 위한 함수.	
			var oTmpRange = this.oApp.getEmptySelection();
			var elFirstNode = oTmpRange._getFirstRealChild(oTmpNode);
			var elLastNode = oTmpRange._getLastRealChild(oTmpNode);
			var waAllNodes = jindo.$A(oTmpRange._getNodesBetween(elFirstNode, elLastNode));
			var aAllTextNodes = waAllNodes.filter(function(elNode){return (elNode && elNode.nodeType === 3);}).$value();
			var a = aAllTextNodes;
			
			/*
			// 텍스트 검색이 용이 하도록 끊어진 텍스트 노드가 있으면 합쳐줌. (화면상으로 ABC라고 보이나 상황에 따라 실제 2개의 텍스트 A, BC로 이루어져 있을 수 있음. 이를 ABC 하나의 노드로 만들어 줌.)
			// 문제 발생 가능성에 비해서 퍼포먼스나 사이드 이펙트 가능성 높아 일단 주석
			var aCleanTextNodes = [];
			for(var i=0, nLen=aAllTextNodes.length; i<nLen; i++){
				if(a[i].nextSibling && a[i].nextSibling.nodeType === 3){
					a[i].nextSibling.nodeValue += a[i].nodeValue;
					a[i].parentNode.removeChild(a[i]);
				}else{
					aCleanTextNodes[aCleanTextNodes.length] = a[i];
				}
			}
			*/
			var aCleanTextNodes = aAllTextNodes;
			
			// IE에서 PRE를 제외한 다른 태그 하위에 있는 텍스트 노드는 줄바꿈 등의 값을 변질시킴
			var elTmpDiv = this.oApp.getWYSIWYGDocument().createElement("DIV");
			var elParent, bAnchorFound;
			var sTmpStr = "@"+(new Date()).getTime()+"@";
			var rxTmpStr = new RegExp(sTmpStr, "g");
			for(var i=0, nLen=aAllTextNodes.length; i<nLen; i++){
				// Anchor가 이미 걸려 있는 텍스트이면 링크를 다시 걸지 않음.
				elParent = a[i].parentNode;
				bAnchorFound = false;
				while(elParent){
					if(elParent.tagName === "A" || elParent.tagName === "PRE"){
						bAnchorFound = true;
						break;
					}
					elParent = elParent.parentNode;
				}
				if(bAnchorFound){
					continue;
				}
				// www.또는 http://으로 시작하는 텍스트에 링크 걸어 줌
				// IE에서 텍스트 노드 앞쪽의 스페이스나 주석등이 사라지는 현상이 있어 sTmpStr을 앞에 붙여줌.
				elTmpDiv.innerHTML = "";
				elTmpDiv.appendChild(a[i].cloneNode(true));

				// IE에서 innerHTML를 이용 해 직접 텍스트 노드 값을 할당 할 경우 줄바꿈등이 깨질 수 있어, 텍스트 노드로 만들어서 이를 바로 append 시켜줌
				elTmpDiv.innerHTML = (sTmpStr+elTmpDiv.innerHTML).replace(/(&nbsp|\s)?(((?!http:\/\/)www\.(?:(?!\&nbsp;|\s|"|').)+)|(http:\/\/(?:(?!&nbsp;|\s|"|').)+))/ig, this._generateAutoLink);

				// innerHTML 내에 텍스트가 있을 경우 insert 시에 주변 텍스트 노드와 합쳐지는 현상이 있어 div로 위치를 먼저 잡고 하나씩 삽입
				a[i].parentNode.insertBefore(elTmpDiv, a[i]);
				a[i].parentNode.removeChild(a[i]);
				while(elTmpDiv.firstChild){
					elTmpDiv.parentNode.insertBefore(elTmpDiv.firstChild, elTmpDiv);
				}
				elTmpDiv.parentNode.removeChild(elTmpDiv);
//				alert(a[i].nodeValue);
			}
			oTmpNode.innerHTML = oTmpNode.innerHTML.replace(rxTmpStr, "");
//alert(oTmpNode.innerHTML);
		}, this).bind()]);
	},
	
	$LOCAL_BEFORE_FIRST : function(sMsg){
		if(!!sMsg.match(/(REGISTER_CONVERTERS)/)){
			this.oApp.acceptLocalBeforeFirstAgain(this, true);
			return true;
		}

		this._assignHTMLElements(this.oApp.htOptions.elAppContainer);
		this.sRXATagMarker = this.sATagMarker.replace(/\//g, "\\/").replace(/\./g, "\\.");
		this.oApp.registerBrowserEvent(this.oBtnConfirm, "click", "APPLY_HYPERLINK");
		this.oApp.registerBrowserEvent(this.oBtnCancel, "click", "HIDE_ACTIVE_LAYER");
		this.oApp.registerBrowserEvent(this.oLinkInput, "keydown", "EVENT_HYPERLINK_KEYDOWN");
	},
	
	//@lazyload_js TOGGLE_HYPERLINK_LAYER,APPLY_HYPERLINK[
	$ON_TOGGLE_HYPERLINK_LAYER : function(){
		if(!this.bLayerShown){
			this.oApp.exec("IE_FOCUS", []);
			this.oSelection = this.oApp.getSelection();
		}

		// hotkey may close the layer right away so delay here
		this.oApp.delayedExec("TOGGLE_TOOLBAR_ACTIVE_LAYER", [this.oHyperlinkLayer, null, "MSG_HYPERLINK_LAYER_SHOWN", [], "MSG_HYPERLINK_LAYER_HIDDEN", [""]], 0);
		this.oApp.exec('MSG_NOTIFY_CLICKCR', ['hyperlink']);
	},
	
	$ON_MSG_HYPERLINK_LAYER_SHOWN : function(){
		this.bLayerShown = true;
		var oAnchor = this.oSelection.findAncestorByTagName("A");

		if (!oAnchor) {
			oAnchor = this._getSelectedNode();
		}
		//this.oCbNewWin.checked = false;

		if(oAnchor && !this.oSelection.collapsed){
			this.oSelection.selectNode(oAnchor);
			this.oSelection.select();
			
			var sTarget = oAnchor.target;
			//if(sTarget && sTarget == "_blank"){this.oCbNewWin.checked = true;}

			// href속성에 문제가 있을 경우, 예: href="http://na&nbsp;&nbsp; ver.com", IE에서 oAnchor.href 접근 시에 알수 없는 오류를 발생시킴
			try{
				var sHref = oAnchor.getAttribute("href");
				this.oLinkInput.value = sHref && sHref.indexOf("#") == -1 ? sHref : "http://";
			}catch(e){
				this.oLinkInput.value = "http://";
			}
			
			this.bModify = true;
		}else{
			this.oLinkInput.value = "http://";
			this.bModify = false;
		}
		this.oApp.delayedExec("SELECT_UI", ["hyperlink"], 0);
		this.oLinkInput.focus();
		
		this.oLinkInput.value = this.oLinkInput.value;
		this.oLinkInput.select();
	},
	
	$ON_MSG_HYPERLINK_LAYER_HIDDEN : function(){
		this.bLayerShown = false;
		
		this.oApp.exec("DESELECT_UI", ["hyperlink"]);
	},
	
	$ON_APPLY_HYPERLINK : function(){
		var sURL = this.oLinkInput.value;
		if(!/^((http|https|ftp|mailto):(?:\/\/)?)/.test(sURL)){
			sURL = "http://"+sURL;
		}
		sURL = sURL.replace(/\s+$/, "");
		
		var oAgent = jindo.$Agent().navigator();
		var sBlank = "";

		this.oApp.exec("IE_FOCUS", []);
		
		if(oAgent.ie){sBlank = "<span style=\"text-decoration:none;\">&nbsp;</span>";}
		
		if(this._validateURL(sURL)){
			//if(this.oCbNewWin.checked){
			if(false){
				sTarget = "_blank";
			}else{
				sTarget = "_self";
			}
			
			this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["HYPERLINK", {sSaveTarget:(this.bModify ? "A" : null)}]);
			
			var sBM;
			if(this.oSelection.collapsed){
				var str = "<a href='" + sURL + "' target="+sTarget+">" + sURL + "</a>" + sBlank;
				this.oSelection.pasteHTML(str);
				sBM = this.oSelection.placeStringBookmark();
			}else{
				// 브라우저에서 제공하는 execcommand에 createLink로는 타겟을 지정할 수가 없다.
				// 그렇기 때문에, 더미 URL을 createLink에 넘겨서 링크를 먼저 걸고, 이후에 loop을 돌면서 더미 URL을 가진 A태그를 찾아서 정상 URL 및 타겟을 세팅 해 준다.
				sBM = this.oSelection.placeStringBookmark();
				this.oSelection.select();
				
				// [SMARTEDITORSUS-61] TD 안에 있는 텍스트를 전체 선택하여 URL 변경하면 수정되지 않음 (only IE8)
				//		SE_EditingArea_WYSIWYG 에서는 IE인 경우, beforedeactivate 이벤트가 발생하면 현재의 Range를 저장하고, RESTORE_IE_SELECTION 메시지가 발생하면 저장된 Range를 적용한다.
				//		IE8 또는 IE7 호환모드이고 TD 안의 텍스트 전체를 선택한 경우  Bookmark 생성 후의 select()를 처리할 때
				//		HuskyRange 에서 호출되는 this._oSelection.empty(); 에서 beforedeactivate 가 발생하여 empty 처리된 selection 이 저장되는 문제가 있어 링크가 적용되지 않음.
				//		올바른 selection 이 저장되어 EXECCOMMAND에서 링크가 적용될 수 있도록 함
				if(oAgent.ie && (oAgent.version === 8 || oAgent.nativeVersion === 8)){	// nativeVersion 으로 IE7 호환모드인 경우 확인
					this.oApp.exec("IE_FOCUS", []);
					this.oSelection.moveToBookmark(sBM);
					this.oSelection.select();
				}
				
				// createLink 이후에 이번에 생성된 A 태그를 찾을 수 있도록 nSession을 포함하는 더미 링크를 만든다.
				var nSession = Math.ceil(Math.random()*10000);
				
				if(sURL == ""){	// unlink
					this.oApp.exec("EXECCOMMAND", ["unlink"]);
				}else{			// createLink
					if(this._isExceptional()){	
						this.oApp.exec("EXECCOMMAND", ["unlink", false, "", {bDontAddUndoHistory: true}]);
						
						var sTempUrl = "<a href='" + sURL + "' target="+sTarget+">";
 						
						jindo.$A(this.oSelection.getNodes(true)).forEach(function(value, index, array){
							var oEmptySelection = this.oApp.getEmptySelection();

							if(value.nodeType === 3){
								oEmptySelection.selectNode(value);
								oEmptySelection.pasteHTML(sTempUrl + value.nodeValue + "</a>");
							}else if(value.nodeType === 1 && value.tagName === "IMG"){
								oEmptySelection.selectNode(value);
								oEmptySelection.pasteHTML(sTempUrl + jindo.$Element(value).outerHTML() + "</a>");
							}
						}, this);
					}else{
						this.oApp.exec("EXECCOMMAND", ["createLink", false, this.sATagMarker+nSession+encodeURIComponent(sURL), {bDontAddUndoHistory: true}]);
					}
				}

				var oDoc = this.oApp.getWYSIWYGDocument();
				var aATags = oDoc.body.getElementsByTagName("A");
				var nLen = aATags.length;
				
				var rxMarker = new RegExp(this.sRXATagMarker+nSession, "gi");
				var elATag;
				
				for(var i=0; i<nLen; i++){
					elATag = aATags[i];

					var sHref = "";
					try{
						sHref = elATag.getAttribute("href");
					}catch(e){}
					if (sHref && sHref.match(rxMarker)) {
						var sNewHref = sHref.replace(rxMarker, "");
						var sDecodeHref = decodeURIComponent(sNewHref);
						if(oAgent.ie){
							jindo.$Element(elATag).attr({
								"href" : sDecodeHref,
								"target" : sTarget
							});
						//}else if(oAgent.firefox){
						}else{
							var sAContent = jindo.$Element(elATag).html();
							jindo.$Element(elATag).attr({
								"href" : sDecodeHref,
								"target" : sTarget
							});
							if(this._validateURL(sAContent)){
								jindo.$Element(elATag).html(jindo.$Element(elATag).attr("href"));
							}
						}
						/*else{
							elATag.href = sDecodeHref;
						}
						*/
					}
				}
			}
			
			this.oApp.exec("HIDE_ACTIVE_LAYER");
			setTimeout(jindo.$Fn(function(){
				var oSelection = this.oApp.getEmptySelection();
				oSelection.moveToBookmark(sBM);
				oSelection.collapseToEnd();
				oSelection.select();
				oSelection.removeStringBookmark(sBM);
	
				this.oApp.exec("FOCUS");
				this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["HYPERLINK", {sSaveTarget:(this.bModify ? "A" : null)}]);
			}, this).bind(), 17);			
		}else{
			alert(this.oApp.$MSG("SE_Hyperlink.invalidURL"));
			this.oLinkInput.focus();
		}
	},
	
	_isExceptional : function(){
		var oNavigator = jindo.$Agent().navigator(),
			bImg = false, bEmail = false;
		
		if(!oNavigator.ie){
			return false;
		}

		// [SMARTEDITORSUS-612] 이미지 선택 후 링크 추가했을 때 링크가 걸리지 않는 문제
		if(this.oApp.getWYSIWYGDocument().selection.type === "None"){
			bImg = jindo.$A(this.oSelection.getNodes()).some(function(value, index, array){
				if(value.nodeType === 1 && value.tagName === "IMG"){
					return true;
				}
			}, this);
			
			if(bImg){
				return true;
			}	
		}

		if(oNavigator.nativeVersion > 8){	// version? nativeVersion?
			return false;
		}	
		
		// [SMARTEDITORSUS-579] IE8 이하에서 E-mail 패턴 문자열에 URL 링크 못거는 이슈
		bEmail = jindo.$A(this.oSelection.getTextNodes()).some(function(value, index, array){
			if(value.nodeValue.indexOf("@") >= 1){
				return true;
			}
		}, this);

		if(bEmail){
			return true;
		}
		
		return false;
	},
	
	//@lazyload_js]
	$ON_EVENT_HYPERLINK_KEYDOWN : function(oEvent){
		if (oEvent.key().enter){
			this.oApp.exec("APPLY_HYPERLINK");
			oEvent.stop();
		}
	},
	
	_getSelectedNode : function(){
		var aNodes = this.oSelection.getNodes();
		
		for (var i = 0; i < aNodes.length; i++) {
			if (aNodes[i].tagName && aNodes[i].tagName == "A") {
				return aNodes[i];
			}
		}
	},
	
	_validateURL : function(sURL){
		if(!sURL){return false;}

		// escape 불가능한 %가 들어있나 확인
		try{
			var aURLParts = sURL.split("?");
			aURLParts[0] = aURLParts[0].replace(/%[a-z0-9]{2}/gi, "U");
			decodeURIComponent(aURLParts[0]);
		}catch(e){
			return false;
		}
		return /^(http|https|ftp|mailto):(\/\/)?(([-가-힣]|\w)+(?:[\/\.:@]([-가-힣]|\w)+)+)\/?(.*)?\s*$/i.test(sURL);
	}
});
//}