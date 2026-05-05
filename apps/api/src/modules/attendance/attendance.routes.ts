import { Router } from "express";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/async-handler";
import { attendanceLockSchema, attendanceMonthlyQuerySchema, attendanceQuerySchema, attendanceSaveSchema } from "./attendance.schemas";
import { getAttendanceByDate, getMonthlyAttendanceSummary, lockAttendanceMonth, saveAttendance, unlockAttendanceMonth } from "./attendance.service";

export const attendanceRouter = Router();

attendanceRouter.use(requireAuth);

attendanceRouter.get(
  "/",
  requirePermission("attendance.manage"),
  asyncHandler(async (req, res) => {
    const query = attendanceQuerySchema.parse(req.query);
    const data = await getAttendanceByDate(query);
    res.json({ status: "ok", data });
  })
);

attendanceRouter.post(
  "/save",
  requirePermission("attendance.manage"),
  asyncHandler(async (req, res) => {
    const body = attendanceSaveSchema.parse(req.body);
    const data = await saveAttendance(body, {
      actorId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.header("user-agent")
    });
    res.json({ status: "ok", data });
  })
);

attendanceRouter.get(
  "/monthly",
  requirePermission("attendance.manage"),
  asyncHandler(async (req, res) => {
    const query = attendanceMonthlyQuerySchema.parse(req.query);
    const data = await getMonthlyAttendanceSummary(query);
    res.json({ status: "ok", data });
  })
);

attendanceRouter.post(
  "/lock",
  requirePermission("attendance.lock"),
  asyncHandler(async (req, res) => {
    const body = attendanceLockSchema.parse(req.body);
    const data = await lockAttendanceMonth(body, {
      actorId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.header("user-agent")
    });
    res.json({ status: "ok", data });
  })
);

attendanceRouter.post(
  "/unlock",
  requirePermission("attendance.lock"),
  asyncHandler(async (req, res) => {
    const body = attendanceLockSchema.parse(req.body);
    const data = await unlockAttendanceMonth(body, {
      actorId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.header("user-agent")
    });
    res.json({ status: "ok", data });
  })
);
