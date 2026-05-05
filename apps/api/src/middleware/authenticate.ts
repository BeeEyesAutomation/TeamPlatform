import type { RequestHandler } from "express";
import { loadCurrentUser, verifyAccessToken, type AuthenticatedRequestUser } from "../modules/auth/auth.service";
import { AppError } from "../utils/app-error";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequestUser;
    }
  }
}

const getBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return undefined;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : undefined;
};

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = getBearerToken(req.header("authorization"));

    if (!token) {
      throw new AppError(401, "Authentication required");
    }

    const payload = verifyAccessToken(token);
    req.user = await loadCurrentUser(payload.sub);
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, "Invalid or expired token"));
  }
};

export const authenticate = requireAuth;
