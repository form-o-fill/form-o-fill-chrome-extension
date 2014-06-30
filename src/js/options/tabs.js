/*global Logger, jQuery, Storage, Utils, infoMsg, Rules, editor */
jQuery(function () {

  // Save tab settings
  var saveTabsSetting = function() {
    var tabConfig = [];
    jQuery("#ruleeditor .tabs .tab").each(function () {
      if (typeof this.dataset.tabId !== "undefined") {
        tabConfig.push({
          "id": this.dataset.tabId,
          "name": jQuery(this).find("input").val()
        });
      }
    });
    Storage.save(tabConfig, Utils.keys.tabs).then(function () {
      Utils.infoMsg("Tab setting saved");
      jQuery(this).removeClass("edit");
      jQuery(".tab.current input").attr("disabled", true);
      jQuery(".tab a.edit").removeClass("edit").addClass("cmd-tabs-close");
    });
  };

  // Load current tab settings
  var loadTabsSettings = function() {
    Storage.load(Utils.keys.tabs).then(function(tabSettings) {
      var tabs = jQuery();
      tabSettings.forEach(function (tabSetting, tabIndex) {
        tabs = tabs.add(
          jQuery('<li class="tab ' + (tabIndex === 0 ? "current" : "") + '" data-tab-id="' + (tabIndex + 1) + '"><input type="text" value="' + tabSetting.name + '" disabled /><a href="#" class="cmd-tabs-close"></a></li>')
        );
      });
      tabs = tabs.add(jQuery('<li class="tab"><input type="text" value="" disabled /><a href="#" class="cmd-tabs-open"></a></li>'));
      jQuery(".tabs").html(tabs);
    });
  };

  // Click on tab
  jQuery(document).on("click", ".tab", function (e) {
    e.preventDefault();
    var $current = jQuery(".tab.current");
    var $this = jQuery(this);
    if ($current.data("tab-id") == $this.data("tab-id")) {
      // enter edit mode
      $this.find("input").removeAttr("disabled").trigger("focus");
      $this.find("a").addClass("edit").removeClass("cmd-tabs-close");
    } else {
      // change current tab
      $current.removeClass("current");
      $this.addClass("current");
      Storage.load(Utils.keys.rules + "-tab-" + $this.data("tab-id")).then(function (ruleCode) {
        editor.setValue(ruleCode);
      });
    }
  });

  // Click on edit icon
  // Save tabs
  jQuery(".tabs").on("click", ".tab a.edit", function (e) {
    e.preventDefault();
    Logger.info("[tabs.js] Saving tab setting");
    saveTabsSetting();
  });

  // Close a tab
  jQuery(".tabs").on("click", ".tab a.cmd-tabs-close", function (e) {
    e.preventDefault();
    Logger.info("[tabs.js] removing tab");
    var toBeRemoved = jQuery(this).parent("li");
    toBeRemoved.remove();
    saveTabsSetting();
    Storage.load(Utils.keys.rules + "-tab-1").then(function (ruleCode) {
      editor.setValue(ruleCode);
    });
  });

  loadTabsSettings();

});
