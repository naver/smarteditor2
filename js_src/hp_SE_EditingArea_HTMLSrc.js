/**
 * @pluginDesc HTML 소스편집 모드 플러그인
 */
nhn.husky.SE_EditingArea_HTMLSrc = $Class({
	name : "SE_EditingArea_HTMLSrc",

	sMode : "HTMLSrc",
	textarea : null,

	$init : function(textarea){
		this.textarea = $(textarea);
		this.elEditingArea = this.textarea;
	},

	$BEFORE_MSG_APP_READY : function(){
		this.oEditingArea = this.textarea;
		this.oApp.exec("REGISTER_EDITING_AREA", [this]);
	},

	$ON_CHANGE_EDITING_MODE : function(sMode, bNoFocus){
		if(sMode == this.sMode){
			this.textarea.style.display = "block";
		}else{
			this.textarea.style.display = "none";
		}
	},
	
	$ON_PASTE_HTML : function(sHTML, oPSelection){
		if(this.oApp.getEditingMode() != this.sMode) return;

		var o = new TextRange(this.textarea);
		o.paste(sHTML);
		this.textarea.focus();
	},

	getIR : function(){
		var sIR;
		var sContent = this.textarea.value;

		if(this.oApp.applyConverter)
			sIR = this.oApp.applyConverter(this.sMode+"_TO_IR", sContent);
		else
			sIR = sContent;

		return sIR;
	},

	setIR : function(sIR){
		var sContent;

		if(this.oApp.applyConverter)
			sContent = this.oApp.applyConverter("IR_TO_"+this.sMode, sIR);
		else
			sContent = sIR;

		this.textarea.value = sContent;
	},
	
	focus : function(){
		this.textarea.focus();
	}
});

var TextRange = function(oEl) {
	this._o = oEl;
};

/**
 * Selection for textfield
 *
 * @author hooriza
 */
TextRange.prototype.getSelection = function() {
	var obj = this._o;
	var ret = [ -1, -1 ];

	if (isNaN(this._o.selectionStart)) {
		obj.focus();

		// textarea support added by nagoon97
		var range = document.body.createTextRange();
		var rangeField = null;

		rangeField = document.selection.createRange().duplicate();
		range.moveToElementText(obj);
		rangeField.collapse(true);
		range.setEndPoint("EndToEnd", rangeField);
		ret[0] = range.text.length;

		rangeField = document.selection.createRange().duplicate();
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
	if (typeof end == 'undefined') end = start;

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
	if ( typeof document.body.style.maxHeight == "undefined" ) {
		var a = pre.match( /\n/gi );
		n = ( a != null ? a.length : 0 );
	}
	this.setSelection(sel[0] + sStr.length - n );

};

TextRange.prototype.cut = function() {
	var r = this.copy();
	this.paste('');

	return r;
};
//}