const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const { auth } = require('../middlewares/authMiddleware');
const { permit } = require('../middlewares/abacMiddleware');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Gestión de productos (ABAC)
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Listar productos
 *     tags: [Products]
 *     description: |
 *       Reglas ABAC:
 *       - Admin/Auditor: Todos los productos
 *       - Gerente/Empleado: Solo productos de su tienda
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos según permisos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado por políticas ABAC
 */
router.get('/', auth, permit('select'), ctrl.listProducts);

/**
 * @swagger
 * /api/products/stores:
 *   get:
 *     summary: Obtener lista de tiendas disponibles
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tiendas únicas
 */
router.get('/stores/list', auth, ctrl.listStores);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     tags: [Products]
 *     description: Aplican las mismas reglas de scope por tienda
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       403:
 *         description: Acceso denegado (producto no pertenece a tu tienda)
 *       404:
 *         description: Producto no encontrado
 */
router.get('/:id', auth, permit('select'), ctrl.getProduct);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Crear nuevo producto
 *     tags: [Products]
 *     description: |
 *       Reglas ABAC:
 *       - Admin: En cualquier tienda
 *       - Gerente: Solo en su tienda
 *       - Empleado: Solo productos NO premium en su tienda
 *       - Auditor: Sin acceso
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - tienda_id
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Laptop HP Pavilion
 *               descripcion:
 *                 type: string
 *                 example: Laptop de 15 pulgadas
 *               precio:
 *                 type: number
 *                 example: 2500.00
 *               stock:
 *                 type: integer
 *                 example: 10
 *               categoria:
 *                 type: string
 *                 example: Laptops
 *               tienda_id:
 *                 type: string
 *                 example: Lima
 *               es_premium:
 *                 type: boolean
 *                 example: false
 *                 description: Empleados no pueden crear productos premium
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: |
 *           Acceso denegado por políticas ABAC:
 *           - Empleado intentando crear producto premium
 *           - Gerente/Empleado intentando crear en otra tienda
 *           - Auditor sin permisos de escritura
 */
router.post('/', auth, permit('insert'), ctrl.createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Actualizar producto
 *     tags: [Products]
 *     description: |
 *       Reglas ABAC:
 *       - Admin: Todos los campos, todas las tiendas
 *       - Gerente: Todos los campos en su tienda, EXCEPTO 'categoria'
 *       - Empleado: SOLO campo 'stock' en productos de su tienda
 *       - Auditor: Sin acceso
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               precio:
 *                 type: number
 *               stock:
 *                 type: integer
 *               categoria:
 *                 type: string
 *                 description: Solo Admin puede modificar
 *               es_premium:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Producto actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       403:
 *         description: |
 *           Acceso denegado por políticas ABAC:
 *           - Empleado intentando modificar campos distintos a 'stock'
 *           - Gerente intentando modificar 'categoria'
 *           - Usuario intentando modificar producto de otra tienda
 *       404:
 *         description: Producto no encontrado
 */
router.put('/:id', auth, permit('update'), ctrl.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Eliminar producto
 *     tags: [Products]
 *     description: |
 *       Reglas ABAC:
 *       - Admin: Cualquier producto
 *       - Gerente: Solo productos NO premium de su tienda
 *       - Empleado: Sin acceso
 *       - Auditor: Sin acceso
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       403:
 *         description: |
 *           Acceso denegado por políticas ABAC:
 *           - Gerente intentando eliminar producto premium
 *           - Gerente intentando eliminar producto de otra tienda
 *           - Empleado/Auditor sin permisos de eliminación
 *       404:
 *         description: Producto no encontrado
 */
router.delete('/:id', auth, permit('delete'), ctrl.deleteProduct);

module.exports = router;
