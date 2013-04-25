// Skip. Not implemented.
// Only in browser.

class CustomBlockquote extends HTMLBlockquoteElement {
  constructor() {
    this.custom = 42;
  }
}

var customBlockquote = new CustomBlockquote;
assert.equal(42, customBlockquote.custom);
assert.equal('BLOCKQUOTE', customBlockquote.tagName);
assertTrue(customBlockquote instanceof CustomBlockquote);
assertTrue(customBlockquote instanceof HTMLBlockquoteElement);
assertTrue(customBlockquote instanceof HTMLQuoteElement);
assertTrue(customBlockquote instanceof HTMLElement);
