// Copyright 2011 Traceur Authors.
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

suite('FreeVariableChecker.traceur.js', function() {

  setup(function() {
    traceur.options.freeVariableChecker = true;
  });

  teardown(function() {
    traceur.options.reset();
  });

  function compileAndReturnErrors(contents, name) {
    var sourceFile = new traceur.syntax.SourceFile(name, contents);
    var reporter = new traceur.util.ErrorReporter();
    var errors = [];
    reporter.reportMessageInternal = function() {
      errors.push(arguments);
    };

    var url = 'http://www.test.com/';
    var project = new traceur.semantics.symbols.Project(url);
    project.addFile(sourceFile)
    traceur.codegeneration.Compiler.compile(reporter, project);
    return errors;
  }

  function assertErrorMessage(errors, expectedError, expectedErrorArg) {
    assert.isTrue(errors.length > 0);
    assert.equal(expectedError, errors[0][1]);
    assert.equal(expectedErrorArg, errors[0][2][0]);
  }

  function assertCompileError(contents, expectedError, expectedErrorArg) {
    var errors = compileAndReturnErrors(contents, 'code');
    assertErrorMessage(errors, expectedError, expectedErrorArg);
  }

  test('FreeVariables', function() {
    traceur.options.experimental = true;
    assertCompileError('var y = x;', '%s is not defined', 'x');
    assertCompileError('x(1,2,3);', '%s is not defined', 'x');
    assertCompileError('function foo() { return x; }', '%s is not defined', 'x');
    assertCompileError('if (true) { console.log(y); }', '%s is not defined', 'y');
    assertCompileError('function foo() { { let y = 5; }; return y; }',
        '%s is not defined', 'y');
    assertCompileError('x = 42;', '%s is not defined', 'x');
    assertCompileError('x.y = 42;', '%s is not defined', 'x');
    assertCompileError('f(42);', '%s is not defined', 'f');
    assertCompileError('x.f(42);', '%s is not defined', 'x');
    // TODO(jmesserly): we shouldn't be putting traceur into the global scope
    // assertCompileError('traceur.runtime = {};', '%s is not defined', 'traceur');
  });

  test('FreeVariables2', function() {
    // Make sure these don't cause an error
    var x = [1, 2];
    var y = [0, ...x, 3];
    assert.equal('0,1,2,3', y.join(','));
  });

  test('FreeVariables3', function() {
    // Regression test.
    assert.equal('function', typeof setTimeout);
  });

});