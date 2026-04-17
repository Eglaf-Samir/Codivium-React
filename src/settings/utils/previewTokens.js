// utils/previewTokens.js
// Python sample rendered in the code preview panes.
// Token types: kw=keyword, fn=function, str=string, num=number,
//              cmt=comment, op=operator, var=variable, cls=class, pun=punctuation

// Each element is either a string (whitespace/newline) or { t: type, v: text }.
// The CodePreview component maps types to CSS class names (as-ep-{type}).

export const PREVIEW_LINES = [
  // # Fibonacci sequence
  [{ t:'cmt', v:'# Fibonacci sequence' }],
  // def fibonacci(n):
  [{ t:'kw', v:'def' }, ' ', { t:'fn', v:'fibonacci' }, { t:'pun', v:'(' }, { t:'var', v:'n' }, { t:'pun', v:'):' }],
  // """Return nth Fibonacci."""
  ['    ', { t:'str', v:'"""Return nth Fibonacci."""' }],
  // if n <= 1:
  ['    ', { t:'kw', v:'if' }, ' ', { t:'var', v:'n' }, ' ', { t:'op', v:'<=' }, ' ', { t:'num', v:'1' }, { t:'pun', v:':' }],
  // return n
  ['        ', { t:'kw', v:'return' }, ' ', { t:'var', v:'n' }],
  // a, b = 0, 1
  ['    ', { t:'var', v:'a' }, { t:'pun', v:',' }, ' ', { t:'var', v:'b' }, ' ', { t:'op', v:'=' }, ' ', { t:'num', v:'0' }, { t:'pun', v:',' }, ' ', { t:'num', v:'1' }],
  // for _ in range(n - 1):
  ['    ', { t:'kw', v:'for' }, ' ', { t:'var', v:'_' }, ' ', { t:'kw', v:'in' }, ' ', { t:'fn', v:'range' }, { t:'pun', v:'(' }, { t:'var', v:'n' }, ' ', { t:'op', v:'-' }, ' ', { t:'num', v:'1' }, { t:'pun', v:'):' }],
  // a, b = b, a + b
  ['        ', { t:'var', v:'a' }, { t:'pun', v:',' }, ' ', { t:'var', v:'b' }, ' ', { t:'op', v:'=' }, ' ', { t:'var', v:'b' }, { t:'pun', v:',' }, ' ', { t:'var', v:'a' }, ' ', { t:'op', v:'+' }, ' ', { t:'var', v:'b' }],
  // return b
  ['    ', { t:'kw', v:'return' }, ' ', { t:'var', v:'b' }],
  // blank
  [],
  // # Class example
  [{ t:'cmt', v:'# Class example' }],
  // class Stack:
  [{ t:'kw', v:'class' }, ' ', { t:'cls', v:'Stack' }, { t:'pun', v:':' }],
  // def __init__(self):
  ['    ', { t:'kw', v:'def' }, ' ', { t:'fn', v:'__init__' }, { t:'pun', v:'(' }, { t:'var', v:'self' }, { t:'pun', v:'):' }],
  // self.data = []
  ['        ', { t:'var', v:'self' }, { t:'pun', v:'.' }, { t:'var', v:'data' }, ' ', { t:'op', v:'=' }, ' ', { t:'pun', v:'[]' }],
  // blank
  [],
  // # Usage
  [{ t:'cmt', v:'# Usage' }],
  // result = [fibonacci(i) for i in range(10)]
  [{ t:'var', v:'result' }, ' ', { t:'op', v:'=' }, ' ', { t:'pun', v:'[' }, { t:'fn', v:'fibonacci' }, { t:'pun', v:'(' }, { t:'var', v:'i' }, { t:'pun', v:')' }, ' ', { t:'kw', v:'for' }, ' ', { t:'var', v:'i' }, ' ', { t:'kw', v:'in' }, ' ', { t:'fn', v:'range' }, { t:'pun', v:'(' }, { t:'num', v:'10' }, { t:'pun', v:')]' }],
];
