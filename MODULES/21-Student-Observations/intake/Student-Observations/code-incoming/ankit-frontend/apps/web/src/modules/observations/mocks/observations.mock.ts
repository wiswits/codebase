import type {
  Observation,
  ObservationAuthor,
  Student,
} from "../types/observation.types";

export const mockStudents: Student[] = [
  {
    id: 100001,
    name: "Aarav Sharma",
    studentCode: "STU-1001",
    className: "Class 8",
    sectionName: "A",
  },
  {
    id: 100002,
    name: "Diya Singh",
    studentCode: "STU-1002",
    className: "Class 8",
    sectionName: "A",
  },
  {
    id: 100003,
    name: "Ananya Verma",
    studentCode: "STU-1003",
    className: "Class 7",
    sectionName: "B",
  },
  {
    id: 100004,
    name: "Kabir Malhotra",
    studentCode: "STU-1004",
    className: "Class 9",
    sectionName: "A",
  },
];

export const mockAuthors: ObservationAuthor[] = [
  {
    id: 500001,
    name: "Meera Kapoor",
    role: "Teacher",
  },
  {
    id: 500002,
    name: "Rohan Mehta",
    role: "Academic Coordinator",
  },
];

export let mockObservations: Observation[] = [
  {
    id: 1,
    organizationId: 900001,
    studentId: 100001,
    authorId: 500001,
    observationType: "anecdotal",
    content:
      "Aarav participated constructively during the classroom activity and explained his approach clearly to the group.",
    createdAt: "2026-07-27T09:30:00.000Z",
    updatedAt: "2026-07-27T09:30:00.000Z",
    student: mockStudents[0],
    author: mockAuthors[0],
  },
  {
    id: 2,
    organizationId: 900001,
    studentId: 100002,
    authorId: 500001,
    observationType: "class_school",
    content:
      "Diya contributed positively during the school activity and collaborated effectively with her classmates.",
    createdAt: "2026-07-27T11:15:00.000Z",
    updatedAt: "2026-07-27T11:15:00.000Z",
    student: mockStudents[1],
    author: mockAuthors[0],
  },
  {
    id: 3,
    organizationId: 900001,
    studentId: 100003,
    authorId: 500002,
    observationType: "anecdotal",
    content:
      "Ananya demonstrated careful listening during the discussion and responded thoughtfully when invited to contribute.",
    createdAt: "2026-07-28T08:45:00.000Z",
    updatedAt: "2026-07-28T08:45:00.000Z",
    student: mockStudents[2],
    author: mockAuthors[1],
  },
];