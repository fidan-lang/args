# args — signature-driven command lines for Fidan

Local, unpublished `0.1.0` candidate. **RELEASE-ONLY BLOCKER:** published Fidan
1.0.16 does not implement the required callable metadata/invocation contract.
`dal.toml` deliberately uses the non-release sentinel `=0.0.0-args-unreleased`;
normal installation must fail until an owner-approved compatible compiler and
protocol-8 LLVM helper are released and this minimum is replaced. No release
number is selected by this source change. Local fixture validation copies a
staging-only manifest after executing the parser suite with the actual local CLI.

 Define a normal typed action: `args` reads its
parameter names, types and defaults from the compiler, converts CLI arguments and
calls that action. There is no handwritten option dictionary or error-result object.

```fdn
use args.{command, run}

@command
action greet with (
    optional name oftype string = "Dal",
    optional verbose oftype boolean = false,
) {
    if verbose { print("Greeting " + name) }
    print("Hello, " + name + "!")
}

run(greet)
```

```sh
fidan run greet.fdn -- --name Ada --verbose
fidan run greet.fdn -- -nAda -v
fidan run greet.fdn -- --help
```

The checked-in example uses the existing relative file import so it runs before
publication: `fidan run examples/greet.fdn -- --name Ada`. The `use args` form is
verified after installation from the disposable local Dal registry; public
installation requires an owner-approved publication first.

## Signature contract

- Parameters without `optional`/a default are required positionals, also accepted
  as named options. `certain` additionally preserves Fidan's non-Nothing contract.
- Optional parameters retain their Fidan defaults. Computed defaults execute only
  when the callback is invoked, never while generating help or reading metadata.
- Supported parameter types: `string`, `integer`, `float`, `boolean`; a final
  `list oftype string` collects remaining positionals. An omitted optional rest
  parameter uses its callback default; a certain rest parameter receives `[]`
  when empty.
- Long names replace underscores with hyphens. Unique ASCII initials become short
  names, excluding reserved `-h` and `-V`. Colliding initials have long names only.
- Boolean flags accept `--verbose` / `--no-verbose`; defaults may be true or false.
- Value options accept `--name=value`, `--name value`, `-nvalue` and `-n=value`.
  Short flags may be combined. Repeated options use the last supplied value.
- `--` ends option parsing. Remaining strings are positionals even when beginning
  with `-`. Lone `-` and negative numbers are positionals without escaping.
- A value option consumes the next token literally except `--`; `--name=--help`
  passes that text. `--help`/`-h` and `--version`/`-V` do not call the callback or
  require missing positionals. `help` and `version` are reserved parameter names.
- Unsupported signature types fail explicitly. Stdlib callable metadata currently
  erases parameter types, so stdlib functions are not typed command definitions.

`@command` validates the signature using the existing decorator mechanism; it
neither replaces the action nor installs a global command registry. `run` performs
the same validation for undecorated actions, inline actions and captured closures.
The return value is the callback's return value, or `nothing` for help/version.

```fdn
use args.{run, ArgumentError}

attempt {
    run(greet, argv set ["--unknown"])
} catch error oftype ArgumentError {
    eprint(error.message)
}
```

This assumes `greet` is defined as above. Invalid options, missing arguments,
unsupported signatures and conversion failures **throw an `ArgumentError`** with
`message` and `parameter` fields. They never become a dictionary's `error` key.
Callback exceptions propagate unchanged. Error objects use Fidan's existing typed
catch semantics. Parsing does not exit the host process.

`run(callback, argv?, program?, version?, description?)` defaults `argv` to
`std.env.args()` and `program` to the action's name. Supply optional settings using
Fidan named arguments. `help(callback, program?, version?, description?)` returns
text without invoking the callback. Pass a non-blank version string when using `--version`; absent/blank version metadata
raises `ArgumentError` rather than printing an empty success line.

## Local verification and release boundary

```sh
node tests/check.mjs
# Matching private audit LLVM helper in an isolated FIDAN_HOME:
node tests/check.mjs --llvm
```

`FIDAN_BIN` overrides the compiler location. The gate checks formatting, interpreter
thresholds 0/1, Cranelift AOT, optional LLVM full LTO, real CLI arguments, help/version
and canonical archive packaging. The Dal local gate also publishes to a disposable
registry, installs the package into a fresh consumer, then runs/builds that consumer.
No production publication, tag or public availability is claimed.

This API requires the **audit compiler candidate**, including `action.parameters`
and `action.invoke(list)`, and matching LLVM helper protocol **8** for LLVM AOT.
Published Fidan 1.0.16 / older helpers do not provide this API. The source manifest
intentionally uses `=0.0.0-args-unreleased` to block normal installation. Only the
capability-probed staging copy receives an exact local compiler version. Before
publication, the owner must select coordinated compiler/helper release versions and
replace the sentinel with the actual supporting public release constraint.
The proposed pair and isolated release-preparation command are maintained in
`fidan/config/release-candidate.json` and `fidan/scripts/prepare-release-candidate.py`
in the sibling compiler checkout; these are not published release metadata. The package is Apache-2.0; release approval and a supporting compiler remain
separate gates.

## License

Licensed under the unmodified [Apache License 2.0](LICENSE), with attribution in
[NOTICE](NOTICE). Commercial use, modification and redistribution are permitted.
The library does not grant official Fidan branding or endorsement; truthful
descriptive references are allowed. See the separate
[Fidan trademark policy](https://github.com/fidan-lang/fidan/blob/main/TRADEMARKS.md).
