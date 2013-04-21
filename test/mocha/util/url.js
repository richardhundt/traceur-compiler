suite('url.js', function() {
  test('removeDotSegments', function() {

    var removeDotSegments = traceur.util.removeDotSegments;

    assert.equal('/', removeDotSegments('/'));
    assert.equal('.', removeDotSegments('.'));
    assert.equal('./', removeDotSegments('./'));
    assert.equal('/', removeDotSegments('/.'));
    assert.equal('/', removeDotSegments('/..'));
    assert.equal('../', removeDotSegments('../'));
    assert.equal('..', removeDotSegments('..'));
    assert.equal('../..', removeDotSegments('../..'));
    assert.equal('../../', removeDotSegments('../../'));
    assert.equal('../a', removeDotSegments('../a'));
    assert.equal('../a/', removeDotSegments('../a/'));

    assert.equal('.', removeDotSegments('a/..'));
    assert.equal('./', removeDotSegments('a/../'));
    assert.equal('a', removeDotSegments('a/b/..'));
    assert.equal('a/', removeDotSegments('a/b/../'));

    assert.equal('b', removeDotSegments('a/../b'));
    assert.equal('b/', removeDotSegments('a/../b/'));

    assert.equal('../b', removeDotSegments('a/../../b'));
    assert.equal('../b/', removeDotSegments('a/../../b/'));

    assert.equal('..', removeDotSegments('a/../../b/..'));
    assert.equal('../', removeDotSegments('a/../../b/../'));

    assert.equal('a/b', removeDotSegments('a/./b'));
    assert.equal('a/b/', removeDotSegments('a/./b/'));
    assert.equal('a/b', removeDotSegments('a/././b'));
    assert.equal('a/b/', removeDotSegments('a/././b/'));
    assert.equal('a/b', removeDotSegments('a/././b/.'));
    assert.equal('a/b/', removeDotSegments('a/././b/./'));

    assert.equal('b', removeDotSegments('a/./../b'));
    assert.equal('b/', removeDotSegments('a/./../b/'));
  });
});
