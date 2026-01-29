const { Str } = require("./.dazzl_modules/str");
const { Kernel } = require("./.dazzl_modules/kernel");
const { _Range, Range } = require("./.dazzl_modules/range");
const { Integer } = require("./.dazzl_modules/integer");
const greeting = "Hello from Dazzl!";
const x = 10;
const y = 20;
console.log(greeting);
const empty = null;
const also_null = null;
const not_defined = undefined;
const active = true;
const disabled = false;
const status = Symbol.for("active");
console.log(status);
const name = "World";
const single_quoted = "no interpolation here: #{name}";
console.log(`Hello ${name}!`);
console.log(`Math: 2 + 2 = ${2 + 2}`);
console.log(`Chained: ${Str.upcase(name)}`);
const multiline = "Line 1\nLine 2\nLine 3";
console.log(multiline);
console.log(10 + 5);
console.log(10 - 5);
console.log(10 * 5);
console.log(10 / 4);
console.log(Math.floor(10 / 3));
console.log(17 % 5);
console.log(Math.floor(-17 / 5));
console.log(2 ** 10);
console.log(2 ** 3 ** 2);
console.log(-42);
console.log(+42);
console.log(-(-5));
const empty_arr = [];
const numbers = [1, 2, 3, 4, 5];
const mixed = ["hello", 42, true, null];
console.log(numbers);
const obj1 = { name: "Alice", age: 30 };
const obj2 = { name: "Bob", age: 25 };
const person_name = "Charlie";
const person_age = 35;
const obj3 = { person_name, person_age };
const obj4 = { person_name, city: "NYC", active: true };
console.log(obj1);
console.log(obj4);
function add(a, b) {
  return a + b;
}
function squared(n) {
  return n * n;
}
function multiply(a, b) {
  return a * b;
}
function triple(n) {
  return n * 3;
}
console.log(add(x, y));
console.log(squared(6));
console.log(multiply(3, 4));
console.log(triple(5));
function clamp(val, min, max) {
  if (val < min) {
    return min;
  }
  if (val > max) {
    return max;
  }
  return val;
}
console.log(clamp(50, 0, 100));
console.log(clamp(-10, 0, 100));
const result = 30;
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
  console.log("This won't print");
}
const level = (result > 50 ? "high" : "low");
const sign = (result > 0 ? "positive" : "non-positive");
const grade = (result > 90 ? "A" : (result > 80 ? "B" : "C"));
console.log(`Level: ${level}, Sign: ${sign}, Grade: ${grade}`);
console.log(add(result, 5));
console.log(Str.downcase(Str.trim("  HELLO  ")));
const maybe_null = null;
const maybe_undef = undefined;
console.log(maybe_null == null);
console.log(maybe_undef == null);
console.log(42 == null);
const my_range = new _Range(1, 5);
console.log(Range.to_list(my_range));
console.log(Range.size(my_range));
console.log(Range.member(my_range, 3));
console.log(Kernel.is_integer(42));
console.log(Kernel.is_float(3.14));
console.log(Kernel.is_binary("hello"));
console.log(Kernel.is_sym(Symbol.for("test")));
console.log(Kernel.is_list([1, 2, 3]));
console.log(Kernel.is_range(my_range));
console.log(Kernel.abs(-5));
console.log(Kernel.length("hello"));
console.log(Kernel.inspect(Symbol.for("active")));
console.log(Str.first("elixir"));
console.log(Str.last("elixir"));
console.log(Str.at("elixir", 2));
console.log(Str.at("elixir", -1));
console.log(Str.capitalize("hELLO"));
console.log(Str.reverse("dazzl"));
console.log(Str.contains("hello", "ell"));
console.log(Str.pad_leading("42", 5, "0"));
console.log(Str.duplicate("na", 4));
console.log(Integer.is_even(42));
console.log(Integer.is_odd(7));
console.log(Integer.digits(1234));
console.log(Integer.digits(255, 16));
console.log(Integer.undigits([1, 2, 3]));
console.log(Integer.gcd(12, 8));
console.log(Integer.pow(2, 10));
console.log(Integer.to_string(255, 16));
