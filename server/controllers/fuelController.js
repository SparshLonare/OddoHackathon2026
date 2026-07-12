const FuelLog = require('../models/FuelLog');
const Expense = require('../models/Expense');
const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');

// ---------- FUEL LOGS ----------

// @desc    Get all fuel logs
// @route   GET /api/fuel/logs
const getFuelLogs = async (req, res) => {
  try {
    const { vehicle } = req.query;
    const filter = {};
    if (vehicle) filter.vehicle = vehicle;

    const logs = await FuelLog.find(filter)
      .populate('vehicle', 'registrationNumber name')
      .sort({ date: -1 });

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching fuel logs' });
  }
};

// @desc    Create a fuel log
// @route   POST /api/fuel/logs
const createFuelLog = async (req, res) => {
  try {
    const { vehicle, trip, liters, cost, date } = req.body;

    if (!vehicle || liters === undefined || cost === undefined) {
      return res.status(400).json({ message: 'Please provide vehicle, liters, and cost' });
    }

    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const log = await FuelLog.create({
      vehicle,
      trip: trip || null,
      liters,
      cost,
      date: date || Date.now(),
    });

    res.status(201).json(log);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating fuel log' });
  }
};

// @desc    Delete a fuel log
// @route   DELETE /api/fuel/logs/:id
const deleteFuelLog = async (req, res) => {
  try {
    const log = await FuelLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Fuel log not found' });
    await log.deleteOne();
    res.json({ message: 'Fuel log deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting fuel log' });
  }
};

// ---------- EXPENSES ----------

// @desc    Get all expenses
// @route   GET /api/fuel/expenses
const getExpenses = async (req, res) => {
  try {
    const { vehicle, type } = req.query;
    const filter = {};
    if (vehicle) filter.vehicle = vehicle;
    if (type) filter.type = type;

    const expenses = await Expense.find(filter)
      .populate('vehicle', 'registrationNumber name')
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching expenses' });
  }
};

// @desc    Create an expense
// @route   POST /api/fuel/expenses
const createExpense = async (req, res) => {
  try {
    const { vehicle, type, amount, date, notes } = req.body;

    if (!vehicle || !type || amount === undefined) {
      return res.status(400).json({ message: 'Please provide vehicle, type, and amount' });
    }

    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const expense = await Expense.create({
      vehicle,
      type,
      amount,
      date: date || Date.now(),
      notes: notes || '',
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating expense' });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/fuel/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    await expense.deleteOne();
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting expense' });
  }
};

// ---------- COST CALCULATION ----------

// @desc    Get total operational cost per vehicle (Fuel + Maintenance + Expenses)
// @route   GET /api/fuel/cost/:vehicleId
const getVehicleOperationalCost = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const vehicleDoc = await Vehicle.findById(vehicleId);
    if (!vehicleDoc) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const fuelLogs = await FuelLog.find({ vehicle: vehicleId });
    const maintenanceRecords = await Maintenance.find({ vehicle: vehicleId });
    const expenses = await Expense.find({ vehicle: vehicleId });

    const totalFuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
    const totalMaintenanceCost = maintenanceRecords.reduce((sum, m) => sum + m.cost, 0);
    const totalExpenseCost = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalExpenseCost;

    const totalLiters = fuelLogs.reduce((sum, log) => sum + log.liters, 0);

    res.json({
      vehicle: vehicleDoc.registrationNumber,
      totalFuelCost,
      totalMaintenanceCost,
      totalExpenseCost,
      totalOperationalCost,
      totalLitersConsumed: totalLiters,
      odometer: vehicleDoc.odometer,
      fuelEfficiency: totalLiters > 0 ? (vehicleDoc.odometer / totalLiters).toFixed(2) : null,
      acquisitionCost: vehicleDoc.acquisitionCost,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error calculating operational cost' });
  }
};

module.exports = {
  getFuelLogs,
  createFuelLog,
  deleteFuelLog,
  getExpenses,
  createExpense,
  deleteExpense,
  getVehicleOperationalCost,
};