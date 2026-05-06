const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/roleController');
const { auth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/rbacMiddleware');

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Gestión de roles (RBAC)
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Listar todos los roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 *       401:
 *         description: No autorizado
 */
router.get('/', auth, ctrl.listRoles);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Obtener rol por ID
 *     tags: [Roles]
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
 *         description: Rol encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 *       404:
 *         description: Rol no encontrado
 */
router.get('/:id', auth, ctrl.getRole);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Crear nuevo rol (Solo Admin)
 *     tags: [Roles]
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
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Supervisor
 *               descripcion:
 *                 type: string
 *                 example: Rol de supervisor de tienda
 *     responses:
 *       201:
 *         description: Rol creado exitosamente
 *       403:
 *         description: Requiere rol Admin
 */
router.post('/', auth, requireRole('Admin'), ctrl.createRole);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Actualizar rol (Solo Admin)
 *     tags: [Roles]
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
 *     responses:
 *       200:
 *         description: Rol actualizado
 *       403:
 *         description: Requiere rol Admin
 *       404:
 *         description: Rol no encontrado
 */
router.put('/:id', auth, requireRole('Admin'), ctrl.updateRole);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Eliminar rol (Solo Admin)
 *     tags: [Roles]
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
 *         description: Rol eliminado
 *       400:
 *         description: No se puede eliminar rol con usuarios asignados
 *       403:
 *         description: Requiere rol Admin
 *       404:
 *         description: Rol no encontrado
 */
router.delete('/:id', auth, requireRole('Admin'), ctrl.deleteRole);

module.exports = router;
