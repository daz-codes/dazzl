#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { compile } = require("./compiler");
const { collectUsedModules, MODULES } = require("./codegen");

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: dazzl <file.daz>");
  process.exit(1);
}

if (!inputPath.endsWith(".daz")) {
  console.error("Error: Input file must have .daz extension");
  process.exit(1);
}

const source = fs.readFileSync(inputPath, "utf-8");

try {
  const { output, ast } = compile(source);
  const outputPath = inputPath.replace(/\.daz$/, ".js");
  fs.writeFileSync(outputPath, output + "\n");
  console.log(`✨ Dazzling... ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);

  // Copy needed runtime modules alongside the output
  const used = collectUsedModules(ast);
  if (used.size > 0) {
    const outDir = path.dirname(outputPath);
    const modulesDir = path.join(outDir, ".dazzl_modules");
    if (!fs.existsSync(modulesDir)) {
      fs.mkdirSync(modulesDir, { recursive: true });
    }
    const srcModulesDir = path.join(__dirname, "modules");

    // Collect all modules including dependencies
    const toCopy = new Set();
    const addWithDeps = (key) => {
      if (toCopy.has(key)) return;
      toCopy.add(key);
      const mod = MODULES[key];
      if (mod.deps) {
        mod.deps.forEach(dep => addWithDeps(dep));
      }
    };
    for (const key of used) {
      addWithDeps(key);
    }

    for (const key of toCopy) {
      const mod = MODULES[key];
      const srcFile = path.join(srcModulesDir, `${mod.file}.js`);
      const destFile = path.join(modulesDir, `${mod.file}.js`);
      fs.copyFileSync(srcFile, destFile);
    }
  }
} catch (err) {
  console.error(`Compile error: ${err.message}`);
  process.exit(1);
}
