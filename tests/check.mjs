// Run from any working directory. All artifacts stay local under target/.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, readFileSync } from "node:fs";
import { stageLocalPackage } from "./stage-local.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const binary =
  process.env.FIDAN_BIN ??
  path.resolve(
    root,
    "../fidan/target/debug",
    process.platform === "win32" ? "fidan.exe" : "fidan",
  );
assert.equal(createHash("sha256").update(readFileSync(path.join(root,"LICENSE"))).digest("hex"),
  "cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30");
assert(readFileSync(path.join(root,"NOTICE"),"utf8").includes("Copyright"));
assert(readFileSync(path.join(root,"dal.toml"),"utf8").includes('license = "Apache-2.0"'));
const useLlvm = process.argv.includes("--llvm");
assert(
  process.argv.slice(2).every((value) => value === "--llvm"),
  "Only --llvm is supported",
);
function invoke(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    timeout: 120000,
  });
  if (result.error) throw result.error;
  return result;
}
function run(command, args) {
  const result = invoke(command, args);
  assert.equal(result.status, 0, `${command} failed: ${result.stderr}`);
  return result.stdout;
}
function fails(command, args) {
  const result = invoke(command, args);
  assert.notEqual(result.status, 0, "uncaught ArgumentError must fail the CLI");
  assert(result.stderr.includes("Unknown option"), result.stderr);
  assert(!result.stdout.includes("Hello,"), "invalid arguments must not invoke the handler");
}
const regressionCases = [
  ["parser", "args parser checks passed"],
  ["app", "args app checks passed"],
  ["groups", "args group checks passed"],
  ["options", "args option checks passed"],
  ["completion", "args completion checks passed"],
];
const exampleCases = [
  ["greet", ["--name", "Dal Person", "--verbose"], "Greeting Dal Person\nHello, Dal Person!"],
  ["single", ["--name", "Dal Person"], "Hello, Dal Person!"],
  ["greet", ["--args-complete", "--v"], "--verbose\n--version"],
  ["multi", ["--args-complete", "b"], "build"],
  ["group", ["--args-complete", "ops", "d"], "deploy"],
  ["multi", ["hello", "--name", "Dal Person"], "Hello, Dal Person!"],
  ["multi", ["build", "--release"], "release"],
  ["group", ["--verbose", "operations", "deploy", "--environment", "prod"], "verbose\nDeploy prod"],
];
const normalized = text => text.trim().replaceAll("\r", "");
for (const shell of ["bash", "zsh", "fish"]) {
  assert(!readFileSync(path.join(root, `assets/completions/args.${shell}`)).includes(13),
    `args.${shell} must retain LF for Unix shells`);
}

for (const directory of ["src", "tests", "examples"])
  run(binary, ["format", "--check", directory]);
let interpreterExecutions = 0;
let nativeExecutions = 0;
for (const threshold of ["0", "1"]) {
  for (const [name, expected] of regressionCases) {
    assert(run(binary, ["run", "--jit-threshold", threshold, `tests/${name}.fdn`]).includes(expected));
    interpreterExecutions++;
  }
  for (const [name, args, expected] of exampleCases) {
    for (const separator of [[], ["--"]]) {
      assert.equal(normalized(run(binary, ["run", "--jit-threshold", threshold,
        `examples/${name}.fdn`, ...separator, ...args])), expected);
      interpreterExecutions++;
    }
  }
}
for (const threshold of ["0", "1"]) {
  fails(binary, ["run", "--jit-threshold", threshold, "examples/greet.fdn", "--", "--does-not-exist"]);
  interpreterExecutions++;
}
for (const backend of ["cranelift", ...(useLlvm ? ["llvm"] : [])]) {
  mkdirSync(path.join(root, "target"), { recursive: true });
  const compile = (file, name) => {
    const output = path.join(root, "target", `${name}-${backend}${process.platform === "win32" ? ".exe" : ""}`);
    run(binary, ["build", "--backend", backend,
      ...(backend === "llvm" ? ["--lto", "full"] : []), file, "-o", output]);
    return output;
  };
  for (const [name, expected] of regressionCases) {
    assert(run(compile(`tests/${name}.fdn`, name), []).includes(expected));
    nativeExecutions++;
  }
  const examples = new Map();
  for (const [name, args, expected] of exampleCases) {
    if (!examples.has(name)) examples.set(name, compile(`examples/${name}.fdn`, name));
    assert.equal(normalized(run(examples.get(name), args)), expected);
    nativeExecutions++;
  }
  for (const [args, expected] of [
    [["--name", "Dal"], "Hello, Dal!"],
    [["--version"], "0.1.0"],
  ]) {
    assert.equal(normalized(run(examples.get("greet"), args)), expected);
    nativeExecutions++;
  }
  assert(run(examples.get("greet"), ["--help"]).includes("Usage: greet"));
  assert(run(examples.get("group"), ["ops", "--help"]).includes("deploy"));
  nativeExecutions += 2;
  fails(examples.get("greet"), ["--does-not-exist"]);
  nativeExecutions++;
}
run(binary, ["dal", "package", ".", "--output", "target/args-0.1.0.tar.gz"]);
const archiveEntries = run("tar", ["-tf", "target/args-0.1.0.tar.gz"]).replaceAll("\\", "/").split(/\r?\n/);
for (const file of ["src/init.fdn", "src/core.fdn", "src/app.fdn", "LICENSE", "NOTICE",
  ...["bash", "zsh", "fish", "ps1"].map(shell => `assets/completions/args.${shell}`)]) {
  assert(archiveEntries.some(entry => entry.endsWith(`/${file}`)), `missing packaged ${file}`);
}
assert(!archiveEntries.some(entry => /\/(?:target|node_modules|\.git)\//.test(entry)));

const staging=path.join(root,"target",`args-staged-${process.pid}-${Date.now()}`);
try {
  stageLocalPackage(staging,binary);
  run(binary,["dal","package",staging,"--output","target/args-local-validation.tar.gz"]);
} finally { rmSync(staging,{recursive:true,force:true}); }
console.log(
  `args: formatting, ${interpreterExecutions} interpreter/JIT executions, ${nativeExecutions} native executions (${useLlvm ? "Cranelift/LLVM full LTO" : "Cranelift"}), all regression files/examples, both argv forms and canonical packaging passed.`,
);
