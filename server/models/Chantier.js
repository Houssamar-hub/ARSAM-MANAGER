import mongoose from "mongoose";

const chantierSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Chantier name is required"],
            trim: true
        },
        description: {
            type: String,
            trim: true,
            default: ""
        },
        location: {
            type: String,
            trim: true,
            required: [true, "Chantier location is required"]
        },
        budget: {
            type: Number,
            required: [true, "Chantier budget is required"],
            main : 0
        },
        startDate: {
            type: Date, 
            required: [true, "Chantier start date is required"]
        },
        endDate: {
            type: Date, 
            required: [true, "Chantier end date is required"]
        },
        status: {
            type: String,
            enum: ["planned", "in-progress", "completed", "on-hold", "cancelled"],
            default: "planned"
        },
        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Chantier manager is required"]
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Chantier created by is required"]
        }
    },
    {
        timestamps: true
    }
);
const Chantier = mongoose.model("Chantier", chantierSchema);
export default Chantier;