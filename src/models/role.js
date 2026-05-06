const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Role = sequelize.define('Role', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.STRING },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'roles',
    timestamps: false
  });

  return Role;
};
