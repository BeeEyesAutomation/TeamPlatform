import { Router } from "express";

export const projectDocumentsRouter = Router();

projectDocumentsRouter.get("/", (_req, res) => {
  res.json({ status: "ok", data: [] });
});
