const Driver = require('../models/Driver');

// @desc    Get all drivers (with optional filters)
// @route   GET /api/drivers
const getDrivers = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) filter.status = status;

    const drivers = await Driver.find(filter).sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching drivers' });
  }
};

// @desc    Get single driver by ID
// @route   GET /api/drivers/:id
const getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching driver' });
  }
};

// @desc    Create a new driver
// @route   POST /api/drivers
const createDriver = async (req, res) => {
  try {
    const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, safetyScore } = req.body;

    if (!name || !licenseNumber || !licenseCategory || !licenseExpiryDate || !contactNumber) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const existing = await Driver.findOne({ licenseNumber });
    if (existing) {
      return res.status(400).json({ message: 'A driver with this license number already exists' });
    }

    const driver = await Driver.create({
      name,
      licenseNumber,
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      safetyScore: safetyScore ?? 100,
    });

    res.status(201).json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating driver' });
  }
};

// @desc    Update a driver
// @route   PUT /api/drivers/:id
const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (req.body.licenseNumber && req.body.licenseNumber !== driver.licenseNumber) {
      const dup = await Driver.findOne({ licenseNumber: req.body.licenseNumber });
      if (dup) {
        return res.status(400).json({ message: 'Another driver already uses this license number' });
      }
    }

    Object.assign(driver, req.body);
    const updated = await driver.save();
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating driver' });
  }
};

// @desc    Delete a driver
// @route   DELETE /api/drivers/:id
const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (driver.status === 'On Trip') {
      return res.status(400).json({ message: 'Cannot delete a driver who is currently on a trip' });
    }

    await driver.deleteOne();
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting driver' });
  }
};

module.exports = {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
};
