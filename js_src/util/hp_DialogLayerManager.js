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
nhn.husky.DialogLayerManager = jindo.$Class({
	name : "DialogLayerManager",
	aMadeDraggable : null,
	aOpenedLayers : null,

	$init : function(){
		this.aMadeDraggable = [];
		this.aDraggableLayer = [];
		this.aOpenedLayers = [];
	},
	
	$BEFORE_MSG_APP_READY : function() {
		this.oNavigator = jindo.$Agent().navigator();
	},
	
	//@lazyload_js SHOW_DIALOG_LAYER,TOGGLE_DIALOG_LAYER:N_DraggableLayer.js[
	$ON_SHOW_DIALOG_LAYER : function(elLayer, htOptions){
		elLayer = jindo.$(elLayer);
		htOptions = htOptions || {};
		
		if(!elLayer){return;}

		if(jindo.$A(this.aOpenedLayers).has(elLayer)){return;}

		this.oApp.exec("POSITION_DIALOG_LAYER", [elLayer]);
		
		this.aOpenedLayers[this.aOpenedLayers.length] = elLayer;

		var oDraggableLayer;
		var nIdx = jindo.$A(this.aMadeDraggable).indexOf(elLayer);

		if(nIdx == -1){
			oDraggableLayer = new nhn.DraggableLayer(elLayer, htOptions);
			this.aMadeDraggable[this.aMadeDraggable.length] = elLayer;
			this.aDraggableLayer[this.aDraggableLayer.length] = oDraggableLayer;
		}else{
			if(htOptions){
				oDraggableLayer = this.aDraggableLayer[nIdx];
				oDraggableLayer.setOptions(htOptions);
			}
			elLayer.style.display = "block";
		}
		
		if(htOptions.sOnShowMsg){
			this.oApp.exec(htOptions.sOnShowMsg, htOptions.sOnShowParam);
		}
	},

	$ON_HIDE_LAST_DIALOG_LAYER : function(){
		this.oApp.exec("HIDE_DIALOG_LAYER", [this.aOpenedLayers[this.aOpenedLayers.length-1]]);
	},

	$ON_HIDE_ALL_DIALOG_LAYER : function(){
		for(var i=this.aOpenedLayers.length-1; i>=0; i--){
			this.oApp.exec("HIDE_DIALOG_LAYER", [this.aOpenedLayers[i]]);
		}
	},

	$ON_HIDE_DIALOG_LAYER : function(elLayer){
		elLayer = jindo.$(elLayer);

		if(elLayer){elLayer.style.display = "none";}
		this.aOpenedLayers = jindo.$A(this.aOpenedLayers).refuse(elLayer).$value();
		
		if(!!this.oNavigator.msafari){
			this.oApp.getWYSIWYGWindow().focus();
		}
	},

	$ON_TOGGLE_DIALOG_LAYER : function(elLayer, htOptions){
		if(jindo.$A(this.aOpenedLayers).indexOf(elLayer)){
			this.oApp.exec("SHOW_DIALOG_LAYER", [elLayer, htOptions]);
		}else{
			this.oApp.exec("HIDE_DIALOG_LAYER", [elLayer]);
		}
	},
	
	$ON_SET_DIALOG_LAYER_POSITION : function(elLayer, nTop, nLeft){
		elLayer.style.top = nTop;
		elLayer.style.left = nLeft;
	}
	//@lazyload_js]
});