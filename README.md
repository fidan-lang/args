# args 0.1.0 - local release candidate

A dependency-free Fidan argument parser. Not published; no production registry availability is claimed. The manifest range >=1.0.16,<2.0.0 is a local compatibility placeholder, not proof that the published 1.0.16 native backends can run this package. Real package tests exposed compiler fixes on the audit branch (nullable/Dynamic values and file-scoped imports). **Before publishing, select approved compiler/helper patch versions and tighten the minimum compiler constraint to that fixed release.** Uses the existing Fidan license included in LICENSE; owner approval of package licensing is a release gate.

`parse(argv, specification)` accepts a list of strings (for example `std.env.args()`) and a dictionary mapping long option names to `{kind: "flag" | "value", short?: string, default?: value, required?: boolean}`. Keys in source dictionaries must be quoted. Returns `values`, `positionals`, `passthrough`, and `error`. Empty error means success. Unknown options/missing values are errors. Values use last occurrence wins; flags are idempotent. `--name=value`, `--name value`, `-nvalue`, `-n=value` and combined short flags are supported. `--` ends parsing: remaining tokens appear in both positionals and passthrough. Lone `-` and negative numeric tokens are positional. A value option consumes the next token literally except `--`; use `--name=--literal` when clarity matters.

`-h/--help` and `-V/--version` are reserved flag names and bypass required-option checks. `help(program, version, description, specification)` returns help text; the caller decides when to print it. Parsing never exits the host or reads environment/files itself. `integer_value(value,name)` and `float_value(value,name)` return `{value,error}` with friendly conversion errors, using Fidan's existing conversions.

Run `../fidan/target/debug/fidan run tests/parser.fdn` (add `.exe` on Windows). Package locally with `fidan dal package . --output target/args-0.1.0.tar.gz`. Local registry install and native validation are required before owner-approved publication. Schema configuration must contain the documented kinds and field types; it is programmer input, not another dynamically typed schema language.


Local reproducible gate (Node 24 is development tooling only):

```sh
node tests/check.mjs
# With the matching private audit LLVM helper installed in an isolated FIDAN_HOME:
node tests/check.mjs --llvm
```

`FIDAN_BIN` may override the compiler path. The shared Dal integration runner additionally
publishes this candidate only to a disposable local registry, installs it into a fresh
consumer and builds/runs a CLI entry. No registry account, public name reservation,
production compatibility or publication is implied. License approval and the corrected
compiler minimum remain owner release gates.
