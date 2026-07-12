const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  description: { type: String, required: true }, // e.g., "Oil Change"
  cost: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['Active', 'Closed'],
    default: 'Active',
  },
  scheduledDate: { type: Date, default: Date.now },
  closedDate: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);