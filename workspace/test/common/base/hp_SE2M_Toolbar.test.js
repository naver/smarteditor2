import "@static/js/lib/jindo2.all";
import "@src/husky_framework/HuskyCore";
import "@src/husky_framework/hp_CorePlugin";
import "@src/common/base/hp_SE2M_Toolbar";
import MARKUP from "@test/__helpers__/markup";
import { simulateEvent } from "@test/__helpers__/event";

describe("SE2M_Toolbar", () => {
    describe("생성자", () => {
        it("인스턴스를 생성할 수 있다.", () => {
            // given

            // when
            const plugin = new nhn.husky.SE2M_Toolbar();

            // then
            expect(plugin).toBeInstanceOf(nhn.husky.SE2M_Toolbar);
        });

        it("인스턴스가 생성되면 element 들이 할당된다.", () => {
            // given
            document.body.innerHTML = MARKUP.TOOLBAR;

            // when
            const plugin = new nhn.husky.SE2M_Toolbar();

            // then
            expect(plugin.toolbarArea).toBeInstanceOf(Element);
            expect(plugin.elTextTool).toBeInstanceOf(Element);
        });

        it("인스턴스 생성시 컨테이너요소를 지정하면 해당요소하위에서 element 들을 찾는다.", () => {
            // given
            document.body.innerHTML = `
                <div id="container1" class="container">${MARKUP.TOOLBAR}</div>
                <div id="container2" class="container">${MARKUP.TOOLBAR}</div>
            `;
            const container = document.getElementById("container2");

            // when
            const plugin = new nhn.husky.SE2M_Toolbar(container);

            // then
            expect(plugin.toolbarArea.closest(".container")).toEqual(container);
            expect(plugin.elTextTool.closest(".container")).toEqual(container);
        });

        it("인스턴스 생성시 아이콘툴바가 존재하면 첫번째툴바아이템으로 아이콘툴바의 첫번째 버튼이 할당된다.", () => {
            // given
            document.body.innerHTML = `
                <div class="se2_icon_tool">
                    <ul class="se2_itool1">
                        <li class="se2_mn husky_seditor_ui_photo_attach"><button type="button" class="se2_photo ico_btn se2_mfirst"><span class="se2_icon"></span><span class="se2_mntxt">사진<span class="se2_new"></span></span></button></li>
                        <li class="se2_mn husky_seditor_ui_movie_attach"><button type="button" class="se2_media ico_btn"><span class="se2_icon"></span><span class="se2_mntxt">동영상<span class="se2_new"></span></span></button></li>
                        <li class="se2_mn husky_seditor_ui_link_attach"><button type="button" class="se2_link ico_btn"><span class="se2_icon"></span><span class="se2_mntxt">링크<span class="se2_new"></span></span></button></li>
                        <li class="se2_mn husky_seditor_ui_file_attach"><button type="button" class="se2_file ico_btn"><span class="se2_icon"></span><span class="se2_mntxt">파일</span></button></li>
                        <li class="se2_mn husky_seditor_ui_music_attach"><button type="button" class="se2_music ico_btn"><span class="se2_icon"></span><span class="se2_mntxt">음악</span></button></li>
                        <li class="se2_mn husky_seditor_ui_map_attach"><button type="button" class="se2_map ico_btn"><span class="se2_icon"></span><span class="se2_mntxt">국내<span class="blind">지도</span></span></button></li>
                        <li class="se2_mn husky_seditor_ui_worldmap_attach"><button type="button" class="se2_map2 ico_btn se2_mlast"><span class="se2_icon"></span><span class="se2_mntxt">해외<span class="blind">지도</span></span></button></li>
                    </ul>
                </div>
                ${MARKUP.TOOLBAR}
            `;
            const firstButton = document.querySelector(".se2_icon_tool button");

            // when
            const plugin = new nhn.husky.SE2M_Toolbar();

            // then
            expect(plugin.elFirstToolbarItem).toEqual(firstButton);
        });

        it("인스턴스 생성시 비활성화할 버튼값 옵션을 전달하면 MSG_APP_READY 시점에 비활성화처리된다.", () => {
            // given
            document.body.innerHTML = MARKUP.TOOLBAR;
            const buttonName = "fontName";
            const option = {
                aDisabled: [buttonName]
            };

            // when
            const plugin = new nhn.husky.SE2M_Toolbar(document.body, option);
            const core = new nhn.husky.HuskyCore();
            core.registerPlugin(new nhn.husky.CorePlugin());
            core.registerPlugin(plugin);
            core.run();


            // then
            const button = plugin.getToolbarButtonByUIName(buttonName);
            expect(button.disabled).toBe(true);
        });
    });

    describe("메시지처리", () => {
        let core;
        let plugin;

        beforeEach(() => {
            document.body.innerHTML = MARKUP.FULL;
            core = new nhn.husky.HuskyCore();
            core.registerPlugin(new nhn.husky.CorePlugin());
            core.registerPlugin((plugin = new nhn.husky.SE2M_Toolbar()));
        });

        describe("MSG_APP_READY", () => {
            it("툴바이벤트메시지가 등록된다.", () => {
                // given
                jest.spyOn(core, "registerBrowserEvent");
    
                // when
                core.run();
    
                // then
                expect(core.registerBrowserEvent).toHaveBeenNthCalledWith(1, plugin.toolbarArea, "mouseover", "EVENT_TOOLBAR_MOUSEOVER");
                expect(core.registerBrowserEvent).toHaveBeenNthCalledWith(2, plugin.toolbarArea, "mouseout", "EVENT_TOOLBAR_MOUSEOUT");
                expect(core.registerBrowserEvent).toHaveBeenNthCalledWith(3, plugin.toolbarArea, "mousedown", "EVENT_TOOLBAR_MOUSEDOWN");
            });
    
            it("모바일환경이면 touchstart 이벤트메시지가 등록된다.", () => {
                // given
                jest.spyOn(core, "registerBrowserEvent");
    
                // when
                core.bMobile = true;
                core.run();
    
                // then
                expect(core.registerBrowserEvent).toHaveBeenNthCalledWith(1, plugin.toolbarArea, "touchstart", "EVENT_TOOLBAR_TOUCHSTART");
                expect(core.registerBrowserEvent).toHaveBeenNthCalledWith(2, plugin.toolbarArea, "mousedown", "EVENT_TOOLBAR_MOUSEDOWN");
            });
    
            it("코어속성으로 getToolbarButtonByUIName 메서드가 추가된다.", () => {
                // given
    
                // when
                core.run();
    
                // then
                expect(core.getToolbarButtonByUIName).toBeInstanceOf(Function);
            });
        });

        describe("getToolbarButtonByUIName", () => {
            it("fontName 으로 조회하면 husky_seditor_ui_fontName 클래스 요소 하위의 버튼이 반환된다.", () => {
                // given
                const fontNameButton = document.querySelector(".husky_seditor_ui_fontName BUTTON");

                // when
                const button = plugin.getToolbarButtonByUIName("fontName");
    
                // then
                expect(button).toEqual(fontNameButton);
            });
        });

        describe("REGISTER_UI_EVENT", () => {
            beforeEach(() => {
                core.run();
            });

            it("버튼에 이벤트 메시지를 등록할 수 있다.", () => {
                // given
                const buttonName = "fontName";
                const buttonElement = plugin.getToolbarButtonByUIName(buttonName);
                jest.spyOn(core, "registerBrowserEvent");

                // when
                plugin.oApp.exec("REGISTER_UI_EVENT", [buttonName, "click", "CLICK_FONT_NAME"]);

                // then
                expect(core.registerBrowserEvent).toHaveBeenLastCalledWith(buttonElement, "click", "CLICK_FONT_NAME", undefined);
            });

            it("해당버튼이 없으면 이벤트 메시지가 등록되지 않는다.", () => {
                // given
                const buttonName = "invalid";
                jest.spyOn(core, "registerBrowserEvent");

                // when
                plugin.oApp.exec("REGISTER_UI_EVENT", [buttonName, "click", "CLICK_INVALID"]);

                // then
                expect(core.registerBrowserEvent).not.toHaveBeenCalled();
            });
        });

        describe("NAVIGATE_TOOLBAR", () => {
            beforeEach(() => {
                core.run();
            });

            it("이벤트가 발생한 엘리먼트가 마지막 아이템이고 TAB 키가 눌려졌다면 이벤트를 중단하고 첫번째 아이템으로 포커스를 이동한다.", () => {
                // given
                const weEvent = {
                    element: plugin.elLastToolbarItem,
                    key: jest.fn(() => { 
                        return { keyCode: 9 };
                    }),
                    stopDefault: jest.fn()
                };
                jest.spyOn(plugin.elFirstToolbarItem, "focus");

                // when
                plugin.oApp.exec("NAVIGATE_TOOLBAR", [weEvent]);

                // then
                expect(weEvent.stopDefault).toHaveBeenCalled();
                expect(plugin.elFirstToolbarItem.focus).toHaveBeenCalled();
            });

            it("이벤트가 발생한 엘리먼트가 마지막 아이템이지만 shift+TAB 키가 눌려졌다면 아무 동작하지 않는다.", () => {
                // given
                const weEvent = {
                    element: plugin.elLastToolbarItem,
                    key: jest.fn(() => { 
                        return { keyCode: 9, shift: true };
                    }),
                    stopDefault: jest.fn()
                };
                jest.spyOn(plugin.elFirstToolbarItem, "focus");

                // when
                plugin.oApp.exec("NAVIGATE_TOOLBAR", [weEvent]);

                // then
                expect(weEvent.stopDefault).not.toHaveBeenCalled();
                expect(plugin.elFirstToolbarItem.focus).not.toHaveBeenCalled();
            });

            it("이벤트가 발생한 엘리먼트가 첫번째 아이템이고 shift+TAB 키가 눌려졌다면 이벤트를 중단하고 마지막 아이템으로 포커스를 이동한다.", () => {
                // given
                const weEvent = {
                    element: plugin.elFirstToolbarItem,
                    key: jest.fn(() => { 
                        return { keyCode: 9, shift: true };
                    }),
                    stopDefault: jest.fn()
                };
                jest.spyOn(plugin.elLastToolbarItem, "focus");

                // when
                plugin.oApp.exec("NAVIGATE_TOOLBAR", [weEvent]);

                // then
                expect(weEvent.stopDefault).toHaveBeenCalled();
                expect(plugin.elLastToolbarItem.focus).toHaveBeenCalled();
            });

            it("이벤트가 발생한 엘리먼트가 첫번째 아이템이지만 TAB 키가 눌려졌다면 아무 동작하지 않는다.", () => {
                // given
                const weEvent = {
                    element: plugin.elFirstToolbarItem,
                    key: jest.fn(() => { 
                        return { keyCode: 9 };
                    }),
                    stopDefault: jest.fn()
                };
                jest.spyOn(plugin.elLastToolbarItem, "focus");

                // when
                plugin.oApp.exec("NAVIGATE_TOOLBAR", [weEvent]);

                // then
                expect(weEvent.stopDefault).not.toHaveBeenCalled();
                expect(plugin.elLastToolbarItem.focus).not.toHaveBeenCalled();
            });
        });

        describe("TOGGLE_TOOLBAR_ACTIVE_LAYER", () => {
            beforeEach(() => {
                core.run();
            });

            it("TOGGLE_ACTIVE_LAYER 메시지를 발행한다.", () => {
                // given
                jest.spyOn(core, "exec");
                const buttonName = "fontName";
                const elLayer = document.querySelector(`.husky_seditor_ui_${buttonName} .se2_layer`);
                const elBtn = plugin.getToolbarButtonByUIName(buttonName);
                const sOpenCmd = "";
                const aOpenArgs = [];
                const sCloseCmd = "";
                const aCloseArgs = [];
    
                // when
                plugin.oApp.exec("TOGGLE_TOOLBAR_ACTIVE_LAYER", [elLayer, elBtn, sOpenCmd, aOpenArgs, sCloseCmd, aCloseArgs]);
    
                // then
                expect(core.exec).toHaveBeenCalledWith("TOGGLE_ACTIVE_LAYER", [elLayer, "MSG_TOOLBAR_LAYER_SHOWN", [elLayer, elBtn, sOpenCmd, aOpenArgs], sCloseCmd, aCloseArgs]);
            });
        });

        describe("MSG_TOOLBAR_LAYER_SHOWN", () => {
            beforeEach(() => {
                core.run();
            });

            it("POSITION_TOOLBAR_LAYER 메시지를 발행한다.", () => {
                // given
                jest.spyOn(core, "exec");
                const buttonName = "fontName";
                const elLayer = document.querySelector(`.husky_seditor_ui_${buttonName} .se2_layer`);
                const elBtn = plugin.getToolbarButtonByUIName(buttonName);
    
                // when
                plugin.oApp.exec("MSG_TOOLBAR_LAYER_SHOWN", [elLayer, elBtn]);
    
                // then
                expect(core.exec).toHaveBeenCalledWith("POSITION_TOOLBAR_LAYER", [elLayer, elBtn]);
            });

            it("추가로 발행할 메시지를 전달할 수 있다.", () => {
                // given
                jest.spyOn(core, "exec");
                const buttonName = "fontName";
                const elLayer = document.querySelector(`.husky_seditor_ui_${buttonName} .se2_layer`);
                const elBtn = plugin.getToolbarButtonByUIName(buttonName);
                const sOpenCmd = "MSG_OPEN_CMD";
                const aOpenArgs = [];
    
                // when
                plugin.oApp.exec("MSG_TOOLBAR_LAYER_SHOWN", [elLayer, elBtn, sOpenCmd, aOpenArgs]);
    
                // then
                expect(core.exec).toHaveBeenCalledWith(sOpenCmd, aOpenArgs);
            });
        });

        describe("SHOW_TOOLBAR_ACTIVE_LAYER", () => {
            beforeEach(() => {
                core.run();
            });

            it("SHOW_ACTIVE_LAYER 메시지를 발행한다.", () => {
                // given
                jest.spyOn(core, "exec");
                const buttonName = "fontName";
                const elLayer = document.querySelector(`.husky_seditor_ui_${buttonName} .se2_layer`);
                const elBtn = plugin.getToolbarButtonByUIName(buttonName);
                const sCmd = "MSG_CMD";
                const aArgs = [];

                // when
                plugin.oApp.exec("SHOW_TOOLBAR_ACTIVE_LAYER", [elLayer, sCmd, aArgs, elBtn]);
    
                // then
                expect(core.exec).toHaveBeenCalledWith("SHOW_ACTIVE_LAYER", [elLayer, sCmd, aArgs]);
            });

            it("POSITION_TOOLBAR_LAYER 메시지를 발행한다.", () => {
                // given
                jest.spyOn(core, "exec");
                const buttonName = "fontName";
                const elLayer = document.querySelector(`.husky_seditor_ui_${buttonName} .se2_layer`);
                const elBtn = plugin.getToolbarButtonByUIName(buttonName);
                const sCmd = "MSG_CMD";
                const aArgs = [];

                // when
                plugin.oApp.exec("SHOW_TOOLBAR_ACTIVE_LAYER", [elLayer, sCmd, aArgs, elBtn]);
    
                // then
                expect(core.exec).toHaveBeenCalledWith("POSITION_TOOLBAR_LAYER", [elLayer, elBtn]);
            });
        });

        describe("DISABLE_UI", () => {
            beforeEach(() => {
                core.run();
            });

            it("버튼을 비활성화할 수 있다.", () => {
                // given
                const buttonName = "fontName";
    
                // when
                plugin.oApp.exec("DISABLE_UI", [buttonName]);
                const button = plugin.getToolbarButtonByUIName(buttonName);
    
                // then
                expect(button.disabled).toBe(true);
            });

            it("여러버튼을 동시에 비활성화할 수 있다.", () => {
                // given
                const buttonNames = ["fontName", "fontSize"];
    
                // when
                plugin.oApp.exec("DISABLE_UI", [buttonNames]);
                const button1 = plugin.getToolbarButtonByUIName(buttonNames[0]);
                const button2 = plugin.getToolbarButtonByUIName(buttonNames[1]);
    
                // then
                expect(button1.disabled).toBe(true);
                expect(button2.disabled).toBe(true);
            });

            it("버튼을 비활성화될때 해당버튼 이벤트로 등록된 메시지가 있으면 비활성화된다.", () => {
                // given
                const buttonName = "fontName";
                plugin.oApp.exec("REGISTER_UI_EVENT", [buttonName, "click", "CLICK_FONT_NAME"]);
                jest.spyOn(core, "disableMessage");

                // when
                plugin.oApp.exec("DISABLE_UI", [buttonName]);

                // then
                expect(core.disableMessage).toHaveBeenLastCalledWith("CLICK_FONT_NAME", true);
            });
        });

        describe("ENABLE_UI", () => {
            beforeEach(() => {
                core.run();
            });

            it("비활성화된 버튼을 다시 활성화할 수 있다.", () => {
                // given
                const buttonName = "fontName";
                plugin.oApp.exec("DISABLE_UI", [buttonName]);

                // when
                plugin.oApp.exec("ENABLE_UI", [buttonName]);
                const button = plugin.getToolbarButtonByUIName(buttonName);
    
                // then
                expect(button.disabled).toBe(false);
            });

            it("버튼을 활성화될때 해당버튼 이벤트로 등록된 메시지가 있으면 활성화된다.", () => {
                // given
                const buttonName = "fontName";
                plugin.oApp.exec("REGISTER_UI_EVENT", [buttonName, "click", "CLICK_FONT_NAME"]);
                plugin.oApp.exec("DISABLE_UI", [buttonName]);
                jest.spyOn(core, "disableMessage");

                // when
                plugin.oApp.exec("ENABLE_UI", [buttonName]);

                // then
                expect(core.disableMessage).toHaveBeenLastCalledWith("CLICK_FONT_NAME", false);
            });

            it("인스턴스 생성시 비활성화된 버튼은 활성화되지 않는다.", () => {
                // given
                const buttonName = "fontName";
                const option = {
                    aDisabled: [buttonName]
                };
                core = new nhn.husky.HuskyCore();
                core.registerPlugin(new nhn.husky.CorePlugin());
                core.registerPlugin((plugin = new nhn.husky.SE2M_Toolbar(document.body, option)));
                core.run();

                // when
                plugin.oApp.exec("ENABLE_UI", [buttonName]);
                const button = plugin.getToolbarButtonByUIName(buttonName);

                // then
                expect(button.disabled).toBe(true);
            });
        });

        describe("SELECT_UI", () => {
            beforeEach(() => {
                core.run();
            });

            it("해당버튼 UI에 선택상태 css 클래스를 추가한다.", () => {
                // given
                const buttonName = "fontName";

                // when
                plugin.oApp.exec("SELECT_UI", [buttonName]);
                const wrapper = document.querySelector(`.husky_seditor_ui_${buttonName}`);
    
                // then
                expect(wrapper.classList.contains("active")).toBe(true);
            });

            it("해당버튼이 없으면 이후 동작을 수행하지 않는다.", () => {
                // given
                const buttonName = "fontName";
                plugin.htWrappedUIList[buttonName] = null;

                // when
                plugin.oApp.exec("SELECT_UI", [buttonName]);
                const wrapper = document.querySelector(`.husky_seditor_ui_${buttonName}`);
    
                // then
                expect(wrapper.classList.contains("active")).toBe(false);
            });
        });

        describe("DESELECT_UI", () => {
            beforeEach(() => {
                core.run();
            });

            it("해당버튼 UI에 선택상태 css 클래스를 제거한다.", () => {
                // given
                const buttonName = "fontName";
                plugin.oApp.exec("SELECT_UI", [buttonName]);

                // when
                plugin.oApp.exec("DESELECT_UI", [buttonName]);
                const wrapper = document.querySelector(`.husky_seditor_ui_${buttonName}`);
    
                // then
                expect(wrapper.classList.contains("active")).toBe(false);
            });

            it("해당버튼이 없으면 이후 동작을 수행하지 않는다.", () => {
                // given
                const buttonName = "fontName";
                plugin.oApp.exec("SELECT_UI", [buttonName]);
                plugin.htWrappedUIList[buttonName] = null;

                // when
                plugin.oApp.exec("DESELECT_UI", [buttonName]);
                const wrapper = document.querySelector(`.husky_seditor_ui_${buttonName}`);

                // then
                expect(wrapper.classList.contains("active")).toBe(true);
            });
        });

        describe("TOGGLE_UI_SELECTED", () => {
            beforeEach(() => {
                core.run();
            });

            it("해당버튼 UI에 선택상태 css 클래스가 없으면 추가한다.", () => {
                // given
                const buttonName = "fontName";
                const wrapper = document.querySelector(`.husky_seditor_ui_${buttonName}`);
                wrapper.classList.remove("active");

                // when
                plugin.oApp.exec("TOGGLE_UI_SELECTED", [buttonName]);
    
                // then
                expect(wrapper.classList.contains("active")).toBe(true);
            });

            it("해당버튼 UI에 선택상태 css 클래스가 있으면 제거한다.", () => {
                // given
                const buttonName = "fontName";
                const wrapper = document.querySelector(`.husky_seditor_ui_${buttonName}`);
                wrapper.classList.add("active");

                // when
                plugin.oApp.exec("TOGGLE_UI_SELECTED", [buttonName]);
    
                // then
                expect(wrapper.classList.contains("active")).toBe(false);
            });

            it("해당버튼이 없으면 이후 동작을 수행하지 않는다.", () => {
                // given
                const buttonName = "fontName";
                const wrapper = document.querySelector(`.husky_seditor_ui_${buttonName}`);
                wrapper.classList.add("active");
                plugin.htWrappedUIList[buttonName] = null;

                // when
                plugin.oApp.exec("TOGGLE_UI_SELECTED", [buttonName]);

                // then
                expect(wrapper.classList.contains("active")).toBe(true);
            });
        });

        describe("DISABLE_ALL_UI", () => {
            beforeEach(() => {
                core.run();
            });

            it("모든버튼을 비활성화할 수 있다.", () => {
                // given
                jest.spyOn(plugin, "_disableUI");
                const {length} = Object.keys(plugin.htUIList);

                // when
                plugin.oApp.exec("DISABLE_ALL_UI");
    
                // then
                expect(plugin._disableUI).toHaveBeenCalledTimes(length);
            });

            it("모든버튼이 비활성화되면 상태값은 2가 된다.", () => {
                // given

                // when
                plugin.oApp.exec("DISABLE_ALL_UI");
    
                // then
                expect(plugin.nUIStatus).toBe(2);
            });

            it("이미 상태값이 2이면 이후로직을 수행하지 않는다.", () => {
                // given
                jest.spyOn(plugin, "_disableUI");
                plugin.nUIStatus = 2;

                // when
                plugin.oApp.exec("DISABLE_ALL_UI");
    
                // then
                expect(plugin._disableUI).not.toHaveBeenCalled();
            });

            it("HIDE_ACTIVE_LAYER 메시지를 전송하여 열려있는 레이어를 닫는다.", () => {
                // given
                jest.spyOn(core, "exec");

                // when
                plugin.oApp.exec("DISABLE_ALL_UI");
    
                // then
                expect(core.exec).toHaveBeenCalledWith("HIDE_ACTIVE_LAYER");
            });

            it("옵션값을 통해 비활성화를 제외할 버튼을 지정할 수 있다.", () => {
                // given
                jest.spyOn(plugin, "_disableUI");
                const {length} = Object.keys(plugin.htUIList);

                // when
                const option = {
                    aExceptions: ["fontName"]
                };
                plugin.oApp.exec("DISABLE_ALL_UI", [option]);

                // then
                expect(plugin._disableUI).toHaveBeenCalledTimes(length - 1);
            });

            it("옵션값을 통해 HIDE_ACTIVE_LAYER 메시지를 발행하지 않을 수 있다.", () => {
                // given
                jest.spyOn(core, "exec");

                // when
                const option = {
                    bLeaveActiveLayer: true
                };
                plugin.oApp.exec("DISABLE_ALL_UI", [option]);

                // then
                expect(core.exec).not.toHaveBeenCalledWith("HIDE_ACTIVE_LAYER");
            });
        });

        describe("ENABLE_ALL_UI", () => {
            beforeEach(() => {
                core.run();
                plugin.oApp.exec("DISABLE_ALL_UI");
            });

            it("모든버튼을 활성화할 수 있다.", () => {
                // given
                jest.spyOn(plugin, "_enableUI");
                const {length} = Object.keys(plugin.htUIList);

                // when
                plugin.oApp.exec("ENABLE_ALL_UI");
    
                // then
                expect(plugin._enableUI).toHaveBeenCalledTimes(length);
            });

            it("모든버튼이 활성화되면 상태값은 1이 된다.", () => {
                // given

                // when
                plugin.oApp.exec("ENABLE_ALL_UI");
    
                // then
                expect(plugin.nUIStatus).toBe(1);
            });

            it("이미 상태값이 1이면 이후로직을 수행하지 않는다.", () => {
                // given
                jest.spyOn(plugin, "_enableUI");
                plugin.nUIStatus = 1;

                // when
                plugin.oApp.exec("ENABLE_ALL_UI");
    
                // then
                expect(plugin._enableUI).not.toHaveBeenCalled();
            });

            it("옵션값을 통해 활성화를 제외할 버튼을 지정할 수 있다.", () => {
                // given
                jest.spyOn(plugin, "_enableUI");
                const {length} = Object.keys(plugin.htUIList);

                // when
                const option = {
                    aExceptions: ["fontName"]
                };
                plugin.oApp.exec("ENABLE_ALL_UI", [option]);

                // then
                expect(plugin._enableUI).toHaveBeenCalledTimes(length - 1);
            });
        });

        describe("MSG_STYLE_CHANGED", () => {
            beforeEach(() => {
                core.run();
            });

            it("전달받은 속성값이 특정표식(@^)이라면 해당 속성버튼을 선택상태로 바꾼다.", () => {
                // given
                jest.spyOn(plugin, "$ON_SELECT_UI");
                const attrName = "bold";
                const attrValue = "@^";

                // when
                plugin.oApp.exec("MSG_STYLE_CHANGED", [attrName, attrValue]);
    
                // then
                expect(plugin.$ON_SELECT_UI).toHaveBeenCalledWith(attrName);
            });

            it("전달받은 속성값이 특정표식(@^)이 아니라면 해당 속성버튼을 선택해제상태로 바꾼다.", () => {
                // given
                jest.spyOn(plugin, "$ON_DESELECT_UI");
                const attrName = "bold";
                const attrValue = "@-";

                // when
                plugin.oApp.exec("MSG_STYLE_CHANGED", [attrName, attrValue]);
    
                // then
                expect(plugin.$ON_DESELECT_UI).toHaveBeenCalledWith(attrName);
            });
        });

        describe("POSITION_TOOLBAR_LAYER", () => {
            beforeEach(() => {
                core.run();
            });

            it("레이어의 위치가 조정된다.", () => {
                // given
                const buttonName = "fontName";
                const elLayer = document.querySelector(`.husky_seditor_ui_${buttonName} .se2_layer`);

                // when
                plugin.oApp.exec("POSITION_TOOLBAR_LAYER", [elLayer]);

                // then
                expect(elLayer.style.left).toBe("0px");
            });

            it("레이어의 오른쪽 위치가 툴바 오른쪽 위치를 벗어나면 툴바 안쪽으로 조정된다.", () => {
                // given
                const buttonName = "fontName";
                const elLayer = document.querySelector(`.husky_seditor_ui_${buttonName} .se2_layer`);
                jest.spyOn(plugin.toolbarArea, "offsetWidth", "get").mockReturnValue("100");
                jest.spyOn(elLayer, "offsetWidth", "get").mockReturnValue("102");

                // when
                plugin.oApp.exec("POSITION_TOOLBAR_LAYER", [elLayer]);

                // then
                expect(elLayer.style.left).toBe("-1px");
            });

            it("레이어의 왼쪽 위치가 툴바 왼쪽 위치를 벗어나면 툴바 안쪽으로 조정된다.", () => {
                // given
                const buttonName = "fontName";
                const elLayer = document.querySelector(`.husky_seditor_ui_${buttonName} .se2_layer`);
                jest.spyOn(plugin.welToolbarArea, "offset").mockImplementation(() => { return {left: 20}; });

                // when
                plugin.oApp.exec("POSITION_TOOLBAR_LAYER", [elLayer]);

                // then
                expect(elLayer.style.left).toBe("19px");
            });

            it("레이어의 기준위치를 오른쪽으로 지정할 수 있다.", () => {
                // given
                const buttonName = "fontName";
                const elLayer = document.querySelector(`.husky_seditor_ui_${buttonName} .se2_layer`);
                const option = {
                    sAlign: "right"
                };

                // when
                plugin.oApp.exec("POSITION_TOOLBAR_LAYER", [elLayer, option]);

                // then
                expect(elLayer.style.left).toBe("");
                expect(elLayer.style.right).toBe("0px");
            });

            it("레이어의 기준위치를 오른쪽으로 지정한 경우도 레이어의 오른쪽 위치가 툴바 오른쪽 위치를 벗어나면 툴바 안쪽으로 조정된다.", () => {
                // given
                const buttonName = "fontName";
                const elLayer = document.querySelector(`.husky_seditor_ui_${buttonName} .se2_layer`);
                jest.spyOn(plugin.toolbarArea, "offsetWidth", "get").mockReturnValue("100");
                jest.spyOn(elLayer, "offsetWidth", "get").mockReturnValue("102");
                const option = {
                    sAlign: "right"
                };

                // when
                plugin.oApp.exec("POSITION_TOOLBAR_LAYER", [elLayer, option]);

                // then
                expect(elLayer.style.right).toBe("1px");
            });

            it("레이어의 기준위치를 오른쪽으로 지정한 경우도 레이어의 왼쪽 위치가 툴바 왼쪽 위치를 벗어나면 툴바 안쪽으로 조정된다.", () => {
                // given
                const buttonName = "fontName";
                const elLayer = document.querySelector(`.husky_seditor_ui_${buttonName} .se2_layer`);
                jest.spyOn(plugin.welToolbarArea, "offset").mockImplementation(() => { return {left: 20}; });
                const option = {
                    sAlign: "right"
                };

                // when
                plugin.oApp.exec("POSITION_TOOLBAR_LAYER", [elLayer, option]);

                // then
                expect(elLayer.style.right).toBe("-19px");
            });

            it("지정된 버튼이 있으면 해당 버튼과 형제레벨로 레이어를 재위치시킨다.", () => {
                // given
                const buttonName = "fontName";
                const elLayer = document.querySelector(`.husky_seditor_ui_${buttonName} .se2_layer`);
                const elBtn = plugin.getToolbarButtonByUIName(buttonName);
                const option = {
                    elBtn
                };

                // when
                plugin.oApp.exec("POSITION_TOOLBAR_LAYER", [elLayer, option]);

                // then
                expect(elLayer.parentNode).toEqual(elBtn.parentNode);
            });
        });

        describe("EVENT_TOOLBAR_MOUSEOVER", () => {
            beforeEach(() => {
                core.run();
            });

            it("버튼에 마우스오버이벤트가 발생하면 부모LI요소에 hover 클래스가 추가된다.", () => {
                // given
                const buttonName = "fontName";
                const button = plugin.getToolbarButtonByUIName(buttonName);
                const parent = button.parentNode;
                parent.classList.remove("hover");
                const weEvent = {
                    element: button
                };

                // when
                plugin.oApp.exec("EVENT_TOOLBAR_MOUSEOVER", [weEvent]);
    
                // then
                expect(parent.tagName).toBe("LI");
                expect(parent.classList.contains("hover")).toBe(true);
            });

            it("버튼안쪽 요소에서 마우스오버이벤트가 발생해도 hover 클래스가 추가된다.", () => {
                // given
                const buttonName = "fontName";
                const button = plugin.getToolbarButtonByUIName(buttonName);
                const parent = button.parentNode;
                parent.classList.remove("hover");
                const weEvent = {
                    element: button.firstChild
                };

                // when
                plugin.oApp.exec("EVENT_TOOLBAR_MOUSEOVER", [weEvent]);
    
                // then
                expect(parent.tagName).toBe("LI");
                expect(parent.classList.contains("hover")).toBe(true);
            });

            it("부모요소에서 마우스오버이벤트가 발생하면 hover 클래스가 추가되지 않는다.", () => {
                // given
                const buttonName = "fontName";
                const button = plugin.getToolbarButtonByUIName(buttonName);
                const parent = button.parentNode;
                parent.classList.remove("hover");
                const weEvent = {
                    element: parent
                };

                // when
                plugin.oApp.exec("EVENT_TOOLBAR_MOUSEOVER", [weEvent]);
    
                // then
                expect(parent.tagName).toBe("LI");
                expect(parent.classList.contains("hover")).toBe(false);
            });

            it("부모요소가 LI 가 아닌 경우 hover 클래스가 추가되지 않는다.", () => {
                // given
                const button = document.querySelector(".husky_seditor_ui_hyperlink BUTTON.se2_apply");
                const parent = button.parentNode;
                parent.classList.remove("hover");
                const weEvent = {
                    element: button
                };

                // when
                plugin.oApp.exec("EVENT_TOOLBAR_MOUSEOVER", [weEvent]);

                // then
                expect(parent.tagName).not.toBe("LI");
                expect(parent.classList.contains("hover")).toBe(false);
            });

            it("복합버튼일 경우는 부모요소와 상위LI요소 모두 hover 클래스가 추가된다.", () => {
                // given
                const buttonName = "fontColor";
                const button = plugin.getToolbarButtonByUIName(buttonName);
                const parent = button.parentNode;
                parent.classList.remove("hover");
                const li = button.closest("li");
                li.classList.remove("hover");
                const weEvent = {
                    element: button
                };

                // when
                plugin.oApp.exec("EVENT_TOOLBAR_MOUSEOVER", [weEvent]);
    
                // then
                expect(parent).not.toEqual(li);
                expect(parent.tagName).not.toBe("LI");
                expect(parent.classList.contains("hover")).toBe(true);
                expect(li.classList.contains("hover")).toBe(true);
            });

            it("대상요소에 active 클래스가 있으면 hover 클래스가 추가되지 않는다.", () => {
                // given
                const buttonName = "fontName";
                const button = plugin.getToolbarButtonByUIName(buttonName);
                const parent = button.parentNode;
                parent.classList.remove("hover");
                const weEvent = {
                    element: button
                };

                // when
                parent.classList.add("active");
                plugin.oApp.exec("EVENT_TOOLBAR_MOUSEOVER", [weEvent]);
    
                // then
                expect(parent.tagName).toBe("LI");
                expect(parent.classList.contains("hover")).toBe(false);
            });

            it("전체비활성화 상태라면 이후로직을 수행하지 않는다.", () => {
                // given
                const buttonName = "fontName";
                const button = plugin.getToolbarButtonByUIName(buttonName);
                const parent = button.parentNode;
                parent.classList.remove("hover");
                const weEvent = {
                    element: button
                };

                // when
                plugin.nUIStatus = 2;
                plugin.oApp.exec("EVENT_TOOLBAR_MOUSEOVER", [weEvent]);

                // then
                expect(parent.tagName).toBe("LI");
                expect(parent.classList.contains("hover")).toBe(false);
            });
        });

        describe("EVENT_TOOLBAR_MOUSEOUT", () => {
            beforeEach(() => {
                core.run();
            });

            it("버튼에 마우스아웃이벤트가 발생하면 부모LI요소에 hover 클래스가 제거된다.", () => {
                // given
                const buttonName = "fontName";
                const button = plugin.getToolbarButtonByUIName(buttonName);
                const parent = button.parentNode;
                parent.classList.add("hover");
                const weEvent = {
                    element: button
                };

                // when
                plugin.oApp.exec("EVENT_TOOLBAR_MOUSEOUT", [weEvent]);
    
                // then
                expect(parent.tagName).toBe("LI");
                expect(parent.classList.contains("hover")).toBe(false);
            });

            it("버튼안쪽 요소에서 마우스아웃이벤트가 발생해도 hover 클래스가 제거된다.", () => {
                // given
                const buttonName = "fontName";
                const button = plugin.getToolbarButtonByUIName(buttonName);
                const parent = button.parentNode;
                parent.classList.add("hover");
                const weEvent = {
                    element: button.firstChild
                };

                // when
                plugin.oApp.exec("EVENT_TOOLBAR_MOUSEOUT", [weEvent]);

                // then
                expect(parent.tagName).toBe("LI");
                expect(parent.classList.contains("hover")).toBe(false);
            });

            it("부모요소에서 마우스아웃이벤트가 발생하면 hover 클래스가 제거되지 않는다.", () => {
                // given
                const buttonName = "fontName";
                const button = plugin.getToolbarButtonByUIName(buttonName);
                const parent = button.parentNode;
                parent.classList.add("hover");
                const weEvent = {
                    element: parent
                };

                // when
                plugin.oApp.exec("EVENT_TOOLBAR_MOUSEOUT", [weEvent]);

                // then
                expect(parent.tagName).toBe("LI");
                expect(parent.classList.contains("hover")).toBe(true);
            });

            it("복합버튼일 경우는 부모요소와 상위LI요소 모두 hover 클래스가 제거된다.", () => {
                // given
                const buttonName = "fontColor";
                const button = plugin.getToolbarButtonByUIName(buttonName);
                const parent = button.parentNode;
                parent.classList.add("hover");
                const li = button.closest("li");
                li.classList.add("hover");
                const weEvent = {
                    element: button
                };

                // when
                plugin.oApp.exec("EVENT_TOOLBAR_MOUSEOUT", [weEvent]);

                // then
                expect(parent).not.toEqual(li);
                expect(parent.tagName).not.toBe("LI");
                expect(parent.classList.contains("hover")).toBe(false);
                expect(li.classList.contains("hover")).toBe(false);
            });

            it("전체비활성화 상태라면 이후로직을 수행하지 않는다.", () => {
                // given
                const buttonName = "fontName";
                const button = plugin.getToolbarButtonByUIName(buttonName);
                const parent = button.parentNode;
                parent.classList.add("hover");
                const weEvent = {
                    element: button
                };

                // when
                plugin.nUIStatus = 2;
                plugin.oApp.exec("EVENT_TOOLBAR_MOUSEOUT", [weEvent]);

                // then
                expect(parent.tagName).toBe("LI");
                expect(parent.classList.contains("hover")).toBe(true);
            });
        });

        describe("EVENT_TOOLBAR_MOUSEDOWN", () => {
            beforeEach(() => {
                core.run();
            });

            it("버튼에 마우스다운이벤트가 발생하면 HIDE_ACTIVE_LAYER_IF_NOT_CHILD 메시지를 발행한다.", () => {
                // given
                jest.spyOn(core, "exec");
                const buttonName = "fontName";
                const button = plugin.getToolbarButtonByUIName(buttonName);
                const weEvent = {
                    element: button
                };

                // when
                plugin.oApp.exec("EVENT_TOOLBAR_MOUSEDOWN", [weEvent]);
    
                // then
                expect(core.exec).toHaveBeenCalledWith("HIDE_ACTIVE_LAYER_IF_NOT_CHILD", [button]);
            });

            it("해당버튼이 선택상태이고 서브레이어를 갖고 있으면 HIDE_ACTIVE_LAYER_IF_NOT_CHILD 메시지를 발행하지 않는다.", () => {
                // given
                jest.spyOn(core, "exec");
                const buttonName = "fontColor";
                const button = plugin.getToolbarButtonByUIName(buttonName);
                const wrapper = document.querySelector(`.husky_seditor_ui_${buttonName}`);
                wrapper.classList.add("active");
                const weEvent = {
                    element: button
                };

                // when
                plugin.oApp.exec("EVENT_TOOLBAR_MOUSEDOWN", [weEvent]);
    
                // then
                expect(core.exec).not.toHaveBeenCalledWith("HIDE_ACTIVE_LAYER_IF_NOT_CHILD", [button]);
            });

            it("해당버튼이 선택상태라도 서브레이어를 갖고 있지 않으면 HIDE_ACTIVE_LAYER_IF_NOT_CHILD 메시지를 발행한다.", () => {
                // given
                jest.spyOn(core, "exec");
                const buttonName = "bold";
                const button = plugin.getToolbarButtonByUIName(buttonName);
                const wrapper = document.querySelector(`.husky_seditor_ui_${buttonName}`);
                wrapper.classList.add("active");
                const weEvent = {
                    element: button
                };

                // when
                plugin.oApp.exec("EVENT_TOOLBAR_MOUSEDOWN", [weEvent]);
    
                // then
                expect(core.exec).toHaveBeenCalledWith("HIDE_ACTIVE_LAYER_IF_NOT_CHILD", [button]);
            });
        });

        describe("ALERT", () => {
            beforeEach(() => {
                core.run();
            });

            it("얼럿 레이어를 노출시킨다.", () => {
                // given
                const alertLayer = plugin._elAlertLayer;
                const alertTxts = plugin._elAlertTxts;
                const sMsgHTML = "얼럿메시지";
                const option = {};

                // when
                plugin.oApp.exec("ALERT", [sMsgHTML, option]);
    
                // then
                expect(alertTxts.innerHTML).toBe(sMsgHTML);
                expect(alertLayer.style.display).toBe("block");
            });

            it("SHOW_EDITING_AREA_COVER 메시지를 발행한다.", () => {
                // given
                jest.spyOn(core, "exec");

                // when
                plugin.oApp.exec("ALERT");
    
                // then
                expect(core.exec).toHaveBeenCalledWith("SHOW_EDITING_AREA_COVER", [true]);
            });

            it("확인버튼을 클릭하면 얼럿 레이어가 닫히고 HIDE_EDITING_AREA_COVER 메시지를 발행한다.", () => {
                // given
                const alertLayer = plugin._elAlertLayer;
                const alertOk = plugin._elAlertOk;
                plugin.oApp.exec("ALERT");
                jest.spyOn(core, "exec");

                // when
                simulateEvent(alertOk, "click");
    
                // then
                expect(core.exec).toHaveBeenCalledWith("HIDE_EDITING_AREA_COVER");
                expect(alertLayer.style.display).toBe("none");
            });

            it("확인버튼을 클릭하면 등록했던 콜백함수가 실행된다.", () => {
                // given
                const alertOk = plugin._elAlertOk;
                const sMsgHTML = "얼럿메시지";
                const option = {
                    fOkCallback: jest.fn()
                };
                plugin.oApp.exec("ALERT", [sMsgHTML, option]);

                // when
                simulateEvent(alertOk, "click");
    
                // then
                expect(option.fOkCallback).toHaveBeenCalled();
            });

            it("닫기버튼을 클릭하면 얼럿 레이어가 닫히고 HIDE_EDITING_AREA_COVER 메시지를 발행한다.", () => {
                // given
                const alertLayer = plugin._elAlertLayer;
                const alertClose = plugin._elAlertClose;
                plugin.oApp.exec("ALERT");
                jest.spyOn(core, "exec");

                // when
                simulateEvent(alertClose, "click");
    
                // then
                expect(core.exec).toHaveBeenCalledWith("HIDE_EDITING_AREA_COVER");
                expect(alertLayer.style.display).toBe("none");
            });

            it("닫기버튼을 클릭하면 등록했던 콜백함수가 실행된다.", () => {
                // given
                const alertClose = plugin._elAlertClose;
                const sMsgHTML = "얼럿메시지";
                const option = {
                    fCloseCallback: jest.fn()
                };
                plugin.oApp.exec("ALERT", [sMsgHTML, option]);

                // when
                simulateEvent(alertClose, "click");

                // then
                expect(option.fCloseCallback).toHaveBeenCalled();
            });

            it("취소버튼은 콜백함수를 등록하지 않으면 노출되지 않는다.", () => {
                // given
                const alertCancel = plugin._elAlertCancel;
                const sMsgHTML = "얼럿메시지";
                const option = {};

                // when
                plugin.oApp.exec("ALERT", [sMsgHTML, option]);

                // then
                expect(alertCancel.style.display).toBe("none");
            });

            it("취소버튼은 콜백함수를 등록하면 노출된다.", () => {
                // given
                const alertCancel = plugin._elAlertCancel;
                const sMsgHTML = "얼럿메시지";
                const option = {
                    fCancelCallback: jest.fn()
                };

                // when
                plugin.oApp.exec("ALERT", [sMsgHTML, option]);

                // then
                expect(alertCancel.style.display).toBe("");
            });

            it("취소버튼을 클릭하면 얼럿 레이어가 닫히고 HIDE_EDITING_AREA_COVER 메시지를 발행한다.", () => {
                // given
                const alertLayer = plugin._elAlertLayer;
                const alertCancel = plugin._elAlertCancel;
                const sMsgHTML = "얼럿메시지";
                const option = {
                    fCancelCallback: jest.fn()
                };
                plugin.oApp.exec("ALERT", [sMsgHTML, option]);
                jest.spyOn(core, "exec");

                // when
                simulateEvent(alertCancel, "click");

                // then
                expect(core.exec).toHaveBeenCalledWith("HIDE_EDITING_AREA_COVER");
                expect(alertLayer.style.display).toBe("none");
            });

            it("취소버튼을 클릭하면 등록했던 콜백함수가 실행된다.", () => {
                // given
                const alertCancel = plugin._elAlertCancel;
                const sMsgHTML = "얼럿메시지";
                const option = {
                    fCancelCallback: jest.fn()
                };
                plugin.oApp.exec("ALERT", [sMsgHTML, option]);

                // when
                simulateEvent(alertCancel, "click");

                // then
                expect(option.fCancelCallback).toHaveBeenCalled();
            });

            it("얼럿 레이어가 없으면 동작하지 않는다.", () => {
                // given
                jest.spyOn(core, "exec");
                plugin._elAlertLayer = null;
                const alertTxts = plugin._elAlertTxts;
                const sMsgHTML = "얼럿메시지";
                const option = {};

                // when
                plugin.oApp.exec("ALERT", [sMsgHTML, option]);

                // then
                expect(alertTxts.innerHTML).not.toBe(sMsgHTML);
                expect(core.exec).not.toHaveBeenCalledWith("SHOW_EDITING_AREA_COVER", [true]);
            });
        });
    });
});