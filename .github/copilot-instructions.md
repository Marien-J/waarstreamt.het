# Repo-wide Copilot instructions

Three-agent automated workflow:

- **Planner** (Claude Opus) — user's sparring partner. Defines tasks. Orchestrates the others.
- **Developer** (Claude Sonnet) — implements. Writes tests. Maintains docs.
- **Reviewer** (Claude Sonnet) — reviews, runs tests, owns all git operations.

Human does only (a) sparring with Planner and (b) merging the final draft PR. Everything else is automatic via `#runSubagent`.

Cross-cutting policies live in `.github/instructions/`. Read `docs/INDEX.md` for current codebase state before suggesting changes.
