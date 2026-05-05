import { Router } from "express";

export const employeesRouter = Router();

employeesRouter.get("/", (_req, res) => {
  res.json({ status: "ok", data: [] });
});

employeesRouter.post("/", (_req, res) => {
  res.status(501).json({ status: "error", message: "Not implemented yet" });
});
