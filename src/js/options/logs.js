/*global jQuery, Utils, Logger */
var logsInterval;

// Displays the last 100 log entries
var displayLogs = function() {
  var showLastEntries = 100;
  var logTable = document.querySelector(".log-entries table");
  var logRow = document.querySelector("#logEntryTpl");
  var logCells = logRow.content.querySelectorAll("td");
  var logBody = logTable.querySelector("tbody");
  var clone;

  Logger.load().then(function (logEntries) {
    logTable.querySelector("tbody").textContent = "";
    logEntries.slice(showLastEntries * -1).reverse().forEach(function (logEntry) {
      logCells[0].textContent = logEntry.createdAt;
      logCells[1].textContent = logEntry.location;
      logCells[2].textContent = logEntry.message;
      clone = document.importNode(logRow.content, true);
      logBody.appendChild(clone);
    });
  });
};

// Download the logs as HTMl using a Blob
// https://developer.mozilla.org/en-US/docs/Web/API/Blob
var downloadLogs = function() {
  var logTable = document.querySelector(".log-entries table");
  var logsBlob = new Blob([logTable.outerHTML], { type: "text/html"});
  var url = window.URL.createObjectURL(logsBlob);

  var a = document.createElement("a");
  a.download = "form-o-fill-logs.html";
  a.classList.add("download");
  a.href = url;

  document.querySelector("body").appendChild(a);
  a.click();
};

var showModalDownload = function() {
  jQuery(".modal-download-logs").removeAttr("style");
};

// Events
jQuery(document).on("click", "a[href='#logs']", function (e) {
  // Install auto updating log entires table
  e.stopPropagation();
  e.preventDefault();
  logsInterval = setInterval(displayLogs, 500);
  displayLogs();
}).on("click", "a[href^=#]", function () {
  // clear auto updating log entries tble when clicking on
  // a link other than "#logs"
  if (!/#logs$/.test(this.href)) {
    clearInterval(logsInterval);
  }
}).on("click", "button.cmd-empty-logs", function () {
  // remove all localstorage log entries
  Logger.delete();
}).on("click", "button.cmd-download-logs", function () {
  // Open the overlay (download logs)
  showModalDownload();
}).on("click", ".overlay .close-button, .overlay .cmd-cancel-download", function () {
  // Close the overlay
  jQuery(this).parents(".overlay").hide();
}).on("click", ".overlay .cmd-download-logs-ok", function() {
  downloadLogs();
  jQuery(".overlay .cmd-cancel-download").trigger("click");
});
