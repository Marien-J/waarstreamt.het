---
applyTo: '**'
---

# Git policy

- Branches: `agent/<slug>`, slug = `YYYYMMDD-<short-kebab-name>`.
- One commit per task. Format: `<slug>: <one-line summary>`. Body links to the task file.
- Only the Reviewer agent runs git commands.
- All PRs are DRAFT. User merges manually.
- Never force-push, rebase, or amend without explicit human direction.
- If the diff contains anything that looks like a secret/key/token, halt and surface to user.
