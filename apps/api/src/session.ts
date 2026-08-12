import type { FastifyRequest } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import type { HaloAuth } from "./auth";
import { HttpError } from "./http-error";

export async function requireSession(auth: HaloAuth, request: FastifyRequest) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
  if (!session) {
    throw new HttpError("authentication_required", "errors.authenticationRequired");
  }
  return session;
}

export type VerifiedSession = Awaited<ReturnType<typeof requireSession>>;
