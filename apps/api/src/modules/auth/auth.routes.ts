import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { loginSchema } from "./auth.schemas";
import { createAccessToken } from "./auth.service";

export const authRouter = Router();

authRouter.post("/login", (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const token = createAccessToken({
      id: "placeholder-user-id",
      email: body.email,
      roles: ["admin"],
      permissions: ["auth.me"]
    });

    res.json({
      status: "ok",
      data: {
        accessToken: token
      }
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.status(204).send();
});

authRouter.get("/me", authenticate, (req, res) => {
  res.json({ status: "ok", data: req.user });
});

authRouter.post("/change-password", authenticate, (_req, res) => {
  res.status(501).json({ status: "error", message: "Not implemented yet" });
});
