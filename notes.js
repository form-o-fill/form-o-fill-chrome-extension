// How to add snippets to ace:
var snippetManager = ace.require("ace/snippets").snippetManager;
var snippets = snippetManager.parseSnippetFile("snippet test\n  TEST!");
snippets.push({
  content: "hello ${1:world}...!",
  name: "hello",
  tabTrigger: "h"
});
snippetManager.register(snippets, "javascript");

