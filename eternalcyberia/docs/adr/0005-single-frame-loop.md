# 0005. The shell owns the only requestAnimationFrame

**Status:** Accepted  ·  **Date:** 2026-07-28

## Context

Studios that run their own animation loops compete for the main thread, cannot be throttled when a phone overheats, and make per-studio performance impossible to attribute.

## Decision

`frameLoop` in `apps/web/lib/frame-loop.ts` is the only rAF in the application. Studios expose `frame(dt, now)`. The loop pauses on hidden tabs, drops the budget under thermal pressure, and records a rolling cost per studio.

## Consequences

Frame budget telemetry is free and attribution is exact. Studio authors lose direct control of scheduling, which is the point.
