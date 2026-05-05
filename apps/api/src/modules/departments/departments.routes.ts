import { Router } from "express";

export const departmentsRouter = Router();

departmentsRouter.get("/", (_req, res) => {
  res.json({ status: "ok", data: [] });
});

departmentsRouter.post("/", (_req, res) => {
  res.status(501).json({ status: "error", message: "Not implemented yet" });
});
