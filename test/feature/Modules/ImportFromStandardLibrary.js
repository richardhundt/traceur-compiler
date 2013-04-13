// Options: --symbols

import {Symbol: create} from '@name';
import {Symbol} from '@name';

var s1 = create();
var s2 = Symbol();
var s3 = new Symbol();

assertEquals(typeof s1, 'symbol');
assertEquals(typeof s2, 'symbol');

assertTrue(s3 instanceof Symbol);
assertEquals(typeof s3, 'object');
