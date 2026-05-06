#!/bin/bash

echo "🚀 Iniciando TechStore con Docker..."
echo ""
echo "📦 Servicios:"
echo "  - PostgreSQL (puerto 5432)"
echo "  - Backend API (puerto 4000)"
echo "  - Frontend (puerto 5173)"
echo ""

# Detener contenedores existentes
echo "🛑 Deteniendo contenedores previos..."
docker-compose down

# Construir e iniciar servicios
echo "🔨 Construyendo imágenes..."
docker-compose build

echo "▶️  Iniciando servicios..."
docker-compose up -d

echo ""
echo "⏳ Esperando a que los servicios estén listos..."
sleep 5

echo ""
echo "✅ Servicios iniciados!"
echo ""
echo "📍 Accesos:"
echo "  🌐 Frontend:    http://localhost:5173"
echo "  🔌 Backend API: http://localhost:4000"
echo "  📚 Swagger UI:  http://localhost:4000/api-docs"
echo "  🗄️  PostgreSQL:  localhost:5432"
echo ""
echo "👤 Usuario inicial:"
echo "  📧 Email:    admin@techstore.com"
echo "  🔑 Password: Admin123!"
echo ""
echo "📋 Ver logs:"
echo "  docker-compose logs -f"
echo ""
echo "🛑 Detener servicios:"
echo "  docker-compose down"
echo ""
