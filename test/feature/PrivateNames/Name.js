// Options: --symbols

import {Symbol} from '@name';

var s1 = new Symbol;
assertTrue(s1 instanceof Symbol);
assertEquals(typeof s1, 'object');

var s2 = Symbol();
// This fails because we cannot provide a new primitive type
// assertFalse(s2 instanceof Symbol);
assertEquals(typeof s2, 'symbol');

var s2 = Symbol('abc');
assertTrue(s2.name === 'abc');
