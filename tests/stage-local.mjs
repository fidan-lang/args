// Stage a copy of the release manifest for integration testing.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export function stageLocalPackage(destination, binary) {
  const source = fs.readFileSync(path.join(root,"dal.toml"),"utf8");
  assert(source.includes('fidan = "=1.1.0"'), "released args requires Fidan 1.1.0");
  const run = args => {
    const result=spawnSync(binary,args,{cwd:root,encoding:"utf8",windowsHide:true,timeout:120000});
    if(result.error)throw result.error;
    assert.equal(result.status,0,`local compiler capability probe failed: ${result.stderr}`);
    return result.stdout;
  };
  assert(run(["run","--jit-threshold","0","tests/parser.fdn"]).includes("args parser checks passed"));
  const version=/\bfidan\s+(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.+-]+)?)/i.exec(run(["--version"]))?.[1];
  assert.equal(version, "1.1.0", "release tests require Fidan 1.1.0");
  fs.mkdirSync(destination); // Never overwrite an existing directory, even for fixtures.
  for(const entry of ["dal.toml","src","tests","examples","assets","README.md","LICENSE","NOTICE","CHANGELOG.md"])
    fs.cpSync(path.join(root,entry),path.join(destination,entry),{recursive:true,errorOnExist:true,force:false});
  assert.equal(fs.readFileSync(path.join(destination,"dal.toml"),"utf8"), source,
    "staging must preserve public release metadata");
  return destination;
}
