const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { auth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/rbacMiddleware');

router.get('/', auth, requireRole('Admin'), ctrl.listUsers);
router.get('/me', auth, ctrl.getMe);
router.get('/:id', auth, ctrl.getUser);
router.post('/', auth, requireRole('Admin'), ctrl.createUser);
router.put('/:id', auth, requireRole('Admin'), ctrl.updateUser);
router.delete('/:id', auth, requireRole('Admin'), ctrl.deleteUser);
router.post('/:id/roles', auth, requireRole('Admin'), ctrl.assignRole);

module.exports = router;
