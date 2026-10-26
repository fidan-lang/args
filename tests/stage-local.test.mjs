import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stageLocalPackage } from "./stage-local.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
test("actual package staging preserves runtime/metadata and excludes absent development docs", () => {
  const target = path.join(root, "target");
  fs.mkdirSync(target, { recursive: true });
  const scratch = fs.mkdtempSync(path.join(target, "staging-contract-"));
  const binary = process.env.FIDAN_BIN ?? path.resolve(root, "../fidan/target/debug", process.platform === "win32" ? "fidan.exe" : "fidan");
  const destination = path.join(scratch, "args");
  const source = fs.readFileSync(path.join(root, "dal.toml"));
  try {
    stageLocalPackage(destination, binary);
    for (const file of ["src/init.fdn", "src/core.fdn", "src/app.fdn", "assets/completions/args.bash", "assets/completions/args.ps1", "examples/greet.fdn", "tests/parser.fdn", "README.md", "LICENSE", "NOTICE", "CHANGELOG.md"])
      assert.deepEqual(fs.readFileSync(path.join(destination, file)), fs.readFileSync(path.join(root, file)), file);
    assert(!fs.existsSync(path.join(destination, "docs")));
    assert(!fs.readFileSync(path.join(destination, "dal.toml"), "utf8").includes('"docs/**"'));
    assert.match(fs.readFileSync(path.join(destination, "dal.toml"), "utf8"), /STAGING ONLY/);
    assert.deepEqual(fs.readFileSync(path.join(root, "dal.toml")), source);
    assert.throws(() => stageLocalPackage(destination, binary), /exist|EEXIST/i);
  } finally { fs.rmSync(scratch, { recursive: true }); }
});
