const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/mfa/verify', auth.mfaVerify);
router.post('/mfa/enable', authMiddleware.optionalAuth, auth.enableMfa);

module.exports = router;
