# Changelog

## 0.1.0 — 2026-11-06

- Add searchable CLI/argument-parsing keywords and command-line categories.

- Advertise version in help/completion only with nonblank metadata; preserve inherited
  and overridden group versions and typed failures for unconfigured version requests.

- Add instance-scoped multi-command apps, aliases, nested groups and scoped global hooks.
- Add reflected primitive lists, environment-backed options, choices and validators.
- Add non-evaluating command/flag/choice completion with Bash, Zsh, Fish and PowerShell adapters.
- Include all modules, documentation and completion assets in canonical DAL archives.
- Test interpreter, JIT, Cranelift and LLVM execution with Fidan 1.1.0.

- Raise ArgumentError for --version without configured version metadata.
- Require Fidan 1.1.0 and preserve the release manifest during staging.

### Initial development (2026-10-18)

- Command callbacks derive parameter names, types and defaults from compiler metadata.
- `@command` validates signatures; `run(callback)` converts arguments and invokes
  named actions, inline actions or captured closures.
- Typed `ArgumentError` exceptions replace error-result dictionaries.
- Positionals, options, Boolean flags, defaults, help/version and pass-through.
- Replaces the earlier dictionary-schema prototype.
