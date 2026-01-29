const Integer = {
  is_even: n => n % 2 === 0,
  is_odd: n => n % 2 !== 0,

  digits: (n, base = 10) => {
    const abs = Math.abs(n);
    return [...abs.toString(base)].map(c => parseInt(c, base));
  },

  floor_div: (a, b) => {
    if (b === 0 || !Number.isInteger(a) || !Number.isInteger(b)) {
      throw new Error("ArithmeticError");
    }
    return Math.floor(a / b);
  },

  gcd: (a, b) => {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
      [a, b] = [b, a % b];
    }
    return a;
  },

  mod: (int, divisor) => ((int % divisor) + divisor) % divisor,

  pow: (base, exponent) => {
    if (!Number.isInteger(base) || !Number.isInteger(exponent) || exponent < 0) {
      throw new Error("ArithmeticError: bad argument in arithmetic expression");
    }
    return Math.pow(base, exponent);
  },

  to_charlist: (n, base = 10) => {
    return n.toString(base).split('').map(char => char.charCodeAt(0));
  },

  to_string: (n, base = 10) => n.toString(base),

  undigits: (list, base = 10) => {
    if (list.length === 0) return 0;
    return parseInt(list.join(''), base);
  },

  parse: (str) => {
    const n = parseInt(str, 10);
    return isNaN(n) ? { error: "not an integer" } : { ok: n };
  },

  extended_gcd: (a, b) => {
    if (b === 0) return { gcd: a, s: 1, t: 0 };
    const { gcd, s, t } = Integer.extended_gcd(b, a % b);
    return { gcd, s: t, t: s - Math.floor(a / b) * t };
  },
};

module.exports = { Integer };
