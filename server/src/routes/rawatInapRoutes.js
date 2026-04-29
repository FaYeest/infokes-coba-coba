import { Router } from "express";
import {
  createInpatient,
  getInpatients,
  updateDiagnosis,
  updateRoom,
  updateStatus
} from "../controllers/rawatInapController.js";

export const rawatInapRoutes = Router();

rawatInapRoutes.get("/", getInpatients);
rawatInapRoutes.post("/", createInpatient);
rawatInapRoutes.patch("/:id/diagnosa", updateDiagnosis);
rawatInapRoutes.patch("/:id/kamar", updateRoom);
rawatInapRoutes.patch("/:id/status", updateStatus);
