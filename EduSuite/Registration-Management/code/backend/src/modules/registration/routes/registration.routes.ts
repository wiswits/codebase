import { Router } from "express";
import {
  createRegistrationController,
  getRegistrationController,
  listRegistrationsController,
  updateRegistrationController,
} from "../controllers/registration.controller.js";
import {
  createDocumentController,
  listDocumentsController,
  updateDocumentController,
} from "../controllers/document.controller.js";

export const registrationRouter = Router();

registrationRouter.get(
  "/",
  listRegistrationsController,
);

registrationRouter.post(
  "/",
  createRegistrationController,
);

registrationRouter.get(
  "/:id",
  getRegistrationController,
);

registrationRouter.patch(
  "/:id",
  updateRegistrationController,
);

registrationRouter.get(
  "/:id/documents",
  listDocumentsController,
);

registrationRouter.post(
  "/:id/documents",
  createDocumentController,
);

registrationRouter.patch(
  "/:id/documents/:documentId",
  updateDocumentController,
);