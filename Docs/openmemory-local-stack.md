# OpenMemory — Claude Code's fully-local memory stack

> Personal tooling doc (2026-07-27). This stack gives Claude Code persistent,
> semantically-searchable memory that **never sends a byte off this Mac** —
> chosen because the work codebases are private. It is NOT part of any product
> repo and must never be documented in project docs.

## Why this shape

| Option | Verdict |
|---|---|
| mem0 hosted plugin (`mem0@mem0-plugins`) | ❌ uninstalled — memories stored on mem0's cloud |
| OpenMemory default config | ❌ storage is local but extraction/embeddings go to **OpenAI** (`OPENAI_API_KEY`) |
| **OpenMemory + Ollama (this setup)** | ✅ LLM, embeddings, vectors, UI — all on-machine |

Config maps to mem0's [local-companion-ollama cookbook](https://docs.mem0.ai/cookbooks/companions/local-companion-ollama)
(same trio: Ollama `llama3.1` + `nomic-embed-text` @768 dims + Qdrant), but served
behind OpenMemory's MCP server instead of the Python SDK so Claude Code can use it.

⚠️ OpenMemory is **sunset upstream** (mem0 steers to their self-hosted server, which has
no Claude Code MCP connector). The local clone is patched (see below) — treat it as pinned.

## Architecture & ports

```
Claude Code ──MCP (streamable HTTP)──▶ :8765  OpenMemory API (FastAPI, Docker)
                                        │ extraction LLM         │ embeddings
                                        ▼                        ▼
                              :11434 Ollama (brew svc)   :11434 nomic-embed-text
                                        │ 768-dim vectors
                                        ▼
                                      :6333  Qdrant (Docker volume `mem0_storage`)
                                      :3333  dashboard UI (remapped from 3000 — everfit-react owns 3000)
```

- Source: `~/vim/mem0/openmemory` (shallow clone of `mem0ai/mem0`), Docker via **OrbStack**.
- MCP endpoint: `http://localhost:8765/mcp/claude/http/vinhtran` — registered in Claude Code
  **user scope** (`claude mcp add --transport http --scope user openmemory <url>`), so no
  project repo carries any trace of it.
- UI: http://localhost:3333 · API docs: http://localhost:8765/docs

## Config (`api/.env`)

```
OPENAI_API_KEY=local-only-unused        # placeholder, never used
USER=vinhtran
LLM_PROVIDER=ollama
LLM_MODEL=llama3.1:latest
OLLAMA_BASE_URL=http://host.docker.internal:11434
EMBEDDER_PROVIDER=ollama
EMBEDDER_MODEL=nomic-embed-text
EMBEDDER_BASE_URL=http://host.docker.internal:11434
EMBEDDING_MODEL_DIMS=768                # nomic-embed-text output size
```

`ui/.env`: `NEXT_PUBLIC_API_URL=http://localhost:8765`, `NEXT_PUBLIC_USER_ID=vinhtran`.

## Local patches in the clone (keep on any pull — upstream is sunset)

1. **`api/app/utils/memory.py`** — default-Qdrant path now reads `EMBEDDING_MODEL_DIMS`
   (default 1536). Without it the collection was created at OpenAI's 1536 dims and every
   write failed `expected dim: 1536, got 768`. One-time cleanup was
   `curl -X DELETE http://localhost:6333/collections/openmemory`.
2. **`api/app/mcp_server.py`** — `search_memory` passes `top_k=` instead of `limit=`
   (mem0ai 2.x renamed the kwarg; image ships 2.0.14, repo code predates it).

`docker-compose.yml` — UI port mapping changed `"3000:3000"` → `"3333:3000"`.

## Operate

```bash
cd ~/vim/mem0/openmemory
docker compose up -d          # start (API + Qdrant + UI)
docker compose down           # stop
docker compose logs openmemory-mcp --tail 20
brew services start ollama    # LLM side (stop: brew services stop ollama)
```

The api/ dir is volume-mounted with `--reload` — edits to the Python code apply live.
The app dev loops (:3000 host, :5173 MFE) run fine with this whole stack off.

## Verified round trip (2026-07-27)

1. `POST :8765/api/v1/memories/` with raw text → llama3.1 extracted
   *"Vinh prefers fully local AI tooling for his private projects"* (~40s cold, fast after).
2. Qdrant: `points: 1 · dims: 768`.
3. MCP `search_memory` with the paraphrase *"what does Vinh think about privacy and tools?"*
   → found it, score **0.77** (semantic, not keyword).

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Vector dimension error: expected 1536, got 768` | Collection created before dims patch — delete it: `curl -X DELETE :6333/collections/openmemory` (loses stored memories) |
| `Qdrant.search() got an unexpected keyword argument 'limit'` | `top_k` patch missing (reverted by a pull) — see patches above |
| MCP tools missing in Claude Code | Restart the session; check `claude mcp list` shows `openmemory … ✔ Connected` |
| First memory op takes ~40 s | Ollama cold-loading llama3.1; subsequent calls are fast |
| Writes fail / API down | OrbStack not running (`open -a OrbStack`), or Ollama service stopped |
| UI empty | UI reads user `vinhtran` — memories added under another `user_id` won't show |
