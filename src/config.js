require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
  jwtExpiry: process.env.JWT_EXPIRY || '1h',
  jwtMfaTempExpiry: process.env.JWT_MFA_TEMP_EXPIRY || '300s',
  sequelize: {
    dialect: 'sqlite',
    storage: process.env.SQLITE_STORAGE || 'database.sqlite'
  },
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecial: true
  }
};
