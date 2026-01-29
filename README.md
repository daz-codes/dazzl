# Dazzl

A programming language that compiles to JavaScript. Dazzl takes inspiration from Elixir, Haskell, and Ruby to offer a concise, expressive syntax while targeting the JavaScript runtime.

## Quick Start

Install globally:

```bash
npm install -g dazzl
```

Then compile and run your `.daz` files:

```bash
dazzl myfile.daz
node myfile.js
```

### Development

If you're working on the compiler itself:

```bash
git clone https://github.com/yourusername/dazzl.git
cd dazzl
npm install
npm test        # compile examples/test.daz and run it
```

## Language Features

### Variables

Variables are declared with bare assignment and compile to `const` by default:

```
name = "Dazzl!"
x = 42
```

You can still use explicit `let` or `const` if needed:

```
let counter = 0
const PI = 3.14
```

### Functions

Dazzl offers four equivalent ways to define functions. Use whichever reads best for your use case:

**Haskell-style** — name, space-separated params, `=`:

```
squared x = x * x
add x, y = x + y
```

**Math-style** — name with parenthesised params, `=`:

```
squared(x) = x * x
add(x, y) = x + y
```

**Arrow-style** — name, colon, params, `->`:

```
squared: x -> x * x
add: x, y -> x + y
```

**Arrow-style with parentheses** — same but params in parens:

```
squared: (x) -> x * x
add: (x, y) -> x + y
```

All four styles support block bodies too:

```
clamp x, min, max = {
  if x < min { min }
  if x > max { max }
  x
}

clamp: (x, min, max) -> {
  if x < min { min }
  if x > max { max }
  x
}
```

### Implicit Returns

The last expression in any function body is automatically returned. No `return` keyword needed (though it still works for early returns):

```
add x, y = x + y

// equivalent to:
add(x, y) = {
  return x + y
}
```

### If / Unless

Standard `if`/`else` — parentheses around the condition are optional:

```
if x > 0 {
  console.log("positive")
} else {
  console.log("non-positive")
}

// parentheses still work if you prefer them
if (x > 0) {
  console.log("positive")
}
```

`unless` is syntactic sugar for `if (!...)`:

```
unless list_empty {
  process(list)
}
```

Both support postfix form for single expressions:

```
console.log("big!") if x > 100
console.log("not zero") unless x == 0
```

### Conditional Expressions

Use `if...else` as an expression to return values (like a ternary operator). The `then` keyword is optional:

```
// With "then" keyword
sign = if x > 0 then "positive" else "negative"

// Without "then" (condition must be a comparison)
sign = if x > 0 "positive" else "negative"

// Nested conditionals
grade = if score > 90 "A" else if score > 80 "B" else "C"

// Inline usage
console.log(if ready then "Go!" else "Wait...")
```

These compile to JavaScript's ternary operator: `(x > 0 ? "positive" : "negative")`.

Note: Without `then`, the condition must be a comparison or simpler expression. Use `then` or parentheses around the condition for more complex expressions like pipes.

### Pipe Operator

The `|>` operator works like Elixir's pipe -- it passes the left-hand side as the **first argument** to the right-hand side:

```
// These are equivalent:
console.log(add(result, 5))
result |> add(5) |> console.log
```

Pipes work with bare function references or calls with additional arguments:

```
value |> transform           // transform(value)
value |> transform(extra)    // transform(value, extra)
value |> a |> b |> c         // c(b(a(value)))
```

### Symbols

Ruby/Elixir-style symbols using the `:name` syntax, compiled to JavaScript `Symbol()`:

```
status = :active
state = :pending
// compiles to: const status = Symbol("active")
```

### Ranges

Range literals create iterable range objects:

```
r = [1..10]
Range.to_list(r)             // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
Range.size(r)                // 10
Range.member(r, 5)           // true
Range.disjoint(r, [20..30])  // true
```

Ranges work with JavaScript spread and `for...of`:

```
// In compiled JS: [...new _Range(1, 5)] gives [1, 2, 3, 4, 5]
```

The `Range` module provides:

| Function | Description |
|---|---|
| `Range.new(first, last, step?)` | Create a range with optional step |
| `Range.to_list(r)` | Convert to array |
| `Range.size(r)` | Number of elements |
| `Range.member(r, value)` | Check membership |
| `Range.disjoint(r1, r2)` | Check if ranges don't overlap |

### Kernel Functions

Dazzl includes a Kernel module with utility functions that are auto-imported when used:

**Math:**
```
abs(-5)          // 5
div(10, 3)       // 3 (integer division)
rem(10, 3)       // 1 (remainder)
max(1, 2, 3)     // 3
min(1, 2, 3)     // 1
round(3.7)       // 4
trunc(3.7)       // 3
```

**Type checking:**
```
is_integer(42)       // true
is_float(3.14)       // true
is_number(42)        // true
is_binary("hello")   // true (strings)
is_boolean(true)     // true
is_sym(:active)      // true
is_list(arr)         // true for arrays
is_map(m)            // true for Map objects
is_set(s)            // true for Set objects
is_object(obj)       // true for plain objects
is_range([1..10])    // true
```

**Utilities:**
```
length("hello")      // 5 (works on strings, arrays, ranges, maps, sets, objects)
to_string(42)        // "42"
inspect(:active)     // ":active" (pretty-print with type info)
tap(value, fn)       // calls fn(value), returns value (for debugging in pipes)
```

**Strict boolean operators:**
```
and(true, false)     // false (throws if non-boolean)
or(true, false)      // true
not(true)            // false
```

### Comparison Operators

`==` and `!=` in Dazzl compile to strict equality (`===` and `!==`) in JavaScript.

### Semicolons

Semicolons are not required. Newlines act as statement terminators. Semicolons are still accepted if you prefer them or want multiple statements on one line:

```
x = 10; y = 20
```

### Comments

Single-line comments with `//` or `#`:

```
// this is a comment
# this is also a comment
x = 42 // inline comment
y = 10 # also works inline
```

## Compilation Details

Dazzl compiles `.daz` files to `.js` files. When runtime modules are needed (e.g., ranges), the compiler automatically:

1. Emits `require()` imports at the top of the output file
2. Copies only the needed module files into a `.dazzl_modules/` directory next to the output

### Project Structure

```
src/
  cli.js              # CLI entry point
  compiler.js         # Orchestrates parsing and code generation
  dazscript.pegjs     # PEG grammar (Peggy)
  codegen.js          # AST to JavaScript code generator
  modules/
    range.js          # Range runtime module
examples/
  test.daz            # Example Dazzl file
```

## License

ISC
