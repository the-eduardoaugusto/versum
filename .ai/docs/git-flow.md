# Git Flow

## Branch Structure
```
main (production)
└── development (integration)
     ├── feat/<name> | fix/<name> | refactor/<name> | docs/<name> | chore/<name>
     ├── release/<version>
     └── hotfix/<name>
```

## Standard Flow
1. Branch from `development`
2. Develop + commit
3. PR → `development` → merge after review
4. Release: `development` → `release/x.y.z` → `main`

## After Merge
```bash
git checkout development && git pull origin development
git checkout main && git pull origin main
git branch -d <branch> && git push origin --delete <branch>
git checkout development
```

## AI Agent Rules
| Type | Branch example |
|------|----------------|
| Feature | `feat/ai-add-dark-mode` |
| Fix | `fix/ai-login-redirect` |
| Refactor | `refactor/ai-extract-service` |
| Docs | `docs/ai-update-readme` |
| Chore | `chore/ai-remove-dead-code` |

- Never work on `development` directly
- Verify: `git branch --show-current`
- Never force push
- `biome check` + `tsc --noEmit` before each commit
- PR always targets `development`

## Starting Task (AI)
```bash
git branch --show-current  # must NOT be development
git stash
git pull origin development --rebase
git stash pop
git checkout -b feat/ai-<desc> development
```

## Conventional Commits
`<type>(<scope>): <description>`

Types: `feat` | `fix` | `refactor` | `docs` | `chore` | `test` | `style` | `perf`

Scopes: `api` | `client` | `landing` | `logger` | `ai` | `ci`
