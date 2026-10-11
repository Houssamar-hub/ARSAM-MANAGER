
import express from "express";
import {
  createEquipment,
  getEquipments,
  getEquipmentById,
  updateEquipment,
  deleteEquipment
} from "../controllers/equipmentController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(authorize("admin", "manager"), getEquipments)
  .post(authorize("admin", "manager"), createEquipment);

router.route("/:id")
  .get(authorize("admin", "manager"), getEquipmentById)
  .put(authorize("admin", "manager"), updateEquipment)
  .delete(authorize("admin"), deleteEquipment);

export default router;
