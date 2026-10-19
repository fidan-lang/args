# Changelog

## 0.1.0 — local candidate, 2026-10-18

- Command callbacks derive parameter names, types and defaults from compiler metadata.
- `@command` validates signatures; `run(callback)` converts arguments and invokes
  named actions, inline actions or captured closures.
- Typed `ArgumentError` exceptions replace error-result dictionaries.
- Positionals, options, Boolean flags, defaults, help/version and pass-through.
- Replaces the earlier unpublished dictionary-schema prototype. Not tagged or published.
