import { Router } from "express";

export const emailRouter = Router();

emailRouter.get("/settings", (_req, res) => {
  res.status(501).json({ status: "error", message: "Not implemented yet" });
});

emailRouter.get("/templates", (_req, res) => {
  res.json({ status: "ok", data: [] });
});

emailRouter.get("/logs", (_req, res) => {
  res.json({ status: "ok", data: [] });
});
