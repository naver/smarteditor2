import "@static/js/lib/jindo2.all";
import "@src/husky_framework/HuskyCore";
import "@src/extra/hp_SE_ToolbarToggler";
import MARKUP from "@test/__helpers__/markup";

afterEach(() => {
    document.body.innerHTML = "";
});

describe("SE2M_Toolbar", () => {
    describe("생성자", () => {
        it("인스턴스를 생성할 수 있다.", () => {
            // given
            document.body.innerHTML = MARKUP.TOOLBAR;

            // when
            const plugin = new nhn.husky.SE_ToolbarToggler();

            // then
            expect(plugin).toBeInstanceOf(nhn.husky.SE_ToolbarToggler);
        });

        it("인스턴스가 생성되면 툴바 Element 가 할당된다.", () => {
            // given
            document.body.innerHTML = MARKUP.TOOLBAR;

            // when
            const plugin = new nhn.husky.SE_ToolbarToggler();

            // then
            expect(plugin.toolbarArea).toBeInstanceOf(Element);
        });

        it("인스턴스 생성시 컨테이너요소를 지정하면 해당요소하위에서 툴바 Element 를 찾는다.", () => {
            // given
            document.body.innerHTML = `
                <div id="container1" class="container">${MARKUP.TOOLBAR}</div>
                <div id="container2" class="container">${MARKUP.TOOLBAR}</div>
            `;
            const container = document.getElementById("container2");

            // when
            const plugin = new nhn.husky.SE_ToolbarToggler(container);

            // then
            expect(plugin.toolbarArea.closest(".container")).toEqual(container);
        });

        it("인스턴스 생성시 툴바를 숨김처리할 수 있다.", () => {
            // given
            document.body.innerHTML = MARKUP.TOOLBAR;

            // when
            const plugin = new nhn.husky.SE_ToolbarToggler(document.body, false);

            // then
            expect(plugin.toolbarArea.style.display).toEqual("none");
        });
    });

    describe("메시지처리", () => {
        let core;
        let plugin;

        beforeEach(() => {
            document.body.innerHTML = MARKUP.TOOLBAR;
            core = new nhn.husky.HuskyCore();
            core.registerPlugin((plugin = new nhn.husky.SE_ToolbarToggler()));
        });

        describe("MSG_APP_READY", () => {
            it("핫키등록메시지를 발행한다.", () => {
                // given
                const hotkeyPlugin = {
                    $ON_REGISTER_HOTKEY: jest.fn()
                };
                core.registerPlugin(hotkeyPlugin);
    
                // when
                core.run();
    
                // then
                expect(hotkeyPlugin.$ON_REGISTER_HOTKEY).toHaveBeenCalledWith("ctrl+t", "SE_TOGGLE_TOOLBAR", []);
            });
        });

        describe("SE_TOGGLE_TOOLBAR", () => {
            beforeEach(() => {
                core.run();
            });

            it("툴바가 노출되어있으면 숨긴다.", () => {
                // given
                plugin.toolbarArea.style.display = "block";

                // when
                plugin.oApp.exec("SE_TOGGLE_TOOLBAR");

                // then
                expect(plugin.toolbarArea.style.display).toEqual("none");
            });

            it("툴바가 숨겨져있으면 노출한다.", () => {
                // given
                plugin.toolbarArea.style.display = "none";

                // when
                plugin.oApp.exec("SE_TOGGLE_TOOLBAR");

                // then
                expect(plugin.toolbarArea.style.display).toEqual("block");
            });

            it("툴바가 토글되면 MSG_EDITING_AREA_SIZE_CHANGED 메시지를 발행한다.", () => {
                // given
                jest.spyOn(core, "exec");

                // when
                plugin.oApp.exec("SE_TOGGLE_TOOLBAR");

                // then
                expect(core.exec).toHaveBeenLastCalledWith("MSG_EDITING_AREA_SIZE_CHANGED", []);
            });
        });
    });
});