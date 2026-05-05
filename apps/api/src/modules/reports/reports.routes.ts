import { Router } from "express";

export const reportsRouter = Router();

reportsRouter.get("/", (_req, res) => {
  res.json({ status: "ok", data: [] });
});
