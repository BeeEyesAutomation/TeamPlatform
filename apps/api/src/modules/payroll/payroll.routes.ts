import { Router } from "express";
import type { Request } from "express";
import { requireAuth, requirePermission } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/async-handler";
import { approvePayroll, calculatePayrollForMonth, getOwnPayslip, getPayroll, listPayrolls, lockPayroll, publishPayroll } from "./payroll.service";
import { idParamSchema, payrollCalculateSchema, payrollQuerySchema, payslipQuerySchema } from "./payroll.schemas";

export const payrollRouter = Router();
export const payrollsRouter = Router();
export const payslipsRouter = Router();

const contextFromRequest = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.header("user-agent")
});

const registerPayrollCollectionRoutes = (router: Router) => {
  router.use(requireAuth);

  router.get(
    "/",
    requirePermission("payroll.view"),
    asyncHandler(async (req, res) => {
      const query = payrollQuerySchema.parse(req.query);
      const data = await listPayrolls(query);
      res.json({ status: "ok", data });
    })
  );

  router.post(
    "/calculate",
    requirePermission("payroll.manage"),
    asyncHandler(async (req, res) => {
      const body = payrollCalculateSchema.parse({ ...req.query, ...req.body });
      const data = await calculatePayrollForMonth(body, contextFromRequest(req));
      res.json({ status: "ok", data });
    })
  );

  router.get(
    "/:id",
    requirePermission("payroll.view"),
    asyncHandler(async (req, res) => {
      const { id } = idParamSchema.parse(req.params);
      const data = await getPayroll(id);
      res.json({ status: "ok", data });
    })
  );

  router.post(
    "/:id/approve",
    requirePermission("payroll.manage"),
    asyncHandler(async (req, res) => {
      const { id } = idParamSchema.parse(req.params);
      const data = await approvePayroll(id, contextFromRequest(req));
      res.json({ status: "ok", data });
    })
  );

  router.post(
    "/:id/publish",
    requirePermission("payroll.publish"),
    asyncHandler(async (req, res) => {
      const { id } = idParamSchema.parse(req.params);
      const data = await publishPayroll(id, contextFromRequest(req));
      res.json({ status: "ok", data });
    })
  );

  router.post(
    "/:id/lock",
    requirePermission("payroll.manage"),
    asyncHandler(async (req, res) => {
      const { id } = idParamSchema.parse(req.params);
      const data = await lockPayroll(id, contextFromRequest(req));
      res.json({ status: "ok", data });
    })
  );
};

registerPayrollCollectionRoutes(payrollRouter);
registerPayrollCollectionRoutes(payrollsRouter);

payslipsRouter.use(requireAuth);
payslipsRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const query = payslipQuerySchema.parse(req.query);
    const data = await getOwnPayslip(req.user, query.month);
    res.json({ status: "ok", data });
  })
);
