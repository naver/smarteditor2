import "@static/js/lib/jindo2.all";
import "@static/js/lib/jindo_component";
import "@src/bundle/husky-range";

describe("husky-range bundle", () => {
    it("imported modules", () => {
        // given

        // when

        // then
        expect(nhn.HuskyRange).toBeDefined();
        expect(nhn.husky.HuskyCore).toBeDefined();
        expect(nhn.husky.CorePlugin).toBeDefined();
        expect(nhn.husky.HuskyRangeManager).toBeDefined();
    });
});