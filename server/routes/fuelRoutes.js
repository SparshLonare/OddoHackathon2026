const express = require('express');
const router = express.Router();
const {
  getFuelLogs,
  createFuelLog,
  deleteFuelLog,
  getExpenses,
  createExpense,
  deleteExpense,
  getVehicleOperationalCost,
} = require('../controllers/fuelController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(protect);

// Fuel logs
router.get('/logs', getFuelLogs);
router.post('/logs', requireRole('fleet_manager', 'driver'), createFuelLog);
router.delete('/logs/:id', requireRole('fleet_manager', 'financial_analyst'), deleteFuelLog);

// Expenses
router.get('/expenses', getExpenses);
router.post('/expenses', requireRole('fleet_manager', 'driver', 'financial_analyst'), createExpense);
router.delete('/expenses/:id', requireRole('fleet_manager', 'financial_analyst'), deleteExpense);

// Cost report
router.get('/cost/:vehicleId', getVehicleOperationalCost);

module.exports = router;