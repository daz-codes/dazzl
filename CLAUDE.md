# Dazzl Compiler - Claude Code Guide

## Project Overview

Dazzl is a language that compiles to JavaScript. The compiler uses a Peggy PEG grammar for parsing and a custom code generator to emit JS.

## Build & Test

```bash
npm test          # compile examples/test.daz and run the output JS
npm run build     # compile only (no run)
```

Test expects the output to print: "Hello from Dazzl!", "30", "Math works!" plus additional feature output. Always run `npm test` after changes to verify nothing broke.

## Architecture

The compiler pipeline is: **source -> PEG parse -> AST -> codegen -> JS output**.

- `src/dazscript.pegjs` — PEG grammar (Peggy). Defines all syntax and produces AST nodes directly. This is the single source of truth for what syntax is valid.
- `src/compiler.js` — Loads the grammar, parses source, runs codegen. Returns `{ output, ast }`.
- `src/codegen.js` — Recursive `generate()` function walks the AST and emits JavaScript strings. Also contains the `MODULES` registry and `collectUsedModules()` for runtime module detection.
- `src/cli.js` — CLI entry point. Compiles the file, writes output, and copies any needed runtime modules to `.dazzl_modules/` next to the output.
- `src/modules/` — Runtime modules shipped alongside compiled output. Each module is a standalone Node.js file.

## AST Node Types

| Node Type | Key Fields | Emitted JS |
|---|---|---|
| `Program` | `body[]` | top-level statements joined |
| `VariableDeclaration` | `kind, name, init` | `const x = ...;` |
| `FunctionDeclaration` | `name, params[], body` | `function name(...) { ... }` |
| `ReturnStatement` | `value` | `return ...;` |
| `IfStatement` | `test, consequent, alternate?` | `if (...) { } else { }` |
| `UnlessStatement` | `test, consequent` | `if (!(...)) { }` |
| `ConditionalExpression` | `test, consequent, alternate` | `(test ? a : b)` |
| `ExpressionStatement` | `expression` | `expr;` |
| `BinaryExpression` | `op, left, right` | `left op right` |
| `CallExpression` | `callee, args[]` | `callee(args)` |
| `MemberExpression` | `object, property` | `object.property` |
| `RangeLiteral` | `start, end` | `new _Range(start, end)` |
| `Identifier` | `name` | `name` |
| `NumericLiteral` | `value` | `value` |
| `StringLiteral` | `value` | `"value"` |
| `BooleanLiteral` | `value` | `true`/`false` |
| `SymbolLiteral` | `name` | `Symbol("name")` |

## Adding a New Language Feature

1. **Grammar** (`src/dazscript.pegjs`): Add the syntax rule. Place it in the correct precedence level. If it introduces a new keyword, add it to the `Reserved` rule.
2. **Codegen** (`src/codegen.js`): Add a `case` in the `generate()` switch for the new AST node type.
3. **Test** (`examples/test.daz`): Add usage of the new feature and run `npm test`.
4. **Documentation**: Update `README.md` with user-facing syntax examples, update the AST table in this file, and ensure `examples/test.daz` demonstrates the feature clearly.

## Adding a New Runtime Module

1. Create `src/modules/<name>.js` with `module.exports = { ... }`.
2. Add an entry to the `MODULES` object in `src/codegen.js`:
   ```js
   NodeType: { file: "<name>", symbols: ["ExportedName1", "ExportedName2"] }
   ```
3. The compiler will automatically emit a `require` import and the CLI will copy the module file when that AST node type is present in the source.

**Special case: Kernel module** — The Kernel module is auto-imported when any of its functions are used (detected by identifier name in `KERNEL_FUNCTIONS` set). In Dazzl source, functions are called directly (e.g., `is_integer(x)`), but the codegen transforms these to `Kernel.is_integer(x)` to avoid polluting the JS global namespace.

## Key Design Decisions

- **Peggy PEG grammar**: Single file defines all syntax, no separate lexer. Grammar actions produce AST nodes directly.
- **`==` compiles to `===`**: All equality checks use strict equality in output JS.
- **Implicit returns**: The last `ExpressionStatement` in a function body is automatically converted to a `ReturnStatement` during codegen.
- **No semicolons required**: Newlines act as statement terminators. Semicolons are optional (accepted for multiple statements on one line).
- **Bare assignment defaults to `const`**: `x = 5` emits `const x = 5;`. Use `let` explicitly for mutable bindings.
- **Parentheses optional in conditionals**: `if x > 0 { ... }` and `if (x > 0) { ... }` are both valid. Same for `unless` and postfix forms.
- **Conditional expressions**: `if condition value else other` compiles to JS ternary `(condition ? value : other)`. The `then` keyword is optional: `if x > 0 then "yes" else "no"` and `if x > 0 "yes" else "no"` are equivalent. Without `then`, the condition must be a comparison or simpler expression; with `then` or parentheses, any expression is allowed.
- **Pipe operator desugars in grammar**: `|>` is resolved to `CallExpression` nodes during parsing, not codegen.
- **Runtime modules are file-copied, not bundled**: The CLI copies only the needed `.js` files from `src/modules/` into `.dazzl_modules/` next to the output. This keeps compiled output simple and inspectable.

## Style Notes

- The grammar uses three whitespace rules:
  - `_` — inline whitespace only (spaces, tabs). Used between tokens within a statement/expression.
  - `__` — mandatory inline whitespace. Used where at least one space is required (e.g., after keywords).
  - `_n` — whitespace including newlines. Used at program level, inside blocks, and after statement terminators.
- `EOS` (end of statement) matches `;`, a newline, EOF, or a lookahead `}`. This is what makes semicolons optional.
- `ParamList` is shared by function declarations.
- `buildBinaryExpr` is a grammar helper for left-associative binary operator chains.
