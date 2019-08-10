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
nhn.husky.SE2M_TableEditor = jindo.$Class({
	name : "SE2M_TableEditor",
	
	_sSETblClass : "__se_tbl",
	_sSEReviewTblClass : "__se_tbl_review",

	STATUS : {
		S_0 : 1,				// neither cell selection nor cell resizing is active
		MOUSEDOWN_CELL : 2,		// mouse down on a table cell
		CELL_SELECTING : 3,		// cell selection is in progress
		CELL_SELECTED : 4,		// cell selection was (completely) made
		MOUSEOVER_BORDER : 5,	// mouse is over a table/cell border and the cell resizing grip is shown
		MOUSEDOWN_BORDER : 6	// mouse down on the cell resizing grip (cell resizing is in progress)
	},
	
	CELL_SELECTION_CLASS : "se2_te_selection",
	
	MIN_CELL_WIDTH : 5,
	MIN_CELL_HEIGHT : 5,
	
	TMP_BGC_ATTR : "_se2_tmp_te_bgc",
	TMP_BGIMG_ATTR : "_se2_tmp_te_bg_img",
	ATTR_TBL_TEMPLATE : "_se2_tbl_template",	
	
	nStatus : 1,
	nMouseEventsStatus : 0,
	
	aSelectedCells : [],

	$ON_REGISTER_CONVERTERS : function(){
		// remove the cell selection class
		this.oApp.exec("ADD_CONVERTER_DOM", ["WYSIWYG_TO_IR", jindo.$Fn(function(elTmpNode){
			if(this.aSelectedCells.length < 1){
				//return sContents;
				return;
			}

			var aCells;
			var aCellType = ["TD", "TH"];

			for(var n = 0; n < aCellType.length; n++){
				aCells = elTmpNode.getElementsByTagName(aCellType[n]);
				for(var i = 0, nLen = aCells.length; i < nLen; i++){
					if(aCells[i].className){
						aCells[i].className = aCells[i].className.replace(this.CELL_SELECTION_CLASS, "");
						if(aCells[i].getAttribute(this.TMP_BGC_ATTR)){
							aCells[i].style.backgroundColor = aCells[i].getAttribute(this.TMP_BGC_ATTR);
							aCells[i].removeAttribute(this.TMP_BGC_ATTR);
						}else if(aCells[i].getAttribute(this.TMP_BGIMG_ATTR)){
							jindo.$Element(this.aCells[i]).css("backgroundImage",aCells[i].getAttribute(this.TMP_BGIMG_ATTR));
							aCells[i].removeAttribute(this.TMP_BGIMG_ATTR);
						}
					}
				}
			}

//			this.wfnMouseDown.attach(this.elResizeCover, "mousedown");

//			return elTmpNode.innerHTML;
//			var rxSelectionColor = new RegExp("<(TH|TD)[^>]*)("+this.TMP_BGC_ATTR+"=[^> ]*)([^>]*>)", "gi");
		}, this).bind()]);
	},

	$ON_MSG_APP_READY : function(){
		this.oApp.registerLazyMessage(["EVENT_EDITING_AREA_MOUSEMOVE","STYLE_TABLE"], ["hp_SE2M_TableEditor$Lazy.js","SE2M_TableTemplate.js"]);
	}
});