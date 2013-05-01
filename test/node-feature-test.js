// Copyright 2013 Traceur Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var fs = require('fs');
var path = require('path');

var traceur = require('../src/node/traceur.js');
var parseProlog = require('./test-utils.js').parseProlog;
var testList = require('./test-list.js').testList;
var NodeLoader = require('../src/node/NodeLoader.js');

var loader = new NodeLoader();

var urlOptions = {};

function runCode(code, name) {
  try {
    ('global', eval)(code);
  } catch (e) {
    fail('Error running compiled output for : ' + name + '\n' + e + '\n' +
         code);
  }
}

function featureTest(name, url) {

  teardown(function() {
    traceur.options.reset();
  });

  var source;

  test(name, function(done) {
    loader.load(url, function(data) {
      source = data;
      doTest(done);
    }, function() {
      fail('Load error');
      done();
    });
  });

  function doTest(done) {
    traceur.options.debug = true;
    traceur.options.freeVariableChecker = true;
    traceur.options.validate = true;

    var options = parseProlog(source);
    var skip = options.skip;
    var shouldCompile = options.shouldCompile;
    var expectedErrors = options.expectedErrors;

    try {
      var reporter = new traceur.util.TestErrorReporter();
      var sourceFile = new traceur.syntax.SourceFile(name, source);

      // TODO(arv): We really need a better way to generate unique names that
      // works across multiple projects.
      var project = new traceur.semantics.symbols.Project(url);
      project.identifierGenerator.identifierIndex = Date.now();
      var tree = traceur.codegeneration.Compiler.compileFile(reporter,
                                                             sourceFile,
                                                             url,
                                                             project);
      var code = traceur.outputgeneration.TreeWriter.write(tree);

      if (!shouldCompile) {
        assert.isTrue(reporter.hadError(),
            'Expected error compiling ' + name + ', but got none.');

        var missingExpectations = expectedErrors.forEach(function(expected) {
          assert.isTrue(reporter.hasMatchingError(expected),
                        'Missing expected error: ' + expected);
        });

        skip = true;
      }

      var CloneTreeTransformer = traceur.codegeneration.CloneTreeTransformer;

      if (!skip) {
          if (reporter.hadError()) {
            fail('Error compiling ' + name + '.\n' +
                 reporter.errors.join('\n'));
            return;
          }
          if (urlOptions.testClone === 'true') {
            var clone = CloneTreeTransformer.cloneTree(tree);
            code = traceur.outputgeneration.TreeWriter.write(tree);
            var cloneCode = traceur.outputgeneration.TreeWriter.write(clone);
            assert.equal(code, cloneCode);
          } else {
            // Script compiled, so run it.
            runCode(code, name);
          }
      }
    } finally {
      traceur.options.reset();
    }

    done();
  }
}

// Bucket tests.
var tree = {};
testList.forEach(function(path) {
  var parts = path.split('/');
  var suiteName = parts.slice(0, -1).join(' ');
  var testName = parts[parts.length - 1];
  if (!tree[suiteName])
    tree[suiteName] = [];
  tree[suiteName].push({name: testName, path: path});
});

suite('Feature Tests', function() {
  for (var suiteName in tree) {
    suite(suiteName, function() {
      tree[suiteName].forEach(function(tuple) {
        featureTest(tuple.name, path.resolve('test/feature/' + tuple.path));
      });
    });
  }
});
