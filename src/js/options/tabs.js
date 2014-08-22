/*global Logger, jQuery, Storage, Utils, Rules, editor, saveRules */

// returns the jQuery wrapped DOM representation of a tab
var jTab = function(tabIndex, name, isCurrent) {
  return jQuery('<li class="tab' + (isCurrent ? " current" : "") + '" data-tab-id="' + tabIndex + '"><input type="text" value="' + name + '" disabled /><a href="#" class="cmd-tabs-close"></a></li>');
};

// maximal tab count including (+)-tab
var maxTabs = 7;

// Save tab settings
var saveTabsSetting = function() {
  Logger.info("[tabs.js] Saving tab setting");
  var tabConfig = [];
  jQuery("#ruleeditor .tabs .tab").each(function () {
    // Exclude pseudo ab "more" at the end
    if (typeof this.dataset.tabId !== "undefined") {
      tabConfig.push({
        "id": this.dataset.tabId,
        "name": jQuery(this).find("input").val()
      });
    }
  });
  Storage.save(tabConfig, Utils.keys.tabs).then(function () {
    jQuery(this).removeClass("edit");
    jQuery(".tab.current input").attr("disabled", true);
    jQuery(".tab a.edit").removeClass("edit").addClass("cmd-tabs-close");
    Utils.infoMsg("Tab setting saved");
  });
};

// Load current tab settings
var loadTabsSettings = function() {
  Logger.info("[tabs.js] Loading tab setting");

  var activeTabId = jQuery(".tab.current").data("tab-id");
  if(typeof activeTabId === "undefined") {
    activeTabId = 1;
  }
  activeTabId = activeTabId.toString();
  Logger.info("[tabs.js] Active Tab = " + activeTabId);

  Storage.load(Utils.keys.tabs).then(function(tabSettings) {
    var tabs = jQuery();
    if (typeof tabSettings !== "undefined") {
      if(tabSettings.length < activeTabId) {
        activeTabId = "1";
      }
      tabSettings.forEach(function (tabSetting) {
        tabs = tabs.add(jTab(tabSetting.id, tabSetting.name, (tabSetting.id.toString() === activeTabId)));
      });
    }
    // Add "more" tab
    tabs = tabs.add(jQuery('<li class="tab more"><input type="text" value="" disabled /><a href="#" class="cmd-tabs-open"></a></li>'));

    // Add tabs in one swoop
    jQuery(".tabs").html(tabs);
  });
};

jQuery(function () {
  // Click on tab
  jQuery(document).on("click", ".tab", function (e) {
    if(this.classList.contains("more")) {
      return;
    }
    e.preventDefault();
    var $current = jQuery(".tab.current");
    var $this = jQuery(this);
    if ($current.data("tab-id") == $this.data("tab-id")) {
      Logger.info("[tabs.js] Click on tab triggered EDIT mode");
      $this.find("input").removeAttr("disabled").trigger("focus");
      $this.find("a").addClass("edit").removeClass("cmd-tabs-close");
    } else {
      Logger.info("[tabs.js] Click on tab triggered change of current tab");
      jQuery(".tab").removeClass("current");
      $this.addClass("current");
      Storage.load(Utils.keys.rules + "-tab-" + $this.data("tab-id")).then(function (ruleData) {
        editor.setValue(ruleData.code);
      });
    }
  });

  // Click on disc icon saves tab settings
  jQuery(".tabs").on("click", ".tab a.edit", function (e) {
    e.preventDefault();
    Logger.info("[tabs.js] Saving tab setting");
    saveTabsSetting();
  });

  // Fancy key events
  jQuery(".tabs").on("keyup", function (e) {
    e.stopPropagation();
    if(e.which === 27) {
      Logger.info("[tabs.js] Edit mode canceled by pressing ESC");
      jQuery(".tab a.edit").removeClass("edit");
      loadTabsSettings();
    } else if(e.which == 13) {
      Logger.info("[tabs.js] Edit mode ended by pressing ENTER");
      jQuery(".tab a.edit").removeClass("edit");
      saveTabsSetting();
    }
  });

  // Close a tab
  jQuery(".tabs").on("click", ".tab a.cmd-tabs-close", function (e) {
    e.preventDefault();
    e.stopPropagation();

    var toBeRemoved = jQuery(this).parent("li");
    var tabId = toBeRemoved.data("tab-id");
    Logger.info("[tabs.js] removing tab #" + tabId);
    toBeRemoved.remove();
    jQuery(".tab[data-tab-id=" + (tabId - 1) + "]").trigger("click");
    Rules.delete(tabId);
    saveTabsSetting();
  });

  // Add a new tab
  jQuery(".tabs").on("click", "a.cmd-tabs-open", function (e) {
    if (jQuery(".tab").length === maxTabs) {
      Logger.info("[tabs.js] Max tab count reached");
      Utils.infoMsg("Maximum of open tabs reached");
      return;
    }
    Logger.info("[tabs.js] Opening a new tab");
    e.preventDefault();
    e.stopPropagation();

    var $insertAfterTab = jQuery(".tab[data-tab-id]:last");
    var nextTabId = $insertAfterTab.data("tab-id") + 1;
    var tab = jTab(nextTabId, chrome.i18n.getMessage("tabs_default_new_name"));
    jQuery(".tab").removeClass("current");
    tab.addClass("current");
    $insertAfterTab.after(tab);
    editor.setValue("var rules = [\n];\n");
    saveTabsSetting();
    saveRules(nextTabId);
  });

  loadTabsSettings();
});
