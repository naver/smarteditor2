/**
 * @pluginDesc 링크 걸기 플러그인
 */
nhn.husky.SE_Hyperlink = $Class({
	name : "SE_Hyperlink",
	sATagMarker : "HTTP://HUSKY_TMP.MARKER/",
	
	$init : function(elAppContainer){
		this._assignHTMLObjects(elAppContainer);
		this.sRXATagMarker = this.sATagMarker.replace(/\//g, "\\/").replace(/\./g, "\\.");
	},
	
	_assignHTMLObjects : function(elAppContainer){
		this.oHyperlinkLayer = cssquery.getSingle("DIV.husky_seditor_hyperlink_layer", elAppContainer);
		this.oLinkInput = cssquery.getSingle("INPUT[type=text]", this.oHyperlinkLayer);
		
		this.oBtnConfirm = cssquery.getSingle("BUTTON.confirm", this.oHyperlinkLayer);
		this.oBtnCancel = cssquery.getSingle("BUTTON.cancel", this.oHyperlinkLayer);
		
		this.oCbNewWin = cssquery.getSingle("INPUT[type=checkbox]", this.oHyperlinkLayer);
	},

	$ON_MSG_APP_READY : function(){
		this.oApp.exec("REGISTER_HOTKEY", ["ctrl+k", "SE_TOGGLE_HYPERLINK_LAYER", []]);
		
		this.oApp.registerBrowserEvent(this.oBtnConfirm, "mousedown", "SE_APPLY_HYPERLINK");
		this.oApp.registerBrowserEvent(this.oBtnCancel, "mousedown", "HIDE_ACTIVE_LAYER");

		this.oApp.registerBrowserEvent(this.oLinkInput, "keydown", "EVENT_SE_HYPERLINK_KEYDOWN");
		
		this.oApp.exec("REGISTER_UI_EVENT", ["hyperlink", "click", "SE_TOGGLE_HYPERLINK_LAYER"]);
	},
	
	$ON_SE_TOGGLE_HYPERLINK_LAYER : function(){
		// hotkey may close the layer right away so delay here
		this.oApp.delayedExec("TOGGLE_TOOLBAR_ACTIVE_LAYER", [this.oHyperlinkLayer, "hyperlink", "SE_RESET_HYPERLINK_LAYER", []], 0);
	},
	
	$ON_SE_RESET_HYPERLINK_LAYER : function(){
		this.oApp.exec("FOCUS", []);
		this.oSelection = this.oApp.getSelection();
		var oAnchor = this.oSelection.findAncestorByTagName("A");
		this.oCbNewWin.checked = false;
		if(oAnchor){
			this.oSelection.selectNode(oAnchor);
			this.oSelection.select();
			
			var sTarget = oAnchor.target;
			if(sTarget && sTarget == "_blank") this.oCbNewWin.checked = true;

			this.oLinkInput.value = oAnchor.href?oAnchor.href:"http://";
		}else{
			this.oLinkInput.value = "http://";
		}

		this.oLinkInput.focus();
		this.oLinkInput.value = this.oLinkInput.value;
	},
	
	$ON_SE_APPLY_HYPERLINK : function(){
		var sURL = this.oLinkInput.value;

		this.oApp.exec("FOCUS", []);
		this.oSelection = this.oApp.getSelection();

		if(this._validateURL(sURL)){
			var sTarget = "";
			if(this.oCbNewWin.checked)
				sTarget = "_blank";
			else
				sTarget = "_self";

			if(this.oSelection.collapsed){
				var str = "<a href='" + sURL + "' target="+sTarget+">" + sURL + "</a>";
				this.oSelection.pasteHTML(str);
			}else{
				var nSession = Math.ceil(Math.random()*10000);
				var arg = ( sURL == "" ? ["unlink"] : ["createLink", false, this.sATagMarker+nSession+sURL] );
				this.oApp.exec("EXECCOMMAND", arg);

				this.oSelection.setFromSelection();

				var oDoc = this.oApp.getWYSIWYGDocument();
				var aATags = oDoc.body.getElementsByTagName("A");
				var nLen = aATags.length;
				var rxMarker = new RegExp(this.sRXATagMarker+nSession, "i");
				var elATag;
				for(var i=0; i<nLen; i++){
					elATag = aATags[i];
					if(elATag.href && elATag.href.match(rxMarker)){
						elATag.href = elATag.href.replace(rxMarker, "");
						elATag.target = sTarget;
					}
				}
			}
			this.oApp.exec("HIDE_ACTIVE_LAYER");
			
			setTimeout($Fn(function(){this.oSelection.select()}, this).bind(this), 0);
		}else{
			alert(this.oApp.$MSG("SE_Hyperlink.invalidURL"));
			this.oLinkInput.focus();
		}
	},
	
	_validateURL : function(sURL){
		return /^(http|https|ftp|mailto):(?:\/\/)?((\w|-)+(?:[\.:@](\w|-))+)(?:\/|@)?([^"\?]*?)(?:\?([^\?"]*?))?$/.test(sURL);
	},

	$ON_EVENT_SE_HYPERLINK_KEYDOWN : function(oEvent){
		if (oEvent.key().enter){
			this.oApp.exec("SE_APPLY_HYPERLINK");
			oEvent.stop();
		}
	}
});