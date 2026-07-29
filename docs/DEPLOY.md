# Deployment

## Vercel (Web App)

1. Import the repository into Vercel.
2. Set the root directory to `apps/web`.
3. Use `pnpm install --frozen-lockfile` for install.
4. Use `pnpm --filter @ec/web build` for build.
5. Configure environment variables from `infra/vercel.env.example`.

## Notes

- `apps/web/vercel.json` contains the Vercel build/install configuration.
- The repository lockfile must be kept committed for reproducible deployments.
