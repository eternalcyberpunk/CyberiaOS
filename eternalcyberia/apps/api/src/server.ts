import Fastify from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { randomUUID } from "node:crypto";
import { authRoutes } from "./modules/auth/routes.js";
import { projectRoutes } from "./modules/projects/routes.js";
import { errorHandler } from "./lib/errors.js";

/**
 * Fastify over NestJS: see docs/adr/0002. One plugin per domain keeps the
 * organisation without paying DI cost on a request path we want under 40ms.
 */
export function build() {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL ?? "info" },
    genReqId: () => randomUUID(),
    trustProxy: true,
  });

  app.register(cookie, { secret: process.env.SESSION_SECRET! });
  app.register(rateLimit, { max: 300, timeWindow: "1 minute", keyGenerator: (r) => r.ip });

  app.setErrorHandler(errorHandler);

  app.get("/healthz", async () => ({ ok: true, service: "api" }));

  app.register(authRoutes, { prefix: "/v1/auth" });
  app.register(projectRoutes, { prefix: "/v1/projects" });

  return app;
}

if (process.argv[1]?.endsWith("server.ts") || process.argv[1]?.endsWith("server.js")) {
  const app = build();
  const port = Number(process.env.API_PORT ?? 4000);
  app.listen({ port, host: "0.0.0.0" }).catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
}
