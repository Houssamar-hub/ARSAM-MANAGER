
import express from "express";
import {
  createStockMovement,
  getStockMovements,
  getStockMovementById
} from "../controllers/stockMovementController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(authorize("admin", "manager"), getStockMovements)
  .post(authorize("admin", "manager"), createStockMovement);

router.get("/:id", authorize("admin", "manager"), getStockMovementById);

export default router;
