const { _Range, Range } = require("./range");

const Kernel = {
  // I/O
  print: console.log.bind(console),

  // Math
  abs: Math.abs,
  div: (a, b) => Math.floor(a / b),
  rem: (a, b) => a % b,
  round: Math.round,
  trunc: Math.trunc,
  max: Math.max,
  min: Math.min,

  // Type checking
  is_sym: x => typeof x === 'symbol',
  is_binary: x => typeof x === 'string',
  is_boolean: x => typeof x === 'boolean',
  is_float: x => typeof x === 'number' && !Number.isInteger(x),
  is_integer: x => Number.isInteger(x),
  is_list: x => Array.isArray(x),
  is_map: x => x instanceof Map,
  is_set: x => x instanceof Set,
  is_object: x => x !== null && typeof x === 'object' && !Array.isArray(x) && !(x instanceof Map) && !(x instanceof Set) && !(x instanceof _Range),
  is_number: x => typeof x === 'number',
  is_range: x => x instanceof _Range,

  // Strict boolean operators (unlike JS &&, ||, !)
  and: (a, b) => {
    if (typeof a !== 'boolean' || typeof b !== 'boolean') {
      throw new Error('bad argument: and expects boolean arguments');
    }
    return a && b;
  },
  or: (a, b) => {
    if (typeof a !== 'boolean' || typeof b !== 'boolean') {
      throw new Error('bad argument: or expects boolean arguments');
    }
    return a || b;
  },
  not: a => {
    if (typeof a !== 'boolean') {
      throw new Error('bad argument: not expects boolean argument');
    }
    return !a;
  },

  // Membership
  in: (elem, collection) => {
    if (Array.isArray(collection)) return collection.includes(elem);
    if (typeof collection === 'string') return collection.includes(elem);
    if (collection instanceof Set) return collection.has(elem);
    if (collection instanceof Map) return collection.has(elem);
    if (collection instanceof _Range) return Range.member(collection, elem);
    if (typeof collection === 'object' && collection !== null) return elem in collection;
    return false;
  },

  // Conversion
  to_string: x => {
    if (typeof x === 'string') return x;
    if (typeof x === 'number') return String(x);
    if (typeof x === 'boolean') return String(x);
    if (x === null) return 'null';
    if (x === undefined) return 'undefined';
    if (typeof x === 'symbol') return x.description || 'Symbol()';
    if (x instanceof _Range) return `${x.first}..${x.last}${x.step !== 1 ? `//${x.step}` : ''}`;
    if (Array.isArray(x)) return JSON.stringify(x);
    if (x instanceof Map) return `Map(${JSON.stringify([...x])})`;
    if (x instanceof Set) return `Set(${JSON.stringify([...x])})`;
    return JSON.stringify(x);
  },
  inspect: x => {
    if (typeof x === 'string') return `"${x}"`;
    if (typeof x === 'symbol') return `:${x.description || ''}`;
    if (x instanceof _Range) return `[${x.first}..${x.last}${x.step !== 1 ? `//${x.step}` : ''}]`;
    if (Array.isArray(x)) return `[${x.map(el => Kernel.inspect(el)).join(', ')}]`;
    if (x instanceof Map) return `Map {${[...x].map(([k, v]) => `${Kernel.inspect(k)} => ${Kernel.inspect(v)}`).join(', ')}}`;
    if (x instanceof Set) return `Set {${[...x].map(el => Kernel.inspect(el)).join(', ')}}`;
    if (typeof x === 'object' && x !== null) return JSON.stringify(x, null, 2);
    return String(x);
  },

  // Length
  length: x => {
    if (typeof x === 'string') return x.length;
    if (Array.isArray(x)) return x.length;
    if (x instanceof _Range) return Range.size(x);
    if (x instanceof Map) return x.size;
    if (x instanceof Set) return x.size;
    if (typeof x === 'object' && x !== null) return Object.keys(x).length;
    throw new Error('bad argument: length expects string, array, range, map, set, or object');
  },

  // Pipeline helpers
  tap: (value, func) => {
    func(value);
    return value;
  },
  then: (value, func) => func(value),
};

module.exports = { Kernel };
