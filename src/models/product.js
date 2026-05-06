const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    precio: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    categoria: { type: DataTypes.STRING },
    tienda_id: { type: DataTypes.STRING },
    es_premium: { type: DataTypes.BOOLEAN, defaultValue: false },
    creado_por: { type: DataTypes.INTEGER },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    fecha_actualizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'productos',
    timestamps: false
  });

  return Product;
};
