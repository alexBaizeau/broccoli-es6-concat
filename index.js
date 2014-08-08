var transpiler = require('es6-module-transpiler');
var AMDFormatter = require('es6-module-transpiler-amd-formatter');
var Container = transpiler.Container;
var FileResolver = transpiler.FileResolver;

var recast = require('recast');

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var helpers = require('broccoli-kitchen-sink-helpers');
var Writer = require('broccoli-writer');

var jsStringEscape = require('js-string-escape');
var util = require('util');

module.exports = ES6Concat;

function ES6Concat(inputTree, options) {
  if (!(this instanceof ES6Concat)) {
    return new ES6Concat(inputTree, options);
  }

  options || (options = {});

  this.inputTree = inputTree;
  if ('wrapInEval' in options) {
    this.wrapInEval = options.wrapInEval;
  } else {
    this.wrapInEval = true;
  }
  this.inputFiles = options.inputFiles;
  this.outputFile = options.outputFile;
  this.legacyFilesToAppend = options.legacyFilesToAppend;
  this.loaderFile = options.loaderFile;
  this.ignoredModules = options.ignoredModules || [];
}

util.inherits(ES6Concat, Writer);

ES6Concat.prototype.write = function (readTree, destDir) {
  var self = this;
  var output = [];

  return readTree(this.inputTree).then(function (srcDir) {
    var container = new Container({
      resolvers: [new FileResolver([srcDir])],
      formatter: new AMDFormatter()
    });

    if (self.loaderFile) {
      addLegacyFile(self.loaderFile);
    }

    var inputFiles = helpers.multiGlob(self.inputFiles, {cwd: srcDir});
    for (var i = 0; i < inputFiles.length; i++) {
      var fileName = inputFiles[i];
      if (self.ignoredModules.indexOf(fileName.slice(0, -3)) < 0) {
        var module = container.getModule(fileName);
      }
    }
    var builtModules = container.convert();

    for (i = 0; i < builtModules.length; i++) {
      var code;
      if (self.wrapInEval) {
        code = wrapInEval(recast.print(builtModules[i]).code, builtModules[i].filename);
      } else {
        code = recast.print(builtModules[i]).code;
      }
      output.push(code);
    }

    if (self.legacyFilesToAppend && self.legacyFilesToAppend.length) {
      var legacyFiles = helpers.multiGlob(self.legacyFilesToAppend, {cwd: srcDir});
      for (i = 0; i < legacyFiles.length; i++) {
        addLegacyFile(legacyFiles[i]);
      }
    }

    helpers.assertAbsolutePaths([self.outputFile]);
    mkdirp.sync(path.join(destDir, path.dirname(self.outputFile)));
    fs.writeFileSync(path.join(destDir, self.outputFile), output.join('\n;'));


    function addLegacyFile (filePath) {
      var fileContents = fs.readFileSync(srcDir + '/' + filePath, { encoding: 'utf8' });
      if (self.wrapInEval) {
        fileContents = wrapInEval(fileContents, filePath);
      }
      cacheObject = {
        output: fileContents
      };
      output.push(cacheObject.output);
    }
  });
};

function wrapInEval (fileContents, fileName) {
  // Should pull out copyright comment headers
  // Eventually we want source maps instead of sourceURL
  return 'eval("' +
    jsStringEscape(fileContents) +
    '//# sourceURL=' + jsStringEscape(fileName) +
    '");\n';
}
