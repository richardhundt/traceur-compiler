import {Name: create, isName} from '@name';
import Name from '@name';
module n from '@name'

var n1 = create();
var n2 = Name();
var n3 = new Name();

assertTrue(isName(n1));
assertTrue(isName(n2));
assertTrue(isName(n3));

assert.equal(Name, create);
assert.equal(n.Name, Name);
assert.equal(isName, isName);
