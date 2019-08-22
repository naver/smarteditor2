import "@static/js/lib/jindo2.all";
import "@src/util/hp_SE2M_Utils";

describe("StringBuffer", () => {
    it("toString > 저장된 문자열을 반환한다.", () => {
        // given
        const sb = new StringBuffer("hello");

        // when
        const str = sb.toString();

        // then
        expect(str).toEqual("hello");
    });

    it("append > 문자열을 덧붙인다.", () => {
        // given
        const sb = new StringBuffer("hello");

        // when
        sb.append(" ").append("world");

        // then
        expect(sb.toString()).toEqual("hello world");
    });
});