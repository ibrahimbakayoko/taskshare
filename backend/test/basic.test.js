// backend/test/basic.test.js
// const assert = require('assert');

import assert from 'assert';

describe('Test logique de base', function() {
  it('devrait valider que 1 + 1 égale 2', function() {
    assert.strictEqual(1 + 1, 2);
  });

  it('devrait valider que "toto" est une chaîne de caractères', function() {
    assert.strictEqual(typeof "toto", 'string');
  });
});