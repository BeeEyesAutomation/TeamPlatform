import type { RequestHandler } from "express";
import { AppError } from "../utils/app-error";

export const requireRole = (...roles: string[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError(401, "Authentication required"));
      return;
    }

    if (!roles.some((role) => req.user?.roles.includes(role))) {
      next(new AppError(403, "Role required"));
      return;
    }

    next();
  };
};
