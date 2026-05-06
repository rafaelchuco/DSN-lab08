const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING, allowNull: false },
    resource_type: { type: DataTypes.STRING },
    resource_id: { type: DataTypes.STRING },
    details: { type: DataTypes.JSON },
    ip: { type: DataTypes.STRING },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'audit_logs',
    timestamps: false
  });

  return AuditLog;
};
