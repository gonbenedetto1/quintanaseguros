# 🔐 Panel de Administración — Setup

Este documento es para vos (Pragma Studio). Pasos para dejar funcionando el admin antes de entregarlo al cliente.

## ✅ Ya hecho (en código)

- Schema SQL listo: `supabase-schema.sql`
- Panel admin: `quintana.html` + `assets/js/admin.js` + `assets/css/admin.css`
- Config dinámica del sitio: `assets/js/site-config.js` (ya integrada en las 10 páginas)
- Integración de Supabase con tus credenciales

## 📋 Pasos en el dashboard de Supabase

### 1️⃣ Correr el SQL (crea tablas + permisos)

1. Andá a tu proyecto Supabase → menú izquierdo → **SQL Editor**
2. Click en **+ New query**
3. Abrí `supabase-schema.sql` (en la raíz del repo) y copiá todo el contenido
4. Pegalo en el editor de Supabase y click en **Run** (o Ctrl+Enter)
5. Deberías ver "Success. No rows returned" — todo listo

### 2️⃣ Crear el bucket de imágenes (para portadas del blog)

1. Menú izquierdo → **Storage**
2. Click en **+ New bucket**
3. Nombre: `blog-images`
4. **Public bucket: ✅ ON** (importante, sino las imágenes no cargan en el sitio público)
5. **File size limit:** 5 MB (suficiente)
6. Allowed MIME types: dejar `image/*`
7. Click en **Save**

### 3️⃣ Configurar políticas del bucket

Volviendo al **SQL Editor**, ejecutá esto:

```sql
-- Permitir que cualquiera vea las imágenes (son públicas)
CREATE POLICY "blog_images_read_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

-- Solo usuarios autenticados pueden subir
CREATE POLICY "blog_images_insert_auth"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- Solo autenticados pueden borrar
CREATE POLICY "blog_images_delete_auth"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images');
```

### 4️⃣ Crear el usuario admin

1. Menú izquierdo → **Authentication** → **Users**
2. Click en **+ Add user** → **Create new user**
3. Email: `quintanaruizasesores@gmail.com` (o el que prefiera el cliente)
4. **Password:** poné una contraseña segura. Anotala (la vas a pasar al cliente).
5. Tildá ✅ **Auto Confirm User** (sino le va a pedir verificar el email)
6. Click en **Create user**

### 5️⃣ Desactivar registro público (importante para seguridad)

1. **Authentication** → **Providers** → **Email**
2. **Enable Email Signups: OFF** ❌ (que solo el admin que creaste pueda entrar)
3. **Confirm email: OFF** (ya autoconfirmaste el admin)
4. Save

## 🚀 Probar el panel

1. Subí los cambios a git: `git push`
2. Esperá que Netlify/Vercel deploye
3. Andá a `tudominio.com.ar/quintana.html`
4. Login con el email + password del paso 4
5. Deberías entrar al dashboard

## 🎯 Lo que el cliente puede hacer

### En **Configuración**:
- ✏️ Cambiar número de WhatsApp (se aplica en todos los botones, link flotante, etc.)
- ✏️ Cambiar email donde llegan las consultas
- ✏️ Cambiar el % de descuento de la promo
- ✏️ Activar/desactivar el popup + sección promo en home

### En **Blog**:
- 📝 Crear notas nuevas con título, imagen de portada, categoría, contenido enriquecido
- 📝 Editar notas existentes
- 🗑️ Eliminar notas
- 👁️ Toggle "Publicar" (si no está publicada queda como borrador, no aparece en el sitio)

### En **Consultas**:
- 📨 Ver todos los formularios enviados desde la web (auto, hogar, comercio, contacto)
- 📊 Datos del lead: nombre, email, teléfono, qué cobertura le interesa, mensaje

## 📤 Para entregarle al cliente

```
URL: https://quintanaruiz.com.ar/quintana.html
Email: quintanaruizasesores@gmail.com
Contraseña: [la que pusiste en paso 4]
```

## ⚠️ Pendientes (próxima iteración)

- Render dinámico del blog público (ahora la lista de notas en `blog.html` es estática — necesita JS para leer las notas reales del DB)
- Templates de artículos públicos (`/post.html?slug=xxx` para mostrar las notas creadas)
- Conectar formularios para que efectivamente envíen email vía Resend o SMTP (ahora se loggean en Supabase pero no llega email)

Cuando quieras seguimos con esa parte. Por ahora el cliente ya puede gestionar settings + crear notas, y todas las consultas quedan registradas en Supabase para que las vea desde el panel.
