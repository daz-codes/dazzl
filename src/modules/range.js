class _Range {
  constructor(first, last, step = 1) {
    this.first = first;
    this.last = last;
    this.step = step;
  }
  *[Symbol.iterator]() {
    if (this.step > 0) {
      for (let i = this.first; i <= this.last; i += this.step) yield i;
    } else {
      for (let i = this.first; i >= this.last; i += this.step) yield i;
    }
  }
}

const Range = {
  new: (first, last, step = 1) => new _Range(first, last, step),
  to_list: r => [...r],
  size: r => Math.floor((r.last - r.first) / r.step) + 1,
  disjoint: (r1, r2) => r1.last < r2.first || r2.last < r1.first,
  member: (r, value) => {
    if (r.step > 0) return value >= r.first && value <= r.last && (value - r.first) % r.step === 0;
    return value <= r.first && value >= r.last && (r.first - value) % Math.abs(r.step) === 0;
  }
};

module.exports = { _Range, Range };
