// Options: --private-names

import Name from '@name';
var n = new Name;
var object = {};
object[n] = 42;
assert.equal(42, object[n]);
assertUndefined(object[n.public]);
assertUndefined(object[n + '']);
assertArrayEquals([], Object.getOwnPropertyNames(object));
assertFalse(object.hasOwnProperty(n));

assert.equal(32, object[n] -= 10);
assert.equal(16, object[n] /= 2);
assert.equal(16, object[n]);
