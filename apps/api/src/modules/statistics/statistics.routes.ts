import { Router } from "express";

export const statisticsRouter = Router();

statisticsRouter.get("/projects/overview", (_req, res) => {
  res.json({ status: "ok", data: {} });
});
