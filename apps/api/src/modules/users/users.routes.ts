import { Router } from "express";
import { requireAuth } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/require-permission";

export const usersRouter = Router();

usersRouter.get("/", requireAuth, requirePermission("users.manage"), (_req, res) => {
  res.json({ status: "ok", data: [] });
});

usersRouter.post("/", (_req, res) => {
  res.status(501).json({ status: "error", message: "Not implemented yet" });
});
