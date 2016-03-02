/**
 * @pluginDesc 테이블 생성 플러그인
 */
nhn.husky.SE_Table = $Class({
	name : "SE_Table",
	iMinRows : 1,
	iMaxRows : 20,
	
	iMinColumns : 1,
	iMaxColumns : 10,
	
	iMinBorderWidth : 1,
	iMaxBorderWidth : 10,

	oSelection : null,

	$init : function(oAppContainer){
		this._assignHTMLObjects(oAppContainer);
	},
	
	_assignHTMLObjects : function(oAppContainer){
		var tmp = null;

		this.elDropdownLayer = cssquery.getSingle("DIV.husky_seditor_table_layer", oAppContainer);
		this.welDropdownLayer = $Element(this.elDropdownLayer);

		tmp = cssquery("INPUT", this.elDropdownLayer);
		this.oRowInput = tmp[0];
		this.oColumnInput = tmp[1];
		this.oBorderWidthInput = tmp[2];
		this.oBorderColorInput = tmp[3];
		this.oBGColorInput = tmp[4];

		tmp = cssquery("BUTTON", this.elDropdownLayer);
		this.oButton_AddRow = tmp[0];
		this.oButton_RemoveRow = tmp[1];
		this.oButton_AddColumn = tmp[2];
		this.oButton_RemoveColumn = tmp[3];
		this.oButton_IncBorderWidth = tmp[4];
		this.oButton_DecBorderWidth = tmp[5];
		this.oButton_BorderColorPreview = tmp[6];
		this.oButton_BorderColor = tmp[7];
		this.oButton_BGColorPreview = tmp[8];
		this.oButton_BGColor = tmp[9];
		this.oButton_Insert = tmp[10];
		this.oButton_Cancel = tmp[11];

		this.oSampleTable = cssquery.getSingle("TABLE", this.elDropdownLayer);
	},
	
	$ON_MSG_APP_READY : function(){
		this.oApp.exec("REGISTER_UI_EVENT", ["table", "click", "ST_TOGGLE_TOOLBAR_LAYER"]);

		this.oApp.registerBrowserEvent(this.oRowInput, "change", "ST_SET_ROW_NUM", [null, 0]);
		this.oApp.registerBrowserEvent(this.oColumnInput, "change", "ST_SET_COLUMN_NUM", [null, 0]);
		this.oApp.registerBrowserEvent(this.oBorderWidthInput, "change", "ST_SET_BORDER_WIDTH", [null, 0]);
		
		this.oApp.registerBrowserEvent(this.oButton_AddRow, "click", "ST_ADD_ROW");
		this.oApp.registerBrowserEvent(this.oButton_RemoveRow, "click", "ST_REMOVE_ROW");
		this.oApp.registerBrowserEvent(this.oButton_AddColumn, "click", "ST_ADD_COLUMN");
		this.oApp.registerBrowserEvent(this.oButton_RemoveColumn, "click", "ST_REMOVE_COLUMN");

		this.oApp.registerBrowserEvent(this.oButton_IncBorderWidth, "click", "ST_INC_BORDER_WIDTH");
		this.oApp.registerBrowserEvent(this.oButton_DecBorderWidth, "click", "ST_DEC_BORDER_WIDTH");

		this.oApp.registerBrowserEvent(this.oButton_BorderColorPreview, "click", "ST_TOGGLE_BORDER_COLOR_LAYER");
		this.oApp.registerBrowserEvent(this.oButton_BGColorPreview, "click", "ST_TOGGLE_BGCOLOR_LAYER");

		this.oApp.registerBrowserEvent(this.oButton_BorderColor, "click", "ST_TOGGLE_BORDER_COLOR_LAYER");
		this.oApp.registerBrowserEvent(this.oButton_BGColor, "click", "ST_TOGGLE_BGCOLOR_LAYER");

		this.oApp.registerBrowserEvent(this.oButton_Insert, "click", "ST_INSERT_TABLE");
		this.oApp.registerBrowserEvent(this.oButton_Cancel, "click", "ST_CLOSE");
		
		this.oApp.exec("ST_SET_BORDER_COLOR", ["#CCCCCC"]);
		this.oApp.exec("ST_SET_BGCOLOR", ["#FFFFFF"]);
	},
	
	$ON_ST_TOGGLE_TOOLBAR_LAYER : function(){
		this.oApp.exec("RECORD_UNDO_ACTION_FORCED", ["KEYPRESS"]);

		this._showNewTable();
		this.oApp.exec("TOGGLE_TOOLBAR_ACTIVE_LAYER", [this.elDropdownLayer, "table"]);
	},
	
	$ON_ST_ADD_ROW : function(){
		this.oApp.exec("ST_SET_ROW_NUM", [null, 1]);
	},
	
	$ON_ST_REMOVE_ROW : function(){
		this.oApp.exec("ST_SET_ROW_NUM", [null, -1]);
	},
	
	$ON_ST_ADD_COLUMN : function(){
		this.oApp.exec("ST_SET_COLUMN_NUM", [null, 1]);
	},
	
	$ON_ST_REMOVE_COLUMN : function(){
		this.oApp.exec("ST_SET_COLUMN_NUM", [null, -1]);
	},
	
	$ON_ST_SET_ROW_NUM : function(iRows, iRowDiff){
		iRows = iRows || parseInt(this.oRowInput.value);
		iRowDiff = iRowDiff || 0;
		
		iRows += iRowDiff;

		if(iRows < this.iMinRows) iRows = this.iMinRows;
		if(iRows > this.iMaxRows) iRows = this.iMaxRows;
		
		this.oRowInput.value = iRows;
		this._showNewTable();
	},

	$ON_ST_SET_COLUMN_NUM : function(iColumns, iColumnDiff){
		iColumns = iColumns || parseInt(this.oColumnInput.value);
		iColumnDiff = iColumnDiff || 0;
		
		iColumns += iColumnDiff;
		
		if(iColumns < this.iMinColumns) iColumns = this.iMinColumns;
		if(iColumns > this.iMaxColumns) iColumns = this.iMaxColumns;
		
		this.oColumnInput.value = iColumns;
		this._showNewTable();
	},

	$ON_ST_INSERT_TABLE : function(){
		var sTable = this._getTableString();

		this.oApp.exec("PASTE_HTML", [sTable]);

		this.oApp.exec("ST_CLOSE", []);
	},

	$ON_ST_CLOSE : function(){
		this.oApp.exec("HIDE_ACTIVE_LAYER", []);
	},
	
	$ON_ST_SET_BORDER_WIDTH : function(iBorderWidth, iBorderWidthDiff){
		iBorderWidth = iBorderWidth || parseInt(this.oBorderWidthInput.value);
		iBorderWidthDiff = iBorderWidthDiff || 0;

		iBorderWidth += iBorderWidthDiff;
		
		if(iBorderWidth < this.iMinBorderWidth) iBorderWidth = this.iMinBorderWidth;
		if(iBorderWidth > this.iMaxBorderWidth) iBorderWidth = this.iMaxBorderWidth;
		
		this.oBorderWidthInput.value = iBorderWidth;
		this._showNewTable();
	},

	$ON_ST_INC_BORDER_WIDTH : function(){
		this.oApp.exec("ST_SET_BORDER_WIDTH", [null, 1]);
	},

	$ON_ST_DEC_BORDER_WIDTH : function(){
		this.oApp.exec("ST_SET_BORDER_WIDTH", [null, -1]);
	},

	$ON_ST_TOGGLE_BORDER_COLOR_LAYER : function(){
		if(this.welDropdownLayer.hasClass("p1"))
			this.oApp.exec("ST_HIDE_BORDER_COLOR_LAYER", []);
		else
			this.oApp.exec("ST_SHOW_BORDER_COLOR_LAYER", []);
	},

	$ON_ST_SHOW_BORDER_COLOR_LAYER : function(){
		this.welDropdownLayer.addClass("p1");
		this.welDropdownLayer.removeClass("p2");
		
		this.oApp.exec("SHOW_COLOR_PALETTE", ["ST_SET_BORDER_COLOR_FROM_PALETTE", this.elDropdownLayer]);
	},

	$ON_ST_HIDE_BORDER_COLOR_LAYER : function(){
		this.welDropdownLayer.removeClass("p1");
		
		this.oApp.exec("HIDE_COLOR_PALETTE", []);
	},

	$ON_ST_TOGGLE_BGCOLOR_LAYER : function(){
		if(this.welDropdownLayer.hasClass("p2"))
			this.oApp.exec("ST_HIDE_BGCOLOR_LAYER", []);
		else
			this.oApp.exec("ST_SHOW_BGCOLOR_LAYER", []);
	},

	$ON_ST_SHOW_BGCOLOR_LAYER : function(){
		this.welDropdownLayer.removeClass("p1");
		this.welDropdownLayer.addClass("p2");

		this.oApp.exec("SHOW_COLOR_PALETTE", ["ST_SET_BGCOLOR_FROM_PALETTE", this.elDropdownLayer]);
	},

	$ON_ST_HIDE_BGCOLOR_LAYER : function(){
		this.welDropdownLayer.removeClass("p2");
		
		this.oApp.exec("HIDE_COLOR_PALETTE", []);
	},

	$ON_ST_SET_BORDER_COLOR_FROM_PALETTE : function(sColorCode){
		this.oApp.exec("ST_SET_BORDER_COLOR", [sColorCode]);
		this.oApp.exec("ST_HIDE_BORDER_COLOR_LAYER", []);
	},

	$ON_ST_SET_BORDER_COLOR : function(sColorCode){
		this.oBorderColorInput.value = sColorCode;
		this.oButton_BorderColorPreview.style.backgroundColor = sColorCode;
		
		this._showNewTable();
	},

	$ON_ST_SET_BGCOLOR_FROM_PALETTE : function(sColorCode){
		this.oApp.exec("ST_SET_BGCOLOR", [sColorCode]);
		this.oApp.exec("ST_HIDE_BGCOLOR_LAYER", []);
	},
	
	$ON_ST_SET_BGCOLOR : function(sColorCode){
		this.oBGColorInput.value = sColorCode;
		this.oButton_BGColorPreview.style.backgroundColor = sColorCode;

		this._showNewTable();
	},

	_showNewTable : function(){
		var oTmp = document.createElement("DIV");
		oTmp.innerHTML = this._getTableString();
		var oNewTable = oTmp.firstChild;
		this.oSampleTable.parentNode.insertBefore(oNewTable, this.oSampleTable);
		this.oSampleTable.parentNode.removeChild(this.oSampleTable);
		this.oSampleTable = oNewTable;
	},

	// need to do something about the table width as the same HTML code is being used to the actual table and the preview table
	_getTableString : function(){
		var sBorderColorCode = this.oBorderColorInput.value;
		var sBGColorCode = this.oBGColorInput.value;
		var iBorderWidth = this.oBorderWidthInput.value;
		var sTD = "";
		if($Agent().navigator().ie){
			sTD = "<td><p></p></td>";
		}else{
			if($Agent().navigator().firefox){
				sTD = "<td><p><br/></p></td>";
			}else{
				sTD = "<td><p>&nbsp;</p></td>";
			}
		}
		
		var sTable = '<table style="background:'+sBorderColorCode+'" cellspacing="'+iBorderWidth+'">';
		var sRow = '<tr style="background:'+sBGColorCode+'">';
		var iColumns = this.oColumnInput.value;
		for(var i=0; i<iColumns; i++){
			sRow += sTD;
		}
		sRow += "</tr>\n";
		
		var iRows = this.oRowInput.value;

		sTable += "<tbody>";
		for(var i=0; i<iRows; i++){
			sTable += sRow;
		}
		sTable += "</tbody>";

		sTable += "</table>";

		return sTable;
	}
});