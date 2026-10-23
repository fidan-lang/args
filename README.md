# args — signature-driven command lines for Fidan

Define ordinary typed actions. `args` reads their names, parameter types, arity
and defaults from the compiler, converts arguments and invokes the selected
callback. No second option-type dictionary, global command registry or error key
is required. Invalid arguments raise an `ArgumentError`.

This is the local, unpublished 0.1.0 candidate for the coordinated **future
compiler / protocol-8 LLVM helper** release. The published Fidan 1.0.16 binary
does not implement this API; that is a release boundary, not a defect in the
candidate. The source manifest's `=0.0.0-args-unreleased` sentinel deliberately
prevents accidental installation with an older public compiler. Local staging
probes actual compiler capabilities and writes an exact-version copy only. The
proposed compiler version lives in the sibling compiler's
`config/release-candidate.json`; no package publication is claimed here.

## One command

```fidan
use args.{run}

action greet with (optional name oftype string = "Dal") {
    print("Hello, " + name + "!")
}

run(greet, program = "greet", version = "0.1.0")
```

```sh
fidan run examples/single.fdn -- --name "Dal Person"
# Hello, Dal Person!
fidan run examples/single.fdn -- --help
```

The checked-in examples use relative imports so they work before publication;
the documented `use args` form applies to an installed package. `@command` is an
optional eager signature check. It does not register the action: `run` performs
the same validation without the decorator. Ordinary `callback(a, b)` calls remain
normal Fidan; generic `callback.invoke(list)` supplies the runtime-computed argv.

## Multiple commands

```fidan
use args.{App}

action greet with (optional name oftype string = "Dal") {
    print("Hello, " + name + "!")
}

action build with (optional release oftype boolean = false) {
    print("release" if release else "debug")
}

var app = App("mytool", "0.1.0", "An example with two commands")

app.add("greet", greet, "Greet someone", ["hello"])
app.add("build", build, "Select a build mode")
app.run()
```

```sh
fidan run examples/multi.fdn -- hello --name Ada
# Hello, Ada!
fidan run examples/multi.fdn -- build --release
# release
fidan run examples/multi.fdn -- --help
```

Each App owns its registrations. Duplicate command/alias names are rejected;
one app cannot overwrite another's commands. `add` returns a command definition.
Unknown commands raise `ArgumentError` and include available matching initials
as hints. Help lists descriptions and aliases; it does not execute callbacks.

## Groups and scoped global flags

```fidan
use args.{App}

action flags with (optional verbose oftype boolean = false) {
    if verbose {
        print("verbose")
    }
}

action deploy with (optional environment oftype string = "dev") {
    print("Deploy " + environment)
}

var operations = App(description = "Operations commands")

operations
    .add("deploy", deploy)
    .option("environment", env = "FIDAN_EXAMPLE_ENV", choices = ["dev", "prod"])

var app = App("mytool", "0.1.0")

app.globals(flags)
app.group("ops", operations, "Deployment commands", ["operations"])
app.run()
```

```sh
fidan run examples/group.fdn -- --verbose operations deploy --environment prod
# verbose
# Deploy prod
fidan run examples/group.fdn -- ops --help
fidan run examples/group.fdn -- ops deploy --help
```

Global options precede their own command token. Groups use the same routing at
every level; a child inherits its parent's version unless it provides its own.
All levels parse successfully before any hook runs. Hooks then run outermost
first, followed by the leaf action. A failure/help/version at any level does not
run earlier hooks. The return value is the leaf callback's value. Cyclic group
registration is rejected.

## Options, environment, choices and validation

Types and defaults stay in the action signature. Extra option policy refers to
an existing parameter, without repeating its type:

```fidan
use args.{App}

action deploy with (optional environment oftype string = "dev") {
    print(environment)
}

var app = App("mytool", "0.1.0")
app.add("deploy", deploy).option(
    "environment", aliases = ["--env", "-e"],
    env = "MYTOOL_ENV", choices = ["dev", "prod"],
    validator = action with (certain value oftype string) returns boolean {
        return value != ""
    },
)
app.run()
```

CLI values override environment values, which override normal callback defaults.
Supplied values are converted before choices and the Boolean validator are
checked. Validators may capture state; their exceptions propagate. Computed
callback defaults remain deferred to actual invocation, so reading metadata,
help and completion cannot evaluate them. Environment-backed lists use a
configurable separator (`,` by default).

## Parameter and error contract

- Scalars: string, integer, float, Boolean. Typed lists of these primitives work
  as repeated options; a final list also collects remaining positionals.
- Parameters without `optional` are required; `certain` preserves the language's
  non-Nothing validation. Omitted optional values retain their callback defaults.
- Long options replace underscores with hyphens. Unique ASCII initials become
  short options except `-h`/`-V`; collisions leave long options only.
- Boolean switches use `--flag`/`--no-flag`. Scalar/Boolean duplicates keep the last
  value; repeated list options append in source order. Long abbreviations are not
  accepted; explicit aliases are checked for collisions.
