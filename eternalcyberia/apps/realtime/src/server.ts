import { WebSocketServer, type WebSocket } from "ws";
import * as Y from "yjs";
import Redis from "ioredis";
import { verifyCapability } from "./capability.js";
import { Room } from "./room.js";

/**
 * Realtime is deliberately a separate service (docs/adr/0004):
 * rooms are long-lived, memory-resident and sticky, while the API is stateless.
 * Mixing them means one API deploy drops every live session.
 */
const PORT = Number(process.env.REALTIME_PORT ?? 4001);
const SNAPSHOT_EVERY = 200;      // updates
const SNAPSHOT_MS = 60_000;
const EMPTY_ROOM_TTL = 30_000;

const pub = new Redis(process.env.REDIS_PUBSUB_URL!);
const sub = new Redis(process.env.REDIS_PUBSUB_URL!);
const rooms = new Map<string, Room>();

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", async (ws: WebSocket, req) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const roomId = url.searchParams.get("room") ?? "";
  const token = url.searchParams.get("token") ?? "";

  const cap = await verifyCapability(token).catch(() => null);
  if (!cap || cap.room !== roomId) {
    ws.close(4401, "CAPABILITY_INVALID");
    return;
  }

  const room = rooms.get(roomId) ?? new Room(roomId, { pub, sub, snapshotEvery: SNAPSHOT_EVERY, snapshotMs: SNAPSHOT_MS });
  rooms.set(roomId, room);
  room.join(ws, cap);

  ws.on("close", () => {
    room.leave(ws);
    if (room.size === 0) {
      setTimeout(() => {
        if (room.size === 0) {
          room.dispose();            // folds the update log into a version row
          rooms.delete(roomId);
        }
      }, EMPTY_ROOM_TTL);
    }
  });
});

// eslint-disable-next-line no-console
console.log(`realtime listening on :${PORT}`);
