
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const getPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
});

const normalizeEmail = (email) => email.trim().toLowerCase();

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getJwtSecret = () => process.env.JWT_SECRET;

// Register user
export const register = async (req, res) => {
  const { name, email, password } = req.body || {};

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !isValidEmail(email.trim()) ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Provide a name, valid email, and password of at least 8 characters",
    });
  }

  if (!getJwtSecret()) {
    console.error("Register failed: JWT_SECRET is not configured");

    return res.status(500).json({
      success: false,
      message: "Authentication is not configured",
    });
  }

  try {
    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "employee",
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: getPublicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid registration details",
      });
    }

    console.error("Register failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Login user
export const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (
    typeof email !== "string" ||
    !isValidEmail(email.trim()) ||
    typeof password !== "string" ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email and password",
    });
  }

  const jwtSecret = getJwtSecret();

  if (!jwtSecret) {
    console.error("Login failed: JWT_SECRET is not configured");

    return res.status(500).json({
      success: false,
      message: "Authentication is not configured",
    });
  }

  try {
    const user = await User.findOne({
      email: normalizeEmail(email),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: getPublicUser(user),
    });
  } catch (error) {
    console.error("Login failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get current user
export const getme = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get current user failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all managers and admins (for dropdowns)
export const getManagers = async (req, res) => {
  try {
    const managers = await User.find(
      { status: 'active', role: { $in: ['admin', 'manager'] } },
      'name email role'
    ).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      managers,
    });
  } catch (error) {
    console.error('Get managers failed:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
