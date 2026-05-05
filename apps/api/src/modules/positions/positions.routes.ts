import { Router } from "express";

export const positionsRouter = Router();

positionsRouter.get("/", (_req, res) => {
  res.json({ status: "ok", data: [] });
});
