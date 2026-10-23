
import express from "express";

import {
  login,
  register,
  getme,
  getManagers,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/me", protect, getme);
router.get("/managers", protect, getManagers);

export default router;
