import {
  getAlumniStatistics,
  getAlumniBatches
} from "../repositories/alumni.search.repository.js";

export async function getDashboardStatistics(orgId) {
  return getAlumniStatistics(orgId);
}

export async function getBatchOverview(orgId) {
  return getAlumniBatches(orgId);
}