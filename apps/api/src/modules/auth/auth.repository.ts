import { prisma } from "../../prisma/client";

export type AuthUserRecord = Awaited<ReturnType<typeof findUserByEmail>>;

const userInclude = {
  employee: {
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      status: true
    }
  },
  userRoles: {
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  }
} as const;

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: userInclude
  });
}

export async function findActiveUserById(id: string) {
  return prisma.user.findFirst({
    where: {
      id,
      isActive: true
    },
    include: userInclude
  });
}

export async function updateLastLoginAt(id: string) {
  return prisma.user.update({
    where: { id },
    data: {
      lastLoginAt: new Date()
    }
  });
}
