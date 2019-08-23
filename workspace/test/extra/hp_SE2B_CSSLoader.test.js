import "@static/js/lib/jindo2.all";
import "@static/js/service/SE2M_Configuration";
import "@src/husky_framework/HuskyCore";
import "@src/util/hp_SE2M_Utils";
import "@src/extra/hp_SE2B_CSSLoader";

describe("SE2B_CSSLoader", () => {
    describe("생성자", () => {
        it("인스턴스를 생성할 수 있다.", () => {
            // given

            // when
            const plugin = new nhn.husky.SE2B_CSSLoader();

            // then
            expect(plugin).toBeInstanceOf(nhn.husky.SE2B_CSSLoader);
        });

        it("인스턴스를 생성할때 설정값을 옵션으로 사용한다.", () => {
            // given
            const config = nhn.husky.SE2M_Configuration.SE2B_CSSLoader;

            // when
            const plugin = new nhn.husky.SE2B_CSSLoader();

            // then
            expect(plugin.htOptions).toEqual(config);
        });

        it("ie 가 아니면 MSG_APP_READY 메세지핸들러가 추가된다.", () => {
            // given
            jest.spyOn(jindo.$Agent(), "navigator").mockReturnValue({ ie: false });

            // when
            const plugin = new nhn.husky.SE2B_CSSLoader();

            // then
            expect(plugin.$ON_MSG_APP_READY).toBeInstanceOf(Function);
        });

        it("ie 는 MSG_APP_READY 메세지핸들러 대신 특정메세지들의 BEFORE 핸들러가 추가된다.", () => {
            // given
            jest.spyOn(jindo.$Agent(), "navigator").mockReturnValue({ ie: true });

            // when
            const plugin = new nhn.husky.SE2B_CSSLoader();

            // then
            expect(plugin.$ON_MSG_APP_READY).toBeUndefined();
            const { aInstantLoadTrigger, aDelayedLoadTrigger } = plugin;
            aInstantLoadTrigger.forEach((MSG_NAME) => {
                expect(plugin[`$BEFORE_${MSG_NAME}`]).toBeInstanceOf(Function);
            });
            aDelayedLoadTrigger.forEach((MSG_NAME) => {
                expect(plugin[`$BEFORE_${MSG_NAME}`]).toBeInstanceOf(Function);
            });
        });
    });

    describe("메시지처리", () => {
        let core;
        let plugin;
        let mockLoadCSS;
        let mockAgentNavigator;

        beforeEach(() => {
            core = new nhn.husky.HuskyCore();
            mockLoadCSS = jest.spyOn(nhn.husky.SE2M_Utils, "loadCSS").mockImplementation(() => {});
            mockAgentNavigator = jest.spyOn(jindo.$Agent(), "navigator");
        });

        describe("ie 가 아닌 경우", () => {
            beforeEach(() => {
                mockAgentNavigator.mockReturnValue({ ie: false });
                core.registerPlugin((plugin = new nhn.husky.SE2B_CSSLoader()));
            });
    
            it("MSG_APP_READY 시점에 바로 추가 css 를 로드한다.", () => {
                // given
    
                // when
                core.run();
    
                // then
                expect(mockLoadCSS).toHaveBeenCalled();
            });
        });

        describe("case in IE browser", () => {
            beforeEach(() => {
                mockAgentNavigator.mockReturnValue({ ie: true });
                core.registerPlugin((plugin = new nhn.husky.SE2B_CSSLoader()));
                core.run();
            });

            describe("aInstantLoadTrigger", () => {
                it("aInstantLoadTrigger 의 메시지가 발행되면 추가 css 를 로드한다.", () => {
                    // given
                    const MSG_NAME = plugin.aInstantLoadTrigger[0];
    
                    // when
                    core.exec(MSG_NAME);
    
                    // then
                    expect(mockLoadCSS).toHaveBeenCalled();
                });
    
                it("메시지가 여러번 발행되어도 추가 css 를 중복 로딩하지 않는다.", () => {
                    // given
                    const MSG_NAME = plugin.aInstantLoadTrigger[0];
                    core.exec(MSG_NAME);
                    mockLoadCSS.mockClear();
    
                    // when
                    core.exec(MSG_NAME);
    
                    // then
                    expect(mockLoadCSS).not.toHaveBeenCalled();
                });
            });

            describe("aDelayedLoadTrigger", () => {
                it("aDelayedLoadTrigger 의 메시지가 발행되면 추가 css 를 로드한다.", () => {
                    // given
                    const MSG_NAME = plugin.aDelayedLoadTrigger[0];
    
                    // when
                    core.exec(MSG_NAME);
    
                    // then
                    expect(mockLoadCSS).toHaveBeenCalled();
                });
    
                it("css 로드가 완료되기 전까지 메시지처리를 일시중단시킨다.", () => {
                    // given
                    const MSG_NAME = plugin.aDelayedLoadTrigger[0];
                    const spyPlugin = {
                        [`$ON_${MSG_NAME}`]: jest.fn()
                    };
                    core.registerPlugin(spyPlugin);
    
                    // when
                    core.exec(MSG_NAME);
    
                    // then
                    expect(spyPlugin[`$ON_${MSG_NAME}`]).not.toHaveBeenCalled();
                });

                it("css 로드가 완료된 이후에는 메시지를 재발행하여 재개시킨다.", () => {
                    // given
                    const MSG_NAME = plugin.aDelayedLoadTrigger[0];
                    const spyPlugin = {
                        [`$ON_${MSG_NAME}`]: jest.fn()
                    };
                    core.registerPlugin(spyPlugin);
                    core.exec(MSG_NAME);

                    // when
                    const callback = mockLoadCSS.mock.calls[0][1];
                    callback();
    
                    // then
                    expect(spyPlugin[`$ON_${MSG_NAME}`]).toHaveBeenCalled();
                });
            });
        });
    });
});