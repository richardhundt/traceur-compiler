// Copyright 2012 Traceur Authors.
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

/**
 * The traceur runtime.
 */
(function(global) {
  'use strict';

  var $create = Object.create;
  var $defineProperty = Object.defineProperty;
  var $freeze = Object.freeze;
  var $getOwnPropertyNames = Object.getOwnPropertyNames;
  var $getPrototypeOf = Object.getPrototypeOf;
  var $hasOwnProperty = Object.prototype.hasOwnProperty;

  function nonEnum(value) {
    return {
      configurable: true,
      enumerable: false,
      value: value,
      writable: true
    };
  }

  var method = nonEnum;

  function polyfillString(String) {
    // Harmony String Extras
    // http://wiki.ecmascript.org/doku.php?id=harmony:string_extras
    Object.defineProperties(String.prototype, {
      startsWith: method(function(s) {
       return this.lastIndexOf(s, 0) === 0;
      }),
      endsWith: method(function(s) {
        var t = String(s);
        var l = this.length - t.length;
        return l >= 0 && this.indexOf(t, l) === l;
      }),
      contains: method(function(s) {
        return this.indexOf(s) !== -1;
      }),
      toArray: method(function() {
        return this.split('');
      })
    });

    // 15.5.3.4 String.raw ( callSite, ...substitutions)
    $defineProperty(String, 'raw', {
      value: function(callsite) {
        var raw = callsite.raw;
        var len = raw.length >>> 0;  // ToUint
        if (len === 0)
          return '';
        var s = '';
        var i = 0;
        while (true) {
          s += raw[i];
          if (i + 1 === len)
            return s;
          s += arguments[++i];
        }
      },
      configurable: true,
      enumerable: false,
      writable: true
    });
  }

  var counter = 0;

  /**
   * Generates a new unique string.
   * @return {string}
   */
  function newUniqueString() {
    return '__$' + Math.floor(Math.random() * 1e9) + '$' + ++counter + '$__';
  }

  var nameRe = /^__\$(?:\d+)\$(?:\d+)\$__$/;

  var symbolInternalProperty = newUniqueString();
  var symbolNameProperty = newUniqueString();
  var symbolValueProperty = newUniqueString();

  /**
   * Creates a new private symbol object.
   * @param {string=} string Optional string used for toString.
   * @constructor
   */
  function Symbol(name) {
    var value = new SymbolValue(name);
    if (!(this instanceof Symbol))
      return value;

    $defineProperty(this, symbolValueProperty, {value: value});
    $defineProperty(this, symbolNameProperty, {value: value.name});
  }
  Symbol.prototype = {
    get name() {
      return this[symbolNameProperty];
    },
    toString: function() {
      throw TypeError('Conversion from symbol to string');
    },
    valueOf: function() {
      // This is not entirely correct but it is better than returning null (as
      // V8 does) for `symbol + ''`
      if (isSymbol(this))
        throw TypeError('Conversion from symbol to string');
      return this[symbolValueProperty];
    }
  };
  $defineProperty(Symbol.prototype, 'name', {enumerable: false});
  $defineProperty(Symbol.prototype, 'toString', {enumerable: false});
  $defineProperty(Symbol.prototype, 'valueOf', {enumerable: false});

  function SymbolValue(name) {
    $defineProperty(this, symbolInternalProperty, {value: newUniqueString()});
    $defineProperty(this, symbolNameProperty, {value: name || ''});
    $freeze(this);
  }
  SymbolValue.prototype = Symbol.prototype;
  $freeze(SymbolValue.prototype);

  function isSymbol(symbol) {
    return symbol && $hasOwnProperty.call(symbol, symbolInternalProperty);
  }

  function assertSymbol(val) {
    if (!isSymbol(val))
      throw new TypeError(val + ' is not a Symbol');
    return val;
  }

  function typeOf(v) {
    if (isSymbol(v))
      return 'symbol';
    return typeof v;
  }

  // Private name.

  // Collection getters and setters
  var elementDeleteName = Symbol();
  var elementGetName = Symbol();
  var elementSetName = Symbol();

  // HACK: We should use runtime/modules/std/name.js or something like that.
  var SymbolModule = $freeze({
    Symbol: Symbol,
    elementGet: elementGetName,
    elementSet: elementSetName,
    elementDelete: elementDeleteName
  });

  var filter = Array.prototype.filter.call.bind(Array.prototype.filter);

  // Override getOwnPropertyNames to filter out private name keys.
  function getOwnPropertyNames(object) {
    return filter($getOwnPropertyNames(object), function(str) {
      return !nameRe.test(str);
    });
  }

  // Override Object.prototype.hasOwnProperty to always return false for
  // private names.
  function hasOwnProperty(name) {
    if (isSymbol(name) || nameRe.test(name))
      return false;
    return $hasOwnProperty.call(this, name);
  }

  function elementDelete(object, name) {
    if (traceur.options.trapMemberLookup &&
        hasPrivateNameProperty(object, elementDeleteName)) {
      return getProperty(object, elementDeleteName).call(object, name);
    }
    return deleteProperty(object, name);
  }

  function elementGet(object, name) {
    if (traceur.options.trapMemberLookup &&
        hasPrivateNameProperty(object, elementGetName)) {
      return getProperty(object, elementGetName).call(object, name);
    }
    return getProperty(object, name);
  }

  function elementHas(object, name) {
    // Should we allow trapping this too?
    return has(object, name);
  }

  function elementSet(object, name, value) {
    if (traceur.options.trapMemberLookup &&
        hasPrivateNameProperty(object, elementSetName)) {
      getProperty(object, elementSetName).call(object, name, value);
    } else {
      setProperty(object, name, value);
    }
    return value;
  }

  function assertNotName(s) {
    if (nameRe.test(s))
      throw Error('Invalid access to private name');
  }

  function deleteProperty(object, name) {
    if (isSymbol(name))
      return delete object[name[symbolInternalProperty]];
    if (nameRe.test(name))
      return true;
    return delete object[name];
  }

  function getProperty(object, name) {
    if (isSymbol(name))
      return object[name[symbolInternalProperty]];
    if (nameRe.test(name))
      return undefined;
    return object[name];
  }

  function hasPrivateNameProperty(object, name) {
    return name[symbolInternalProperty] in Object(object);
  }

  function has(object, name) {
    if (isSymbol(name) || nameRe.test(name))
      return false;
    return name in Object(object);
  }

  // This is a bit simplistic.
  // http://wiki.ecmascript.org/doku.php?id=strawman:refactoring_put#object._get_set_property_built-ins
  function setProperty(object, name, value) {
    if (isSymbol(name)) {
      var descriptor = $getPropertyDescriptor(object,
                                              [name[symbolInternalProperty]]);
      if (descriptor)
        object[name[symbolInternalProperty]] = value;
      else
        $defineProperty(object, name[symbolInternalProperty], nonEnum(value));
    } else {
      assertNotName(name);
      object[name] = value;
    }
  }

  function defineProperty(object, name, descriptor) {
    if (isSymbol(name)) {
      // Private names should never be enumerable.
      if (descriptor.enumerable) {
        descriptor = Object.create(descriptor, {
          enumerable: {value: false}
        });
      }
      $defineProperty(object, name[symbolInternalProperty], descriptor);
    } else {
      assertNotName(name);
      $defineProperty(object, name, descriptor);
    }
  }

  function $getPropertyDescriptor(obj, name) {
    while (obj !== null) {
      var result = Object.getOwnPropertyDescriptor(obj, name);
      if (result)
        return result;
      obj = $getPrototypeOf(obj);
    }
    return undefined;
  }

  function getPropertyDescriptor(obj, name) {
    if (isSymbol(name))
      return undefined;
    assertNotName(name);
    return $getPropertyDescriptor(obj, name);
  }

  function setupSymbolOverrides(global) {
    if (traceur.options.symbols)
      global.Symbol = Symbol;
    overrideObjectMethods(global.Object);
  }

  function overrideObjectMethods(Object) {
    if (traceur.options.symbols) {
      $defineProperty(Object, 'defineProperty', {value: defineProperty});
      $defineProperty(Object, 'getOwnPropertyNames',
                      {value: getOwnPropertyNames});
      $defineProperty(Object.prototype, 'hasOwnProperty',
                      {value: hasOwnProperty});

    } else {
      $defineProperty(Object, 'defineProperty', {value: $defineProperty});
      $defineProperty(Object, 'getOwnPropertyNames',
                      {value: $getOwnPropertyNames});
      $defineProperty(Object.prototype, 'hasOwnProperty',
                      {value: $hasOwnProperty});
    }
  }

  function polyfillObject(Object) {
    overrideObjectMethods(Object);
    $defineProperty(Object, 'deleteProperty', method(deleteProperty));
    $defineProperty(Object, 'getProperty', method(getProperty));
    $defineProperty(Object, 'has', method(has));
    $defineProperty(Object, 'setProperty', method(setProperty));
    $defineProperty(Object, 'getPropertyDescriptor',
                    method(getPropertyDescriptor));

    // Object.is

    // Unlike === this returns true for (NaN, NaN) and false for (0, -0).
    function is(left, right) {
      if (left === right)
        return left !== 0 || 1 / left === 1 / right;
      return left !== left && right !== right;
    }

    $defineProperty(Object, 'is', method(is));
  }

  // Iterators.
  var iteratorName = Symbol('iterator');

  var IterModule = {
    get iterator() {
      return iteratorName;
    },
    isStopIteration: isStopIteration
    // TODO: Implement the rest of @iter and move it to a different file that
    // gets compiled.
  };

  function getIterator(collection) {
    return getProperty(collection, iteratorName).call(collection);
  }

  function returnThis() {
    return this;
  }

  function addIterator(object) {
    // Generator instances are iterable.
    setProperty(object, iteratorName, returnThis);
    return object;
  }

  function polyfillArray(Array) {
    // Make arrays iterable.
    defineProperty(Array.prototype, IterModule.iterator, method(function() {
      var index = 0;
      var array = this;
      return {
        next: function() {
          if (index < array.length) {
            return array[index++];
          }
          throw StopIterationLocal;
        }
      };
    }));
  }

  // Generators: GeneratorReturn
  var GeneratorReturnLocal;

  function setGeneratorReturn(GeneratorReturn, global) {
    switch (typeof GeneratorReturn) {
      case 'function':
        // StopIterationLocal instanceof GeneratorReturnLocal means we probably
        // want to maintain that invariant when we change GeneratorReturnLocal.
        if (typeof GeneratorReturnLocal === 'function' &&
            StopIterationLocal instanceof GeneratorReturnLocal) {
          GeneratorReturnLocal = GeneratorReturn;
          setStopIteration(undefined, global);
          return;
        }
        GeneratorReturnLocal = GeneratorReturn;
        return;
      case 'undefined':
        GeneratorReturnLocal = function(v) {
          this.value = v;
        };
        GeneratorReturnLocal.prototype = {
          toString: function() {
            return '[object GeneratorReturn ' + this.value + ']';
          }
        };
        return;
      default:
        throw new TypeError('constructor function required');
    }
  }

  setGeneratorReturn();

  // Generators: StopIteration
  var StopIterationLocal;

  function isStopIteration(x) {
    return x === StopIterationLocal || x instanceof GeneratorReturnLocal;
  }

  function setStopIteration(StopIteration, global) {
    switch (typeof StopIteration) {
      case 'object':
        StopIterationLocal = StopIteration;
        break;
      case 'undefined':
        StopIterationLocal = new GeneratorReturnLocal();
        StopIterationLocal.toString = function() {
          return '[object StopIteration]';
        };
        break;
      default:
        throw new TypeError('invalid StopIteration type.');
    }
    if (global)
      global.StopIteration = StopIterationLocal;
  }

  setStopIteration(global.StopIteration, global);

  /**
   * @param {Function} canceller
   * @constructor
   */
  function Deferred(canceller) {
    this.canceller_ = canceller;
    this.listeners_ = [];
  }

  function notify(self) {
    while (self.listeners_.length > 0) {
      var current = self.listeners_.shift();
      var currentResult = undefined;
      try {
        try {
          if (self.result_[1]) {
            if (current.errback)
              currentResult = current.errback.call(undefined, self.result_[0]);
          } else {
            if (current.callback)
              currentResult = current.callback.call(undefined, self.result_[0]);
          }
          current.deferred.callback(currentResult);
        } catch (err) {
          current.deferred.errback(err);
        }
      } catch (unused) {}
    }
  }

  function fire(self, value, isError) {
    if (self.fired_)
      throw new Error('already fired');

    self.fired_ = true;
    self.result_ = [value, isError];
    notify(self);
  }

  Deferred.prototype = {
    fired_: false,
    result_: undefined,

    createPromise: function() {
      return {then: this.then.bind(this), cancel: this.cancel.bind(this)};
    },

    callback: function(value) {
      fire(this, value, false);
    },

    errback: function(err) {
      fire(this, err, true);
    },

    then: function(callback, errback) {
      var result = new Deferred(this.cancel.bind(this));
      this.listeners_.push({
        deferred: result,
        callback: callback,
        errback: errback
      });
      if (this.fired_)
        notify(this);
      return result.createPromise();
    },

    cancel: function() {
      if (this.fired_)
        throw new Error('already finished');
      var result;
      if (this.canceller_) {
        result = this.canceller_(this);
        if (!result instanceof Error)
          result = new Error(result);
      } else {
        result = new Error('cancelled');
      }
      if (!this.fired_) {
        this.result_ = [result, true];
        notify(this);
      }
    }
  };

  var modules = $freeze({
    get '@name'() {
      return SymbolModule;
    },
    get '@iter'() {
      return IterModule;
    }
  });

  // TODO(arv): Don't export this.
  global.Deferred = Deferred;

  function setupGlobals(global) {
    polyfillString(global.String);
    polyfillObject(global.Object);
    polyfillArray(global.Array);

    setupSymbolOverrides(global);

    traceur.options.listen((name) => {
      if (name === 'symbols')
        setupSymbolOverrides(global);
    });
  }

  setupGlobals(global);

  // Return the runtime namespace.
  var runtime = {
    Deferred: Deferred,
    get GeneratorReturn() {
      return GeneratorReturnLocal;
    },
    setGeneratorReturn: setGeneratorReturn,
    get StopIteration() {
      return StopIterationLocal;
    },
    setStopIteration: setStopIteration,
    isStopIteration: isStopIteration,
    addIterator: addIterator,
    assertSymbol: assertSymbol,
    createSymbol: SymbolModule.Symbol,
    deleteProperty: deleteProperty,
    elementDelete: elementDelete,
    elementGet: elementGet,
    elementHas: elementHas,
    elementSet: elementSet,
    getIterator: getIterator,
    getProperty: getProperty,
    setProperty: setProperty,
    setupGlobals: setupGlobals,
    has: has,
    modules: modules,
    typeof: typeOf
  };

  // This file is sometimes used without traceur.js.
  if (typeof traceur !== 'undefined')
    traceur.setRuntime(runtime);
  else
    global.traceur = {runtime: runtime};

})(typeof global !== 'undefined' ? global : this);
