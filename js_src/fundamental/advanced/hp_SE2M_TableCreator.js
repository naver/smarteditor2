//{
/**
 * @fileOverview This file contains Husky plugin that takes care of the operations related to table creation
 * @name hp_SE_Table.js
 */
nhn.husky.SE2M_TableCreator = jindo.$Class({
	name : "SE2M_TableCreator",

	_sSETblClass : "__se_tbl",
	
	nRows : 3,
	nColumns : 4,
	nBorderSize : 1,
	sBorderColor : "#000000",
	sBGColor: "#000000",
	
	nBorderStyleIdx : 3,
	nTableStyleIdx : 1,
	
	nMinRows : 1,
	nMaxRows : 20,
	nMinColumns : 1,
	nMaxColumns : 20,
	nMinBorderWidth : 1,
	nMaxBorderWidth : 10,
	
	rxLastDigits : null,
	sReEditGuideMsg_table : null,
	
	// 테두리 스타일 목록
	// 표 스타일 스타일 목록
	oSelection : null,
	
	$ON_MSG_APP_READY : function(){
		this.sReEditGuideMsg_table = this.oApp.$MSG(nhn.husky.SE2M_Configuration.SE2M_ReEditAction.aReEditGuideMsg[3]);
		this.oApp.exec("REGISTER_UI_EVENT", ["table", "click", "TOGGLE_TABLE_LAYER"]);
	},
	
	// [SMARTEDITORSUS-365] 테이블퀵에디터 > 속성 직접입력 > 테두리 스타일
	//		- 테두리 없음을 선택하는 경우 본문에 삽입하는 표에 가이드 라인을 표시해 줍니다. 보기 시에는 테두리가 보이지 않습니다.
	$ON_REGISTER_CONVERTERS : function(){
		this.oApp.exec("ADD_CONVERTER_DOM", ["IR_TO_DB", jindo.$Fn(this.irToDbDOM, this).bind()]);
		this.oApp.exec("ADD_CONVERTER_DOM", ["DB_TO_IR", jindo.$Fn(this.dbToIrDOM, this).bind()]);
	},
	
	irToDbDOM : function(oTmpNode){
		/**
		 *	저장을 위한 Table Tag 는 아래와 같이 변경됩니다.
		 *	(1) <TABLE>
		 *			<table border="1" cellpadding="0" cellspacing="0" style="border:1px dashed #c7c7c7; border-left:0; border-bottom:0;" attr_no_border_tbl="1" class="__se_tbl">
		 *		-->	<table border="0" cellpadding="1" cellspacing="0" attr_no_border_tbl="1" class="__se_tbl">
		 *	(2) <TD>
		 *			<td style="border:1px dashed #c7c7c7; border-top:0; border-right:0; background-color:#ffef00" width="245"><p>&nbsp;</p></td>
		 *		-->	<td style="background-color:#ffef00" width="245">&nbsp;</td>
		 */
		var aNoBorderTable = [];
		var aTables = jindo.$$('table[class=__se_tbl]', oTmpNode);
		
		// 테두리가 없음 속성의 table (임의로 추가한 attr_no_border_tbl 속성이 있는 table 을 찾음)
		jindo.$A(aTables).forEach(function(oValue, nIdx, oArray) {
			if(jindo.$Element(oValue).attr("attr_no_border_tbl")){
				aNoBorderTable.push(oValue);
			}
		}, this);
		
		if(aNoBorderTable.length < 1){
			return;
		}
		
		// [SMARTEDITORSUS-410] 글 저장 시, 테두리 없음 속성을 선택할 때 임의로 표시한 가이드 라인 property 만 style 에서 제거해 준다.
		// <TABLE> 과 <TD> 의 속성값을 변경 및 제거
		var aTDs = [], oTable;
		for(var i = 0, nCount = aNoBorderTable.length; i < nCount; i++){
			oTable = aNoBorderTable[i];
			
			// <TABLE> 에서 border, cellpadding 속성값 변경, style property 제거
			jindo.$Element(oTable).css({"border": "", "borderLeft": "", "borderBottom": ""});
			jindo.$Element(oTable).attr({"border": 0, "cellpadding": 1});
			
			// <TD> 에서는 background-color 를 제외한 style 을 모두 제거
			aTDs = jindo.$$('tbody>tr>td', oTable);
			jindo.$A(aTDs).forEach(function(oTD, nIdx, oTDArray) {
				jindo.$Element(oTD).css({"border": "", "borderTop": "", "borderRight": ""});
			});
		}
	},
	
	dbToIrDOM : function(oTmpNode){
		/**
		 *	수정을 위한 Table Tag 는 아래와 같이 변경됩니다.
		 *	(1) <TABLE>
		 *			<table border="0" cellpadding="1" cellspacing="0" attr_no_border_tbl="1" class="__se_tbl">
		 *		--> <table border="1" cellpadding="0" cellspacing="0" style="border:1px dashed #c7c7c7; border-left:0; border-bottom:0;" attr_no_border_tbl="1" class="__se_tbl">
		 *	(2) <TD>
		 *			<td style="background-color:#ffef00" width="245">&nbsp;</td>
		 *		-->	<td style="border:1px dashed #c7c7c7; border-top:0; border-right:0; background-color:#ffef00" width="245"><p>&nbsp;</p></td>
		 */
		var aNoBorderTable = [];
		var aTables = jindo.$$('table[class=__se_tbl]', oTmpNode);
		
		// 테두리가 없음 속성의 table (임의로 추가한 attr_no_border_tbl 속성이 있는 table 을 찾음)
		jindo.$A(aTables).forEach(function(oValue, nIdx, oArray) {
			if(jindo.$Element(oValue).attr("attr_no_border_tbl")){
				aNoBorderTable.push(oValue);
			}
		}, this);
		
		if(aNoBorderTable.length < 1){
			return;
		}
		
		// <TABLE> 과 <TD> 의 속성값을 변경/추가
		var aTDs = [], oTable;
		for(var i = 0, nCount = aNoBorderTable.length; i < nCount; i++){
			oTable = aNoBorderTable[i];
			
			// <TABLE> 에서 border, cellpadding 속성값 변경/ style 속성 추가
			jindo.$Element(oTable).css({"border": "1px dashed #c7c7c7", "borderLeft": 0, "borderBottom": 0});
			jindo.$Element(oTable).attr({"border": 1, "cellpadding": 0});
			
			// <TD> 에서 style 속성값 추가
			aTDs = jindo.$$('tbody>tr>td', oTable);
			jindo.$A(aTDs).forEach(function(oTD, nIdx, oTDArray) {
				jindo.$Element(oTD).css({"border": "1px dashed #c7c7c7", "borderTop": 0, "borderRight": 0});
			});
		}
	},
	
	//@lazyload_js TOGGLE_TABLE_LAYER[
	_assignHTMLObjects : function(oAppContainer){
		this.oApp.exec("LOAD_HTML", ["create_table"]);
		var tmp = null;

		this.elDropdownLayer = jindo.$$.getSingle("DIV.husky_se2m_table_layer", oAppContainer);
		this.welDropdownLayer = jindo.$Element(this.elDropdownLayer);

		tmp = jindo.$$("INPUT", this.elDropdownLayer);
		this.elText_row = tmp[0];
		this.elText_col = tmp[1];
		this.elRadio_manualStyle = tmp[2];
		this.elText_borderSize = tmp[3];
		this.elText_borderColor = tmp[4];
		this.elText_BGColor = tmp[5];
		this.elRadio_templateStyle = tmp[6];

		tmp = jindo.$$("BUTTON", this.elDropdownLayer);
		this.elBtn_rowInc = tmp[0];
		this.elBtn_rowDec = tmp[1];
		this.elBtn_colInc = tmp[2];
		this.elBtn_colDec = tmp[3];
		this.elBtn_borderStyle = tmp[4];
		this.elBtn_incBorderSize = jindo.$$.getSingle("BUTTON.se2m_incBorder", this.elDropdownLayer);
		this.elBtn_decBorderSize = jindo.$$.getSingle("BUTTON.se2m_decBorder", this.elDropdownLayer);

		this.elLayer_Dim1 = jindo.$$.getSingle("DIV.se2_t_dim0", this.elDropdownLayer);
		this.elLayer_Dim2 = jindo.$$.getSingle("DIV.se2_t_dim3", this.elDropdownLayer);
		
		// border style layer contains btn elm's
		
		tmp = jindo.$$("SPAN.se2_pre_color>BUTTON", this.elDropdownLayer);
		 
		this.elBtn_borderColor = tmp[0];
		this.elBtn_BGColor = tmp[1];
		
		this.elBtn_tableStyle =  jindo.$$.getSingle("DIV.se2_select_ty2>BUTTON", this.elDropdownLayer);
		
		tmp = jindo.$$("P.se2_btn_area>BUTTON", this.elDropdownLayer);
		this.elBtn_apply = tmp[0];
		this.elBtn_cancel = tmp[1];

		this.elTable_preview = jindo.$$.getSingle("TABLE.husky_se2m_table_preview", this.elDropdownLayer);
		this.elLayer_borderStyle = jindo.$$.getSingle("DIV.husky_se2m_table_border_style_layer", this.elDropdownLayer);
		this.elPanel_borderStylePreview = jindo.$$.getSingle("SPAN.husky_se2m_table_border_style_preview", this.elDropdownLayer);
		this.elPanel_borderColorPallet = jindo.$$.getSingle("DIV.husky_se2m_table_border_color_pallet", this.elDropdownLayer);
		this.elPanel_bgColorPallet = jindo.$$.getSingle("DIV.husky_se2m_table_bgcolor_pallet", this.elDropdownLayer);
		this.elLayer_tableStyle = jindo.$$.getSingle("DIV.husky_se2m_table_style_layer", this.elDropdownLayer);
		this.elPanel_tableStylePreview = jindo.$$.getSingle("SPAN.husky_se2m_table_style_preview", this.elDropdownLayer);

		this.aElBtn_borderStyle = jindo.$$("BUTTON", this.elLayer_borderStyle);
		this.aElBtn_tableStyle = jindo.$$("BUTTON", this.elLayer_tableStyle);

		this.sNoBorderText = jindo.$$.getSingle("SPAN.se2m_no_border", this.elDropdownLayer).innerHTML;

		this.rxLastDigits = RegExp("([0-9]+)$");
	},
	
	$LOCAL_BEFORE_FIRST : function(){
		this._assignHTMLObjects(this.oApp.htOptions.elAppContainer);

		this.oApp.registerBrowserEvent(this.elText_row, "change", "TABLE_SET_ROW_NUM", [null, 0]);
		this.oApp.registerBrowserEvent(this.elText_col, "change", "TABLE_SET_COLUMN_NUM", [null, 0]);
		this.oApp.registerBrowserEvent(this.elText_borderSize, "change", "TABLE_SET_BORDER_SIZE", [null, 0]);
		
		this.oApp.registerBrowserEvent(this.elBtn_rowInc, "click", "TABLE_INC_ROW");
		this.oApp.registerBrowserEvent(this.elBtn_rowDec, "click", "TABLE_DEC_ROW");
		jindo.$Fn(this._numRowKeydown, this).attach(this.elText_row.parentNode, "keydown");

		this.oApp.registerBrowserEvent(this.elBtn_colInc, "click", "TABLE_INC_COLUMN");
		this.oApp.registerBrowserEvent(this.elBtn_colDec, "click", "TABLE_DEC_COLUMN");
		jindo.$Fn(this._numColKeydown, this).attach(this.elText_col.parentNode, "keydown");

		this.oApp.registerBrowserEvent(this.elBtn_incBorderSize, "click", "TABLE_INC_BORDER_SIZE");
		this.oApp.registerBrowserEvent(this.elBtn_decBorderSize, "click", "TABLE_DEC_BORDER_SIZE");
		jindo.$Fn(this._borderSizeKeydown, this).attach(this.elText_borderSize.parentNode, "keydown");

		this.oApp.registerBrowserEvent(this.elBtn_borderStyle, "click", "TABLE_TOGGLE_BORDER_STYLE_LAYER");
		this.oApp.registerBrowserEvent(this.elBtn_tableStyle, "click", "TABLE_TOGGLE_STYLE_LAYER");
		
		this.oApp.registerBrowserEvent(this.elBtn_borderColor, "click", "TABLE_TOGGLE_BORDER_COLOR_PALLET");
		this.oApp.registerBrowserEvent(this.elBtn_BGColor, "click", "TABLE_TOGGLE_BGCOLOR_PALLET");

		this.oApp.registerBrowserEvent(this.elRadio_manualStyle, "click", "TABLE_ENABLE_MANUAL_STYLE");
		this.oApp.registerBrowserEvent(this.elRadio_templateStyle, "click", "TABLE_ENABLE_TEMPLATE_STYLE");

		//this.oApp.registerBrowserEvent(this.elDropdownLayer, "click", "TABLE_LAYER_CLICKED");
		//this.oApp.registerBrowserEvent(this.elLayer_borderStyle, "click", "TABLE_BORDER_STYLE_LAYER_CLICKED");
		//this.oApp.registerBrowserEvent(this.elLayer_tableStyle, "click", "TABLE_STYLE_LAYER_CLICKED");

		this.oApp.exec("SE2_ATTACH_HOVER_EVENTS", [this.aElBtn_borderStyle]);
		this.oApp.exec("SE2_ATTACH_HOVER_EVENTS", [this.aElBtn_tableStyle]);

		var i;
		for(i=0; i<this.aElBtn_borderStyle.length; i++){
			this.oApp.registerBrowserEvent(this.aElBtn_borderStyle[i], "click", "TABLE_SELECT_BORDER_STYLE");
		}

		for(i=0; i<this.aElBtn_tableStyle.length; i++){
			this.oApp.registerBrowserEvent(this.aElBtn_tableStyle[i], "click", "TABLE_SELECT_STYLE");
		}
		
		this.oApp.registerBrowserEvent(this.elBtn_apply, "click", "TABLE_INSERT");
		this.oApp.registerBrowserEvent(this.elBtn_cancel, "click", "HIDE_ACTIVE_LAYER");

		this.oApp.exec("TABLE_SET_BORDER_COLOR", ["#cccccc"]);
		this.oApp.exec("TABLE_SET_BGCOLOR", ["#ffffff"]);
		
		// 1: manual style
		// 2: template style
		this.nStyleMode = 1;

		// add #BorderSize+x# if needed
		//---
		// [SMARTEDITORSUS-365] 테이블퀵에디터 > 속성 직접입력 > 테두리 스타일
		//		- 테두리 없음을 선택하는 경우 본문에 삽입하는 표에 가이드 라인을 표시해 줍니다. 보기 시에는 테두리가 보이지 않습니다.
		this.aTableStyleByBorder = [
			'',
			'border="1" cellpadding="0" cellspacing="0" style="border:1px dashed #c7c7c7; border-left:0; border-bottom:0;"',
			'border="1" cellpadding="0" cellspacing="0" style="border:#BorderSize#px dashed #BorderColor#; border-left:0; border-bottom:0;"',
			'border="0" cellpadding="0" cellspacing="0" style="border:#BorderSize#px solid #BorderColor#; border-left:0; border-bottom:0;"',
			'border="0" cellpadding="0" cellspacing="1" style="border:#BorderSize#px solid #BorderColor#;"',
			'border="0" cellpadding="0" cellspacing="1" style="border:#BorderSize#px double #BorderColor#;"',
			'border="0" cellpadding="0" cellspacing="1" style="border-width:#BorderSize*2#px #BorderSize#px #BorderSize#px #BorderSize*2#px; border-style:solid;border-color:#BorderColor#;"',
			'border="0" cellpadding="0" cellspacing="1" style="border-width:#BorderSize#px #BorderSize*2#px #BorderSize*2#px #BorderSize#px; border-style:solid;border-color:#BorderColor#;"'
		];

		this.aTDStyleByBorder = [
			'',
			'style="border:1px dashed #c7c7c7; border-top:0; border-right:0; background-color:#BGColor#"',
			'style="border:#BorderSize#px dashed #BorderColor#; border-top:0; border-right:0; background-color:#BGColor#"',
			'style="border:#BorderSize#px solid #BorderColor#; border-top:0; border-right:0; background-color:#BGColor#"',
			'style="border:#BorderSize#px solid #BorderColor#; background-color:#BGColor#"',
			'style="border:#BorderSize+2#px double #BorderColor#; background-color:#BGColor#"',
			'style="border-width:#BorderSize#px #BorderSize*2#px #BorderSize*2#px #BorderSize#px; border-style:solid;border-color:#BorderColor#; background-color:#BGColor#"',
			'style="border-width:#BorderSize*2#px #BorderSize#px #BorderSize#px #BorderSize*2#px; border-style:solid;border-color:#BorderColor#; background-color:#BGColor#"'
		];
		this.oApp.registerBrowserEvent(this.elDropdownLayer, "keydown", "EVENT_TABLE_CREATE_KEYDOWN");
		
		this._drawTableDropdownLayer();
	},

	$ON_TABLE_SELECT_BORDER_STYLE : function(weEvent){
		var elButton = weEvent.currentElement;
//		var aMatch = this.rxLastDigits.exec(weEvent.element.className);
		var aMatch = this.rxLastDigits.exec(elButton.className);
		this._selectBorderStyle(aMatch[1]);
	},
	
	$ON_TABLE_SELECT_STYLE : function(weEvent){
		var aMatch = this.rxLastDigits.exec(weEvent.element.className);
		this._selectTableStyle(aMatch[1]);
	},

	$ON_TOGGLE_TABLE_LAYER : function(){
//		this.oSelection = this.oApp.getSelection();
		this._showNewTable();
		this.oApp.exec("TOGGLE_TOOLBAR_ACTIVE_LAYER", [this.elDropdownLayer, null, "SELECT_UI", ["table"], "TABLE_CLOSE", []]);
		this.oApp.exec('MSG_NOTIFY_CLICKCR', ['table']);
	},
	
	$ON_TABLE_BORDER_STYLE_LAYER_CLICKED : function(weEvent){
		top.document.title = weEvent.element.tagName;
	},
	
	$ON_TABLE_CLOSE_ALL : function(){
		this.oApp.exec("TABLE_HIDE_BORDER_COLOR_PALLET", []);
		this.oApp.exec("TABLE_HIDE_BGCOLOR_PALLET", []);
		this.oApp.exec("TABLE_HIDE_BORDER_STYLE_LAYER", []);
		this.oApp.exec("TABLE_HIDE_STYLE_LAYER", []);
	},
	
	$ON_TABLE_INC_ROW : function(){
		this.oApp.exec("TABLE_SET_ROW_NUM", [null, 1]);
	},
	
	$ON_TABLE_DEC_ROW : function(){
		this.oApp.exec("TABLE_SET_ROW_NUM", [null, -1]);
	},
	
	$ON_TABLE_INC_COLUMN : function(){
		this.oApp.exec("TABLE_SET_COLUMN_NUM", [null, 1]);
	},
	
	$ON_TABLE_DEC_COLUMN : function(){
		this.oApp.exec("TABLE_SET_COLUMN_NUM", [null, -1]);
	},
	
	$ON_TABLE_SET_ROW_NUM : function(nRows, nRowDiff){
		nRows = nRows || parseInt(this.elText_row.value, 10) || 0;
		nRowDiff = nRowDiff || 0;
		
		nRows += nRowDiff;

		if(nRows < this.nMinRows){nRows = this.nMinRows;}
		if(nRows > this.nMaxRows){nRows = this.nMaxRows;}
		
		this.elText_row.value = nRows;
		this._showNewTable();
	},

	$ON_TABLE_SET_COLUMN_NUM : function(nColumns, nColumnDiff){
		nColumns = nColumns || parseInt(this.elText_col.value, 10) || 0;
		nColumnDiff = nColumnDiff || 0;
		
		nColumns += nColumnDiff;
		
		if(nColumns < this.nMinColumns){nColumns = this.nMinColumns;}
		if(nColumns > this.nMaxColumns){nColumns = this.nMaxColumns;}
		
		this.elText_col.value = nColumns;
		this._showNewTable();
	},

	_getTableString : function(){
		var sTable;
		if(this.nStyleMode == 1){
			sTable = this._doGetTableString(this.nColumns, this.nRows, this.nBorderSize, this.sBorderColor, this.sBGColor, this.nBorderStyleIdx);
		}else{
			sTable = this._doGetTableString(this.nColumns, this.nRows, this.nBorderSize, this.sBorderColor, this.sBGColor, 0);
		}
		
		return sTable;
	},
	
	$ON_TABLE_INSERT : function(){
		this.oApp.exec("IE_FOCUS", []);	// [SMARTEDITORSUS-500] IE인 경우 명시적인 focus 추가
		
		//[SMARTEDITORSUS-596]이벤트 발생이 안되는 경우, 
		//max 제한이 적용이 안되기 때문에 테이블 사입 시점에 다시한번 Max 값을 검사한다.
		this.oApp.exec("TABLE_SET_COLUMN_NUM");
		this.oApp.exec("TABLE_SET_ROW_NUM");
		
		this._loadValuesFromHTML();
		
		var sTable, 
			elLinebreak, 
			elBody, 
			welBody,
			elTmpDiv,
			elTable,
			elFirstTD,
			oSelection,
			elTableHolder, 
			htBrowser;
			
		elBody = this.oApp.getWYSIWYGDocument().body;
		welBody = jindo.$Element(elBody);
		htBrowser = jindo.$Agent().navigator();
		
		this.nTableWidth = elBody.offsetWidth - parseInt(welBody.css("marginLeft"), 10) - parseInt(welBody.css("marginRight"), 10);
		sTable = this._getTableString();
	
		elTmpDiv = this.oApp.getWYSIWYGDocument().createElement("DIV");
		elTmpDiv.innerHTML = sTable;
		elTable = elTmpDiv.firstChild;
		elTable.className = this._sSETblClass;
				
		oSelection = this.oApp.getSelection();		
		oSelection = this._divideParagraph(oSelection);	// [SMARTEDITORSUS-306]
		
		this.oApp.exec("RECORD_UNDO_BEFORE_ACTION", ["INSERT TABLE", {sSaveTarget:"BODY"}]);
				
		// If the table were inserted within a styled(strikethough & etc) paragraph, the table may inherit the style in IE.
		elTableHolder = this.oApp.getWYSIWYGDocument().createElement("DIV");
		// 영역을 잡았을 경우, 영역 지우고 테이블 삽입
		oSelection.deleteContents();
		oSelection.insertNode(elTableHolder);
		oSelection.selectNode(elTableHolder);
		this.oApp.exec("REMOVE_STYLE", [oSelection]);

		if(htBrowser.ie && this.oApp.getWYSIWYGDocument().body.childNodes.length === 1 && this.oApp.getWYSIWYGDocument().body.firstChild === elTableHolder){
			// IE에서 table이 body에 바로 붙어 있을 경우, 정렬등에서 문제가 발생 함으로 elTableHolder(DIV)를 남겨둠
			elTableHolder.insertBefore(elTable, null);
		}else{
			elTableHolder.parentNode.insertBefore(elTable, elTableHolder);
			elTableHolder.parentNode.removeChild(elTableHolder);
		}

		// FF : 테이블 하단에 BR이 없을 경우, 커서가 테이블 밑으로 이동할 수 없어 BR을 삽입 해 줌.
		//[SMARTEDITORSUS-181][IE9] 표나 요약글 등의 테이블에서 > 테이블 외부로 커서 이동 불가
		if(htBrowser.firefox){
			elLinebreak = this.oApp.getWYSIWYGDocument().createElement("BR");
			elTable.parentNode.insertBefore(elLinebreak, elTable.nextSibling);
		}else if(htBrowser.ie ){			
			elLinebreak = this.oApp.getWYSIWYGDocument().createElement("p");
			elTable.parentNode.insertBefore(elLinebreak, elTable.nextSibling);
		}
		
		if(this.nStyleMode == 2){
			this.oApp.exec("STYLE_TABLE", [elTable, this.nTableStyleIdx]);
		}
		
		elFirstTD = elTable.getElementsByTagName("TD")[0];
		oSelection.selectNodeContents(elFirstTD.firstChild || elFirstTD);
		oSelection.collapseToEnd();
		oSelection.select();	
		
		this.oApp.exec("FOCUS");
		this.oApp.exec("RECORD_UNDO_AFTER_ACTION", ["INSERT TABLE", {sSaveTarget:"BODY"}]);
		
		this.oApp.exec("HIDE_ACTIVE_LAYER", []);
		this.oApp.exec('MSG_DISPLAY_REEDIT_MESSAGE_SHOW', [this.name, this.sReEditGuideMsg_table]);
	},
	
	/**
	 * P 안에 Table 이 추가되지 않도록 P 태그를 분리함
	 * 
	 * [SMARTEDITORSUS-306]
	 *		P 에 Table 을 추가한 경우, DOM 에서 비정상적인 P 를 생성하여 깨지는 경우가 발생함
	 *		테이블이 추가되는 부분에 P 가 있는 경우, P 를 분리시켜주는 처리
	 */
	_divideParagraph : function(oSelection){
		var oParentP,
			welParentP,
			sNodeVaule,
			sBM, oSWrapper, oEWrapper;
			
		oSelection.fixCommonAncestorContainer();	// [SMARTEDITORSUS-423] 엔터에 의해 생성된 P 가 아닌 이전 P 가 선택되지 않도록 fix 하도록 처리
		oParentP = oSelection.findAncestorByTagName("P");

		if(!oParentP){
			return oSelection;
		}

		if(!oParentP.firstChild || nhn.husky.SE2M_Utils.isBlankNode(oParentP)){
			oSelection.selectNode(oParentP);	// [SMARTEDITORSUS-423] 불필요한 개행이 일어나지 않도록 빈 P 를 선택하여 TABLE 로 대체하도록 처리
			oSelection.select();
			
			return oSelection;
		}
		
		sBM = oSelection.placeStringBookmark();
		
		oSelection.moveToBookmark(sBM);
					
		oSWrapper = this.oApp.getWYSIWYGDocument().createElement("P");
		oSelection.setStartBefore(oParentP.firstChild);
		oSelection.surroundContents(oSWrapper);
		oSelection.collapseToEnd();

		oEWrapper = this.oApp.getWYSIWYGDocument().createElement("P");
		oSelection.setEndAfter(oParentP.lastChild);
		oSelection.surroundContents(oEWrapper);
		oSelection.collapseToStart();
		
		oSelection.removeStringBookmark(sBM);
		
		welParentP = jindo.$Element(oParentP);
		welParentP.after(oEWrapper);
		welParentP.after(oSWrapper);

		welParentP.leave();
		
		oSelection = this.oApp.getEmptySelection();
		
		oSelection.setEndAfter(oSWrapper);
		oSelection.setStartBefore(oEWrapper);
		
		oSelection.select();
		
		return oSelection;
	},

	$ON_TABLE_CLOSE : function(){
		this.oApp.exec("TABLE_CLOSE_ALL", []);
		this.oApp.exec("DESELECT_UI", ["table"]);
	},
	
	$ON_TABLE_SET_BORDER_SIZE : function(nBorderWidth, nBorderWidthDiff){
		nBorderWidth = nBorderWidth || parseInt(this.elText_borderSize.value, 10) || 0;
		nBorderWidthDiff = nBorderWidthDiff || 0;

		nBorderWidth += nBorderWidthDiff;
		
		if(nBorderWidth < this.nMinBorderWidth){nBorderWidth = this.nMinBorderWidth;}
		if(nBorderWidth > this.nMaxBorderWidth){nBorderWidth = this.nMaxBorderWidth;}
		
		this.elText_borderSize.value = nBorderWidth;
	},

	$ON_TABLE_INC_BORDER_SIZE : function(){
		this.oApp.exec("TABLE_SET_BORDER_SIZE", [null, 1]);
	},

	$ON_TABLE_DEC_BORDER_SIZE : function(){
		this.oApp.exec("TABLE_SET_BORDER_SIZE", [null, -1]);
	},

	$ON_TABLE_TOGGLE_BORDER_STYLE_LAYER : function(){
		if(this.elLayer_borderStyle.style.display == "block"){
			this.oApp.exec("TABLE_HIDE_BORDER_STYLE_LAYER", []);
		}else{
			this.oApp.exec("TABLE_SHOW_BORDER_STYLE_LAYER", []);
		}
	},
	
	$ON_TABLE_SHOW_BORDER_STYLE_LAYER : function(){
		this.oApp.exec("TABLE_CLOSE_ALL", []);
		this.elBtn_borderStyle.className = "se2_view_more2";
		this.elLayer_borderStyle.style.display = "block";
		this._refresh();
	},
	
	$ON_TABLE_HIDE_BORDER_STYLE_LAYER : function(){
		this.elBtn_borderStyle.className = "se2_view_more";
		this.elLayer_borderStyle.style.display = "none";
		this._refresh();
	},

	$ON_TABLE_TOGGLE_STYLE_LAYER : function(){
		if(this.elLayer_tableStyle.style.display == "block"){
			this.oApp.exec("TABLE_HIDE_STYLE_LAYER", []);
		}else{
			this.oApp.exec("TABLE_SHOW_STYLE_LAYER", []);
		}
	},
	
	$ON_TABLE_SHOW_STYLE_LAYER : function(){
		this.oApp.exec("TABLE_CLOSE_ALL", []);
		this.elBtn_tableStyle.className = "se2_view_more2";
		this.elLayer_tableStyle.style.display = "block";
		this._refresh();
	},
	
	$ON_TABLE_HIDE_STYLE_LAYER : function(){
		this.elBtn_tableStyle.className = "se2_view_more";
		this.elLayer_tableStyle.style.display = "none";
		this._refresh();
	},

	$ON_TABLE_TOGGLE_BORDER_COLOR_PALLET : function(){
		if(this.welDropdownLayer.hasClass("p1")){
			this.oApp.exec("TABLE_HIDE_BORDER_COLOR_PALLET", []);
		}else{
			this.oApp.exec("TABLE_SHOW_BORDER_COLOR_PALLET", []);
		}
	},

	$ON_TABLE_SHOW_BORDER_COLOR_PALLET : function(){
		this.oApp.exec("TABLE_CLOSE_ALL", []);

		this.welDropdownLayer.addClass("p1");
		this.welDropdownLayer.removeClass("p2");
		
		this.oApp.exec("SHOW_COLOR_PALETTE", ["TABLE_SET_BORDER_COLOR_FROM_PALETTE", this.elPanel_borderColorPallet]);
		this.elPanel_borderColorPallet.parentNode.style.display = "block";
	},

	$ON_TABLE_HIDE_BORDER_COLOR_PALLET : function(){
		this.welDropdownLayer.removeClass("p1");
		
		this.oApp.exec("HIDE_COLOR_PALETTE", []);
		this.elPanel_borderColorPallet.parentNode.style.display = "none";
	},

	$ON_TABLE_TOGGLE_BGCOLOR_PALLET : function(){
		if(this.welDropdownLayer.hasClass("p2")){
			this.oApp.exec("TABLE_HIDE_BGCOLOR_PALLET", []);
		}else{
			this.oApp.exec("TABLE_SHOW_BGCOLOR_PALLET", []);
		}
	},

	$ON_TABLE_SHOW_BGCOLOR_PALLET : function(){
		this.oApp.exec("TABLE_CLOSE_ALL", []);
	
		this.welDropdownLayer.removeClass("p1");
		this.welDropdownLayer.addClass("p2");

		this.oApp.exec("SHOW_COLOR_PALETTE", ["TABLE_SET_BGCOLOR_FROM_PALETTE", this.elPanel_bgColorPallet]);
		this.elPanel_bgColorPallet.parentNode.style.display = "block";
	},

	$ON_TABLE_HIDE_BGCOLOR_PALLET : function(){
		this.welDropdownLayer.removeClass("p2");
		
		this.oApp.exec("HIDE_COLOR_PALETTE", []);
		this.elPanel_bgColorPallet.parentNode.style.display = "none";
	},

	$ON_TABLE_SET_BORDER_COLOR_FROM_PALETTE : function(sColorCode){
		this.oApp.exec("TABLE_SET_BORDER_COLOR", [sColorCode]);
		this.oApp.exec("TABLE_HIDE_BORDER_COLOR_PALLET", []);
	},

	$ON_TABLE_SET_BORDER_COLOR : function(sColorCode){
		this.elText_borderColor.value = sColorCode;
		this.elBtn_borderColor.style.backgroundColor = sColorCode;
	},

	$ON_TABLE_SET_BGCOLOR_FROM_PALETTE : function(sColorCode){
		this.oApp.exec("TABLE_SET_BGCOLOR", [sColorCode]);
		this.oApp.exec("TABLE_HIDE_BGCOLOR_PALLET", []);
	},
	
	$ON_TABLE_SET_BGCOLOR : function(sColorCode){
		this.elText_BGColor.value = sColorCode;
		this.elBtn_BGColor.style.backgroundColor = sColorCode;
	},

	$ON_TABLE_ENABLE_MANUAL_STYLE : function(){
		this.nStyleMode = 1;
		this._drawTableDropdownLayer();
	},
	
	$ON_TABLE_ENABLE_TEMPLATE_STYLE : function(){
		this.nStyleMode = 2;
		this._drawTableDropdownLayer();
	},
	
	$ON_EVENT_TABLE_CREATE_KEYDOWN : function(oEvent){
		if (oEvent.key().enter){
			this.elBtn_apply.focus();
			this.oApp.exec("TABLE_INSERT");
			oEvent.stop();
		}
	},
	
	_drawTableDropdownLayer : function(){
		if(this.nBorderStyleIdx == 1){
			this.elPanel_borderStylePreview.innerHTML = this.sNoBorderText;
			this.elLayer_Dim1.className = "se2_t_dim2";
		}else{
			this.elPanel_borderStylePreview.innerHTML = "";
			this.elLayer_Dim1.className = "se2_t_dim0";
		}
	
		if(this.nStyleMode == 1){
			this.elRadio_manualStyle.checked = true;
			this.elLayer_Dim2.className = "se2_t_dim3";
			
			this.elText_borderSize.disabled = false;
			this.elText_borderColor.disabled = false;
			this.elText_BGColor.disabled = false;
		}else{
			this.elRadio_templateStyle.checked = true;
			this.elLayer_Dim2.className = "se2_t_dim1";
			
			this.elText_borderSize.disabled = true;
			this.elText_borderColor.disabled = true;
			this.elText_BGColor.disabled = true;
		}
		this.oApp.exec("TABLE_CLOSE_ALL", []);
	},
	
	_selectBorderStyle : function(nStyleNum){
		this.elPanel_borderStylePreview.className = "se2_b_style"+nStyleNum;
		this.nBorderStyleIdx = nStyleNum;
		this._drawTableDropdownLayer();
	},
	
	_selectTableStyle : function(nStyleNum){
		this.elPanel_tableStylePreview.className = "se2_t_style"+nStyleNum;
		this.nTableStyleIdx = nStyleNum;
		this._drawTableDropdownLayer();
	},

	_showNewTable : function(){
		var oTmp = document.createElement("DIV");
		this._loadValuesFromHTML();
		
		oTmp.innerHTML = this._getPreviewTableString(this.nColumns, this.nRows);

		//this.nTableWidth = 0;
		//oTmp.innerHTML = this._getTableString();
		var oNewTable = oTmp.firstChild;
		this.elTable_preview.parentNode.insertBefore(oNewTable, this.elTable_preview);
		this.elTable_preview.parentNode.removeChild(this.elTable_preview);
		this.elTable_preview = oNewTable;

		this._refresh();
	},

	_getPreviewTableString : function(nColumns, nRows){
		var sTable = '<table border="0" cellspacing="1" class="se2_pre_table husky_se2m_table_preview">';
		var sRow = '<tr>';

		for(var i=0; i<nColumns; i++){
			sRow += "<td><p>&nbsp;</p></td>\n";
		}
		sRow += "</tr>\n";
		
		sTable += "<tbody>";
		for(var i=0; i<nRows; i++){
			sTable += sRow;
		}
		sTable += "</tbody>\n";

		sTable += "</table>\n";

		return sTable;
	},

	_loadValuesFromHTML : function(){
		this.nColumns = parseInt(this.elText_col.value, 10) || 1;
		this.nRows = parseInt(this.elText_row.value, 10) || 1;

		this.nBorderSize = parseInt(this.elText_borderSize.value, 10) || 1;
		this.sBorderColor = this.elText_borderColor.value;
		this.sBGColor = this.elText_BGColor.value;
	},
	
	_doGetTableString : function(nColumns, nRows, nBorderSize, sBorderColor, sBGColor, nBorderStyleIdx){
		var nTDWidth = parseInt(this.nTableWidth/nColumns, 10);
		var nBorderSize = this.nBorderSize;
		var sTableStyle = this.aTableStyleByBorder[nBorderStyleIdx].replace(/#BorderSize#/g, this.nBorderSize).replace(/#BorderSize\*([0-9]+)#/g, function(sAll, s1){return nBorderSize*parseInt(s1, 10);}).replace(/#BorderSize\+([0-9]+)#/g, function(sAll, s1){return nBorderSize+parseInt(s1, 10);}).replace("#BorderColor#", this.sBorderColor).replace("#BGColor#", this.sBGColor);
		var sTDStyle = this.aTDStyleByBorder[nBorderStyleIdx].replace(/#BorderSize#/g, this.nBorderSize).replace(/#BorderSize\*([0-9]+)#/g, function(sAll, s1){return nBorderSize*parseInt(s1, 10);}).replace(/#BorderSize\+([0-9]+)#/g, function(sAll, s1){return nBorderSize+parseInt(s1, 10);}).replace("#BorderColor#", this.sBorderColor).replace("#BGColor#", this.sBGColor);
		if(nTDWidth){
			sTDStyle += " width="+nTDWidth;
		}else{
			//sTableStyle += " width=100%";
			sTableStyle += "class=se2_pre_table";
		}

		// [SMARTEDITORSUS-365] 테이블퀵에디터 > 속성 직접입력 > 테두리 스타일
		//		- 테두리 없음을 선택하는 경우 본문에 삽입하는 표에 가이드 라인을 표시해 줍니다. 보기 시에는 테두리가 보이지 않습니다.
		//		- 글 저장 시에는 글 작성 시에 적용하였던 style 을 제거합니다. 이를 위해서 임의의 속성(attr_no_border_tbl)을 추가하였다가 저장 시점에서 제거해 주도록 합니다.
		var sTempNoBorderClass = (nBorderStyleIdx == 1) ? 'attr_no_border_tbl="1"' : '';
		
		var sTable = "<table "+sTableStyle+" "+sTempNoBorderClass+">";
		var sRow = "<tr>";
		for(var i=0; i<nColumns; i++){
			sRow += "<td "+sTDStyle+"><p>&nbsp;</p></td>\n";
		}
		sRow += "</tr>\n";
		
		sTable += "<tbody>\n";
		for(var i=0; i<nRows; i++){
			sTable += sRow;
		}
		sTable += "</tbody>\n";

		sTable += "</table>\n<br>";
		
		return sTable;
	},
	
	_numRowKeydown : function(weEvent){
		var oKeyInfo = weEvent.key();

		// up
		if(oKeyInfo.keyCode == 38){
			this.oApp.exec("TABLE_INC_ROW", []);
		}

		// down
		if(oKeyInfo.keyCode == 40){
			this.oApp.exec("TABLE_DEC_ROW", []);
		}
	},

	_numColKeydown : function(weEvent){
		var oKeyInfo = weEvent.key();

		// up
		if(oKeyInfo.keyCode == 38){
			this.oApp.exec("TABLE_INC_COLUMN", []);
		}

		// down
		if(oKeyInfo.keyCode == 40){
			this.oApp.exec("TABLE_DEC_COLUMN", []);
		}
	},
	
	_borderSizeKeydown : function(weEvent){
		var oKeyInfo = weEvent.key();

		// up
		if(oKeyInfo.keyCode == 38){
			this.oApp.exec("TABLE_INC_BORDER_SIZE", []);
		}

		// down
		if(oKeyInfo.keyCode == 40){
			this.oApp.exec("TABLE_DEC_BORDER_SIZE", []);
		}
	},
	
	_refresh : function(){
		// the dropdown layer breaks without this line in IE 6 when modifying the preview table
		this.elDropdownLayer.style.zoom=0;
		this.elDropdownLayer.style.zoom="";
	}
	//@lazyload_js]
});
//}