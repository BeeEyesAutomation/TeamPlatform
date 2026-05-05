import { Router } from "express";

export const salaryAdvancesRouter = Router();

salaryAdvancesRouter.get("/", (_req, res) => {
  res.json({ status: "ok", data: [] });
});

salaryAdvancesRouter.post("/", (_req, res) => {
  res.status(501).json({ status: "error", message: "Not implemented yet" });
});
