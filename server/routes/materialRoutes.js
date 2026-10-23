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
  .get(getMaterials)
  .post(authorize("admin", "manager"), createMaterial);

router
  .route("/:id")
  .get(validateObjectId("id"), getMaterialById)
  .put(
    authorize("admin", "manager"),
    validateObjectId("id"),
    updateMaterial
  )
  .delete(
    authorize("admin"),
    validateObjectId("id"),
    deleteMaterial
  );

export default router;
