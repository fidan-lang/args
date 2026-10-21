// Run from any working directory. All artifacts stay local under target/.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
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
const useLlvm = process.argv.includes("--llvm");
assert(
  process.argv.slice(2).every((value) => value === "--llvm"),
  "Only --llvm is supported",
);
function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    timeout: 120000,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} failed: ${result.stderr}`);
  return result.stdout;
}
for (const file of ["src/init.fdn", "tests/parser.fdn", "examples/greet.fdn"])
  run(binary, ["format", "--check", file]);
for (const threshold of ["0", "1"])
  assert(
    run(binary, [
      "run",
      "--jit-threshold",
      threshold,
      "tests/parser.fdn",
    ]).includes("args parser checks passed"),
  );
for (const backend of ["cranelift", ...(useLlvm ? ["llvm"] : [])]) {
  mkdirSync(path.join(root, "target"), { recursive: true });
  const output = path.join(
    root,
    "target",
    `parser-${backend}${process.platform === "win32" ? ".exe" : ""}`,
  );
  run(binary, [
    "build",
    "--backend",
    backend,
    ...(backend === "llvm" ? ["--lto", "full"] : []),
    "tests/parser.fdn",
    "-o",
    output,
  ]);
  assert(run(output, []).includes("args parser checks passed"));
  const greet = path.join(
    root,
    "target",
    `greet-${backend}${process.platform === "win32" ? ".exe" : ""}`,
  );
  run(binary, [
    "build",
    "--backend",
    backend,
    ...(backend === "llvm" ? ["--lto", "full"] : []),
    "examples/greet.fdn",
    "-o",
    greet,
  ]);
  assert.equal(run(greet, ["--name", "Dal"]).trim(), "Hello, Dal!");
  assert(run(greet, ["--help"]).includes("Usage: greet"));
  assert.equal(run(greet, ["--version"]).trim(), "0.1.0");
}
for (const separator of [[], ["--"]])
  assert.equal(
    run(binary, [
      "run",
      "examples/greet.fdn",
      ...separator,
      "--name",
      "Dal",
    ]).trim(),
    "Hello, Dal!",
  );
run(binary, ["dal", "package", ".", "--output", "target/args-0.1.0.tar.gz"]);
const staging=path.join(root,"target",`args-staged-${process.pid}-${Date.now()}`);
try {
  stageLocalPackage(staging,binary);
  run(binary,["dal","package",staging,"--output","target/args-local-validation.tar.gz"]);
} finally { rmSync(staging,{recursive:true,force:true}); }
console.log(
  `args: formatting, interpreter/JIT, ${useLlvm ? "Cranelift/LLVM full LTO" : "Cranelift"}, both argv forms and canonical packaging passed.`,
);
