import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";
import { createAuditLog } from "../audit/audit.service";
import { findActiveUserById, findUserByEmail, updateLastLoginAt } from "./auth.repository";

export interface AuthenticatedRequestUser {
  id: string;
  email: string;
  fullName: string;
  employeeId: string | null;
  roles: string[];
  permissions: string[];
}

interface TokenPayload {
  sub: string;
}

interface LoginInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function hashPassword(password: string) {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function createAccessToken(userId: string) {
  const expiresIn = env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"];

  return jwt.sign({ sub: userId } satisfies TokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn
  });
}

export function verifyAccessToken(token: string) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

  if (typeof payload !== "object" || typeof payload.sub !== "string") {
    throw new AppError(401, "Invalid token payload");
  }

  return payload as TokenPayload;
}

export function toAuthenticatedUser(user: NonNullable<Awaited<ReturnType<typeof findActiveUserById>>>): AuthenticatedRequestUser {
  const activeRoles = user.userRoles
    .map((userRole) => userRole.role)
    .filter((role) => role.status === "active");
  const roles = activeRoles.map((role) => role.code);
  const permissions = Array.from(
    new Set(
      activeRoles.flatMap((role) =>
        role.rolePermissions.map((rolePermission) => rolePermission.permission.code)
      )
    )
  );

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    employeeId: user.employeeId,
    roles,
    permissions
  };
}

export async function loadCurrentUser(userId: string) {
  const user = await findActiveUserById(userId);

  if (!user) {
    throw new AppError(401, "User is inactive or no longer exists");
  }

  return toAuthenticatedUser(user);
}

export async function login(input: LoginInput) {
  const email = normalizeEmail(input.email);
  const user = await findUserByEmail(email);

  if (!user || !user.isActive) {
    throw new AppError(401, "Invalid email or password");
  }

  const isPasswordValid = await verifyPassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError(401, "Invalid email or password");
  }

  await updateLastLoginAt(user.id);

  const authUser = toAuthenticatedUser(user);
  const accessToken = createAccessToken(user.id);

  await createAuditLog({
    actorId: user.id,
    action: "login",
    module: "auth",
    targetType: "user",
    targetId: user.id,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    metadata: {
      email
    }
  });

  return {
    accessToken,
    user: authUser
  };
}
