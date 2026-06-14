# General Practices

- Follow existing code style (Biome enforces)
- `biome check` + `tsc --noEmit` before commit
- Simple, readable code
- Conventional Commits, atomic changes, feature branches
- Review before merge
- Document public APIs and complex business logic
- Keep READMEs updated
- Handle errors gracefully, never expose internals to users
- Log errors for debugging
- Automate tests in CI, use quality gates, monitor production
