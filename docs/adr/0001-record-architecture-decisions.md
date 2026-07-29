# 0001. Record architecture decisions

**Status:** Accepted  ·  **Date:** 2026-07-28

## Context

We need a durable record of why the system looks the way it does, readable by someone who joins in month nine.

## Decision

Every decision that would be expensive to reverse gets a numbered ADR in `docs/adr/`. ADRs are immutable once accepted; a change means a new ADR that supersedes the old one.

## Consequences

New engineers can reconstruct our reasoning without archaeology. The cost is a few minutes per decision.
