var madge = require("madge");

var DetectDeps = {
  detect: function() {
    // This will find and output circular dependencies in the source code
    var dependencyObject = madge(['./src/js/background', './src/js/global', './src/js/content', './src/js/popup', './src/js/debug'], { format: "es6"});
    var circularDeps = dependencyObject.circular().getArray();
    if(circularDeps.length > 0) {
      console.error("******************************************************************************************************************");
      console.error("Found circular dependencies. This can lead to weird behaviour in webpack builds using ES2015 modules. Remove them!");
      circularDeps.forEach(function(dep, index) {
        console.error("#" + (index + 1) + ": " + dep[0] + " <-> " + dep[1]);
      });
      dependencyObject.image({}, function(image) {
        require("fs").writeFile("dependency-graph.png", image);
      });
      console.error("Exported a dependency graph to dependency-graph.png");
      console.error("******************************************************************************************************************");
      process.exit(127);
    }
  }
};

module.exports = DetectDeps;

