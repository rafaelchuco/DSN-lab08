const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    nombre_completo: { type: DataTypes.STRING, allowNull: false },
    tienda_id: { type: DataTypes.STRING },
    mfa_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    mfa_secret: { type: DataTypes.STRING, allowNull: true },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    failedLoginAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
    lockUntil: { type: DataTypes.DATE, allowNull: true }
  }, {
    tableName: 'usuarios',
    timestamps: false
  });

  return User;
};
