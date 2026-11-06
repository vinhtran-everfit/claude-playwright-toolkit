# OpenMemory — daily runbook (start / check / stop)

> Compact companion to `openmemory-local-stack.md` (the full reference).
> Normally you do **nothing**: OrbStack auto-starts containers and the Ollama
> brew service survives reboots. Use this when something is off or after a
> manual stop.

## Start (cold boot → ready in ~40 s)

```bash
open -a OrbStack                                   # ~10 s until docker responds
brew services start ollama                         # ~2 s (no-op if running)
cd ~/vim/mem0/openmemory && docker compose up -d   # ~15 s (images already built)
```

| Step | Expected time |
|---|---|
| OrbStack daemon up | ~10 s |
| Containers up (API/Qdrant/UI) | ~15 s |
| First memory operation of the day | **~40 s** (Ollama cold-loads llama3.1 — normal, not a hang) |
| Every operation after | 1–5 s |

## Check (one command, 5 s)

```bash
curl -s -o /dev/null -w "api:%{http_code} " localhost:8765/docs; \
curl -s localhost:6333/collections/openmemory | grep -o '"points_count":[0-9]*'; \
ollama list | grep -c -E "llama3.1|nomic"   # expect: api:200, points_count, 2
```

Healthy = `api:200`, a `points_count`, and `2` models. In Claude Code:
`claude mcp list` → `openmemory … ✔ Connected` (restart the session if tools are missing).

- UI: http://localhost:3333 · API playground: http://localhost:8765/docs

## Stop (frees ~2 GB RAM; nothing else depends on it)

```bash
cd ~/vim/mem0/openmemory && docker compose down
brew services stop ollama
```

Memories survive stops — they live in the `mem0_storage` Docker volume
(only deleting the volume or the Qdrant collection loses them).

## If broken

Symptom table in `openmemory-local-stack.md` → Troubleshooting. Fast resets:

```bash
docker compose restart openmemory-mcp     # API weirdness (config/env changes)
docker compose logs openmemory-mcp --tail 30
```
