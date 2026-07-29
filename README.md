# EternalCyberia OS

A creative internet operating system. Mobile-first PWA, real-time multiplayer, cloud compute,
and a studio SDK that makes third-party tools first-class.

**Phase 1** (design) is in `docs/`. **Phase 2** (this repo) is the scaffold: shell, contracts,
schema, and the three backend services wired together locally.

## Quick start

```bash
pnpm install
docker compose up -d          # postgres + redis
pnpm db:push                  # apply prisma schema
pnpm dev                      # web :3000  api :4000  realtime :4001  worker
```

Open http://localhost:3000. Sign-in is stubbed in dev (`DEV_USER=1`).

## Layout

| Path | What it is |
| --- | --- |
| `apps/web` | Next.js App Router shell — dock, command palette, studio host, PWA |
| `apps/api` | Fastify — auth, projects, assets, compute, AI gateway |
| `apps/realtime` | Yjs rooms, awareness, presence, Redis fan-out |
| `apps/worker` | BullMQ processors — renders, transcodes, embeddings |
| `packages/tokens` | Design tokens → CSS vars + Tailwind preset + typed constants |
| `packages/ui` | Primitives, token-driven, no product imports |
| `packages/studio-sdk` | The contract every studio implements |
| `packages/studio-image` | Reference studio (pixel sorter) proving the contract |
| `packages/crdt` | Yjs schemas and per-node merge policies |
| `packages/schema` | Prisma schema + zod contracts shared by web and api |

## Rules that are enforced, not suggested

1. **One frame loop.** The shell owns the only `requestAnimationFrame`. Studios expose `frame(dt)`.
2. **Binary never enters the CRDT.** Documents hold content hashes; bytes live in object storage.
3. **Bundle budgets are CI gates.** A studio that exceeds `manifest.budgetKb` fails the build.
4. **No direct AI writes.** Agents produce reviewable proposals, never document mutations.
5. **Every mutation route has an unauthorised test before a happy-path test.**

## Decisions

See `docs/adr/`. Numbered, dated, immutable once accepted.
