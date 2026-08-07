const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};

const REVIEW_TYPE = {
    SELF: "self",
    REVIEWER: "reviewer"
};

const REVIEW_STATUS = {
    DRAFT: "draft",
    SUBMITTED: "submitted",
    APPROVED: "approved",
    REJECTED: "rejected"
};

const GOAL_STATUS = {
    PENDING: "pending",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled"
};

const CYCLE_STATUS = {
    DRAFT: "draft",
    ACTIVE: "active",
    COMPLETED: "completed",
    ARCHIVED: "archived"
};

module.exports = {
    HTTP_STATUS,
    REVIEW_TYPE,
    REVIEW_STATUS,
    GOAL_STATUS,
    CYCLE_STATUS
};