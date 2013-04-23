// Options: --unstarredGenerators

import {isStopIteration} from '@iter';

function assertThrowsStopIteration(fn) {
  try {
    fn();
  } catch (ex) {
    assert.isTrue(isStopIteration(ex), '[object StopIteration] expected');
    return ex;
  }
  fail('Expected to throw a StopIteration exception');
}

//-----------------------------------------------------------------------------

function G() {
  yield 42;
}

var g = G();

assertEquals(42, g.next());
assertThrowsStopIteration(() => g.next());
