import { Router } from "express";

export const allowancesRouter = Router();

allowancesRouter.get("/", (_req, res) => {
  res.json({ status: "ok", data: [] });
});

allowancesRouter.post("/", (_req, res) => {
  res.status(501).json({ status: "error", message: "Not implemented yet" });
});
