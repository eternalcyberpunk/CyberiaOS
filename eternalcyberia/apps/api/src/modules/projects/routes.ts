import type { FastifyInstance } from "fastify";
import { CreateProject } from "@ec/schema";
import { AppError } from "../../lib/errors.js";

export async function projectRoutes(app: FastifyInstance) {
  /** Cursor pagination everywhere. No offsets, no total counts. */
  app.get("/", async (req) => {
    const { cursor, limit = "20" } = req.query as { cursor?: string; limit?: string };
    // TODO(M2): prisma.project.findMany({ cursor, take: +limit, orderBy: { updatedAt: "desc" } })
    return { items: [], nextCursor: null, _echo: { cursor, limit } };
  });

  app.post("/", async (req, reply) => {
    const input = CreateProject.parse(req.body);
    // TODO(M2): authorise org membership, create project + initial Yjs snapshot
    reply.status(201);
    return { id: "cstubproject00000000000", ...input };
  });

  app.post("/:id/versions", async (req) => {
    const { id } = req.params as { id: string };
    const { message } = (req.body ?? {}) as { message?: string };
    // TODO(M2): fold Redis update log → snapshot → S3 → ProjectVersion row
    return { projectId: id, seq: 1, hash: "blake3:stub", message: message ?? null };
  });

  app.delete("/:id", async () => {
    throw new AppError("FORBIDDEN", "Only the owner can delete a project");
  });
}
