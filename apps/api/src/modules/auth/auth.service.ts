import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import type { AuthenticatedRequestUser } from "../../middleware/authenticate";

export const createAccessToken = (user: AuthenticatedRequestUser) => {
  return jwt.sign(user, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN
  });
};
