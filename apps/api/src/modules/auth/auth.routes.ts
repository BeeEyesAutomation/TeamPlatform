import { Router } from "express";
import { requireAuth } from "../../middleware/authenticate";
import { asyncHandler } from "../../utils/async-handler";
import { loginSchema } from "./auth.schemas";
import { login } from "./auth.service";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const result = await login({
      email: body.email,
      password: body.password,
      ipAddress: req.ip,
      userAgent: req.header("user-agent")
    });

    res.json({
      status: "ok",
      data: result
    });
  })
);

authRouter.post("/logout", requireAuth, (_req, res) => {
  res.json({
    status: "ok",
    data: {
      message: "Logout is stateless. Discard the access token on the client."
    }
  });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ status: "ok", data: req.user });
});

authRouter.post("/change-password", requireAuth, (_req, res) => {
  res.status(501).json({ status: "error", message: "Not implemented yet" });
});
