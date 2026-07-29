import * as Y from "yjs";
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from "y-protocols/awareness";
import type { WebSocket } from "ws";
import type Redis from "ioredis";
import type { Capability } from "@ec/schema";

interface RoomOpts {
  pub: Redis;
  sub: Redis;
  snapshotEvery: number;
  snapshotMs: number;
}

/**
 * One Yjs document, N peers, plus Redis fan-out so a rolling deploy never
 * splits a room across nodes. Viewer writes are rejected at the socket —
 * permission is not a UI concern.
 */
export class Room {
  readonly doc = new Y.Doc();
  readonly awareness = new Awareness(this.doc);
  private peers = new Map<WebSocket, Capability>();
  private updatesSinceSnapshot = 0;
  private snapshotTimer: NodeJS.Timeout;

  constructor(readonly id: string, private opts: RoomOpts) {
    this.opts.sub.subscribe(`room:${id}`);
    this.opts.sub.on("messageBuffer", (channel, payload) => {
      if (channel.toString() === `room:${id}`) Y.applyUpdate(this.doc, payload, "remote-node");
    });

    this.doc.on("update", (update: Uint8Array, origin: unknown) => {
      if (origin !== "remote-node") this.opts.pub.publish(`room:${id}`, Buffer.from(update));
      for (const [ws, cap] of this.peers) this.send(ws, { t: "sync", update: Buffer.from(update).toString("base64") });
      if (++this.updatesSinceSnapshot >= this.opts.snapshotEvery) this.snapshot();
    });

    this.snapshotTimer = setInterval(() => this.snapshot(), this.opts.snapshotMs);
  }

  get size() { return this.peers.size; }

  join(ws: WebSocket, cap: Capability) {
    this.peers.set(ws, cap);
    this.send(ws, { t: "synced", state: Buffer.from(Y.encodeStateAsUpdate(this.doc)).toString("base64") });
    this.broadcast({ t: "presence", joined: { id: cap.sub, role: cap.role } }, ws);

    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      switch (msg.t) {
        case "sync": {
          if (cap.role === "VIEWER") return this.send(ws, { t: "error", code: "FORBIDDEN", retryable: false });
          // Reviewers write to a proposal sub-document, never to the main doc.
          const target = cap.role === "REVIEWER" ? this.doc.getMap("proposals") : this.doc;
          if (target === this.doc) Y.applyUpdate(this.doc, Buffer.from(msg.update, "base64"), cap.sub);
          return;
        }
        case "awareness":
          applyAwarenessUpdate(this.awareness, Buffer.from(msg.update, "base64"), cap.sub);
          return;
        case "chat":
          return this.broadcast({ t: "chat", from: cap.sub, body: String(msg.body).slice(0, 2000) });
      }
    });
  }

  leave(ws: WebSocket) {
    const cap = this.peers.get(ws);
    this.peers.delete(ws);
    if (cap) this.broadcast({ t: "presence", left: cap.sub });
  }

  private send(ws: WebSocket, msg: unknown) {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  }

  private broadcast(msg: unknown, except?: WebSocket) {
    for (const ws of this.peers.keys()) if (ws !== except) this.send(ws, msg);
  }

  /** Snapshot to object storage + ProjectVersion row. See docs/adr/0003. */
  private snapshot() {
    if (this.updatesSinceSnapshot === 0) return;
    this.updatesSinceSnapshot = 0;
    const state = Y.encodeStateAsUpdate(this.doc);
    // TODO(M2): blake3(state) → S3 put → POST /v1/projects/:id/versions
    void state;
  }

  dispose() {
    clearInterval(this.snapshotTimer);
    this.snapshot();
    this.opts.sub.unsubscribe(`room:${this.id}`);
    this.awareness.destroy();
    this.doc.destroy();
  }
}
