const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole, deleteUser } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect); // Secure routes
router.use(admin);   // Limit access strictly to Admins

router.route('/users')
  .get(getUsers);

router.route('/users/:id/role')
  .put(updateUserRole);

router.route('/users/:id')
  .delete(deleteUser);

module.exports = router;
