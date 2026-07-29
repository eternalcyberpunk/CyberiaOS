import { Worker, Queue } from "bullmq";
import Redis from "ioredis";

/**
 * Two queues, two pools. A GPU backlog must never stall a thumbnail, and a
 * thumbnail flood must never hold a GPU idle. Autoscaling is per queue depth.
 */
const connection = new Redis(process.env.REDIS_QUEUE_URL!, { maxRetriesPerRequest: null });

export const cpuQueue = new Queue("cpu", { connection });
export const gpuQueue = new Queue("gpu", { connection });

const handlers: Record<string, (payload: any) => Promise<unknown>> = {
  thumbnail: async (p) => ({ ok: true, hash: p.hash }),      // TODO(M2): sharp
  transcode: async (p) => ({ ok: true, hash: p.hash }),      // TODO(M3): ffmpeg
  embed: async (p) => ({ ok: true, dims: 1536 }),            // TODO(M2): pgvector upsert
  render: async (p) => ({ ok: true, frames: p.frames ?? 0 }),// TODO(M5): GPU pool dispatch
};

function makeWorker(name: string, concurrency: number) {
  return new Worker(
    name,
    async (job) => {
      const handle = handlers[job.name];
      if (!handle) throw new Error(`no handler for ${job.name}`);
      const started = Date.now();
      const result = await handle(job.data);
      // Actual cost is recorded against the estimate the user was quoted.
      return { ...(result as object), ms: Date.now() - started };
    },
    { connection, concurrency }
  );
}

makeWorker("cpu", 8);
makeWorker("gpu", 1);

// eslint-disable-next-line no-console
console.log("worker online: cpu(8) gpu(1)");
