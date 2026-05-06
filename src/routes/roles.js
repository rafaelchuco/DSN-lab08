const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/roleController');
const { auth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/rbacMiddleware');

router.get('/', auth, ctrl.listRoles);
router.get('/:id', auth, ctrl.getRole);
router.post('/', auth, requireRole('Admin'), ctrl.createRole);
router.put('/:id', auth, requireRole('Admin'), ctrl.updateRole);
router.delete('/:id', auth, requireRole('Admin'), ctrl.deleteRole);

module.exports = router;
