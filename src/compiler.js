const fs = require("fs");
const path = require("path");
const peggy = require("peggy");
const { generate } = require("./codegen");

const grammarSource = fs.readFileSync(
  path.join(__dirname, "dazscript.pegjs"),
  "utf-8"
);
const parser = peggy.generate(grammarSource);

function compile(source) {
  const ast = parser.parse(source);
  const output = generate(ast);
  return { output, ast };
}

module.exports = { compile };
