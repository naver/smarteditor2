import "@static/js/lib/jindo2.all";
import "@static/js/lib/jindo_component";
import "@src/bundle/husky-range";
import "@src/bundle/base";

describe("base bundle", () => {
    it("imported modules", () => {
        // given

        // when

        // then
        expect(nhn.husky.SE2M_Toolbar).toBeDefined();
        expect(nhn.husky.SE_EditingAreaManager).toBeDefined();
        expect(nhn.husky.SE_EditingArea_WYSIWYG).toBeDefined();
        expect(nhn.husky.SE_EditingArea_HTMLSrc).toBeDefined();
        expect(nhn.husky.SE_EditingArea_TEXT).toBeDefined();
        expect(nhn.husky.SE_EditingAreaVerticalResizer).toBeDefined();
        expect(nhn.husky.SE_WYSIWYGEnterKey).toBeDefined();
        expect(nhn.husky.SE2M_EditingModeChanger).toBeDefined();
        expect(nhn.husky.SE_PasteHandler).toBeDefined();
        expect(nhn.husky.SE2M_ExecCommand).toBeDefined();
        expect(nhn.husky.SE_WYSIWYGStyler).toBeDefined();
        expect(nhn.husky.SE_WYSIWYGStyleGetter).toBeDefined();
        expect(nhn.husky.SE2M_FontSizeWithLayerUI).toBeDefined();
        expect(nhn.husky.SE2M_LineStyler).toBeDefined();
        expect(nhn.husky.SE2M_LineHeightWithLayerUI).toBeDefined();
        expect(nhn.husky.SE2M_ColorPalette).toBeDefined();
        expect(nhn.husky.SE2M_FontColor).toBeDefined();
        expect(nhn.husky.SE2M_BGColor).toBeDefined();
        expect(nhn.husky.SE2M_Hyperlink).toBeDefined();
        expect(nhn.husky.SE2M_FontNameWithLayerUI).toBeDefined();
        expect(nhn.ColorPicker).toBeDefined();
        expect(nhn.husky.SE2M_Accessibility).toBeDefined();
        expect(nhn.husky.SE2M_SCharacter).toBeDefined();
        expect(nhn.husky.SE2M_FindReplacePlugin).toBeDefined();
        expect(nhn.husky.SE2M_Quote).toBeDefined();
        expect(nhn.husky.SE2M_TableCreator).toBeDefined();
        expect(nhn.husky.SE2M_TableBlockStyler).toBeDefined();
        expect(nhn.husky.SE2M_StyleRemover).toBeDefined();
        expect(nhn.husky.SE2M_TableEditor).toBeDefined();
        expect(nhn.husky.SE2M_QuickEditor_Common).toBeDefined();
        expect(window.shortcut).toBeDefined();
        expect(nhn.husky.Hotkey).toBeDefined();
        expect(nhn.husky.SE_UndoRedo).toBeDefined();
        expect(nhn.husky.Utils).toBeDefined();
        expect(nhn.husky.DialogLayerManager).toBeDefined();
        expect(nhn.husky.ActiveLayerManager).toBeDefined();
        expect(nhn.husky.StringConverterManager).toBeDefined();
        expect(nhn.husky.MessageManager).toBeDefined();
        expect(nhn.husky.LazyLoader).toBeDefined();
        expect(nhn.husky.PopUpManager).toBeDefined();
        expect(nhn.husky.SE2M_UtilPlugin).toBeDefined();
    });

    it("contains version string", () => {
        // given
        const version = {
            revision: "0",
            type: "open",
            number: "test"
        };

        // when

        // then
        expect(window.nSE2Version).toEqual(version.number + "." + version.revision);
        expect(nhn.husky.SE_EditingAreaManager.version).toEqual(version);
    });
});