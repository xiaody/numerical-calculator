;(function () {
  'use strict'

  function $ (selector) {
    return document.querySelector(selector)
  }
  function $$ (selector) {
    return Array.from(document.querySelectorAll(selector))
  }

  var math = window.math
  math.config({
    number: 'bignumber',
    precision: 16
  })

  var ndFormula = $('#formula')
  var ndResult = $('#result')
  var nlNumAndOpe = $$('#keypad > span:not(.j-func)')
  var nlOpe = $$('#keypad [data-token]')
  var ndDot = $('#keypad .j-dot')
  var ndBracket = $('#keypad .j-bracket')
  var formula, result
  reset()

  nlNumAndOpe.forEach(function (elt) {
    elt.addEventListener('click', function () {
      formula += elt.dataset.token || elt.textContent
      syncUI()
    })
  })

  $('#keypad > .j-reset').addEventListener('click', reset)

  $('#keypad > .j-delete').addEventListener('click', function () {
    formula = formula.slice(0, -1)
    syncUI()
  })

  function reset () {
    formula = ''
    syncUI()
  }

  function syncUI () {
    formula = smartCorrect(formula)

    // calc result and toggle buttons' enabled
    if (!formula) {
      result = 0
      setOpeEnabled(true)
      setBracket('(')
    } else if (/(\d|\)|%)$/.test(formula)) {
      try {
        result = mathEval(formula)
      } catch (e) {
        console.warn('math parse error:', e)
      }
      setOpeEnabled(true)
      setBracket(')')
    } else {
      try {
        result = mathEval(formula.replace(/[^\d\)%]$/, ''))
      } catch (e) {
        console.warn('math parse error:', e)
      }
      setOpeEnabled(false)
      setBracket('(')
    }
    setDotEnabled(!/\.[\d\)%]*$/.test(formula))
    result = result || 0

    // render to HTML
    ndFormula.innerHTML = humanizeOpe(formula)
    ndResult.textContent = humanizeNum(result)

    ndResult.classList.remove('font-small', 'font-x-small')
    if (ndResult.scrollWidth > ndResult.clientWidth) {
      ndResult.classList.add('font-small')
    }
    if (ndResult.scrollWidth > ndResult.clientWidth) {
      ndResult.classList.add('font-x-small')
    }
  }

  function mathEval (exp) {
    exp = exp.replace(/%/g, '/100')
    return math.eval(exp)
  }

  function humanizeOpe (exp) {
    return exp.replace(/\*/g, '&times;')
        .replace(/\//g, '&divide;')
        .replace(/\+/g, '&plus;')
        .replace(/\-/g, '&minus;')
        .replace(/\^/g, '<sup>&#8319;</sup>')
  }

  function humanizeNum (number) {
    if (math.largerEq(number, 1e10)) {
      number = math.format(number, {
        notation: 'exponential',
        precision: 10
      })
    }
    return number
  }

  function countChar (str, cha) {
    return str.split('').filter(function (x) {
      return x === cha
    }).length
  }

  /*
   * try to correct the formula for user
   */
  function smartCorrect (exp) {
    if (exp.length === 1 && '%^/*'.indexOf(exp) > -1) {
      exp = 1 + exp
    }

    exp = exp.replace(/(^|\D)\./g, '$10.')

    var lBrackets = countChar(exp, '(')
    var rBrackets = countChar(exp, ')')
    if (lBrackets < rBrackets) {
      exp = '(' + exp
    } else if (lBrackets > rBrackets && exp[0] === '(') {
      exp = exp.slice(1)
    }
    return exp
  }

  function setOpeEnabled (enabled) {
    nlOpe.forEach(function (elt) {
      if (enabled) {
        elt.classList.remove('disabled')
      } else {
        elt.classList.add('disabled')
      }
    })
  }

  function setDotEnabled (enabled) {
    if (enabled) {
      ndDot.classList.remove('disabled')
    } else {
      ndDot.classList.add('disabled')
    }
  }

  function setBracket (str) {
    ndBracket.textContent = ndBracket.dataset.token = str
  }
})()
