# DECISIONS

## Data & sync model

### Unit of sync: mutations

Every user action becomes an append-only **mutation** with:

- `id` — UUID (idempotency key for transport retries)
- `deviceId` — stable per simulated device (`device-a`, `device-b`)
- `lamport` — logical clock incremented locally on each mutation
- `type` + `payload`

Clients store:

1. Last merged **public state** (student stats, syllabus, sessions)
2. **Pending mutation outbox** (not yet acknowledged)
3. **Active focus session** (device-local until complete/fail)

Server stores:

1. All accepted mutations (by `id`)
2. Derived entities (tasks, focus sessions, student rewards)
3. `processedSessionRewards` map keyed by `sessionId`
4. `n8nNotificationsSent` map keyed by `sessionId`

### Sync protocol

1. Client POSTs `/sync/push` with pending mutations (sorted by `(lamport, deviceId, id)`).
2. Server applies unseen mutations, ignores duplicate `id`s.
3. Server recomputes rewards from all **completed** sessions.
4. Server returns merged public state; client clears applied/duplicate outbox entries.
5. Client GETs `/sync/pull` to ensure convergence.

No wall-clock timestamps are used for merge decisions.

## Conflict resolution

### Task status (same task, two devices)

Winner chosen by:

1. Higher `lamport`
2. If equal → higher status rank (`done` > `in_progress` > `not_started`)
3. If still tied → lexicographic `deviceId`

This is deterministic, clock-independent, and biases toward more complete progress when devices disagree at the same logical time.

### Task edit vs delete

Deletes are tombstones. If `TASK_DELETE.lamport` beats the competing status mutation, the task is hidden. Otherwise the edit survives.

### Focus session outcome

A session can move `running → completed|failed` once. If two complete/fail mutations compete while still `running`, higher `lamport` wins.

### Rewards

Rewards are **not** tied to mutation id. They are tied to **`sessionId`**:

- Server maintains `processedSessionRewards[sessionId]`.
- Replayed complete mutations or duplicate device uploads do not double-award.
- Coins/streak/today minutes are recomputed from the authoritative session set after each push.

### Why two devices converge

Given the same multiset of mutations, the server applies them in a fixed sort order and runs deterministic merge rules. Each client then replaces local derived state with the server public state after sync. Therefore any two clients that upload the same offline edits (regardless of upload order) reach identical server state, and identical UI after pull.

## Idempotency

### Backend

| Layer | Key | Behavior |
|-------|-----|----------|
| Mutation ingest | `mutation.id` | Second POST ignored (`duplicates`) |
| Session rewards | `sessionId` | `processedSessionRewards` ensures one payout |
| n8n trigger | `sessionId` | Skips if already in `n8nNotificationsSent` before webhook |
| Mock sink | `sessionId` | `/dev/mock-whatsapp` rejects duplicates |

### n8n workflow

The workflow stores `sentSessionIds` in `$getWorkflowStaticData('global')`. Incoming webhook payloads must include stable `sessionId` / `eventId`. Replays short-circuit before the HTTP sink node.

Even if the backend retried a webhook, n8n would still emit at most one mock notification per session.

## Tradeoff

**Recompute rewards from session history instead of incremental counters.**

This is simpler and very robust against duplicate/out-of-order mutations, but it requires scanning completed sessions on each push. For a student-scale app this is fine; at large scale I'd move to incremental accounting with strong idempotency keys and periodic reconciliation jobs.

## Where it could still break

- **Clock skew** only affects display timestamps, not merge — but "today's focus minutes" uses UTC date boundaries which may differ from a student's local timezone.
- **n8n static data** resets if the workflow is recreated without persisted instance data — backend dedupe still prevents double payout, but you might miss a notification until ops restore workflow memory.
- **Partial sync failure** mid-push could leave a client thinking a mutation is pending while the server applied it; the duplicate `mutation.id` path makes retry safe.
- **Same device, two tabs** sharing one namespace would behave like one device (mitigated by separate namespaces / incognito for demo).

## Optional extensions not implemented

- WhatsApp reply loop
- n8n-first reward rules migrated to Express
- Fuzz/property convergence tests
- 3+ device efficient delta sync
