# Dazzl

A programming language that compiles to JavaScript. Dazzl takes inspiration from Elixir, Haskell, and Ruby to offer a concise, expressive syntax while targeting the JavaScript runtime.

## Quick Start

```bash
npm install -g dazzl
dazzl myfile.daz
node myfile.js
```

### Development

```bash
git clone https://github.com/yourusername/dazzl.git
cd dazzl
npm install
npm test        # compile examples/test.daz and run it
```

## Language Features

### Variables

Bare assignment compiles to `const` by default:

```ruby
name = "Dazzl"
x = 42
```

Use `let` for mutable bindings:

```ruby
let counter = 0
```

### Basic Types

```ruby
# Strings
greeting = "Hello"
name = 'World'

# Numbers
count = 42
pi = 3.14

# Booleans
active = true
disabled = false

# Nil (alias for null)
empty = nil
also_null = null
not_defined = undefined

# Symbols (like Ruby/Elixir atoms)
status = :active
state = :pending
```

### Strings and Interpolation

Double-quoted strings support interpolation with `#{}`:

```ruby
name = "World"
"Hello #{name}!"              # "Hello World!"
"2 + 2 = #{2 + 2}"            # "2 + 2 = 4"
"Caps: #{String.upcase(name)}" # "Caps: WORLD"
```

Multiline strings are supported:

```ruby
message = "Line 1
Line 2
Line 3"
```

Single-quoted strings are literal (no interpolation):

```ruby
'Hello #{name}'  # "Hello #{name}" (literal)
```

Escape sequences: `\\`, `\"`, `\n`, `\t`, `\#`

### Arrays

```ruby
empty = []
numbers = [1, 2, 3, 4, 5]
mixed = ["hello", 42, true, nil]
```

### Objects

Three styles that can be mixed:

```ruby
# Colon style (JS-like)
{ name: "Alice", age: 30 }

# Hash rocket style (Ruby/Elixir-like)
{ name => "Alice", age => 30 }

# Shorthand style (ES6-like)
name = "Alice"
age = 30
{ name, age }  # { name: "Alice", age: 30 }

# Mixed
{ name, city: "NYC", active => true }
```

### Operators

```ruby
# Arithmetic
x + y        # addition
x - y        # subtraction
x * y        # multiplication
x / y        # division
x // y       # integer division (Math.floor)
x % y        # modulo
x ** y       # exponentiation (right-associative)

# Concatenation
"a" ++ "b"   # "ab" (strings)
[1] ++ [2]   # [1, 2] (arrays)

# Unary
-x           # negation
+x           # unary plus

# Comparison (== and != compile to === and !==)
x == y
x != y
x < y
x <= y
x > y
x >= y
```

### Nil Checking

Comparisons with `nil`/`null`/`undefined` use loose equality to catch both null and undefined:

```ruby
x == nil     # true if x is null OR undefined
x != nil     # true if x is neither
```

### Functions

Four equivalent styles:

```ruby
# Haskell-style
add x, y = x + y

# Math-style
add(x, y) = x + y

# Arrow-style
add: x, y -> x + y

# Arrow-style with parens
add: (x, y) -> x + y
```

Block bodies with implicit returns:

```ruby
clamp: (val, min, max) -> {
  if val < min { return min }
  if val > max { return max }
  val   # implicit return
}
```

### Calling Functions

Functions can be called with or without parentheses:

```ruby
# With parentheses (traditional)
greet("World")
add(1, 2)

# Without parentheses
greet "World"
add 1, 2

# Nested calls (right-associative)
puts greet "World"    # puts(greet("World"))

# Chained with pipes
"hello" |> String.upcase |> console.log
```

### Pattern Matching Functions

Define multiple clauses for the same function with different patterns. Dazzl merges them into a single function with conditional logic:

```ruby
# Classic factorial with pattern matching
factorial 0 = 1
factorial n = n * factorial(n - 1)

factorial(5)  # 120
```

Patterns can be literals (numbers, strings, booleans, nil), wildcards (`_`), or identifiers:

