// src/modules/observations/mocks/observations.mock.ts
//
// Mock data for Student Observations (Sunidhi's scope).
// Fictional records only — no real student data (Section 21).
// Field shape matches the Canonical Observation API Model (Section 20).

import { Observation } from "../types/observation.types";

export const MOCK_OBSERVATIONS: Observation[] = [
  {
    id: 1,
    organizationId: 1,
    studentId: 101,
    authorId: 501,
    observationType: "anecdotal",
    content:
      "Showed strong initiative during the group science activity, helping a peer who was struggling with the setup.",
    createdAt: "2026-07-10T09:15:00Z",
    updatedAt: "2026-07-10T09:15:00Z",
    studentName: "Aarav Sharma",
    authorName: "Ms. Priya Nair",
  },
  {
    id: 2,
    organizationId: 1,
    studentId: 102,
    authorId: 502,
    observationType: "class_school",
    content:
      "Participated actively in the inter-house debate and represented the class well during the school assembly.",
    createdAt: "2026-07-12T11:40:00Z",
    updatedAt: "2026-07-12T11:40:00Z",
    studentName: "Diya Verma",
    authorName: "Mr. Rakesh Menon",
  },
  {
    id: 3,
    organizationId: 1,
    studentId: 103,
    authorId: 501,
    observationType: "anecdotal",
    content:
      "Needed additional encouragement to participate in today's reading circle but engaged well once prompted.",
    createdAt: "2026-07-14T08:05:00Z",
    updatedAt: "2026-07-14T08:05:00Z",
    studentName: "Kabir Malhotra",
    authorName: "Ms. Priya Nair",
  },
  {
    id: 4,
    organizationId: 1,
    studentId: 104,
    authorId: 503,
    observationType: "class_school",
    content:
      "Volunteered to help organize the classroom for the annual day rehearsal, showing good teamwork.",
    createdAt: "2026-07-15T13:20:00Z",
    updatedAt: "2026-07-15T13:20:00Z",
    studentName: "Isha Nair",
    authorName: "Mrs. Sunita Rao",
  },
  {
    id: 5,
    organizationId: 1,
    studentId: 105,
    authorId: 502,
    observationType: "anecdotal",
    content:
      "Displayed good problem-solving skills while working through a challenging math worksheet independently.",
    createdAt: "2026-07-17T10:00:00Z",
    updatedAt: "2026-07-17T10:00:00Z",
    studentName: "Rohan Gupta",
    authorName: "Mr. Rakesh Menon",
  },
  {
    id: 6,
    organizationId: 1,
    studentId: 106,
    authorId: 501,
    observationType: "class_school",
    content:
      "Represented the school at the regional sports meet and demonstrated good sportsmanship throughout.",
    createdAt: "2026-07-19T15:30:00Z",
    updatedAt: "2026-07-19T15:30:00Z",
    studentName: "Ananya Iyer",
    authorName: "Ms. Priya Nair",
  },
  {
    id: 7,
    organizationId: 1,
    studentId: 107,
    authorId: 503,
    observationType: "anecdotal",
    content:
      "Was noticeably quieter than usual during group work today; worth a gentle check-in over the next few days.",
    createdAt: "2026-07-21T09:45:00Z",
    updatedAt: "2026-07-21T09:45:00Z",
    studentName: "Vivaan Kapoor",
    authorName: "Mrs. Sunita Rao",
  },
  {
    id: 8,
    organizationId: 1,
    studentId: 108,
    authorId: 502,
    observationType: "class_school",
    content:
      "Took the lead in coordinating the classroom's contribution to the school's book donation drive.",
    createdAt: "2026-07-23T12:10:00Z",
    updatedAt: "2026-07-23T12:10:00Z",
    studentName: "Myra Joshi",
    authorName: "Mr. Rakesh Menon",
  },
];
