import { Router } from "express";

export const payrollRouter = Router();

payrollRouter.get("/", (_req, res) => {
  res.json({ status: "ok", data: [] });
});

payrollRouter.post("/calculate", (_req, res) => {
  res.status(501).json({ status: "error", message: "Not implemented yet" });
});
