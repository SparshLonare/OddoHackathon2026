const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  registrationNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
  name: { type: String, required: true },       // Vehicle Name/Model
  type: { type: String, required: true },        // Truck, Van, Mini-Truck, Trailer
  maxLoadCapacity: { type: Number, required: true, min: 0 }, // kg
  odometer: { type: Number, default: 0, min: 0 },
  acquisitionCost: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['Available', 'On Trip', 'In Shop', 'Retired'],
    default: 'Available',
  },
  region: { type: String, default: '' }, // for dashboard filters
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);