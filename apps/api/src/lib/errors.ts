import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

const STATUS: Record<string, number> = {
  UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404, CONFLICT: 409,
  VALIDATION: 422, RATE_LIMITED: 429, QUOTA_EXCEEDED: 402,
  CAPABILITY_EXPIRED: 401, INTERNAL: 500,
};

export class AppError extends Error {
  constructor(
    public code: keyof typeof STATUS,
    message: string,
    public retryable = false,
    public details?: unknown
  ) {
    super(message);
  }
}

/** One error shape on every surface. HTTP status is correct but never load-bearing. */
export function errorHandler(err: FastifyError | AppError, req: FastifyRequest, reply: FastifyReply) {
  const requestId = req.id as string;

  if (err instanceof ZodError) {
    return reply.status(422).send({
      code: "VALIDATION", message: "Request failed validation",
      retryable: false, requestId, details: err.flatten(),
    });
  }
  if (err instanceof AppError) {
    return reply.status(STATUS[err.code]).send({
      code: err.code, message: err.message, retryable: err.retryable, requestId, details: err.details,
    });
  }
  req.log.error({ err }, "unhandled");
  return reply.status(500).send({
    code: "INTERNAL", message: "Something failed on our side", retryable: true, requestId,
  });
}
