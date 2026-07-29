# Deploying

Four deployables, two platforms. Vercel hosts `apps/web`. The other three are
long-lived processes and go to Fly.io — a WebSocket room server cannot live on
serverless functions (docs/adr/0004).

| Deployable | Platform | Why |
| --- | --- | --- |
| `apps/web` | Vercel | Edge rendering, preview deploy per PR, instant rollback |
| `apps/api` | Fly.io | Stateless, but wants warm processes and no cold-start tax |
| `apps/realtime` | Fly.io | Long-lived WS, memory-resident Yjs rooms |
| `apps/worker` | Fly.io | Pulls from Redis; nothing routes to it |

## 1. Vercel project settings

Create the project from the repo, then set:

- **Root Directory:** `apps/web`
- **Include source files outside of the Root Directory:** **ON** ← workspace deps fail without this
- **Framework Preset:** Next.js
- Leave Install/Build blank; `apps/web/vercel.json` supplies them.

`buildCommand` runs `turbo run build --filter=@ec/web...`, which builds
`@ec/tokens`, `@ec/ui`, `@ec/crdt`, `@ec/studio-sdk`, `@ec/studio-image` and
runs `prisma generate` in `@ec/schema` first. Prisma's client is generated into
`node_modules`, which Vercel caches — without an explicit generate step you get
a stale client on the second deploy.

`ignoreCommand` runs `turbo-ignore`, so a commit touching only `apps/api`
does not trigger a web deploy.

## 2. Environment variables

Set in Vercel → Settings → Environment Variables, per environment.

| Var | Scope | Note |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Production, Preview | **Baked at build time.** Changing it requires a redeploy, not a restart |
| `NEXT_PUBLIC_REALTIME_URL` | Production, Preview | `wss://…` in production; `ws://` only works on localhost |
| `NEXT_PUBLIC_AI_BUDGET` | all | display only |
| `TURBO_TOKEN`, `TURBO_TEAM` | all | remote cache; cuts cold build time substantially |
| `ENABLE_EXPERIMENTAL_COREPACK` | all | `1` — honours `packageManager: pnpm@9.7.0` |

No secret belongs in a `NEXT_PUBLIC_` var. `DATABASE_URL`,
`SESSION_SECRET`, `CAPABILITY_SIGNING_KEY` and `ANTHROPIC_API_KEY` live on Fly,
set with `flyctl secrets set`, and are never read by the web app.

## 3. The lockfile is not optional

Vercel picks the package manager from the lockfile in the repo. With no
`pnpm-lock.yaml` it falls back to `npm install`, which does not understand the
`workspace:*` protocol and fails with `EUNSUPPORTEDPROTOCOL`. Generate and
commit the lockfile before the first deploy:

```bash
pnpm install            # writes pnpm-lock.yaml at the repo root
git add pnpm-lock.yaml && git commit -m "chore: add lockfile"
```

Also note that `vercel.json` is read from the **Root Directory**, not the repo
root. If Root Directory is unset, `apps/web/vercel.json` is never loaded and
Vercel uses its defaults — which is the other way to end up running `npm`.

## 4. Three things that break on first deploy

**CSP blocks your own API.** `apps/web/next.config.mjs` hardcodes
`connect-src 'self' https://api.eternalcyberia.dev wss://rt.eternalcyberia.dev`.
Replace those with your real hostnames or every fetch and every socket fails
with a console error and no network request. Preview deploys need their
hostnames listed too, or drive the header from `process.env`.

**Cookies do not cross domains.** `vercel.app` → `fly.dev` is cross-site, so the
session cookie is dropped. Put both behind one apex —
`eternalcyberia.dev` for web, `api.eternalcyberia.dev` for the API — and set
the cookie `domain: ".eternalcyberia.dev"`. Otherwise you need
`SameSite=None; Secure` plus CORS credentials, which is worse.

**WebSockets are not a Vercel feature.** Do not try to host `apps/realtime`
as a route handler. Functions have an execution ceiling and no shared memory
between invocations; a Yjs room needs both.

## 5. Fly setup

```bash
fly launch --no-deploy --copy-config --config infra/fly/api.fly.toml
fly secrets set -a ec-api \
  DATABASE_URL=... REDIS_QUEUE_URL=... REDIS_PUBSUB_URL=... \
  SESSION_SECRET=... CAPABILITY_SIGNING_KEY=... ANTHROPIC_API_KEY=...

fly secrets set -a ec-realtime \
  REDIS_PUBSUB_URL=... CAPABILITY_PUBLIC_KEY=...   # public key only

fly deploy --config infra/fly/realtime.fly.toml --build-arg PKG=@ec/realtime
```

Managed data: Neon (Postgres + pgvector), Upstash (two Redis databases — one
for queues, one for pub/sub, so a job backlog cannot stall presence), R2 for
objects. All three are reachable from Fly and from Vercel functions.

## 6. Preview environments

`turbo-ignore` plus Neon database branching gives every PR its own database.
Point the preview build at the branch URL and run E2E against the Vercel
preview URL:

```yaml
- run: pnpm test:e2e
  env:
    BASE_URL: ${{ needs.deploy.outputs.preview-url }}
```
