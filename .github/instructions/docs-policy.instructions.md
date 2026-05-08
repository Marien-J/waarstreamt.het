---
applyTo: '**'
---

# Documentation policy

Docs are code in this repo.

- `docs/INDEX.md` is the canonical entry point. Every feature doc and ADR links from here.
- `docs/features/<slug>.md` — one per task, ≤ one screen, written by the Developer.
- `docs/architecture/decisions/<NNN>-<short-name>.md` — ADRs (Context / Decision / Consequences).
- When the Developer touches a file, they re-read related docs and either update them or delete them. Stale docs are worse than no docs.
- The Planner reads `docs/INDEX.md` first when sparring with the user.
