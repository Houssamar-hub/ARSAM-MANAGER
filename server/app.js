
import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import chantierRoutes from "./routes/chantierRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "ARSAM MANAGER API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/chantiers", chantierRoutes);
app.use("/api/materials", materialRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

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

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large",
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(error.errors).map(
        (item) => item.message
      ),
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid data identifier or value",
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists",
    });
  }

  console.error("Unhandled application error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;
