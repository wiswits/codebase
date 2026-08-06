import {
  cancelVisitorEntry,
  checkInVisitor,
  checkOutVisitor,
  getVisitor,
  issueVisitorPass,
  listVisitors,
} from "./visitor.service.js";

import {
  validateCheckIn,
  validateVisitorFilters,
  validateVisitorId,
} from "./visitor.validator.js";

import {
  audit,
} from "../../platform-adapters/audit.js";

function validationError(res, message) {
  return res.status(400).json({
    success: false,
    message,
  });
}

export async function listVisitorsController(
  req,
  res,
  next
) {
  try {
    const validation =
      validateVisitorFilters(req.query);

    if (!validation.valid) {
      return validationError(
        res,
        validation.error
      );
    }

    const result = await listVisitors(
      req.user.org_id,
      validation.value
    );

    return res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getVisitorController(
  req,
  res,
  next
) {
  try {
    const validation =
      validateVisitorId(req.params.visitorId);

    if (!validation.valid) {
      return validationError(
        res,
        validation.error
      );
    }

    const visitor = await getVisitor(
      req.user.org_id,
      validation.value
    );

    return res.status(200).json({
      success: true,
      data: visitor,
    });
  } catch (error) {
    next(error);
  }
}

export async function checkInVisitorController(
  req,
  res,
  next
) {
  try {
    const validation =
      validateCheckIn(req.body);

    if (!validation.valid) {
      return validationError(
        res,
        validation.error
      );
    }

    const result = await checkInVisitor(
      req.user.org_id,
      req.user.id,
      validation.value
    );

    await audit(
      req,
      "visitor.created",
      "visitor",
      result.visitor.id
    );

    return res.status(201).json({
      success: true,
      message: "Visitor checked in successfully.",
      data: result.visitor,
      notification: result.notification,
    });
  } catch (error) {
    next(error);
  }
}

export async function issuePassController(
  req,
  res,
  next
) {
  try {
    const validation =
      validateVisitorId(req.params.visitorId);

    if (!validation.valid) {
      return validationError(
        res,
        validation.error
      );
    }

    let expiresAt = null;

    if (req.body?.expiresAt) {
      const parsed = new Date(
        req.body.expiresAt
      );

      if (Number.isNaN(parsed.getTime())) {
        return validationError(
          res,
          "expiresAt must be a valid date."
        );
      }

      expiresAt = parsed;
    }

    const pass = await issueVisitorPass(
      req.user.org_id,
      validation.value,
      expiresAt
    );

    await audit(
      req,
      "visitor.pass_generated",
      "visitor_pass",
      pass.id,
      {
        visitor_id: validation.value,
      }
    );

    return res.status(201).json({
      success: true,
      message:
        "Visitor pass generated successfully.",
      data: pass,
    });
  } catch (error) {
    next(error);
  }
}

export async function checkOutVisitorController(
  req,
  res,
  next
) {
  try {
    const validation =
      validateVisitorId(req.params.visitorId);

    if (!validation.valid) {
      return validationError(
        res,
        validation.error
      );
    }

    const visitor = await checkOutVisitor(
      req.user.org_id,
      validation.value,
      req.user.id
    );

    await audit(
      req,
      "visitor.checked_out",
      "visitor",
      visitor.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Visitor checked out successfully.",
      data: visitor,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelVisitorController(
  req,
  res,
  next
) {
  try {
    const validation =
      validateVisitorId(req.params.visitorId);

    if (!validation.valid) {
      return validationError(
        res,
        validation.error
      );
    }

    const visitor = await cancelVisitorEntry(
      req.user.org_id,
      validation.value
    );

    await audit(
      req,
      "visitor.cancelled",
      "visitor",
      visitor.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Visitor entry cancelled successfully.",
      data: visitor,
    });
  } catch (error) {
    next(error);
  }
}