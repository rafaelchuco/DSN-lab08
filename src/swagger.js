const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TechStore API',
      version: '1.0.0',
      description: 'API para Sistema de Gestión de Inventario con RBAC y ABAC',
      contact: {
        name: 'TechStore Dev Team'
      }
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Development' },
      { url: 'https://api.techstore.com', description: 'Production' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            nombre_completo: { type: 'string' },
            tienda_id: { type: 'string' },
            mfa_enabled: { type: 'boolean' },
            activo: { type: 'boolean' },
            fecha_creacion: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            descripcion: { type: 'string' },
            precio: { type: 'number', format: 'decimal' },
            stock: { type: 'integer' },
            categoria: { type: 'string' },
            tienda_id: { type: 'string' },
            es_premium: { type: 'boolean' },
            creado_por: { type: 'integer' },
            fecha_creacion: { type: 'string', format: 'date-time' },
            fecha_actualizacion: { type: 'string', format: 'date-time' }
          }
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { 
              type: 'string', 
              enum: ['Admin', 'Gerente', 'Empleado', 'Auditor'] 
            },
            descripcion: { type: 'string' },
            fecha_creacion: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsDoc(options);

module.exports = { swaggerUi, specs };
