// Options: --symbols

import Symbol from '@name';
var s = Symbol();
assertEquals(typeof s, 'symbol');
var object = {};
object[s] = 42;
assertEquals(42, object[s]);
assertUndefined(object[s.name]);
assertThrows(function() {
  s + '';
});
assertThrows(function() {
  s.toString();
});

assertArrayEquals([], Object.getOwnPropertyNames(object));
assertFalse(object.hasOwnProperty(s));

assertEquals(32, object[s] -= 10);
assertEquals(16, object[s] /= 2);
assertEquals(16, object[s]);
