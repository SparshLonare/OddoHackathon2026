const Vehicle = require('../models/Vehicle');

// @desc    Get all vehicles (with optional filters)
// @route   GET /api/vehicles
const getVehicles = async (req, res) => {
  try {
    const { type, status, region } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (region) filter.region = region;

    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching vehicles' });
  }
};

// @desc    Get single vehicle by ID
// @route   GET /api/vehicles/:id
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching vehicle' });
  }
};

// @desc    Create a new vehicle
// @route   POST /api/vehicles
const createVehicle = async (req, res) => {
  try {
    const { registrationNumber, name, type, maxLoadCapacity, odometer, acquisitionCost, region } = req.body;

    if (!registrationNumber || !name || !type || !maxLoadCapacity || !acquisitionCost) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const existing = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'A vehicle with this registration number already exists' });
    }

    const vehicle = await Vehicle.create({
      registrationNumber,
      name,
      type,
      maxLoadCapacity,
      odometer: odometer || 0,
      acquisitionCost,
      region: region || '',
    });

    res.status(201).json(vehicle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating vehicle' });
  }
};

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Prevent editing into a duplicate registration number
    if (req.body.registrationNumber && req.body.registrationNumber.toUpperCase() !== vehicle.registrationNumber) {
      const dup = await Vehicle.findOne({ registrationNumber: req.body.registrationNumber.toUpperCase() });
      if (dup) {
        return res.status(400).json({ message: 'Another vehicle already uses this registration number' });
      }
    }

    Object.assign(vehicle, req.body);
    const updated = await vehicle.save();
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating vehicle' });
  }
};

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ message: 'Cannot delete a vehicle that is currently on a trip' });
    }

    await vehicle.deleteOne();
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting vehicle' });
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};