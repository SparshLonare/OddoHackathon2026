const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');

// @desc    Get all maintenance records
// @route   GET /api/maintenance
const getMaintenanceRecords = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const records = await Maintenance.find(filter)
      .populate('vehicle', 'registrationNumber name type status')
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching maintenance records' });
  }
};

// @desc    Get single maintenance record
// @route   GET /api/maintenance/:id
const getMaintenanceById = async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id).populate('vehicle');
    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    res.json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching maintenance record' });
  }
};

// @desc    Create a maintenance record (auto sets vehicle to "In Shop")
// @route   POST /api/maintenance
const createMaintenanceRecord = async (req, res) => {
  try {
    const { vehicle, description, cost, scheduledDate } = req.body;

    if (!vehicle || !description || cost === undefined) {
      return res.status(400).json({ message: 'Please provide vehicle, description, and cost' });
    }

    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicleDoc.status === 'On Trip') {
      return res.status(400).json({ message: 'Cannot add maintenance while vehicle is On Trip' });
    }

    const record = await Maintenance.create({
      vehicle,
      description,
      cost,
      scheduledDate: scheduledDate || Date.now(),
      status: 'Active',
    });

    // Business rule: creating active maintenance auto-sets vehicle to In Shop
    vehicleDoc.status = 'In Shop';
    await vehicleDoc.save();

    res.status(201).json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating maintenance record' });
  }
};

// @desc    Close a maintenance record (auto restores vehicle to Available)
// @route   PUT /api/maintenance/:id/close
const closeMaintenanceRecord = async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    if (record.status === 'Closed') {
      return res.status(400).json({ message: 'Maintenance record is already closed' });
    }

    record.status = 'Closed';
    record.closedDate = Date.now();
    await record.save();

    const vehicleDoc = await Vehicle.findById(record.vehicle);
    // Business rule: closing maintenance restores vehicle to Available, UNLESS retired
    if (vehicleDoc && vehicleDoc.status !== 'Retired') {
      vehicleDoc.status = 'Available';
      await vehicleDoc.save();
    }

    res.json({ message: 'Maintenance record closed', record });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error closing maintenance record' });
  }
};

// @desc    Update a maintenance record (description/cost only, not status)
// @route   PUT /api/maintenance/:id
const updateMaintenanceRecord = async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    const { description, cost } = req.body;
    if (description !== undefined) record.description = description;
    if (cost !== undefined) record.cost = cost;

    const updated = await record.save();
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating maintenance record' });
  }
};

// @desc    Delete a maintenance record
// @route   DELETE /api/maintenance/:id
const deleteMaintenanceRecord = async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    await record.deleteOne();
    res.json({ message: 'Maintenance record deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting maintenance record' });
  }
};

module.exports = {
  getMaintenanceRecords,
  getMaintenanceById,
  createMaintenanceRecord,
  closeMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
};