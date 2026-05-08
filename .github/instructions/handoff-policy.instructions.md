---
applyTo: '**'
---

# Handoff & orchestration policy

## Slug
`YYYYMMDD-<short-kebab-name>`. Example: `20260508-add-auth-middleware`.

## Status states (`tasks/_queue.json`)
- `READY_FOR_DEV` — Planner finished spec.
- `IN_DEV` — Developer implementing.
- `BLOCKED` — Developer hit blocker after exhausting Q&A budget.
- `READY_FOR_REVIEW` — Developer done.
- `IN_REVIEW` — Reviewer reviewing.
- `NEEDS_HUMAN` — Reviewer escalated.
- `DONE` — Branch pushed, draft PR open.

## Loop caps (hard — do not exceed)
- Developer ↔ Planner Q&A: 3 per task.
- Reviewer → Developer fix cycles: 2 per task.

After cap → escalate by setting status `BLOCKED`/`NEEDS_HUMAN` and returning control upward.

## What humans do
- Spar with Planner.
- Approve by saying "go" / "ship it".
- Review and merge the draft PR on GitHub.

Everything else is automated.
