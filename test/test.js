'use strict'

var assert = require('assert')
var Computor = require('..')
var calc = function (exp) {
  return Computor.clear().input(exp).calc()
}
var pow = Math.pow

assert.equal(calc('1+2'), 1 + 2, 'simple plus')
assert.equal(calc('1-2'), 1 - 2, 'simple minus')
assert.equal(calc('2*3'), 2 * 3, 'simple multiply')
assert.equal(calc('6/3'), 6 / 3, 'simple division')
assert.equal(calc('7%-(2+5)%'), 0, 'simple percentage')
assert.equal(calc('10%5'), 0.5, 'simple percentage')
assert.equal(calc('1+2*3'), 1 + 2 * 3, 'complex tests')
assert.equal(calc('(1+2)*3'), (1 + 2) * 3, 'complex tests')
assert.equal(calc('(1+2)^3'), pow(1 + 2, 3), 'complex tests')
assert.equal(calc('-2*10^2*2'), -2 * pow(10, 2) * 2, 'complex tests')
assert.equal(calc('3%*4/2^3*5'), (3 / 100) * 4 / pow(2, 3) * 5, 'complex tests')

assert.equal(
  Computor.clear().input('1+2)').formula(),
  '(1+2)',
  'auto-complete brackets'
)
assert.equal(
  Computor.clear().input('(1+2)').backspace().formula(),
  '1+2',
  'auto-complete brackets'
)
assert.equal(
  Computor.clear().input('(1+2)+(1+1)').backspace().formula(),
  '(1+2)+(1+1',
  'auto-complete brackets'
)
assert.equal(
  Computor.clear().input('(1+2)3').formula(),
  '(1+2)*3',
  'number comprehensions'
)
assert.equal(
  Computor.clear().input('(1+.2).3').formula(),
  '(1+0.2)*0.3',
  'number comprehensions'
)
assert.equal(
  Computor.clear().input('1.+.3').formula(),
  '1.0+0.3',
  'number comprehensions'
)
assert.equal(
  Computor.clear().input('(1.).3').formula(),
  '(1.0)*0.3',
  'number comprehensions'
)

console.log('math test OK')
