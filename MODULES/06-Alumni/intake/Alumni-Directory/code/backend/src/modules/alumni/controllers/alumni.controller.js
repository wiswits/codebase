import {
  getAlumniList,
  getAlumniProfile
} from "../services/alumni.service.js";

import {
  getDashboardStatistics,
  getBatchOverview
} from "../services/alumni.stats.service.js";

import {
  validateAlumniId
} from "../validators/alumni.validator.js";

import {
  validateAlumniQuery
} from "../validators/alumni.query.validator.js";

export async function listAlumni(req, res) {
  try {
    const validation = validateAlumniQuery(req.query);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    const data = await getAlumniList({
      orgId: req.orgId,
      ...validation.value
    });

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error("Alumni list error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "ALUMNI_LIST_ERROR",
        message: "Unable to retrieve alumni records."
      }
    });
  }
}

export async function getAlumniById(req, res) {
  try {
    const validation = validateAlumniId(
      req.params.id
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    const alumni = await getAlumniProfile({
      orgId: req.orgId,
      alumniId: validation.value
    });

    if (!alumni) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ALUMNI_NOT_FOUND",
          message: "Alumni record not found."
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: alumni
    });
  } catch (error) {
    console.error("Alumni profile error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "ALUMNI_PROFILE_ERROR",
        message: "Unable to retrieve alumni profile."
      }
    });
  }
}

export async function getAlumniStats(req, res) {
  try {
    const data = await getDashboardStatistics(
      req.orgId
    );

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error("Alumni stats error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "ALUMNI_STATS_ERROR",
        message: "Unable to retrieve alumni statistics."
      }
    });
  }
}

export async function getAlumniBatches(req, res) {
  try {
    const data = await getBatchOverview(
      req.orgId
    );

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error("Alumni batches error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "ALUMNI_BATCHES_ERROR",
        message: "Unable to retrieve alumni batches."
      }
    });
  }
}