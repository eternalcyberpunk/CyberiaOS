# Deployment

## Vercel (web)

1. Create a Vercel project and set the root directory to `apps/web`.
2. Ensure Node.js 20+ is selected.
3. Add environment variables from `infra/vercel.env.example`.
4. Deploy from the `main` branch.

The `apps/web/vercel.json` file contains the app-level Vercel configuration.
