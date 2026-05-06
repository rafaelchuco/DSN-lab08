const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');
const config = require('../config');
const { generateSecret, verifyTOTP } = require('../utils/mfa.utils');
const { logAction } = require('../utils/logger');

const PASSWORD_REGEX = new RegExp(
  `^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{${config.passwordPolicy.minLength},}$`
);

async function register(req, res) {
  const { email, password, nombre_completo, tienda_id } = req.body;
  if (!email || !password || !nombre_completo) return res.status(400).json({ error: 'Faltan campos' });
  if (!PASSWORD_REGEX.test(password)) return res.status(400).json({ error: 'Contraseña no cumple la política' });

  const existing = await db.User.findOne({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email ya registrado' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.User.create({ email, passwordHash, nombre_completo, tienda_id });
  await logAction({ usuario_id: user.id, action: 'register', resource_type: 'User', resource_id: user.id, details: { email } , ip: req.ip });
  return res.status(201).json({ id: user.id, email: user.email });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Faltan campos' });

  const user = await db.User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

  // Check lock
  if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
    return res.status(423).json({ error: 'Cuenta bloqueada temporalmente' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= 5) {
      const until = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes lock
      user.lockUntil = until;
    }
    await user.save();
    await logAction({ usuario_id: user.id, action: 'login_failed', resource_type: 'User', resource_id: user.id, details: { email }, ip: req.ip });
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  // reset failure counters
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  await logAction({ usuario_id: user.id, action: 'login_success', resource_type: 'User', resource_id: user.id, ip: req.ip });

  if (user.mfa_enabled && user.mfa_secret) {
    // return temporary token indicating MFA required
    const temp = jwt.sign({ sub: user.id, mfa: true }, config.jwtSecret, { expiresIn: config.jwtMfaTempExpiry });
    return res.status(200).json({ mfa_required: true, token: temp });
  }

  const token = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiry });
  return res.json({ token });
}

async function mfaVerify(req, res) {
  const { token, code } = req.body;
  if (!token || !code) return res.status(400).json({ error: 'Faltan campos' });
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (!payload.mfa) return res.status(400).json({ error: 'Token no es de MFA' });

    const user = await db.User.findByPk(payload.sub);
    if (!user || !user.mfa_secret) return res.status(400).json({ error: 'Usuario no encontrado o MFA no configurado' });

    // Verificar bloqueo MFA
    if (user.mfa_lock_until && new Date(user.mfa_lock_until) > new Date()) {
      return res.status(423).json({ error: 'MFA bloqueado temporalmente. Intenta más tarde.' });
    }

    const ok = verifyTOTP(user.mfa_secret, code);
    
    if (!ok) {
      user.mfa_failed_attempts = (user.mfa_failed_attempts || 0) + 1;
      
      if (user.mfa_failed_attempts >= 3) {
        user.mfa_lock_until = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
        await user.save();
        await logAction({ usuario_id: user.id, action: 'mfa_blocked', resource_type: 'User', resource_id: user.id, ip: req.ip });
        return res.status(423).json({ error: 'Demasiados intentos fallidos. Cuenta MFA bloqueada por 15 minutos.' });
      }
      
      await user.save();
      await logAction({ usuario_id: user.id, action: 'mfa_failed', resource_type: 'User', resource_id: user.id, details: { attempts: user.mfa_failed_attempts }, ip: req.ip });
      return res.status(401).json({ 
        error: `Código MFA inválido. ${3 - user.mfa_failed_attempts} intentos restantes.` 
      });
    }

    // Reset en caso de éxito
    user.mfa_failed_attempts = 0;
    user.mfa_lock_until = null;
    await user.save();

    const fullToken = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiry });
    await logAction({ usuario_id: user.id, action: 'mfa_success', resource_type: 'User', resource_id: user.id, ip: req.ip });
    return res.json({ token: fullToken });
  } catch (err) {
    return res.status(400).json({ error: 'Token inválido o expirado' });
  }
}

async function enableMfa(req, res) {
  const userId = req.userId;
  const user = await db.User.findByPk(userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const secret = generateSecret();
  user.mfa_secret = secret.base32;
  user.mfa_enabled = true;
  await user.save();
  await logAction({ usuario_id: user.id, action: 'mfa_enable', resource_type: 'User', resource_id: user.id, details: { base32: secret.base32 }, ip: req.ip });
  return res.json({ secret: secret.otpauth_url, base32: secret.base32 });
}

module.exports = { register, login, mfaVerify, enableMfa };
