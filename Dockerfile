FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 4000

# Comando para iniciar
CMD ["npm", "start"]
