const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All routes require login
router.use(protect);

// Everyone (any logged-in role) can view vehicles
router.get('/', getVehicles);
router.get('/:id', getVehicleById);

// Only Fleet Manager can create, update, delete
router.post('/', requireRole('fleet_manager'), createVehicle);
router.put('/:id', requireRole('fleet_manager'), updateVehicle);
router.delete('/:id', requireRole('fleet_manager'), deleteVehicle);

module.exports = router;