import {
  CURRENT_DEMO_AUTHOR_ID,
  CURRENT_DEMO_ORGANIZATION_ID,
} from "../constants/observation.constants";

import {
  mockAuthors,
  mockObservations,
  mockStudents,
} from "../mocks/observations.mock";

import type {
  ApiResponse,
  CreateObservationPayload,
  Observation,
  Student,
  UpdateObservationPayload,
} from "../types/observation.types";

const delay = (ms = 250) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function getStudents(): Promise<ApiResponse<Student[]>> {
  await delay();

  return {
    success: true,
    data: mockStudents,
  };
}

export async function getObservations(): Promise<
  ApiResponse<Observation[]>
> {
  await delay();

  return {
    success: true,
    data: [...mockObservations].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    ),
  };
}

export async function getObservationById(
  id: number
): Promise<ApiResponse<Observation>> {
  await delay();

  const observation = mockObservations.find(
    (item) => item.id === id
  );

  if (!observation) {
    throw new Error("Observation not found.");
  }

  return {
    success: true,
    data: observation,
  };
}

export async function createObservation(
  payload: CreateObservationPayload
): Promise<ApiResponse<Observation>> {
  await delay(400);

  const student = mockStudents.find(
    (item) => item.id === payload.studentId
  );

  if (!student) {
    throw new Error("Selected student could not be found.");
  }

  const author = mockAuthors.find(
    (item) => item.id === CURRENT_DEMO_AUTHOR_ID
  );

  const nextId =
    mockObservations.length === 0
      ? 1
      : Math.max(...mockObservations.map((item) => item.id)) + 1;

  const now = new Date().toISOString();

  const observation: Observation = {
    id: nextId,
    organizationId: CURRENT_DEMO_ORGANIZATION_ID,
    studentId: payload.studentId,
    authorId: CURRENT_DEMO_AUTHOR_ID,
    observationType: payload.observationType,
    content: payload.content.trim(),
    createdAt: now,
    updatedAt: now,
    student,
    author,
  };

  mockObservations.unshift(observation);

  return {
    success: true,
    data: observation,
    message: "Observation created successfully.",
  };
}

export async function updateObservation(
  id: number,
  payload: UpdateObservationPayload
): Promise<ApiResponse<Observation>> {
  await delay(400);

  const index = mockObservations.findIndex(
    (item) => item.id === id
  );

  if (index === -1) {
    throw new Error("Observation not found.");
  }

  const updated: Observation = {
    ...mockObservations[index],
    observationType: payload.observationType,
    content: payload.content.trim(),
    updatedAt: new Date().toISOString(),
  };

  mockObservations[index] = updated;

  return {
    success: true,
    data: updated,
    message: "Observation updated successfully.",
  };
}