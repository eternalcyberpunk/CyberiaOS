# 0004. Realtime is a separate deployable

**Status:** Accepted  ·  **Date:** 2026-07-28

## Context

CRDT rooms are long-lived, memory-resident and sticky by document. REST handlers are short-lived and stateless. Deploying them together means every API release drops every live session.

## Decision

`apps/realtime` deploys, scales and fails independently. Routing is a consistent hash on projectId; Redis pub/sub carries updates between nodes during rebalance. Capability tokens are verified locally with no database on the hot path.

## Consequences

Rolling API deploys are invisible to people mid-session. We accept a second service to operate and a token-minting contract between the two.
