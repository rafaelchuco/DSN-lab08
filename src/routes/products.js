const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const { auth } = require('../middlewares/authMiddleware');
const { permit } = require('../middlewares/abacMiddleware');

router.get('/', auth, permit('select'), ctrl.listProducts);
router.get('/:id', auth, permit('select'), ctrl.getProduct);
router.post('/', auth, permit('insert'), ctrl.createProduct);
router.put('/:id', auth, permit('update'), ctrl.updateProduct);
router.delete('/:id', auth, permit('delete'), ctrl.deleteProduct);

module.exports = router;
