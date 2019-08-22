import "@static/js/lib/jindo2.all";
import "@static/js/lib/jindo_component";
import "@src/bundle/husky-range";
import "@src/bundle/base";

describe("lazy bundle", () => {
    it("imported modules", async () => {
        // given
        const spy = jest.spyOn(nhn.husky.HuskyCore, "addLoadedFile");

        // when
        await import("@src/bundle/lazy");

        // then
        expect(spy).toHaveBeenCalledWith("hp_SE2M_FindReplacePlugin$Lazy.js");
        expect(spy).toHaveBeenCalledWith("hp_SE2M_Quote$Lazy.js");
        expect(spy).toHaveBeenCalledWith("hp_SE2M_SCharacter$Lazy.js");
        expect(spy).toHaveBeenCalledWith("hp_SE2M_TableCreator$Lazy.js");
        expect(spy).toHaveBeenCalledWith("hp_SE2M_TableEditor$Lazy.js");
        expect(spy).toHaveBeenCalledWith("hp_SE2M_BGColor$Lazy.js");
        expect(spy).toHaveBeenCalledWith("hp_SE2M_FontColor$Lazy.js");
        expect(spy).toHaveBeenCalledWith("hp_SE2M_Hyperlink$Lazy.js");
        expect(spy).toHaveBeenCalledWith("hp_SE2M_LineHeightWithLayerUI$Lazy.js");
        expect(spy).toHaveBeenCalledWith("hp_SE2M_QuickEditor_Common$Lazy.js");
        expect(spy).toHaveBeenCalledWith("hp_DialogLayerManager$Lazy.js");
        expect(spy).toHaveBeenCalledWith("N_FindReplace.js");
        expect(spy).toHaveBeenCalledWith("SE2M_TableTemplate.js");
        expect(spy).toHaveBeenCalledWith("N_DraggableLayer.js");
    });
});