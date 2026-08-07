const VALID_STATUSES = [
  "checked_in",
  "checked_out",
  "cancelled",
];

function cleanString(value) {
  return typeof value === "string" ? value.trim() : value;
}

export function validateVisitorId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return {
      valid: false,
      error: "Visitor ID must be a positive integer.",
    };
  }

  return {
    valid: true,
    value: id,
  };
}

export function validateCheckIn(body = {}) {
  const visitorName = cleanString(body.visitorName);
  const visitorPhone = cleanString(body.visitorPhone);
  const visitorEmail = cleanString(body.visitorEmail);
  const visitorType = cleanString(body.visitorType);
  const purpose = cleanString(body.purpose);
  const hostName = cleanString(body.hostName);

  const hostId = Number(body.hostId);

  if (!visitorName) {
    return {
      valid: false,
      error: "Visitor name is required.",
    };
  }

  if (visitorName.length > 150) {
    return {
      valid: false,
      error: "Visitor name cannot exceed 150 characters.",
    };
  }

  if (!purpose) {
    return {
      valid: false,
      error: "Purpose is required.",
    };
  }

  if (purpose.length > 255) {
    return {
      valid: false,
      error: "Purpose cannot exceed 255 characters.",
    };
  }

  if (!Number.isInteger(hostId) || hostId <= 0) {
    return {
      valid: false,
      error: "A valid host ID is required.",
    };
  }

  if (visitorPhone && visitorPhone.length > 30) {
    return {
      valid: false,
      error: "Visitor phone cannot exceed 30 characters.",
    };
  }

  if (
    visitorEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail)
  ) {
    return {
      valid: false,
      error: "Visitor email is invalid.",
    };
  }

  if (visitorEmail && visitorEmail.length > 150) {
    return {
      valid: false,
      error: "Visitor email cannot exceed 150 characters.",
    };
  }

  if (visitorType && visitorType.length > 50) {
    return {
      valid: false,
      error: "Visitor type cannot exceed 50 characters.",
    };
  }

  if (hostName && hostName.length > 150) {
    return {
      valid: false,
      error: "Host name cannot exceed 150 characters.",
    };
  }

  return {
    valid: true,

    value: {
      visitorName,
      visitorPhone: visitorPhone || null,
      visitorEmail: visitorEmail || null,
      visitorType: visitorType || null,
      purpose,
      hostId,
      hostName: hostName || null,
    },
  };
}

export function validateVisitorFilters(query = {}) {
  const search = cleanString(query.search) || "";
  const status = cleanString(query.status) || null;
  const visitorType = cleanString(query.visitorType) || null;

  const page = Math.max(
    Number.parseInt(query.page, 10) || 1,
    1
  );

  const limit = Math.min(
    Math.max(Number.parseInt(query.limit, 10) || 20, 1),
    100
  );

  if (status && !VALID_STATUSES.includes(status)) {
    return {
      valid: false,
      error: `Status must be one of: ${VALID_STATUSES.join(", ")}.`,
    };
  }

  if (search.length > 150) {
    return {
      valid: false,
      error: "Search value cannot exceed 150 characters.",
    };
  }

  if (visitorType && visitorType.length > 50) {
    return {
      valid: false,
      error: "Visitor type cannot exceed 50 characters.",
    };
  }

  return {
    valid: true,

    value: {
      search,
      status,
      visitorType,
      page,
      limit,
      offset: (page - 1) * limit,
    },
  };
}