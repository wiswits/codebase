import { Router } from "express";

import {
  listAlumni,
  getAlumniById,
  getAlumniStats,
  getAlumniBatches
} from "./controllers/alumni.controller.js";

import {
  searchAlumni
} from "./controllers/alumni.search.controller.js";

const router = Router();

/*
 * Directory
 *
 * Supports:
 * search
 * batch
 * graduationYear
 * course
 * page
 * limit
 */
router.get("/", listAlumni);

/*
 * Explicit search endpoint.
 * The canonical directory endpoint above also supports
 * search/filter query parameters.
 */
router.get("/search", searchAlumni);

/*
 * Dashboard statistics
 */
router.get("/stats", getAlumniStats);

/*
 * Batch view
 */
router.get("/batches", getAlumniBatches);

/*
 * Individual Alumni profile.
 * Keep this AFTER /stats, /batches and /search.
 */
router.get("/:id", getAlumniById);

export default router;