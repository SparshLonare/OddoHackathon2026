const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // store hashed, never plain text
  role: {
    type: String,
    enum: ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'],
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);