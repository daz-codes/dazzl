// Registry of runtime modules: key -> { file, symbols }
// Keys can be AST node types (RangeLiteral) or module names (Integer)
const MODULES = {
  RangeLiteral: { file: "range", symbols: ["_Range", "Range"] },
  Kernel: { file: "kernel", symbols: ["Kernel"] },
  Integer: { file: "integer", symbols: ["Integer"] },
  String: { file: "str", symbols: ["Str"] },
};

// Standard library modules detected by identifier usage
const STDLIB_MODULES = new Set(["Integer", "String"]);

// Dazzl name -> JS name (for avoiding JS built-in collisions)
const STDLIB_ALIASES = {
  String: "Str",
};

// Kernel functions that trigger auto-import and get transformed to Kernel.fn()
const KERNEL_FUNCTIONS = new Set([
  "abs", "div", "rem", "round", "trunc", "max", "min",
  "is_sym", "is_binary", "is_boolean", "is_float", "is_integer",
  "is_list", "is_map", "is_set", "is_object", "is_number", "is_range",
  "and", "or", "not",
  "to_string", "inspect", "length", "tap",
]);

function collectUsedModules(node, used = new Set()) {
  if (!node || typeof node !== "object") return used;
  if (MODULES[node.type]) used.add(node.type);
  // Check for Kernel function usage
  if (node.type === "Identifier" && KERNEL_FUNCTIONS.has(node.name)) {
    used.add("Kernel");
  }
  // Check for stdlib module usage (e.g., Integer.is_even)
  if (node.type === "Identifier" && STDLIB_MODULES.has(node.name)) {
    used.add(node.name);
  }
  for (const v of Object.values(node)) {
    if (Array.isArray(v)) v.forEach((n) => collectUsedModules(n, used));
    else collectUsedModules(v, used);
  }
  return used;
}

// Merge consecutive PatternFunctionClause nodes with the same name into PatternFunctionGroup
// Also merge Haskell-style FunctionDeclarations that follow pattern clauses (catch-all clauses)
function mergePatternFunctions(body) {
  const result = [];
  let i = 0;
  while (i < body.length) {
    const node = body[i];
    if (node.type === "PatternFunctionClause") {
      const name = node.name;
      const clauses = [node];
      i++;
      // Collect consecutive clauses with the same name (including catch-all FunctionDeclarations)
      while (i < body.length) {
        const next = body[i];
        if (next.type === "PatternFunctionClause" && next.name === name) {
          clauses.push(next);
          i++;
        } else if (next.type === "FunctionDeclaration" && next.name === name) {
          // Convert FunctionDeclaration to a catch-all PatternFunctionClause
          const catchAllClause = {
            type: "PatternFunctionClause",
            name: next.name,
            patterns: next.params.map(p => ({ type: "IdentifierPattern", name: p })),
            body: next.body
          };
          clauses.push(catchAllClause);
          i++;
        } else {
          break;
        }
      }
      result.push({ type: "PatternFunctionGroup", name, clauses });
    } else {
      result.push(node);
      i++;
    }
  }
  return result;
}

// Generate condition for a pattern match
function generatePatternCondition(pattern, argName, generate) {
  switch (pattern.type) {
    case "LiteralPattern": {
      const lit = pattern.value;
      if (lit.type === "NilLiteral") {
        return `${argName} == ${lit.value}`;
      }
      return `${argName} === ${generate(lit)}`;
    }
    case "WildcardPattern":
      return null; // No condition needed
    case "IdentifierPattern":
      return null; // No condition needed, just binding
    default:
      throw new Error(`Unknown pattern type: ${pattern.type}`);
  }
}

// Generate the code for a single pattern function clause
function generateClauseCode(clause, argNames, indent, generate) {
  const pad = "  ".repeat(indent);
  const innerPad = "  ".repeat(indent + 1);

  // Build conditions from patterns
  const conditions = [];
  const bindings = [];

  clause.patterns.forEach((pattern, i) => {
    const argName = argNames[i];
    const cond = generatePatternCondition(pattern, argName, generate);
    if (cond) conditions.push(cond);
    if (pattern.type === "IdentifierPattern") {
      bindings.push({ name: pattern.name, arg: argName });
    }
  });

  // Generate body statements with implicit return
  const stmts = [...clause.body.body];
  const last = stmts[stmts.length - 1];
  if (last && last.type === "ExpressionStatement") {
    stmts[stmts.length - 1] = { type: "ReturnStatement", value: last.expression };
  }

  // Build the clause body
  let bodyCode = "";
  if (bindings.length > 0) {
    const bindingStmts = bindings.map(b => `const ${b.name} = ${b.arg};`).join(" ");
    bodyCode = `{ ${bindingStmts} ${stmts.map(s => generate(s, 0)).join(" ")} }`;
  } else {
    bodyCode = stmts.map(s => generate(s, 0)).join(" ");
  }

  if (conditions.length > 0) {
    return `${pad}if (${conditions.join(" && ")}) ${bodyCode}`;
  } else {
    // No conditions, just execute the body (this is a catch-all clause)
    return `${pad}${bodyCode}`;
  }
}

