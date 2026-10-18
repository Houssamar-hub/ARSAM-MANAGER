
import express from "express";

import {
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
} from "../controllers/materialController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(authorize("admin", "manager"), getMaterials)
  .post(authorize("admin", "manager"), createMaterial);


export default router;
