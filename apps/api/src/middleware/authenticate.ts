import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthenticatedRequestUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequestUser;
    }
  }
}

export const authenticate: RequestHandler = (req, res, next) => {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ status: "error", message: "Authentication required" });
    return;
  }

  try {
    req.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthenticatedRequestUser;
    next();
  } catch {
    res.status(401).json({ status: "error", message: "Invalid or expired token" });
  }
};
