const jwt = require('jsonwebtoken');
const config = require('../config');

function auth(req, res, next) {
  const hdr = req.headers.authorization;
  if (!hdr) return res.status(401).json({ error: 'No autorizado' });
  const parts = hdr.split(' ');
  if (parts.length !==2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Formato de token inválido' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.userId = payload.sub;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// optionalAuth: if Authorization header present, verify and add userId, otherwise continue
function optionalAuth(req, res, next) {
  const hdr = req.headers.authorization;
  if (!hdr) return next();
  const parts = hdr.split(' ');
  if (parts.length !==2 || parts[0] !== 'Bearer') return next();
  const token = parts[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.userId = payload.sub;
  } catch (err) {
    // ignore
  }
  return next();
}

module.exports = { auth, optionalAuth };
