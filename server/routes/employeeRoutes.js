
import express from "express";

import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(authorize("admin", "manager"), getEmployees)
  .post(authorize("admin", "manager"), createEmployee);

router
  .route("/:id")
  .get(
    authorize("admin", "manager"),
    validateObjectId("id"),
    getEmployeeById
  )
  .put(
    authorize("admin", "manager"),
    validateObjectId("id"),
    updateEmployee
  )
  .delete(
    authorize("admin"),
    validateObjectId("id"),
    deleteEmployee
  );

export default router;
