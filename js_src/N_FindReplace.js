if(typeof window.nhn=='undefined') window.nhn = {};

/**
 * @fileOverview This file contains a function that takes care of various operations related to find and replace
 * @name N_FindReplace.js
 */
nhn.FindReplace = $Class({
	sKeyword : "",
	window : null,
	document : null,
	bBrowserSupported : false,

	// true if End Of Contents is reached during last execution of find
	bEOC : false,
	
	$init : function(win){
		this.window = win;
		this.document = this.window.document;

		if(this.document.domain != this.document.location.hostname){
			var oAgentInfo = $Agent();
			var oNavigatorInfo = oAgentInfo.navigator();

			if(oNavigatorInfo.firefox && oNavigatorInfo.version < 3){
				this.bBrowserSupported = false;
				this.find = function(){return 3};
				return;
			}
		}

		this.bBrowserSupported = true;
	},
	
	// 0: found
	// 1: not found
	// 2: keyword required
	// 3: browser not supported
	find : function(sKeyword, bCaseMatch, bBackwards, bWholeWord){
		var bSearchResult, bFreshSearch;

		this.window.focus();

		if(!sKeyword) return 2;

		// try find starting from current cursor position
		this.bEOC = false;
		bSearchResult = this.findNext(sKeyword, bCaseMatch, bBackwards, bWholeWord);
		if(bSearchResult) return 0;

		// end of the contents could have been reached so search again from the beginning
		this.bEOC = true;
		bSearchResult = this.findNew(sKeyword, bCaseMatch, bBackwards, bWholeWord);

		if(bSearchResult) return 0;
		
		return 1;
	},
	
	findNew : function (sKeyword, bCaseMatch, bBackwards, bWholeWord){
		this.findReset();
		return this.findNext(sKeyword, bCaseMatch, bBackwards, bWholeWord);
	},
	
	findNext : function(sKeyword, bCaseMatch, bBackwards, bWholeWord){
		var bSearchResult;
		bCaseMatch = bCaseMatch || false;
		bWholeWord = bWholeWord || false;
		bBackwards = bBackwards || false;

		if(this.window.find){
			var bWrapAround = false;
			return this.window.find(sKeyword, bCaseMatch, bBackwards, bWrapAround, bWholeWord);
		}
		
		// IE solution
		if(this.document.body.createTextRange){
			var iOption = 0;
			if(bBackwards) iOption += 1;
			if(bWholeWord) iOption += 2;
			if(bCaseMatch) iOption += 4;
			
			this.window.focus();
			this._range = this.document.selection.createRangeCollection().item(0);
			this._range.collapse(false);
			bSearchResult = this._range.findText(sKeyword, 1, iOption);

			this._range.select();
			return bSearchResult;
		}
		
		return false;
	},
	
	findReset : function() {
		if (this.window.find){
			this.window.getSelection().removeAllRanges();
			return;
		}

		// IE solution
		if(this.document.body.createTextRange){
			this._range = this.document.body.createTextRange();
			this._range.collapse(true);
			this._range.select();
		}
	},
	
	// 0: replaced & next word found
	// 1: replaced & next word not found
	// 2: not replaced & next word found
	// 3: not replaced & next word not found
	// 4: sOriginalWord required
	replace : function(sOriginalWord, Replacement, bCaseMatch, bBackwards, bWholeWord){
		if(!sOriginalWord) return 4;

		var oSelection = new nhn.HuskyRange(this.window);
		oSelection.setFromSelection();

		bCaseMatch = bCaseMatch || false;
		var bMatch, selectedText = oSelection.toString();
		if(bCaseMatch)
			bMatch = (selectedText == sOriginalWord);
		else
			bMatch = (selectedText.toLowerCase() == sOriginalWord.toLowerCase());
		
		if(!bMatch)
			return this.find(sOriginalWord, bCaseMatch, bBackwards, bWholeWord)+2;

		if(typeof Replacement == "function"){
			// the returned oSelection must contain the replacement 
			oSelection = Replacement(oSelection);
		}else{
			oSelection.pasteHTML(Replacement);
		}

		// force it to find the NEXT occurance of sOriginalWord
		oSelection.select();

		return this.find(sOriginalWord, bCaseMatch, bBackwards, bWholeWord);
	},

	// returns number of replaced words
	// -1 : if original word is not given
	replaceAll : function(sOriginalWord, Replacement, bCaseMatch, bWholeWord){
		if(!sOriginalWord) return -1;
		
		var bBackwards = false;

		var iReplaceResult;
		var iResult = 0;
		var win = this.window;
		var oSelection = new nhn.HuskyRange(this.window);
		oSelection.setFromSelection();
		var sBookmark = oSelection.placeStringBookmark();

		this.bEOC = false;
		while(!this.bEOC){
			iReplaceResult = this.replace(sOriginalWord, Replacement, bCaseMatch, bBackwards, bWholeWord);
			if(iReplaceResult == 0 || iReplaceResult == 1) iResult++;
		}

		var startingPointReached = function(){
			var oCurSelection = new nhn.HuskyRange(win);
			oCurSelection.setFromSelection();

			oSelection.moveToBookmark(sBookmark);
			var pos = oSelection.compareBoundaryPoints(nhn.W3CDOMRange.START_TO_END, oCurSelection);

			if(pos == 1) return false;
			return true;
		}

		iReplaceResult = 0;
		this.bEOC = false;
		while(!startingPointReached() && iReplaceResult == 0 && !this.bEOC){
			iReplaceResult = this.replace(sOriginalWord, Replacement, bCaseMatch, bBackwards, bWholeWord);
			if(iReplaceResult == 0 || iReplaceResult == 1) iResult++;
		}

		oSelection.moveToBookmark(sBookmark);
		oSelection.select();
		oSelection.removeStringBookmark(sBookmark);

		return iResult;
	}
});
