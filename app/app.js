;(function (math) {
  'use strict'
  math.config({
    number: 'bignumber',
    precision: 16
  })
  var isHeadless = typeof window === 'undefined'

  var Computer = (function () {
    var formula = ''
    var lastResult = 0
    var cache = {}
    function mathEval (exp) {
      exp = exp.replace(/%/g, '/100').replace(/[+\-\*\/\^]+$/, '')
      var lpars = countChar(exp, '(')
      var rpars = countChar(exp, ')')
      while (rpars++ < lpars) {
        exp += ')'
      }
      return math.eval(exp)
    }
    var Computer = {
      input: function (token) {
        formula = smartComplete(formula + token)
        return this
      },
      backspace: function () {
        formula = smartDelete(formula, 1)
        return this
      },
      calc: function () {
        var ret
        if (!formula) {
          ret = 0
        } else if (cache.hasOwnProperty(formula)) {
          ret = cache[formula]
        } else {
          try {
            ret = mathEval(formula)
          } catch (e) {
            console.info('mathjs warn:', e)
            ret = lastResult
          }
        }
        return (lastResult = cache[formula] = ret)
      },
      clear: function () {
        formula = ''
        lastResult = 0
        return this
      },
      formula: function () {
        return formula
      }
    }
    return Computer

    function smartComplete (exp) {
      if (exp.length === 1 && '%^/*'.indexOf(exp) > -1) {
        exp = 1 + exp
      }
      exp = exp.replace(/(^|\D)\./g, '$10.')
          .replace(/\.(\D)/g, '.0$1')
          .replace(/\)(\d)/g, ')*$1')
          .replace(/%(\d)/g, '%*$1')
      var lpars = countChar(exp, '(')
      var rpars = countChar(exp, ')')
      if (lpars < rpars) {
        exp = '(' + exp
      }
      return exp
    }

    function smartDelete (exp, deleteCount) {
      if (deleteCount > 1) return exp.slice(0, -deleteCount)
      var toDelete = exp.slice(-1)
      if (toDelete === ')' && exp[0] === '(') {
        try {
          if (math.parse(exp).isParenthesisNode) {
            exp = exp.slice(1, -1)
          } else {
            exp = exp.slice(0, -1)
          }
        } catch (e) {
          exp = exp.slice(0, -1)
        }
      } else {
        exp = exp.slice(0, -1)
      }
      return exp
    }

    function countChar (str, cha) {
      return str.split('').filter(function (x) {
        return x === cha
      }).length
    }
  })()

  var UI = (function () {
    if (isHeadless) return { init: noop }

    var ndFormula = $('#formula')
    var ndResult = $('#result')
    var nlKeys = $$('#keypad > span')
    var nlNumAndOpe = $$('#keypad > span:not(.j-func)')
    var nlOpe = $$('#keypad [data-token]')
    var ndBracket = $('#keypad .j-bracket')
    var ndClear = $('#keypad .j-clear')
    var ndDelete = $('#keypad .j-delete')

    var UI = {
      init: function () {
        if (document.readyState === 'complete') {
          this._initListeners()
        } else {
          window.addEventListener('load', this._initListeners)
        }
      },
      _initListeners: function () {
        nlNumAndOpe.forEach(function (elt) {
          onPointer(elt, function () {
            // `getAttribute` instead of `dataset` to workaround iOS safari issue:
            // sometimes the `dataset.token` becomes Schrödinger state
            // after a lot of concentrated touch events,
            Computer.input(elt.getAttribute('data-token') || elt.textContent)
            UI.sync()
          })
        })
        onPointer(ndClear, UI.reset)
        onPointer(ndDelete, function () {
          Computer.backspace()
          UI.sync()
        })
        // keyboard controll
        '0123456789.+-*/%^()'.split('').forEach(function (token) {
          window.Mousetrap.bind(token, function () {
            nlKeys.some(function (ndKey) {
              var hit = (ndKey.dataset.token || ndKey.textContent) === token
              if (hit && !ndKey.classList.contains('disabled')) {
                Computer.input(token)
                UI.sync()
              }
              return hit
            })
          })
        })
        window.Mousetrap.bind(['backspace', 'del'], function () {
          Computer.backspace()
          UI.sync()
          return false
        })
        window.Mousetrap.bind(['esc', 'c', 'C', 'ctrl+u'], function () {
          UI.reset()
          return false
        })
        document.addEventListener('touchmove', function (e) {
          e.preventDefault() // prevent iOS scroll
        })
      },
      sync: function () {
        // set keys state
        var formula = Computer.formula()
        if (!formula) {
          setKeysEnabled($$('#keypad > span'), true)
          setBracket('(')
        } else if (/[\d)%.]$/.test(formula)) {
          setKeysEnabled(nlOpe, true)
          setKeysEnabled('%^', !/[%\^]$/.test(formula))
          setBracket(')')
        } else {
          setKeysEnabled(nlOpe, false)
          setBracket('(')
        }
        setKeysEnabled('.', !/\.[\d\)%]*$/.test(formula))

        // render to HTML
        var result = Computer.calc() || 0
        ndFormula.innerHTML = humanizeOpe(formula)
        ndResult.innerHTML = humanizeNum(result)

        // responsive font-size for result
        ndResult.classList.remove('font-small', 'font-x-small')
        if (ndResult.scrollWidth > ndResult.clientWidth) {
          ndResult.classList.add('font-small')
        }
        if (ndResult.scrollWidth > ndResult.clientWidth) {
          ndResult.classList.add('font-x-small')
        }
      },
      reset: function () {
        Computer.clear()
        UI.sync()
      }
    }

    return UI

    function setKeysEnabled (elts, enabled) {
      if (typeof elts === 'string') {
        elts = $$(elts.split('').map(function (t) {
          return '[data-token="' + t + '"]'
        }).join(','))
      }
      if (!Array.isArray(elts)) {
        elts = [elts]
      }
      elts.forEach(function (elt) {
        if (enabled) {
          elt.classList.remove('disabled')
        } else {
          elt.classList.add('disabled')
        }
      })
    }

    function setBracket (str) {
      ndBracket.textContent = str
    }

    function humanizeOpe (exp) {
      return exp.replace(/\*/g, '&times;')
          .replace(/\//g, '&divide;')
          .replace(/\+/g, '&plus;')
          .replace(/\-/g, '&minus;')
          .replace(/\^/g, '<sup>&#8319;</sup>')
    }

    function humanizeNum (number) {
      number += ''
      var eIndex = number.indexOf('e')
      if (eIndex > -1) {
        number = '<span class=exponential>' +
            '<span class=shrinkable>' + number.slice(0, eIndex) + '</span>' +
            '<span>' + number.slice(eIndex) + '</span>' +
            '</span>'
      }
      return number
    }
  })()

  UI.init()
  if (typeof module === 'object') {
    module.exports = Computer
  }

  function $ (selector) { return document.querySelector(selector) }

  function $$ (selector) {
    return Array.from(document.querySelectorAll(selector))
  }

  function onPointer (target, listener) {
    if ('ontouchend' in window) {
      target.addEventListener('touchend', function (e) {
        var cord = e.changedTouches[0]
        if (point2rect(cord, target.getBoundingClientRect()) < 25) {
          listener(e)
        }
      })
    } else {
      target.addEventListener('click', listener)
    }
  }

  function point2rect (point, rect) {
    var x = point.clientX
    var y = point.clientY
    var w = 0
    var h = 0
    if (x < rect.left) {
      w = rect.left - x
    } else if (x > rect.right) {
      w = x - rect.right
    }
    if (y > rect.bottom) {
      h = rect.bottom -y
    } else if (y < rect.top) {
      h = y - rect.top
    }
    return Math.sqrt(w * w + h * h)
  }

  function noop () {}
})(typeof window === 'object' ? window.math : require('mathjs'))
