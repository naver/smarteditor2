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
/**
 * @fileOverview This file contains Husky plugin that takes care of the operations related to changing the font style in the table.
 * @requires SE2M_TableEditor.js
 * @name SE2M_TableBlockManager
 */
nhn.husky.SE2M_TableBlockStyler = jindo.$Class({
	name : "SE2M_TableBlockStyler",
	nSelectedTD : 0,
	htSelectedTD : {},
	aTdRange : [],
	
	$init : function(){ },
	
	$LOCAL_BEFORE_ALL : function(){
		return (this.oApp.getEditingMode() == "WYSIWYG");
	},
	
	$ON_MSG_APP_READY : function(){
		this.oDocument = this.oApp.getWYSIWYGDocument();
	},
	
	$ON_EVENT_EDITING_AREA_MOUSEUP : function(wevE){
		if(this.oApp.getEditingMode() != "WYSIWYG") return;
		this.setTdBlock();
	},
	
	/**
	 * selected Area가 td block인지 체크하는 함수.
	 */
	$ON_IS_SELECTED_TD_BLOCK : function(sAttr,oReturn) {
		if( this.nSelectedTD > 0){
			oReturn[sAttr] = true;
			return oReturn[sAttr];
		}else{
			oReturn[sAttr] = false;
			return oReturn[sAttr];
		}
	},
	
	/**
	 * 
	 */
	$ON_GET_SELECTED_TD_BLOCK : function(sAttr,oReturn){
		//use : this.oApp.exec("GET_SELECTED_TD_BLOCK",['aCells',this.htSelectedTD]);
		oReturn[sAttr] = this.htSelectedTD.aTdCells;
	},
	
	setTdBlock : function() {
		this.oApp.exec("GET_SELECTED_CELLS",['aTdCells',this.htSelectedTD]); //tableEditor로 부터 얻어온다.
		var aNodes = this.htSelectedTD.aTdCells;
		if(aNodes){
			this.nSelectedTD = aNodes.length;
		}
	},
	
	$ON_DELETE_BLOCK_CONTENTS : function(){
		var self = this, welParent, oBlockNode, oChildNode;
		
		this.setTdBlock();
		for (var j = 0; j < this.nSelectedTD ; j++){
			jindo.$Element(this.htSelectedTD.aTdCells[j]).child( function(elChild){
				
				welParent = jindo.$Element(elChild._element.parentNode);
				welParent.remove(elChild);

				oBlockNode = self.oDocument.createElement('P');								
				
				if (jindo.$Agent().navigator().firefox) {
					oChildNode = self.oDocument.createElement('BR');
				} else {
					oChildNode = self.oDocument.createTextNode('\u00A0');
				}
				
				oBlockNode.appendChild(oChildNode);
				welParent.append(oBlockNode);
			}, 1);
		}
	}
	
});