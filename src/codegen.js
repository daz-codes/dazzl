// Registry of runtime modules: AST node type -> { file, symbols }
const MODULES = {
  RangeLiteral: { file: "range", symbols: ["_Range", "Range"] },
  Kernel: { file: "kernel", symbols: ["Kernel"] },
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
      const op = node.op === "==" ? "===" : node.op === "!=" ? "!==" : node.op;
      return `${generate(node.left)} ${op} ${generate(node.right)}`;
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

    case "Identifier":
      return node.name;

    case "NumericLiteral":
      return node.value;

    case "StringLiteral":
      return `"${node.value}"`;

    case "SymbolLiteral":
      return `Symbol("${node.name}")`;

    case "BooleanLiteral":
      return node.value ? "true" : "false";

    default:
      throw new Error(`Unknown AST node type: ${node.type}`);
  }
}

module.exports = { generate, collectUsedModules, MODULES };
