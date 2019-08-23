import "@static/js/lib/jindo2.all";
import "@src/husky_framework/HuskyCore";
import "@src/husky_framework/hp_CorePlugin";

describe("CorePlugin", () => {
    afterEach(() => {
        nhn.husky.HuskyCore.reset();
    });

    it("인스턴스를 생성할 수 있다.", () => {
        // given

        // when
        const plugin = new nhn.husky.CorePlugin();

        // then
        expect(plugin).toBeInstanceOf(nhn.husky.CorePlugin);
    });

    describe("핵심메시지처리 > ", () => {
        let core;
        let plugin;
        let customPlugin;

        beforeEach(() => {
            core = new nhn.husky.HuskyCore();
            core.registerPlugin((plugin = new nhn.husky.CorePlugin()));
            core.registerPlugin((customPlugin = {}));
        });

        it("MSG_APP_READY 에 대한 각 플러그인들의 처리가 완료된 후, run 옵션에 fnOnAppReady 함수가 있으면 수행한다.", () => {
            // given
            jest.spyOn(plugin, "$AFTER_MSG_APP_READY");
            const fnOnAppReady = jest.fn();

            // when
            core.run({ fnOnAppReady });
    
            // then
            expect(plugin.$AFTER_MSG_APP_READY).toHaveBeenCalled();
            expect(fnOnAppReady).toHaveBeenCalled();
        });

        it("ADD_APP_PROPERTY > 메시지로 코어에 공용으로 사용할 수 있는 속성을 추가할 수 있다.", () => {
            // given
            core.run();

            // when
            customPlugin.oApp.exec("ADD_APP_PROPERTY", ["propertyName", "propertyValue"]);
    
            // then
            expect(core.propertyName).toEqual("propertyValue");
        });

        it("REGISTER_BROWSER_EVENT > 메시지로 코어에 이벤트메시지를 등록할 수 있다.", () => {
            // given
            jest.spyOn(core, "registerBrowserEvent");
            document.body.innerHTML = '<input type="button" value="btn">';
            const btn = document.querySelector("input[type=button]");
            core.run();

            // when
            customPlugin.oApp.exec("REGISTER_BROWSER_EVENT", [btn, "click", "MSG_CUSTOM", ["A", "B"], 0]);
    
            // then
            expect(core.registerBrowserEvent).toHaveBeenCalledWith(btn, "click", "MSG_CUSTOM", ["A", "B"], 0);
        });

        it("DISABLE_MESSAGE > 메시지로 코어에 메시지중단을 실행할 수 있다.", () => {
            // given
            jest.spyOn(core, "disableMessage");
            core.run();

            // when
            customPlugin.oApp.exec("DISABLE_MESSAGE", ["MSG_CUSTOM"]);
    
            // then
            expect(core.disableMessage).toHaveBeenCalledWith("MSG_CUSTOM", true);
        });

        it("ENABLE_MESSAGE > 메시지로 코어에 메시지재개를 실행할 수 있다.", () => {
            // given
            jest.spyOn(core, "disableMessage");
            core.run();

            // when
            customPlugin.oApp.exec("ENABLE_MESSAGE", ["MSG_CUSTOM"]);
    
            // then
            expect(core.disableMessage).toHaveBeenCalledWith("MSG_CUSTOM", false);
        });
    });
});
