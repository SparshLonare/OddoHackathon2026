const express = require('express');
const router = express.Router();
const {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
} = require('../controllers/driverController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All routes require login
router.use(protect);

// Everyone (any logged-in role) can view drivers
router.get('/', getDrivers);
router.get('/:id', getDriverById);

// Fleet Manager and Safety Officer can create/update/delete
router.post('/', requireRole('fleet_manager', 'safety_officer'), createDriver);
router.put('/:id', requireRole('fleet_manager', 'safety_officer'), updateDriver);
router.delete('/:id', requireRole('fleet_manager', 'safety_officer'), deleteDriver);

module.exports = router;
