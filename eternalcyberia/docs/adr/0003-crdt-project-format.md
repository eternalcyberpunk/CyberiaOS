# 0003. Yjs as the project document format from day one

**Status:** Accepted  ·  **Date:** 2026-07-28

## Context

Multiplayer ships in M4, but studios are written in M3. Retrofitting collaboration onto a single-player document model means rewriting every studio.

## Decision

Every project is a Yjs document from M2, before any studio exists. Studios declare root keys and merge policies in their manifest. Binary never enters the document — assets are referenced by content hash.

## Consequences

Studios are collaborative by construction. Undo, process reels and forking from any moment come for free. The cost is that every studio author must think in shared state, and we must own snapshot policy (200 updates or 60 seconds).
