
import express from "express";

import {
  createChantier,
  getChantiers,
  getChantierById,
  updateChantier,
  deleteChantier,
  getCompletedChantier,
} from "../controllers/chantierController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(protect);

router.get("/completed-chantier", getCompletedChantier)

router
  .route("/")
  .get(getChantiers)
  .post(authorize("admin", "manager"), createChantier);

router
  .route("/:id")
  .get(validateObjectId("id"), getChantierById)
  .put(
    authorize("admin", "manager"),
    validateObjectId("id"),
    updateChantier
  )
  .delete(
    authorize("admin"),
    validateObjectId("id"),
    deleteChantier
  );

export default router;
