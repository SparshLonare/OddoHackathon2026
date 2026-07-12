const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  source: { type: String, required: true },
  destination: { type: String, required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  cargoWeight: { type: Number, required: true, min: 0 }, // must be <= vehicle.maxLoadCapacity, enforced in controller
  plannedDistance: { type: Number, required: true, min: 0 },
  actualDistance: { type: Number, default: null },
  fuelConsumed: { type: Number, default: null }, // liters, filled on completion
  status: {
    type: String,
    enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'],
    default: 'Draft',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);