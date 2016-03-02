/*[
 * SHOW_DIALOG_LAYER
 *
 * 다이얼로그 레이어를 화면에 보여준다.
 *
 * oLayer HTMLElement 다이얼로그 레이어로 사용 할 HTML 엘리먼트
 *
---------------------------------------------------------------------------]*/
/*[
 * HIDE_DIALOG_LAYER
 *
 * 다이얼로그 레이어를 화면에 숨긴다.
 *
 * oLayer HTMLElement 숨길 다이얼로그 레이어에 해당 하는 HTML 엘리먼트
 *
---------------------------------------------------------------------------]*/
/*[
 * HIDE_LAST_DIALOG_LAYER
 *
 * 마지막으로 화면에 표시한 다이얼로그 레이어를 숨긴다.
 *
 * none
 *
---------------------------------------------------------------------------]*/
/*[
 * HIDE_ALL_DIALOG_LAYER
 *
 * 표시 중인 모든 다이얼로그 레이어를 숨긴다.
 *
 * none
 *
---------------------------------------------------------------------------]*/
/**
 * @pluginDesc 드래그가 가능한 레이어를 컨트롤 하는 플러그인
 */
nhn.husky.DialogLayerManager = $Class({
	name : "DialogLayerManager",
	aMadeDraggable : null,
	aOpenedLayers : null,

	$init : function(){
		this.aMadeDraggable = [];
		this.aOpenedLayers = [];
	},
	
	$ON_SHOW_DIALOG_LAYER : function(elLayer, htOptions){
		elLayer = $(elLayer);
		htOptions = htOptions || {};
		htOptions.nMinY = 0;
		
		if(!elLayer) return;

		if($A(this.aOpenedLayers).has(elLayer)) return;

		this.oApp.exec("POSITION_DIALOG_LAYER", [elLayer]);

		this.aOpenedLayers[this.aOpenedLayers.length] = elLayer;

		if(!$A(this.aMadeDraggable).has(elLayer)){
			new nhn.DraggableLayer(elLayer, htOptions);
			this.aMadeDraggable[this.aMadeDraggable.length] = elLayer;
		}else{
			elLayer.style.display = "block";
		}
	},

	$ON_HIDE_LAST_DIALOG_LAYER : function(){
		this.oApp.exec("HIDE_DIALOG_LAYER", [this.aOpenedLayers[this.aOpenedLayers.length-1]]);
	},

	$ON_HIDE_ALL_DIALOG_LAYER : function(){
		for(var i=this.aOpenedLayers.length-1; i>=0; i--)
			this.oApp.exec("HIDE_DIALOG_LAYER", [this.aOpenedLayers[i]]);
	},

	$ON_HIDE_DIALOG_LAYER : function(elLayer){
		elLayer = $(elLayer);

		if(elLayer) elLayer.style.display = "none";
		this.aOpenedLayers = $A(this.aOpenedLayers).refuse(elLayer).$value();
	},

	$ON_TOGGLE_DIALOG_LAYER : function(elLayer, htOptions){
		if($A(this.aOpenedLayers).indexOf(elLayer)){
			this.oApp.exec("SHOW_DIALOG_LAYER", [elLayer, htOptions]);
		}else{
			this.oApp.exec("HIDE_DIALOG_LAYER", [elLayer]);
		}
	},
	
	$ON_SET_DIALOG_LAYER_POSITION : function(elLayer, nTop, nLeft){
		elLayer.style.top = nTop;
		elLayer.style.left = nLeft;
	}
});