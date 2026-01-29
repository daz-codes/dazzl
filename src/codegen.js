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
      const body = node.body.map((s) => generate(s, indent)).join("\n");
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
