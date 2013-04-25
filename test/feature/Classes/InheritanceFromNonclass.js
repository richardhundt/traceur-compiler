function noClassA() {}
noClassA.prototype = {
  ma: function() { return 'ma'; }
}

class NoClassB extends noClassA {
  mb() {
    return 'mb ' + super.ma();
  }
}

// ----------------------------------------------------------------------------

var b = new NoClassB;
assertTrue(b instanceof noClassA);
assert.equal('ma', b.ma());
assert.equal('mb ma', b.mb());
