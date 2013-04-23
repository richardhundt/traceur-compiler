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

var finallyVisited = false;

function* test() {
  try {
    yield 42;
  } finally {
    finallyVisited = true;
  }
}

var it = test();
assertEquals(42, it.next());
assertFalse(finallyVisited);

assertThrowsStopIteration(() => it.next());
assertTrue(finallyVisited);

finallyVisited = false;
for (var i of test()) {
  assertEquals(42, i);
}
assertTrue(finallyVisited);
