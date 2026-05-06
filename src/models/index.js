const { Sequelize } = require('sequelize');
const config = require('../config');

// Pasar toda la configuración de Sequelize
const sequelize = new Sequelize(config.sequelize);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./user')(sequelize);
db.Role = require('./role')(sequelize);
db.UserRole = require('./userRole')(sequelize);
db.Product = require('./product')(sequelize);
db.AuditLog = require('./auditLog')(sequelize);

db.Role.hasMany(db.UserRole, { foreignKey: 'rol_id' });
db.User.hasMany(db.UserRole, { foreignKey: 'usuario_id' });

module.exports = db;
