# Deployment

## Vercel (Web)

- Root directory: `apps/web`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm --filter @ec/web build`
- Output: Next.js build output

## Preparation

1. Enable Corepack and use the pinned pnpm version from `packageManager`.
2. Install dependencies from the repository root.
3. Ensure required environment variables are configured in Vercel.