- Values support `--name=value`, `--name value`, `-nvalue`, `-n=value`; short Boolean
  switches can be combined. `--` ends options; negative numbers are positional
  without escaping. A value option consumes its next token literally except `--`.
- `--help`/`-h` and `--version`/`-V` do not invoke handlers/defaults or require missing
  positionals. Version output requires a nonblank configured version. `help` and
  `version` are reserved parameter names.
- Unsupported callback signature types fail explicitly. Stdlib functions whose
  metadata does not expose concrete parameter types are not command definitions.
- Parse errors throw `ArgumentError` with `message` and `parameter`. Catch it using
  normal typed catches to render stderr or implement a chosen application exit
  policy. Callback errors propagate unchanged. The reusable library never exits
  the process; an uncaught error follows the compiler's normal nonzero failure.
- Help is plain text, with no ANSI/TTY requirement. Choices and supplied values
  retain their actual Fidan types; no surprise stringification reaches callbacks.

## Public API

| API | Result / purpose |
|---|---|
| `run(callback, argv?, program?, version?, description?, settings?)` | Single command; callback result or Nothing for handled help/version/completion |
| `command(callback)` | Validate a signature and return the same callback; optional decorator |
| `help(callback, program?, version?, description?, settings?)` | Non-evaluating help text |
| `CommandOption(parameter, aliases?, env?, choices?, validator?, separator?)` | Extra policy for single-command `settings` |
| `App(program?, version?, description?)` | Independent application instance |
| `app.add(name, callback, description?, aliases?)` | Register command; return CommandDefinition |
| `definition.option(parameter, aliases?, env?, choices?, validator?, separator?)` | Attach checked option policy; return definition |
| `app.group(name, group, description?, aliases?)` | Compose child App; return child |
| `app.globals(callback)` | Register scoped options/hook once; return CommandDefinition |
| `app.run(argv?)` | Parse complete command chain, then invoke hooks/leaf |
| `app.help()` / `app.complete(words)` | Pure help / completion candidates |
| `complete(callback, words, settings?)` | Single-command completion candidates |

`argv` defaults to `std.env.args()`. Internal parser/catalog/plan objects are
implementation details, even though Fidan's file re-exports expose their names.
Do not mutate registrations' fields directly; use checked add/group/option APIs.

## Shell completion

Compile the CLI, source its adapter, and register its executable name:

```sh
source /path/to/args/assets/completions/args.bash
complete -F _fidan_args_complete mytool
# Zsh (after compinit):
source /path/to/args/assets/completions/args.zsh
compdef _fidan_args_complete mytool
# Fish:
source /path/to/args/assets/completions/args.fish
complete -c mytool -f -a '(fidan_args_complete mytool)'
```

```powershell
. /path/to/args/assets/completions/args.ps1
Register-FidanArgsCompletion -CommandName mytool
```

The reserved `--args-complete` entry receives tokens and an optional empty final
word, then prints one candidate per line. Adapters pass argument arrays and never
evaluate candidate text. Completion does not call handlers, defaults or validators.
Candidates containing newlines are omitted. This initial protocol offers command,
flag and declared-choice completion; it does not auto-install itself in profiles.
PowerShell deliberately declines nonliteral expression arguments instead of
executing them. No shell profile is changed by the package or its tests.

## Validation and release boundary

```sh
node tests/check.mjs --llvm
bash tests/completion-adapters.bash
zsh tests/completion-adapters.zsh
fish tests/completion-adapters.fish
pwsh -NoProfile -File tests/completion-adapters.ps1
```

`FIDAN_BIN` selects the actual candidate. The LLVM option requires its matching
helper in isolated `FIDAN_HOME`; without `--llvm` the runner checks Cranelift.
The runner checks every regression file and example, both argv forms, interpreter
thresholds 0/1, native executions, formatting, canonical archive packaging and
included adapter files. Shell adapter tests execute real shell syntax with
controlled token sources; they are not claims of interactive GUI shell coverage.
See [the API design](docs/CLI_API_DESIGN.md) and
[the scoped argparse/Typer comparison](docs/ARGPARSE_TYPER_COMPARISON.md).

Release approval and publishing a supporting compiler/helper/package are external
gates. The sentinel will be replaced with the real coordinated release constraint
only when that release is approved. It must not be changed to claim compatibility
with the installed old public binary merely to make local tests pass.

## License

The unmodified [Apache License 2.0](LICENSE), with attribution in [NOTICE](NOTICE),
permits commercial use, modification and redistribution. Branding/endorsement is
separate; truthful descriptive references are allowed. See
[Fidan's trademark policy](https://github.com/fidan-lang/fidan/blob/main/TRADEMARKS.md).

### Compiler diagnostics versus application options

With the upcoming Fidan compiler candidate, `fidan -vv run examples/single.fdn -- --help`
enables compiler DEBUG diagnostics on stderr and forwards `--help` to the args
application. Put Fidan's `-v`/`-vv`/`-vvv` before the source path. Flags after
`--` belong entirely to your CLI; args callbacks and application stdout are
unchanged. The published compiler 1.0.16 does not provide these diagnostic flags.
