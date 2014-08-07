# Broccoli ES6 Concat

Highly inspired by [broccoli-es6-concatenator](https://github.com/joliss/broccoli-es6-concatenator)
Compatible with es6-transpiler 0.5

## Instalation

```bash
npm install --save-dev broccoli-es6-concat
```
Usage

```js
compileES6 = require('broccoli-es6-concat');
var applicationJs = compileES6(sourceTree, {
  loaderFile: 'loader.js',
  ignoredModules: [
    'resolver'
  ],
  inputFiles: [
    'todomvc/**/*.js'
  ],
  legacyFilesToAppend: [
    'jquery.js',
    'handlebars.js',
    'ember.js',
  ],
  wrapInEval: true,
  outputFile: '/assets/application.js'
});
```

Some work needs to be done in regards of caching
