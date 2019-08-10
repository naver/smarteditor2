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

	$ON_MSG_APP_READY : function() {
		this.oApp.registerLazyMessage(["SHOW_DIALOG_LAYER","TOGGLE_DIALOG_LAYER"], ["hp_DialogLayerManager$Lazy.js", "N_DraggableLayer.js"]);
	}
});