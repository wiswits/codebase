import { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

declare global {
  namespace Express {
    interface Request {
      organizationId?: number;
    }
  }
}

export function tenantMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  /*
   * DEVELOPMENT / INTEGRATION MODE:
   *
   * In the final EduSuite SaaS this value must come from the
   * authenticated tenant context.
   *
   * We deliberately do NOT trust req.body.organizationId.
   */

  req.organizationId = env.defaultOrganizationId;

  next();
}