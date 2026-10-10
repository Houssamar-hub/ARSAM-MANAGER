
import express from "express";
import { login, register, getme  } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/me", protect, getme);

export default router;