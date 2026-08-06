export function validateAlumniId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return {
      valid: false,
      error: {
        code: "INVALID_ALUMNI_ID",
        message: "Alumni ID must be a positive integer."
      }
    };
  }

  return {
    valid: true,
    value: id
  };
}