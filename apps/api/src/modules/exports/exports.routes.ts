import { Router } from "express";

export const exportsRouter = Router();

exportsRouter.get("/logs", (_req, res) => {
  res.json({ status: "ok", data: [] });
});
