import {
  searchAlumniDirectory
} from "../services/alumni.search.service.js";

import {
  validateAlumniQuery
} from "../validators/alumni.query.validator.js";

export async function searchAlumni(req, res) {
  try {
    const validation = validateAlumniQuery(
      req.query
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    const data = await searchAlumniDirectory({
      orgId: req.orgId,
      ...validation.value
    });

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error("Alumni search error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "ALUMNI_SEARCH_ERROR",
        message: "Unable to search alumni."
      }
    });
  }
}