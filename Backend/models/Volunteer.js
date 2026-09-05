const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { layouts } = require("chart.js");

const volunteerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  age: { type: Number, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false }, // Exclude password from queries by default
  phone: { type: String, required: true },
  address: { type: String, required: true },
  gouvernorat: { type: String, required: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  photoUrl: { type: String },
  role: { type: String, default: "volunteer" },
  joinedAt: { type: Date, default: Date.now },
  notifications: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification",
      },
    ],
    default: [],
  },

  readNotifications: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification",
      },
    ],
    default: [],
  },
});

// ✅ Hash password only if it's modified (Prevents double hashing)
volunteerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // ✅ Prevents re-hashing

  try {
    if (this.password.startsWith("$2b$")) {
      console.log("🔹 Password already hashed, skipping...");
      return next(); // ✅ Skip hashing if already hashed
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("🔹 Hashed Password Before Saving:", this.password);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Volunteer", volunteerSchema);
