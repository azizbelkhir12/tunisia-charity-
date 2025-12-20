const mongoose = require('mongoose');

const DemandeSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 3, maxlength: 50 },
  Prenom: { type: String, required: true, minlength: 3, maxlength: 50 },
  age: { type: Number, required: true, min: 18, max: 99 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, required: true, minlength: 5, maxlength: 100 },
  phone: { type: String, required: true },
  gouvernorat: { type: String, required: true },
  reason: { type: String, required: true, minlength: 10, maxlength: 300 },
  image: { type: String } ,// Path to the uploaded image
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending' 
  },
  otp: String,
  otpExpires: Date,
  isVerified: { type: Boolean, default: false },
});

module.exports = mongoose.model('Demande', DemandeSchema);
