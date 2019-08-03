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
nhn.husky.HuskyCore.addLoadedFile("N_DraggableLayer.js");
/**
 * @fileOverview This file contains a function that takes care of the draggable layers
 * @name N_DraggableLayer.js
 */
nhn.DraggableLayer = jindo.$Class({
	$init : function(elLayer, oOptions){
		this.elLayer = elLayer;
		
		this.setOptions(oOptions);

		this.elHandle = this.oOptions.elHandle;
		
		elLayer.style.display = "block";
		elLayer.style.position = "absolute";
		elLayer.style.zIndex = "9999";

		this.aBasePosition = this.getBaseOffset(elLayer);

		// "number-ize" the position and set it as inline style. (the position could've been set as "auto" or set by css, not inline style)
		var nTop = (this.toInt(jindo.$Element(elLayer).offset().top) - this.aBasePosition.top);
		var nLeft = (this.toInt(jindo.$Element(elLayer).offset().left) - this.aBasePosition.left);

		var htXY = this._correctXY({x:nLeft, y:nTop});
		
		elLayer.style.top = htXY.y+"px";
		elLayer.style.left = htXY.x+"px";

		this.$FnMouseDown = jindo.$Fn(jindo.$Fn(this._mousedown, this).bind(elLayer), this);
		this.$FnMouseMove = jindo.$Fn(jindo.$Fn(this._mousemove, this).bind(elLayer), this);
		this.$FnMouseUp = jindo.$Fn(jindo.$Fn(this._mouseup, this).bind(elLayer), this);

		this.$FnMouseDown.attach(this.elHandle, "mousedown");
		this.elHandle.ondragstart = new Function('return false');
		this.elHandle.onselectstart = new Function('return false');
	},

	_mousedown : function(elLayer, oEvent){
		if(oEvent.element.tagName == "INPUT") return;

		this.oOptions.fnOnDragStart();
		
		this.MouseOffsetY = (oEvent.pos().clientY-this.toInt(elLayer.style.top)-this.aBasePosition['top']);
		this.MouseOffsetX = (oEvent.pos().clientX-this.toInt(elLayer.style.left)-this.aBasePosition['left']);

		this.$FnMouseMove.attach(elLayer.ownerDocument, "mousemove");
		this.$FnMouseUp.attach(elLayer.ownerDocument, "mouseup");

		this.elHandle.style.cursor = "move";
	},

	_mousemove : function(elLayer, oEvent){
		var nTop = (oEvent.pos().clientY-this.MouseOffsetY-this.aBasePosition['top']);
		var nLeft = (oEvent.pos().clientX-this.MouseOffsetX-this.aBasePosition['left']);

		var htXY = this._correctXY({x:nLeft, y:nTop});

		elLayer.style.top = htXY.y + "px";
		elLayer.style.left = htXY.x + "px";
	},

	_mouseup : function(elLayer, oEvent){
		this.oOptions.fnOnDragEnd();

		this.$FnMouseMove.detach(elLayer.ownerDocument, "mousemove");
		this.$FnMouseUp.detach(elLayer.ownerDocument, "mouseup");
		
		this.elHandle.style.cursor = "";
	},
	
	_correctXY : function(htXY){
		var nLeft = htXY.x;
		var nTop = htXY.y;
		
		if(nTop<this.oOptions.nMinY) nTop = this.oOptions.nMinY;
		if(nTop>this.oOptions.nMaxY) nTop = this.oOptions.nMaxY;

		if(nLeft<this.oOptions.nMinX) nLeft = this.oOptions.nMinX;
		if(nLeft>this.oOptions.nMaxX) nLeft = this.oOptions.nMaxX;
		
		return {x:nLeft, y:nTop};
	},
	
	toInt : function(num){
		var result = parseInt(num);
		return result || 0;
	},
	
	findNonStatic : function(oEl){
		if(!oEl) return null;
		if(oEl.tagName == "BODY") return oEl;
		
		if(jindo.$Element(oEl).css("position").match(/absolute|relative/i)) return oEl;

		return this.findNonStatic(oEl.offsetParent);
	},
	
	getBaseOffset : function(oEl){
		var oBase = this.findNonStatic(oEl.offsetParent) || oEl.ownerDocument.body;
		var tmp = jindo.$Element(oBase).offset();

		return {top: tmp.top, left: tmp.left};
	},
	
	setOptions : function(htOptions){
		this.oOptions = htOptions || {};
		this.oOptions.bModal = this.oOptions.bModal || false;
		this.oOptions.elHandle = this.oOptions.elHandle || this.elLayer;
		this.oOptions.nMinX = this.oOptions.nMinX || -999999;
		this.oOptions.nMinY = this.oOptions.nMinY || -999999;
		this.oOptions.nMaxX = this.oOptions.nMaxX || 999999;
		this.oOptions.nMaxY = this.oOptions.nMaxY || 999999;
		this.oOptions.fnOnDragStart = this.oOptions.fnOnDragStart || function(){};
		this.oOptions.fnOnDragEnd = this.oOptions.fnOnDragEnd || function(){};
	}
});