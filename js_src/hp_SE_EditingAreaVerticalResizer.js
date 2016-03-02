/**
 * @pluginDesc 스마트에디터의 수직 사이즈를 조절하는 플러그인
 */
nhn.husky.SE_EditingAreaVerticalResizer = $Class({
	name : "SE_EditingAreaVerticalResizer",
	oResizeGrip : null,

	$init : function(oAppContainer){
		this._assignHTMLObjects(oAppContainer);

		this.$FnMouseDown = $Fn(this._mousedown, this);
		this.$FnMouseMove = $Fn(this._mousemove, this);
		this.$FnMouseUp = $Fn(this._mouseup, this);

		this.$FnMouseDown.attach(this.oResizeGrip, "mousedown");
	},

	_assignHTMLObjects : function(oAppContainer){
		oAppContainer = $(oAppContainer) || document;

		this.oResizeGrip = cssquery.getSingle(".husky_seditor_editingArea_verticalResizer", oAppContainer);
	},

	_mousedown : function(oEvent){
		this.iStartHeight = oEvent.pos().clientY;
		this.iStartHeightOffset = oEvent.pos().layerY;

		this.$FnMouseMove.attach(document, "mousemove");
		this.$FnMouseUp.attach(document, "mouseup");

		this.iStartHeight = oEvent.pos().clientY;
		
		this.oApp.exec("MSG_EDITING_AREA_RESIZE_STARTED", [this.$FnMouseDown, this.$FnMouseMove, this.$FnMouseUp]);
	},

	_mousemove : function(oEvent){
		var iHeightChange = oEvent.pos().clientY - this.iStartHeight;

		this.oApp.exec("RESIZE_EDITING_AREA_BY", [0, iHeightChange]);
	},

	_mouseup : function(oEvent){
		this.$FnMouseMove.detach(document, "mousemove");
		this.$FnMouseUp.detach(document, "mouseup");

		this.oApp.exec("MSG_EDITING_AREA_RESIZE_ENDED", [this.$FnMouseDown, this.$FnMouseMove, this.$FnMouseUp]);
	}
});