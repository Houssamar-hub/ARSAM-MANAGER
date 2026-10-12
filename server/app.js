import express from "express";
import cors from "cors";
import { getme, register } from "./controllers/authController.js";
import { protect } from "./middleware/authMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import chantierRoutes from "./routes/chantierRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";const app = express();
import materialRoutes from "./routes/materialRoutes.js";

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
app.use("/api/chantiers", chantierRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/materials", materialRoutes);
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body must be valid JSON" });
  }

  return next(error);
});

export default app;