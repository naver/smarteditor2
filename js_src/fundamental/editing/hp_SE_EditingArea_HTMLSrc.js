//{
/**
  * @fileOverview This file contains Husky plugin that takes care of the operations directly related to editing the HTML source code using Textarea element
 * @name hp_SE_EditingArea_HTMLSrc.js
 * @required SE_EditingAreaManager
 */
nhn.husky.SE_EditingArea_HTMLSrc = jindo.$Class({
	name : "SE_EditingArea_HTMLSrc",
	sMode : "HTMLSrc",
	
	$init : function(sTextArea) { 
		this.elEditingArea = jindo.$(sTextArea);
	},

	$BEFORE_MSG_APP_READY : function() {
		this.oNavigator = jindo.$Agent().navigator();
		this.oApp.exec("REGISTER_EDITING_AREA", [this]);
	},

	$ON_CHANGE_EDITING_MODE : function(sMode) {
		if (sMode == this.sMode) {				
			this.elEditingArea.style.display = "block";
		} else {
			this.elEditingArea.style.display = "none";
		}
	},
	
	$AFTER_CHANGE_EDITING_MODE : function(sMode) {
		if (sMode == this.sMode) {					
			var o = new TextRange(this.elEditingArea);
			o.setSelection(0, 0);
			
			//모바일 textarea에서는 직접 클릭을해야만 키보드가 먹히기 때문에 우선은 커서가 안보이게 해서 사용자가 직접 클릭을 유도.
			if(!!this.oNavigator.msafari){
				this.elEditingArea.blur();
			}
		}
	},
	
	getIR : function() { 
		var sIR = this.getRawContents();		
		if (this.oApp.applyConverter) {
			sIR = this.oApp.applyConverter(this.sMode + "_TO_IR", sIR, this.oApp.getWYSIWYGDocument());
		}

		return sIR;
	},

	setIR : function(sIR) {
		var sContent = sIR;
		if (this.oApp.applyConverter) {
			sContent = this.oApp.applyConverter("IR_TO_" + this.sMode, sContent, this.oApp.getWYSIWYGDocument());
		}
		
		this.setRawContents(sContent);	
	},
	
	setRawContents : function(sContent) {
		if (typeof sContent !== 'undefined') {
			this.elEditingArea.value = sContent;
		}
	},
	
	getRawContents : function() {
		return this.elEditingArea.value;
	},
	
	focus : function() {
		this.elEditingArea.focus();
	}
});

/**
 * Selection for textfield
 * @author hooriza
 */
if (typeof window.TextRange == 'undefined') { window.TextRange = {}; }
TextRange = function(oEl, oDoc) { 
	this._o = oEl;
	this._oDoc = (oDoc || document);
};

TextRange.prototype.getSelection = function() {
	var obj = this._o;
	var ret = [-1, -1];

	if(isNaN(this._o.selectionStart)) {
		obj.focus();

		// textarea support added by nagoon97
		var range = this._oDoc.body.createTextRange();
		var rangeField = null;

		rangeField = this._oDoc.selection.createRange().duplicate();
		range.moveToElementText(obj);
		rangeField.collapse(true);
		range.setEndPoint("EndToEnd", rangeField);
		ret[0] = range.text.length;

		rangeField = this._oDoc.selection.createRange().duplicate();
		range.moveToElementText(obj);
		rangeField.collapse(false);
		range.setEndPoint("EndToEnd", rangeField);
		ret[1] = range.text.length;

		obj.blur();
	} else {
		ret[0] = obj.selectionStart;
		ret[1] = obj.selectionEnd;
	}

	return ret;
};

TextRange.prototype.setSelection = function(start, end) {
	var obj = this._o;
	if (typeof end == 'undefined') {
		end = start;
	}

	if (obj.setSelectionRange) {
		obj.setSelectionRange(start, end);
	} else if (obj.createTextRange) {
		var range = obj.createTextRange();
		range.collapse(true);
		range.moveStart("character", start);
		range.moveEnd("character", end - start);
		range.select();
		obj.blur();
	}
};

TextRange.prototype.copy = function() {
	var r = this.getSelection();
	return this._o.value.substring(r[0], r[1]);
};

TextRange.prototype.paste = function(sStr) {
	var obj = this._o;
	var sel = this.getSelection();
	var value = obj.value;
	var pre = value.substr(0, sel[0]);
	var post = value.substr(sel[1]);

	value = pre + sStr + post;
	obj.value = value;

	var n = 0;
	if (typeof this._oDoc.body.style.maxHeight == "undefined") {
		var a = pre.match(/\n/gi);
		n = ( a !== null ? a.length : 0 );
	}
	
	this.setSelection(sel[0] + sStr.length - n);
};

TextRange.prototype.cut = function() {
	var r = this.copy();
	this.paste('');
	return r;
};
//}