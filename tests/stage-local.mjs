// Test-only package staging. Never publish this manifest or change the source minimum.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export function stageLocalPackage(destination, binary) {
  const source = fs.readFileSync(path.join(root,"dal.toml"),"utf8");
  const blocker = 'fidan = "=0.0.0-args-unreleased"';
  assert(source.includes(blocker),"staging applies only to the explicit unreleased source contract");
  const run = args => {
    const result=spawnSync(binary,args,{cwd:root,encoding:"utf8",windowsHide:true,timeout:120000});
    if(result.error)throw result.error;
    assert.equal(result.status,0,`local compiler capability probe failed: ${result.stderr}`);
    return result.stdout;
  };
  assert(run(["run","--jit-threshold","0","tests/parser.fdn"]).includes("args parser checks passed"));
  const version=/\bfidan\s+(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.+-]+)?)/i.exec(run(["--version"]))?.[1];
  assert(version,"compiler must report its exact test version");
  fs.mkdirSync(destination); // Never overwrite an existing directory, even for fixtures.
  for(const entry of ["dal.toml","src","tests","examples","README.md","LICENSE","CHANGELOG.md"])
    fs.cpSync(path.join(root,entry),path.join(destination,entry),{recursive:true,errorOnExist:true,force:false});
  fs.writeFileSync(path.join(destination,"dal.toml"),
    source.replace(blocker,`# STAGING ONLY: capability-probed local source compiler, not a public compatibility claim.\nfidan = "=${version}"`));
  return destination;
}
