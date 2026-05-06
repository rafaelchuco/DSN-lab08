# TechStore - Backend (esqueleto)

Este repositorio contiene un esqueleto inicial para el backend de TechStore usando Node.js + Express y SQLite (Sequelize).

Características incluidas:
- Registro y login con validación de contraseña
- Bloqueo de cuenta tras 5 intentos fallidos
- MFA TOTP con `speakeasy` (endpoints para habilitar y verificar)
- Modelos básicos: Usuario, Rol, Producto, Usuario_Roles

Cómo probar localmente:

1. Instalar dependencias:
```bash
npm install
```

2. (Opcional) definir variables de entorno en `.env`:
```
JWT_SECRET=supersecreto
JWT_EXPIRY=1h
```

3. Iniciar servidor:
```bash
npm run dev
```

Endpoints principales:
- `POST /api/auth/register` — { email, password, nombre_completo, tienda_id }
- `POST /api/auth/login` — { email, password } (si MFA activado devuelve token temporal)
- `POST /api/auth/mfa/verify` — { token, code } -> devuelve JWT completo
- `POST /api/auth/mfa/enable` — Habilita MFA para usuario autenticado

Próximos pasos sugeridos:
- Implementar CRUD de roles y usuarios (RBAC)
- Motor de políticas ABAC para productos
- Frontend React y flujo de MFA (mostrar QR / OTP)
