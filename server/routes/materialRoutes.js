
import express from "express";
import {
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial
} from "../controllers/materialController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(authorize("admin", "manager"), getMaterials)
  .post(authorize("admin", "manager"), createMaterial);

router.route("/:id")
  .get(authorize("admin", "manager"), getMaterialById)
  .put(authorize("admin", "manager"), updateMaterial)
  .delete(authorize("admin"), deleteMaterial);

export default router;
