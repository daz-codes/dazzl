const { Kernel } = require("./.dazzl_modules/kernel");
const { Str } = require("./.dazzl_modules/str");
const { _Range, Range } = require("./.dazzl_modules/range");
const { Integer } = require("./.dazzl_modules/integer");
const greeting = "Hello from Dazzl!";
const x = 10;
const y = 20;
Kernel.print(greeting);
const empty = null;
const also_null = null;
const not_defined = undefined;
const active = true;
const disabled = false;
const status = Symbol.for("active");
Kernel.print(status);
const name = "World";
const single_quoted = "no interpolation here: #{name}";
Kernel.print(`Hello ${name}!`);
Kernel.print(`Math: 2 + 2 = ${2 + 2}`);
Kernel.print(`Chained: ${Str.upcase(name)}`);
const multiline = "Line 1\nLine 2\nLine 3";
Kernel.print(multiline);
Kernel.print(10 + 5);
Kernel.print(10 - 5);
Kernel.print(10 * 5);
Kernel.print(10 / 4);
Kernel.print(Math.floor(10 / 3));
Kernel.print(17 % 5);
Kernel.print(Math.floor(-17 / 5));
Kernel.print(2 ** 10);
Kernel.print(2 ** 3 ** 2);
Kernel.print(-42);
Kernel.print(+42);
Kernel.print(-(-5));
const empty_arr = [];
const numbers = [1, 2, 3, 4, 5];
const mixed = ["hello", 42, true, null];
Kernel.print(numbers);
const obj1 = { name: "Alice", age: 30 };
const obj2 = { name: "Bob", age: 25 };
const person_name = "Charlie";
const person_age = 35;
const obj3 = { person_name, person_age };
const obj4 = { person_name, city: "NYC", active: true };
Kernel.print(obj1);
Kernel.print(obj4);
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
Kernel.print(add(x, y));
Kernel.print(squared(6));
Kernel.print(multiply(3, 4));
Kernel.print(triple(5));
function clamp(val, min, max) {
  if (val < min) {
    return min;
  }
  if (val > max) {
    return max;
  }
  return val;
}
Kernel.print(clamp(50, 0, 100));
Kernel.print(clamp(-10, 0, 100));
const result = 30;
if (result === 30) {
  Kernel.print("Math works!");
} else {
  Kernel.print("Something is wrong");
}
if (!(result === 0)) {
  Kernel.print("Result is not zero");
}
if (result === 30) {
  Kernel.print("Postfix if works!");
}
if (!(result === 30)) {
  Kernel.print("This won't print");
}
const level = (result > 50 ? "high" : "low");
const sign = (result > 0 ? "positive" : "non-positive");
const grade = (result > 90 ? "A" : (result > 80 ? "B" : "C"));
Kernel.print(`Level: ${level}, Sign: ${sign}, Grade: ${grade}`);
Kernel.print(add(result, 5));
Kernel.print(Str.downcase(Str.trim("  HELLO  ")));
const maybe_null = null;
const maybe_undef = undefined;
Kernel.print(maybe_null == null);
Kernel.print(maybe_undef == null);
Kernel.print(42 == null);
const my_range = new _Range(1, 5);
Kernel.print(Range.to_list(my_range));
Kernel.print(Range.size(my_range));
Kernel.print(Range.member(my_range, 3));
Kernel.print(Kernel.is_integer(42));
Kernel.print(Kernel.is_float(3.14));
Kernel.print(Kernel.is_binary("hello"));
Kernel.print(Kernel.is_sym(Symbol.for("test")));
Kernel.print(Kernel.is_list([1, 2, 3]));
Kernel.print(Kernel.is_range(my_range));
Kernel.print(Kernel.abs(-5));
Kernel.print(Kernel.length("hello"));
Kernel.print(Kernel.inspect(Symbol.for("active")));
Kernel.print(Str.first("elixir"));
Kernel.print(Str.last("elixir"));
Kernel.print(Str.at("elixir", 2));
Kernel.print(Str.at("elixir", -1));
Kernel.print(Str.capitalize("hELLO"));
Kernel.print(Str.reverse("dazzl"));
Kernel.print(Str.contains("hello", "ell"));
Kernel.print(Str.pad_leading("42", 5, "0"));
Kernel.print(Str.duplicate("na", 4));
Kernel.print(Integer.is_even(42));
Kernel.print(Integer.is_odd(7));
Kernel.print(Integer.digits(1234));
Kernel.print(Integer.digits(255, 16));
Kernel.print(Integer.undigits([1, 2, 3]));
Kernel.print(Integer.gcd(12, 8));
Kernel.print(Integer.pow(2, 10));
Kernel.print(Integer.to_string(255, 16));
function factorial(_arg0) {
  if (_arg0 === 0) return 1;
  { const n = _arg0; return n * factorial(n - 1); }
  throw new Error("No pattern matched for factorial");
}
Kernel.print(factorial(5));
Kernel.print(factorial(0));
function fib(_arg0) {
  if (_arg0 === 0) return 0;
  if (_arg0 === 1) return 1;
  { const n = _arg0; return fib(n - 1) + fib(n - 2); }
  throw new Error("No pattern matched for fib");
}
Kernel.print(fib(10));
function greet(_arg0) {
  if (_arg0 === "world") return "Hello World!";
  { const name = _arg0; return `Hello ${name}!`; }
  throw new Error("No pattern matched for greet");
}
Kernel.print(greet("world"));
Kernel.print(greet("Dazzl"));
function pair_type(_arg0, _arg1) {
  if (_arg0 === 0 && _arg1 === 0) return "both zero";
  if (_arg0 === 0) return "first zero";
  if (_arg1 === 0) return "second zero";
  return "neither zero";
  throw new Error("No pattern matched for pair_type");
}
Kernel.print(pair_type(0, 0));
Kernel.print(pair_type(0, 5));
Kernel.print(pair_type(5, 0));
Kernel.print(pair_type(3, 7));
function to_yn(_arg0) {
  if (_arg0 === true) return "yes";
  if (_arg0 === false) return "no";
  throw new Error("No pattern matched for to_yn");
}
Kernel.print(to_yn(true));
Kernel.print(to_yn(false));
function fizzbuzz(_arg0) {
  if (_arg0 % 15 === 0) { const n = _arg0; return "FizzBuzz"; }
  if (_arg0 % 3 === 0) { const n = _arg0; return "Fizz"; }
  if (_arg0 % 5 === 0) { const n = _arg0; return "Buzz"; }
  { const n = _arg0; return n; }
  throw new Error("No pattern matched for fizzbuzz");
}
Kernel.print(fizzbuzz(15));
Kernel.print(fizzbuzz(9));
Kernel.print(fizzbuzz(10));
Kernel.print(fizzbuzz(7));
const arr = [10, 20, 30, 40, 50];
Kernel.print(arr[0]);
Kernel.print(arr[2]);
Kernel.print(arr[4]);
const idx = 1;
Kernel.print(arr[idx]);
Kernel.print(arr[idx + 1]);
const matrix = [[1, 2], [3, 4]];
Kernel.print(matrix[0][1]);
Kernel.print(matrix[1][0]);
const obj = { name: "test", value: 42 };
Kernel.print(obj["name"]);
Kernel.print(obj["value"]);
const data = { items: [100, 200, 300] };
Kernel.print(data.items[1]);
