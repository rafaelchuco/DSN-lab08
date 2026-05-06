require('dotenv').config();

const dbDialect = process.env.DB_DIALECT || 'sqlite';

const sequelizeConfig = {
  sqlite: {
    dialect: 'sqlite',
    storage: process.env.SQLITE_STORAGE || 'database.sqlite',
    logging: false
  },
  postgres: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'techstore',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    dialectOptions: {
      connectTimeout: 60000
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  }
};

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
  jwtExpiry: process.env.JWT_EXPIRY || '1h',
  jwtMfaTempExpiry: process.env.JWT_MFA_TEMP_EXPIRY || '300s',
  sequelize: sequelizeConfig[dbDialect],
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecial: true
  }
};
