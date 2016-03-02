if(typeof window.nhn=='undefined') window.nhn = {};

/**
 * @fileOverview This file contains a function that takes care of the draggable layers
 * @name N_DraggableLayer.js
 */
nhn.DraggableLayer = $Class({
	$init : function(oLayer, oOptions){
		this.oOptions = $Class({}).extend({
			bModal : "false",
			oHandle : oLayer,
			iMinX : -999999,
			iMinY : -999999,
			iMaxX : 999999,
			iMaxY : 999999
		}).extend(oOptions);

		this.oHandle = this.oOptions.oHandle;
		
		oLayer.style.display = "block";
		oLayer.style.position = "absolute";
		oLayer.style.zIndex = "9999";

		this.aBasePosition = this.getBaseOffset(oLayer);

		// "number-ize" the position and set it as inline style. (the position could've been set as "auto" or set  by css, not inline style)
		oLayer.style.top = (this.toInt($Element(oLayer).offset().top) - this.aBasePosition.top)+"px";
		oLayer.style.left = (this.toInt($Element(oLayer).offset().left) - this.aBasePosition.left)+"px";

		this.$FnMouseDown = $Fn($Fn(this._mousedown, this).bind(oLayer), this);
		this.$FnMouseMove = $Fn($Fn(this._mousemove, this).bind(oLayer), this);
		this.$FnMouseUp = $Fn($Fn(this._mouseup, this).bind(oLayer), this);

		this.$FnMouseDown.attach(this.oHandle, "mousedown");
	},

	_mousedown : function(oLayer, oEvent){
		if(oEvent.element.tagName == "INPUT") return;

		this.MouseOffsetY = (oEvent.pos().clientY-this.toInt(oLayer.style.top)-this.aBasePosition['top']);
		this.MouseOffsetX = (oEvent.pos().clientX-this.toInt(oLayer.style.left)-this.aBasePosition['left']);

		this.$FnMouseMove.attach(oLayer, "mousemove");
		this.$FnMouseUp.attach(oLayer, "mouseup");
	},

	_mousemove : function(oLayer, oEvent){
		var iTop = (oEvent.pos().clientY-this.MouseOffsetY-this.aBasePosition['top']);
		var iLeft = (oEvent.pos().clientX-this.MouseOffsetX-this.aBasePosition['left']);

		if(iTop<this.oOptions.iMinY) iTop = this.oOptions.iMinY;
		if(iTop>this.oOptions.iMaxY) iTop = this.oOptions.iMaxY;
		
		if(iLeft<this.oOptions.iMinX) iLeft = this.oOptions.iMinX;
		if(iLeft>this.oOptions.iMaxX) iLeft = this.oOptions.iMaxX;

		oLayer.style.top = iTop + "px";
		oLayer.style.left = iLeft + "px";
	},

	_mouseup : function(oLayer, oEvent){
		this.$FnMouseMove.detach(oLayer, "mousemove");
		this.$FnMouseUp.detach(oLayer, "mouseup");
	},
	
	toInt : function(num){
		var result = parseInt(num);
		return result || 0;
	},
	
	findNonStatic : function(oEl){
		if(!oEl) return null;
		if(oEl.tagName == "BODY") return oEl;
		
		if($Element(oEl).css("position").match(/absolute|relative/i)) return oEl;

		return this.findNonStatic(oEl.offsetParent);
	},
	
	getBaseOffset : function(oEl){
		var oBase = this.findNonStatic(oEl.offsetParent);
		var tmp = $Element(oBase).offset();

		return {top: tmp.top, left: tmp.left};
	}
});