function generate(node, indent = 0) {
  const pad = "  ".repeat(indent);

  switch (node.type) {
    case "Program": {
      const used = collectUsedModules(node);
      const imports = [];
      for (const nodeType of used) {
        const mod = MODULES[nodeType];
        const destructure = mod.symbols.join(", ");
        imports.push(`const { ${destructure} } = require("./.dazzl_modules/${mod.file}");`);
      }
      // Merge consecutive pattern function clauses
      const mergedBody = mergePatternFunctions(node.body);
      const body = mergedBody.map((s) => generate(s, indent)).join("\n");
      return imports.length ? imports.join("\n") + "\n" + body : body;
    }

    case "VariableDeclaration":
      return `${pad}${node.kind} ${node.name} = ${generate(node.init)};`;

    case "FunctionDeclaration": {
      const params = node.params.join(", ");
      const stmts = [...node.body.body];
      const last = stmts[stmts.length - 1];
      if (last && last.type === "ExpressionStatement") {
        stmts[stmts.length - 1] = { type: "ReturnStatement", value: last.expression };
      }
      const body = stmts.map((s) => generate(s, indent + 1)).join("\n");
      return `${pad}function ${node.name}(${params}) {\n${body}\n${pad}}`;
    }

    case "PatternFunctionGroup": {
      // Determine number of parameters from first clause
      const arity = node.clauses[0].patterns.length;
      const argNames = Array.from({ length: arity }, (_, i) => `_arg${i}`);
      const params = argNames.join(", ");

      let body = "";
      for (const clause of node.clauses) {
        body += generateClauseCode(clause, argNames, indent + 1, generate) + "\n";
      }
      body += `${pad}  throw new Error("No pattern matched for ${node.name}");`;

      return `${pad}function ${node.name}(${params}) {\n${body}\n${pad}}`;
    }

    case "ReturnStatement":
      return `${pad}return ${generate(node.value)};`;

    case "UnlessStatement": {
      let out = `${pad}if (!(${generate(node.test)})) {\n`;
      out += node.consequent.body.map((s) => generate(s, indent + 1)).join("\n");
      out += `\n${pad}}`;
      return out;
    }

    case "IfStatement": {
      let out = `${pad}if (${generate(node.test)}) {\n`;
      out += node.consequent.body.map((s) => generate(s, indent + 1)).join("\n");
      out += `\n${pad}}`;
      if (node.alternate) {
        if (node.alternate.type === "IfStatement") {
          out += ` else ${generate(node.alternate, indent).trimStart()}`;
        } else {
          out += ` else {\n`;
          out += node.alternate.body.map((s) => generate(s, indent + 1)).join("\n");
          out += `\n${pad}}`;
        }
      }
      return out;
    }

    case "ExpressionStatement":
      return `${pad}${generate(node.expression)};`;

    case "ConditionalExpression":
      return `(${generate(node.test)} ? ${generate(node.consequent)} : ${generate(node.alternate)})`;

    case "BinaryExpression": {
      let left = generate(node.left);
      const right = generate(node.right);
      if (node.op === "//") {
        return `Math.floor(${left} / ${right})`;
      }
      // Concatenation operator - works for strings and arrays
      if (node.op === "++") {
        return `${left}.concat(${right})`;
      }
      // JS requires parens around unary operand of **
      if (node.op === "**" && node.left.type === "UnaryExpression") {
        left = `(${left})`;
      }
      // Use loose equality for nil checks (catches both null and undefined)
      const isNilCheck = node.left.type === "NilLiteral" || node.right.type === "NilLiteral";
      let op = node.op;
      if (op === "==") op = isNilCheck ? "==" : "===";
      else if (op === "!=") op = isNilCheck ? "!=" : "!==";
      return `${left} ${op} ${right}`;
    }

    case "UnaryExpression": {
      const operand = generate(node.operand);
      // Wrap in parens if operand is also unary or starts with same operator
      if (node.operand.type === "UnaryExpression" || node.operand.type === "BinaryExpression") {
        return `${node.op}(${operand})`;
      }
      return `${node.op}${operand}`;
    }

    case "CallExpression": {
      const args = node.args.map((a) => generate(a)).join(", ");
      // Transform Kernel function calls: abs(x) -> Kernel.abs(x)
      if (node.callee.type === "Identifier" && KERNEL_FUNCTIONS.has(node.callee.name)) {
        return `Kernel.${node.callee.name}(${args})`;
      }
      return `${generate(node.callee)}(${args})`;
    }

    case "MemberExpression":
      return `${generate(node.object)}.${node.property}`;

    case "RangeLiteral":
      return `new _Range(${generate(node.start)}, ${generate(node.end)})`;

    case "ArrayLiteral":
      return `[${node.elements.map(e => generate(e)).join(", ")}]`;

    case "ObjectLiteral": {
      if (node.properties.length === 0) return "{}";
      const props = node.properties.map(p => {
        if (p.shorthand) return p.key;
        return `${p.key}: ${generate(p.value)}`;
      });
      return `{ ${props.join(", ")} }`;
    }

    case "Identifier":
      return STDLIB_ALIASES[node.name] || node.name;

    case "NumericLiteral":
      return node.value;

    case "StringLiteral": {
      // Escape for JS double-quoted string
      const escaped = node.value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t');
      return `"${escaped}"`;
    }

    case "InterpolatedString": {
      // Emit JS template literal
      const parts = node.parts.map(p => {
        if (p.type === "literal") {
          // Escape backticks and ${
          return p.value
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\$\{/g, '\\${');
        } else {
          return '${' + generate(p.expr) + '}';
        }
      });
      return '`' + parts.join('') + '`';
    }

    case "SymbolLiteral":
      return `Symbol.for("${node.name}")`;

    case "BooleanLiteral":
      return node.value ? "true" : "false";

    case "NilLiteral":
      return node.value;

    default:
      throw new Error(`Unknown AST node type: ${node.type}`);
  }
}

module.exports = { generate, collectUsedModules, MODULES };
