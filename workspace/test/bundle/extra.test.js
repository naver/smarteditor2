import "@static/js/lib/jindo2.all";
import "@static/js/lib/jindo_component";
import "@src/bundle/husky-range";
import "@src/bundle/extra";

describe("extra bundle", () => {
    it("imported modules", () => {
        // given

        // when

        // then
        expect(nhn.husky.SE2B_CSSLoader).toBeDefined();
        expect(nhn.husky.SE_OuterIFrameControl).toBeDefined();
        expect(nhn.husky.SE_ToolbarToggler).toBeDefined();
        expect(window.oMessageMap).toBeDefined();
        expect(window.oMessageMap_en_US).toBeDefined();
        expect(window.oMessageMap_ja_JP).toBeDefined();
        expect(window.oMessageMap_zh_CN).toBeDefined();
        expect(window.oMessageMap_zh_TW).toBeDefined();
    });
});