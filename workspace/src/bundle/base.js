import "../common/base/hp_SE2M_Toolbar.js";
import "../fundamental/editing/hp_SE_EditingAreaManager.js";
import "../fundamental/editing/hp_SE_EditingArea_WYSIWYG.js";
import "../fundamental/editing/hp_SE_EditingArea_HTMLSrc.js";
import "../fundamental/editing/hp_SE_EditingArea_TEXT.js";
import "../fundamental/editing/hp_SE_EditingAreaVerticalResizer.js";
import "../fundamental/editing/hp_SE_WYSIWYGEnterKey.js";
import "../fundamental/editing/hp_SE2M_EditingModeChanger.js";
import "../fundamental/editing/hp_SE_PasteHandler.js";
import "../fundamental/base/hp_SE2M_ExecCommand.js";
import "../fundamental/base/hp_SE_WYSIWYGStyler.js";
import "../fundamental/base/hp_SE_WYSIWYGStyleGetter.js";
import "../fundamental/base/hp_SE2M_FontSizeWithLayerUI.js";
import "../fundamental/base/hp_SE2M_LineStyler.js";
import "../fundamental/base/hp_SE2M_LineHeightWithLayerUI.js";
import "../fundamental/base/hp_SE2M_ColorPalette.js";
import "../fundamental/base/hp_SE2M_FontColor.js";
import "../fundamental/base/hp_SE2M_BGColor.js";
import "../fundamental/base/hp_SE2M_Hyperlink.js";
import "../fundamental/base/hp_SE2M_FontNameWithLayerUI.js";
import "../fundamental/base/colorpicker.js";
import "../fundamental/base/hp_SE2M_Accessibility.js";
import "../fundamental/advanced/hp_SE2M_SCharacter.js";
import "../fundamental/advanced/hp_SE2M_FindReplacePlugin.js";
import "../fundamental/advanced/hp_SE2M_Quote.js";
import "../fundamental/advanced/hp_SE2M_TableCreator.js";
import "../fundamental/advanced/hp_SE2M_TableBlockStyler.js";
import "../fundamental/advanced/hp_SE2M_StyleRemover.js";
import "../fundamental/advanced/hp_SE2M_TableEditor.js";
import "../quick_editor/hp_SE2M_QuickEditor_Common.js";
import "../shortcut/shortcut.js";
import "../shortcut/hp_Hotkey.js";
import "../undo_redo/hp_SE_UndoRedo.js";
import "../util/hp_Utils.js";
import "../util/hp_DialogLayerManager.js";
import "../util/hp_ActiveLayerManager.js";
import "../util/hp_StringConverterManager.js";
import "../util/hp_MessageManager.js";
import "../util/hp_LazyLoader.js";
import "../util/hp_PopupManager.js";
import "../util/hp_SE2M_Utils.js";

window.nSE2Version = __VERSION__ + "." + __HASH__;
nhn.husky.SE_EditingAreaManager.version = {
    revision : __HASH__,
    type : "open",
    number : __VERSION__
};