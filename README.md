# waarstreamt.het

## Three-agent workflow

Configured for an automated workflow in **VS Code + GitHub Copilot**. Open the repo, ensure Copilot is signed in, and select the **Planner** agent from the chat agent picker.

You spar with the Planner. When you say "go" / "ship it" / "implement it", the Planner writes a task spec, then automatically (via `#runSubagent`) invokes the Developer (Sonnet) — implements + tests + documents — then automatically invokes the Reviewer (Sonnet) — tests + reviews + commits + pushes a branch + opens a draft PR. You merge it manually on GitHub.

### Requirements

- VS Code (recent — `runSubagent` is a 2025+ feature)
- GitHub Copilot subscription with Claude Opus and Sonnet (Pro+ / Business / Enterprise)
- `gh` CLI authenticated (recommended; Reviewer falls back to printing a compare URL otherwise)
- Clean working tree before saying "go"

### Layout

- `.github/agents/*.agent.md` — the three agents
- `.github/instructions/*.instructions.md` — cross-cutting policies
- `tasks/_queue.json` — live status board
- `docs/INDEX.md` — current state of the codebase