import "@static/js/lib/jindo2.all";
import "@src/husky_framework/HuskyCore";
import "@src/extra/hp_SE_OuterIFrameControl";
import MARKUP from "@test/__helpers__/markup";
import { simulateEvent } from "@test/__helpers__/event";

afterEach(() => {
    document.body.innerHTML = "";
});

describe("SE_OuterIFrameControl", () => {
    describe("생성자", () => {
        it("인스턴스를 생성할 수 있다.", () => {
            // given
            document.body.innerHTML = MARKUP.FULL;

            // when
            const plugin = new nhn.husky.SE_OuterIFrameControl();

            // then
            expect(plugin).toBeInstanceOf(nhn.husky.SE_OuterIFrameControl);
        });

        it("인스턴스가 생성되면 Element 가 할당된다.", () => {
            // given
            document.body.innerHTML = MARKUP.FULL;

            // when
            const plugin = new nhn.husky.SE_OuterIFrameControl();

            // then
            expect(plugin.oResizeGrip).toBeInstanceOf(Element);
            expect(plugin.elIFrame).toEqual(window.frameElement);
        });

        it("리사이즈그립 요소가 없으면 할당되지 않는다.", () => {
            // given

            // when
            const plugin = new nhn.husky.SE_OuterIFrameControl();

            // then
            expect(plugin.oResizeGrip).toBeNull();
            expect(plugin.elIFrame).toEqual(window.frameElement);
        });

        it("인스턴스 생성시 컨테이너요소를 지정하면 해당요소하위에서 Element 를 찾는다.", () => {
            // given
            document.body.innerHTML = `
                <div id="container1" class="container">${MARKUP.FULL}</div>
                <div id="container2" class="container">${MARKUP.FULL}</div>
            `;
            const container = document.getElementById("container2");

            // when
            const plugin = new nhn.husky.SE_OuterIFrameControl(container);

            // then
            expect(plugin.oResizeGrip.closest(".container")).toEqual(container);
        });
    });

    describe("메시지처리", () => {
        let core;
        let plugin;

        beforeEach(() => {
            document.body.innerHTML = MARKUP.FULL;
            core = new nhn.husky.HuskyCore();
            core.registerPlugin((plugin = new nhn.husky.SE_OuterIFrameControl()));
            plugin.elIFrame = document.createElement("IFRAME");
            jest.spyOn(plugin, "$ON_SE_FIT_IFRAME");
        });

        describe("MSG_APP_READY", () => {
            it("SE_FIT_IFRAME 메시지를 발행한다.", () => {
                // given

                // when
                core.run();

                // then
                expect(plugin.$ON_SE_FIT_IFRAME).toHaveBeenCalled();
            });
        });

        describe("MSG_EDITING_AREA_SIZE_CHANGED", () => {
            it("SE_FIT_IFRAME 메시지를 발행한다.", () => {
                // given
                core.run();

                // when
                core.exec("MSG_EDITING_AREA_SIZE_CHANGED");

                // then
                expect(plugin.$ON_SE_FIT_IFRAME).toHaveBeenCalledTimes(2);
            });
        });

        describe("RESIZE_EDITING_AREA_BY", () => {
            it("SE_FIT_IFRAME 메시지를 발행한다.", () => {
                // given
                core.run();

                // when
                core.exec("RESIZE_EDITING_AREA_BY");

                // then
                expect(plugin.$ON_SE_FIT_IFRAME).toHaveBeenCalledTimes(2);
            });
        });

        describe("SE_FIT_IFRAME", () => {
            it("상위 iframe 의 높이를 body 의 높이와 동일하게 맞춘다.", () => {
                // given
                core.run();

                // when
                core.exec("SE_FIT_IFRAME");

                // then
                expect(plugin.elIFrame.style.height).toEqual(document.body.offsetHeight+"px");
            });
        });
    });

    describe("resizeGrip eventListener", () => {
        let core;
        let plugin;

        beforeEach(() => {
            document.body.innerHTML = MARKUP.FULL;
            core = new nhn.husky.HuskyCore();
        });

        describe("key event handling", () => {
            beforeEach(() => {
                core.registerPlugin((plugin = new nhn.husky.SE_OuterIFrameControl()));
                plugin.elIFrame = document.createElement("IFRAME");
            });
    
            it("리사이즈그립에서 방향키가 입력되면 사이즈변경 메시지를 발행한다.", () => {
                // given
                const spyPlugin = {
                    $ON_MSG_EDITING_AREA_RESIZE_STARTED: jest.fn(),
                    $ON_RESIZE_EDITING_AREA_BY: jest.fn(),
                    $ON_MSG_EDITING_AREA_RESIZE_ENDED: jest.fn()
                };
                core.registerPlugin(spyPlugin);
                core.run();
    
                // when
                simulateEvent(plugin.oResizeGrip, "keydown", {
                    keyCode: 33
                });
    
                // then
                expect(spyPlugin.$ON_MSG_EDITING_AREA_RESIZE_STARTED).toHaveBeenCalled();
                expect(spyPlugin.$ON_RESIZE_EDITING_AREA_BY).toHaveBeenCalled();
                expect(spyPlugin.$ON_MSG_EDITING_AREA_RESIZE_ENDED).toHaveBeenCalled();
            });

            it("리사이즈그립에서 방향키이외의 키가 입력되면 사이즈변경 메시지를 발행하지 않는다.", () => {
                // given
                const spyPlugin = {
                    $ON_MSG_EDITING_AREA_RESIZE_STARTED: jest.fn(),
                    $ON_RESIZE_EDITING_AREA_BY: jest.fn(),
                    $ON_MSG_EDITING_AREA_RESIZE_ENDED: jest.fn()
                };
                core.registerPlugin(spyPlugin);
                core.run();
    
                // when
                simulateEvent(plugin.oResizeGrip, "keydown", {
                    keyCode: 32
                });
    
                // then
                expect(spyPlugin.$ON_MSG_EDITING_AREA_RESIZE_STARTED).not.toHaveBeenCalled();
                expect(spyPlugin.$ON_RESIZE_EDITING_AREA_BY).not.toHaveBeenCalled();
                expect(spyPlugin.$ON_MSG_EDITING_AREA_RESIZE_ENDED).not.toHaveBeenCalled();
            });
        });

        describe("mouse event handling only in IE browser", () => {
            beforeEach(() => {
                jest.spyOn(jindo.$Agent(), "navigator").mockReturnValue({ ie: true });
                core.registerPlugin((plugin = new nhn.husky.SE_OuterIFrameControl()));
                plugin.elIFrame = document.createElement("IFRAME");
                plugin.welIFrame = jindo.$Element(plugin.elIFrame);
            });
    
            it("mousedown 이벤트가 발생하면 사이즈변경시작 메시지를 발행한다.", () => {
                // given
                const spyPlugin = {
                    $ON_MSG_EDITING_AREA_RESIZE_STARTED: jest.fn(),
                    $ON_RESIZE_EDITING_AREA_BY: jest.fn(),
                    $ON_MSG_EDITING_AREA_RESIZE_ENDED: jest.fn()
                };
                core.registerPlugin(spyPlugin);
                core.run();
    
                // when
                simulateEvent(plugin.oResizeGrip, "mousedown", {
                    clientY: 100
                });
    
                // then
                expect(spyPlugin.$ON_MSG_EDITING_AREA_RESIZE_STARTED).toHaveBeenCalled();
                expect(spyPlugin.$ON_RESIZE_EDITING_AREA_BY).not.toHaveBeenCalled();
                expect(spyPlugin.$ON_MSG_EDITING_AREA_RESIZE_ENDED).not.toHaveBeenCalled();
            });

            it("mousemove 이벤트가 발생하면 사이즈변경 메시지를 발행한다.", () => {
                // given
                const spyPlugin = {
                    $ON_MSG_EDITING_AREA_RESIZE_STARTED: jest.fn(),
                    $ON_RESIZE_EDITING_AREA_BY: jest.fn(),
                    $ON_MSG_EDITING_AREA_RESIZE_ENDED: jest.fn()
                };
                core.registerPlugin(spyPlugin);
                core.run();
                simulateEvent(plugin.oResizeGrip, "mousedown", {
                    clientY: 100
                });

                // when
                simulateEvent(plugin.oResizeGrip, "mousemove", {
                    clientY: 110
                });
    
                // then
                expect(spyPlugin.$ON_MSG_EDITING_AREA_RESIZE_STARTED).toHaveBeenCalled();
                expect(spyPlugin.$ON_RESIZE_EDITING_AREA_BY).toHaveBeenCalled();
                expect(spyPlugin.$ON_MSG_EDITING_AREA_RESIZE_ENDED).not.toHaveBeenCalled();
            });

            it("mouseup 이벤트가 발생하면 사이즈변경종료 메시지를 발행한다.", () => {
                // given
                const spyPlugin = {
                    $ON_MSG_EDITING_AREA_RESIZE_STARTED: jest.fn(),
                    $ON_RESIZE_EDITING_AREA_BY: jest.fn(),
                    $ON_MSG_EDITING_AREA_RESIZE_ENDED: jest.fn()
                };
                core.registerPlugin(spyPlugin);
                core.run();
                simulateEvent(plugin.oResizeGrip, "mousedown", {
                    clientY: 100
                });

                // when
                simulateEvent(plugin.oResizeGrip, "mouseup", {
                    clientY: 100
                });
    
                // then
                expect(spyPlugin.$ON_MSG_EDITING_AREA_RESIZE_STARTED).toHaveBeenCalled();
                expect(spyPlugin.$ON_RESIZE_EDITING_AREA_BY).not.toHaveBeenCalled();
                expect(spyPlugin.$ON_MSG_EDITING_AREA_RESIZE_ENDED).toHaveBeenCalled();
            });
        });
    });
});