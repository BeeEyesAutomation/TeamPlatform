import { Router } from "express";

export const usersRouter = Router();

usersRouter.get("/", (_req, res) => {
  res.json({ status: "ok", data: [] });
});

usersRouter.post("/", (_req, res) => {
  res.status(501).json({ status: "error", message: "Not implemented yet" });
});
