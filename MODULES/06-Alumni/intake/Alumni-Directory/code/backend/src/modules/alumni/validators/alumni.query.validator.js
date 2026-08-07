const MAX_LIMIT = 100;

export function validateAlumniQuery(query = {}) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);

  if (!Number.isInteger(page) || page < 1) {
    return {
      valid: false,
      error: {
        code: "INVALID_PAGE",
        message: "Page must be a positive integer."
      }
    };
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return {
      valid: false,
      error: {
        code: "INVALID_LIMIT",
        message: `Limit must be between 1 and ${MAX_LIMIT}.`
      }
    };
  }

  let graduationYear;

  if (
    query.graduationYear !== undefined &&
    query.graduationYear !== ""
  ) {
    graduationYear = Number(query.graduationYear);

    if (
      !Number.isInteger(graduationYear) ||
      graduationYear < 1900 ||
      graduationYear > 2200
    ) {
      return {
        valid: false,
        error: {
          code: "INVALID_GRADUATION_YEAR",
          message: "Graduation year is invalid."
        }
      };
    }
  }

  const cleanString = (value, maxLength) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    const cleaned = String(value).trim();

    if (!cleaned) {
      return undefined;
    }

    return cleaned.slice(0, maxLength);
  };

  return {
    valid: true,

    value: {
      page,
      limit,
      search: cleanString(query.search, 150),
      batch: cleanString(query.batch, 100),
      graduationYear,
      course: cleanString(query.course, 150)
    }
  };
}