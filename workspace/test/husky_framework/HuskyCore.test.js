import "@static/js/lib/jindo2.all";
import "@static/js/lib/jindo_component";
import "@src/husky_framework/HuskyCore";
import { simulateEvent } from "@test/__helpers__/event";

describe("HuskyCore", () => {
    afterEach(() => {
        nhn.husky.HuskyCore.reset();
    });

    it("인스턴스를 생성할 수 있다.", () => {
        // given

        // when
        const core = new nhn.husky.HuskyCore();

        // then
        expect(core).toBeInstanceOf(nhn.husky.HuskyCore);
    });

    describe("run > ", () => {
        let core;

        beforeEach(() => {
            core = new nhn.husky.HuskyCore();
        });

        it("status is NOT_READY before run", () => {
            // given

            // when

            // then
            expect(core.appStatus).toEqual(nhn.husky.APP_STATUS.NOT_READY);
        });

        it("status is READY after run", () => {
            // given

            // when
            core.run();

            // then
            expect(core.appStatus).toEqual(nhn.husky.APP_STATUS.READY);
        });
    });

    describe("registerPlugin > ", () => {
        let core;

        beforeEach(() => {
            core = new nhn.husky.HuskyCore();
        });

        it("자기자신도 플러그인이며 최초의 플러그인이다.", () => {
            // given

            // when
            const firstPlugin = core.aPlugins[0];

            // then
            expect(firstPlugin).toEqual(core);
        });

        it("객체를 플러그인으로 등록할 수 있다.", () => {
            // given
            const obj = {};
    
            // when
            core.registerPlugin(obj);
    
            // then
            expect(core.aPlugins[1]).toEqual(obj);
        });

        it("플러그인으로 등록되면 순번이 매겨지고 해당 순번을 반환한다.", () => {
            // given
            const obj = {};

            // when
            const key = core.registerPlugin(obj);

            // then
            expect(obj.nIdx).toEqual(1);
            expect(obj.nIdx).toEqual(key);
        });

        it("플러그인으로 등록되면 코어에 접근할 수 있다.", () => {
            // given
            const obj = {};

            // when
            core.registerPlugin(obj);

            // then
            expect(obj.oApp).toEqual(core);
        });

        it("플러그인으로 등록되면 플러그인 준비상태가 된다.", () => {
            // given
            const obj = {};

            // when
            core.registerPlugin(obj);

            // then
            expect(obj.status).toEqual(nhn.husky.PLUGIN_STATUS.READY);
        });

        it("MSG_PLUGIN_REGISTERED > 플러그인이 등록되면 run 이후에 메시지를 받을 수 있다.", () => {
            // given
            const obj = {
                "$ON_MSG_PLUGIN_REGISTERED": jest.fn()
            };

            // when
            core.registerPlugin(obj);
            core.run();

            // then
            expect(obj.$ON_MSG_PLUGIN_REGISTERED).toHaveBeenCalled();
            expect(obj.$ON_MSG_PLUGIN_REGISTERED).toHaveBeenCalledWith(obj);
        });

        it("플러그인등록시 유효하지 않은 객체를 전달하면 exception 이 발생한다.", () => {
            // given
            const obj = null;

            // when
            const fn = () => {
                core.registerPlugin(obj);
            };

            // then
            expect(fn).toThrow();
        });
    });

    describe("MSG_APP_READY > ", () => {
        let core;

        beforeEach(() => {
            core = new nhn.husky.HuskyCore();
        });

        it("run 을 실행하기 이전에는 MSG_APP_READY 메시지가 플러그인에 전달되지 않는다.", () => {
            // given
            const plugin = {
                "$ON_MSG_APP_READY": jest.fn()
            };

            // when
            core.registerPlugin(plugin);

            // then
            expect(plugin.$ON_MSG_APP_READY).not.toHaveBeenCalled();
        });

        it("run 을 실행한 이후에는 MSG_APP_READY 메시지가 플러그인에 전달된다.", () => {
            // given
            const plugin = {
                "$ON_MSG_APP_READY": jest.fn()
            };

            // when
            core.registerPlugin(plugin);
            core.run();

            // then
            expect(plugin.$ON_MSG_APP_READY).toHaveBeenCalled();
        });

        it("run 을 실행한 이후에는 플러그인을 등록하면 MSG_APP_READY 메시지를 전달받을 수 없다.", () => {
            // given
            const plugin = {
                "$ON_MSG_APP_READY": jest.fn()
            };

            // when
            core.run();
            core.registerPlugin(plugin);

            // then
            expect(plugin.$ON_MSG_APP_READY).not.toHaveBeenCalled();
        });
    });

    describe("exec > ", () => {
        let core;

        beforeEach(() => {
            core = new nhn.husky.HuskyCore();
        });

        it("플러그인에서 oApp.exec 를 이용해 메시지를 발행할 수 있다.", () => {
            // given
            const plugin = {
                "$ON_MSG_CUSTOM": jest.fn()
            };
            core.registerPlugin(plugin);
            core.run();

            // when
            plugin.oApp.exec("MSG_CUSTOM");

            // then
            expect(plugin.$ON_MSG_CUSTOM).toHaveBeenCalled();
        });

        it("다른 플러그인에서 발행한 메시지를 구독할 수 있다.", () => {
            // given
            const plugin = {
                "$ON_MSG_CUSTOM": jest.fn()
            };
            const anotherPlugin = {};
            core.registerPlugin(plugin);
            core.registerPlugin(anotherPlugin);
            core.run();

            // when
            anotherPlugin.oApp.exec("MSG_CUSTOM");

            // then
            expect(plugin.$ON_MSG_CUSTOM).toHaveBeenCalled();
        });

        it("메시지는 BEFORE/ON/AFTER 로 구독할 수 있다.", () => {
            // given
            const plugin = {
                "$BEFORE_MSG_CUSTOM": jest.fn(),
                "$ON_MSG_CUSTOM": jest.fn(),
                "$AFTER_MSG_CUSTOM": jest.fn()
            };
            core.registerPlugin(plugin);
            core.run();

            // when
            plugin.oApp.exec("MSG_CUSTOM");

            // then
            expect(plugin.$BEFORE_MSG_CUSTOM).toHaveBeenCalled();
            expect(plugin.$ON_MSG_CUSTOM).toHaveBeenCalled();
            expect(plugin.$AFTER_MSG_CUSTOM).toHaveBeenCalled();
        });

        it("BEFORE 에서 false 를 반환하면 ON/AFTER 가 중단된다.", () => {
            // given
            const plugin = {
                "$BEFORE_MSG_CUSTOM": jest.fn().mockReturnValue(false),
                "$ON_MSG_CUSTOM": jest.fn(),
                "$AFTER_MSG_CUSTOM": jest.fn()
            };
            core.registerPlugin(plugin);
            core.run();

            // when
            plugin.oApp.exec("MSG_CUSTOM");

            // then
            expect(plugin.$BEFORE_MSG_CUSTOM).toHaveBeenCalled();
            expect(plugin.$ON_MSG_CUSTOM).not.toHaveBeenCalled();
            expect(plugin.$AFTER_MSG_CUSTOM).not.toHaveBeenCalled();
        });

        it("ON 에서 false 를 반환하면 AFTER 가 중단된다.", () => {
            // given
            const plugin = {
                "$BEFORE_MSG_CUSTOM": jest.fn(),
                "$ON_MSG_CUSTOM": jest.fn().mockReturnValue(false),
                "$AFTER_MSG_CUSTOM": jest.fn()
            };
            core.registerPlugin(plugin);
            core.run();

            // when
            plugin.oApp.exec("MSG_CUSTOM");

            // then
            expect(plugin.$BEFORE_MSG_CUSTOM).toHaveBeenCalled();
            expect(plugin.$ON_MSG_CUSTOM).toHaveBeenCalled();
            expect(plugin.$AFTER_MSG_CUSTOM).not.toHaveBeenCalled();
        });

        it("메시지를 발행할때 전달할 인자는 배열로 넘긴다.", () => {
            // given
            const plugin = {
                "$ON_MSG_CUSTOM": jest.fn()
            };
            core.registerPlugin(plugin);
            core.run();

            // when
            plugin.oApp.exec("MSG_CUSTOM", ["A", "B"]);

            // then
            expect(plugin.$ON_MSG_CUSTOM).toHaveBeenCalledWith("A", "B");
        });

        it("delayedExec 를 이용하여 비동기로 메시지를 발행할 수 있다.", () => {
            // given
            jest.useFakeTimers();
            const plugin = {
                "$ON_MSG_CUSTOM": jest.fn()
            };
            core.registerPlugin(plugin);
            core.run();

            // when
            plugin.oApp.delayedExec("MSG_CUSTOM", ["A", "B"], 100);

            // then
            expect(setTimeout).toHaveBeenCalledTimes(1);
            expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 100);

            // when
            jest.runAllTimers();

            // then
            expect(plugin.$ON_MSG_CUSTOM).toHaveBeenCalledWith("A", "B");
        });
    });

    describe("메시지 핸들링 라이프사이클 > ", () => {
        let core;

        beforeEach(() => {
            core = new nhn.husky.HuskyCore();
        });

        it("메시지는 BEFORE/ON/AFTER 순으로 구독할 수 있다.", () => {
            // given
            const plugin = {
                "$BEFORE_MSG_CUSTOM": jest.fn(),
                "$ON_MSG_CUSTOM": jest.fn(),
                "$AFTER_MSG_CUSTOM": jest.fn()
            };
            core.registerPlugin(plugin);
            core.run();

            // when
            plugin.oApp.exec("MSG_CUSTOM");

            // then
            expect(plugin.$BEFORE_MSG_CUSTOM).toHaveBeenCalled();
            expect(plugin.$ON_MSG_CUSTOM).toHaveBeenCalled();
            expect(plugin.$AFTER_MSG_CUSTOM).toHaveBeenCalled();
        });

        it("BEFORE 에서 false 를 반환하면 ON/AFTER 가 중단된다.", () => {
            // given
            const plugin = {
                "$BEFORE_MSG_CUSTOM": jest.fn().mockReturnValue(false),
                "$ON_MSG_CUSTOM": jest.fn(),
                "$AFTER_MSG_CUSTOM": jest.fn()
            };
            core.registerPlugin(plugin);
            core.run();

            // when
            plugin.oApp.exec("MSG_CUSTOM");

            // then
            expect(plugin.$BEFORE_MSG_CUSTOM).toHaveBeenCalled();
            expect(plugin.$ON_MSG_CUSTOM).not.toHaveBeenCalled();
            expect(plugin.$AFTER_MSG_CUSTOM).not.toHaveBeenCalled();
        });

        it("ON 에서 false 를 반환하면 AFTER 가 중단된다.", () => {
            // given
            const plugin = {
                "$BEFORE_MSG_CUSTOM": jest.fn(),
                "$ON_MSG_CUSTOM": jest.fn().mockReturnValue(false),
                "$AFTER_MSG_CUSTOM": jest.fn()
            };
            core.registerPlugin(plugin);
            core.run();

            // when
            plugin.oApp.exec("MSG_CUSTOM");

            // then
            expect(plugin.$BEFORE_MSG_CUSTOM).toHaveBeenCalled();
            expect(plugin.$ON_MSG_CUSTOM).toHaveBeenCalled();
            expect(plugin.$AFTER_MSG_CUSTOM).not.toHaveBeenCalled();
        });

        it("$LOCAL_BEFORE_ALL 은 모든 메시지 전에 매번 실행된다.", () => {
            // given
            const plugin = {
                "$LOCAL_BEFORE_ALL": jest.fn(),
                "$ON_MSG_CUSTOM": jest.fn(),
                "$ON_MSG_CUSTOM2": jest.fn()
            };
            core.registerPlugin(plugin);
            core.run();

            // when
            plugin.oApp.exec("MSG_CUSTOM");

            // then
            expect(plugin.$LOCAL_BEFORE_ALL).toHaveBeenCalled();
            expect(plugin.$ON_MSG_CUSTOM).toHaveBeenCalled();

            // when
            plugin.oApp.exec("MSG_CUSTOM2");

            // then
            expect(plugin.$LOCAL_BEFORE_ALL).toHaveBeenCalledTimes(2);
            expect(plugin.$ON_MSG_CUSTOM2).toHaveBeenCalled();
        });

        it("$LOCAL_BEFORE_FIRST 는 모든 메시지 전에 가장 먼저 한번만 실행된다.", () => {
            // given
            const plugin = {
                "$LOCAL_BEFORE_FIRST": jest.fn(),
                "$ON_MSG_CUSTOM": jest.fn(),
                "$ON_MSG_CUSTOM2": jest.fn()
            };
            core.registerPlugin(plugin);
            core.run();

            // when
            plugin.oApp.exec("MSG_CUSTOM");

            // then
            expect(plugin.$LOCAL_BEFORE_FIRST).toHaveBeenCalled();
            expect(plugin.$ON_MSG_CUSTOM).toHaveBeenCalled();

            // when
            plugin.oApp.exec("MSG_CUSTOM2");

            // then
            expect(plugin.$LOCAL_BEFORE_FIRST).toHaveBeenCalledTimes(1);
            expect(plugin.$ON_MSG_CUSTOM2).toHaveBeenCalled();
        });

        it("$LOCAL_BEFORE_FIRST 에서 false 를 반환하면 이후 메시지는 중단된다.", () => {
            // given
            const plugin = {
                "$LOCAL_BEFORE_FIRST": jest.fn().mockReturnValue(false),
                "$LOCAL_BEFORE_ALL": jest.fn(),
                "$ON_MSG_CUSTOM": jest.fn()
            };
            core.registerPlugin(plugin);
            core.run();

            // when
            plugin.oApp.exec("MSG_CUSTOM");

            // then
            expect(plugin.$LOCAL_BEFORE_FIRST).toHaveBeenCalled();
            expect(plugin.$LOCAL_BEFORE_ALL).not.toHaveBeenCalled();
            expect(plugin.$ON_MSG_CUSTOM).not.toHaveBeenCalled();
        });

        it("$LOCAL_BEFORE_ALL 에서 false 를 반환하면 이후 메시지는 중단된다.", () => {
            // given
            const plugin = {
                "$LOCAL_BEFORE_FIRST": jest.fn(),
                "$LOCAL_BEFORE_ALL": jest.fn().mockReturnValue(false),
                "$ON_MSG_CUSTOM": jest.fn()
            };
            core.registerPlugin(plugin);
            core.run();

            // when
            plugin.oApp.exec("MSG_CUSTOM");

            // then
            expect(plugin.$LOCAL_BEFORE_FIRST).toHaveBeenCalled();
            expect(plugin.$LOCAL_BEFORE_ALL).toHaveBeenCalled();
            expect(plugin.$ON_MSG_CUSTOM).not.toHaveBeenCalled();
        });
    });

    describe("disableMessage > ", () => {
        let core;
        let plugin;

        beforeEach(() => {
            core = new nhn.husky.HuskyCore();
            plugin = {
                "$ON_MSG_CUSTOM": jest.fn()
            };
            core.registerPlugin(plugin);
            core.run();
        });

        it("특정 메시지 처리를 비활성화할 수 있다.", () => {
            // given

            // when
            core.disableMessage("MSG_CUSTOM", true);
            plugin.oApp.exec("MSG_CUSTOM");

            // then
            expect(plugin.$ON_MSG_CUSTOM).not.toHaveBeenCalled();
        });

        it("비활성화되었던 메시지 처리를 다시 활성화할 수 있다.", () => {
            // given

            // when
            core.disableMessage("MSG_CUSTOM", true);
            core.disableMessage("MSG_CUSTOM", false);
            plugin.oApp.exec("MSG_CUSTOM");

            // then
            expect(plugin.$ON_MSG_CUSTOM).toHaveBeenCalled();
        });
    });

    describe("registerBrowserEvent > ", () => {
        let core;
        let plugin;

        beforeEach(() => {
            core = new nhn.husky.HuskyCore();
            plugin = {
                "$ON_MSG_CUSTOM": jest.fn()
            };
            core.registerPlugin(plugin);
            core.run();
        });

        it("특정 요소에 이벤트가 발생하면 자동으로 메시지가 전송되도록 등록할 수 있다.", () => {
            // given
            document.body.innerHTML = '<input type="button" value="btn">';
            const btn = document.querySelector("input[type=button]");

            // when
            core.registerBrowserEvent(btn, "click", "MSG_CUSTOM", ["A", "B"]);
            simulateEvent(btn, "click");

            // then
            expect(plugin.$ON_MSG_CUSTOM).toHaveBeenCalled();
            const args = plugin.$ON_MSG_CUSTOM.mock.calls[0];
            expect(args[0]).toEqual("A");
            expect(args[1]).toEqual("B");
            expect(args[2]).toBeInstanceOf(jindo.$Event);
        });

        it("특정 요소에 이벤트가 발생하면 자동으로 비동기메시지가 전송되도록 등록할 수 있다.", () => {
            // given
            jest.useFakeTimers();
            document.body.innerHTML = '<input type="button" value="btn">';
            const btn = document.querySelector("input[type=button]");

            // when
            core.registerBrowserEvent(btn, "click", "MSG_CUSTOM", ["A", "B"], 100);
            simulateEvent(btn, "click");

            // then
            expect(setTimeout).toHaveBeenCalledTimes(1);
            expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 100);

            // when
            jest.runAllTimers();

            // then
            expect(plugin.$ON_MSG_CUSTOM).toHaveBeenCalled();
            const args = plugin.$ON_MSG_CUSTOM.mock.calls[0];
            expect(args[0]).toEqual("A");
            expect(args[1]).toEqual("B");
            expect(args[2]).toBeInstanceOf(jindo.$Event);
        });
    });

    describe("LazyMessage 처리 > ", () => {
        let core;
        let plugin;
        let CustomPlugin;

        beforeEach(() => {
            nhn.husky.SE2M_Configuration = {
                LazyLoad: {
                    sJsBaseURI : "js_lazyload"
                }
            };
            CustomPlugin = function() {};
            plugin = new CustomPlugin();
            core = new nhn.husky.HuskyCore();
            core.registerPlugin(plugin);
            core.run();
        });

        it("registerLazyMessage > 메시지가 발행될때 특정 파일을 레이지로딩되도록 등록할 수 있다.", () => {
            // given
            jest.spyOn(jindo.LazyLoading, "load");

            // when
            core.registerLazyMessage(["MSG_CUSTOM"], ["lazy.js"]);
            core.exec("MSG_CUSTOM");

            // then
            expect(jindo.LazyLoading.load).toHaveBeenCalled();
        });

        it("addLoadedFile > 이미 로딩된 파일명을 저장하여 재로딩하지 않도록 한다.", () => {
            // given
            jest.spyOn(jindo.LazyLoading, "load");
            nhn.husky.HuskyCore.addLoadedFile("lazy.js");

            // when
            core.registerLazyMessage(["MSG_CUSTOM"], ["lazy.js"]);
            core.exec("MSG_CUSTOM");

            // then
            expect(jindo.LazyLoading.load).not.toHaveBeenCalled();
        });

        it("mixin > 레이지로딩된 모듈이 기존 플러그인을 mixin 하면 메시지를 구독할 수 있다.", () => {
            // given
            jest.spyOn(jindo.LazyLoading, "load").mockImplementation((path, callback) => {
                nhn.husky.HuskyCore.mixin(CustomPlugin, {
                    "$ON_MSG_CUSTOM": jest.fn()
                });
                callback();
            });

            // when
            core.registerLazyMessage(["MSG_CUSTOM"], ["lazy.js"]);
            core.exec("MSG_CUSTOM");

            // then
            expect(plugin.$ON_MSG_CUSTOM).toHaveBeenCalled();
        });

        it("mixin > 기존함수는 override 하지 않는다.", () => {
            // given
            const spy = jest.fn();
            CustomPlugin.prototype.$ON_MSG_CUSTOM = spy;
            jest.spyOn(jindo.LazyLoading, "load").mockImplementation((path, callback) => {
                nhn.husky.HuskyCore.mixin(CustomPlugin, {
                    "$ON_MSG_CUSTOM": jest.fn()
                });
                callback();
            });

            // when
            core.registerLazyMessage(["MSG_CUSTOM"], ["lazy.js"]);
            core.exec("MSG_CUSTOM");

            // then
            expect(plugin.$ON_MSG_CUSTOM).toHaveBeenCalled();
            expect(spy).toHaveBeenCalled();
        });

        it("mixin > 옵션을 통해 기존함수도 override 할 수 있다.", () => {
            // given
            const spy = jest.fn();
            CustomPlugin.prototype.$ON_MSG_CUSTOM = spy;
            jest.spyOn(jindo.LazyLoading, "load").mockImplementation((path, callback) => {
                nhn.husky.HuskyCore.mixin(CustomPlugin, {
                    "$ON_MSG_CUSTOM": jest.fn()
                }, true);
                callback();
            });

            // when
            core.registerLazyMessage(["MSG_CUSTOM"], ["lazy.js"]);
            core.exec("MSG_CUSTOM");

            // then
            expect(plugin.$ON_MSG_CUSTOM).toHaveBeenCalled();
            expect(spy).not.toHaveBeenCalled();
        });

        it("mixin > jindo 클래스를 상속받은 경우 부모클래스도 mixin 이 가능하다.", () => {
            // given
            const ParentClass = jindo.$Class({});
            const ChildClass = jindo.$Class({}).extend(ParentClass);
            const jindoPlugin = new ChildClass();
            core.registerPlugin(jindoPlugin);
            jest.spyOn(jindo.LazyLoading, "load").mockImplementation((path, callback) => {
                nhn.husky.HuskyCore.mixin(ParentClass, {
                    "$ON_MSG_CUSTOM": jest.fn()
                });
                callback();
            });

            // when
            core.registerLazyMessage(["MSG_CUSTOM"], ["lazy.js"]);
            core.exec("MSG_CUSTOM");

            // then
            expect(jindoPlugin.$ON_MSG_CUSTOM).toHaveBeenCalled();
        });
    });
});