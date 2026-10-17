
import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import chantierRoutes from "./routes/chantierRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import stockMovementRoutes from "./routes/stockMovementRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ARSAM MANAGER API is running",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/chantiers", chantierRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/stock-movements", stockMovementRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/attendances", attendanceRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Global Error Handler
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Request body must be valid JSON",
    });
  }



  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists",
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;
