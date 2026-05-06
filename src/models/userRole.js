const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserRole = sequelize.define('UserRole', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    rol_id: { type: DataTypes.INTEGER, allowNull: false },
    asignado_por: { type: DataTypes.INTEGER },
    fecha_asignacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'usuario_roles',
    timestamps: false
  });

  return UserRole;
};
