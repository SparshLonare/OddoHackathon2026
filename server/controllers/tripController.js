const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');

// @desc    Get all trips
// @route   GET /api/trips
const getTrips = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const trips = await Trip.find(filter)
      .populate('vehicle', 'registrationNumber name type maxLoadCapacity status')
      .populate('driver', 'name licenseNumber status safetyScore')
      .sort({ createdAt: -1 });

    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching trips' });
  }
};

// @desc    Get single trip by ID
// @route   GET /api/trips/:id
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicle')
      .populate('driver');
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    res.json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching trip' });
  }
};

// @desc    Create a trip (status: Draft)
// @route   POST /api/trips
const createTrip = async (req, res) => {
  try {
    const { source, destination, vehicle, driver, cargoWeight, plannedDistance } = req.body;

    if (!source || !destination || !vehicle || !driver || !cargoWeight || !plannedDistance) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) return res.status(404).json({ message: 'Vehicle not found' });

    const driverDoc = await Driver.findById(driver);
    if (!driverDoc) return res.status(404).json({ message: 'Driver not found' });

    // Business rule: cargo weight must not exceed vehicle max capacity
    if (cargoWeight > vehicleDoc.maxLoadCapacity) {
      return res.status(400).json({
        message: `Cargo weight (${cargoWeight}kg) exceeds vehicle max capacity (${vehicleDoc.maxLoadCapacity}kg)`,
      });
    }

    const trip = await Trip.create({
      source,
      destination,
      vehicle,
      driver,
      cargoWeight,
      plannedDistance,
      status: 'Draft',
      createdBy: req.user._id,
    });

    res.status(201).json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating trip' });
  }
};

// @desc    Dispatch a trip (Draft -> Dispatched)
// @route   PUT /api/trips/:id/dispatch
const dispatchTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (trip.status !== 'Draft') {
      return res.status(400).json({ message: `Cannot dispatch a trip with status "${trip.status}"` });
    }

    const vehicleDoc = await Vehicle.findById(trip.vehicle);
    const driverDoc = await Driver.findById(trip.driver);

    if (!vehicleDoc || !driverDoc) {
      return res.status(404).json({ message: 'Vehicle or driver no longer exists' });
    }

    // Business rules
    if (vehicleDoc.status === 'Retired' || vehicleDoc.status === 'In Shop') {
      return res.status(400).json({ message: `Vehicle is "${vehicleDoc.status}" and cannot be dispatched` });
    }
    if (vehicleDoc.status !== 'Available') {
      return res.status(400).json({ message: `Vehicle is not Available (current status: ${vehicleDoc.status})` });
    }
    if (driverDoc.status === 'Suspended') {
      return res.status(400).json({ message: 'Driver is suspended and cannot be assigned' });
    }
    if (driverDoc.status !== 'Available') {
      return res.status(400).json({ message: `Driver is not Available (current status: ${driverDoc.status})` });
    }
    if (new Date(driverDoc.licenseExpiryDate) < new Date()) {
      return res.status(400).json({ message: 'Driver license has expired and cannot be assigned' });
    }
    if (trip.cargoWeight > vehicleDoc.maxLoadCapacity) {
      return res.status(400).json({ message: 'Cargo weight exceeds vehicle max capacity' });
    }

    // All checks passed — dispatch
    trip.status = 'Dispatched';
    await trip.save();

    vehicleDoc.status = 'On Trip';
    await vehicleDoc.save();

    driverDoc.status = 'On Trip';
    await driverDoc.save();

    res.json({ message: 'Trip dispatched successfully', trip });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error dispatching trip' });
  }
};

// @desc    Complete a trip (Dispatched -> Completed)
// @route   PUT /api/trips/:id/complete
const completeTrip = async (req, res) => {
  try {
    const { actualDistance, fuelConsumed } = req.body;

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ message: `Cannot complete a trip with status "${trip.status}"` });
    }

    trip.status = 'Completed';
    trip.actualDistance = actualDistance ?? trip.plannedDistance;
    trip.fuelConsumed = fuelConsumed ?? null;
    await trip.save();

    const vehicleDoc = await Vehicle.findById(trip.vehicle);
    if (vehicleDoc) {
      vehicleDoc.status = 'Available';
      if (actualDistance) vehicleDoc.odometer += actualDistance;
      await vehicleDoc.save();
    }

    const driverDoc = await Driver.findById(trip.driver);
    if (driverDoc) {
      driverDoc.status = 'Available';
      await driverDoc.save();
    }

    res.json({ message: 'Trip completed successfully', trip });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error completing trip' });
  }
};

// @desc    Cancel a trip
// @route   PUT /api/trips/:id/cancel
const cancelTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      return res.status(400).json({ message: `Cannot cancel a trip with status "${trip.status}"` });
    }

    const wasDispatched = trip.status === 'Dispatched';
    trip.status = 'Cancelled';
    await trip.save();

    // Restore vehicle/driver only if they were actually locked into "On Trip"
    if (wasDispatched) {
      const vehicleDoc = await Vehicle.findById(trip.vehicle);
      if (vehicleDoc) {
        vehicleDoc.status = 'Available';
        await vehicleDoc.save();
      }

      const driverDoc = await Driver.findById(trip.driver);
      if (driverDoc) {
        driverDoc.status = 'Available';
        await driverDoc.save();
      }
    }

    res.json({ message: 'Trip cancelled successfully', trip });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error cancelling trip' });
  }
};

module.exports = {
  getTrips,
  getTripById,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
};