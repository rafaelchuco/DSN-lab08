const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Endpoints de autenticación (registro, login, MFA)
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Authentication]
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
 *                 example: usuario@techstore.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Debe contener mayúscula, número y carácter especial
 *                 example: Password123!
 *               nombre_completo:
 *                 type: string
 *                 example: Juan Pérez
 *               tienda_id:
 *                 type: string
 *                 example: Lima
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *       400:
 *         description: Datos inválidos o contraseña no cumple política
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email ya registrado
 */
router.post('/register', auth.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@techstore.com
 *               password:
 *                 type: string
 *                 example: Admin123!
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token completo
 *                 - type: object
 *                   properties:
 *                     mfa_required:
 *                       type: boolean
 *                       example: true
 *                     token:
 *                       type: string
 *                       description: JWT temporal para MFA
 *       401:
 *         description: Credenciales inválidas
 *       423:
 *         description: Cuenta bloqueada temporalmente (5 intentos fallidos)
 */
router.post('/login', auth.login);

/**
 * @swagger
 * /api/auth/mfa/verify:
 *   post:
 *     summary: Verificar código MFA
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - code
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token temporal de MFA
 *               code:
 *                 type: string
 *                 pattern: '^\d{6}$'
 *                 example: "123456"
 *                 description: Código TOTP de 6 dígitos
 *     responses:
 *       200:
 *         description: Código válido, autenticación completa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token completo
 *       401:
 *         description: Código MFA inválido (máximo 3 intentos)
 *       423:
 *         description: MFA bloqueado temporalmente (15 minutos)
 */
router.post('/mfa/verify', auth.mfaVerify);

/**
 * @swagger
 * /api/auth/mfa/enable:
 *   post:
 *     summary: Habilitar MFA para el usuario actual
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA habilitado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secret:
 *                   type: string
 *                   description: URL otpauth para QR code
 *                 base32:
 *                   type: string
 *                   description: Secret en formato base32
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/mfa/enable', authMiddleware.optionalAuth, auth.enableMfa);

module.exports = router;
