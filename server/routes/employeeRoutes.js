
import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
} from "../controllers/employeeController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(authorize("admin", "manager"), getEmployees)
  .post(authorize("admin", "manager"), createEmployee);

router.route("/:id")
  .get(authorize("admin", "manager"), getEmployeeById)
  .put(authorize("admin", "manager"), updateEmployee)
  .delete(authorize("admin"), deleteEmployee);

export default router;
