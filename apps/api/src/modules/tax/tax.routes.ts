import { Router } from "express";

export const taxRouter = Router();

taxRouter.get("/", (_req, res) => {
  res.json({ status: "ok", data: [] });
});
