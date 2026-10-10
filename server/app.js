import express from "express";
import cors from "cors";
import { getme, register } from "./controllers/authController.js";
import { protect } from "./middleware/authMiddleware.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "ARSAM MANAGER API is running"
  });
});

app.use("/api/auth", authRoutes);
app.post("/api/users/register", register);
app.get("/api/users/me", protect, getme);

app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body must be valid JSON" });
  }

  return next(error);
});

export default app;