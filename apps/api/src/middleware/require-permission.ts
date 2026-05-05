import type { RequestHandler } from "express";
import type { PermissionCode } from "@team-platform/shared";

export const requirePermission = (permission: PermissionCode): RequestHandler => {
  return (req, res, next) => {
    if (!req.user?.permissions.includes(permission)) {
      res.status(403).json({ status: "error", message: "Permission denied" });
      return;
    }

    next();
  };
};
