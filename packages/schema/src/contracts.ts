import { z } from "zod";

/**
 * Shared between web and api. The client validates what it sends,
 * the server validates what it receives, and both import the same file.
 */

export const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "invalid id");

export const CreateProject = z.object({
  orgId: cuid,
  title: z.string().min(1).max(120),
  studioId: z.string().min(1).max(40),
  visibility: z.enum(["PRIVATE", "UNLISTED", "PUBLIC"]).default("PRIVATE"),
});
export type CreateProject = z.infer<typeof CreateProject>;

export const UploadUrl = z.object({
  mime: z.string().min(3),
  bytes: z.number().int().positive().max(2_000_000_000),
  kind: z.enum(["IMAGE", "VIDEO", "AUDIO", "MESH", "TEXTURE", "CODE", "DOCUMENT", "MODEL", "OTHER"]),
});

export const JobRequest = z.object({
  type: z.enum(["render", "transcode", "infer", "embed"]),
  projectId: cuid.optional(),
  gpu: z.boolean().default(false),
  payload: z.record(z.unknown()),
});

/** One error shape across REST, tRPC and WebSocket. */
export const ApiError = z.object({
  code: z.enum([
    "UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND", "CONFLICT",
    "VALIDATION", "RATE_LIMITED", "QUOTA_EXCEEDED",
    "CAPABILITY_EXPIRED", "INTERNAL",
  ]),
  message: z.string(),
  retryable: z.boolean(),
  requestId: z.string(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof ApiError>;

/** Capability token payload minted by the API, verified by realtime. */
export const Capability = z.object({
  sub: cuid,             // user
  room: z.string(),      // "project:<id>"
  role: z.enum(["OWNER", "EDITOR", "REVIEWER", "VIEWER"]),
  exp: z.number(),       // 15 minutes
});
export type Capability = z.infer<typeof Capability>;
