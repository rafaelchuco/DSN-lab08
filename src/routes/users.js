const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { auth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/rbacMiddleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listar todos los usuarios (Solo Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Requiere rol Admin
 */
router.get('/', auth, requireRole('Admin'), ctrl.listUsers);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Obtener información del usuario actual
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario actual con roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: No autorizado
 */
router.get('/me', auth, ctrl.getMe);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Users]
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
 *         description: Usuario encontrado
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id', auth, ctrl.getUser);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crear nuevo usuario (Solo Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - nombre_completo
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               nombre_completo:
 *                 type: string
 *               tienda_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado
 *       403:
 *         description: Requiere rol Admin
 */
router.post('/', auth, requireRole('Admin'), ctrl.createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Actualizar usuario (Solo Admin)
 *     tags: [Users]
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
 *               nombre_completo:
 *                 type: string
 *               tienda_id:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       403:
 *         description: Requiere rol Admin
 */
router.put('/:id', auth, requireRole('Admin'), ctrl.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Eliminar usuario (Solo Admin)
 *     tags: [Users]
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
 *         description: Usuario eliminado
 *       403:
 *         description: Requiere rol Admin
 */
router.delete('/:id', auth, requireRole('Admin'), ctrl.deleteUser);

/**
 * @swagger
 * /api/users/{id}/roles:
 *   post:
 *     summary: Asignar rol a usuario (Solo Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rol_id
 *             properties:
 *               rol_id:
 *                 type: integer
 *               asignado_por:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Rol asignado exitosamente
 *       403:
 *         description: Requiere rol Admin
 *       404:
 *         description: Usuario o rol no encontrado
 */
router.post('/:id/roles', auth, requireRole('Admin'), ctrl.assignRole);

/**
 * @swagger
 * /api/users/{id}/mfa-required:
 *   put:
 *     summary: Activar o desactivar requisito de MFA para un usuario (Solo Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - required
 *             properties:
 *               required:
 *                 type: boolean
 *                 description: Si true, el usuario debe configurar MFA en su dashboard
 *     responses:
 *       200:
 *         description: Estado de requisito MFA actualizado
 *       403:
 *         description: Requiere rol Admin
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/:id/mfa-required', auth, requireRole('Admin'), ctrl.setMfaRequired);

module.exports = router;
