
import express from "express";

import {
  createChantier,
  getChantiers,
  getChantierById,
  updateChantier,
  deleteChantier
} from "../controllers/chantierController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getChantiers)
  .post(authorize("admin", "manager"), createChantier);

router.route("/:id")
  .get(getChantierById)
  .put(authorize("admin", "manager"), updateChantier)
  .delete(authorize("admin"), deleteChantier);

export default router;
