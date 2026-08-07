import { Router } from "express";

import {
  cancelVisitorController,
  checkInVisitorController,
  checkOutVisitorController,
  getVisitorController,
  issuePassController,
  listVisitorsController,
} from "./visitor.controller.js";

import {
  authenticate,
} from "../../platform-adapters/authenticate.js";

import {
  requirePermission,
} from "../../platform-adapters/permissions.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  requirePermission("visitor:view"),
  listVisitorsController
);

router.get(
  "/:visitorId",
  requirePermission("visitor:view"),
  getVisitorController
);

router.post(
  "/check-in",
  requirePermission("visitor:create"),
  checkInVisitorController
);

router.post(
  "/:visitorId/pass",
  requirePermission("visitor:pass:create"),
  issuePassController
);

router.patch(
  "/:visitorId/check-out",
  requirePermission("visitor:checkout"),
  checkOutVisitorController
);

router.patch(
  "/:visitorId/cancel",
  requirePermission("visitor:update"),
  cancelVisitorController
);

export default router;