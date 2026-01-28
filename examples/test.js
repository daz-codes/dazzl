const { _Range, Range } = require("./.dazzl_modules/range");
const { Kernel } = require("./.dazzl_modules/kernel");
const greeting = "Hello from Dazzl!";
const x = 10;
const y = 20;
function add(a, b) {
  return a + b;
}
const result = add(x, y);
console.log(greeting);
console.log(result);
if (result === 30) {
  console.log("Math works!");
} else {
  console.log("Something is wrong");
}
if (!(result === 0)) {
  console.log("Result is not zero");
}
if (result === 30) {
  console.log("Postfix if works!");
}
if (!(result === 30)) {
  console.log("This should not print");
}
const level = (result > 50 ? "high" : "low");
console.log(level);
(result === 30 ? console.log("single-line if works") : console.log("nope"));
const sign = (result > 0 ? "positive" : "non-positive");
console.log(sign);
const nested = (result > 100 ? "big" : (result > 10 ? "medium" : "small"));
console.log(nested);
console.log((true ? "inline ternary works" : "nope"));
const status = Symbol("active");
console.log(status);
function squared(x) {
  return x * x;
}
function multiply(x, y) {
  return x * y;
}
function triple(x) {
  return x * 3;
}
function double(x) {
  return x + x;
}
console.log(squared(6));
console.log(multiply(3, 4));
console.log(triple(5));
console.log(double(7));
const my_range = new _Range(1, 5);
console.log(Range.to_list(my_range));
console.log(Range.size(my_range));
console.log(Range.member(my_range, 3));
console.log(add(result, 5));
console.log(Kernel.is_integer(42));
console.log(Kernel.is_sym(Symbol("test")));
console.log(Kernel.is_range(my_range));
console.log(Kernel.length("hello"));
console.log(Kernel.abs(0 - 5));
console.log(Kernel.inspect(Symbol("active")));
