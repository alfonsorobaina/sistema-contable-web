# Sistema Administrativo YOT

Sistema administrativo y contable multi-tenant construido con React, TypeScript, Vite y Supabase.

## 🚀 Características

- **Autenticación completa** - Login, registro, recuperación de contraseña
- **Multi-empresa** - Gestiona múltiples empresas con un solo usuario
- **Row Level Security** - Datos aislados por empresa con RLS de Supabase
- **Roles de usuario** - Admin, Accountant, Member, Viewer
- **UI Premium** - Diseño moderno con gradientes teal/cyan

## Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)

## Instalación

```bash
cd app
npm install
cp .env.example .env
# Edita .env con tus credenciales de Supabase
```

## Configurar Base de Datos

Ejecuta las migraciones en Supabase SQL Editor:

1. `/supabase/migrations/0000_initial_schema.sql`
2. `/supabase/migrations/0001_multitenancy.sql`

## Ejecutar

```bash
npm run dev
```

Disponible en `http://localhost:5173`

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilar para producción |
| `npm run preview` | Vista previa del build |

## Estructura

```
app/src/
├── components/       # CompanySelector, CreateCompanyModal
├── context/          # AuthContext, CompanyContext
├── layout/           # Layout principal con sidebar
├── lib/              # Cliente Supabase
├── pages/            # Login, Dashboard, CompanySettings
└── types/            # Tipos TypeScript
```

## FASE 2 ✅

- ✅ Sistema multiempresa con RLS
- ✅ Selector de empresa activa
- ✅ Crear/editar empresas
- ✅ Roles de usuario
- ✅ Branding YOT

---
© 2026 Sistema YOT
