import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    name: { 
        type: String,
        required: true, 
        trim: true
        },
    email: { 
        type: String, 
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: { 
        type: String,
        required: true,
        select: false,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'employee'],
        default: 'employee'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
  },
  {
    timestamps: true
  }
);
const User = mongoose.model("User", userSchema);
export default User;