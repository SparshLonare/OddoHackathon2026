const express = require('express');
const router = express.Router();
const {
  getTrips,
  getTripById,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} = require('../controllers/tripController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(protect);

// Everyone can view trips
router.get('/', getTrips);
router.get('/:id', getTripById);

// Fleet Manager and Driver can create/dispatch/complete/cancel trips
router.post('/', requireRole('fleet_manager', 'driver'), createTrip);
router.put('/:id/dispatch', requireRole('fleet_manager', 'driver'), dispatchTrip);
router.put('/:id/complete', requireRole('fleet_manager', 'driver'), completeTrip);
router.put('/:id/cancel', requireRole('fleet_manager', 'driver'), cancelTrip);

module.exports = router;