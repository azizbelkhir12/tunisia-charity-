const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const BeneficiarySchema = new mongoose.Schema({
  name: { type: String, required: true },
  lastname: { type: String, required: true },
  address: { type: String, required: true },
  Age: { type: Number, required: true },
  gouvernorat: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  photoUrl: { type: String },
  documents: [
    {
      data: Buffer,
      originalName: String,
      mimeType: String,
      size: Number,
      description: {
        type: String,
        required: false,
        default: "",
      },
    },
  ],

  children: [
    {
      name: { type: String, required: true },
      age: { type: Number, required: true },
    },
  ],
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

// Hash the password before saving it to the database
BeneficiarySchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model("Beneficiary", BeneficiarySchema);
