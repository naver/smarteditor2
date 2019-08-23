import "@static/js/lib/jindo2.all";
import "@src/husky_framework/HuskyCore";
import "@src/husky_framework/HuskyRange";
import "@src/husky_framework/hp_CorePlugin";
import "@src/husky_framework/hp_HuskyRangeManager";

describe("HuskyRangeManager", () => {
    afterEach(() => {
        nhn.husky.HuskyCore.reset();
    });

    it("인스턴스를 생성할 수 있다.", () => {
        // given

        // when
        const plugin = new nhn.husky.HuskyRangeManager();

        // then
        expect(plugin).toBeInstanceOf(nhn.husky.HuskyRangeManager);
    });

    describe("생성자옵션 > ", () => {
        it("매개변수가 없으면 현재 window 가 oWindow 속성으로 지정된다.", () => {
            // given

            // when
            const plugin = new nhn.husky.HuskyRangeManager();

            // then
            expect(plugin.oWindow).toEqual(window);
        });

        it("매개변수를 전달하면 oWindow 속성을 지정할 수 있다.", () => {
            // given
            const win = {};

            // when
            const plugin = new nhn.husky.HuskyRangeManager(win);

            // then
            expect(plugin.oWindow).toEqual(win);
        });

        it("매개변수로 iframe 을 전달했다면 oWindow 는 MSG_APP_READY 시점에 iframe 의 window 로 재설정된다.", () => {
            // given
            const iframe = document.createElement("IFRAME");
            document.body.appendChild(iframe);
            const core = new nhn.husky.HuskyCore();
            core.registerPlugin(new nhn.husky.CorePlugin());

            // when
            const plugin = new nhn.husky.HuskyRangeManager(iframe);
            core.registerPlugin(plugin);

            // then
            expect(plugin.oWindow).toEqual(iframe);

            // when
            core.run();

            // then
            expect(plugin.oWindow).toEqual(iframe.contentWindow);
        });
    });

    describe("메시지처리 > ", () => {
        let core;
        let plugin;
        let customPlugin;

        beforeEach(() => {
            core = new nhn.husky.HuskyCore();
            core.registerPlugin(new nhn.husky.CorePlugin());
            core.registerPlugin((plugin = new nhn.husky.HuskyRangeManager()));
            core.registerPlugin((customPlugin = {}));
        });

        it("MSG_APP_READY 전에 코어속성으로 selection 관련 메서드를 추가한다.", () => {
            // given
            jest.spyOn(plugin, "$BEFORE_MSG_APP_READY");

            // when
            core.run();
    
            // then
            expect(plugin.$BEFORE_MSG_APP_READY).toHaveBeenCalled();
            expect(core.getSelection).toBeInstanceOf(Function);
            expect(core.getEmptySelection).toBeInstanceOf(Function);
        });

        it("코어속성으로 추가된 getSelection 을 실행하면 HuskyRangeManager.getSelection 이 호출된다.", () => {
            // given
            jest.spyOn(plugin, "getSelection");
            core.run();

            // when
            customPlugin.oApp.getSelection();
    
            // then
            expect(plugin.getSelection).toHaveBeenCalled();
        });

        it("코어속성으로 추가된 getEmptySelection 을 실행하면 HuskyRangeManager.getEmptySelection 이 호출된다.", () => {
            // given
            jest.spyOn(plugin, "getEmptySelection");
            core.run();

            // when
            customPlugin.oApp.getEmptySelection();
    
            // then
            expect(plugin.getEmptySelection).toHaveBeenCalled();
        });

        it("SET_EDITING_WINDOW > 윈도우를 재설정할 수 있다.", () => {
            // given
            const newWindow = {};
            core.run();

            // when
            customPlugin.oApp.exec("SET_EDITING_WINDOW", [newWindow]);
    
            // then
            expect(plugin.oWindow).toEqual(newWindow);
        });
    });
});
