import { Router } from "express";

export const rolesRouter = Router();

rolesRouter.get("/", (_req, res) => {
  res.json({ status: "ok", data: [] });
});

rolesRouter.post("/", (_req, res) => {
  res.status(501).json({ status: "error", message: "Not implemented yet" });
});

rolesRouter.put("/:id/permissions", (_req, res) => {
  res.status(501).json({ status: "error", message: "Not implemented yet" });
});
