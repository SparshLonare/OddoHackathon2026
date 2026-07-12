const express = require('express');
const router = express.Router();
const {
  getMaintenanceRecords,
  getMaintenanceById,
  createMaintenanceRecord,
  closeMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
} = require('../controllers/maintenanceController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(protect);

// Everyone can view maintenance records
router.get('/', getMaintenanceRecords);
router.get('/:id', getMaintenanceById);

// Only Fleet Manager manages maintenance
router.post('/', requireRole('fleet_manager'), createMaintenanceRecord);
router.put('/:id', requireRole('fleet_manager'), updateMaintenanceRecord);
router.put('/:id/close', requireRole('fleet_manager'), closeMaintenanceRecord);
router.delete('/:id', requireRole('fleet_manager'), deleteMaintenanceRecord);

module.exports = router;