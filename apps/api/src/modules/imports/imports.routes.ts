import { Router } from "express";

export const importsRouter = Router();

importsRouter.get("/logs", (_req, res) => {
  res.json({ status: "ok", data: [] });
});
