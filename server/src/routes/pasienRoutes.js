import { Router } from "express";
import {
  createPatient,
  deletePatient,
  getPatients,
  updatePatient
} from "../controllers/pasienController.js";

export const pasienRoutes = Router();

pasienRoutes.get("/", getPatients);
pasienRoutes.post("/", createPatient);
pasienRoutes.put("/:id", updatePatient);
pasienRoutes.delete("/:id", deletePatient);