```ruby
# FizzBuzz with pattern matching
fizzbuzz n if n % 15 == 0 = "FizzBuzz"
fizzbuzz n if n % 3 == 0 = "Fizz"
fizzbuzz n if n % 5 == 0 = "Buzz"
fizzbuzz n = n

# Handling special values
describe nil = "nothing"
describe true = "yes"
describe false = "no"
describe _ = "something else"

describe(nil)    # "nothing"
describe(true)   # "yes"
describe(42)     # "something else"
```

### Control Flow

```ruby
# If/else (parentheses optional)
if x > 0 {
  console.log("positive")
} else {
  console.log("non-positive")
}

# Unless (negated if)
unless x == 0 {
  console.log("not zero")
}

# Postfix conditionals
console.log("yes") if ready
console.log("no") unless valid

# Conditional expressions (like ternary)
sign = if x > 0 then "positive" else "negative"
grade = if score > 90 "A" else if score > 80 "B" else "C"
```

### Pipe Operator

Passes the left side as the first argument:

```ruby
# These are equivalent:
console.log(add(result, 5))
result |> add(5) |> console.log

# Great with String module
"  HELLO  " |> String.trim |> String.downcase |> String.capitalize
```

### Ranges

```ruby
r = [1..10]
Range.to_list(r)      # [1, 2, 3, ..., 10]
Range.size(r)         # 10
Range.member(r, 5)    # true
```

### Comments

```ruby
// JS-style comment
# Ruby-style comment
x = 42  // inline comment
```

## Standard Library

Modules are auto-imported when used.

### Kernel Functions

Called directly (no module prefix):

```ruby
# Math
abs(-5)           # 5
div(10, 3)        # 3
rem(10, 3)        # 1
max(1, 2, 3)      # 3
min(1, 2, 3)      # 1

# Type checking
is_integer(42)    # true
is_float(3.14)    # true
is_binary("hi")   # true (strings)
is_boolean(true)  # true
is_sym(:ok)       # true
is_list([1, 2])   # true
is_range([1..5])  # true

# Utilities
length("hello")   # 5
to_string(42)     # "42"
inspect(:ok)      # ":ok"
```

### String Module

```ruby
String.first("hello")           # "h"
String.last("hello")            # "o"
String.at("hello", -1)          # "o"
String.capitalize("hELLO")      # "Hello"
String.upcase("hello")          # "HELLO"
String.downcase("HELLO")        # "hello"
String.reverse("hello")         # "olleh"
String.trim("  hi  ")           # "hi"
String.contains("hello", "ell") # true
String.starts_with("hello", "he") # true
String.ends_with("hello", "lo")   # true
String.pad_leading("42", 5, "0")  # "00042"
String.duplicate("na", 4)         # "nananana"
String.split("a,b,c", ",")        # ["a", "b", "c"]
String.replace("hello", "l", "L") # "heLlo"
```

### Integer Module

```ruby
Integer.is_even(42)          # true
Integer.is_odd(7)            # true
Integer.digits(1234)         # [1, 2, 3, 4]
Integer.digits(255, 16)      # [15, 15]
Integer.undigits([1, 2, 3])  # 123
Integer.gcd(12, 8)           # 4
Integer.floor_div(10, 3)     # 3
Integer.mod(-5, 3)           # 1 (Euclidean)
Integer.pow(2, 10)           # 1024
Integer.to_string(255, 16)   # "ff"
```

## How It Works

Dazzl compiles `.daz` files to `.js` files. Runtime modules are automatically:

1. Detected by analyzing your code
2. Imported at the top of the output
3. Copied to `.dazzl_modules/` next to your output file

### Project Structure

```
src/
  cli.js              # CLI entry point
  compiler.js         # Orchestrates parsing and codegen
  dazscript.pegjs     # PEG grammar (Peggy)
  codegen.js          # AST to JavaScript generator
  modules/
    kernel.js         # Kernel functions
    range.js          # Range module
    integer.js        # Integer module
    str.js            # String module
examples/
  test.daz            # Feature showcase
```

## License

ISC
