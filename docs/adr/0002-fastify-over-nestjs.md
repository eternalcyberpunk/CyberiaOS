# 0002. Fastify over NestJS for the API

**Status:** Accepted  ·  **Date:** 2026-07-28

## Context

The brief names NestJS or Fastify. NestJS brings module structure and DI; we already get module boundaries from a typed monorepo, and DI costs startup time and per-request overhead on a path we want under 40ms.

## Decision

Use Fastify with one plugin per domain (`src/modules/<domain>/routes.ts`). Revisit if the backend team passes roughly twelve engineers, where NestJS conventions start paying for themselves.

## Consequences

Faster cold starts and a smaller request path. We give up decorators and built-in DI, and we take on the discipline of keeping module boundaries ourselves.
