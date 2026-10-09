import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
    try {
        const {  email, password,  } = req.body; 
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const user = await User.findOne({  
            email: email.toLowerCase().trim()
        }).select("+password");
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        if (user.status !== "active") {
            return res.status(403).json({ message: "User account is inactive" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
       const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d"
      }
    );
    return res.status(200).json({
      message: "Login successful",
      token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status
        }
    });
    } catch (error) {
        console.error("Login failed:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

