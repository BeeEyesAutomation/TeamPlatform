import { Router } from "express";

export const attendanceRouter = Router();

attendanceRouter.get("/", (_req, res) => {
  res.json({ status: "ok", data: [] });
});

attendanceRouter.post("/save", (_req, res) => {
  res.status(501).json({ status: "error", message: "Not implemented yet" });
});
